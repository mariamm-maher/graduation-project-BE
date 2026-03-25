// controllers/contractController.js
const contractService = require('../services/collaboration/contractService');
const sendSuccess     = require('../utils/sendSuccess');

// POST /api/collaborations/:collaborationId/contract
// Role: Owner — create a draft contract for an accepted collaboration
exports.createContract = async (req, res, next) => {
  try {
    const { startDate, endDate, deliverables } = req.body;

    const contract = await contractService.createContract({
      collaborationId: req.params.collaborationId,
      ownerId:         req.user.id,
      startDate,
      endDate,
      deliverables,
    });

    sendSuccess(res, 201, 'Contract created', { contract });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaboration-contracts/mine/owner
// Role: Owner — get all contracts for owner
exports.getMyOwnerContracts = async (req, res, next) => {
  try {
    const contracts = await contractService.getOwnerContracts(req.user.id);
    sendSuccess(res, 200, 'My contracts (as owner)', { contracts });
  } catch (err) {
    next(err);
  }
};

// GET /api/collaboration-contracts/mine/influencer
// Role: Influencer — get all contracts for influencer
exports.getMyInfluencerContracts = async (req, res, next) => {
  try {
    const contracts = await contractService.getInfluencerContracts(req.user.id);
    sendSuccess(res, 200, 'My contracts (as influencer)', { contracts });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/collaboration-contracts/:id/sign/owner
// Role: Owner — sign a sent contract
exports.signContractOwner = async (req, res, next) => {
  try {
    const result = await contractService.signByOwner({
      contractId: req.params.id,
      ownerId: req.user.id,
    });

    sendSuccess(res, 200, 'Contract signed by owner', result);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/collaboration-contracts/:id/sign/influencer
// Role: Influencer — sign a sent contract
exports.signContractInfluencer = async (req, res, next) => {
  try {
    const result = await contractService.signByInfluencer({
      contractId: req.params.id,
      influencerId: req.user.id,
    });

    sendSuccess(res, 200, 'Contract signed by influencer', result);
  } catch (err) {
    next(err);
  }
};

// GET /api/collaborations/:collaborationId/contract
// Role: Owner or Influencer
exports.getContract = async (req, res, next) => {
  try {
    const contract = await contractService.getContractByCollaboration({
      collaborationId: req.params.collaborationId,
      userId:          req.user.id,
    });

    sendSuccess(res, 200, 'Contract', { contract });
  } catch (err) {
    next(err);
  }
};