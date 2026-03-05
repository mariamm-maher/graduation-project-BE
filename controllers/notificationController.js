const { Notification, User } = require('../models');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');
const { logAction } = require('../services/logServices'); 

// @desc    Get all user notifications (paginated)
// @route   GET /api/notifications
// @access  Private (authenticated user)
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: { userId: req.user.id },
      attributes: ['id', 'message', 'type', 'isRead', 'createdAt'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Log the fetch (fire-and-forget, as in authController)
    try {
      await logAction({ req, action: 'FETCH_NOTIFICATIONS', entity: 'Notification', entityId: null, meta: { userId: req.user.id, count } });
    } catch (e) {
      // non-blocking
    }

    sendSuccess(res, 200, 'Notifications retrieved successfully', {
      notifications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread
// @access  Private (authenticated user)
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    // Log the fetch
    try {
      await logAction({ req, action: 'FETCH_UNREAD_COUNT', entity: 'Notification', entityId: null, meta: { userId: req.user.id, count } });
    } catch (e) {
      // non-blocking
    }

    sendSuccess(res, 200, 'Unread count retrieved successfully', {
      unread: count
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private (authenticated user)
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new AppError('Notification ID is required', 400));
    }

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    await notification.update({ isRead: true });

    // Log the update
    try {
      await logAction({ req, action: 'MARK_READ', entity: 'Notification', entityId: id, meta: { userId: req.user.id } });
    } catch (e) {
      // non-blocking
    }

    sendSuccess(res, 200, 'Notification marked as read successfully', { notification });
  } catch (error) {
    return next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private (authenticated user)
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          isRead: false
        }
      }
    );

    // Log the bulk update
    try {
      await logAction({ req, action: 'MARK_ALL_READ', entity: 'Notification', entityId: null, meta: { userId: req.user.id } });
    } catch (e) {
      // non-blocking
    }

    sendSuccess(res, 200, 'All notifications marked as read successfully', null);
  } catch (error) {
    return next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private (authenticated user)
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new AppError('Notification ID is required', 400));
    }

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    await notification.destroy();

    // Log the delete
    try {
      await logAction({ req, action: 'DELETE_NOTIFICATION', entity: 'Notification', entityId: id, meta: { userId: req.user.id } });
    } catch (e) {
      // non-blocking
    }

    sendSuccess(res, 200, 'Notification deleted successfully', null);
  } catch (error) {
    return next(error);
  }
};