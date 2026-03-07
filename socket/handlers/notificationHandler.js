const notificationService = require('../../services/notificationService');

module.exports = (io, socket) => {
  // Subscribe to notifications (auto-subscribed on connection)
  socket.on('subscribe_notifications', async () => {
    try {
      console.log(`User ${socket.userId} subscribed to notifications`);
      
      // Send current unread count
      const unreadCount = await notificationService.getUnreadCount(socket.userId);
      
      socket.emit('notification_count_updated', { unreadCount });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  });

  // Mark notification as read
  socket.on('mark_notification_read', async (data) => {
    try {
      const { notificationId } = data;
      const userId = socket.userId;

      const success = await notificationService.markAsRead(notificationId, userId);

      if (success) {
        socket.emit('notification_read', { notificationId });
        
        // Send updated count
        const unreadCount = await notificationService.getUnreadCount(userId);
        socket.emit('notification_count_updated', { unreadCount });
      } else {
        socket.emit('error', {
          event: 'mark_notification_read',
          message: 'Notification not found or unauthorized'
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('error', {
        event: 'mark_notification_read',
        message: 'Failed to mark notification as read'
      });
    }
  });

  // Mark all notifications as read
  socket.on('mark_all_notifications_read', async () => {
    try {
      const userId = socket.userId;

      await notificationService.markAllAsRead(userId);

      socket.emit('all_notifications_read');
      socket.emit('notification_count_updated', { unreadCount: 0 });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      socket.emit('error', {
        event: 'mark_all_notifications_read',
        message: 'Failed to mark all notifications as read'
      });
    }
  });
};
