const collaborationSeeds = [
  {
    key: 'pending-request',
    stageLabel: 'pending',
    campaign: {
      campaignName: 'Tech Haven Collaboration Pipeline - Pending',
      lifecycleStage: 'saved',
      campaign_goal: 'Leads',
      budget_amount: 1200,
      budget_currency: 'USD',
      campaign_duration_weeks: 2,
      startDate: '2026-05-01T09:00:00.000Z',
      endDate: '2026-05-14T17:00:00.000Z',
      isPublished: false
    },
    request: {
      status: 'pending',
      proposedBudget: 350,
      message: 'Initial outreach for a pending collaboration request.',
      responseMessage: null,
      expiresAt: '2026-05-07T23:59:59.000Z'
    }
  },
  {
    key: 'negotiating-request',
    stageLabel: 'negotiating',
    campaign: {
      campaignName: 'Tech Haven Collaboration Pipeline - Negotiating',
      lifecycleStage: 'saved',
      campaign_goal: 'Awareness',
      budget_amount: 1800,
      budget_currency: 'USD',
      campaign_duration_weeks: 3,
      startDate: '2026-05-10T09:00:00.000Z',
      endDate: '2026-05-31T17:00:00.000Z',
      isPublished: false
    },
    request: {
      status: 'negotiating',
      proposedBudget: 500,
      counterPrice: 620,
      message: 'Negotiation in progress for pricing and scope.',
      responseMessage: 'Counter offer shared by influencer.',
      expiresAt: '2026-05-15T23:59:59.000Z'
    }
  },
  {
    key: 'pending-contract-sign',
    stageLabel: 'pending_contract_sign',
    campaign: {
      campaignName: 'Tech Haven Collaboration Pipeline - Contract Pending',
      lifecycleStage: 'saved',
      campaign_goal: 'Sales',
      budget_amount: 2400,
      budget_currency: 'USD',
      campaign_duration_weeks: 4,
      startDate: '2026-06-01T09:00:00.000Z',
      endDate: '2026-06-28T17:00:00.000Z',
      isPublished: true
    },
    request: {
      status: 'accepted',
      proposedBudget: 900,
      message: 'Request accepted. Preparing contract signature.',
      responseMessage: 'Accepted by influencer.',
      expiresAt: '2026-05-22T23:59:59.000Z'
    },
    collaboration: {
      status: 'pending_contract_sign',
      startDate: '2026-06-01',
      endDate: '2026-06-28'
    },
    contract: {
      agreedPrice: 900,
      deliverables: [
        { type: 'reel', qty: 2, dueDate: '2026-06-10' },
        { type: 'story', qty: 4, dueDate: '2026-06-20' }
      ],
      startDate: '2026-06-01',
      endDate: '2026-06-28',
      status: 'sent',
      ownerSigned: true,
      influencerSigned: false,
      ownerSignedAt: '2026-05-25T10:00:00.000Z',
      influencerSignedAt: null,
      contractFileUrl: 'https://files.example.com/contracts/contract-pending-sign.pdf',
      notes: 'Waiting for influencer signature.'
    }
  },
  {
    key: 'live-collaboration',
    stageLabel: 'live',
    campaign: {
      campaignName: 'Tech Haven Collaboration Pipeline - Live',
      lifecycleStage: 'saved',
      campaign_goal: 'Awareness',
      budget_amount: 2600,
      budget_currency: 'USD',
      campaign_duration_weeks: 4,
      startDate: '2026-06-05T09:00:00.000Z',
      endDate: '2026-07-03T17:00:00.000Z',
      isPublished: true
    },
    request: {
      status: 'accepted',
      proposedBudget: 1000,
      message: 'Accepted and moved to live collaboration.',
      responseMessage: 'Accepted by influencer.',
      expiresAt: '2026-05-28T23:59:59.000Z'
    },
    collaboration: {
      status: 'live',
      startDate: '2026-06-05',
      endDate: '2026-07-03'
    }
  },
  {
    key: 'in-progress-collaboration',
    stageLabel: 'in_progress',
    campaign: {
      campaignName: 'Tech Haven Collaboration Pipeline - In Progress',
      lifecycleStage: 'saved',
      campaign_goal: 'Sales',
      budget_amount: 3200,
      budget_currency: 'USD',
      campaign_duration_weeks: 5,
      startDate: '2026-06-10T09:00:00.000Z',
      endDate: '2026-07-15T17:00:00.000Z',
      isPublished: true
    },
    request: {
      status: 'accepted',
      proposedBudget: 1200,
      message: 'Accepted and started delivery execution.',
      responseMessage: 'Accepted by influencer.',
      expiresAt: '2026-06-01T23:59:59.000Z'
    },
    collaboration: {
      status: 'in_progress',
      startDate: '2026-06-10',
      endDate: '2026-07-15'
    },
    contract: {
      agreedPrice: 1200,
      deliverables: [
        { type: 'video', qty: 1, dueDate: '2026-06-25' },
        { type: 'reel', qty: 3, dueDate: '2026-07-05' },
        { type: 'story', qty: 5, dueDate: '2026-07-12' }
      ],
      startDate: '2026-06-10',
      endDate: '2026-07-15',
      status: 'signed',
      ownerSigned: true,
      influencerSigned: true,
      ownerSignedAt: '2026-06-02T10:00:00.000Z',
      influencerSignedAt: '2026-06-02T13:30:00.000Z',
      contractFileUrl: 'https://files.example.com/contracts/contract-in-progress.pdf',
      notes: 'Execution underway.'
    }
  },
  {
    key: 'completed-collaboration',
    stageLabel: 'completed',
    campaign: {
      campaignName: 'Tech Haven Collaboration Pipeline - Completed',
      lifecycleStage: 'completed',
      campaign_goal: 'Retention',
      budget_amount: 2000,
      budget_currency: 'USD',
      campaign_duration_weeks: 3,
      startDate: '2026-03-01T09:00:00.000Z',
      endDate: '2026-03-21T17:00:00.000Z',
      isPublished: true
    },
    request: {
      status: 'accepted',
      proposedBudget: 750,
      message: 'Completed collaboration request history.',
      responseMessage: 'Accepted by influencer.',
      expiresAt: '2026-02-20T23:59:59.000Z'
    },
    collaboration: {
      status: 'completed',
      startDate: '2026-03-01',
      endDate: '2026-03-21',
      completedAt: '2026-03-22T16:00:00.000Z'
    },
    contract: {
      agreedPrice: 750,
      deliverables: [
        { type: 'post', qty: 2, dueDate: '2026-03-10' },
        { type: 'story', qty: 2, dueDate: '2026-03-20' }
      ],
      startDate: '2026-03-01',
      endDate: '2026-03-21',
      status: 'signed',
      ownerSigned: true,
      influencerSigned: true,
      ownerSignedAt: '2026-02-22T10:00:00.000Z',
      influencerSignedAt: '2026-02-22T12:00:00.000Z',
      contractFileUrl: 'https://files.example.com/contracts/contract-completed.pdf',
      notes: 'Completed successfully.'
    }
  },
  {
    key: 'cancelled-collaboration',
    stageLabel: 'cancelled',
    campaign: {
      campaignName: 'Tech Haven Collaboration Pipeline - Cancelled',
      lifecycleStage: 'cancelled',
      campaign_goal: 'Re-engagement',
      budget_amount: 1500,
      budget_currency: 'USD',
      campaign_duration_weeks: 2,
      startDate: '2026-04-01T09:00:00.000Z',
      endDate: '2026-04-14T17:00:00.000Z',
      isPublished: false
    },
    request: {
      status: 'accepted',
      proposedBudget: 600,
      message: 'Cancelled collaboration due to scope change.',
      responseMessage: 'Accepted before cancellation.',
      expiresAt: '2026-03-25T23:59:59.000Z'
    },
    collaboration: {
      status: 'cancelled',
      startDate: '2026-04-01',
      endDate: '2026-04-14',
      cancelledAt: '2026-04-05T11:00:00.000Z'
    },
    contract: {
      agreedPrice: 600,
      deliverables: [
        { type: 'video', qty: 1, dueDate: '2026-04-08' }
      ],
      startDate: '2026-04-01',
      endDate: '2026-04-14',
      status: 'cancelled',
      ownerSigned: true,
      influencerSigned: false,
      ownerSignedAt: '2026-03-26T09:00:00.000Z',
      influencerSignedAt: null,
      contractFileUrl: 'https://files.example.com/contracts/contract-cancelled.pdf',
      notes: 'Cancelled after kickoff due to budget shift.'
    }
  }
];

module.exports = collaborationSeeds;
