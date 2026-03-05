// services/collaboration/contractService.js
const {
  sequelize,
  Collaboration,
  CollaborationContract,
  CollaborationTask,
  ChatRoom,
  ChatParticipant,
} = require('../../models');
const AppError = require('../../utils/AppError');

const CONTRACT_STATUSES = {
  DRAFT:  'draft',
  SENT:   'sent',
  SIGNED: 'signed',
};

// FIX: these are YOUR original ENUM values from your models — kept exactly as-is
const COLLAB_STATUSES = {
  PENDING_CONTRACT_SIGN: 'PendingContractSign',
  LIVE:                  'live',
  IN_PROGRESS:           'InProgress',
  COMPLETED:             'completed',
  CANCELLED:             'cancelled',
};

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

async function createContract({ collaborationId, ownerId, agreedPrice, startDate, endDate, deliverables }) {
  if (!collaborationId) throw new AppError('collaborationId is required', 400);
  if (!agreedPrice)     throw new AppError('agreedPrice is required', 400);
  if (!Array.isArray(deliverables) || deliverables.length === 0) {
    throw new AppError('deliverables must be a non-empty array', 400);
  }

  const collaboration = await Collaboration.findByPk(collaborationId, {
    include: [{ model: CollaborationContract, as: 'contract' }],
  });
  if (!collaboration) throw new AppError('Collaboration not found', 404);

  ensureIsOwner(collaboration, ownerId);
  ensureCollabStatus(collaboration, COLLAB_STATUSES.PENDING_CONTRACT_SIGN);

  // FIX: use the hasOne association to check, not contractId (column removed)
  if (collaboration.contract) {
    throw new AppError('A contract already exists for this collaboration', 400);
  }

  const contract = await CollaborationContract.create({
    collaborationId: collaboration.id,
    agreedPrice,
    startDate:   startDate || null,
    endDate:     endDate   || null,
    deliverables,
    status:      CONTRACT_STATUSES.DRAFT,
    contractRef: generateContractRef(),
  });

  return contract;
}

// ─── updateContract ───────────────────────────────────────────────────────────
// Owner can edit a draft contract before sending

async function updateContract({ contractId, ownerId, updates }) {
  const contract = await CollaborationContract.findByPk(contractId, {
    include: [{ model: Collaboration, as: 'collaboration' }],
  });
  if (!contract) throw new AppError('Contract not found', 404);

  const { collaboration } = contract;
  if (!collaboration) throw new AppError('Contract is not linked to a collaboration', 400);

  ensureIsOwner(collaboration, ownerId);

  if (contract.status !== CONTRACT_STATUSES.DRAFT) {
    throw new AppError('Only draft contracts can be updated', 400);
  }

  const allowedFields = ['agreedPrice', 'deliverables', 'startDate', 'endDate'];
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      contract[field] = updates[field];
    }
  }

  // Validate deliverables if it was updated
  if (
    Object.prototype.hasOwnProperty.call(updates, 'deliverables') &&
    (!Array.isArray(contract.deliverables) || contract.deliverables.length === 0)
  ) {
    throw new AppError('deliverables must be a non-empty array', 400);
  }

  await contract.save();
  return contract;
}

// ─── sendContract ─────────────────────────────────────────────────────────────
// Owner sends the draft to the influencer for signing

async function sendContract({ contractId, ownerId }) {
  const contract = await CollaborationContract.findByPk(contractId, {
    include: [{ model: Collaboration, as: 'collaboration' }],
  });
  if (!contract) throw new AppError('Contract not found', 404);

  const { collaboration } = contract;
  if (!collaboration) throw new AppError('Contract is not linked to a collaboration', 400);

  ensureIsOwner(collaboration, ownerId);
  ensureCollabStatus(collaboration, COLLAB_STATUSES.PENDING_CONTRACT_SIGN);

  if (contract.status !== CONTRACT_STATUSES.DRAFT) {
    throw new AppError('Only draft contracts can be sent', 400);
  }

  // FIX: removed collaboration.contractId = contract.id (column no longer exists)
  contract.status = CONTRACT_STATUSES.SENT;
  await contract.save();

  return contract;
}

// ─── signContract ─────────────────────────────────────────────────────────────
// Influencer signs → contract becomes signed → tasks auto-created → chat room opened

async function signContract({ contractId, influencerId }) {
  return sequelize.transaction(async (t) => {
    const contract = await CollaborationContract.findByPk(contractId, {
      include: [{ model: Collaboration, as: 'collaboration' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!contract) throw new AppError('Contract not found', 404);

    const { collaboration } = contract;
    if (!collaboration) throw new AppError('Contract is not linked to a collaboration', 400);

    ensureIsInfluencer(collaboration, influencerId);

    if (contract.status !== CONTRACT_STATUSES.SENT) {
      throw new AppError('Only sent contracts can be signed', 400);
    }

    // Sign the contract
    contract.status = CONTRACT_STATUSES.SIGNED;
    await contract.save({ transaction: t });

    // Move collaboration forward
    // FIX: removed collaboration.contractId (column removed)
    collaboration.status    = COLLAB_STATUSES.LIVE;
    collaboration.startDate = contract.startDate || null;
    collaboration.endDate   = contract.endDate   || null;
    await collaboration.save({ transaction: t });

    // ── Auto-create tasks from deliverables ───────────────────────────────────
    const deliverables = Array.isArray(contract.deliverables) ? contract.deliverables : [];
    let createdTasks = [];

    if (deliverables.length > 0) {
      // Deduplicate: don't create a task that already exists (idempotent)
      const existingTasks = await CollaborationTask.findAll({
        where: { collaborationId: collaboration.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const existingKeys = new Set(
        existingTasks.map(task => {
          const due = task.dueDate ? new Date(task.dueDate).toISOString() : '';
          return `${task.taskName}|${due}`;
        })
      );

      const tasksToCreate = [];
      deliverables.forEach((d, index) => {
        if (!d || !d.title) return;
        const due = d.dueDate ? new Date(d.dueDate).toISOString() : '';
        const key = `${d.title}|${due}`;
        if (existingKeys.has(key)) return;

        tasksToCreate.push({
          collaborationId: collaboration.id,
          // FIX: removed influencerId (column removed from CollaborationTask)
          taskName:    d.title,
          description: d.description   || null,
          platform:    d.platform      || null,
          contentType: d.contentType   || null,
          dueDate:     d.dueDate ? new Date(d.dueDate) : null,
          sortOrder:   index,
          status:      'todo',
        });
      });

      if (tasksToCreate.length > 0) {
        createdTasks = await CollaborationTask.bulkCreate(tasksToCreate, { transaction: t });
      }
    }

    // ── Create chat room + add both participants ───────────────────────────────
    let chatRoom = await ChatRoom.findOne({
      where: { collaborationId: collaboration.id },
      transaction: t,
    });

    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        collaborationId: collaboration.id,
        type: 'one_to_one',
        name: `Collaboration #${collaboration.id}`,
      }, { transaction: t });

      await ChatParticipant.bulkCreate([
        { chatRoomId: chatRoom.id, userId: collaboration.ownerId,      role: 'owner'      },
        { chatRoomId: chatRoom.id, userId: collaboration.influencerId, role: 'influencer' },
      ], { transaction: t });
    }


    return { contract, collaboration, chatRoom, tasks: createdTasks };
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateContractRef() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `CONT-${year}-${rand}`;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  CONTRACT_STATUSES,
  COLLAB_STATUSES,   // single source of truth — import this everywhere
  createContract,
  updateContract,
  sendContract,
  signContract,
  getContractByCollaboration,
};