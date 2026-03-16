const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const requestCtrl = require('../controllers/collaborationRequestController');

router.use(authenticate);

// =============================================================================
// COLLABORATION REQUESTS
// Base: /api/collaboration-requests
// =============================================================================

// Owner sends a request to an influencer
router.post('/', requestCtrl.invite);

// Owner sees requests for a campaign (?campaignId=&status=)
router.get('/', requestCtrl.listByCampaign);

// These two must come BEFORE /:id
router.get('/mine/sent',     requestCtrl.listMySent);      // owner
router.get('/mine/received', requestCtrl.listMyReceived);  // influencer

// Single request
router.get('/:id', requestCtrl.getById);

// Influencer (pending) or Owner (negotiating): accept | reject | counter
router.patch('/:id/respond', requestCtrl.respond);

// Owner cancels
router.patch('/:id/cancel', requestCtrl.cancel);

module.exports = router;