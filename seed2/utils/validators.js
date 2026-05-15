/**
 * Seed Data Validators
 * 
 * Validates seed data before insertion against Sequelize model constraints.
 * Prevents insertion failures by catching issues early.
 */

// Model ENUM definitions (MUST match models exactly)
const ENUMS = {
  UserStatus: ['ACTIVE', 'BLOCKED', 'SUSPENDED', 'INCOMPLETE'],
  RoleName: ['OWNER', 'INFLUENCER', 'ADMIN'],
  CompanySize: ['Solo', 'Small', 'Mid', 'Enterprise'],
  CampaignLifecycleStage: ['draft', 'ai_generated', 'saved', 'completed', 'cancelled'],
  CampaignGoal: ['Awareness', 'Leads', 'Sales', 'Retention', 'Re-engagement'],
  KPIMetric: ['impressions', 'reach', 'engagement_rate', 'conversions', 'ROAS', 'CPA', 'CTR'],
  TargetAudienceGender: ['all', 'male', 'female', 'custom'],
  ContentCalendarPlatform: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'],
  ContentCalendarContentType: ['video', 'carousel', 'story', 'reel', 'post', 'article'],
  ContentCalendarStatus: ['scheduled', 'posted', 'failed'],
  CollaborationStatus: ['pending_contract_sign', 'live', 'in_progress', 'completed', 'cancelled'],
  CollaborationRequestStatus: ['pending', 'negotiating', 'accepted', 'rejected', 'cancelled', 'expired'],
  CollaborationContractStatus: ['sent', 'partially_signed', 'signed', 'cancelled'],
  CollaborationTaskStatus: ['todo', 'in_progress', 'in_review', 'approved', 'rejected'],
  CollaborationTaskPlatform: ['instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin', 'snapchat', 'whatsapp', 'other'],
  CollaborationTaskContentType: ['post', 'story', 'reel', 'video', 'carousel', 'article', 'tweet', 'poll'],
  ScheduledPostContentType: ['post', 'story', 'reel', 'video', 'carousel', 'article'],
  ChatRoomType: ['one_to_one', 'group'],
  ChatParticipantRole: ['owner', 'influencer', 'admin'],
  MessageStatus: ['sent', 'delivered', 'read'],
  ChannelStatus: ['active', 'disconnected', 'expired'],
  ChannelPlatform: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'],
  ScheduledPostStatus: ['draft', 'scheduled', 'published', 'failed'],
  NotificationType: [
    'CAMPAIGN_INVITATION', 'CAMPAIGN_PUBLISHED', 'CAMPAIGN_APPROVED', 'CAMPAIGN_REJECTED',
    'AI_CAMPAIGN_READY', 'CONTRACT_CREATED', 'CONTRACT_SENT', 'CONTRACT_SIGNED',
    'OFFER_MADE', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'PROPOSAL_SUBMITTED',
    'PROPOSAL_ACCEPTED', 'PROPOSAL_REJECTED', 'TASK_ASSIGNED', 'TASK_STARTED',
    'TASK_SUBMITTED', 'TASK_APPROVED', 'TASK_REJECTED', 'TASK_FINAL_REJECTED',
    'FILE_UPLOADED', 'MESSAGE_RECEIVED'
  ]
};

class Validators {
  /**
   * Validate email format
   * @param {string} email 
   * @returns {boolean}
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   * @param {string} url 
   * @returns {boolean}
   */
  static isValidUrl(url) {
    if (!url) return true; // Allow null
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate enum value
   * @param {string} value 
   * @param {string} enumName 
   * @returns {boolean}
   */
  static isValidEnum(value, enumName) {
    const validValues = ENUMS[enumName];
    if (!validValues) {
      throw new Error(`Unknown enum: ${enumName}`);
    }
    return validValues.includes(value);
  }

  /**
   * Validate string length
   * @param {string} value 
   * @param {number} min 
   * @param {number} max 
   * @returns {boolean}
   */
  static isValidLength(value, min, max) {
    if (!value) return true; // Allow null if nullable
    const len = value.length;
    return len >= min && len <= max;
  }

  /**
   * Validate numeric range
   * @param {number} value 
   * @param {number} min 
   * @param {number} max 
   * @returns {boolean}
   */
  static isValidRange(value, min, max) {
    if (value === null || value === undefined) return true;
    return value >= min && value <= max;
  }

  /**
   * Validate User data
   * @param {object} data 
   * @returns {string[]}
   */
  static validateUser(data) {
    const errors = [];
    
    if (!data.firstName || data.firstName.length < 2 || data.firstName.length > 50) {
      errors.push(`firstName must be 2-50 chars, got: ${data.firstName}`);
    }
    if (!data.lastName || data.lastName.length < 2 || data.lastName.length > 50) {
      errors.push(`lastName must be 2-50 chars, got: ${data.lastName}`);
    }
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push(`Invalid email: ${data.email}`);
    }
    if (data.password && (data.password.length < 6 || data.password.length > 100)) {
      errors.push(`password must be 6-100 chars if provided`);
    }
    if (!this.isValidEnum(data.status, 'UserStatus')) {
      errors.push(`Invalid User.status: ${data.status}`);
    }
    
    return errors;
  }

  /**
   * Validate Campaign data
   * @param {object} data 
   * @returns {string[]}
   */
  static validateCampaign(data) {
    const errors = [];
    
    if (!data.campaignName || data.campaignName.length < 3 || data.campaignName.length > 100) {
      errors.push(`campaignName must be 3-100 chars, got: ${data.campaignName}`);
    }
    if (!this.isValidEnum(data.lifecycleStage, 'CampaignLifecycleStage')) {
      errors.push(`Invalid Campaign.lifecycleStage: ${data.lifecycleStage}`);
    }
    if (data.campaign_goal && !this.isValidEnum(data.campaign_goal, 'CampaignGoal')) {
      errors.push(`Invalid Campaign.campaign_goal: ${data.campaign_goal}`);
    }
    if (data.campaign_duration_weeks && data.campaign_duration_weeks < 1) {
      errors.push(`campaign_duration_weeks must be >= 1, got: ${data.campaign_duration_weeks}`);
    }
    
    // Date validation
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (start >= end) {
        errors.push(`startDate must be before endDate`);
      }
    }
    
    return errors;
  }

  /**
   * Validate CollaborationRequest data
   * @param {object} data 
   * @returns {string[]}
   */
  static validateCollaborationRequest(data) {
    const errors = [];
    
    if (!this.isValidEnum(data.status, 'CollaborationRequestStatus')) {
      errors.push(`Invalid CollaborationRequest.status: ${data.status}`);
    }
    if (data.proposedBudget !== null && data.proposedBudget < 0) {
      errors.push(`proposedBudget cannot be negative`);
    }
    if (data.counterPrice !== null && data.counterPrice < 0) {
      errors.push(`counterPrice cannot be negative`);
    }
    
    return errors;
  }

  /**
   * Validate Collaboration data
   * @param {object} data 
   * @returns {string[]}
   */
  static validateCollaboration(data) {
    const errors = [];
    
    if (!this.isValidEnum(data.status, 'CollaborationStatus')) {
      errors.push(`Invalid Collaboration.status: ${data.status}`);
    }
    
    // Business logic validation
    if (data.status === 'completed' && !data.completedAt) {
      errors.push(`Collaboration with status 'completed' should have completedAt`);
    }
    if (data.status === 'cancelled' && !data.cancelledAt) {
      errors.push(`Collaboration with status 'cancelled' should have cancelledAt`);
    }
    
    return errors;
  }

  /**
   * Validate CollaborationTask data
   * @param {object} data 
   * @returns {string[]}
   */
  static validateCollaborationTask(data) {
    const errors = [];
    
    if (!data.taskName || data.taskName.length < 3 || data.taskName.length > 200) {
      errors.push(`taskName must be 3-200 chars, got: ${data.taskName}`);
    }
    if (!this.isValidEnum(data.status, 'CollaborationTaskStatus')) {
      errors.push(`Invalid CollaborationTask.status: ${data.status}`);
    }
    if (data.platform && !this.isValidEnum(data.platform, 'CollaborationTaskPlatform')) {
      errors.push(`Invalid CollaborationTask.platform: ${data.platform}`);
    }
    if (data.contentType && !this.isValidEnum(data.contentType, 'CollaborationTaskContentType')) {
      errors.push(`Invalid CollaborationTask.contentType: ${data.contentType}`);
    }
    
    return errors;
  }

  /**
   * Validate Review data
   * @param {object} data 
   * @returns {string[]}
   */
  static validateReview(data) {
    const errors = [];
    
    if (!this.isValidRange(data.rating, 1, 5)) {
      errors.push(`rating must be 1-5, got: ${data.rating}`);
    }
    
    return errors;
  }

  /**
   * Validate Notification data
   * @param {object} data 
   * @returns {string[]}
   */
  static validateNotification(data) {
    const errors = [];
    
    if (!this.isValidEnum(data.type, 'NotificationType')) {
      errors.push(`Invalid Notification.type: ${data.type}`);
    }
    if (!data.message || data.message.length === 0) {
      errors.push(`Notification.message cannot be empty`);
    }
    
    return errors;
  }

  /**
   * Validate Message data
   * @param {object} data 
   * @returns {string[]}
   */
  static validateMessage(data) {
    const errors = [];
    
    if (!data.content || data.content.length === 0) {
      errors.push(`Message.content cannot be empty`);
    }
    if (!this.isValidEnum(data.status, 'MessageStatus')) {
      errors.push(`Invalid Message.status: ${data.status}`);
    }
    
    return errors;
  }

  /**
   * Run all validations and throw if errors found
   * @param {string} entityType 
   * @param {object} data 
   * @param {string[]} errors 
   */
  static assertValid(entityType, data, errors) {
    if (errors.length > 0) {
      console.error(`\n❌ Validation failed for ${entityType}:`);
      errors.forEach(err => console.error(`   - ${err}`));
      console.error(`Data:`, JSON.stringify(data, null, 2));
      throw new Error(`Validation failed for ${entityType}: ${errors.join(', ')}`);
    }
  }
}

module.exports = { Validators, ENUMS };
