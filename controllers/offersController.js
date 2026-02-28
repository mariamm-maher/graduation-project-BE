const { Offer, ServiceListing, User } = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

const ALLOWED_TRANSITIONS = {
  pending: ['negotiated', 'accepted', 'rejected', 'expired', 'withdrawn'],
  negotiated: ['accepted', 'rejected', 'expired', 'withdrawn'],
  accepted: [],
  rejected: [],
  expired: [],
  withdrawn: []
};

function ensureTransition(from, to) {
  if (!ALLOWED_TRANSITIONS[from] || !ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new AppError(`Invalid status transition from "${from}" to "${to}"`, 400);
  }
}

async function loadOfferWithRelations(id) {
  return Offer.findByPk(id, {
    include: [
      {
        model: ServiceListing,
        as: 'serviceListing',
        attributes: ['id', 'influencerId', 'title']
      },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ]
  });
}

// Helper: build Sequelize "where" for offers with optional filters (status, ownerId, influencerId)
function buildOfferWhere(filters = {}) {
  const where = {};
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.status) where.status = filters.status;
  if (filters.influencerId) where.influencerId = filters.influencerId;
  if (filters.minPrice != null) where.offerPrice = { [Op.gte]: parseFloat(filters.minPrice) };
  if (filters.maxPrice != null) {
    where.offerPrice = where.offerPrice || {};
    where.offerPrice[Op.lte] = parseFloat(filters.maxPrice);
  }
  return where;
}

// ----- Owner operations -----

// @desc    Make offer on listing
// @route   POST /api/service-listings/:id/offers
// @access  Private (OWNER)
exports.createOffer = async (req, res, next) => {
  try {
    const { id: listingId } = req.params;
    const ownerId = req.user.id;
    const { offerPrice, message } = req.body;

    if (offerPrice == null) {
      return next(new AppError('offerPrice is required', 400));
    }

    const listing = await ServiceListing.findByPk(listingId);
    if (!listing || listing.status !== 'published') {
      return next(new AppError('Service listing not available for offers', 404));
    }

    const offer = await Offer.create({
      serviceListingId: listing.id,
      ownerId,
      offerPrice,
      message: message || null,
      status: 'pending'
    });

    const created = await loadOfferWithRelations(offer.id);

    sendSuccess(res, 201, 'Offer created successfully', { offer: created });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get all my offers (as owner)
// @route   GET /api/offers
// @access  Private (OWNER)
exports.getMyOffers = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { page = 1, limit = 10, status, minPrice, maxPrice } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = buildOfferWhere({ ownerId, status, minPrice, maxPrice });

    const { count, rows: offers } = await Offer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ServiceListing,
          as: 'serviceListing',
          attributes: ['id', 'title', 'influencerId']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Offers retrieved successfully', {
      offers,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get offer details (owner or related influencer)
// @route   GET /api/offers/:id
// @access  Private (OWNER or INFLUENCER on listing)
exports.getOfferById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const offer = await loadOfferWithRelations(id);
    if (!offer) {
      return next(new AppError('Offer not found', 404));
    }

    const isOwner = offer.ownerId === userId;
    const isInfluencer = offer.serviceListing && offer.serviceListing.influencerId === userId;

    if (!isOwner && !isInfluencer) {
      return next(new AppError('You are not allowed to view this offer', 403));
    }

    sendSuccess(res, 200, 'Offer retrieved successfully', { offer });
  } catch (error) {
    return next(error);
  }
};

// @desc    Update offer (pending/negotiated only, owner only)
// @route   PUT /api/offers/:id
// @access  Private (OWNER)
exports.updateOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;
    const { offerPrice, message } = req.body;

    const offer = await Offer.findByPk(id);
    if (!offer) {
      return next(new AppError('Offer not found', 404));
    }
    if (offer.ownerId !== ownerId) {
      return next(new AppError('You can only update your own offers', 403));
    }
    if (!['pending', 'negotiated'].includes(offer.status)) {
      return next(new AppError('You can only update offers in pending or negotiated state', 400));
    }

    if (offerPrice == null && message === undefined) {
      return next(new AppError('At least one field (offerPrice or message) is required to update', 400));
    }

    if (offerPrice != null) offer.offerPrice = offerPrice;
    if (message !== undefined) offer.message = message;

    await offer.save();

    const updated = await loadOfferWithRelations(id);
    sendSuccess(res, 200, 'Offer updated successfully', { offer: updated });
  } catch (error) {
    return next(error);
  }
};

// @desc    Withdraw offer (owner cancels) - allowed from pending/negotiated
// @route   DELETE /api/offers/:id
// @access  Private (OWNER)
exports.withdrawOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    const offer = await Offer.findByPk(id);
    if (!offer) {
      return next(new AppError('Offer not found', 404));
    }
    if (offer.ownerId !== ownerId) {
      return next(new AppError('You can only withdraw your own offers', 403));
    }
    if (!['pending', 'negotiated'].includes(offer.status)) {
      return next(new AppError('Only pending or negotiated offers can be withdrawn', 400));
    }

    ensureTransition(offer.status, 'withdrawn');
    await offer.update({ status: 'withdrawn' });

    const updated = await loadOfferWithRelations(id);
    sendSuccess(res, 200, 'Offer withdrawn successfully', { offer: updated });
  } catch (error) {
    return next(error);
  }
};

// ----- Influencer operations -----

// @desc    Get incoming offers (for influencer)
// @route   GET /api/offers/incoming
// @access  Private (INFLUENCER)
exports.getIncomingOffers = async (req, res, next) => {
  try {
    const influencerId = req.user.id;
    const { page = 1, limit = 10, status, minPrice, maxPrice } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = buildOfferWhere({ status, minPrice, maxPrice });

    const { count, rows: offers } = await Offer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ServiceListing,
          as: 'serviceListing',
          where: { influencerId },
          attributes: ['id', 'title', 'influencerId']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Incoming offers retrieved successfully', {
      offers,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

async function transitionOfferStatus(req, res, next, targetStatus, requireRole) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const offer = await loadOfferWithRelations(id);
    if (!offer) {
      return next(new AppError('Offer not found', 404));
    }

    const isOwner = offer.ownerId === userId;
    const isInfluencer = offer.serviceListing && offer.serviceListing.influencerId === userId;

    if (requireRole === 'OWNER' && !isOwner) {
      return next(new AppError('Only the owner can perform this action', 403));
    }
    if (requireRole === 'INFLUENCER' && !isInfluencer) {
      return next(new AppError('Only the influencer can perform this action', 403));
    }

    ensureTransition(offer.status, targetStatus);
    await offer.update({ status: targetStatus });

    const updated = await loadOfferWithRelations(id);
    const messageMap = {
      accepted: 'Offer accepted successfully',
      rejected: 'Offer rejected successfully',
      negotiated: 'Offer moved to negotiated state successfully'
    };

    sendSuccess(res, 200, messageMap[targetStatus] || 'Offer updated successfully', {
      offer: updated
    });
  } catch (error) {
    return next(error);
  }
}

// @desc    Accept offer (influencer)
// @route   POST /api/offers/:id/accept
// @access  Private (INFLUENCER)
exports.acceptOffer = async (req, res, next) =>
  transitionOfferStatus(req, res, next, 'accepted', 'INFLUENCER');

// @desc    Reject offer (influencer)
// @route   POST /api/offers/:id/reject
// @access  Private (INFLUENCER)
exports.rejectOffer = async (req, res, next) =>
  transitionOfferStatus(req, res, next, 'rejected', 'INFLUENCER');

// // @desc    Counter-offer (influencer) → negotiated
// // @route   POST /api/offers/:id/counter
// // @access  Private (INFLUENCER)
// exports.counterOffer = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;
//     const { offerPrice, message } = req.body;

//     if (offerPrice == null) {
//       return next(new AppError('offerPrice is required for counter-offer', 400));
//     }

//     const offer = await loadOfferWithRelations(id);
//     if (!offer) {
//       return next(new AppError('Offer not found', 404));
//     }

//     const isInfluencer = offer.serviceListing && offer.serviceListing.influencerId === userId;
//     if (!isInfluencer) {
//       return next(new AppError('Only the influencer can counter this offer', 403));
//     }

//     if (!['pending', 'negotiated'].includes(offer.status)) {
//       return next(new AppError('Only pending or negotiated offers can be countered', 400));
//     }

//     ensureTransition(offer.status, 'negotiated');

//     await offer.update({
//       status: 'negotiated',
//       offerPrice,
//       message: message !== undefined ? message : offer.message
//     });

//     const updated = await loadOfferWithRelations(id);
//     sendSuccess(res, 200, 'Counter-offer sent successfully', { offer: updated });
//   } catch (error) {
//     return next(error);
//   }
// };

