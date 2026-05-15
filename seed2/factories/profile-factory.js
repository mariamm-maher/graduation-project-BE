/**
 * Profile Factory
 * 
 * Generates realistic OwnerProfile and InfluencerProfile seed data.
 */

const { pick, pickMultiple, generateCompanyName, generateBrandName } = require('../data/names');
const { 
  INDUSTRIES, 
  COMPANY_SIZES, 
  LOCATIONS, 
  INFLUENCER_CATEGORIES,
  COLLABORATION_TYPES,
  INTERESTS,
  PLATFORM_CONTENT_TYPES
} = require('../data/constants');

class ProfileFactory {
  /**
   * Generate an OwnerProfile
   * @param {number} userId 
   * @param {object} options
   * @returns {object}
   */
  generateOwnerProfile(userId, options = {}) {
    const { 
      completionLevel = 'complete' // 'minimal', 'partial', 'complete', 'onboarded'
    } = options;

    const companySize = pick(COMPANY_SIZES);
    const brandName = generateBrandName();
    const industry = pick(INDUSTRIES);
    const location = pick(LOCATIONS);
    const targetMarkets = pickMultiple(LOCATIONS.map(l => l.country), 3);
    
    // Generate competitors based on industry
    const competitors = this.generateCompetitors(industry);
    
    // Completion percentage based on level
    const completionMap = {
      minimal: Math.floor(Math.random() * 30) + 10,
      partial: Math.floor(Math.random() * 40) + 40,
      complete: Math.floor(Math.random() * 15) + 85,
      onboarded: 100
    };
    const completionPercentage = completionMap[completionLevel] || 85;
    const isOnboarded = completionLevel === 'onboarded' || (completionLevel === 'complete' && Math.random() > 0.3);
    const isCompleted = completionLevel === 'onboarded' || completionLevel === 'complete';

    const profile = {
      userId,
      brand_name: completionLevel !== 'minimal' ? brandName : null,
      unique_selling_point: completionLevel !== 'minimal' 
        ? this.generateUSPS(industry, brandName) 
        : null,
      product_or_service: completionLevel !== 'minimal' 
        ? this.generateProductDescription(industry) 
        : null,
      company_size: companySize,
      target_market: completionLevel !== 'minimal' ? targetMarkets : null,
      competitors: completionLevel !== 'minimal' ? competitors : [],
      has_previous_campaigns: Math.random() > 0.4,
      previous_campaign_description: Math.random() > 0.4 
        ? this.generatePreviousCampaignDescription() 
        : null,
      industry: completionLevel !== 'minimal' ? industry : null,
      website: completionLevel !== 'minimal' 
        ? `https://${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` 
        : null,
      platforms: completionLevel !== 'minimal' 
        ? pickMultiple(Object.keys(PLATFORM_CONTENT_TYPES), 3) 
        : null,
      targetAudience: completionLevel !== 'minimal' ? {
        ageRange: pick(['25-45', '30-50', '18-35', '35-55']),
        gender: pick(['all', 'all', 'female', 'male']),
        location: location.region
      } : null,
      image: completionLevel !== 'minimal' 
        ? `https://images.unsplash.com/photo-${Math.random().toString(36).substr(2, 12)}?w=400&h=400&fit=crop` 
        : null,
      completionPercentage,
      isOnboarded,
      isCompleted
    };

    return profile;
  }

  /**
   * Generate an InfluencerProfile
   * @param {number} userId 
   * @param {object} options
   * @returns {object}
   */
  generateInfluencerProfile(userId, options = {}) {
    const { 
      completionLevel = 'complete',
      followerTier = 'auto' // 'micro', 'mid', 'macro', 'mega', 'auto'
    } = options;

    const categories = pickMultiple(INFLUENCER_CATEGORIES, 2);
    const primaryPlatform = pick(Object.keys(PLATFORM_CONTENT_TYPES));
    const location = pick(LOCATIONS);
    
    // Generate follower count based on tier
    const followers = this.generateFollowerCount(followerTier);
    const engagementRate = this.generateEngagementRate(followers);
    
    const contentTypes = pickMultiple(PLATFORM_CONTENT_TYPES[primaryPlatform], 3);
    
    // Completion percentage based on level
    const completionMap = {
      minimal: Math.floor(Math.random() * 30) + 10,
      partial: Math.floor(Math.random() * 40) + 40,
      complete: Math.floor(Math.random() * 15) + 85,
      onboarded: 100
    };
    const completionPercentage = completionMap[completionLevel] || 85;
    const isOnboarded = completionLevel === 'onboarded' || (completionLevel === 'complete' && Math.random() > 0.3);
    const isCompleted = completionLevel === 'onboarded' || completionLevel === 'complete';

    const profile = {
      userId,
      bio: completionLevel !== 'minimal' ? this.generateBio(categories) : null,
      image: completionLevel !== 'minimal' 
        ? `https://images.unsplash.com/photo-${Math.random().toString(36).substr(2, 12)}?w=400&h=400&fit=facearea` 
        : null,
      location: completionLevel !== 'minimal' ? `${location.city}, ${location.country}` : null,
      isCompleted,
      socialMediaLinks: completionLevel !== 'minimal' ? {
        instagram: `https://instagram.com/${this.generateHandle()}`,
        tiktok: Math.random() > 0.3 ? `https://tiktok.com/@${this.generateHandle()}` : null,
        youtube: Math.random() > 0.5 ? `https://youtube.com/@${this.generateHandle()}` : null,
        twitter: Math.random() > 0.6 ? `https://twitter.com/${this.generateHandle()}` : null
      } : {},
      primaryPlatform: completionLevel !== 'minimal' ? primaryPlatform : null,
      followersCount: completionLevel !== 'minimal' ? followers : '',
      engagementRate: completionLevel !== 'minimal' ? engagementRate : '',
      categories: completionLevel !== 'minimal' ? categories : null,
      contentTypes: completionLevel !== 'minimal' ? contentTypes : null,
      collaborationTypes: completionLevel !== 'minimal' 
        ? pickMultiple(COLLABORATION_TYPES, 3) 
        : null,
      audienceAgeRange: completionLevel !== 'minimal' 
        ? pick(['18-24', '18-34', '25-34', '25-44']) 
        : null,
      audienceGender: completionLevel !== 'minimal' 
        ? pick(['all', 'all', 'female', 'male']) 
        : null,
      audienceLocation: completionLevel !== 'minimal' ? location.region : null,
      interests: completionLevel !== 'minimal' ? pickMultiple(INTERESTS, 4) : null,
      completionPercentage,
      isOnboarded
    };

    return profile;
  }

  /**
   * Generate competitors for a brand
   * @param {string} industry 
   * @returns {Array}
   */
  generateCompetitors(industry) {
    const competitorCount = Math.floor(Math.random() * 3) + 2;
    const competitors = [];
    
    for (let i = 0; i < competitorCount; i++) {
      const name = generateCompanyName();
      competitors.push({
        name: name,
        website: `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        notes: Math.random() > 0.7 ? `Major player in ${industry}` : ''
      });
    }
    
    return competitors;
  }

  /**
   * Generate a unique selling point
   * @param {string} industry 
   * @param {string} brandName 
   * @returns {string}
   */
  generateUSPS(industry, brandName) {
    const templates = [
      `${brandName} delivers premium ${industry.toLowerCase()} solutions that prioritize customer satisfaction above all else.`,
      `We're revolutionizing ${industry.toLowerCase()} with innovative, sustainable approaches that set new industry standards.`,
      `Our mission is to make ${industry.toLowerCase()} accessible, affordable, and exceptional for everyone.`,
      `Combining cutting-edge technology with ${industry.toLowerCase()} expertise to deliver unparalleled results.`,
      `The only ${industry.toLowerCase()} brand that truly understands and anticipates customer needs.`
    ];
    return pick(templates);
  }

  /**
   * Generate product description
   * @param {string} industry 
   * @returns {string}
   */
  generateProductDescription(industry) {
    const descriptions = {
      'Technology & Apps': 'Mobile and web applications, SaaS platforms, and digital tools',
      'Health & Fitness': 'Fitness equipment, supplements, workout programs, and wellness apps',
      'Beauty & Cosmetics': 'Skincare, makeup, hair care, and beauty accessories',
      'Fashion & Apparel': 'Clothing, accessories, footwear, and lifestyle products',
      'Food & Beverage': 'Organic foods, beverages, meal kits, and specialty ingredients',
      'Travel & Hospitality': 'Travel booking, accommodations, experiences, and tourism services',
      'Gaming & Esports': 'Gaming hardware, accessories, software, and competitive gaming services',
      'Finance & Fintech': 'Banking services, investment tools, payment solutions, and financial planning'
    };
    
    return descriptions[industry] || `${industry} products and services`;
  }

  /**
   * Generate previous campaign description
   * @returns {string}
   */
  generatePreviousCampaignDescription() {
    const templates = [
      'Collaborated with 5 micro-influencers for our summer product launch campaign',
      'Ran a successful holiday campaign with lifestyle creators across Instagram and TikTok',
      'Partnered with tech reviewers for our flagship product release',
      'Executed a year-long ambassador program with 12 content creators',
      'Launched a UGC campaign that generated over 500 pieces of content',
      'Worked with industry experts for a thought leadership series'
    ];
    return pick(templates);
  }

  /**
   * Generate influencer bio
   * @param {string[]} categories 
   * @returns {string}
   */
  generateBio(categories) {
    const templates = [
      `Creating authentic content about ${categories.join(' & ')}. Let's inspire together! ✨`,
      `Your daily dose of ${categories[0].toLowerCase()} inspiration. DM for collaborations 📩`,
      `Helping you discover the best in ${categories.join(' and ')} 🌟`,
      `${categories[0]} enthusiast | Content creator | Living my best life 📸`,
      `Just a ${categories[0].toLowerCase()} lover sharing my journey and favorite finds 💫`,
      `Building a community around ${categories.join(' & ')}. Join the movement! 🚀`,
      `Real talk about ${categories[0].toLowerCase()}. No fluff, just value ✌️`
    ];
    return pick(templates);
  }

  /**
   * Generate a social media handle
   * @returns {string}
   */
  generateHandle() {
    const adjectives = ['real', 'the', 'official', 'hey', 'its', 'iam', 'mr', 'ms', 'dr'];
    const nouns = ['life', 'world', 'style', 'journey', 'vibes', 'daily', 'diaries', 'chronicles'];
    const suffixes = ['', 'official', 'hq', 'co', 'inc', `${Math.floor(Math.random() * 999)}`];
    
    return `${pick(adjectives)}${pick(nouns)}${pick(suffixes)}`.replace(/[^a-z0-9]/g, '');
  }

  /**
   * Generate follower count based on tier
   * @param {string} tier 
   * @returns {string}
   */
  generateFollowerCount(tier) {
    if (tier === 'auto') {
      // Weighted distribution
      const rand = Math.random();
      if (rand < 0.4) tier = 'micro';
      else if (rand < 0.7) tier = 'mid';
      else if (rand < 0.9) tier = 'macro';
      else tier = 'mega';
    }

    const ranges = {
      micro: [10000, 50000],
      mid: [50000, 200000],
      macro: [200000, 1000000],
      mega: [1000000, 10000000]
    };

    const [min, max] = ranges[tier] || ranges.mid;
    const count = Math.floor(Math.random() * (max - min) + min);
    
    // Format with commas
    return count.toLocaleString();
  }

  /**
   * Generate engagement rate based on follower count
   * @param {string} followersStr 
   * @returns {string}
   */
  generateEngagementRate(followersStr) {
    const followers = parseInt(followersStr.replace(/,/g, ''));
    
    // Higher followers = lower engagement typically
    let baseRate;
    if (followers < 50000) baseRate = 4.5;
    else if (followers < 200000) baseRate = 3.5;
    else if (followers < 1000000) baseRate = 2.5;
    else baseRate = 1.8;

    // Add variance
    const variance = (Math.random() - 0.5) * 2;
    const rate = Math.max(0.5, baseRate + variance);
    
    return rate.toFixed(1);
  }

  /**
   * Generate multiple owner profiles
   * @param {Array} ownerUsers - Array of user objects with ids
   * @param {object} options
   * @returns {Array}
   */
  generateOwnerProfiles(ownerUsers, options = {}) {
    return ownerUsers.map(user => 
      this.generateOwnerProfile(user.id, options)
    );
  }

  /**
   * Generate multiple influencer profiles
   * @param {Array} influencerUsers - Array of user objects with ids
   * @param {object} options
   * @returns {Array}
   */
  generateInfluencerProfiles(influencerUsers, options = {}) {
    return influencerUsers.map(user => 
      this.generateInfluencerProfile(user.id, options)
    );
  }
}

module.exports = new ProfileFactory();
