// services/collaboration/collaborationService.js
const { Collaboration, CollaborationRequest, CollaborationTask, Campaign, User, InfluencerProfile, OwnerProfile } = require('../../models');
const AppError = require('../../utils/AppError');
const { Op } = require('sequelize');

// FIX: import from contractService — single source of truth, no duplication
const { COLLAB_STATUSES } = require('./contractService');

const VALID_TRANSITIONS = {
  [COLLAB_STATUSES.PENDING_CONTRACT_SIGN]: new Set([COLLAB_STATUSES.LIVE, COLLAB_STATUSES.CANCELLED]),
  [COLLAB_STATUSES.LIVE]:                  new Set([COLLAB_STATUSES.IN_PROGRESS, COLLAB_STATUSES.CANCELLED]),
  [COLLAB_STATUSES.IN_PROGRESS]:           new Set([COLLAB_STATUSES.COMPLETED, COLLAB_STATUSES.CANCELLED]),
  [COLLAB_STATUSES.COMPLETED]:             new Set(),
  [COLLAB_STATUSES.CANCELLED]:             new Set(),
};

function assertCollabTransition(current, next) {
  const allowed = VALID_TRANSITIONS[current] || new Set();
  if (!allowed.has(next)) {
    throw new AppError(`Invalid collaboration state: ${current} → ${next}`, 400);
  }
}

// ─── getCollaborationById ─────────────────────────────────────────────────────

async function getCollaborationById(id) {
  const collab = await Collaboration.findByPk(id);
  if (!collab) throw new AppError('Collaboration not found', 404);
  return collab;
}

// ─── getCollaborationWithRequest ──────────────────────────────────────────────

async function getCollaborationWithRequest(id) {
  const collab = await Collaboration.findByPk(id, {
    include: [{ model: CollaborationRequest, as: 'request' }],
  });
  if (!collab) throw new AppError('Collaboration not found', 404);

  // FIX: was checking 'Accepted' (capital A) — your ENUM value is 'accepted' (lowercase)
  if (!collab.request || collab.request.status !== 'accepted') {
    throw new AppError('Collaboration must have an accepted request', 400);
  }
  return collab;
}

// ─── cancelCollaboration ─────────────────────────────────────────────────────
// FIX: owner can cancel from any non-terminal status, not just PendingContractSign

async function cancelCollaboration({ collaborationId, userId }) {
  const collab = await getCollaborationById(collaborationId);

  if (collab.ownerId !== userId) {
    throw new AppError('Only the owner can cancel a collaboration', 403);
  }

  assertCollabTransition(collab.status, COLLAB_STATUSES.CANCELLED);

  collab.status      = COLLAB_STATUSES.CANCELLED;
  collab.cancelledAt = new Date();
  await collab.save();
  return collab;
}

// ─── getCollaborationTasks ────────────────────────────────────────────────────

async function getCollaborationTasks(collaborationId) {
  return CollaborationTask.findAll({
    where: { collaborationId },
    order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
  });
}

// ─── completeCollaboration ────────────────────────────────────────────────────

async function completeCollaboration({ collaborationId, userId }) {
  const collab = await getCollaborationById(collaborationId);

  if (collab.ownerId !== userId) {
    throw new AppError('Only the owner can mark a collaboration as completed', 403);
  }

  assertCollabTransition(collab.status, COLLAB_STATUSES.COMPLETED);

  // FIX: check against 'Approved' — your actual task ENUM value (not 'completed')
  const tasks = await getCollaborationTasks(collaborationId);
  if (tasks.length === 0) {
    throw new AppError('No tasks found for this collaboration', 400);
  }
  const allApproved = tasks.every(task => task.status === 'Approved');
  if (!allApproved) {
    throw new AppError('All tasks must be approved before completing the collaboration', 400);
  }

  collab.status      = COLLAB_STATUSES.COMPLETED;
  collab.completedAt = new Date();
  await collab.save();
  return collab;
}

// ─── listCollaborations ───────────────────────────────────────────────────────

async function listByOwner({ ownerId, status }) {
  const where = { ownerId };
  if (status) where.status = status;
  
  const collabs = await Collaboration.findAll({ 
    where, 
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Campaign,
        as: 'campaign',
        attributes: ['id', 'campaignName', 'campaign_goal', 'budget_amount', 'budget_currency', 'campaign_duration_weeks', 'lifecycleStage', 'createdAt']
      },
      {
        model: User,
        as: 'influencer',
        attributes: ['id', 'firstName', 'lastName'],
      }
    ]
  });

  return collabs.map(formatCollabData);
}

async function listByInfluencer({ influencerId, status }) {
  const where = { influencerId };
  if (status) where.status = status;
  
  const collabs = await Collaboration.findAll({ 
    where, 
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Campaign,
        as: 'campaign',
        attributes: ['id', 'campaignName', 'campaign_goal', 'budget_amount', 'budget_currency', 'campaign_duration_weeks', 'lifecycleStage', 'createdAt']
      },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName'],
        include: [{
          model: OwnerProfile,
          as: 'ownerProfile',
          attributes: ['businessName']
        }]
      }
    ]
  });

  return collabs.map(formatCollabData);
}

async function getCollaborationOverviewForUser(userId) {
  const where = {
    [Op.or]: [
      { ownerId: userId },
      { influencerId: userId }
    ]
  };

  const [totalCollaborations, groupedCounts] = await Promise.all([
    Collaboration.count({ where }),
    Collaboration.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where,
      group: ['status'],
      raw: true
    })
  ]);

  const countsByStatus = groupedCounts.reduce((acc, item) => {
    acc[item.status] = Number(item.count) || 0;
    return acc;
  }, {});

  return {
    totalCollaborations,
    liveCollab: countsByStatus.live || 0,
    completedCollabs: countsByStatus.completed || 0,
    pending_contract_signCollab: countsByStatus.pending_contract_sign || 0,
    in_progressCollab: countsByStatus.in_progress || 0,
    cancelledCollab: countsByStatus.cancelled || 0
  };
}

// Helper to format the return data including a calculated duration
function formatCollabData(collab) {
  const data = collab.toJSON ? collab.toJSON() : collab;
  
  if (data.campaign) {
    data.campaign.duration = data.campaign.campaign_duration_weeks
      ? Number(data.campaign.campaign_duration_weeks) * 7
      : null;
  }
  
  // Ensure status is present (from model)
  data.status = data.status || collab.status || null;

  // Add contact info for both parties (owner and influencer)
  data.contacts = {
    owner: null,
    influencer: null
  };

  if (data.owner) {
    data.contacts.owner = {
      id: data.owner.id,
      firstName: data.owner.firstName,
      lastName: data.owner.lastName,
      name: `${data.owner.firstName || ''} ${data.owner.lastName || ''}`.trim(),
      email: data.owner.email || null,
      businessName: data.owner.ownerProfile && data.owner.ownerProfile.businessName ? data.owner.ownerProfile.businessName : null
    };
  }

  if (data.influencer) {
    data.contacts.influencer = {
      id: data.influencer.id,
      firstName: data.influencer.firstName,
      lastName: data.influencer.lastName,
      name: `${data.influencer.firstName || ''} ${data.influencer.lastName || ''}`.trim(),
      email: data.influencer.email || null
    };
  }

  return data;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getCollaborationById,
  getCollaborationWithRequest,
  cancelCollaboration,
  getCollaborationTasks,
  completeCollaboration,
  listByOwner,
  listByInfluencer,
  getCollaborationOverviewForUser,
};