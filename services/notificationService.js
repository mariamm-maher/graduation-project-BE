const { Notification, User } = require('../models');
const { Op } = require('sequelize');
const { emitToUser } = require('../socket');

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification({
    userId,
    type,
    message,
    entityType = null,
    entityId = null,
    metadata = {}
  }) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        message,
        entityType,
        entityId,
        metadata,
        isRead: false
      });

      // Emit real-time notification via Socket.io
      try {
        emitToUser(userId, 'notification', {
          id: notification.id,
          type: notification.type,
          message: notification.message,
          entityType: notification.entityType,
          entityId: notification.entityId,
          metadata: notification.metadata,
          isRead: false,
          createdAt: notification.createdAt
        });

        // Update unread count
        const unreadCount = await this.getUnreadCount(userId);
        emitToUser(userId, 'notification_count_updated', { unreadCount });
      } catch (socketError) {
        // Log but don't fail if socket emission fails
        console.error('Socket emission failed:', socketError);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create multiple notifications (bulk)
   */
  async createBulkNotifications(notifications) {
    try {
      const createdNotifications = await Notification.bulkCreate(notifications);

      // Emit to each user
      for (const notification of createdNotifications) {
        try {
          emitToUser(notification.userId, 'notification', {
            id: notification.id,
            type: notification.type,
            message: notification.message,
            entityType: notification.entityType,
            entityId: notification.entityId,
            metadata: notification.metadata,
            isRead: false,
            createdAt: notification.createdAt
          });

          const unreadCount = await this.getUnreadCount(notification.userId);
          emitToUser(notification.userId, 'notification_count_updated', { unreadCount });
        } catch (socketError) {
          console.error('Socket emission failed:', socketError);
        }
      }

      return createdNotifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get notifications for user with pagination and filters
   */
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      type = null,
      isRead = null
    } = options;

    const offset = (page - 1) * limit;
    const where = { userId };

    if (type) {
      where.type = type;
    }

    if (isRead !== null) {
      where.isRead = isRead;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalNotifications: count,
        hasMore: offset + notifications.length < count
      }
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        return false;
      }

      await notification.update({ isRead: true, readAt: new Date() });

      // Emit update via Socket.io
      try {
        emitToUser(userId, 'notification_read', { notificationId });
        const unreadCount = await this.getUnreadCount(userId);
        emitToUser(userId, 'notification_count_updated', { unreadCount });
      } catch (socketError) {
        console.error('Socket emission failed:', socketError);
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    try {
      await Notification.update(
        { isRead: true, readAt: new Date() },
        {
          where: {
            userId,
            isRead: false
          }
        }
      );

      // Emit update via Socket.io
      try {
        emitToUser(userId, 'all_notifications_read');
        emitToUser(userId, 'notification_count_updated', { unreadCount: 0 });
      } catch (socketError) {
        console.error('Socket emission failed:', socketError);
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.destroy({
        where: { id: notificationId, userId }
      });

      if (result > 0) {
        // Update unread count
        const unreadCount = await this.getUnreadCount(userId);
        emitToUser(userId, 'notification_count_updated', { unreadCount });
      }

      return result > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all read notifications for user
   */
  async deleteAllRead(userId) {
    try {
      const result = await Notification.destroy({
        where: {
          userId,
          isRead: true
        }
      });

      return result;
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      throw error;
    }
  }

  /**
   * Delete expired notifications (cleanup job)
   */
  async deleteExpiredNotifications() {
    try {
      const result = await Notification.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });

      console.log(`Deleted ${result} expired notifications`);
      return result;
    } catch (error) {
      console.error('Error deleting expired notifications:', error);
      throw error;
    }
  }

  // ========================================
  // NOTIFICATION TRIGGERS (Helper Methods)
  // ========================================

  /**
   * Notify about new collaboration request
   */
  async notifyCollaborationRequest(influencerId, ownerId, collaborationRequestId, campaignName) {
    const owner = await User.findByPk(ownerId, { attributes: ['firstName', 'lastName', 'avatar'] });
    
    return this.createNotification({
      userId: influencerId,
      category: 'collaboration',
      type: 'collaboration_request',
      title: 'New Collaboration Request',
      message: `${owner.firstName} ${owner.lastName} sent you a collaboration request for "${campaignName}"`,
      relatedId: collaborationRequestId,
      actionUrl: `/collaborations/requests/${collaborationRequestId}`,
      imageUrl: owner.avatar
    });
  }

  /**
   * Notify about collaboration request accepted
   */
  async notifyCollaborationAccepted(ownerId, influencerId, collaborationId, campaignName) {
    const influencer = await User.findByPk(influencerId, { attributes: ['firstName', 'lastName', 'avatar'] });
    
    return this.createNotification({
      userId: ownerId,
      category: 'collaboration',
      type: 'collaboration_accepted',
      title: 'Collaboration Request Accepted',
      message: `${influencer.firstName} ${influencer.lastName} accepted your collaboration request for "${campaignName}"`,
      relatedId: collaborationId,
      actionUrl: `/collaborations/${collaborationId}`,
      imageUrl: influencer.avatar
    });
  }

  /**
   * Notify about collaboration request rejected
   */
  async notifyCollaborationRejected(ownerId, influencerId, collaborationRequestId, campaignName) {
    const influencer = await User.findByPk(influencerId, { attributes: ['firstName', 'lastName'] });
    
    return this.createNotification({
      userId: ownerId,
      category: 'collaboration',
      type: 'collaboration_rejected',
      title: 'Collaboration Request Declined',
      message: `${influencer.firstName} ${influencer.lastName} declined your collaboration request for "${campaignName}"`,
      relatedId: collaborationRequestId,
      actionUrl: `/collaborations/requests/${collaborationRequestId}`
    });
  }

  /**
   * Notify about task assigned
   */
  async notifyTaskAssigned(userId, taskId, taskTitle, collaborationId) {
    return this.createNotification({
      userId,
      category: 'task',
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${taskTitle}"`,
      relatedId: taskId,
      actionUrl: `/collaborations/${collaborationId}/tasks/${taskId}`
    });
  }

  /**
   * Notify about task submitted
   */
  async notifyTaskSubmitted(ownerId, taskId, taskTitle, collaborationId, influencerName) {
    return this.createNotification({
      userId: ownerId,
      category: 'task',
      type: 'task_submitted',
      title: 'Task Submitted for Review',
      message: `${influencerName} submitted "${taskTitle}" for your review`,
      relatedId: taskId,
      actionUrl: `/collaborations/${collaborationId}/tasks/${taskId}`
    });
  }

  /**
   * Notify about task approved
   */
  async notifyTaskApproved(influencerId, taskId, taskTitle, collaborationId) {
    return this.createNotification({
      userId: influencerId,
      category: 'task',
      type: 'task_approved',
      title: 'Task Approved',
      message: `Your task "${taskTitle}" has been approved`,
      relatedId: taskId,
      actionUrl: `/collaborations/${collaborationId}/tasks/${taskId}`
    });
  }

  /**
   * Notify about task rejected
   */
  async notifyTaskRejected(influencerId, taskId, taskTitle, collaborationId, feedback) {
    return this.createNotification({
      userId: influencerId,
      category: 'task',
      type: 'task_rejected',
      title: 'Task Needs Revision',
      message: `Your task "${taskTitle}" needs revision. Feedback: ${feedback}`,
      relatedId: taskId,
      actionUrl: `/collaborations/${collaborationId}/tasks/${taskId}`
    });
  }

  /**
   * Notify about new offer
   */
  async notifyNewOffer(influencerId, offerId, serviceListingId, ownerName, amount) {
    return this.createNotification({
      userId: influencerId,
      category: 'offer',
      type: 'offer_received',
      title: 'New Offer Received',
      message: `${ownerName} sent you an offer of $${amount}`,
      relatedId: offerId,
      actionUrl: `/offers/${offerId}`
    });
  }

  /**
   * Notify about offer accepted
   */
  async notifyOfferAccepted(ownerId, offerId, influencerName) {
    return this.createNotification({
      userId: ownerId,
      category: 'offer',
      type: 'offer_accepted',
      title: 'Offer Accepted',
      message: `${influencerName} accepted your offer`,
      relatedId: offerId,
      actionUrl: `/offers/${offerId}`
    });
  }

  /**
   * Notify about campaign milestone
   */
  async notifyCampaignMilestone(userId, campaignId, campaignName, milestone) {
    return this.createNotification({
      userId,
      category: 'campaign',
      type: 'campaign_milestone',
      title: 'Campaign Milestone Reached',
      message: `Your campaign "${campaignName}" ${milestone}`,
      relatedId: campaignId,
      actionUrl: `/campaigns/${campaignId}`
    });
  }

  /**
   * Notify about budget alert
   */
  async notifyBudgetAlert(userId, campaignId, campaignName, percentage) {
    return this.createNotification({
      userId,
      category: 'campaign',
      type: 'budget_alert',
      title: 'Budget Alert',
      message: `Your campaign "${campaignName}" has used ${percentage}% of its budget`,
      relatedId: campaignId,
      actionUrl: `/campaigns/${campaignId}`
    });
  }

  /**
   * System announcement
   */
  async notifySystemAnnouncement(userIds, title, message, actionUrl = null) {
    const notifications = userIds.map(userId => ({
      userId,
      category: 'system',
      type: 'system_announcement',
      title,
      message,
      actionUrl,
      isRead: false
    }));

    return this.createBulkNotifications(notifications);
  }
}

module.exports = new NotificationService();
