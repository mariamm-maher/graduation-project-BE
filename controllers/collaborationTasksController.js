// controllers/collaborationTaskController.js
const taskService = require('../services/collaboration/tasksService');
const sendSuccess = require('../utils/sendSuccess');

// GET /api/collaborations/:collaborationId/tasks
// Role: Owner or Influencer — list all tasks on the board
exports.getTasksByCollaboration = async (req, res, next) => {
  try {
    const tasks = await taskService.getTasksByCollaboration({
      collaborationId: req.params.collaborationId,
      userId:          req.user.id,
    });
    sendSuccess(res, 200, 'Tasks', { tasks });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
// Role: Owner or Influencer
exports.getById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    sendSuccess(res, 200, 'Task', { task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id
// Role: Owner — edit task details (name, description, platform, dueDate etc.)
exports.updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask({
      taskId:  req.params.id,
      userId:  req.user.id,
      updates: req.body,
    });
    sendSuccess(res, 200, 'Task updated', { task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/start
// Role: Influencer — move task from todo → in_progress
exports.startTask = async (req, res, next) => {
  try {
    const task = await taskService.startTask({
      taskId: req.params.id,
      userId: req.user.id,
    });
    sendSuccess(res, 200, 'Task started', { task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/submit
// Role: Influencer — submit task for owner review
exports.submitTask = async (req, res, next) => {
  try {
    const { submissionUrl, submissionNote } = req.body;

    const task = await taskService.submitTaskForReview({
      taskId:         req.params.id,
      userId:         req.user.id,
      submissionUrl,
      submissionNote,
    });
    sendSuccess(res, 200, 'Task submitted for review', { task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/approve
// Role: Owner — approve a submitted task
exports.approveTask = async (req, res, next) => {
  try {
    const task = await taskService.approveTask({
      taskId: req.params.id,
      userId: req.user.id,
    });
    sendSuccess(res, 200, 'Task approved', { task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/reject
// Role: Owner — reject task and send back to influencer for resubmission
exports.rejectTask = async (req, res, next) => {
  try {
    const { reviewNote } = req.body;

    const task = await taskService.rejectTask({
      taskId:     req.params.id,
      userId:     req.user.id,
      reviewNote,
    });
    sendSuccess(res, 200, 'Task sent back for revision', { task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/reject-final
// Role: Owner — permanently reject a task (no resubmission)
exports.terminalRejectTask = async (req, res, next) => {
  try {
    const { reviewNote } = req.body;

    const task = await taskService.terminalRejectTask({
      taskId:     req.params.id,
      userId:     req.user.id,
      reviewNote,
    });
    sendSuccess(res, 200, 'Task permanently rejected', { task });
  } catch (err) {
    next(err);
  }
};