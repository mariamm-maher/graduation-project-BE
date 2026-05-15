/**
 * Collaboration Factory
 * 
 * Generates realistic CollaborationRequest, Collaboration, CollaborationContract, and CollaborationTask seed data.
 */

const { pick, pickMultiple } = require('../data/names');
const { Validators } = require('../utils/validators');
const { DELIVERABLE_TYPES, TASK_TEMPLATES } = require('../data/constants');

class CollaborationFactory {
  /**
   * Generate a CollaborationRequest
   * @param {number} campaignId 
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {object} options
   * @returns {object}
   */
  generateCollaborationRequest(campaignId, ownerId, influencerId, options = {}) {
    const {
      status = 'pending',
      withNegotiation = Math.random() > 0.6
    } = options;

    const baseBudget = Math.floor(Math.random() * 4000) + 500; // $500-$4500
    const proposedBudget = baseBudget;
    
    let counterPrice = null;
    let lastCounteredBy = null;
    
    if (withNegotiation && status !== 'pending') {
      counterPrice = Math.floor(baseBudget * (0.8 + Math.random() * 0.4)); // ±20%
      lastCounteredBy = Math.random() > 0.5 ? ownerId : influencerId;
    }

    const request = {
      campaignId,
      ownerId,
      influencerId,
      status,
      proposedBudget,
      counterPrice,
      lastCounteredBy,
      message: this.generateInitialMessage(),
      responseMessage: status !== 'pending' ? this.generateResponseMessage(status) : null,
      expiresAt: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)) // 14 days
    };

    // Validate
    const errors = Validators.validateCollaborationRequest(request);
    Validators.assertValid('CollaborationRequest', request, errors);

    return request;
  }

  /**
   * Generate a Collaboration
   * @param {number} collaborationRequestId 
   * @param {number} campaignId 
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {object} options
   * @returns {object}
   */
  generateCollaboration(collaborationRequestId, campaignId, ownerId, influencerId, options = {}) {
    const {
      status = 'in_progress'
    } = options;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30-day collaboration

    const completedAt = status === 'completed' ? new Date() : null;
    const cancelledAt = status === 'cancelled' ? new Date() : null;

    const collaboration = {
      collaborationRequestId,
      campaignId,
      ownerId,
      influencerId,
      status,
      startDate: startDate,
      endDate: endDate,
      completedAt,
      cancelledAt
    };

    // Validate
    const errors = Validators.validateCollaboration(collaboration);
    Validators.assertValid('Collaboration', collaboration, errors);

    return collaboration;
  }

  /**
   * Generate a CollaborationContract
   * @param {number} collaborationId 
   * @param {number} agreedPrice 
   * @param {object} options
   * @returns {object}
   */
  generateContract(collaborationId, agreedPrice, options = {}) {
    const {
      status = 'sent'
    } = options;

    const deliverablesCount = Math.floor(Math.random() * 3) + 2;
    const deliverables = pickMultiple(DELIVERABLE_TYPES, deliverablesCount).map(d => ({
      type: d.type,
      description: d.description,
      dueDate: null,
      status: 'pending'
    }));

    const ownerSigned = status === 'signed' || (status === 'partially_signed' && Math.random() > 0.5);
    const influencerSigned = status === 'signed' || (status === 'partially_signed' && !ownerSigned);

    return {
      collaborationId,
      agreedPrice,
      deliverables,
      startDate: new Date(),
      endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
      status,
      ownerSigned,
      influencerSigned,
      ownerSignedAt: ownerSigned ? new Date() : null,
      influencerSignedAt: influencerSigned ? new Date() : null,
      contractFileUrl: null,
      notes: null
    };
  }

  /**
   * Generate CollaborationTasks
   * @param {number} collaborationId 
   * @param {number} count 
   * @returns {Array}
   */
  generateTasks(collaborationId, count = 5) {
    const tasks = [];
    const templates = TASK_TEMPLATES;
    
    // Sort by typical workflow order
    const workflowOrder = [
      'Content Concept Approval',
      'First Draft Submission',
      'Content Revisions',
      'Final Content Approval',
      'Content Publishing',
      'Performance Report',
      'Story Highlights',
      'Link in Bio',
      'Swipe Up CTA',
      'Hashtag Usage'
    ];

    const selectedTasks = workflowOrder.slice(0, count);
    
    selectedTasks.forEach((taskName, index) => {
      const template = templates.find(t => t.name === taskName) || {
        name: taskName,
        description: `Complete ${taskName.toLowerCase()}`
      };

      // Determine status based on position in workflow
      let status;
      if (index < 2) status = pick(['approved', 'approved', 'in_review']);
      else if (index === 2) status = pick(['in_review', 'in_progress', 'todo']);
      else status = 'todo';

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (index * 3) + 3);

      const completedAt = status === 'approved' ? new Date() : null;
      const submittedAt = (status === 'in_review' || status === 'approved') ? new Date() : null;

      const task = {
        collaborationId,
        taskName: template.name,
        description: template.description,
        status,
        sortOrder: index,
        dueDate,
        completedAt,
        platform: pick(['instagram', 'tiktok', 'youtube', 'facebook']),
        contentType: pick(['post', 'story', 'reel', 'video']),
        submissionNote: submittedAt ? 'Submitted for your review' : null,
        submittedAt,
        reviewNote: status === 'approved' ? 'Approved - great work!' : null
      };

      const errors = Validators.validateCollaborationTask(task);
      Validators.assertValid('CollaborationTask', task, errors);

      tasks.push(task);
    });

    return tasks;
  }

  /**
   * Generate initial collaboration message
   * @returns {string}
   */
  generateInitialMessage() {
    const templates = [
      'Hi! I\'d love to collaborate with you on this campaign. Your content style is exactly what we\'re looking for!',
      'Hello! We think you\'d be a perfect fit for our brand. Would you be interested in this collaboration?',
      'Hey! Loved your recent content. We have an exciting opportunity that aligns perfectly with your audience.',
      'Hi there! I\'m reaching out because we admire your work and think you\'d be great for our upcoming campaign.',
      'Hello! We have a collaboration opportunity that I think your followers would love. Interested?'
    ];
    return pick(templates);
  }

  /**
   * Generate response message based on status
   * @param {string} status 
   * @returns {string|null}
   */
  generateResponseMessage(status) {
    const templates = {
      accepted: [
        'Thank you! I\'m excited to work together on this.',
        'This sounds great! Let\'s make it happen.',
        'Absolutely! Looking forward to collaborating.',
        'Yes! This aligns perfectly with my content. Let\'s do this!'
      ],
      rejected: [
        'Thank you for the offer, but I have to decline at this time.',
        'I appreciate the opportunity, but this isn\'t the right fit for me right now.',
        'Unfortunately, I can\'t take this on at the moment. Best of luck!'
      ],
      negotiating: [
        'I\'m interested, but could we discuss the budget?',
        'This looks good! Just a few questions about the deliverables...',
        'I\'d love to work together. Can we adjust the timeline slightly?'
      ],
      cancelled: [
        'I need to cancel this collaboration due to scheduling conflicts.',
        'Unfortunately, I have to withdraw from this project.'
      ]
    };

    return pick(templates[status] || ['']);
  }

  /**
   * Generate a complete collaboration workflow
   * @param {number} campaignId 
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {object} options
   * @returns {object}
   */
  generateCompleteCollaboration(campaignId, ownerId, influencerId, options = {}) {
    const requestStatus = options.requestStatus || pick(['accepted', 'accepted', 'pending', 'negotiating']);
    
    // Generate request
    const request = this.generateCollaborationRequest(
      campaignId, 
      ownerId, 
      influencerId, 
      { status: requestStatus }
    );

    // If not accepted, no collaboration exists yet
    if (requestStatus !== 'accepted') {
      return { request, collaboration: null, contract: null, tasks: [] };
    }

    // Determine collaboration status
    const collaborationStatus = options.collaborationStatus || pick([
      'in_progress', 'in_progress', 'in_progress', 'completed', 'live'
    ]);

    // Generate collaboration
    const collaboration = this.generateCollaboration(
      null, // Will be set after request is created
      campaignId,
      ownerId,
      influencerId,
      { status: collaborationStatus }
    );

    // Generate contract
    const finalPrice = request.counterPrice || request.proposedBudget;
    const contractStatus = collaborationStatus === 'completed' ? 'signed' : 
                          pick(['sent', 'partially_signed', 'signed', 'signed']);
    
    const contract = this.generateContract(null, finalPrice, { status: contractStatus });

    // Generate tasks
    const taskCount = options.taskCount || Math.floor(Math.random() * 4) + 3;
    const tasks = this.generateTasks(null, taskCount);

    return {
      request,
      collaboration,
      contract,
      tasks
    };
  }

  /**
   * Generate multiple collaborations for testing
   * @param {Array} campaigns - Array of campaign objects
   * @param {Array} owners - Array of owner user objects
   * @param {Array} influencers - Array of influencer user objects
   * @param {number} count 
   * @returns {Array}
   */
  generateCollaborations(campaigns, owners, influencers, count = 15) {
    const collaborations = [];
    
    for (let i = 0; i < count; i++) {
      const campaign = pick(campaigns);
      const owner = owners.find(o => o.id === campaign.userId) || pick(owners);
      const influencer = pick(influencers);

      // Vary the workflow stages
      const workflowStages = [
        { requestStatus: 'pending' },
        { requestStatus: 'negotiating' },
        { requestStatus: 'accepted', collaborationStatus: 'pending_contract_sign' },
        { requestStatus: 'accepted', collaborationStatus: 'live' },
        { requestStatus: 'accepted', collaborationStatus: 'in_progress' },
        { requestStatus: 'accepted', collaborationStatus: 'completed' },
        { requestStatus: 'rejected' }
      ];

      const stage = pick(workflowStages);
      
      collaborations.push({
        campaignId: campaign.id,
        ownerId: owner.id,
        influencerId: influencer.id,
        ...this.generateCompleteCollaboration(
          campaign.id,
          owner.id,
          influencer.id,
          stage
        )
      });
    }

    return collaborations;
  }
}

module.exports = new CollaborationFactory();
