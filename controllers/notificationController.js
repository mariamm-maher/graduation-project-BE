const notificationService = require('../services/notificationService');
const sendSuccess = require('../utils/sendSuccess');
const AppError = require('../utils/AppError');
const { logAction } = require('../services/logServices'); 

// @desc    Get all user notifications (paginated)
// @route   GET /api/notifications
// @access  Private (authenticated user)
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const result = await notificationService.getUserNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    // Log the fetch (fire-and-forget, as in authController)
    try {
      await logAction({ req, action: 'FETCH_NOTIFICATIONS', entity: 'Notification', entityId: null, meta: { userId: req.user.id, count: result.pagination.totalNotifications } });
    } catch (e) {
      // non-blocking
    }

    sendSuccess(res, 200, 'Notifications retrieved successfully', {
      notifications: result.notifications,
      pagination: {
        total: result.pagination.totalNotifications,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: result.pagination.totalPages
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
    const count = await notificationService.getUnreadCount(req.user.id);

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

    const updated = await notificationService.markAsRead(id, req.user.id);

    if (!updated) {
      return next(new AppError('Notification not found', 404));
    }

    // Log the update
    try {
      await logAction({ req, action: 'MARK_READ', entity: 'Notification', entityId: id, meta: { userId: req.user.id } });
    } catch (e) {
      // non-blocking
    }

    sendSuccess(res, 200, 'Notification marked as read successfully', { notificationId: id });
  } catch (error) {
    return next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private (authenticated user)
exports.markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);

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

    const deleted = await notificationService.deleteNotification(id, req.user.id);

    if (!deleted) {
      return next(new AppError('Notification not found', 404));
    }

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

// @desc    Delete all notifications
// @route   DELETE /api/notifications/delete-all
// @access  Private (authenticated user)
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    await notificationService.deleteAllNotifications(req.user.id);

    // Log the bulk delete
    try {
      await logAction({ req, action: 'DELETE_ALL_NOTIFICATIONS', entity: 'Notification', entityId: null, meta: { userId: req.user.id } });
    } catch (e) {
      // non-blocking
    }

    sendSuccess(res, 200, 'All notifications deleted successfully', null);
  } catch (error) {
    return next(error);
  }
};