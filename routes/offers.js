const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createOffer,
  getMyOffers,
  getOfferById,
  updateOffer,
  withdrawOffer,
  getIncomingOffers,
  acceptOffer,
  rejectOffer,
  counterOffer
} = require('../controllers/offersController');

// Owner operations
router.post('/service-listings/:id/offers', authenticate, authorize('OWNER'), createOffer);
router.get('/offers', authenticate, authorize('OWNER'), getMyOffers);

// Influencer operations
router.get('/offers/incoming', authenticate, authorize('INFLUENCER'), getIncomingOffers);
router.post('/offers/:id/accept', authenticate, authorize('INFLUENCER'), acceptOffer);
router.post('/offers/:id/reject', authenticate, authorize('INFLUENCER'), rejectOffer);
router.post('/offers/:id/counter', authenticate, authorize('INFLUENCER'), counterOffer);

// Shared (must come after /offers/incoming so it doesn't get captured as :id)
router.get('/offers/:id', authenticate, getOfferById);
router.put('/offers/:id', authenticate, authorize('OWNER'), updateOffer);
router.delete('/offers/:id', authenticate, authorize('OWNER'), withdrawOffer);

module.exports = router;

