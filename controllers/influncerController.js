const influencerCampaignService = require('../services/influencerCampaignService');
const sendSuccess = require('../utils/sendSuccess');

exports.exploreCampaigns = async (req, res, next) => {
	try {
		const result = await influencerCampaignService.exploreCampaigns({
			influencerId: req.user.id,
			query: req.query
		});

		return sendSuccess(res, 200, 'Campaigns explored successfully', result);
	} catch (error) {
		return next(error);
	}
};

exports.getCampaignById = async (req, res, next) => {
	try {
		const result = await influencerCampaignService.getCampaignById({
			influencerId: req.user.id,
			campaignId: req.params.id
		});

		return sendSuccess(res, 200, 'Campaign retrieved successfully', result);
	} catch (error) {
		return next(error);
	}
};

exports.applyToCampaign = async (req, res, next) => {
	try {
		const result = await influencerCampaignService.applyToCampaign({
			influencerId: req.user.id,
			campaignId: req.params.id,
			payload: req.body
		});

		return sendSuccess(res, 201, 'Application submitted successfully', result);
	} catch (error) {
		return next(error);
	}
};

exports.getOverviewStats = async (req, res, next) => {
	try {
		const result = await influencerCampaignService.getOverviewStats({
			ownerId: req.user.id
		});

		return sendSuccess(res, 200, 'Influencer overview stats retrieved successfully', result);
	} catch (error) {
		return next(error);
	}
};
