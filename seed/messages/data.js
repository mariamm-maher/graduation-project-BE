const messageSeeds = [
  {
    collaborationKey: 'in-progress-collaboration',
    roomName: 'Tech Haven x Ava Morgan — In Progress',
    messages: [
      { senderRole: 'owner',      content: 'Hey Ava! Excited to kick off this collab. Let us know when you have reviewed the brief.',                          status: 'read',      minutesAgo: 14400 },
      { senderRole: 'influencer', content: 'Hi Alice! Just finished reading through everything — looks great. I have a few questions about the reel format.',  status: 'read',      minutesAgo: 14350 },
      { senderRole: 'owner',      content: 'Of course, go ahead!',                                                                                             status: 'read',      minutesAgo: 14340 },
      { senderRole: 'influencer', content: 'Should the reels be portrait (9:16) or can I do landscape for YouTube repurpose?',                                  status: 'read',      minutesAgo: 14330 },
      { senderRole: 'owner',      content: 'Portrait please for IG Reels. For YouTube you can use the same clip but we will handle the reformatting on our end.', status: 'read',    minutesAgo: 14300 },
      { senderRole: 'influencer', content: 'Perfect, that works for me. I will have the first draft reel ready by June 28th.',                                  status: 'read',      minutesAgo: 14200 },
      { senderRole: 'owner',      content: 'Amazing! Also please make sure to include the hashtag #TechHavenSmartHome in all posts.',                           status: 'read',      minutesAgo: 10080 },
      { senderRole: 'influencer', content: 'Got it, noted. I have submitted the first reel draft — please check the shared folder.',                            status: 'read',      minutesAgo:  2880 },
      { senderRole: 'owner',      content: 'We reviewed it — looks fantastic! Minor note: can you add the product name in the caption?',                        status: 'delivered', minutesAgo:  1440 },
      { senderRole: 'influencer', content: 'Will do! Updated version going up today.',                                                                          status: 'sent',      minutesAgo:    30 }
    ]
  },
  {
    collaborationKey: 'live-collaboration',
    roomName: 'Tech Haven x Ava Morgan — Live',
    messages: [
      { senderRole: 'owner',      content: 'Welcome Ava! The collaboration is now live. Please check the brief in your workspace.',                             status: 'read',      minutesAgo: 4320 },
      { senderRole: 'influencer', content: 'Thanks Alice! I am on it. Will have the content plan ready by end of this week.',                                   status: 'read',      minutesAgo: 4300 },
      { senderRole: 'owner',      content: 'Sounds good. Reach out if you need any brand assets.',                                                              status: 'read',      minutesAgo: 4290 },
      { senderRole: 'influencer', content: 'Will do. Do you have a brand kit or style guide I can use?',                                                        status: 'delivered', minutesAgo:  720 },
      { senderRole: 'owner',      content: 'Yes! Sending the Google Drive link now.',                                                                           status: 'sent',      minutesAgo:   15 }
    ]
  },
  {
    collaborationKey: 'pending-contract-sign',
    roomName: 'Tech Haven x Ava Morgan — Contract Pending',
    messages: [
      { senderRole: 'owner',      content: 'Hi Ava! I have sent you the contract for review. Please sign at your earliest convenience.',                        status: 'read',      minutesAgo: 2880 },
      { senderRole: 'influencer', content: 'Hi! I just received it. I will review and sign today.',                                                             status: 'read',      minutesAgo: 2850 },
      { senderRole: 'owner',      content: 'Perfect, thank you! Let me know if you have any questions about the terms.',                                        status: 'delivered', minutesAgo:  480 }
    ]
  }
];

module.exports = messageSeeds;
