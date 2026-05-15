/**
 * Campaign Factory
 * 
 * Generates realistic Campaign, KPI, TargetAudience, and ContentCalendar seed data.
 */

const { pick, pickMultiple } = require('../data/names');
const { Validators } = require('../utils/validators');
const {
  CAMPAIGN_GOALS,
  INDUSTRIES,
  INTERESTS,
  KPI_TARGET_VALUES,
  PLATFORM_CONTENT_TYPES,
  CONTENT_TOPICS
} = require('../data/constants');

class CampaignFactory {
  constructor() {
    this.usedNames = new Set();
  }

  /**
   * Generate a unique campaign name
   * @param {string} brandName 
   * @returns {string}
   */
  generateCampaignName(brandName) {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const years = [2025, 2026];
    const descriptors = [
      'Launch', 'Awareness', 'Drive', 'Push', 'Sprint',
      'Campaign', 'Initiative', 'Program', 'Blitz', 'Wave',
      'Summer', 'Winter', 'Spring', 'Fall', 'Holiday',
      'Product', 'Feature', 'Update', 'Release', 'Edition'
    ];
    const topics = [
      'Smart Home', 'Fitness', 'Beauty', 'Lifestyle', 'Tech',
      'Wellness', 'Sustainability', 'Innovation', 'Community', 'Growth'
    ];

    const patterns = [
      () => `${brandName} ${pick(topics)} ${pick(descriptors)} ${pick(quarters)} ${pick(years)}`,
      () => `${brandName} ${pick(quarters)} ${pick(years)} ${pick(topics)} Push`,
      () => `${brandName} ${pick(descriptors)}: ${pick(topics)} Focus`,
      () => `${pick(years)} ${brandName} ${pick(topics)} Campaign`,
      () => `${brandName} ${pick(descriptors)} ${Math.floor(Math.random() * 10) + 1}`,
      () => `${pick(topics)} ${pick(descriptors)} - ${brandName}`
    ];

    for (let attempts = 0; attempts < 20; attempts++) {
      const name = pick(patterns)();
      if (!this.usedNames.has(name)) {
        this.usedNames.add(name);
        return name;
      }
    }

    // Fallback with timestamp
    return `${brandName} Campaign ${Date.now()}`;
  }

  /**
   * Generate a Campaign
   * @param {number} userId 
   * @param {object} options
   * @returns {object}
   */
  generateCampaign(userId, options = {}) {
    const {
      brandName = 'Brand',
      goal = pick(CAMPAIGN_GOALS),
      lifecycleStage = pick(['draft', 'ai_generated', 'saved', 'saved', 'completed']),
      isPublished = lifecycleStage === 'saved' && Math.random() > 0.3
    } = options;

    const campaignName = this.generateCampaignName(brandName);
    const duration = Math.floor(Math.random() * 8) + 2; // 2-10 weeks
    const budget = this.generateBudget(goal);

    // Generate dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60)); // Start in next 60 days
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (duration * 7));

    const campaign = {
      userId,
      campaignName,
      lifecycleStage,
      campaign_goal: goal,
      budget_amount: budget,
      budget_currency: 'USD',
      campaign_duration_weeks: duration,
      startDate: lifecycleStage !== 'draft' ? startDate : null,
      endDate: lifecycleStage !== 'draft' ? endDate : null,
      isPublished
    };

    // Validate
    const errors = Validators.validateCampaign(campaign);
    Validators.assertValid('Campaign', campaign, errors);

    return campaign;
  }

  /**
   * Generate budget based on goal
   * @param {string} goal 
   * @returns {number}
   */
  generateBudget(goal) {
    const ranges = {
      'Awareness': [2000, 8000],
      'Leads': [1500, 5000],
      'Sales': [3000, 10000],
      'Retention': [1000, 4000],
      'Re-engagement': [1500, 5000]
    };
    
    const [min, max] = ranges[goal] || [2000, 5000];
    return Math.floor(Math.random() * (max - min) + min);
  }

  /**
   * Generate TargetAudience for a campaign
   * @param {number} campaignId 
   * @param {object} options
   * @returns {object}
   */
  generateTargetAudience(campaignId, options = {}) {
    const ageRanges = ['18-24', '25-34', '35-44', '45-54'];
    const genders = ['all', 'all', 'female', 'male'];
    const platforms = Object.keys(PLATFORM_CONTENT_TYPES);

    return {
      campaignId,
      ageRange: pick(ageRanges),
      gender: pick(genders),
      interests: pickMultiple(INTERESTS, 5),
      platformsUsed: pickMultiple(platforms, 3)
    };
  }

  /**
   * Generate KPIs for a campaign
   * @param {number} campaignId 
   * @param {string} goal 
   * @returns {Array}
   */
  generateKPIs(campaignId, goal) {
    const goalMetrics = {
      'Awareness': ['impressions', 'reach', 'engagement_rate'],
      'Leads': ['conversions', 'CTR', 'CPA'],
      'Sales': ['conversions', 'ROAS', 'reach'],
      'Retention': ['engagement_rate', 'conversions'],
      'Re-engagement': ['reach', 'CTR', 'conversions']
    };

    const metrics = goalMetrics[goal] || ['impressions', 'reach'];
    
    return metrics.map(metric => ({
      campaignId,
      metric,
      targetValue: pick(KPI_TARGET_VALUES[metric])
    }));
  }

  /**
   * Generate ContentCalendar entries for a campaign
   * @param {number} campaignId 
   * @param {Date} startDate 
   * @param {Date} endDate 
   * @param {number} count 
   * @returns {Array}
   */
  generateContentCalendar(campaignId, startDate, endDate, count = 8) {
    const entries = [];
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const interval = Math.floor(duration / count);

    for (let i = 0; i < count; i++) {
      const entryDate = new Date(startDate);
      entryDate.setDate(entryDate.getDate() + (i * interval));

      const platform = pick(Object.keys(PLATFORM_CONTENT_TYPES));
      const contentType = pick(PLATFORM_CONTENT_TYPES[platform]);
      const topic = pick(CONTENT_TOPICS);

      entries.push({
        campaignId,
        day: i + 1,
        date: entryDate,
        platform,
        contentType,
        caption: this.generateCaption(topic, platform),
        mediaUrl: Math.random() > 0.3 
          ? `https://images.unsplash.com/photo-${Date.now().toString(36).substr(0, 12)}?w=800&h=600&fit=crop`
          : null,
        task: `Publish ${contentType} on ${platform}`,
        status: pick(['scheduled', 'scheduled', 'posted']) // Weight toward scheduled
      });
    }

    return entries;
  }

  /**
   * Generate a content caption
   * @param {string} topic 
   * @param {string} platform 
   */
  generateCaption(topic, platform) {
    const templates = {
      'product_review': [
        'Just tried this amazing product! Here is my honest review 💯',
        'Review time! Let me tell you what I really think about this',
        'Testing out the latest product everyone is talking about'
      ],
      'tutorial': [
        'Step-by-step guide to mastering this technique 👩‍🏫',
        'Tutorial Tuesday! Learn how to do this like a pro',
        'Quick tutorial that will change your game forever'
      ],
      'how_to': [
        'How to achieve the perfect result every time ✨',
        'The ultimate how-to guide you have been waiting for',
        'Learn this simple trick that changes everything'
      ],
      'tips_tricks': [
        '3 tips that will transform your approach 🎯',
        'Insider tricks the pros do not want you to know',
        'Quick tips for better results every time'
      ],
      'behind_the_scenes': [
        'Behind the scenes of today\'s shoot 🎬',
        'The making of... Exclusive BTS content',
        'What really happens behind the camera'
      ],
      'day_in_life': [
        'A day in my life - real and unfiltered 📅',
        'Come spend the day with me!',
        'Typical day in the life of a creator'
      ],
      'transformation': [
        'The transformation you need to see ✨',
        'Before and after - the results speak for themselves',
        'Incredible transformation journey complete'
      ],
      'comparison': [
        'Side by side comparison - which do you prefer?',
        'Comparing the options so you do not have to',
        'The ultimate comparison guide'
      ],
      'unboxing': [
        'Unboxing the latest release! 📦',
        'First look unboxing - fresh delivery!',
        'Unboxing excitement is real with this one'
      ]
    };

    const platformSpecific = {
      'instagram': ['Swipe for more 👉', 'Link in bio', 'Save this for later 💾'],
      'tiktok': ['Wait for the ending 😱', 'POV: you found this gem', 'This changed everything'],
      'youtube': ['Full video link in description', 'Subscribe for more', 'Watch till the end'],
      'twitter': ['Thread 🧵', 'Retweet if you agree', 'Thoughts?'],
      'linkedin': ['What is your experience?', 'Share your thoughts below', 'Professional perspective']
    };

    const baseTemplates = templates[topic] || ['Amazing content coming your way!'];
    const platformAdditions = platformSpecific[platform] || [''];
    
    return `${pick(baseTemplates)} ${pick(platformAdditions)}`.trim();
  }

  /**
   * Generate a CampaignAIVersion
   * @param {number} campaignId 
   * @param {number} versionNumber 
   * @param {string} goal 
   * @returns {object}
   */
  generateCampaignAIVersion(campaignId, versionNumber = 1, goal) {
    return {
      campaignId,
      versionNumber,
      generatedAt: new Date(),
      strategy: {
        campaignSummary: `AI-generated strategy focused on ${goal.toLowerCase()} using targeted content distribution`,
        platformSelection: this.generatePlatformStrategy(),
        budgetAllocation: this.generateBudgetAllocation()
      },
      execution: {
        contentCalendar: [],
        adStrategy: {
          campaigns: []
        }
      },
      estimations: {
        estimatedResults: {
          scenario: 'moderate',
          confidenceLevel: Math.floor(Math.random() * 20) + 70, // 70-90%
          metrics: []
        }
      },
      isActive: versionNumber === 1
    };
  }

  /**
   * Generate platform strategy
   * @returns {Array}
   */
  generatePlatformStrategy() {
    const platforms = Object.keys(PLATFORM_CONTENT_TYPES);
    const priorities = ['primary', 'secondary', 'tertiary'];
    
    return pickMultiple(platforms, 3).map((platform, i) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      rationale: `Strategic fit for target audience demographics`,
      priority: priorities[i] || 'tertiary',
      audienceMatchScore: Math.floor(Math.random() * 20) + 70
    }));
  }

  /**
   * Generate budget allocation
   * @returns {object}
   */
  generateBudgetAllocation() {
    return {
      breakdown: [
        { category: 'paid_ads', percentage: 50 },
        { category: 'content_creation', percentage: 30 },
        { category: 'influencer_marketing', percentage: 15 },
        { category: 'contingency', percentage: 5 }
      ]
    };
  }

  /**
   * Generate complete campaign package
   * @param {number} userId 
   * @param {object} options
   * @returns {object}
   */
  generateCompleteCampaign(userId, options = {}) {
    const campaign = this.generateCampaign(userId, options);
    const targetAudience = this.generateTargetAudience(null, options);
    const kpis = this.generateKPIs(null, campaign.campaign_goal);
    
    let contentCalendar = [];
    if (campaign.startDate && campaign.endDate) {
      contentCalendar = this.generateContentCalendar(
        null, 
        campaign.startDate, 
        campaign.endDate,
        options.contentCount || 8
      );
    }

    const aiVersion = this.generateCampaignAIVersion(
      null, 
      1, 
      campaign.campaign_goal
    );

    return {
      campaign,
      targetAudience,
      kpis,
      contentCalendar,
      aiVersion
    };
  }

  /**
   * Generate multiple campaigns for an owner
   * @param {number} userId 
   * @param {string} brandName 
   * @param {number} count 
   * @returns {Array}
   */
  generateCampaignsForOwner(userId, brandName, count = 5) {
    const campaigns = [];
    
    // Mix of lifecycle stages
    const stages = ['saved', 'saved', 'saved', 'completed', 'ai_generated', 'draft'];
    
    for (let i = 0; i < count; i++) {
      const stage = stages[i % stages.length];
      campaigns.push(this.generateCompleteCampaign(userId, {
        brandName,
        lifecycleStage: stage,
        goal: pick(CAMPAIGN_GOALS)
      }));
    }
    
    return campaigns;
  }
}

module.exports = new CampaignFactory();
