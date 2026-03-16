const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const contractCtrl = require('../controllers/contractController');

router.use(authenticate);


// =============================================================================
// COLLABORATION CONTRACTS
// Base: /api/collaboration-contracts
// =============================================================================

// Create and view contract for a specific collaboration
router.post('/collaboration/:collaborationId', contractCtrl.createContract);
router.get('/collaboration/:collaborationId',  contractCtrl.getContract);

// Get contracts by role
router.get('/mine/owner', contractCtrl.getMyOwnerContracts);
router.get('/mine/influencer', contractCtrl.getMyInfluencerContracts);

// Sign contract by role
router.patch('/:id/sign/owner', contractCtrl.signContractOwner);
router.patch('/:id/sign/influencer', contractCtrl.signContractInfluencer);

module.exports = router;