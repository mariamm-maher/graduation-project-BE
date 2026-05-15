/**
 * Social Factory
 * 
 * Generates realistic Channel, ScheduledPost, and PostAnalytics seed data.
 */

const { pick, pickMultiple, generateHandle } = require('../data/names');
const { Validators } = require('../utils/validators');

class SocialFactory {
  constructor() {
    this.platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'];
  }

  /**
   * Generate a Channel (social media account)
   * @param {number} userId 
   * @param {object} options
   * @returns {object}
   */
  generateChannel(userId, options = {}) {
    const platform = options.platform || pick(this.platforms);
    const accountName = generateHandle();
    const status = options.status || pick(['active', 'active', 'active', 'disconnected']);

    // Generate realistic looking tokens (not real, just for seed data)
    const accessToken = this.generateDummyToken(platform);
    const refreshToken = Math.random() > 0.3 ? this.generateDummyToken(platform, true) : null;

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 60); // 60 days from now

    return {
      userId,
      platform,
      accountId: `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accountName: accountName,
      accountUsername: `@${accountName}`,
      profilePicture: `https://ui-avatars.com/api/?name=${accountName}&background=random`,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      platformData: this.generatePlatformData(platform),
      status,
      lastSyncAt: status === 'active' ? new Date() : null
    };
  }

  /**
   * Generate multiple channels for a user
   * @param {number} userId 
   * @param {number} count 
   * @returns {Array}
   */
  generateChannelsForUser(userId, count = 2) {
    const channels = [];
    const selectedPlatforms = pickMultiple(this.platforms, count);

    for (const platform of selectedPlatforms) {
      channels.push(this.generateChannel(userId, { platform }));
    }

    return channels;
  }

  /**
   * Generate dummy OAuth token
   * @param {string} platform 
   * @param {boolean} isRefresh 
   * @returns {string}
   */
  generateDummyToken(platform, isRefresh = false) {
    const prefix = isRefresh ? 'refresh' : 'access';
    const randomBytes = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    return `${platform}_${prefix}_${timestamp}_${randomBytes}_seed_token_not_real`;
  }

  /**
   * Generate platform-specific data
   * @param {string} platform 
   * @returns {object}
   */
  generatePlatformData(platform) {
    const baseData = {
      followers: Math.floor(Math.random() * 100000) + 1000,
      following: Math.floor(Math.random() * 1000) + 100,
      posts: Math.floor(Math.random() * 500) + 50
    };

    const platformSpecific = {
      instagram: {
        ...baseData,
        engagement_rate: (Math.random() * 5 + 1).toFixed(2),
        is_business_account: true,
        media_count: baseData.posts
      },
      facebook: {
        ...baseData,
        page_likes: baseData.followers,
        page_followers: Math.floor(baseData.followers * 0.9),
        engagement_rate: (Math.random() * 3 + 0.5).toFixed(2)
      },
      twitter: {
        ...baseData,
        tweets: baseData.posts,
        listed_count: Math.floor(Math.random() * 100),
        verified: Math.random() > 0.9
      },
      linkedin: {
        ...baseData,
        connections: baseData.following,
        impressions: Math.floor(Math.random() * 50000)
      },
      tiktok: {
        ...baseData,
        likes: Math.floor(baseData.followers * (Math.random() * 10 + 5)),
        videos: baseData.posts,
        average_views: Math.floor(baseData.followers * (Math.random() * 0.5 + 0.1))
      },
      youtube: {
        ...baseData,
        subscribers: baseData.followers,
        videos: baseData.posts,
        views: Math.floor(baseData.followers * (Math.random() * 50 + 10)),
        channel_title: generateHandle()
      }
    };

    return platformSpecific[platform] || baseData;
  }

  /**
   * Generate a ScheduledPost
   * @param {number} channelId 
   * @param {number} campaignId 
   * @param {object} options
   * @returns {object}
   */
  generateScheduledPost(channelId, campaignId, options = {}) {
    const platform = options.platform || pick(this.platforms);
    const contentType = options.contentType || this.getContentTypesForPlatform(platform)[0];
    
    const now = new Date();
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + Math.floor(Math.random() * 30)); // Next 30 days

    const status = options.status || pick(['draft', 'scheduled', 'scheduled', 'scheduled']);
    
    let publishedAt = null;
    let platformPostId = null;
    
    if (status === 'published') {
      publishedAt = new Date(scheduledAt);
      platformPostId = `${platform}_${Date.now()}`;
    }

    return {
      channelId,
      CollaborationTaskId: options.taskId || null,
      contentCalendarId: options.contentCalendarId || null,
      content: this.generatePostContent(contentType, platform),
      mediaUrls: Math.random() > 0.3 ? [
        `https://images.unsplash.com/photo-${Date.now().toString(36).substr(0, 12)}?w=800&h=600&fit=crop`
      ] : [],
      scheduledAt,
      status,
      publishedAt,
      platformPostId,
      errorMessage: status === 'failed' ? 'Failed to publish: API rate limit exceeded' : null,
      retryCount: status === 'failed' ? Math.floor(Math.random() * 3) : 0,
      options: {
        hashtags: this.generateHashtags(),
        mentions: [],
        location: Math.random() > 0.7 ? 'New York, NY' : null
      }
    };
  }

  /**
   * Get content types for a platform
   * @param {string} platform 
   * @returns {Array}
   */
  getContentTypesForPlatform(platform) {
    const types = {
      instagram: ['post', 'story', 'reel'],
      facebook: ['post', 'story'],
      twitter: ['post', 'article'],
      linkedin: ['post', 'article'],
      tiktok: ['video'],
      youtube: ['video', 'short']
    };
    return types[platform] || ['post'];
  }

  /**
   * Generate post content
   * @param {string} contentType 
   * @param {string} platform 
   * @returns {string}
   */
  generatePostContent(contentType, platform) {
    const templates = {
      post: [
        'Excited to share this with you all! 🎉',
        'What do you think about this? Let me know in the comments!',
        'New content dropping now! Check it out 👀',
        'Here is something I have been working on...'
      ],
      story: [
        'Behind the scenes moment! ✨',
        'Swipe up for more! 👆',
        'Quick update from my day',
        'Poll: What should I post next?'
      ],
      reel: [
        'Watch till the end! 😱',
        'This trend but make it creative 🎬',
        'POV: You discovered something amazing',
        'Wait for it... ⏰'
      ],
      video: [
        'Full tutorial in bio! 📺',
        'New video is live - go watch!',
        'In-depth review coming your way',
        'The content you have been asking for!'
      ],
      article: [
        'Deep dive into this topic - full article linked',
        'My thoughts on the latest industry trends',
        'Professional insights you need to read',
        'Article: Breaking down complex topics'
      ]
    };

    const platformTemplates = templates[contentType] || templates.post;
    return pick(platformTemplates);
  }

  /**
   * Generate hashtags
   * @returns {Array}
   */
  generateHashtags() {
    const hashtags = [
      '#contentcreator', '#influencer', '#brandcollab', '#partnership',
      '#sponsored', '#ad', '#lifestyle', '#daily', '#instagood',
      '#photooftheday', '#picoftheday', '#follow', '#love',
      '#fashion', '#style', '#beauty', '#fitness', '#travel',
      '#food', '#art', '#photography', '#music', '#business'
    ];
    return pickMultiple(hashtags, Math.floor(Math.random() * 5) + 3);
  }

  /**
   * Generate PostAnalytics for a scheduled post
   * @param {number} scheduledPostId 
   * @param {object} options
   * @returns {object}
   */
  generatePostAnalytics(scheduledPostId, options = {}) {
    const baseReach = Math.floor(Math.random() * 50000) + 1000;
    const engagementMultiplier = Math.random() * 0.1 + 0.02; // 2-12% engagement

    return {
      scheduledPostId,
      note: options.note || null,
      likes: Math.floor(baseReach * engagementMultiplier * 0.6),
      comments: Math.floor(baseReach * engagementMultiplier * 0.15),
      shares: Math.floor(baseReach * engagementMultiplier * 0.1),
      reach: baseReach,
      impressions: Math.floor(baseReach * (Math.random() * 2 + 1.5)),
      fetchedAt: new Date()
    };
  }

  /**
   * Generate scheduled posts and analytics for a campaign
   * @param {number} campaignId 
   * @param {Array} channels 
   * @param {number} count 
   * @returns {object}
   */
  generateScheduledPostsForCampaign(campaignId, channels, count = 6) {
    const scheduledPosts = [];
    const analytics = [];

    for (let i = 0; i < count; i++) {
      const channel = pick(channels);
      const status = pick(['scheduled', 'scheduled', 'published', 'draft']);
      
      const post = this.generateScheduledPost(channel.id, campaignId, {
        platform: channel.platform,
        status
      });

      scheduledPosts.push(post);

      // Generate analytics for published posts
      if (status === 'published') {
        analytics.push(this.generatePostAnalytics(null)); // ID will be set after creation
      }
    }

    return { scheduledPosts, analytics };
  }

  /**
   * Generate channels for multiple users
   * @param {Array} users 
   * @returns {Array}
   */
  generateChannelsForUsers(users) {
    const allChannels = [];

    for (const user of users) {
      // Influencers get more channels on average
      const channelCount = Math.floor(Math.random() * 3) + 2;
      const channels = this.generateChannelsForUser(user.id, channelCount);
      allChannels.push(...channels);
    }

    return allChannels;
  }
}

module.exports = new SocialFactory();
