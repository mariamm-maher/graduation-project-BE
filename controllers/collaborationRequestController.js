// controllers/collaborationRequestController.js
const requestService = require('../services/collaboration/collaborationRequestService');
const notificationService = require('../services/notificationService');
const Campaign = require('../models/Campaign');
const sendSuccess    = require('../utils/sendSuccess');
const AppError       = require('../utils/AppError');

const INVALID_CAMPAIGN_STAGES = ['draft', 'cancelled'];

// POST /api/collaboration-requests
// Role: Owner — send a request to an influencer
exports.invite = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { campaignId, influencerId, proposedBudget, message, expiresAt } = req.body;

    // Validate campaign exists and is in an invitable lifecycle stage
    let campaign = null;
    if (campaignId) {
      campaign = await Campaign.findByPk(campaignId, {
        attributes: ['id', 'campaignName', 'lifecycleStage', 'userId'],
      });

      if (!campaign) {
        return next(new AppError('Campaign not found.', 404));
      }

      if (campaign.userId !== ownerId) {
        return next(new AppError('You do not own this campaign.', 403));
      }

      if (INVALID_CAMPAIGN_STAGES.includes(campaign.lifecycleStage)) {
        return next(
          new AppError(
            `Cannot invite influencers to a campaign that is "${campaign.lifecycleStage}". ` +
            `Only active campaigns (ai_generated, saved, completed) are allowed.`,
            422
          )
        );
      }
    }

    const request = await requestService.invite({
      ownerId,
      campaignId,
      influencerId,
      proposedBudget,
      message,
      expiresAt,
    });

    try {
      const campaignName = campaign?.campaignName ?? 'a campaign';

      await notificationService.notifyCollaborationRequest(
        influencerId,
        ownerId,
        request.id,
        campaignName
      );
    } catch (notifErr) {
      console.error('Failed to send notification for collaboration request:', notifErr);
    }

    sendSuccess(res, 201, 'Collaboration request sent', { request });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/collaboration-requests/:id/respond
// Role: Influencer (pending) or Owner (negotiating)
exports.respond = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    // FIX: was passing 'message' but service expects 'responseMessage'
    const { action, newBudget, responseMessage } = req.body;

    const result = await requestService.respond({
      requestId: req.params.id,
      actorId,
      action,
      newBudget,
      responseMessage,
    });

    sendSuccess(res, 200, 'Request updated', result);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/collaboration-requests/:id/cancel
// Role: Owner only
exports.cancel = async (req, res, next) => {
  try {
    const request = await requestService.cancel({
      requestId: req.params.id,
      ownerId: req.user.id,
    });
    sendSuccess(res, 200, 'Request cancelled', { request });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaboration-requests/:id
// Role: Owner or Influencer of this request
exports.getById = async (req, res, next) => {
  try {
    const request = await requestService.getById(req.params.id);
    sendSuccess(res, 200, 'Collaboration request', { request });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaboration-requests?campaignId=&status=
// Role: Owner — see requests for a campaign
exports.listByCampaign = async (req, res, next) => {
  try {
    const { campaignId, status } = req.query;
    const requests = await requestService.listByCampaign({ campaignId, status });
    sendSuccess(res, 200, 'Collaboration requests', { requests });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaboration-requests/mine/sent?status=
// Role: Owner — all requests they sent
exports.listMySent = async (req, res, next) => {
  try {
    const requests = await requestService.listByOwner({
      ownerId: req.user.id,
      status:  req.query.status,
    });
    sendSuccess(res, 200, 'Sent requests', { requests });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaboration-requests/mine/received?status=
// Role: Influencer — all requests they received
exports.listMyReceived = async (req, res, next) => {
  try {
    const requests = await requestService.listByInfluencer({
      influencerId: req.user.id,
      status:       req.query.status,
    });
    sendSuccess(res, 200, 'Received requests', { requests });
  } catch (err) {
    next(err);
  }
};