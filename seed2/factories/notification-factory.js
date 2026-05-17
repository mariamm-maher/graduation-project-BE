/**
 * Notification Factory
 * 
 * Generates realistic Notification seed data.
 */

const { pick, pickMultiple } = require('../data/names');
const { NOTIFICATION_MESSAGES } = require('../data/constants');
const { Validators } = require('../utils/validators');

class NotificationFactory {
  constructor() {
    // Track notification types to ensure good distribution
    this.typeCounts = new Map();
  }

  /**
   * Generate a notification
   * @param {number} userId 
   * @param {string} type 
   * @param {object} context 
   * @param {object} options
   * @returns {object}
   */
  generateNotification(userId, type, context = {}, options = {}) {
    const message = this.generateMessage(type, context);
    const isRead = options.isRead !== undefined ? options.isRead : Math.random() > 0.6;
    const readAt = isRead ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null;

    const notification = {
      userId,
      type,
      message,
      entityType: context.entityType || null,
      entityId: context.entityId || null,
      metadata: context.metadata || null,
      isRead,
      readAt
    };

    // Validate
    const errors = Validators.validateNotification(notification);
    Validators.assertValid('Notification', notification, errors);

    // Track type
    this.typeCounts.set(type, (this.typeCounts.get(type) || 0) + 1);

    return notification;
  }

  /**
   * Generate notification message
   * @param {string} type 
   * @param {object} context 
   * @returns {string}
   */
  generateMessage(type, context) {
    const generator = NOTIFICATION_MESSAGES[type];
    if (!generator) {
      return `Notification: ${type}`;
    }
    return generator(context);
  }

  /**
   * Generate campaign-related notifications
   * @param {number} userId 
   * @param {object} campaign 
   * @returns {Array}
   */
  generateCampaignNotifications(userId, campaign) {
    const notifications = [];
    const context = {
      campaignName: campaign.campaignName,
      entityType: 'Campaign',
      entityId: campaign.id
    };

    // AI Campaign Ready
    notifications.push(this.generateNotification(userId, 'AI_CAMPAIGN_READY', context));

    // Published
    if (campaign.isPublished) {
      notifications.push(this.generateNotification(userId, 'CAMPAIGN_PUBLISHED', context, { isRead: true }));
    }

    return notifications;
  }

  /**
   * Generate collaboration request notifications
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {object} request 
   * @returns {Array}
   */
  generateRequestNotifications(ownerId, influencerId, request) {
    const notifications = [];

    // Owner receives confirmation of sending
    notifications.push(this.generateNotification(ownerId, 'PROPOSAL_SUBMITTED', {
      entityType: 'CollaborationRequest',
      entityId: request.id,
      metadata: { status: request.status }
    }));

    // Influencer receives invitation
    notifications.push(this.generateNotification(influencerId, 'OFFER_MADE', {
      entityType: 'CollaborationRequest',
      entityId: request.id,
      metadata: { amount: request.proposedBudget }
    }));

    // Response notifications if applicable
    if (request.status === 'accepted') {
      notifications.push(this.generateNotification(ownerId, 'OFFER_ACCEPTED', {
        entityType: 'CollaborationRequest',
        entityId: request.id
      }, { isRead: true }));
    } else if (request.status === 'rejected') {
      notifications.push(this.generateNotification(ownerId, 'OFFER_REJECTED', {
        entityType: 'CollaborationRequest',
        entityId: request.id
      }, { isRead: true }));
    }

    return notifications;
  }

  /**
   * Generate collaboration notifications
   * @param {number} ownerId 
   * @param {number} influencerId 
   * @param {object} collaboration 
   * @param {Array} tasks 
   * @returns {Array}
   */
  generateCollaborationNotifications(ownerId, influencerId, collaboration, tasks = []) {
    const notifications = [];

    // Contract created
    notifications.push(this.generateNotification(influencerId, 'CONTRACT_CREATED', {
      entityType: 'Collaboration',
      entityId: collaboration.id
    }));

    // Task notifications — influencer only for new assignments
    tasks.forEach(task => {
      notifications.push(this.generateNotification(influencerId, 'TASK_ASSIGNED', {
        entityType: 'CollaborationTask',
        entityId: task.id,
        metadata: { taskName: task.taskName }
      }));

      // Progress notifications based on task status
      if (task.status === 'in_progress') {
        notifications.push(this.generateNotification(ownerId, 'TASK_STARTED', {
          entityType: 'CollaborationTask',
          entityId: task.id,
          metadata: { taskName: task.taskName }
        }, { isRead: true }));
      }

      if (task.status === 'in_review') {
        notifications.push(this.generateNotification(ownerId, 'TASK_SUBMITTED', {
          entityType: 'CollaborationTask',
          entityId: task.id,
          metadata: { taskName: task.taskName }
        }));
      }

      if (task.status === 'approved') {
        notifications.push(this.generateNotification(influencerId, 'TASK_APPROVED', {
          entityType: 'CollaborationTask',
          entityId: task.id,
          metadata: { taskName: task.taskName }
        }, { isRead: true }));
      }
    });

    return notifications;
  }

  /**
   * Generate message notifications
   * @param {number} recipientId 
   * @param {number} senderId 
   * @param {object} sender 
   * @returns {object}
   */
  generateMessageNotification(recipientId, senderId, sender) {
    return this.generateNotification(recipientId, 'MESSAGE_RECEIVED', {
      entityType: 'Message',
      entityId: null, // Would be message id
      metadata: { 
        senderName: `${sender.firstName} ${sender.lastName}`,
        senderId
      }
    }, { isRead: false });
  }

  /**
   * Generate random notifications for a user
   * @param {number} userId 
   * @param {number} count 
   * @returns {Array}
   */
  generateRandomNotifications(userId, count = 10) {
    const notifications = [];
    const types = [
      'CAMPAIGN_INVITATION', 'AI_CAMPAIGN_READY', 'CONTRACT_SENT',
      'TASK_ASSIGNED', 'MESSAGE_RECEIVED', 'FILE_UPLOADED'
    ];

    for (let i = 0; i < count; i++) {
      const type = pick(types);
      const isRead = Math.random() > 0.4;
      const readAt = isRead 
        ? new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) 
        : null;

      notifications.push(this.generateNotification(userId, type, {
        entityType: pick(['Campaign', 'Collaboration', 'CollaborationTask', 'ChatRoom']),
        entityId: Math.floor(Math.random() * 100) + 1
      }, { isRead }));
    }

    return notifications;
  }

  /**
   * Generate notifications for multiple users
   * @param {Array} users 
   * @param {number} countPerUser 
   * @returns {Array}
   */
  generateForUsers(users, countPerUser = 8) {
    const allNotifications = [];

    users.forEach(user => {
      const notifications = this.generateRandomNotifications(user.id, countPerUser);
      allNotifications.push(...notifications);
    });

    return allNotifications;
  }

  /**
   * Get notification type distribution
   * @returns {object}
   */
  getTypeDistribution() {
    return Object.fromEntries(this.typeCounts);
  }
}

module.exports = new NotificationFactory();
