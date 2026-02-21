const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { sendCollaborationRequest } = require('../controllers/collaborationController');

// Owner sends a collaboration request to an influencer
router.post('/', authenticate, authorize('OWNER'), sendCollaborationRequest);

module.exports = router;
