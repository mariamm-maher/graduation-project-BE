const taskSeeds = [
  {
    collaborationKey: 'in-progress-collaboration',
    tasks: [
      {
        taskName: 'Record YouTube review video',
        description: 'Record a 5–8 minute unboxing and review video of the Smart Hub device.',
        status: 'approved',
        sortOrder: 1,
        platform: 'youtube',
        contentType: 'video',
        dueDate: '2026-06-20',
        submissionNote: 'Video uploaded to shared Google Drive. Link sent via chat.',
        submittedAt: '2026-06-19T14:00:00.000Z',
        reviewNote: 'Great energy and clear audio. Approved.',
        completedAt: '2026-06-20T09:00:00.000Z'
      },
      {
        taskName: 'Post Instagram Reel #1',
        description: 'Create a 30-second reel showcasing top 3 features of the Smart Hub.',
        status: 'in_review',
        sortOrder: 2,
        platform: 'instagram',
        contentType: 'reel',
        dueDate: '2026-07-01',
        submissionNote: 'Draft reel submitted for review.',
        submittedAt: '2026-06-28T11:00:00.000Z',
        reviewNote: null,
        completedAt: null
      },
      {
        taskName: 'Post Instagram Reel #2',
        description: 'Create a 30-second reel focused on the energy-saving features.',
        status: 'in_progress',
        sortOrder: 3,
        platform: 'instagram',
        contentType: 'reel',
        dueDate: '2026-07-08',
        submissionNote: null,
        submittedAt: null,
        reviewNote: null,
        completedAt: null
      },
      {
        taskName: 'Post Story Series (5 stories)',
        description: 'Post 5 consecutive Instagram stories with swipe-up link to product page.',
        status: 'todo',
        sortOrder: 4,
        platform: 'instagram',
        contentType: 'story',
        dueDate: '2026-07-12',
        submissionNote: null,
        submittedAt: null,
        reviewNote: null,
        completedAt: null
      },
      {
        taskName: 'TikTok unboxing video',
        description: 'Film a TikTok-style unboxing with trending audio. Min 45 seconds.',
        status: 'todo',
        sortOrder: 5,
        platform: 'tiktok',
        contentType: 'video',
        dueDate: '2026-07-14',
        submissionNote: null,
        submittedAt: null,
        reviewNote: null,
        completedAt: null
      }
    ]
  },
  {
    collaborationKey: 'live-collaboration',
    tasks: [
      {
        taskName: 'Brief review & kick-off call',
        description: 'Review the campaign brief and join the kick-off call with the brand team.',
        status: 'approved',
        sortOrder: 1,
        platform: null,
        contentType: null,
        dueDate: '2026-06-08',
        submissionNote: 'Call completed. Notes shared.',
        submittedAt: '2026-06-07T10:00:00.000Z',
        reviewNote: 'Brief acknowledged.',
        completedAt: '2026-06-08T10:00:00.000Z'
      },
      {
        taskName: 'Draft content plan',
        description: 'Submit a content plan outlining platform, format, and posting schedule.',
        status: 'in_progress',
        sortOrder: 2,
        platform: null,
        contentType: null,
        dueDate: '2026-06-15',
        submissionNote: null,
        submittedAt: null,
        reviewNote: null,
        completedAt: null
      }
    ]
  },
  {
    collaborationKey: 'completed-collaboration',
    tasks: [
      {
        taskName: 'Instagram post #1',
        description: 'Publish sponsored carousel post showcasing the product.',
        status: 'approved',
        sortOrder: 1,
        platform: 'instagram',
        contentType: 'post',
        dueDate: '2026-03-08',
        submissionNote: 'Post published and link shared.',
        submittedAt: '2026-03-07T16:00:00.000Z',
        reviewNote: 'Looks great. Approved.',
        completedAt: '2026-03-08T09:00:00.000Z'
      },
      {
        taskName: 'Instagram post #2',
        description: 'Follow-up post highlighting customer testimonials.',
        status: 'approved',
        sortOrder: 2,
        platform: 'instagram',
        contentType: 'post',
        dueDate: '2026-03-14',
        submissionNote: 'Published on schedule.',
        submittedAt: '2026-03-13T15:30:00.000Z',
        reviewNote: 'Approved with excellent engagement.',
        completedAt: '2026-03-14T10:00:00.000Z'
      },
      {
        taskName: 'Instagram Story sequence',
        description: 'Post 2-story sequence with poll sticker and product link.',
        status: 'approved',
        sortOrder: 3,
        platform: 'instagram',
        contentType: 'story',
        dueDate: '2026-03-18',
        submissionNote: 'Stories posted. Screenshot attached.',
        submittedAt: '2026-03-17T18:00:00.000Z',
        reviewNote: 'Good engagement rate on poll.',
        completedAt: '2026-03-18T09:00:00.000Z'
      }
    ]
  }
];

module.exports = taskSeeds;
