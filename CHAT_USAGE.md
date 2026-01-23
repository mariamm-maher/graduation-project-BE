# Real-Time Chat API Documentation

## Overview
The chat system now supports **real-time messaging** using Socket.io WebSockets, in addition to the REST API endpoints.

## REST API Endpoints (Still Available)
- `POST /api/chat/start` - Start or get a chat
- `GET /api/chat` - Get all chats
- `GET /api/chat/:chatId` - Get specific chat
- `GET /api/chat/:chatId/messages` - Get messages (with pagination)
- `POST /api/chat/:chatId/messages` - Send message (REST)

## Real-Time Socket.io Events

### Client Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN' // JWT token from login
  }
});
```

### Client Events (Send to Server)

#### 1. Join a Chat Room
```javascript
socket.emit('join_chat', { chatId: 123 });
```

#### 2. Send a Message
```javascript
socket.emit('send_message', {
  chatId: 123,
  content: 'Hello, this is a real-time message!'
});
```

#### 3. Typing Indicator
```javascript
// Start typing
socket.emit('typing', { chatId: 123, isTyping: true });

// Stop typing
socket.emit('typing', { chatId: 123, isTyping: false });
```

#### 4. Mark Messages as Read
```javascript
socket.emit('mark_read', { chatId: 123 });
```

#### 5. Leave a Chat Room
```javascript
socket.emit('leave_chat', { chatId: 123 });
```

### Server Events (Receive from Server)

#### 1. New Message
```javascript
socket.on('new_message', (data) => {
  console.log('New message:', data.message);
  console.log('Chat ID:', data.chatId);
  // Update your UI with the new message
});
```

#### 2. Message Sent Confirmation
```javascript
socket.on('message_sent', (data) => {
  console.log('Message sent successfully:', data.message);
});
```

#### 3. Joined Chat
```javascript
socket.on('joined_chat', (data) => {
  console.log('Joined chat:', data.chatId);
});
```

#### 4. Unread Count
```javascript
socket.on('unread_count', (data) => {
  console.log(`Chat ${data.chatId} has ${data.count} unread messages`);
});
```

#### 5. User Typing
```javascript
socket.on('user_typing', (data) => {
  console.log(`${data.userName} is ${data.isTyping ? 'typing' : 'not typing'}`);
  // Show/hide typing indicator in UI
});
```

#### 6. Messages Read
```javascript
socket.on('messages_read', (data) => {
  console.log(`Messages in chat ${data.chatId} were read by user ${data.readBy}`);
  // Update read status in UI
});
```

#### 7. New Message Notification (for users not in chat room)
```javascript
socket.on('new_message_notification', (data) => {
  console.log('You have a new message in chat:', data.chatId);
  // Show notification badge or popup
});
```

#### 8. Error Handling
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

#### 9. Connection Events
```javascript
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

## Example Frontend Implementation

```javascript
import io from 'socket.io-client';

class ChatService {
  constructor(token) {
    this.socket = io('http://localhost:5000', {
      auth: { token }
    });
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('new_message', (data) => {
      // Handle new message
      this.onNewMessage(data.message, data.chatId);
    });

    this.socket.on('user_typing', (data) => {
      // Show typing indicator
      this.showTypingIndicator(data.userId, data.isTyping);
    });

    this.socket.on('error', (error) => {
      console.error('Chat error:', error);
    });
  }

  joinChat(chatId) {
    this.socket.emit('join_chat', { chatId });
  }

  sendMessage(chatId, content) {
    this.socket.emit('send_message', { chatId, content });
  }

  setTyping(chatId, isTyping) {
    this.socket.emit('typing', { chatId, isTyping });
  }

  markAsRead(chatId) {
    this.socket.emit('mark_read', { chatId });
  }

  leaveChat(chatId) {
    this.socket.emit('leave_chat', { chatId });
  }

  disconnect() {
    this.socket.disconnect();
  }
}

// Usage
const chatService = new ChatService(userAccessToken);
chatService.joinChat(chatId);
chatService.sendMessage(chatId, 'Hello!');
```

## Features

✅ **Real-time messaging** - Messages appear instantly  
✅ **Typing indicators** - See when someone is typing  
✅ **Read receipts** - Know when messages are read  
✅ **Unread counts** - Track unread messages  
✅ **Multiple device support** - Connect from multiple devices  
✅ **Authentication** - Secure WebSocket connections  
✅ **Room-based** - Efficient message broadcasting  
✅ **Error handling** - Comprehensive error messages  

## Notes

- The REST API endpoints still work for initial data loading and fallback scenarios
- Socket.io automatically handles reconnection
- Authentication is required for all socket connections
- Users can only join chats they're authorized to access

