const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
	sendCollaborationRequest,
	getSentCollaborationRequests,
	getRequestById,
	updateRequest,
	cancelRequest,
	getIncomingRequests,
	acceptRequest,
	rejectRequest,
	negotiateRequest
} = require('../controllers/collaborationController');

// —— Owner: must be before /:id so "incoming" is not parsed as id
router.post('/', authenticate, authorize('OWNER'), sendCollaborationRequest);
router.get('/', authenticate, authorize('OWNER'), getSentCollaborationRequests);
router.get('/incoming', authenticate, authorize('INFLUENCER'), getIncomingRequests);

// —— Single request (owner or influencer)
router.get('/:id', authenticate, getRequestById);

// —— Owner only
router.put('/:id', authenticate, authorize('OWNER'), updateRequest);
router.delete('/:id', authenticate, authorize('OWNER'), cancelRequest);

// —— Influencer only
router.post('/:id/accept', authenticate, authorize('INFLUENCER'), acceptRequest);
router.post('/:id/reject', authenticate, authorize('INFLUENCER'), rejectRequest);
router.post('/:id/negotiate', authenticate, authorize('INFLUENCER'), negotiateRequest);

module.exports = router;
