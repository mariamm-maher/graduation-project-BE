// services/collaboration/collaborationRequestService.js
const { sequelize, CollaborationRequest, Collaboration } = require('../../models');
const AppError = require('../../utils/AppError');

const REQUEST_STATES = {
  PENDING:     'pending',
  NEGOTIATING: 'negotiating',
  ACCEPTED:    'accepted',
  REJECTED:    'rejected',
  EXPIRED:     'expired',
  CANCELLED:   'cancelled',
};

const VALID_TRANSITIONS = {
  [REQUEST_STATES.PENDING]:     new Set([REQUEST_STATES.NEGOTIATING, REQUEST_STATES.ACCEPTED, REQUEST_STATES.REJECTED, REQUEST_STATES.CANCELLED]),
  [REQUEST_STATES.NEGOTIATING]: new Set([REQUEST_STATES.ACCEPTED, REQUEST_STATES.REJECTED, REQUEST_STATES.NEGOTIATING]),
  [REQUEST_STATES.ACCEPTED]:    new Set(),  // terminal
  [REQUEST_STATES.REJECTED]:    new Set(),  // terminal
  [REQUEST_STATES.EXPIRED]:     new Set(),  // terminal
  [REQUEST_STATES.CANCELLED]:   new Set(),  // terminal
};

// ─── Guards ───────────────────────────────────────────────────────────────────

function assertCanTransition(current, next) {
  const allowed = VALID_TRANSITIONS[current] || new Set();
  if (!allowed.has(next)) {
    throw new AppError(`Invalid state transition: ${current} → ${next}`, 400);
  }
}

function ensureNotTerminal(request) {
  const terminal = [REQUEST_STATES.ACCEPTED, REQUEST_STATES.REJECTED, REQUEST_STATES.EXPIRED, REQUEST_STATES.CANCELLED];
  if (terminal.includes(request.status)) {
    throw new AppError(`Request is already ${request.status} and cannot be modified`, 400);
  }
}

function ensureNotExpired(request) {
  if (request.expiresAt && request.expiresAt < new Date()) {
    if (request.status !== REQUEST_STATES.EXPIRED) {
      request.status = REQUEST_STATES.EXPIRED;
    }
    throw new AppError('This request has expired', 400);
  }
}

// ─── invite ───────────────────────────────────────────────────────────────────

async function invite({ ownerId, campaignId, influencerId, proposedBudget, message, expiresAt }) {
  if (!campaignId || !influencerId) {
    throw new AppError('campaignId and influencerId are required', 400);
  }

  // Prevent duplicate active request for same campaign + influencer
  const existing = await CollaborationRequest.findOne({
    where: {
      campaignId,
      influencerId,
      status: [REQUEST_STATES.PENDING, REQUEST_STATES.NEGOTIATING],
    },
  });
  if (existing) {
    throw new AppError('An active request already exists for this influencer on this campaign', 400);
  }

  const request = await CollaborationRequest.create({
    campaignId,
    ownerId,
    influencerId,
    proposedBudget: proposedBudget || null,
    message:        message || null,
    status:         REQUEST_STATES.PENDING,
    expiresAt:      expiresAt || null,
  });

  return request;
}

// ─── respond ──────────────────────────────────────────────────────────────────

/**
 * action: 'accept' | 'reject' | 'counter'
 *
 * Turn rules:
 *   PENDING    → influencer can: accept, reject, counter
 *   NEGOTIATING → owner can: accept, reject, counter
 *                 (owner countered last, so influencer's turn — tracked via lastCounteredBy)
 *
 * We track whose turn it is using request.lastCounteredBy:
 *   - null / undefined → influencer's turn (original pending state)
 *   - influencerId     → owner's turn to respond
 *   - ownerId          → influencer's turn to respond
 */
async function respond({ requestId, actorId, action, newBudget, responseMessage }) {
  const request = await CollaborationRequest.findByPk(requestId);
  if (!request) throw new AppError('Request not found', 404);

  ensureNotExpired(request);
  ensureNotTerminal(request);

  const isOwner      = request.ownerId      === actorId;
  const isInfluencer = request.influencerId === actorId;

  if (!isOwner && !isInfluencer) {
    throw new AppError('You are not a participant in this request', 403);
  }

  // ── Determine whose turn it is ─────────────────────────────────────────────
  // PENDING: always influencer's turn
  // NEGOTIATING: whoever did NOT counter last gets to respond
  if (request.status === REQUEST_STATES.PENDING && !isInfluencer) {
    throw new AppError('It is the influencer\'s turn to respond', 403);
  }

  if (request.status === REQUEST_STATES.NEGOTIATING) {
    const lastCounteredBy = request.lastCounteredBy; // set on each counter
    if (lastCounteredBy === request.influencerId && !isOwner) {
      throw new AppError('It is the owner\'s turn to respond', 403);
    }
    if (lastCounteredBy === request.ownerId && !isInfluencer) {
      throw new AppError('It is the influencer\'s turn to respond', 403);
    }
  }

  // ── accept ─────────────────────────────────────────────────────────────────
  if (action === 'accept') {
    assertCanTransition(request.status, REQUEST_STATES.ACCEPTED);

    return sequelize.transaction(async (t) => {
      request.status          = REQUEST_STATES.ACCEPTED;
      request.responseMessage = responseMessage || null;
      await request.save({ transaction: t });

      // Guard: don't create duplicate collaboration
      const existingCollab = await Collaboration.findOne({
        where: { collaborationRequestId: request.id },
        transaction: t,
      });
      if (existingCollab) return { request, collaboration: existingCollab };

      const collaboration = await Collaboration.create({
        collaborationRequestId: request.id,
        campaignId:   request.campaignId,
        ownerId:      request.ownerId,
        influencerId: request.influencerId,
        // FIX: use your original ENUM value exactly
        status: 'PendingContractSign',
      }, { transaction: t });

      return { request, collaboration };
    });
  }

  // ── reject ─────────────────────────────────────────────────────────────────
  if (action === 'reject') {
    assertCanTransition(request.status, REQUEST_STATES.REJECTED);

    request.status          = REQUEST_STATES.REJECTED;
    request.responseMessage = responseMessage || null;
    await request.save();
    return { request };
  }

  // ── counter ────────────────────────────────────────────────────────────────
  if (action === 'counter') {
    if (!newBudget) throw new AppError('newBudget is required for a counter offer', 400);

    assertCanTransition(request.status, REQUEST_STATES.NEGOTIATING);

    // FIX: preserve original proposedBudget, store counter in counterPrice
    request.counterPrice    = newBudget;
    request.responseMessage = responseMessage || null;
    request.status          = REQUEST_STATES.NEGOTIATING;
    // FIX: track who countered last so we know whose turn it is next
    request.lastCounteredBy = actorId;

    await request.save();
    return { request };
  }

  throw new AppError('action must be: accept | reject | counter', 400);
}

// ─── cancel ───────────────────────────────────────────────────────────────────

async function cancel({ requestId, ownerId }) {
  const request = await CollaborationRequest.findByPk(requestId);
  if (!request) throw new AppError('Request not found', 404);

  if (request.ownerId !== ownerId) {
    throw new AppError('Only the owner can cancel this request', 403);
  }

  ensureNotExpired(request);
  ensureNotTerminal(request);
  assertCanTransition(request.status, REQUEST_STATES.CANCELLED);

  request.status = REQUEST_STATES.CANCELLED;
  await request.save();
  return request;
}

// ─── queries ──────────────────────────────────────────────────────────────────

async function getById(id) {
  const request = await CollaborationRequest.findByPk(id);
  if (!request) throw new AppError('Request not found', 404);
  return request;
}

// FIX: added — owner sees all requests they sent
async function listByOwner({ ownerId, status }) {
  const where = { ownerId };
  if (status) where.status = status;
  return CollaborationRequest.findAll({ where, order: [['createdAt', 'DESC']] });
}

// FIX: added — influencer sees all requests they received
async function listByInfluencer({ influencerId, status }) {
  const where = { influencerId };
  if (status) where.status = status;
  return CollaborationRequest.findAll({ where, order: [['createdAt', 'DESC']] });
}

async function listByCampaign({ campaignId, status }) {
  const where = { campaignId };
  if (status) where.status = status;
  return CollaborationRequest.findAll({ where, order: [['createdAt', 'DESC']] });
}

module.exports = {
  REQUEST_STATES,
  invite,
  respond,
  cancel,
  getById,
  listByOwner,
  listByInfluencer,
  listByCampaign,
};