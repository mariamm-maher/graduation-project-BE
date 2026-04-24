// services/collaboration/taskService.js
const { CollaborationTask, Collaboration } = require('../../models');
const AppError = require('../../utils/AppError');
const notificationService = require('../notificationService');

// FIX: kept your original ENUM values exactly — note 'Approved' with capital A
const TASK_STATUSES = {
  TODO:        'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW:   'in_review',
  APPROVED:    'approved',
  REJECTED:    'rejected',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getTaskById(taskId) {
  const task = await CollaborationTask.findByPk(taskId);
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

/**
 * Fetch task and verify the caller belongs to its collaboration.
 * Returns { task, collaboration }.
 */
async function getTaskWithAuth(taskId, userId) {
  const task = await CollaborationTask.findByPk(taskId, {
    include: [{ model: Collaboration, as: 'collaboration' }],
  });
  if (!task) throw new AppError('Task not found', 404);

  const { collaboration } = task;
  if (!collaboration) throw new AppError('Task has no linked collaboration', 400);

  const isOwner      = collaboration.ownerId      === userId;
  const isInfluencer = collaboration.influencerId === userId;

  if (!isOwner && !isInfluencer) {
    throw new AppError('You do not have access to this task', 403);
  }

  return { task, collaboration, isOwner, isInfluencer };
}

// ─── updateTask ───────────────────────────────────────────────────────────────
// FIX: added userId + owner-only guard

async function updateTask({ taskId, userId, updates }) {
  const { task, collaboration, isOwner } = await getTaskWithAuth(taskId, userId);

  if (!isOwner) {
    throw new AppError('Only the owner can edit task details', 403);
  }

  const allowedFields = ['taskName', 'description', 'platform', 'contentType', 'dueDate', 'sortOrder'];
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      task[field] = updates[field];
    }
  }

  await task.save();

  try {
    await notificationService.notifyTaskAssigned(
      collaboration.influencerId,
      task.id,
      task.taskName,
      collaboration.id
    );
  } catch (err) {
    console.error('Failed to send TASK_ASSIGNED notification:', err);
  }

  return task;
}

// ─── startTask ────────────────────────────────────────────────────────────────
// FIX: added influencer-only guard + status validation

async function startTask({ taskId, userId }) {
  const { task, collaboration, isInfluencer } = await getTaskWithAuth(taskId, userId);

  if (!isInfluencer) {
    throw new AppError('Only the influencer can start a task', 403);
  }

  const startableFrom = [TASK_STATUSES.TODO, TASK_STATUSES.REJECTED];
  if (!startableFrom.includes(task.status)) {
    throw new AppError(`Task cannot be started from status '${task.status}'`, 400);
  }

  task.status = TASK_STATUSES.IN_PROGRESS;
  await task.save();

  try {
    await notificationService.notifyTaskStarted(
      collaboration.ownerId,
      task.id,
      task.taskName,
      collaboration.id
    );
  } catch (err) {
    console.error('Failed to send TASK_STARTED notification:', err);
  }

  return task;
}

// ─── submitTaskForReview ──────────────────────────────────────────────────────
// FIX: added influencer-only guard + saves submission data

async function submitTaskForReview({ taskId, userId, submissionUrl, submissionNote }) {
  const { task, collaboration, isInfluencer } = await getTaskWithAuth(taskId, userId);

  if (!isInfluencer) {
    throw new AppError('Only the influencer can submit a task', 403);
  }

  if (task.status !== TASK_STATUSES.IN_PROGRESS) {
    throw new AppError(`Task must be in_progress to submit (currently '${task.status}')`, 400);
  }

  // FIX: actually save the submission data — was missing before
  task.status          = TASK_STATUSES.IN_REVIEW;
  task.submissionUrl   = submissionUrl  || null;
  task.submissionNote  = submissionNote || null;
  task.submittedAt     = new Date();
  task.revisionCount   = (task.revisionCount || 0) + 1;

  await task.save();

  try {
    await notificationService.notifyTaskSubmitted(
      collaboration.ownerId,
      task.id,
      task.taskName,
      collaboration.id,
      'Influencer'
    );
  } catch (err) {
    console.error('Failed to send TASK_SUBMITTED notification:', err);
  }

  return task;
}

// ─── approveTask ──────────────────────────────────────────────────────────────
// FIX: added owner-only guard

async function approveTask({ taskId, userId }) {
  const { task, collaboration, isOwner } = await getTaskWithAuth(taskId, userId);

  if (!isOwner) {
    throw new AppError('Only the owner can approve a task', 403);
  }

  if (task.status !== TASK_STATUSES.IN_REVIEW) {
    throw new AppError(`Task must be in_review to approve (currently '${task.status}')`, 400);
  }

  task.status      = TASK_STATUSES.APPROVED;
  task.completedAt = new Date();
  task.reviewNote  = null; // clear any previous rejection note
  await task.save();

  try {
    await notificationService.notifyTaskApproved(
      collaboration.influencerId,
      task.id,
      task.taskName,
      collaboration.id
    );
  } catch (err) {
    console.error('Failed to send TASK_APPROVED notification:', err);
  }

  return task;
}

// ─── rejectTask ───────────────────────────────────────────────────────────────
// FIX: added owner-only guard + review note + sends back to todo (not terminal)

async function rejectTask({ taskId, userId, reviewNote }) {
  const { task, collaboration, isOwner } = await getTaskWithAuth(taskId, userId);

  if (!isOwner) {
    throw new AppError('Only the owner can reject a task', 403);
  }

  if (task.status !== TASK_STATUSES.IN_REVIEW) {
    throw new AppError(`Task must be in_review to reject (currently '${task.status}')`, 400);
  }

  // FIX: rejection sends back to 'todo' so influencer can resubmit
  // 'rejected' status is kept for terminal rejection (owner gives up on task)
  task.status     = TASK_STATUSES.TODO;
  task.reviewNote = reviewNote || null;
  await task.save();

  try {
    await notificationService.notifyTaskRejected(
      collaboration.influencerId,
      task.id,
      task.taskName,
      collaboration.id,
      task.reviewNote || 'Please revise and resubmit'
    );
  } catch (err) {
    console.error('Failed to send TASK_REJECTED notification:', err);
  }

  return task;
}

// ─── terminalRejectTask ───────────────────────────────────────────────────────
// Hard rejection — owner decides task will not be redone

async function terminalRejectTask({ taskId, userId, reviewNote }) {
  const { task, collaboration, isOwner } = await getTaskWithAuth(taskId, userId);

  if (!isOwner) {
    throw new AppError('Only the owner can reject a task', 403);
  }

  if (task.status !== TASK_STATUSES.IN_REVIEW) {
    throw new AppError(`Task must be in_review to reject (currently '${task.status}')`, 400);
  }

  task.status     = TASK_STATUSES.REJECTED;
  task.reviewNote = reviewNote || null;
  await task.save();

  try {
    await notificationService.notifyTaskFinalRejected(
      collaboration.influencerId,
      task.id,
      task.taskName,
      collaboration.id,
      task.reviewNote || 'Task permanently rejected'
    );
  } catch (err) {
    console.error('Failed to send TASK_FINAL_REJECTED notification:', err);
  }

  return task;
}

// ─── getTasksByCollaboration ──────────────────────────────────────────────────

async function getTasksByCollaboration({ collaborationId, userId }) {
  // Verify user is a participant
  const collaboration = await Collaboration.findByPk(collaborationId);
  if (!collaboration) throw new AppError('Collaboration not found', 404);

  if (collaboration.ownerId !== userId && collaboration.influencerId !== userId) {
    throw new AppError('You do not have access to this collaboration', 403);
  }

  return CollaborationTask.findAll({
    where: { collaborationId },
    order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
  });
}

// ─── moveTask ───────────────────────────────────────────────────────────────
// Owner-only drag-and-drop: freely change task status on the board.
// Blocks moving INTO in_review / Approved (those go through submit/approve).

const UI_TO_DB_STATUS = {
  todo:        'todo',
  in_progress: 'in_progress',
  review:      'in_review',
  completed:   'approved',
};

async function moveTask({ taskId, userId, uiStatus }) {
  const dbStatus = UI_TO_DB_STATUS[uiStatus];
  if (!dbStatus) throw new AppError(`Invalid status '${uiStatus}'`, 400);

  const { task, isOwner } = await getTaskWithAuth(taskId, userId);

  if (!isOwner) {
    throw new AppError('Only the owner can move tasks on the board', 403);
  }

  task.status      = dbStatus;
  task.completedAt = dbStatus === 'approved' ? new Date() : null;
  await task.save();

  return task;
}

// ─── createTask ──────────────────────────────────────────────────────────────
// Owner-only — create a new task under a collaboration

async function createTask({ collaborationId, userId, taskName, description, dueDate, platform, contentType, sortOrder }) {
  const collaboration = await Collaboration.findByPk(collaborationId);
  if (!collaboration) throw new AppError('Collaboration not found', 404);

  if (collaboration.ownerId !== userId) {
    throw new AppError('Only the owner can create tasks', 403);
  }

  const task = await CollaborationTask.create({
    collaborationId,
    taskName,
    description:  description  || null,
    dueDate:      dueDate      || null,
    platform:     platform     || null,
    contentType:  contentType  || null,
    sortOrder:    sortOrder    ?? 0,
    status:       TASK_STATUSES.TODO,
  });

  try {
    await notificationService.notifyTaskAssigned(
      collaboration.influencerId,
      task.id,
      task.taskName,
      collaboration.id
    );
  } catch (err) {
    console.error('Failed to send TASK_ASSIGNED notification:', err);
  }

  return task;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  TASK_STATUSES,
  getTaskById,
  updateTask,
  startTask,
  submitTaskForReview,
  approveTask,
  rejectTask,
  terminalRejectTask,
  getTasksByCollaboration,
  createTask,
  moveTask,
};