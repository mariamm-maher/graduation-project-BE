# REMAINING FEATURES & ENDPOINTS

## 🔐 1. PASSWORD MANAGEMENT
**Status:** Models exist (resetPasswordToken, resetPasswordExpires in User model) but no endpoints implemented

### Required Endpoints:
- `POST /api/auth/forgot-password` - Request password reset (send email with token)
- `POST /api/auth/reset-password` - Reset password using token
- `POST /api/auth/change-password` - Change password (authenticated user)
- `GET /api/auth/validate-reset-token` - Validate reset token before showing reset form

### Implementation Needed:
- Email service integration for sending reset links
- Token generation and validation logic
- Secure password reset flow
- Password strength validation
- Rate limiting for forgot-password requests

---

## 💬 2. WEBSOCKET IMPLEMENTATION
**Status:** Socket.io installed, ChatRoom & Message models exist, but no WebSocket server configured

### 2.1 Real-Time Chat
**Models:** ✅ ChatRoom, ChatParticipant, Message (exist)
**WebSocket:** ❌ Not configured

#### Required Features:
- Initialize Socket.io server in server.js
- Authentication middleware for socket connections
- Chat room joining/leaving
- Send and receive messages in real-time
- Typing indicators
- Message delivery status (sent, delivered, read)
- Message history pagination
- Unread message counts
- File/image sharing in chat

#### Required Endpoints:
- `GET /api/chat/rooms` - Get all chat rooms for user
- `GET /api/chat/rooms/:roomId` - Get single chat room details
- `GET /api/chat/rooms/:roomId/messages` - Get message history with pagination
- `POST /api/chat/rooms/:roomId/messages` - Send message (fallback REST API)
- `PATCH /api/chat/messages/:id/read` - Mark message as read
- `DELETE /api/chat/messages/:id` - Delete message

#### WebSocket Events:
```javascript
// Client → Server
- 'join_room' - Join a chat room
- 'leave_room' - Leave a chat room
- 'send_message' - Send a message
- 'typing' - User is typing
- 'stop_typing' - User stopped typing
- 'mark_read' - Mark messages as read

// Server → Client
- 'message_received' - New message received
- 'user_typing' - Another user is typing
- 'user_stopped_typing' - User stopped typing
- 'message_sent' - Message successfully sent confirmation
- 'message_updated' - Message status updated
- 'error' - Error occurred
```

### 2.2 Real-Time Notifications
**Models:** ✅ Notification model exists
**WebSocket:** ❌ Not configured

#### Required Features:
- Real-time notification delivery via WebSocket
- Notification badge counter updates
- Different notification types with proper categorization
- Push notification support (browser notifications)

#### WebSocket Events:
```javascript
// Server → Client
- 'notification' - New notification received
- 'notification_read' - Notification marked as read
- 'notification_count' - Unread count update

// Client → Server
- 'subscribe_notifications' - Subscribe to notifications
- 'mark_notification_read' - Mark notification as read
```

#### Enhancement Needed:
- Add notification category system:
  - `campaign_updates` (budget alerts, performance milestones)
  - `collaboration_updates` (new requests, acceptances, task submissions)
  - `chat_messages` (new messages)
  - `system_alerts` (platform updates, maintenance)
- Add notification preferences (user can mute certain types)
- Email notifications for critical alerts (optional setting)

---

## 📱 3. SOCIAL MEDIA MANAGEMENT - POST SCHEDULING & PUBLISHING
---

## 📅 4. SMART CONTENT CALENDAR
**Status:** ContentCalendar model exists but no management endpoints

### Required Endpoints:
- `GET /api/campaigns/:id/calendar` - Get campaign content calendar
- `GET /api/social-media/calendar` - Get unified calendar view (all campaigns/posts)
- `POST /api/campaigns/:id/calendar/items` - Add item to calendar
- `PUT /api/campaigns/:id/calendar/items/:itemId` - Update calendar item
- `PATCH /api/campaigns/:id/calendar/items/:itemId/reschedule` - Reschedule post (drag-and-drop support)
- `DELETE /api/campaigns/:id/calendar/items/:itemId` - Remove from calendar
- `GET /api/social-media/calendar/view` - Calendar view by day/week/month

---
