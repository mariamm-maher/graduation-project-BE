const { CollaborationRequest, Campaign, User } = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');

/**
 * Owner sends a collaboration request to an influencer for a campaign
 * POST /api/collaborations
 * Body: { campaignId, influencerId, proposedBudget, message }
 */
exports.sendCollaborationRequest = async (req, res, next) => {
	try {
		const ownerId = req.user && req.user.id;
		const { campaignId, influencerId, proposedBudget, message } = req.body;

		if (!campaignId || !influencerId) {
			return next(new AppError('campaignId and influencerId are required', 400));
		}

		// Verify campaign exists and belongs to the authenticated owner
		const campaign = await Campaign.findByPk(campaignId);
		if (!campaign) {
			return next(new AppError('Campaign not found', 404));
		}
		if (campaign.userId !== ownerId) {
			return next(new AppError('You do not own this campaign', 403));
		}

		// Verify influencer exists
		const influencer = await User.findByPk(influencerId);
		if (!influencer) {
			return next(new AppError('Influencer not found', 404));
		}

		// Prevent duplicate pending requests for same campaign+influencer
		const existing = await CollaborationRequest.findOne({
			where: { campaignId, influencerId, status: 'pending' }
		});
		if (existing) {
			return next(new AppError('A pending request already exists for this influencer and campaign', 409));
		}

		const collabRequest = await CollaborationRequest.create({
			campaignId,
			influencerId,
			proposedBudget: proposedBudget || null,
			message: message || null,
			status: 'pending'
		});

		// Return created request (trimmed)
		sendSuccess(res, 201, 'Collaboration request created', {
			collaborationRequest: {
				id: collabRequest.id,
				campaignId: collabRequest.campaignId,
				influencerId: collabRequest.influencerId,
				proposedBudget: collabRequest.proposedBudget,
				message: collabRequest.message,
				status: collabRequest.status,
				createdAt: collabRequest.createdAt
			}
		});
	} catch (error) {
		next(error);
	}
};

