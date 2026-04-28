const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const taskCtrl = require('../controllers/collaborationTasksController');

router.use(authenticate);

// =============================================================================
// COLLABORATION TASKS
// Base: /api/collaboration-tasks
// =============================================================================

// All collaborations + nested tasks for the authenticated owner
router.get('/my/owner',      taskCtrl.getMyTasksAsOwner);

// All collaborations + nested tasks for the authenticated influencer
router.get('/my/influencer', taskCtrl.getMyTasksAsInfluencer);

// Board view — get all tasks nested under a specific collaboration
router.get('/collaboration/:collaborationId', taskCtrl.getTasksByCollaboration);

// Create a new task under a collaboration (owner only)
router.post('/collaboration/:collaborationId', taskCtrl.createTask);

// Single task actions by task ID
router.get('/:id',              taskCtrl.getById);
router.patch('/:id',            taskCtrl.updateTask);
router.patch('/:id/start',      taskCtrl.startTask);
router.patch('/:id/submit',     taskCtrl.submitTask);
router.patch('/:id/approve',    taskCtrl.approveTask);
router.patch('/:id/reject',     taskCtrl.rejectTask);
router.patch('/:id/reject-final', taskCtrl.terminalRejectTask);
router.patch('/:id/move',         taskCtrl.moveTask);

module.exports = router;