const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const collabCtrl   = require('../controllers/collaborationController');

router.use(authenticate);

// =============================================================================
// COLLABORATIONS
// Base: /api/collaborations
// =============================================================================

// These must come BEFORE /:id to avoid Express matching 'mine' as an id
router.get('/mine/owner',      collabCtrl.listMyOwner);      // owner
router.get('/mine/influencer', collabCtrl.listMyInfluencer); // influencer

router.get('/:id',          collabCtrl.getById);
router.patch('/:id/cancel', collabCtrl.cancel);
router.patch('/:id/complete', collabCtrl.complete);

module.exports = router;

