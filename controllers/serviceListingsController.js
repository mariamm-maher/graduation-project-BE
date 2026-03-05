const { ServiceListing, User, sequelize } = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

// @desc    Create service listing (Influencer)
// @route   POST /api/service-listings
// @access  Private (INFLUENCER)
exports.createServiceListing = async (req, res, next) => {
  try {
    const { title, description, categories, platforms, location, price, status } = req.body;
    const influencerId = req.user.id;

    if (!title || !description || price === undefined) {
      return next(new AppError('Title, description, and price are required', 400));
    }

    const listing = await ServiceListing.create({
      influencerId,
      title,
      description,
      categories: Array.isArray(categories) ? categories : [],
      platforms: Array.isArray(platforms) ? platforms : [],
      location: location || null,
      price,
      status: status || 'draft'
    });

    const created = await ServiceListing.findByPk(listing.id, {
      include: [{ model: User, as: 'influencer', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });

    sendSuccess(res, 201, 'Service listing created successfully', { listing: created });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get my listings (Influencer)
// @route   GET /api/service-listings/my-listings
// @access  Private (INFLUENCER)
exports.getMyListings = async (req, res, next) => {
  try {
    const influencerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { influencerId };
    if (status) whereClause.status = status;

    const { count, rows: listings } = await ServiceListing.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'My listings retrieved successfully', {
      listings,
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

// @desc    Get listing by ID (details)
// @route   GET /api/service-listings/:id
// @access  Public (published) / Owner or own listing
exports.getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await ServiceListing.findByPk(id, {
      include: [{ model: User, as: 'influencer', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });

    if (!listing) {
      return next(new AppError('Service listing not found', 404));
    }

    // If not published, only owner (influencer) can view
    if (listing.status !== 'published' && (!req.user || req.user.id !== listing.influencerId)) {
      return next(new AppError('Service listing not found', 404));
    }

    sendSuccess(res, 200, 'Listing retrieved successfully', { listing });
  } catch (error) {
    return next(error);
  }
};

// @desc    Update listing (Influencer, owner only)
// @route   PUT /api/service-listings/:id
// @access  Private (INFLUENCER)
exports.updateServiceListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, categories, platforms, location, price, status } = req.body;
    const userId = req.user.id;

    const listing = await ServiceListing.findByPk(id);
    if (!listing) {
      return next(new AppError('Service listing not found', 404));
    }
    if (listing.influencerId !== userId) {
      return next(new AppError('You can only update your own listings', 403));
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (categories !== undefined) updates.categories = Array.isArray(categories) ? categories : listing.categories;
    if (platforms !== undefined) updates.platforms = Array.isArray(platforms) ? platforms : listing.platforms;
    if (location !== undefined) updates.location = location;
    if (price !== undefined) updates.price = price;
    if (status !== undefined) updates.status = status;

    await listing.update(updates);

    const updated = await ServiceListing.findByPk(id, {
      include: [{ model: User, as: 'influencer', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });

    sendSuccess(res, 200, 'Listing updated successfully', { listing: updated });
  } catch (error) {
    return next(error);
  }
};

// @desc    Delete listing (Influencer, owner only)
// @route   DELETE /api/service-listings/:id
// @access  Private (INFLUENCER)
exports.deleteServiceListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await ServiceListing.findByPk(id);
    if (!listing) {
      return next(new AppError('Service listing not found', 404));
    }
    if (listing.influencerId !== userId) {
      return next(new AppError('You can only delete your own listings', 403));
    }

    await listing.destroy();
    sendSuccess(res, 200, 'Listing deleted successfully');
  } catch (error) {
    return next(error);
  }
};

// @desc    Update listing status (draft/published/archived)
// @route   PATCH /api/service-listings/:id/status
// @access  Private (INFLUENCER)
exports.updateListingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status || !['draft', 'published', 'archived'].includes(status)) {
      return next(new AppError('Valid status is required: draft, published, or archived', 400));
    }

    const listing = await ServiceListing.findByPk(id);
    if (!listing) {
      return next(new AppError('Service listing not found', 404));
    }
    if (listing.influencerId !== userId) {
      return next(new AppError('You can only update your own listings', 403));
    }

    await listing.update({ status });
    const updated = await ServiceListing.findByPk(id, {
      include: [{ model: User, as: 'influencer', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });

    sendSuccess(res, 200, 'Listing status updated successfully', { listing: updated });
  } catch (error) {
    return next(error);
  }
};

// Helper: build Sequelize "where" for listings with optional filters (category, platform, price range, location)
function buildBrowseWhere(query) {
  const where = { status: 'published' }; // Default to published listings
  // Override status if explicitly provided
  if (query.status) {
    where.status = query.status;
  }
  if (query.category) where.categories = { [Op.contains]: [query.category] };
  if (query.platform) where.platforms = { [Op.contains]: [query.platform] };
  if (query.minPrice != null && query.minPrice !== '' && query.maxPrice != null && query.maxPrice !== '') {
    where.price = { [Op.between]: [parseFloat(query.minPrice), parseFloat(query.maxPrice)] };
  } else if (query.minPrice != null && query.minPrice !== '') {
    where.price = { [Op.gte]: parseFloat(query.minPrice) };
  } else if (query.maxPrice != null && query.maxPrice !== '') {
    where.price = { [Op.lte]: parseFloat(query.maxPrice) };
  }
  if (query.location) where.location = { [Op.iLike]: `%${query.location}%` };
  return where;
}

// @desc    Browse all published listings (public / owner)
// @route   GET /api/service-listings/browse
// @access  Public
exports.browseListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, platform, minPrice, maxPrice, location } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = buildBrowseWhere({ category, platform, minPrice, maxPrice, location, status: 'published' });

    const { count, rows: listings } = await ServiceListing.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'influencer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Listings retrieved successfully', {
      listings,
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

// @desc    Search listings with filters
// @route   GET /api/service-listings/search
// @access  Public
exports.searchListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, q, category, platform, minPrice, maxPrice, location, status, includeAll } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = buildBrowseWhere({ category, platform, minPrice, maxPrice, location, status, includeAll });
    if (q) {
      whereClause[Op.and] = [
        { [Op.or]: [{ title: { [Op.iLike]: `%${q}%` } }, { description: { [Op.iLike]: `%${q}%` } }] }
      ];
    }

    const { count, rows: listings } = await ServiceListing.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'influencer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    sendSuccess(res, 200, 'Search results retrieved successfully', {
      listings,
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

// @desc    Get available categories (from existing service listings)
// @route   GET /api/service-listings/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    // Get distinct categories from the categories array column in ServiceListings (PostgreSQL)
    const [results] = await sequelize.query(
      `SELECT DISTINCT unnest("categories") AS category FROM "ServiceListings" WHERE "categories" IS NOT NULL AND array_length("categories", 1) > 0 ORDER BY category`
    );
    const categories = results.map((r) => r.category).filter(Boolean);

    sendSuccess(res, 200, 'Categories retrieved successfully', {
      categories
    });
  } catch (error) {
    return next(error);
  }
};
