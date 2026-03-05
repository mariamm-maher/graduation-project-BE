// controllers/contractController.js
const contractService = require('../services/collaboration/contractService');
const sendSuccess     = require('../utils/sendSuccess');

// POST /api/collaborations/:collaborationId/contract
// Role: Owner — create a draft contract for an accepted collaboration
exports.createContract = async (req, res, next) => {
  try {
    const { agreedPrice, startDate, endDate, deliverables } = req.body;

    const contract = await contractService.createContract({
      collaborationId: req.params.collaborationId,
      ownerId:         req.user.id,
      agreedPrice,
      startDate,
      endDate,
      deliverables,
    });

    sendSuccess(res, 201, 'Contract created', { contract });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/contracts/:id
// Role: Owner — update a draft contract before sending
exports.updateContract = async (req, res, next) => {
  try {
    const contract = await contractService.updateContract({
      contractId: req.params.id,
      ownerId:    req.user.id,
      updates:    req.body,
    });

    sendSuccess(res, 200, 'Contract updated', { contract });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/contracts/:id/send
// Role: Owner — send draft contract to influencer for signing
exports.sendContract = async (req, res, next) => {
  try {
    const contract = await contractService.sendContract({
      contractId: req.params.id,
      ownerId:    req.user.id,
    });

    sendSuccess(res, 200, 'Contract sent to influencer', { contract });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/contracts/:id/sign
// Role: Influencer — sign the contract, triggers task + chat creation
exports.signContract = async (req, res, next) => {
  try {
    const result = await contractService.signContract({
      contractId:   req.params.id,
      influencerId: req.user.id,
    });

    sendSuccess(res, 200, 'Contract signed. Collaboration is now live.', result);
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