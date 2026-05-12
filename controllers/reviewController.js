const { Review, Collaboration, User } = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const { logAction } = require('../services/logServices');

// POST /api/collaborations/:id/review
// Role: Owner — create a review for a completed collaboration
exports.createReview = async (req, res, next) => {
  try {
    const { id: collaborationId } = req.params;
    const { rating, reviewText } = req.body;
    const ownerId = req.user.id;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      const error = new Error('Rating is required and must be between 1 and 5');
      error.statusCode = 400;
      throw error;
    }

    // Find the collaboration
    const collaboration = await Collaboration.findByPk(collaborationId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'influencer', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    if (!collaboration) {
      const error = new Error('Collaboration not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify the requesting user is the owner
    if (collaboration.ownerId !== ownerId) {
      const error = new Error('Only the owner can review this collaboration');
      error.statusCode = 403;
      throw error;
    }

    // Verify collaboration is completed
    if (collaboration.status !== 'completed') {
      const error = new Error('Can only review completed collaborations');
      error.statusCode = 400;
      throw error;
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      where: {
        collaborationId,
        ownerId
      }
    });

    if (existingReview) {
      const error = new Error('You have already reviewed this collaboration');
      error.statusCode = 409;
      throw error;
    }

    // Create the review
    const review = await Review.create({
      ownerId,
      influencerId: collaboration.influencerId,
      collaborationId,
      rating,
      reviewText: reviewText || null
    });

    // Return the review with associated data
    const reviewWithAssociations = await Review.findByPk(review.id, {
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    // Log the review creation
    try {
      await logAction({
        req,
        action: 'CREATE_REVIEW',
        entity: 'Review',
        entityId: review.id,
        meta: {
          rating,
          reviewText: reviewText || null,
          collaborationId,
          influencerId: collaboration.influencerId
        }
      });
    } catch (e) {
      // non-blocking
    }

    sendSuccess(res, 201, 'Review created successfully', { review: reviewWithAssociations });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaborations/:id/review
// Role: Owner or Influencer — get review for a collaboration
exports.getReview = async (req, res, next) => {
  try {
    const { id: collaborationId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({
      where: { collaborationId },
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!review) {
      return sendSuccess(res, 200, 'No review found', { review: null });
    }

    // Verify the requesting user is either the owner or influencer
    if (review.ownerId !== userId && review.influencerId !== userId) {
      const error = new Error('Not authorized to view this review');
      error.statusCode = 403;
      throw error;
    }

    sendSuccess(res, 200, 'Review retrieved', { review });
  } catch (err) {
    next(err);
  }
};

// GET /api/influencers/:id/reviews
// Role: Public/Authenticated — get all reviews for an influencer
exports.getInfluencerReviews = async (req, res, next) => {
  try {
    const { id: influencerId } = req.params;

    const reviews = await Review.findAll({
      where: { influencerId },
      include: [
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate average rating
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

    sendSuccess(res, 200, 'Influencer reviews', {
      reviews,
      summary: {
        total: totalReviews,
        average: averageRating
      }
    });
  } catch (err) {
    next(err);
  }
};
