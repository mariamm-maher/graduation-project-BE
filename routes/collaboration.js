
const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const requestCtrl  = require('../controllers/collaborationRequestController');
const contractCtrl = require('../controllers/contractController');
const collabCtrl   = require('../controllers/collaborationController');
const taskCtrl     = require('../controllers/collaborationTasksController');

router.use(authenticate);

router.post('/requests', requestCtrl.invite);

// These two must come BEFORE /requests/:id to avoid route conflict
router.get('/requests/mine/sent',     requestCtrl.listMySent);      // owner
router.get('/requests/mine/received', requestCtrl.listMyReceived);  // influencer

// Owner sees requests for a campaign (?campaignId=&status=)
router.get('/requests', requestCtrl.listByCampaign);

// Single request
router.get('/requests/:id', requestCtrl.getById);

// Influencer (pending) or Owner (negotiating): accept | reject | counter
router.patch('/requests/:id/respond', requestCtrl.respond);

// Owner cancels
router.patch('/requests/:id/cancel', requestCtrl.cancel);

// =============================================================================
// COLLABORATIONS
// =============================================================================

// These must come BEFORE /:id to avoid Express matching 'mine' as an id
router.get('/mine/owner',      collabCtrl.listMyOwner);      // owner
router.get('/mine/influencer', collabCtrl.listMyInfluencer); // influencer

router.get('/:id',          collabCtrl.getById);
router.patch('/:id/cancel', collabCtrl.cancel);
router.patch('/:id/complete', collabCtrl.complete);

// =============================================================================
// CONTRACTS (nested under collaboration)
// =============================================================================

// Create and view contract
router.post('/:collaborationId/contract', contractCtrl.createContract);
router.get('/:collaborationId/contract',  contractCtrl.getContract);

// These use /contracts/:id — must come before /:id routes to avoid conflict
router.patch('/contracts/:id',       contractCtrl.updateContract);
router.patch('/contracts/:id/send',  contractCtrl.sendContract);
router.patch('/contracts/:id/sign',  contractCtrl.signContract);

// =============================================================================
// TASKS
// =============================================================================

// Board view — nested under collaboration
router.get('/:collaborationId/tasks', taskCtrl.getTasksByCollaboration);

// Single task actions — /tasks/:id must come before /:id to avoid conflict
router.get('/tasks/:id',              taskCtrl.getById);
router.patch('/tasks/:id',            taskCtrl.updateTask);
router.patch('/tasks/:id/start',      taskCtrl.startTask);
router.patch('/tasks/:id/submit',     taskCtrl.submitTask);
router.patch('/tasks/:id/approve',    taskCtrl.approveTask);
router.patch('/tasks/:id/reject',     taskCtrl.rejectTask);
router.patch('/tasks/:id/reject-final', taskCtrl.terminalRejectTask);

module.exports = router;