const ownerOverviewService = require('../services/ownerOverviewService');
const sendSuccess = require('../utils/sendSuccess');

exports.getOwnerOverview = async (req, res, next) => {
  try {
    const ownerId = req.user?.id;
    const dateRange = req.query.dateRange || '30d';

    const overview = await ownerOverviewService.getOwnerOverview(ownerId, dateRange);

    return sendSuccess(res, 200, 'Owner dashboard overview retrieved successfully', overview);
  } catch (error) {
    return next(error);
  }
};
