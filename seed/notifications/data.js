const notificationSeeds = [
  // ── Influencer notifications ──────────────────────────────────────────────
  {
    recipientRole: 'influencer',
    type: 'OFFER_MADE',
    message: 'Tech Haven sent you a collaboration request for "Tech Haven Collaboration Pipeline - Pending".',
    entityType: 'CollaborationRequest',
    collaborationKey: 'pending-request',
    isRead: false,
    metadata: { brand: 'Tech Haven', proposedBudget: 350 }
  },
  {
    recipientRole: 'influencer',
    type: 'OFFER_MADE',
    message: 'Tech Haven sent you a new collaboration request for "Tech Haven Collaboration Pipeline - Negotiating".',
    entityType: 'CollaborationRequest',
    collaborationKey: 'negotiating-request',
    isRead: true,
    metadata: { brand: 'Tech Haven', proposedBudget: 500 }
  },
  {
    recipientRole: 'influencer',
    type: 'CONTRACT_SENT',
    message: 'Tech Haven has sent you a contract for "Tech Haven Collaboration Pipeline - Contract Pending". Please review and sign.',
    entityType: 'CollaborationContract',
    collaborationKey: 'pending-contract-sign',
    isRead: false,
    metadata: { brand: 'Tech Haven', agreedPrice: 900 }
  },
  {
    recipientRole: 'influencer',
    type: 'TASK_ASSIGNED',
    message: 'A new task "Record YouTube review video" has been assigned to you.',
    entityType: 'CollaborationTask',
    collaborationKey: 'in-progress-collaboration',
    isRead: true,
    metadata: { taskName: 'Record YouTube review video', platform: 'youtube' }
  },
  {
    recipientRole: 'influencer',
    type: 'TASK_APPROVED',
    message: 'Your task "Record YouTube review video" has been approved by Tech Haven.',
    entityType: 'CollaborationTask',
    collaborationKey: 'in-progress-collaboration',
    isRead: true,
    metadata: { taskName: 'Record YouTube review video', reviewNote: 'Great energy and clear audio. Approved.' }
  },
  {
    recipientRole: 'influencer',
    type: 'MESSAGE_RECEIVED',
    message: 'Tech Haven sent you a new message in the "Tech Haven x Ava Morgan — In Progress" chat.',
    entityType: 'ChatRoom',
    collaborationKey: 'in-progress-collaboration',
    isRead: false,
    metadata: { brand: 'Tech Haven' }
  },
  {
    recipientRole: 'influencer',
    type: 'CONTRACT_SIGNED',
    message: 'The contract for "Tech Haven Collaboration Pipeline - In Progress" has been fully signed. The collaboration is now live.',
    entityType: 'CollaborationContract',
    collaborationKey: 'in-progress-collaboration',
    isRead: true,
    metadata: { brand: 'Tech Haven', agreedPrice: 1200 }
  },

  // ── Owner notifications ───────────────────────────────────────────────────
  {
    recipientRole: 'owner',
    type: 'PROPOSAL_SUBMITTED',
    message: 'Ava Morgan accepted your collaboration request for "Tech Haven Collaboration Pipeline - Contract Pending".',
    entityType: 'CollaborationRequest',
    collaborationKey: 'pending-contract-sign',
    isRead: true,
    metadata: { influencer: 'Ava Morgan' }
  },
  {
    recipientRole: 'owner',
    type: 'TASK_SUBMITTED',
    message: 'Ava Morgan submitted "Record YouTube review video" for review.',
    entityType: 'CollaborationTask',
    collaborationKey: 'in-progress-collaboration',
    isRead: true,
    metadata: { taskName: 'Record YouTube review video', influencer: 'Ava Morgan' }
  },
  {
    recipientRole: 'owner',
    type: 'TASK_SUBMITTED',
    message: 'Ava Morgan submitted "Post Instagram Reel #1" for review.',
    entityType: 'CollaborationTask',
    collaborationKey: 'in-progress-collaboration',
    isRead: false,
    metadata: { taskName: 'Post Instagram Reel #1', influencer: 'Ava Morgan' }
  },
  {
    recipientRole: 'owner',
    type: 'MESSAGE_RECEIVED',
    message: 'Ava Morgan sent you a new message in the "Tech Haven x Ava Morgan — In Progress" chat.',
    entityType: 'ChatRoom',
    collaborationKey: 'in-progress-collaboration',
    isRead: false,
    metadata: { influencer: 'Ava Morgan' }
  },
  {
    recipientRole: 'owner',
    type: 'CONTRACT_SIGNED',
    message: 'Ava Morgan has signed the contract for "Tech Haven Collaboration Pipeline - In Progress".',
    entityType: 'CollaborationContract',
    collaborationKey: 'in-progress-collaboration',
    isRead: true,
    metadata: { influencer: 'Ava Morgan', agreedPrice: 1200 }
  }
];

module.exports = notificationSeeds;
