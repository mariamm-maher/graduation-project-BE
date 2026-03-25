// controllers/collaborationController.js
const collaborationService = require('../services/collaboration/collaborationService');
const sendSuccess          = require('../utils/sendSuccess');

// GET /api/collaborations/:id
// Role: Owner or Influencer
exports.getById = async (req, res, next) => {
  try {
    const collab = await collaborationService.getCollaborationById(req.params.id);
    sendSuccess(res, 200, 'Collaboration', { collaboration: collab });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaborations/mine/owner?status=
// Role: Owner — all collaborations where they are the brand
exports.listMyOwner = async (req, res, next) => {
  try {
    const collaborations = await collaborationService.listByOwner({
      ownerId: req.user.id,
      status:  req.query.status,
    });
    sendSuccess(res, 200, 'My collaborations (as owner)', { collaborations });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaborations/mine/influencer?status=
// Role: Influencer — all collaborations where they are the influencer
exports.listMyInfluencer = async (req, res, next) => {
  try {
    const collaborations = await collaborationService.listByInfluencer({
      influencerId: req.user.id,
      status:       req.query.status,
    });
    sendSuccess(res, 200, 'My collaborations (as influencer)', { collaborations });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/collaborations/:id/cancel
// Role: Owner
exports.cancel = async (req, res, next) => {
  try {
    const collab = await collaborationService.cancelCollaboration({
      collaborationId: req.params.id,
      userId:          req.user.id,
    });
    sendSuccess(res, 200, 'Collaboration cancelled', { collaboration: collab });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/collaborations/:id/complete
// Role: Owner — mark as completed (all tasks must be approved first)
exports.complete = async (req, res, next) => {
  try {
    const collab = await collaborationService.completeCollaboration({
      collaborationId: req.params.id,
      userId:          req.user.id,
    });
    sendSuccess(res, 200, 'Collaboration completed', { collaboration: collab });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaborations/:id/tasks
// Role: Owner or Influencer — get the task board
exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await collaborationService.getCollaborationTasks(req.params.id);
    sendSuccess(res, 200, 'Collaboration tasks', { tasks });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaborations/overview
// Role: Authenticated user — all collaborations where user is owner or influencer
exports.getOverview = async (req, res, next) => {
  try {
    const overview = await collaborationService.getCollaborationOverviewForUser(req.user.id);
    sendSuccess(res, 200, 'Collaboration overview', { overview });
  } catch (err) {
    next(err);
  }
};