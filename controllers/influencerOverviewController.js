const influencerOverviewService = require('../services/influencerOverviewService');
const sendSuccess = require('../utils/sendSuccess');

exports.getInfluencerOverview = async (req, res, next) => {
  try {
    const influencerId = req.user?.id;
    const overview = await influencerOverviewService.getInfluencerOverview(influencerId, req.query || {});

    return sendSuccess(res, 200, 'Influencer dashboard overview retrieved successfully', overview);
  } catch (error) {
    return next(error);
  }
};
