const Campaign = require('../models/Campaign');
const AppError = require('../utils/AppError');
const sendSuccess = require('../utils/sendSuccess');

// @desc    Create a new generation-workflow draft
// @route   POST /api/campaigns/draft
// @access  Private (Owner)
exports.createDraft = async (req, res, next) => {
  try {
    const { inputs, currentOutput, versionHistory } = req.body;

    const draft = await Campaign.create({
      userId: req.user.id,
      lifecycleStage: 'draft',
      inputs: inputs || {},
      currentOutput: currentOutput || {},
      version_history: versionHistory || []
    });

    return sendSuccess(res, 201, 'Draft created successfully', {
      draft_id: draft.id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing generation-workflow draft
// @route   PUT /api/campaigns/draft/:draft_id
// @access  Private (Owner)
exports.updateDraft = async (req, res, next) => {
  try {
    const { draft_id } = req.params;
    const { inputs, currentOutput, versionHistory } = req.body;

    const draft = await Campaign.findOne({
      where: {
        id: draft_id,
        userId: req.user.id,
        lifecycleStage: 'draft'
      }
    });

    if (!draft) {
      return next(new AppError('Draft not found or access denied', 404));
    }

    const updates = {};
    if (inputs !== undefined) updates.inputs = inputs;
    if (currentOutput !== undefined) updates.currentOutput = currentOutput;
    if (versionHistory !== undefined) updates.version_history = versionHistory;

    await draft.update(updates);

    return sendSuccess(res, 200, 'Draft updated successfully', {
      draft_id: draft.id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a generation-workflow draft by ID
// @route   GET /api/campaigns/draft/:draft_id
// @access  Private (Owner)
exports.getDraft = async (req, res, next) => {
  try {
    const { draft_id } = req.params;

    const draft = await Campaign.findOne({
      where: {
        id: draft_id,
        userId: req.user.id,
        lifecycleStage: 'draft'
      },
      attributes: ['id', 'inputs', 'currentOutput', 'version_history', 'updatedAt']
    });

    if (!draft) {
      return next(new AppError('Draft not found or access denied', 404));
    }

    return sendSuccess(res, 200, 'Draft retrieved successfully', {
      id: draft.id,
      inputs: draft.inputs,
      current_output: draft.currentOutput,
      version_history: draft.version_history,
      updated_at: draft.updatedAt
    });
  } catch (error) {
    next(error);
  }
};
