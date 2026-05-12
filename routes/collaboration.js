const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const collabCtrl   = require('../controllers/collaborationController');
const reviewCtrl   = require('../controllers/reviewController');

router.use(authenticate);

// =============================================================================
// COLLABORATIONS
// Base: /api/collaborations
// =============================================================================

// These must come BEFORE /:id to avoid Express matching 'mine' as an id
router.get('/mine/owner',      collabCtrl.listMyOwner);      // owner
router.get('/mine/influencer', collabCtrl.listMyInfluencer); // influencer
router.get('/overview',        collabCtrl.getOverview);

router.get('/:id',          collabCtrl.getById);
router.patch('/:id/cancel', collabCtrl.cancel);
router.patch('/:id/complete', collabCtrl.complete);

// Reviews for a collaboration
router.post('/:id/review', reviewCtrl.createReview);
router.get('/:id/review',  reviewCtrl.getReview);

module.exports = router;

