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

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function toDateOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function diffDays(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / DAY_IN_MS));
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

// ─── getCollaborationById ─────────────────────────────────────────────────────

async function getCollaborationById(id) {
  const collab = await Collaboration.findByPk(id, {
    include: [
      {
        model: Campaign,
        as: 'campaign',
        attributes: ['id', 'campaignName', 'startDate', 'endDate', 'isPublished']
      },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: User,
        as: 'influencer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: CollaborationRequest,
        as: 'request',
        attributes: ['id', 'status', 'message']
      },
      {
        model: CollaborationTask,
        as: 'tasks',
        attributes: ['id', 'taskName', 'status', 'dueDate']
      }
    ],
    order: [[{ model: CollaborationTask, as: 'tasks' }, 'createdAt', 'ASC']]
  });

  if (!collab) throw new AppError('Collaboration not found', 404);

  const startDate = toDateOrNull(collab.startDate);
  const endDate = toDateOrNull(collab.endDate);
  const today = new Date();

  const totalDays = diffDays(startDate, endDate);
  const elapsedDaysRaw = startDate ? diffDays(startDate, today) : 0;
  const elapsedDays = totalDays > 0 ? clamp(elapsedDaysRaw, 0, totalDays) : elapsedDaysRaw;
  const remainingDays = totalDays > 0 ? Math.max(0, totalDays - elapsedDays) : 0;
  const durationProgressPercent = totalDays > 0
    ? Math.round((elapsedDays / totalDays) * 100)
    : 0;

  const tasks = Array.isArray(collab.tasks)
    ? collab.tasks.map((task) => {
        const data = task && typeof task.toJSON === 'function' ? task.toJSON() : task;
        return {
          id: data.id,
          title: data.taskName,
          status: data.status,
          dueDate: data.dueDate
        };
      })
    : [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => String(task.status || '').toLowerCase() === 'approved').length;
  const pendingTasks = tasks.filter((task) => String(task.status || '').toLowerCase() !== 'approved').length;
  const taskProgressPercent = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const isOverdue = Boolean(endDate && today > endDate && collab.status !== 'completed');
  const isActive = Boolean(startDate && endDate && today >= startDate && today <= endDate);

  let statusLabel = 'Pending';
  if (collab.status === 'cancelled') statusLabel = 'Cancelled';
  else if (collab.status === 'completed') statusLabel = 'Completed';
  else if (isOverdue) statusLabel = 'Overdue';
  else if (isActive) statusLabel = 'Active';

  return {
    id: collab.id,
    status: collab.status,
    timeline: {
      startDate: collab.startDate,
      endDate: collab.endDate,
      completedAt: collab.completedAt,
      cancelledAt: collab.cancelledAt
    },
    campaign: collab.campaign
      ? {
          id: collab.campaign.id,
          name: collab.campaign.campaignName,
          startDate: collab.campaign.startDate,
          endDate: collab.campaign.endDate,
          isPublished: collab.campaign.isPublished
        }
      : null,
    participants: {
      owner: collab.owner
        ? {
            id: collab.owner.id,
            name: `${collab.owner.firstName || ''} ${collab.owner.lastName || ''}`.trim(),
            email: collab.owner.email
          }
        : null,
      influencer: collab.influencer
        ? {
            id: collab.influencer.id,
            name: `${collab.influencer.firstName || ''} ${collab.influencer.lastName || ''}`.trim(),
            email: collab.influencer.email
          }
        : null
    },
    request: collab.request || null,
    tasks,
    tracking: {
      duration: {
        totalDays,
        elapsedDays,
        remainingDays,
        progressPercent: clamp(durationProgressPercent, 0, 100)
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        progressPercent: clamp(taskProgressPercent, 0, 100)
      },
      health: {
        isOverdue,
        isActive,
        statusLabel
      }
    }
  };
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
      },
      {
        model: CollaborationRequest,
        as: 'request',
        attributes: ['id', 'proposedBudget', 'counterPrice', 'ownerId', 'influencerId', 'status']
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
          attributes: ['brand_name']
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
      businessName: data.owner.ownerProfile && data.owner.ownerProfile.brand_name ? data.owner.ownerProfile.brand_name : null
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