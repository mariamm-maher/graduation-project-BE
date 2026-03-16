# CHAT_FRONTEND_INTEGRATION

## 1) Overview

The chat system supports both:

- **REST APIs** for fetching rooms/history and fallback CRUD actions.
- **Socket.IO events** for real-time join/send/read/typing updates.

### Architecture at a glance

- `ChatRoom`: one chat room per collaboration (created on demand).
- `ChatParticipant`: users allowed in a room (`owner` / `influencer`).
- `Message`: persisted room messages with `status` (`sent` | `delivered` | `read`) and `sentAt`.

### REST vs Socket responsibility

- Use **REST** to load initial data (chat rooms, message history, room details).
- Use **Socket.IO** for live events (new messages, typing indicators, read receipts).

---

## 2) Authentication Requirement

All chat APIs and socket connections require authenticated users.

### REST auth

Send access token in header:

```http
Authorization: Bearer <access_token>
```

### Socket auth

Pass the same JWT in `socket.handshake.auth.token`.

```js
const socket = io(BASE_URL, {
  auth: {
    token: accessToken
  },
  withCredentials: true
});
```

If token is missing/invalid, server rejects connection with authentication error.

---

## 3) REST API Endpoints

Base REST prefix: `/api/chat`

Response envelope uses:

```json
{
  "success": true,
  "status": 200,
  "message": "...",
  "data": { }
}
```

### A) Get or create collaboration chat room

- **Method:** `GET`
- **Route:** `/api/chat/collaborations/:collaborationId/room`
- **Params:**
  - `collaborationId` (path, required)

**Example response**

```json
{
  "success": true,
  "status": 200,
  "message": "Chat room retrieved successfully",
  "data": {
    "chatRoom": {
      "id": 12,
      "type": "one_to_one",
      "name": "Collaboration #33",
      "collaborationId": 33,
      "participants": [
        {
          "id": 71,
          "userId": 7,
          "role": "owner",
          "joinedAt": "2026-03-16T08:20:00.000Z",
          "user": {
            "id": 7,
            "firstName": "Mia",
            "lastName": "Owner",
            "email": "mia@example.com"
          }
        }
      ]
    }
  }
}
```

### B) Get user chat rooms

- **Method:** `GET`
- **Route:** `/api/chat/rooms`
- **Params:** none

**Example response**

```json
{
  "success": true,
  "status": 200,
  "message": "Chat rooms retrieved successfully",
  "data": {
    "chatRooms": [
      {
        "id": 12,
        "type": "one_to_one",
        "name": "Collaboration #33",
        "collaborationId": 33,
        "collaboration": {
          "id": 33,
          "status": "live"
        },
        "participants": [
          {
            "id": 19,
            "name": "Nora Influencer",
            "email": "nora@example.com"
          }
        ],
        "lastMessage": {
          "id": 501,
          "chatRoomId": 12,
          "senderId": 19,
          "content": "Hi, let’s start tomorrow",
          "status": "delivered",
          "sentAt": "2026-03-16T09:10:00.000Z"
        },
        "unreadCount": 2,
        "updatedAt": "2026-03-16T08:20:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### C) Get chat room details

- **Method:** `GET`
- **Route:** `/api/chat/rooms/:roomId`
- **Params:**
  - `roomId` (path, required)

**Example response**

```json
{
  "success": true,
  "status": 200,
  "message": "Chat room details retrieved successfully",
  "data": {
    "chatRoom": {
      "id": 12,
      "type": "one_to_one",
      "name": "Collaboration #33",
      "participants": [
        {
          "id": 71,
          "role": "owner",
          "user": {
            "id": 7,
            "firstName": "Mia",
            "lastName": "Owner",
            "email": "mia@example.com"
          }
        }
      ]
    }
  }
}
```

### D) Get messages of a chat room

- **Method:** `GET`
- **Route:** `/api/chat/rooms/:roomId/messages`
- **Params:**
  - `roomId` (path, required)
  - `page` (query, optional, default `1`)
  - `limit` (query, optional, default `50`)

**Example response**

```json
{
  "success": true,
  "status": 200,
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [
      {
        "id": 501,
        "chatRoomId": 12,
        "senderId": 19,
        "content": "Hi",
        "status": "read",
        "sentAt": "2026-03-16T09:10:00.000Z",
        "sender": {
          "id": 19,
          "firstName": "Nora",
          "lastName": "Influencer",
          "email": "nora@example.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalMessages": 1,
      "hasMore": false
    }
  }
}
```

### E) Send message (REST fallback)

- **Method:** `POST`
- **Route:** `/api/chat/rooms/:roomId/messages`
- **Params:**
  - `roomId` (path, required)
- **Body:**

```json
{
  "content": "Hello",
  "mediaUrl": null,
  "replyToId": null
}
```

> Note: backend currently persists `content` only; if `content` is empty and `mediaUrl` exists, message content is saved as `"[Media]"`.

**Example response**

```json
{
  "success": true,
  "status": 201,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": 502,
      "chatRoomId": 12,
      "content": "Hello",
      "status": "sent",
      "sentAt": "2026-03-16T09:12:00.000Z"
    }
  }
}
```

### F) Edit message

- **Method:** `PATCH`
- **Route:** `/api/chat/messages/:id`
- **Params:**
  - `id` (path, required)
- **Body:**

```json
{
  "content": "Updated text"
}
```

**Example response**

```json
{
  "success": true,
  "status": 200,
  "message": "Message edited successfully",
  "data": {
    "message": {
      "id": 502,
      "chatRoomId": 12,
      "content": "Updated text"
    }
  }
}
```

### G) Delete message

- **Method:** `DELETE`
- **Route:** `/api/chat/messages/:id`
- **Params:**
  - `id` (path, required)

**Example response**

```json
{
  "success": true,
  "status": 200,
  "message": "Message deleted successfully"
}
```

### H) Mark room messages as read

- **Method:** `PATCH`
- **Route:** `/api/chat/rooms/:roomId/read`
- **Params:**
  - `roomId` (path, required)

**Example response**

```json
{
  "success": true,
  "status": 200,
  "message": "Messages marked as read"
}
```

---

## 4) Socket.IO Connection

### Base URL

Socket server runs on the same backend host (no namespace configured):

- Local default: `http://localhost:5000`

### Connection example

```js
import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const accessToken = localStorage.getItem('accessToken');

export const socket = io(BASE_URL, {
  transports: ['websocket'],
  withCredentials: true,
  auth: {
    token: accessToken
  }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket auth/connection error:', err.message);
});
```

---

## 5) Socket Events

### 1) `join_collaboration_chat`

- **Frontend emits when:** user opens a specific collaboration chat
- **Emit payload:**

```json
{
  "collaborationId": 33
}
```

- **Server response events:**
  - `room_joined` on success
  - `error` on failure

`room_joined` payload:

```json
{
  "chatRoom": {
    "id": 12,
    "type": "one_to_one",
    "collaborationId": 33,
    "name": "Collaboration #33",
    "createdAt": "2026-03-16T08:20:00.000Z"
  },
  "participants": [
    {
      "id": 7,
      "name": "Mia Owner",
      "email": "mia@example.com",
      "joinedAt": "2026-03-16T08:20:00.000Z",
      "role": "owner"
    }
  ],
  "messages": [
    {
      "id": 501,
      "chatRoomId": 12,
      "sender": { "id": 19, "name": "Nora Influencer" },
      "content": "Hi",
      "status": "read",
      "sentAt": "2026-03-16T09:10:00.000Z"
    }
  ],
  "unreadCount": 2
}
```

### 2) `send_message`

- **Frontend emits when:** user sends a chat message
- **Emit payload:**

```json
{
  "chatRoomId": 12,
  "content": "Hello from socket",
  "mediaUrl": null,
  "replyToId": null
}
```

- **Server response events:**
  - `message_received` broadcast to room
  - `error` on failure

`message_received` payload:

```json
{
  "id": 503,
  "chatRoomId": 12,
  "sender": { "id": 7, "name": "Mia Owner" },
  "content": "Hello from socket",
  "status": "delivered",
  "sentAt": "2026-03-16T09:15:00.000Z"
}
```

### 3) `message_received`

- **Frontend listens when:** connected in chat screen
- **Emitted by server when:** a new message is created in room
- **Frontend action:** append message to active room list and update room preview/unread counters.

### 4) `typing`

- **Frontend emits when:** user starts typing
- **Emit payload:**

```json
{ "chatRoomId": 12 }
```

- **Server response event:** `user_typing` to other users in room.

### 5) `stop_typing`

- **Frontend emits when:** user stops typing / input blur / message sent
- **Emit payload:**

```json
{ "chatRoomId": 12 }
```

- **Server response event:** `user_stopped_typing` to other users in room.

### 6) `mark_messages_read`

- **Frontend emits when:** room becomes active or messages become visible
- **Emit payload options:**

```json
{
  "chatRoomId": 12,
  "messageIds": "all"
}
```

or

```json
{
  "chatRoomId": 12,
  "messageIds": [501, 502]
}
```

- **Server response events:**
  - `messages_read` to room
  - `error` on failure

### 7) `messages_read`

- **Frontend listens when:** needs read receipts updates
- **Payload:**

```json
{
  "chatRoomId": 12,
  "userId": 19,
  "messageIds": "all"
}
```

### 8) `leave_room`

- **Frontend emits when:** user navigates away/unmounts chat page
- **Emit payload:**

```json
{ "chatRoomId": 12 }
```

- **Server response event:** no dedicated success event (silent leave).

### Generic error event

Server may emit:

```json
{
  "event": "join_collaboration_chat",
  "message": "Unauthorized: You are not part of this collaboration"
}
```

Event name: `error`

---

## 6) Typical Chat Flow

1. User opens chat page.
2. Frontend calls `GET /api/chat/rooms` to load room list.
3. Frontend creates Socket.IO connection using JWT in `auth.token`.
4. User selects a collaboration; frontend emits `join_collaboration_chat`.
5. Server responds with `room_joined` (room metadata + participants + recent messages + unread count).
6. User sends message via `send_message` (socket) or `POST /api/chat/rooms/:roomId/messages` fallback.
7. Server broadcasts `message_received`; both users update UI.
8. When room is viewed, frontend emits `mark_messages_read` and/or calls `PATCH /api/chat/rooms/:roomId/read`.
9. On page exit, frontend emits `leave_room` and disconnects if needed.

---

## 7) Example Frontend Code (JavaScript)

### A) Connect socket

```js
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('accessToken');

const socket = io(API_URL, {
  auth: { token },
  withCredentials: true
});

socket.on('connect', () => console.log('socket connected'));
socket.on('connect_error', (e) => console.error(e.message));
socket.on('error', (payload) => console.error('socket error', payload));
```

### B) Join chat room

```js
function joinCollaborationChat(collaborationId) {
  socket.emit('join_collaboration_chat', { collaborationId });
}

socket.on('room_joined', (payload) => {
  // payload.chatRoom, payload.participants, payload.messages, payload.unreadCount
  console.log('joined room', payload.chatRoom.id);
});
```

### C) Send message

```js
function sendMessage(chatRoomId, text) {
  socket.emit('send_message', {
    chatRoomId,
    content: text,
    mediaUrl: null,
    replyToId: null
  });
}
```

### D) Receive message

```js
socket.on('message_received', (message) => {
  // Append if message.chatRoomId === activeRoomId
  // Otherwise increment room unread counter
  console.log('new message', message);
});
```

---

## 8) Error Handling

Handle these cases in frontend:

- **Socket disconnect**
  - Listen to `disconnect` and show reconnecting indicator.
  - Retry connection automatically (Socket.IO does this by default).
- **Unauthorized access**
  - REST: 401/403 => redirect to login or show forbidden state.
  - Socket: `connect_error` or `error` with auth/unauthorized message.
- **Invalid room / collaboration**
  - `error` event for `join_collaboration_chat` with `Collaboration not found`.
- **Message send failure**
  - On `error` for `send_message`, keep draft text and allow retry.

---

## 9) Real-time UX Recommendations

- **Typing indicator**
  - Debounce emits (e.g., every 300–500ms), emit `stop_typing` after inactivity.
- **Message ordering**
  - Sort by `sentAt` ascending in the room timeline.
- **Unread messages**
  - Use `unreadCount` from `room_joined` + room list, then clear/read via `mark_messages_read`.
- **Auto scroll**
  - Auto-scroll only if user is already near bottom; otherwise show “new messages” button.
- **Reconnect logic**
  - On reconnect, re-emit `join_collaboration_chat` for active room and refresh latest messages via REST.

---

## Notes for frontend team

- Current backend message model persists text content and status; media/reply metadata is not currently stored in `Message` model.
- Prefer Socket.IO for active chat screens; use REST as initial load + fallback.
- Keep both REST and Socket auth tokens in sync (refresh flow should update socket auth token before reconnect).
