const express = require('express');
const router = express.Router();
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');
const {
  createServiceListing,
  getMyListings,
  getListingById,
  updateServiceListing,
  deleteServiceListing,
  updateListingStatus,
  browseListings,
  searchListings,
  getCategories
} = require('../controllers/serviceListingsController');

// ----- Public / Browse (no auth required) -----
// GET /api/service-listings - browse published
router.get('/browse', browseListings);
// GET /api/service-listings/search - search with filters
router.get('/search', searchListings);
// GET /api/service-listings/categories
router.get('/categories', getCategories);

// ----- Influencer only (auth + INFLUENCER role) -----
// POST /api/service-listings - create
router.post('/', authenticate, authorize('INFLUENCER'), createServiceListing);
// GET /api/service-listings/my-listings - my listings
router.get('/my-listings', authenticate, authorize('INFLUENCER'), getMyListings);

// GET /api/service-listings/:id - get one (public if published; owner can see draft/archived)
router.get('/:id', authenticate, authorize('INFLUENCER'), getListingById);

// PUT /api/service-listings/:id - update (influencer owner)
router.put('/:id', authenticate, authorize('INFLUENCER'), updateServiceListing);
// DELETE /api/service-listings/:id - delete (influencer owner)
router.delete('/:id', authenticate, authorize('INFLUENCER'), deleteServiceListing);
// PATCH /api/service-listings/:id/status - update status (influencer owner)
router.patch('/:id/status', authenticate, authorize('INFLUENCER'), updateListingStatus);

module.exports = router;
