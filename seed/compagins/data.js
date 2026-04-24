const campaignSeeds = [
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
      endDate: '2026-05-09T15:30:00.000Z',
      isPublished: true
    },
    targetAudience: {
      ageRange: '22-40',
      gender: 'all',
      interests: ['smart-home', 'gadgets', 'home-automation'],
      platformsUsed: ['Instagram', 'YouTube', 'TikTok']
    },
    kpis: [
      { metric: 'impressions', targetValue: '350000' },
      { metric: 'reach', targetValue: '180000' },
      { metric: 'engagement_rate', targetValue: '5.2%' }
    ],
    contentCalendar: [
      {
        day: 1,
        date: '2026-05-05T10:00:00.000Z',
        platform: 'Instagram',
        contentType: 'reel',
        caption: 'A smarter home starts with one simple upgrade.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-01/reel-1.mp4',
        task: 'Publish launch teaser reel',
        status: 'scheduled'
      },
      {
        day: 5,
        date: '2026-05-09T15:30:00.000Z',
        platform: 'YouTube',
        contentType: 'video',
        caption: 'Top 5 automations to save time every day.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-01/video-1.mp4',
        task: 'Publish long-form product walkthrough',
        status: 'scheduled'
      }
    ],
    aiVersion: {
      versionNumber: 1,
      strategy: {
        positioning: 'Affordable premium smart-living',
        creatorsMix: ['micro-tech-creators', 'home-lifestyle-creators']
      },
      execution: {
        contentPillars: ['automation tips', 'before-after setup'],
        postingCadence: '2 posts/week'
      },
      estimations: {
        expectedReach: 180000,
        expectedCTR: '2.7%'
      },
      isActive: true
    }
  },
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Lead Capture Sprint',
      lifecycleStage: 'draft',
      campaign_goal: 'Leads',
      budget_amount: 1800,
      budget_currency: 'USD',
      campaign_duration_weeks: 3,
      startDate: '2026-05-12T12:00:00.000Z',
      endDate: '2026-05-17T17:00:00.000Z',
      isPublished: false
    },
    targetAudience: {
      ageRange: '25-45',
      gender: 'all',
      interests: ['smart-security', 'wifi-cameras', 'home-safety'],
      platformsUsed: ['Facebook', 'Instagram']
    },
    kpis: [
      { metric: 'conversions', targetValue: '400 leads' },
      { metric: 'CTR', targetValue: '2.2%' },
      { metric: 'CPA', targetValue: '< $6' }
    ],
    contentCalendar: [
      {
        day: 2,
        date: '2026-05-12T12:00:00.000Z',
        platform: 'Facebook',
        contentType: 'post',
        caption: 'Get your free smart-home safety checklist today.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-02/post-1.jpg',
        task: 'Publish lead magnet static post',
        status: 'scheduled'
      },
      {
        day: 7,
        date: '2026-05-17T17:00:00.000Z',
        platform: 'Instagram',
        contentType: 'story',
        caption: 'Swipe up for the free checklist and setup guide.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-02/story-1.jpg',
        task: 'Publish story with lead CTA',
        status: 'scheduled'
      }
    ],
    aiVersion: {
      versionNumber: 1,
      strategy: {
        positioning: 'Safety first, setup in minutes',
        creatorsMix: ['family-home-creators']
      },
      execution: {
        contentPillars: ['security demos', 'lead-magnet education'],
        postingCadence: '3 posts/week'
      },
      estimations: {
        expectedLeads: 420,
        expectedCPA: '$5.4'
      },
      isActive: true
    }
  },
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
      endDate: '2026-05-23T13:30:00.000Z',
      isPublished: true
    },
    targetAudience: {
      ageRange: '24-42',
      gender: 'all',
      interests: ['smart-lighting', 'energy-saving', 'app-control'],
      platformsUsed: ['YouTube', 'Instagram', 'Facebook']
    },
    kpis: [
      { metric: 'conversions', targetValue: '260 orders' },
      { metric: 'ROAS', targetValue: '3.5x' },
      { metric: 'reach', targetValue: '150000' }
    ],
    contentCalendar: [
      {
        day: 1,
        date: '2026-05-20T09:00:00.000Z',
        platform: 'YouTube',
        contentType: 'video',
        caption: 'Smart lighting setup under 10 minutes.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-03/video-1.mp4',
        task: 'Publish product setup demo',
        status: 'scheduled'
      },
      {
        day: 4,
        date: '2026-05-23T13:30:00.000Z',
        platform: 'Instagram',
        contentType: 'carousel',
        caption: '5 ways to save energy with automation.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-03/carousel-1.jpg',
        task: 'Publish educational carousel',
        status: 'scheduled'
      }
    ],
    aiVersion: {
      versionNumber: 2,
      strategy: {
        positioning: 'Practical upgrades with immediate value',
        creatorsMix: ['home-improvement-creators', 'tech-reviewers']
      },
      execution: {
        contentPillars: ['demo', 'comparison', 'value-proof'],
        postingCadence: '2-3 posts/week'
      },
      estimations: {
        expectedSales: 260,
        expectedROAS: '3.5x'
      },
      isActive: true
    }
  },
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
      endDate: '2026-06-02T14:00:00.000Z',
      isPublished: false
    },
    targetAudience: {
      ageRange: '26-50',
      gender: 'all',
      interests: ['existing-customers', 'home-upgrades', 'after-sales-support'],
      platformsUsed: ['Email', 'Instagram']
    },
    kpis: [
      { metric: 'engagement_rate', targetValue: '6.0%' },
      { metric: 'conversions', targetValue: '120 repeat orders' },
      { metric: 'CTR', targetValue: '3.0%' }
    ],
    contentCalendar: [
      {
        day: 3,
        date: '2026-05-28T11:00:00.000Z',
        platform: 'Instagram',
        contentType: 'story',
        caption: 'Existing customer perks are now live.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-04/story-1.jpg',
        task: 'Publish loyalty story highlight',
        status: 'scheduled'
      },
      {
        day: 8,
        date: '2026-06-02T14:00:00.000Z',
        platform: 'Instagram',
        contentType: 'post',
        caption: 'Upgrade bundle for returning customers.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-04/post-1.jpg',
        task: 'Publish retention offer post',
        status: 'scheduled'
      }
    ],
    aiVersion: {
      versionNumber: 1,
      strategy: {
        positioning: 'Reward loyal customers with smart upgrades',
        creatorsMix: ['customer-story-creators']
      },
      execution: {
        contentPillars: ['ugc testimonials', 'upgrade bundles'],
        postingCadence: '2 posts/week'
      },
      estimations: {
        expectedRepeatOrders: 120,
        expectedEngagement: '6.0%'
      },
      isActive: true
    }
  },
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Dormant Users Re-engagement',
      lifecycleStage: 'draft',
      campaign_goal: 'Re-engagement',
      budget_amount: 1600,
      budget_currency: 'USD',
      campaign_duration_weeks: 3,
      startDate: '2026-06-05T10:30:00.000Z',
      endDate: '2026-06-10T18:00:00.000Z',
      isPublished: false
    },
    targetAudience: {
      ageRange: '21-38',
      gender: 'all',
      interests: ['inactive-users', 'smart-home-apps', 'limited-offers'],
      platformsUsed: ['Instagram', 'YouTube']
    },
    kpis: [
      { metric: 'reach', targetValue: '90000' },
      { metric: 'CTR', targetValue: '2.8%' },
      { metric: 'conversions', targetValue: '180 reactivated users' }
    ],
    contentCalendar: [
      {
        day: 1,
        date: '2026-06-05T10:30:00.000Z',
        platform: 'Instagram',
        contentType: 'reel',
        caption: 'Come back and automate your routine in minutes.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-05/reel-1.mp4',
        task: 'Publish reactivation reel',
        status: 'scheduled'
      },
      {
        day: 6,
        date: '2026-06-10T18:00:00.000Z',
        platform: 'YouTube',
        contentType: 'video',
        caption: 'What is new in our latest smart-home lineup?',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-05/video-1.mp4',
        task: 'Publish what is new update video',
        status: 'scheduled'
      }
    ],
    aiVersion: {
      versionNumber: 1,
      strategy: {
        positioning: 'New value for users who paused usage',
        creatorsMix: ['tech-educators']
      },
      execution: {
        contentPillars: ['what is new', 'limited discounts'],
        postingCadence: '2 posts/week'
      },
      estimations: {
        expectedReactivatedUsers: 180,
        expectedCTR: '2.8%'
      },
      isActive: true
    }
  },
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Fall Awareness Expansion',
      lifecycleStage: 'saved',
      campaign_goal: 'Awareness',
      budget_amount: 2900,
      budget_currency: 'USD',
      campaign_duration_weeks: 6,
      startDate: '2026-06-15T12:00:00.000Z',
      endDate: '2026-06-22T16:00:00.000Z',
      isPublished: true
    },
    targetAudience: {
      ageRange: '20-44',
      gender: 'all',
      interests: ['tech-trends', 'home-upgrades', 'smart-living'],
      platformsUsed: ['TikTok', 'Instagram', 'YouTube']
    },
    kpis: [
      { metric: 'impressions', targetValue: '500000' },
      { metric: 'reach', targetValue: '250000' },
      { metric: 'engagement_rate', targetValue: '4.8%' }
    ],
    contentCalendar: [
      {
        day: 2,
        date: '2026-06-15T12:00:00.000Z',
        platform: 'TikTok',
        contentType: 'video',
        caption: '3 smart-home hacks everyone should know.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-06/video-1.mp4',
        task: 'Publish short-form hack video',
        status: 'scheduled'
      },
      {
        day: 9,
        date: '2026-06-22T16:00:00.000Z',
        platform: 'Instagram',
        contentType: 'reel',
        caption: 'Before and after smart setup transformation.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-06/reel-1.mp4',
        task: 'Publish transformation reel',
        status: 'scheduled'
      }
    ],
    aiVersion: {
      versionNumber: 3,
      strategy: {
        positioning: 'Modern smart living for everyday households',
        creatorsMix: ['lifestyle-tech-creators', 'family-creators']
      },
      execution: {
        contentPillars: ['hack videos', 'home transformations'],
        postingCadence: '3 posts/week'
      },
      estimations: {
        expectedImpressions: 500000,
        expectedEngagement: '4.8%'
      },
      isActive: true
    }
  },
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven B2B Leads Builder',
      lifecycleStage: 'draft',
      campaign_goal: 'Leads',
      budget_amount: 2100,
      budget_currency: 'USD',
      campaign_duration_weeks: 4,
      startDate: '2026-06-25T09:30:00.000Z',
      endDate: '2026-06-30T13:00:00.000Z',
      isPublished: false
    },
    targetAudience: {
      ageRange: '28-50',
      gender: 'custom',
      interests: ['property-management', 'short-term-rentals', 'office-tech'],
      platformsUsed: ['LinkedIn', 'YouTube']
    },
    kpis: [
      { metric: 'conversions', targetValue: '150 qualified leads' },
      { metric: 'CTR', targetValue: '2.4%' },
      { metric: 'CPA', targetValue: '< $10' }
    ],
    contentCalendar: [
      {
        day: 1,
        date: '2026-06-25T09:30:00.000Z',
        platform: 'LinkedIn',
        contentType: 'article',
        caption: 'How smart automation reduces property operation cost.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-07/article-1.pdf',
        task: 'Publish B2B thought leadership article',
        status: 'scheduled'
      },
      {
        day: 6,
        date: '2026-06-30T13:00:00.000Z',
        platform: 'YouTube',
        contentType: 'video',
        caption: 'Case study: rental units using smart security.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-07/video-1.mp4',
        task: 'Publish B2B case study video',
        status: 'scheduled'
      }
    ],
    aiVersion: {
      versionNumber: 1,
      strategy: {
        positioning: 'Operational efficiency for property businesses',
        creatorsMix: ['b2b-tech-creators']
      },
      execution: {
        contentPillars: ['case studies', 'ROI narratives'],
        postingCadence: '2 posts/week'
      },
      estimations: {
        expectedQualifiedLeads: 150,
        expectedCPA: '$9.2'
      },
      isActive: true
    }
  },
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Holiday Sales Surge',
      lifecycleStage: 'saved',
      campaign_goal: 'Sales',
      budget_amount: 4000,
      budget_currency: 'USD',
      campaign_duration_weeks: 6,
      startDate: '2026-07-05T11:00:00.000Z',
      endDate: '2026-07-13T17:30:00.000Z',
      isPublished: true
    },
    targetAudience: {
      ageRange: '20-45',
      gender: 'all',
      interests: ['holiday-shopping', 'gift-guides', 'smart-tech-deals'],
      platformsUsed: ['Instagram', 'TikTok', 'YouTube']
    },
    kpis: [
      { metric: 'conversions', targetValue: '420 orders' },
      { metric: 'ROAS', targetValue: '4.0x' },
      { metric: 'impressions', targetValue: '620000' }
    ],
    contentCalendar: [
      {
        day: 2,
        date: '2026-07-05T11:00:00.000Z',
        platform: 'Instagram',
        contentType: 'carousel',
        caption: 'Holiday gift guide: smart home edition.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-08/carousel-1.jpg',
        task: 'Publish holiday gift guide carousel',
        status: 'scheduled'
      },
      {
        day: 10,
        date: '2026-07-13T17:30:00.000Z',
        platform: 'TikTok',
        contentType: 'video',
        caption: 'Top holiday smart-home deals this week.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-08/video-1.mp4',
        task: 'Publish limited-time offers video',
        status: 'scheduled'
      }
    ],
    aiVersion: {
      versionNumber: 2,
      strategy: {
        positioning: 'Best value smart gifts for holidays',
        creatorsMix: ['deal-creators', 'tech-gift-creators']
      },
      execution: {
        contentPillars: ['gift guides', 'deal alerts'],
        postingCadence: '4 posts/week'
      },
      estimations: {
        expectedSales: 420,
        expectedROAS: '4.0x'
      },
      isActive: true
    }
  },
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Loyalty Plus Retention',
      lifecycleStage: 'saved',
      campaign_goal: 'Retention',
      budget_amount: 1700,
      budget_currency: 'USD',
      campaign_duration_weeks: 5,
      startDate: '2026-07-18T10:00:00.000Z',
      endDate: '2026-07-25T14:30:00.000Z',
      isPublished: false
    },
    targetAudience: {
      ageRange: '25-52',
      gender: 'all',
      interests: ['loyalty-programs', 'subscription-users', 'smart-home-upgrades'],
      platformsUsed: ['Email', 'Instagram', 'Facebook']
    },
    kpis: [
      { metric: 'engagement_rate', targetValue: '6.5%' },
      { metric: 'conversions', targetValue: '140 renewals' },
      { metric: 'CTR', targetValue: '3.2%' }
    ],
    contentCalendar: [
      {
        day: 4,
        date: '2026-07-18T10:00:00.000Z',
        platform: 'Instagram',
        contentType: 'post',
        caption: 'Loyalty members get early access this week.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-09/post-1.jpg',
        task: 'Publish loyalty access announcement',
        status: 'scheduled'
      },
      {
        day: 11,
        date: '2026-07-25T14:30:00.000Z',
        platform: 'Facebook',
        contentType: 'story',
        caption: 'Exclusive loyalty perks for returning users.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-09/story-1.jpg',
        task: 'Publish loyalty perks story',
        status: 'scheduled'
      }
    ],
    aiVersion: {
      versionNumber: 1,
      strategy: {
        positioning: 'Retention through value and exclusivity',
        creatorsMix: ['community-builders']
      },
      execution: {
        contentPillars: ['member perks', 'upgrade stories'],
        postingCadence: '2 posts/week'
      },
      estimations: {
        expectedRenewals: 140,
        expectedEngagement: '6.5%'
      },
      isActive: true
    }
  },
  {
    ownerEmail: 'owner01@example.com',
    campaign: {
      campaignName: 'Tech Haven Winback Re-engagement Wave',
      lifecycleStage: 'draft',
      campaign_goal: 'Re-engagement',
      budget_amount: 1950,
      budget_currency: 'USD',
      campaign_duration_weeks: 4,
      startDate: '2026-08-01T11:30:00.000Z',
      endDate: '2026-08-07T16:30:00.000Z',
      isPublished: false
    },
    targetAudience: {
      ageRange: '23-41',
      gender: 'all',
      interests: ['winback-campaigns', 'feature-updates', 'smart-home-news'],
      platformsUsed: ['YouTube', 'Instagram', 'TikTok']
    },
    kpis: [
      { metric: 'reach', targetValue: '130000' },
      { metric: 'CTR', targetValue: '2.9%' },
      { metric: 'conversions', targetValue: '210 reactivated users' }
    ],
    contentCalendar: [
      {
        day: 1,
        date: '2026-08-01T11:30:00.000Z',
        platform: 'YouTube',
        contentType: 'video',
        caption: 'Everything new in Tech Haven this season.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-10/video-1.mp4',
        task: 'Publish full winback overview video',
        status: 'scheduled'
      },
      {
        day: 7,
        date: '2026-08-07T16:30:00.000Z',
        platform: 'TikTok',
        contentType: 'reel',
        caption: 'Quick tour of new smart features you missed.',
        mediaUrl: 'https://images.example.com/campaigns/tech-haven-10/reel-1.mp4',
        task: 'Publish short winback feature clip',
        status: 'scheduled'
      }
    ],
    aiVersion: {
      versionNumber: 2,
      strategy: {
        positioning: 'Return for better features and better value',
        creatorsMix: ['product-update-creators', 'tech-review-creators']
      },
      execution: {
        contentPillars: ['feature highlights', 'return offers'],
        postingCadence: '3 posts/week'
      },
      estimations: {
        expectedReactivatedUsers: 210,
        expectedReach: 130000
      },
      isActive: true
    }
  }
];

module.exports = campaignSeeds;
