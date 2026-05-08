const campaignSeeds = [
  // ─── 1. Awareness ────────────────────────────────────────────────────────
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Summer Smart Home Push',
      lifecycleStage: 'saved',
      campaign_goal: 'Awareness',
      budget_amount: 2500,
      budget_currency: 'USD',
      campaign_duration_weeks: 4,
      startDate: '2026-05-05T10:00:00.000Z',
      endDate: '2026-06-02T10:00:00.000Z',
      isPublished: true,
    },
    targetAudience: {
      ageRange: '22-40',
      gender: 'all',
      interests: ['smart-home', 'gadgets', 'home-automation'],
      platformsUsed: ['Instagram', 'YouTube', 'TikTok'],
    },
    kpis: [
      { metric: 'impressions',     targetValue: '350000' },
      { metric: 'reach',           targetValue: '180000' },
      { metric: 'engagement_rate', targetValue: '5.2%'   },
    ],
    contentCalendar: [
      {
        day: 1,
        date: '2026-05-05T10:00:00.000Z',
        platform: 'instagram',
        contentType: 'reel',
        caption: 'A smarter home starts with one simple upgrade.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-01/reel-1.mp4',
        task: 'Publish launch teaser reel',
        status: 'scheduled',
      },
      {
        day: 5,
        date: '2026-05-09T15:30:00.000Z',
        platform: 'youtube',
        contentType: 'video',
        caption: 'Top 5 automations to save time every day.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-01/video-1.mp4',
        task: 'Publish long-form product walkthrough',
        status: 'scheduled',
      },
    ],
    aiVersion: {
      versionNumber: 1,
      generatedAt: '2026-04-22T12:00:00.000Z',
      strategy: {
        campaignSummary: 'AI-generated awareness strategy for Tech Haven focused on reach using a multi-platform visual approach.',
        platformSelection: [
          { platform: 'Instagram', rationale: 'High engagement for visual content', priority: 'primary',   audienceMatchScore: 85 },
          { platform: 'YouTube',   rationale: 'Strong for product demos and reviews', priority: 'secondary', audienceMatchScore: 78 },
          { platform: 'TikTok',    rationale: 'Viral short-form reach for younger audience', priority: 'tertiary', audienceMatchScore: 72 },
        ],
        budgetAllocation: {
          totalAllocated: 2500,
          breakdown: [
            {
              category: 'paid_ads',
              amount: 1250,
              percentage: 50,
              platforms: [
                { platform: 'Instagram', amount: 710, dailyBudget: 18 },
                { platform: 'YouTube',   amount: 508, dailyBudget: 13 },
                { platform: 'TikTok',    amount: 32,  dailyBudget: 1  },
              ],
            },
            { category: 'content_creation',    amount: 750, percentage: 30 },
            { category: 'influencer_marketing', amount: 375, percentage: 15 },
            { category: 'contingency',          amount: 125, percentage: 5  },
          ],
        },
      },
      execution: {
        contentCalendar: [
          { day: 1,  date: '2026-05-05', platform: 'instagram', contentType: 'reel',  status: 'scheduled', caption: 'Launch teaser reel for Tech Haven smart devices',           task: 'Design & publish launch reel'         },
          { day: 3,  date: '2026-05-07', platform: 'tiktok',    contentType: 'video', status: 'scheduled', caption: '3 smart-home hacks you need to try',                        task: 'Record and post short hack video'     },
          { day: 7,  date: '2026-05-11', platform: 'youtube',   contentType: 'video', status: 'scheduled', caption: 'Full smart-home setup walkthrough under 10 minutes',        task: 'Record and upload walkthrough'        },
          { day: 14, date: '2026-05-18', platform: 'instagram', contentType: 'carousel', status: 'scheduled', caption: '5 reasons to upgrade your home this summer',            task: 'Design & publish carousel'            },
        ],
        adStrategy: {
          campaigns: [
            { platform: 'Instagram', campaignType: 'Reach Campaign',    objective: 'Awareness', duration: '28 days', dailyBudget: 18, targeting: 'Users interested in smart home & gadgets' },
            { platform: 'YouTube',   campaignType: 'Skippable In-Stream', objective: 'Views',   duration: '28 days', dailyBudget: 13, targeting: 'Home automation enthusiasts 22-40'        },
          ],
        },
      },
      estimations: {
        estimatedResults: {
          scenario: 'moderate',
          confidenceLevel: 74,
          metrics: [
            { metric: 'impressions',     estimatedRange: { min: 250000, max: 420000, mostLikely: 350000 } },
            { metric: 'reach',           estimatedRange: { min: 120000, max: 230000, mostLikely: 180000 } },
            { metric: 'engagement_rate', estimatedRange: { min: '3.8%', max: '6.5%', mostLikely: '5.2%' } },
          ],
        },
      },
      isActive: true,
    },
  },

  // ─── 2. Leads ─────────────────────────────────────────────────────────────
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Lead Capture Sprint',
      lifecycleStage: 'saved',
      campaign_goal: 'Leads',
      budget_amount: 1800,
      budget_currency: 'USD',
      campaign_duration_weeks: 3,
      startDate: '2026-05-12T12:00:00.000Z',
      endDate: '2026-06-02T12:00:00.000Z',
      isPublished: true,
    },
    targetAudience: {
      ageRange: '25-45',
      gender: 'all',
      interests: ['smart-security', 'wifi-cameras', 'home-safety'],
      platformsUsed: ['Facebook', 'Instagram'],
    },
    kpis: [
      { metric: 'conversions', targetValue: '400 leads' },
      { metric: 'CTR',         targetValue: '2.2%'      },
      { metric: 'CPA',         targetValue: '< $6'      },
    ],
    contentCalendar: [
      {
        day: 2,
        date: '2026-05-13T12:00:00.000Z',
        platform: 'facebook',
        contentType: 'post',
        caption: 'Get your free smart-home safety checklist today.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-02/post-1.jpg',
        task: 'Publish lead magnet static post',
        status: 'scheduled',
      },
      {
        day: 7,
        date: '2026-05-18T17:00:00.000Z',
        platform: 'instagram',
        contentType: 'story',
        caption: 'Swipe up for the free checklist and setup guide.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-02/story-1.jpg',
        task: 'Publish story with lead CTA',
        status: 'scheduled',
      },
    ],
    aiVersion: {
      versionNumber: 1,
      generatedAt: '2026-04-25T09:00:00.000Z',
      strategy: {
        campaignSummary: 'AI-generated lead capture strategy for Tech Haven using gated content and direct-response creatives on Facebook and Instagram.',
        platformSelection: [
          { platform: 'Facebook',  rationale: 'Best-in-class lead-ad formats and targeting', priority: 'primary',   audienceMatchScore: 88 },
          { platform: 'Instagram', rationale: 'Story swipe-up and bio link for lead flow',   priority: 'secondary', audienceMatchScore: 80 },
        ],
        budgetAllocation: {
          totalAllocated: 1800,
          breakdown: [
            {
              category: 'paid_ads',
              amount: 900,
              percentage: 50,
              platforms: [
                { platform: 'Facebook',  amount: 540, dailyBudget: 26 },
                { platform: 'Instagram', amount: 360, dailyBudget: 17 },
              ],
            },
            { category: 'content_creation',    amount: 540, percentage: 30 },
            { category: 'influencer_marketing', amount: 270, percentage: 15 },
            { category: 'contingency',          amount: 90,  percentage: 5  },
          ],
        },
      },
      execution: {
        contentCalendar: [
          { day: 1,  date: '2026-05-12', platform: 'facebook',  contentType: 'post',  status: 'scheduled', caption: 'Free smart-home safety checklist — download now',  task: 'Create & boost lead magnet post'   },
          { day: 4,  date: '2026-05-15', platform: 'instagram', contentType: 'story', status: 'scheduled', caption: 'Is your home secure? Take the free quiz',          task: 'Publish quiz story with link'     },
          { day: 10, date: '2026-05-21', platform: 'facebook',  contentType: 'video', status: 'scheduled', caption: 'Setup a complete smart security system in 5 steps', task: 'Produce & publish explainer video' },
          { day: 14, date: '2026-05-25', platform: 'instagram', contentType: 'reel',  status: 'scheduled', caption: 'Sneak peek: the camera that changed everything',    task: 'Publish product highlight reel'   },
        ],
        adStrategy: {
          campaigns: [
            { platform: 'Facebook',  campaignType: 'Lead Generation Ad', objective: 'Leads', duration: '21 days', dailyBudget: 26, targeting: 'Homeowners 25-45 interested in security tech' },
            { platform: 'Instagram', campaignType: 'Story Ad',           objective: 'Leads', duration: '21 days', dailyBudget: 17, targeting: 'Home-safety & camera interest segments'         },
          ],
        },
      },
      estimations: {
        estimatedResults: {
          scenario: 'moderate',
          confidenceLevel: 78,
          metrics: [
            { metric: 'leads', estimatedRange: { min: 300, max: 520, mostLikely: 400 } },
            { metric: 'CTR',   estimatedRange: { min: '1.6%', max: '2.9%', mostLikely: '2.2%' } },
            { metric: 'CPA',   estimatedRange: { min: '$4.2', max: '$7.1', mostLikely: '$5.4' } },
          ],
        },
      },
      isActive: true,
    },
  },

  // ─── 3. Sales ─────────────────────────────────────────────────────────────
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Conversion Booster Q2',
      lifecycleStage: 'saved',
      campaign_goal: 'Sales',
      budget_amount: 3200,
      budget_currency: 'USD',
      campaign_duration_weeks: 5,
      startDate: '2026-05-20T09:00:00.000Z',
      endDate: '2026-06-24T09:00:00.000Z',
      isPublished: true,
    },
    targetAudience: {
      ageRange: '24-42',
      gender: 'all',
      interests: ['smart-lighting', 'energy-saving', 'app-control'],
      platformsUsed: ['YouTube', 'Instagram', 'Facebook'],
    },
    kpis: [
      { metric: 'conversions', targetValue: '260 orders' },
      { metric: 'ROAS',        targetValue: '3.5x'       },
      { metric: 'reach',       targetValue: '150000'     },
    ],
    contentCalendar: [
      {
        day: 1,
        date: '2026-05-20T09:00:00.000Z',
        platform: 'youtube',
        contentType: 'video',
        caption: 'Smart lighting setup under 10 minutes.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-03/video-1.mp4',
        task: 'Publish product setup demo',
        status: 'scheduled',
      },
      {
        day: 4,
        date: '2026-05-23T13:30:00.000Z',
        platform: 'instagram',
        contentType: 'carousel',
        caption: '5 ways to save energy with automation.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-03/carousel-1.jpg',
        task: 'Publish educational carousel',
        status: 'scheduled',
      },
    ],
    aiVersion: {
      versionNumber: 2,
      generatedAt: '2026-04-28T08:00:00.000Z',
      strategy: {
        campaignSummary: 'AI-generated sales strategy for Tech Haven focused on direct conversion using demo-first content and retargeting on YouTube, Instagram, and Facebook.',
        platformSelection: [
          { platform: 'YouTube',   rationale: 'Demo videos drive highest purchase intent', priority: 'primary',   audienceMatchScore: 86 },
          { platform: 'Instagram', rationale: 'Carousel & reel ads proven for conversions', priority: 'secondary', audienceMatchScore: 82 },
          { platform: 'Facebook',  rationale: 'Retargeting and dynamic product ads',        priority: 'tertiary',  audienceMatchScore: 76 },
        ],
        budgetAllocation: {
          totalAllocated: 3200,
          breakdown: [
            {
              category: 'paid_ads',
              amount: 1600,
              percentage: 50,
              platforms: [
                { platform: 'YouTube',   amount: 649, dailyBudget: 19 },
                { platform: 'Instagram', amount: 649, dailyBudget: 19 },
                { platform: 'Facebook',  amount: 302, dailyBudget: 9  },
              ],
            },
            { category: 'content_creation',    amount: 960, percentage: 30 },
            { category: 'influencer_marketing', amount: 480, percentage: 15 },
            { category: 'contingency',          amount: 160, percentage: 5  },
          ],
        },
      },
      execution: {
        contentCalendar: [
          { day: 1,  date: '2026-05-20', platform: 'youtube',   contentType: 'video',    status: 'scheduled', caption: 'Smart lighting setup in under 10 minutes',           task: 'Record & upload setup demo'         },
          { day: 4,  date: '2026-05-23', platform: 'instagram', contentType: 'carousel', status: 'scheduled', caption: '5 ways smart lighting cuts your energy bill',         task: 'Design & publish carousel'          },
          { day: 8,  date: '2026-05-27', platform: 'facebook',  contentType: 'post',     status: 'scheduled', caption: 'Limited offer: bundle deal ends Sunday',              task: 'Launch retargeting ad with offer'   },
          { day: 14, date: '2026-06-02', platform: 'instagram', contentType: 'reel',     status: 'scheduled', caption: 'Customer story: before & after smart lighting setup', task: 'Publish UGC testimonial reel'       },
        ],
        adStrategy: {
          campaigns: [
            { platform: 'YouTube',   campaignType: 'TrueView for Action', objective: 'Sales', duration: '35 days', dailyBudget: 19, targeting: 'Home improvement & smart lighting interest 24-42' },
            { platform: 'Instagram', campaignType: 'Conversion Campaign', objective: 'Sales', duration: '35 days', dailyBudget: 19, targeting: 'Lookalike of past purchasers'                      },
            { platform: 'Facebook',  campaignType: 'Dynamic Product Ad',  objective: 'Sales', duration: '35 days', dailyBudget: 9,  targeting: 'Retarget website visitors last 30 days'             },
          ],
        },
      },
      estimations: {
        estimatedResults: {
          scenario: 'moderate',
          confidenceLevel: 76,
          metrics: [
            { metric: 'conversions', estimatedRange: { min: 190, max: 340, mostLikely: 260 } },
            { metric: 'ROAS',        estimatedRange: { min: '2.8x', max: '4.3x', mostLikely: '3.5x' } },
            { metric: 'reach',       estimatedRange: { min: 100000, max: 210000, mostLikely: 150000 } },
          ],
        },
      },
      isActive: true,
    },
  },

  // ─── 4. Retention ─────────────────────────────────────────────────────────
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Customer Retention Loyalty Run',
      lifecycleStage: 'saved',
      campaign_goal: 'Retention',
      budget_amount: 1400,
      budget_currency: 'USD',
      campaign_duration_weeks: 4,
      startDate: '2026-05-28T11:00:00.000Z',
      endDate: '2026-06-25T11:00:00.000Z',
      isPublished: true,
    },
    targetAudience: {
      ageRange: '26-50',
      gender: 'all',
      interests: ['existing-customers', 'home-upgrades', 'after-sales-support'],
      platformsUsed: ['Email', 'Instagram'],
    },
    kpis: [
      { metric: 'engagement_rate', targetValue: '6.0%'              },
      { metric: 'conversions',     targetValue: '120 repeat orders'  },
      { metric: 'CTR',             targetValue: '3.0%'               },
    ],
    contentCalendar: [
      {
        day: 3,
        date: '2026-05-30T11:00:00.000Z',
        platform: 'instagram',
        contentType: 'story',
        caption: 'Existing customer perks are now live.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-04/story-1.jpg',
        task: 'Publish loyalty story highlight',
        status: 'scheduled',
      },
      {
        day: 8,
        date: '2026-06-04T14:00:00.000Z',
        platform: 'instagram',
        contentType: 'post',
        caption: 'Upgrade bundle for returning customers.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-04/post-1.jpg',
        task: 'Publish retention offer post',
        status: 'scheduled',
      },
    ],
    aiVersion: {
      versionNumber: 1,
      generatedAt: '2026-05-01T10:00:00.000Z',
      strategy: {
        campaignSummary: 'AI-generated retention strategy for Tech Haven rewarding loyal customers with exclusive upgrade bundles and personalised content on Instagram.',
        platformSelection: [
          { platform: 'Instagram', rationale: 'Highest existing customer engagement channel', priority: 'primary',   audienceMatchScore: 87 },
          { platform: 'Email',     rationale: 'Direct retention channel for existing users',   priority: 'secondary', audienceMatchScore: 91 },
        ],
        budgetAllocation: {
          totalAllocated: 1400,
          breakdown: [
            {
              category: 'paid_ads',
              amount: 700,
              percentage: 50,
              platforms: [
                { platform: 'Instagram', amount: 560, dailyBudget: 20 },
                { platform: 'Email',     amount: 140, dailyBudget: 5  },
              ],
            },
            { category: 'content_creation',    amount: 420, percentage: 30 },
            { category: 'influencer_marketing', amount: 210, percentage: 15 },
            { category: 'contingency',          amount: 70,  percentage: 5  },
          ],
        },
      },
      execution: {
        contentCalendar: [
          { day: 1,  date: '2026-05-28', platform: 'instagram', contentType: 'story',    status: 'scheduled', caption: 'Exclusive loyalty perks unlocked for you',          task: 'Publish loyalty announcement story'  },
          { day: 5,  date: '2026-06-01', platform: 'instagram', contentType: 'post',     status: 'scheduled', caption: 'Your next upgrade is waiting — members get 20% off', task: 'Publish upgrade bundle post'         },
          { day: 10, date: '2026-06-06', platform: 'instagram', contentType: 'carousel', status: 'scheduled', caption: 'Top 4 add-ons our power users love',                 task: 'Design & post upsell carousel'       },
          { day: 18, date: '2026-06-14', platform: 'instagram', contentType: 'reel',     status: 'scheduled', caption: 'Customer story: 2 years with Tech Haven',            task: 'Publish long-term customer UGC reel' },
        ],
        adStrategy: {
          campaigns: [
            { platform: 'Instagram', campaignType: 'Custom Audience Ad', objective: 'Retention', duration: '28 days', dailyBudget: 20, targeting: 'Existing customers — past purchasers custom audience' },
          ],
        },
      },
      estimations: {
        estimatedResults: {
          scenario: 'moderate',
          confidenceLevel: 80,
          metrics: [
            { metric: 'repeat_orders',    estimatedRange: { min: 85,    max: 160,   mostLikely: 120   } },
            { metric: 'engagement_rate',  estimatedRange: { min: '4.5%', max: '7.8%', mostLikely: '6.0%' } },
            { metric: 'CTR',              estimatedRange: { min: '2.2%', max: '4.1%', mostLikely: '3.0%' } },
          ],
        },
      },
      isActive: true,
    },
  },

  // ─── 5. Re-engagement ─────────────────────────────────────────────────────
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Dormant Users Re-engagement',
      lifecycleStage: 'saved',
      campaign_goal: 'Re-engagement',
      budget_amount: 1600,
      budget_currency: 'USD',
      campaign_duration_weeks: 3,
      startDate: '2026-06-05T10:30:00.000Z',
      endDate: '2026-06-26T10:30:00.000Z',
      isPublished: true,
    },
    targetAudience: {
      ageRange: '21-38',
      gender: 'all',
      interests: ['inactive-users', 'smart-home-apps', 'limited-offers'],
      platformsUsed: ['Instagram', 'YouTube'],
    },
    kpis: [
      { metric: 'reach',        targetValue: '90000'                   },
      { metric: 'CTR',          targetValue: '2.8%'                    },
      { metric: 'conversions',  targetValue: '180 reactivated users'   },
    ],
    contentCalendar: [
      {
        day: 1,
        date: '2026-06-05T10:30:00.000Z',
        platform: 'instagram',
        contentType: 'reel',
        caption: 'Come back and automate your routine in minutes.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-05/reel-1.mp4',
        task: 'Publish reactivation reel',
        status: 'scheduled',
      },
      {
        day: 6,
        date: '2026-06-10T18:00:00.000Z',
        platform: 'youtube',
        contentType: 'video',
        caption: 'What is new in our latest smart-home lineup?',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-05/video-1.mp4',
        task: 'Publish what is new update video',
        status: 'scheduled',
      },
    ],
    aiVersion: {
      versionNumber: 1,
      generatedAt: '2026-05-10T07:30:00.000Z',
      strategy: {
        campaignSummary: 'AI-generated re-engagement strategy for Tech Haven targeting dormant users with new feature highlights and limited-time win-back offers.',
        platformSelection: [
          { platform: 'Instagram', rationale: 'Reel reach algorithm favours win-back content', priority: 'primary',   audienceMatchScore: 81 },
          { platform: 'YouTube',   rationale: 'In-stream ads reach users who watched before',  priority: 'secondary', audienceMatchScore: 75 },
        ],
        budgetAllocation: {
          totalAllocated: 1600,
          breakdown: [
            {
              category: 'paid_ads',
              amount: 800,
              percentage: 50,
              platforms: [
                { platform: 'Instagram', amount: 480, dailyBudget: 23 },
                { platform: 'YouTube',   amount: 320, dailyBudget: 15 },
              ],
            },
            { category: 'content_creation',    amount: 480, percentage: 30 },
            { category: 'influencer_marketing', amount: 240, percentage: 15 },
            { category: 'contingency',          amount: 80,  percentage: 5  },
          ],
        },
      },
      execution: {
        contentCalendar: [
          { day: 1,  date: '2026-06-05', platform: 'instagram', contentType: 'reel',  status: 'scheduled', caption: 'We upgraded everything — come see what you missed',  task: 'Publish win-back teaser reel'        },
          { day: 3,  date: '2026-06-07', platform: 'youtube',   contentType: 'video', status: 'scheduled', caption: 'Full tour of everything new in Tech Haven 2026',     task: 'Record & upload full feature tour'   },
          { day: 8,  date: '2026-06-12', platform: 'instagram', contentType: 'story', status: 'scheduled', caption: 'Limited offer: 15% off for returning users this week', task: 'Publish offer story with countdown' },
          { day: 14, date: '2026-06-18', platform: 'instagram', contentType: 'post',  status: 'scheduled', caption: 'Last chance — win-back deal expires in 48 hours',    task: 'Publish urgency closing post'        },
        ],
        adStrategy: {
          campaigns: [
            { platform: 'Instagram', campaignType: 'Re-engagement Ad',    objective: 'Re-engagement', duration: '21 days', dailyBudget: 23, targeting: 'Lapsed users — no purchase/interaction in 90 days' },
            { platform: 'YouTube',   campaignType: 'In-Stream Retarget',  objective: 'Re-engagement', duration: '21 days', dailyBudget: 15, targeting: 'Past video viewers who have not returned in 60 days' },
          ],
        },
      },
      estimations: {
        estimatedResults: {
          scenario: 'moderate',
          confidenceLevel: 71,
          metrics: [
            { metric: 'reactivated_users', estimatedRange: { min: 120, max: 250, mostLikely: 180 } },
            { metric: 'reach',             estimatedRange: { min: 60000, max: 130000, mostLikely: 90000 } },
            { metric: 'CTR',               estimatedRange: { min: '2.0%', max: '3.8%', mostLikely: '2.8%' } },
          ],
        },
      },
      isActive: true,
    },
  },
];

module.exports = campaignSeeds;
