const { Notification, User, Collaboration } = require('../models');
const { Op } = require('sequelize');
const { emitToUser } = require('../socket');

class NotificationService {
  // async create({ userId, title, message, type }) {
  //   return this.createNotification({
  //     userId,
  //     type: 'CAMPAIGN_PUBLISHED',
  //     message: title ? `${title}: ${message}` : message,
  //     entityType: type || 'notification'
  //   });
  // }

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
          userId: notification.userId,
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
            userId: notification.userId,
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
    const owner = await User.findByPk(ownerId, { attributes: ['firstName', 'lastName'] });
    
    return this.createNotification({
      userId: influencerId,
      type: 'CAMPAIGN_INVITATION',
      message: `${owner.firstName} ${owner.lastName} sent you a collaboration request for "${campaignName}"`,
      entityType: 'CollaborationRequest',
      entityId: collaborationRequestId,
      metadata: {
        actionUrl: `/collaborations/requests/${collaborationRequestId}`
      }
    });
  }

  /**
   * Notify about collaboration request accepted
   */
  async notifyCollaborationAccepted(ownerId, influencerId, collaborationId, campaignName) {
    const influencer = await User.findByPk(influencerId, { attributes: ['firstName', 'lastName'] });
    
    return this.createNotification({
      userId: ownerId,
      type: 'CAMPAIGN_APPROVED',
      message: `${influencer.firstName} ${influencer.lastName} accepted your collaboration request for "${campaignName}"`,
      entityType: 'Collaboration',
      entityId: collaborationId,
      metadata: {
        actionUrl: `/collaborations/${collaborationId}`
      }
    });
  }

  /**
   * Notify about collaboration request rejected
   */
  async notifyCollaborationRejected(ownerId, influencerId, collaborationRequestId, campaignName) {
    const influencer = await User.findByPk(influencerId, { attributes: ['firstName', 'lastName'] });
    
    return this.createNotification({
      userId: ownerId,
      type: 'CAMPAIGN_REJECTED',
      message: `${influencer.firstName} ${influencer.lastName} declined your collaboration request for "${campaignName}"`,
      entityType: 'CollaborationRequest',
      entityId: collaborationRequestId,
      metadata: {
        actionUrl: `/collaborations/requests/${collaborationRequestId}`
      }
    });
  }

  /**
   * Notify the collaboration influencer about a new or updated task assignment.
   * Never notifies the campaign owner.
   */
  async notifyTaskAssigned(influencerId, taskId, taskTitle, collaborationId, { ownerId } = {}) {
    if (!influencerId) {
      console.warn('notifyTaskAssigned: missing influencerId, skipping notification');
      return null;
    }

    const collaboration = await Collaboration.findByPk(collaborationId, {
      attributes: ['ownerId', 'influencerId']
    });
    const actualOwnerId = ownerId ?? collaboration?.ownerId;
    const actualInfluencerId = collaboration?.influencerId ?? influencerId;

    if (actualOwnerId != null && Number(actualInfluencerId) === Number(actualOwnerId)) {
      console.warn('notifyTaskAssigned: influencerId equals ownerId, skipping notification');
      return null;
    }

    return this.createNotification({
      userId: actualInfluencerId,
      type: 'TASK_ASSIGNED',
      message: `You have been assigned a new task: "${taskTitle}"`,
      entityType: 'CollaborationTask',
      entityId: taskId,
      metadata: {
        actionUrl: `/collaborations/${collaborationId}/tasks/${taskId}`,
        collaborationId,
        recipientRole: 'influencer',
      },
    });
  }

  async notifyTaskStarted(ownerId, taskId, taskTitle, collaborationId) {
    return this.createNotification({
      userId: ownerId,
      type: 'TASK_STARTED',
      message: `Task "${taskTitle}" has been started`,
      entityType: 'CollaborationTask',
      entityId: taskId,
      metadata: {
        actionUrl: `/collaborations/${collaborationId}/tasks/${taskId}`
      }
    });
  }

  /**
   * Notify about task submitted
   */
  async notifyTaskSubmitted(ownerId, taskId, taskTitle, collaborationId, influencerName) {
    return this.createNotification({
      userId: ownerId,
      type: 'TASK_SUBMITTED',
      message: `${influencerName} submitted "${taskTitle}" for your review`,
      entityType: 'CollaborationTask',
      entityId: taskId,
      metadata: {
        actionUrl: `/collaborations/${collaborationId}/tasks/${taskId}`
      }
    });
  }

  /**
   * Notify about task approved
   */
  async notifyTaskApproved(influencerId, taskId, taskTitle, collaborationId) {
    return this.createNotification({
      userId: influencerId,
      type: 'TASK_APPROVED',
      message: `Your task "${taskTitle}" has been approved`,
      entityType: 'CollaborationTask',
      entityId: taskId,
      metadata: {
        actionUrl: `/collaborations/${collaborationId}/tasks/${taskId}`
      }
    });
  }

  /**
   * Notify about task rejected
   */
  async notifyTaskRejected(influencerId, taskId, taskTitle, collaborationId, feedback) {
    return this.createNotification({
      userId: influencerId,
      type: 'TASK_REJECTED',
      message: `Your task "${taskTitle}" needs revision. Feedback: ${feedback}`,
      entityType: 'CollaborationTask',
      entityId: taskId,
      metadata: {
        actionUrl: `/collaborations/${collaborationId}/tasks/${taskId}`
      }
    });
  }

  async notifyTaskFinalRejected(influencerId, taskId, taskTitle, collaborationId, feedback) {
    return this.createNotification({
      userId: influencerId,
      type: 'TASK_FINAL_REJECTED',
      message: `Your task "${taskTitle}" was permanently rejected. Feedback: ${feedback}`,
      entityType: 'CollaborationTask',
      entityId: taskId,
      metadata: {
        actionUrl: `/collaborations/${collaborationId}/tasks/${taskId}`
      }
    });
  }

  async notifyFileUploaded(userId, entityType, entityId, fileUrl) {
    return this.createNotification({
      userId,
      type: 'FILE_UPLOADED',
      message: 'File uploaded successfully',
      entityType: entityType || 'Upload',
      entityId: entityId || null,
      metadata: {
        fileUrl
      }
    });
  }

  async notifyMessageReceived(userId, messageId, chatRoomId, senderName) {
    return this.createNotification({
      userId,
      type: 'MESSAGE_RECEIVED',
      message: `New message from ${senderName}`,
      entityType: 'Message',
      entityId: messageId,
      metadata: {
        chatRoomId,
        actionUrl: `/chat/rooms/${chatRoomId}`
      }
    });
  }

  /**
   * Notify about new offer
   */
  async notifyNewOffer(influencerId, offerId, serviceListingId, ownerName, amount) {
    return this.createNotification({
      userId: influencerId,
      type: 'OFFER_MADE',
      message: `${ownerName} sent you an offer of $${amount}`,
      entityType: 'Offer',
      entityId: offerId,
      metadata: {
        serviceListingId,
        actionUrl: `/offers/${offerId}`
      }
    });
  }

  /**
   * Notify about offer accepted
   */
  async notifyOfferAccepted(ownerId, offerId, influencerName) {
    return this.createNotification({
      userId: ownerId,
      type: 'OFFER_ACCEPTED',
      message: `${influencerName} accepted your offer`,
      entityType: 'Offer',
      entityId: offerId,
      metadata: {
        actionUrl: `/offers/${offerId}`
      }
    });
  }

  /**
   * Notify about campaign milestone
   */
  async notifyCampaignMilestone(userId, campaignId, campaignName, milestone) {
    return this.createNotification({
      userId,
      type: 'CAMPAIGN_APPROVED',
      message: `Your campaign "${campaignName}" ${milestone}`,
      entityType: 'Campaign',
      entityId: campaignId,
      metadata: {
        actionUrl: `/campaigns/${campaignId}`
      }
    });
  }

  /**
   * Notify about budget alert
   */
  async notifyBudgetAlert(userId, campaignId, campaignName, percentage) {
    return this.createNotification({
      userId,
      type: 'CAMPAIGN_REJECTED',
      message: `Your campaign "${campaignName}" has used ${percentage}% of its budget`,
      entityType: 'Campaign',
      entityId: campaignId,
      metadata: {
        actionUrl: `/campaigns/${campaignId}`
      }
    });
  }

  /**
   * System announcement
   */
  async notifySystemAnnouncement(userIds, title, message, actionUrl = null) {
    const notifications = userIds.map(userId => ({
      userId,
      type: 'CAMPAIGN_PUBLISHED',
      message,
      entityType: 'System',
      entityId: null,
      metadata: {
        title,
        actionUrl
      },
      isRead: false
    }));

    return this.createBulkNotifications(notifications);
  }
}

module.exports = new NotificationService();
