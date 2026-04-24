// services/collaboration/contractService.js
const {
  sequelize,
  Collaboration,
  CollaborationContract,
  ChatRoom,
  ChatParticipant,
  User,
} = require('../../models');
const AppError = require('../../utils/AppError');
const notificationService = require('../notificationService');

const CONTRACT_STATUSES = {
  SENT:   'sent',
  SIGNED: 'signed',
};

// FIX: these are YOUR original ENUM values from your models — kept exactly as-is
const COLLAB_STATUSES = {
  PENDING_CONTRACT_SIGN: 'pending_contract_sign',
  LIVE:                  'live',
  IN_PROGRESS:           'in_progress',
  COMPLETED:             'completed',
  CANCELLED:             'cancelled',
};

async function finalizeSignedContract({ contract, collaboration, transaction }) {
  contract.status = CONTRACT_STATUSES.SIGNED;
  await contract.save({ transaction });

  collaboration.status    = COLLAB_STATUSES.LIVE;
  collaboration.startDate = contract.startDate || null;
  collaboration.endDate   = contract.endDate   || null;
  await collaboration.save({ transaction });

  let chatRoom = await ChatRoom.findOne({
    where: { collaborationId: collaboration.id },
    transaction,
  });

  if (!chatRoom) {
    const [owner, influencer] = await Promise.all([
      User.findByPk(collaboration.ownerId, { attributes: ['firstName', 'lastName'], transaction }),
      User.findByPk(collaboration.influencerId, { attributes: ['firstName', 'lastName'], transaction }),
    ]);

    const ownerName = `${owner?.firstName || 'Owner'} ${owner?.lastName || ''}`.trim();
    const influencerName = `${influencer?.firstName || 'Influencer'} ${influencer?.lastName || ''}`.trim();

    chatRoom = await ChatRoom.create({
      collaborationId: collaboration.id,
      type: 'one_to_one',
      name: `${ownerName} collab with ${influencerName}`,
    }, { transaction });

    await ChatParticipant.bulkCreate([
      { chatRoomId: chatRoom.id, userId: collaboration.ownerId,      role: 'owner' },
      { chatRoomId: chatRoom.id, userId: collaboration.influencerId, role: 'influencer' },
    ], { transaction });
  }

  try {
    await notificationService.createBulkNotifications([
      {
        userId: collaboration.ownerId,
        type: 'CONTRACT_SIGNED',
        message: `Contract #${contract.id} has been fully signed`,
        entityType: 'CollaborationContract',
        entityId: contract.id,
        metadata: { collaborationId: collaboration.id },
        isRead: false
      },
      {
        userId: collaboration.influencerId,
        type: 'CONTRACT_SIGNED',
        message: `Contract #${contract.id} has been fully signed`,
        entityType: 'CollaborationContract',
        entityId: contract.id,
        metadata: { collaborationId: collaboration.id },
        isRead: false
      }
    ]);
  } catch (err) {
    console.error('Failed to send CONTRACT_SIGNED notifications:', err);
  }

  return { contract, collaboration, chatRoom };
}

// ─── Guards ───────────────────────────────────────────────────────────────────

function ensureIsOwner(collaboration, userId) {
  if (collaboration.ownerId !== userId) {
    throw new AppError('Only the brand (owner) can perform this action', 403);
  }
}

function ensureIsInfluencer(collaboration, userId) {
  if (collaboration.influencerId !== userId) {
    throw new AppError('Only the influencer can perform this action', 403);
  }
}

function ensureCollabStatus(collaboration, expectedStatus) {
  if (collaboration.status !== expectedStatus) {
    throw new AppError(
      `Collaboration must be in '${expectedStatus}' status (currently '${collaboration.status}')`,
      400
    );
  }
}

// ─── createContract ───────────────────────────────────────────────────────────
// Owner creates a draft contract for a collaboration that is PendingContractSign

async function createContract({ collaborationId, ownerId, startDate, endDate, deliverables }) {
  if (!collaborationId) throw new AppError('collaborationId is required', 400);
  if (!Array.isArray(deliverables) || deliverables.length === 0) {
    throw new AppError('deliverables must be a non-empty array', 400);
  }

  const { CollaborationRequest } = require('../../models');

  const collaboration = await Collaboration.findByPk(collaborationId, {
    include: [
      { model: CollaborationContract, as: 'contract' },
      { model: CollaborationRequest, as: 'request' }
    ],
  });
  if (!collaboration) throw new AppError('Collaboration not found', 404);

  ensureIsOwner(collaboration, ownerId);
  ensureCollabStatus(collaboration, COLLAB_STATUSES.PENDING_CONTRACT_SIGN);

  // FIX: use the hasOne association to check, not contractId (column removed)
  if (collaboration.contract) {
    throw new AppError('A contract already exists for this collaboration', 400);
  }

  // The agreed price comes entirely from what was accepted in the request phase
  const finalPrice = collaboration.request ? collaboration.request.proposedBudget : 0;

  if (!finalPrice || finalPrice <= 0) {
     throw new AppError('Cannot create a contract without a valid proposed budget from the request phase', 400);
  }

  const contract = await CollaborationContract.create({
    collaborationId: collaboration.id,
    agreedPrice: finalPrice,
    startDate:   startDate || null,
    endDate:     endDate   || null,
    deliverables,
    status:      CONTRACT_STATUSES.SENT,
  });

  try {
    await notificationService.createNotification({
      userId: ownerId,
      type: 'CONTRACT_CREATED',
      message: `Contract #${contract.id} was created`,
      entityType: 'CollaborationContract',
      entityId: contract.id,
      metadata: { collaborationId: collaboration.id }
    });

    await notificationService.createNotification({
      userId: collaboration.influencerId,
      type: 'CONTRACT_SENT',
      message: 'A contract has been sent to you for signature',
      entityType: 'CollaborationContract',
      entityId: contract.id,
      metadata: { collaborationId: collaboration.id }
    });
  } catch (err) {
    console.error('Failed to send contract creation/sent notifications:', err);
  }

  return contract;
}

async function getOwnerContracts(ownerId) {
  return CollaborationContract.findAll({
    include: [{ model: Collaboration, as: 'collaboration', where: { ownerId } }],
    order: [['createdAt', 'DESC']],
  });
}

async function getInfluencerContracts(influencerId) {
  return CollaborationContract.findAll({
    include: [{ model: Collaboration, as: 'collaboration', where: { influencerId } }],
    order: [['createdAt', 'DESC']],
  });
}

async function signByOwner({ contractId, ownerId }) {
  return sequelize.transaction(async (transaction) => {
    const contract = await CollaborationContract.findByPk(contractId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!contract) throw new AppError('Contract not found', 404);

    const collaboration = await Collaboration.findByPk(contract.collaborationId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!collaboration) throw new AppError('Contract is not linked to a collaboration', 400);

    ensureIsOwner(collaboration, ownerId);
    ensureCollabStatus(collaboration, COLLAB_STATUSES.PENDING_CONTRACT_SIGN);

    if (contract.status !== CONTRACT_STATUSES.SENT) {
      throw new AppError('Only sent contracts can be signed', 400);
    }

    contract.ownerSigned = true;
    contract.ownerSignedAt = new Date();
    await contract.save({ transaction });

    if (contract.influencerSigned) {
      return finalizeSignedContract({ contract, collaboration, transaction });
    }

    return { contract, collaboration };
  });
}

async function signByInfluencer({ contractId, influencerId }) {
  return sequelize.transaction(async (transaction) => {
    const contract = await CollaborationContract.findByPk(contractId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!contract) throw new AppError('Contract not found', 404);

    const collaboration = await Collaboration.findByPk(contract.collaborationId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!collaboration) throw new AppError('Contract is not linked to a collaboration', 400);

    ensureIsInfluencer(collaboration, influencerId);
    ensureCollabStatus(collaboration, COLLAB_STATUSES.PENDING_CONTRACT_SIGN);

    if (contract.status !== CONTRACT_STATUSES.SENT) {
      throw new AppError('Only sent contracts can be signed', 400);
    }

    contract.influencerSigned = true;
    contract.influencerSignedAt = new Date();
    await contract.save({ transaction });

    if (contract.ownerSigned) {
      return finalizeSignedContract({ contract, collaboration, transaction });
    }

    return { contract, collaboration };
  });
}

// ─── getContractByCollaboration ───────────────────────────────────────────────

async function getContractByCollaboration({ collaborationId, userId }) {
  const collaboration = await Collaboration.findByPk(collaborationId, {
    include: [{ model: CollaborationContract, as: 'contract' }],
  });
  if (!collaboration) throw new AppError('Collaboration not found', 404);

  if (collaboration.ownerId !== userId && collaboration.influencerId !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  if (!collaboration.contract) throw new AppError('No contract exists for this collaboration', 404);

  return collaboration.contract;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  CONTRACT_STATUSES,
  COLLAB_STATUSES,   // single source of truth — import this everywhere
  createContract,
  getOwnerContracts,
  getInfluencerContracts,
  signByOwner,
  signByInfluencer,
  getContractByCollaboration,
};