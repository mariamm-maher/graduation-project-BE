# Chat API Testing Guide

This guide will help you test the chat functionality, including both REST API endpoints and real-time Socket.io features.

## Prerequisites

1. **Start the server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

2. **Get authentication token:**
   - First, login or signup to get an access token
   - You'll need this token for all authenticated requests

### Authentication Examples

#### Option 1: Signup (Register New User)

**Endpoint:** `POST /api/auth/signup`

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": 1,
    "needsRoleSelection": true
  }
}
```

**Note:** After signup, you need to select a role (Owner or Influencer) before you can use the chat features. All users are in the same User table - roles differentiate them (OWNER or INFLUENCER via the UserRole table).

#### Option 2: Login (Existing User)

**Endpoint:** `POST /api/auth/login`

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 1,
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the `accessToken`** - you'll use it in the `Authorization` header for all authenticated requests.

#### Option 3: Select Role (After Signup)

**Endpoint:** `POST /api/auth/select-role`

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/select-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "roleId": 1
  }'
```

**Note:** You need to know the role IDs:
- Typically: `1` = OWNER, `2` = INFLUENCER (check your database)
- All users share the same User table - roles are assigned through the UserRole junction table
- When you want to chat with an influencer, use their `userId` (not a separate influencerId)

#### Option 4: Refresh Access Token

**Endpoint:** `POST /api/auth/refresh-token`

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token_here"
  }
}
```

### Quick Authentication Flow
 // "userId": 1,
1. **Signup** → Get `userId`
2. **Select Role** → Assign Owner or Influencer role
3. **Login** → Get `accessToken` and `refreshToken`
4. **Use `accessToken`** in all API requests

### Using the Token

Once you have the `accessToken`, use it in all requests:

```bash
# Example: Get all chats
curl -X GET http://localhost:5000/api/chat \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Environment Variables for Testing

You can set these in your terminal:

**PowerShell:**
```powershell
$env:ACCESS_TOKEN="your_access_token_here"
$env:REFRESH_TOKEN="your_refresh_token_here"
```

**Bash/Linux/Mac:**
```bash
export ACCESS_TOKEN="your_access_token_here"
export REFRESH_TOKEN="your_refresh_token_here"
```

### Quick Authentication Test Script

For the easiest way to get a token, use the provided test script:

```bash
node test-auth.js
```

This script will:
1. ✅ Sign up a new user (or use existing)
2. ✅ Select a role (if needed)
3. ✅ Login and get tokens
4. 💾 Save tokens to `.test-token.json` for easy access

The script will output your access token which you can copy and use in your API requests.

## Understanding the System Architecture

**Important:** Before testing, understand how users and roles work in this system:

1. **All users are in the same `User` table** - there's no separate "influencer" table
2. **Users are differentiated by roles:**
   - Users can have roles: `OWNER` or `INFLUENCER`
   - Roles are assigned through the `UserRole` junction table (many-to-many relationship)
   - A user can have multiple roles, but typically has one: either OWNER or INFLUENCER
3. **When starting a chat:**
   - `userId`: Automatically extracted from your JWT token (the authenticated user, typically an OWNER)
   - The other user's `userId`: This is the **userId** of another user who has the INFLUENCER role
   - There's no separate "influencerId" - it's just a userId of a user with the INFLUENCER role
4. **Example:**
   - User 1 (userId: 1) has roleId: 1 (OWNER)
   - User 2 (userId: 2) has roleId: 2 (INFLUENCER)
   - To start a chat, User 1 sends: `{"userId": 2}` where 2 is User 2's userId (the user with INFLUENCER role)

## Testing REST API Endpoints

### 1. Start a Chat with an Influencer

**Endpoint:** `POST /api/chat/start`

**Important:** 
- The authenticated user's `userId` is **NOT required** in the request body. It is automatically extracted from the JWT token in the `Authorization` header. The authenticated user's ID is used as the chat owner.
- **System Architecture:** All users are in the same `User` table. Users are differentiated by their roles (OWNER or INFLUENCER) through the `UserRole` table. The `userId` in the request is the userId of a user who has the INFLUENCER role.

**Request:**
```bash
curl -X POST http://localhost:5000/api/chat/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "userId": 2,
    "campaignId": 1
  }'
```

**Request Body Fields:**
- `userId` (required): The **userId** of a user who has the INFLUENCER role. This is the userId of a user with roleId for INFLUENCER.
- `campaignId` (optional): The ID of the campaign associated with this chat (if any)
- Authenticated user's `userId` (NOT required): Automatically extracted from the JWT token (the authenticated user, typically an OWNER)

**Note:** The API now accepts `userId` in the request body (instead of `influencerId`). The database still uses `influencerId` as the field name internally, but the API accepts `userId` for clarity.

**Response:**
```json
{
  "success": true,
  "message": "Chat started successfully",
  "data": {
    "chat": {
      "id": 1,
      "userId": 1,
      "otherUserId": 2,
      "campaignId": 1,
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "influencer": {
        "id": 2,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      }
    }
  }
}
```

### 2. Get All Chats for Current User

**Endpoint:** `GET /api/chat`

**Request:**
```bash
curl -X GET http://localhost:5000/api/chat \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Chats retrieved successfully",
  "data": {
    "chats": [
      {
        "id": 1,
        "userId": 1,
        "otherUserId": 2,
        "user": {...},
        "influencer": {...},
        "messages": [...]
      }
    ]
  }
}
```

### 3. Get Chat by Influencer Name

**Endpoint:** `GET /api/chat/:influencerName`

**Request:**
```bash
# URL encode the name: "Jane Smith" becomes "Jane%20Smith"
curl -X GET "http://localhost:5000/api/chat/Jane%20Smith" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Or with firstName only:**
```bash
curl -X GET "http://localhost:5000/api/chat/Jane" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Get Messages for a Chat

**Endpoint:** `GET /api/chat/:chatId/messages`

**Request:**
```bash
curl -X GET "http://localhost:5000/api/chat/1/messages?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 50)

### 5. Send a Message (REST API)

**Endpoint:** `POST /api/chat/:chatId/messages`

**Request:**
```bash
curl -X POST http://localhost:5000/api/chat/1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "content": "Hello! This is a test message."
  }'
```

## Testing Socket.io Real-Time Features

### Using Node.js Test Script

Create a file `test-socket.js`:

```javascript
const io = require('socket.io-client');

// Replace with your server URL and token
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Join a chat room
  socket.emit('join_chat', { chatId: 1 });
});

socket.on('joined_chat', (data) => {
  console.log('✅ Joined chat:', data.chatId);
  
  // Send a message
  socket.emit('send_message', {
    chatId: 1,
    content: 'Hello from Socket.io!'
  });
});

socket.on('new_message', (data) => {
  console.log('📨 New message received:', data.message.content);
  console.log('From:', data.message.sender.firstName);
});

socket.on('message_sent', (data) => {
  console.log('✅ Message sent successfully:', data.message.content);
});

socket.on('user_typing', (data) => {
  console.log(`${data.userName} is ${data.isTyping ? 'typing...' : 'not typing'}`);
});

socket.on('unread_count', (data) => {
  console.log(`Unread messages in chat ${data.chatId}: ${data.count}`);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error.message);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Test typing indicator
setTimeout(() => {
  socket.emit('typing', { chatId: 1, isTyping: true });
  
  setTimeout(() => {
    socket.emit('typing', { chatId: 1, isTyping: false });
  }, 2000);
}, 5000);
```

**Run the test:**
```bash
node test-socket.js
```

### Using Browser Console

Open your browser console and run:

```javascript
// Install socket.io-client first: npm install socket.io-client
// Or use CDN: <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>

const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('join_chat', { chatId: 1 });
});

socket.on('new_message', (data) => {
  console.log('New message:', data);
});

// Send a message
socket.emit('send_message', {
  chatId: 1,
  content: 'Hello from browser!'
});
```

## Testing with Postman

### 1. Setup Collection

1. Create a new Postman collection
2. Add environment variables:
   - `base_url`: `http://localhost:5000`
   - `access_token`: Your JWT token

### 2. Get Your Access Token First

**Before testing chat endpoints, you MUST get an access token:**

1. **Login Request:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body:
     ```json
     {
       "email": "your-email@example.com",
       "password": "your-password"
     }
     ```
2. **Copy the `accessToken`** from the response
   - The token should be a long string starting with `eyJ`
   - It should have 3 parts separated by dots (e.g., `eyJ...xxx.yyy.zzz`)
   - **Important:** Copy the ENTIRE token, don't truncate it
   - **No quotes** - just the plain token string

3. **Verify Token Format:**
   - ✅ Valid: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY5MTEyMTgxLCJleHAiOjE3NjkxMTMwODF9.vCSOU08z1RxrOG6g0LoAVxE7VjPqpD0RVMvxlWr2PIU`
   - ❌ Invalid: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."` (has quotes)
   - ❌ Invalid: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (truncated)

4. **Save it** to your environment variable `access_token` or use it directly

### 3. Configure Authorization Header

**For the `/api/chat/start` endpoint, you MUST set the Authorization header:**

1. Open your `POST /api/chat/start` request in Postman
2. Click on the **"Authorization"** tab (next to "Headers")
3. Select **Type**: `Bearer Token` from the dropdown
4. In the **Token** field, enter:
   - `{{access_token}}` (if using environment variable), OR
   - Paste your actual token directly (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
5. The header will automatically be set as: `Authorization: Bearer YOUR_TOKEN`

**Important:** Without this Authorization header, you'll get a `401 Unauthorized` error with "Invalid access token".

**Common Postman Mistakes:**
- ❌ **Wrong:** Token field contains: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."` (with quotes)
- ✅ **Correct:** Token field contains: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (no quotes)
- ❌ **Wrong:** Adding token manually in Headers tab as: `Bearer "token"` (quotes around token)
- ✅ **Correct:** Using Authorization tab, which automatically formats it correctly
- ❌ **Wrong:** Token is truncated or incomplete
- ✅ **Correct:** Full token copied from login response (usually 150+ characters)

**How to Verify Your Token is Set Correctly:**
1. After setting the token in Authorization tab, click the **"Headers"** tab
2. Look for the `Authorization` header
3. It should show: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. If you see quotes around the token part, remove them

### 4. Test Endpoints

**Start Chat:**
- Method: POST
- URL: `{{base_url}}/api/chat/start` or `http://localhost:5000/api/chat/start`
- **Authorization Tab:**
  - Type: `Bearer Token`
  - Token: `{{access_token}}` or your actual token
- **Headers Tab:**
  - `Content-Type: application/json`
- **Body Tab:**
  - Select `raw` and `JSON`
  - Body:
    ```json
    {
      "userId": 2,
      "campaignId": 1
    }
    ```
  **Note:** Do NOT include `userId` in the body - it's automatically extracted from the token.

**Get All Chats:**
- Method: GET
- URL: `{{base_url}}/api/chat`
- Headers:
  - `Authorization: Bearer {{access_token}}`

**Get Chat by Name:**
- Method: GET
- URL: `{{base_url}}/api/chat/Jane%20Smith`
- Headers:
  - `Authorization: Bearer {{access_token}}`

**Send Message:**
- Method: POST
- URL: `{{base_url}}/api/chat/1/messages`
- Headers:
  - `Authorization: Bearer {{access_token}}`
  - `Content-Type: application/json`
- Body:
  ```json
  {
    "content": "Test message from Postman"
  }
  ```

## Testing Socket.io with Postman

Postman now supports WebSocket testing:

1. Create a new WebSocket request
2. URL: `ws://localhost:5000`
3. In connection, add authentication:
   ```json
   {
     "token": "YOUR_ACCESS_TOKEN"
   }
   ```
4. Send events:
   - `join_chat`: `{"chatId": 1}`
   - `send_message`: `{"chatId": 1, "content": "Hello"}`
   - `typing`: `{"chatId": 1, "isTyping": true}`

## Complete Test Scenario

### Step 1: Create Two Users
1. Sign up as User 1 (will become Owner)
2. Sign up as User 2 (will become Influencer)
3. Assign roles:
   - User 1: Select roleId for OWNER (typically roleId: 1)
   - User 2: Select roleId for INFLUENCER (typically roleId: 2)
4. Get tokens for both users
5. **Important:** Note User 2's `userId` - this is what you'll use as `userId` in the request body when starting a chat

### Step 2: Start a Chat
```bash
# As User 1 (Owner), start chat with User 2 (Influencer)
# Note: 
# - userId is automatically extracted from USER1_TOKEN (User 1's userId)
# - userId in request body is User 2's userId (the user with INFLUENCER role)
# - There's no separate influencerId - it's just the userId of a user with INFLUENCER role
curl -X POST http://localhost:5000/api/chat/start \
  -H "Authorization: Bearer USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 2}'
# Where 2 is User 2's userId (who has the INFLUENCER role)
```

### Step 3: Connect Both Users via Socket.io
```javascript
// User 1 connects
const socket1 = io('http://localhost:5000', {
  auth: { token: 'USER1_TOKEN' }
});

// User 2 connects
const socket2 = io('http://localhost:5000', {
  auth: { token: 'USER2_TOKEN' }
});

// Both join the chat
socket1.emit('join_chat', { chatId: 1 });
socket2.emit('join_chat', { chatId: 1 });

// User 1 sends a message
socket1.emit('send_message', {
  chatId: 1,
  content: 'Hello from User 1!'
});

// User 2 should receive it
socket2.on('new_message', (data) => {
  console.log('User 2 received:', data.message.content);
});
```

## Campaign API Testing Guide

This section covers testing campaign creation and management endpoints.

### Prerequisites

1. **Authentication Required:** All campaign endpoints require authentication
2. **User Role:** You need to be logged in as an Owner (user with Owner role)
3. **Get Access Token:** Follow the authentication steps above to get your access token

### Campaign Endpoints

#### 1. Create a New Campaign

**Endpoint:** `POST /api/campaigns`

**Description:** Creates a new campaign and generates an AI-powered preview with strategy, execution plan, and estimations.

**Request:**
```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "campaignName": "Summer Product Launch 2024",
    "userDescription": "Launching our new summer collection targeting young adults aged 18-30 interested in fashion and lifestyle. We want to increase brand awareness and drive online sales.",
    "goalType": "conversion",
    "totalBudget": 50000,
    "currency": "USD",
    "budgetFlexibility": "flexible",
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-08-31T23:59:59Z"
  }'
```

**Request Body Fields:**
- `campaignName` (required): Name of the campaign (3-100 characters)
- `userDescription` (required): Detailed description of the campaign goals and target audience
- `goalType` (required): One of: `awareness`, `consideration`, `conversion`, `lead_generation`, `retention`
- `totalBudget` (required): Total budget amount (must be > 0)
- `currency` (required): Currency code (e.g., "USD", "EUR", "GBP")
- `budgetFlexibility` (optional): `strict` or `flexible` (default: `flexible`)
- `startDate` (required): Campaign start date (ISO 8601 format)
- `endDate` (required): Campaign end date (ISO 8601 format, must be after startDate)

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Campaign created successfully. AI preview generated.",
  "data": {
    "campaign": {
      "id": 1,
      "campaignName": "Summer Product Launch 2024",
      "status": "draft",
      "createdAt": "2024-05-15T10:30:00.000Z"
    },
    "aiPreview": {
      "campaignId": 1,
      "generatedAt": "2024-05-15T10:30:00.000Z",
      "strategy": {
        "campaignSummary": "AI-generated strategy for Summer Product Launch 2024...",
        "platformSelection": [
          {
            "platform": "Instagram",
            "rationale": "High engagement rate for visual content",
            "priority": "primary",
            "audienceMatchScore": 85
          },
          {
            "platform": "TikTok",
            "rationale": "Excellent for viral content and younger demographics",
            "priority": "secondary",
            "audienceMatchScore": 78
          }
        ],
        "budgetAllocation": {
          "breakdown": [
            {
              "category": "paid_ads",
              "amount": 25000,
              "percentage": 50,
              "platforms": [
                {
                  "platform": "Instagram",
                  "amount": 15000,
                  "dailyBudget": 166.67
                },
                {
                  "platform": "TikTok",
                  "amount": 10000,
                  "dailyBudget": 111.11
                }
              ]
            },
            {
              "category": "content_creation",
              "amount": 15000,
              "percentage": 30
            },
            {
              "category": "influencer_marketing",
              "amount": 7500,
              "percentage": 15
            },
            {
              "category": "contingency",
              "amount": 2500,
              "percentage": 5
            }
          ],
          "totalAllocated": 50000,
          "remainingBudget": 0
        }
      },
      "execution": {
        "contentCalendar": [
          {
            "day": 1,
            "date": "2024-06-01T00:00:00.000Z",
            "platform": "Instagram",
            "contentType": "post",
            "caption": "Day 1 content: Engaging post to drive awareness",
            "task": "Create and schedule post for Instagram",
            "status": "scheduled"
          }
        ],
        "adStrategy": {
          "campaigns": [
            {
              "platform": "Instagram",
              "campaignType": "Reach & Engagement",
              "objective": "conversion",
              "duration": "92 days",
              "dailyBudget": 166.67,
              "targeting": null
            }
          ]
        }
      },
      "estimations": {
        "estimatedResults": {
          "scenario": "moderate",
          "confidenceLevel": 75,
          "metrics": [
            {
              "metric": "impressions",
              "estimatedRange": {
                "min": 5000000,
                "max": 7500000,
                "mostLikely": 6250000
              }
            },
            {
              "metric": "clicks",
              "estimatedRange": {
                "min": 100000,
                "max": 250000,
                "mostLikely": 150000
              }
            },
            {
              "metric": "conversions",
              "estimatedRange": {
                "min": 2500,
                "max": 7500,
                "mostLikely": 5000
              }
            }
          ]
        }
      }
    }
  }
}
```

**Error Responses:**

**Missing Required Fields (400):**
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

**Invalid Date Range (400):**
```json
{
  "success": false,
  "message": "End date must be after start date"
}
```

**Invalid Budget (400):**
```json
{
  "success": false,
  "message": "Budget must be greater than 0"
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "Authentication error: Token required"
}
```

### Campaign Goal Types

The `goalType` field accepts one of the following values:

- `awareness`: Increase brand visibility and reach
- `consideration`: Encourage users to consider your product/service
- `conversion`: Drive sales or specific actions
- `lead_generation`: Collect leads and contact information
- `retention`: Re-engage existing customers

### Example Campaign Scenarios

#### Scenario 1: Awareness Campaign
```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "campaignName": "Brand Awareness Q2",
    "userDescription": "Increase brand awareness among millennials in urban areas",
    "goalType": "awareness",
    "totalBudget": 30000,
    "currency": "USD",
    "budgetFlexibility": "strict",
    "startDate": "2024-04-01T00:00:00Z",
    "endDate": "2024-06-30T23:59:59Z"
  }'
```

#### Scenario 2: Conversion Campaign
```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "campaignName": "Black Friday Sale",
    "userDescription": "Drive online sales during Black Friday week with special discounts",
    "goalType": "conversion",
    "totalBudget": 75000,
    "currency": "USD",
    "budgetFlexibility": "flexible",
    "startDate": "2024-11-20T00:00:00Z",
    "endDate": "2024-11-30T23:59:59Z"
  }'
```

#### Scenario 3: Lead Generation Campaign
```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "campaignName": "B2B Lead Gen Q3",
    "userDescription": "Generate qualified leads for enterprise software solution",
    "goalType": "lead_generation",
    "totalBudget": 45000,
    "currency": "USD",
    "budgetFlexibility": "flexible",
    "startDate": "2024-07-01T00:00:00Z",
    "endDate": "2024-09-30T23:59:59Z"
  }'
```

### Testing with Postman

#### Setup Campaign Collection

1. Create a new Postman collection: "Campaign API"
2. Add environment variables:
   - `base_url`: `http://localhost:5000`
   - `access_token`: Your JWT token

#### Create Campaign Request

- **Method:** POST
- **URL:** `{{base_url}}/api/campaigns`
- **Headers:**
  - `Authorization: Bearer {{access_token}}`
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "campaignName": "Test Campaign",
    "userDescription": "This is a test campaign for API testing",
    "goalType": "awareness",
    "totalBudget": 10000,
    "currency": "USD",
    "budgetFlexibility": "flexible",
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-08-31T23:59:59Z"
  }
  ```

### Testing Campaign Creation Script

Create a file `test-campaign.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Replace with your token

async function testCreateCampaign() {
  try {
    console.log('🚀 Testing Campaign Creation...\n');

    const campaignData = {
      campaignName: "Test Campaign - API Testing",
      userDescription: "This is a test campaign created via API to verify the campaign creation endpoint works correctly.",
      goalType: "conversion",
      totalBudget: 25000,
      currency: "USD",
      budgetFlexibility: "flexible",
      startDate: "2024-06-01T00:00:00Z",
      endDate: "2024-08-31T23:59:59Z"
    };

    const response = await axios.post(
      `${BASE_URL}/api/campaigns`,
      campaignData,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Campaign created successfully!');
    console.log('📊 Campaign ID:', response.data.data.campaign.id);
    console.log('📝 Campaign Name:', response.data.data.campaign.campaignName);
    console.log('📈 Status:', response.data.data.campaign.status);
    console.log('\n🤖 AI Preview Generated:');
    console.log('   Strategy Summary:', response.data.data.aiPreview.strategy.campaignSummary.substring(0, 100) + '...');
    console.log('   Platforms Selected:', response.data.data.aiPreview.strategy.platformSelection.length);
    console.log('   Budget Allocated:', response.data.data.aiPreview.strategy.budgetAllocation.totalAllocated);
    console.log('   Content Calendar Items:', response.data.data.aiPreview.execution.contentCalendar.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error creating campaign:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data.message || error.response.data.error);
    } else {
      console.error('   Error:', error.message);
    }
    throw error;
  }
}

// Run the test
testCreateCampaign()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed!');
    process.exit(1);
  });
```

**Run the test:**
```bash
node test-campaign.js
```

### Campaign Testing Checklist

- [ ] Server starts without errors
- [ ] Can authenticate and get token
- [ ] Can create a campaign with all required fields
- [ ] Campaign creation returns AI preview
- [ ] AI preview includes strategy section
- [ ] AI preview includes execution plan
- [ ] AI preview includes estimations
- [ ] Validation works for missing fields
- [ ] Validation works for invalid date range
- [ ] Validation works for invalid budget
- [ ] Authentication required (returns 401 without token)
- [ ] Can create campaigns with different goal types
- [ ] Can create campaigns with different currencies
- [ ] Can create campaigns with strict/flexible budget

### Common Campaign Testing Issues & Solutions

#### 1. Missing Required Fields Error
- **Problem:** `Please provide all required fields`
- **Solution:** Ensure all required fields are provided: `campaignName`, `userDescription`, `goalType`, `totalBudget`, `currency`, `startDate`, `endDate`

#### 2. Invalid Date Range
- **Problem:** `End date must be after start date`
- **Solution:** Make sure `endDate` is after `startDate`. Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

#### 3. Invalid Budget
- **Problem:** `Budget must be greater than 0`
- **Solution:** Ensure `totalBudget` is a positive number

#### 4. Authentication Error
- **Problem:** `Authentication error: Token required`
- **Solution:** Include the `Authorization: Bearer YOUR_TOKEN` header in your request

#### 5. Invalid Goal Type
- **Problem:** Validation error for `goalType`
- **Solution:** Use one of the valid values: `awareness`, `consideration`, `conversion`, `lead_generation`, `retention`

### Campaign Status Values

Campaigns are created with the following status:
- `draft`: Initial status when campaign is created
- `active`: Campaign is currently running (set manually or via update endpoint)
- `completed`: Campaign has finished (set manually or via update endpoint)

### Notes

- Campaigns are automatically associated with the authenticated user
- The AI preview is generated but not saved to the database (it's returned in the response)
- Campaign duration is calculated automatically from start and end dates
- Budget allocation percentages are AI-generated based on campaign goals

## Common Issues & Solutions

### 1. Authentication Error
- **Problem:** `Authentication error: Token required`
- **Solution:** Make sure you're sending the token in the `Authorization` header or socket auth

### 2. userId in Request Body
- **Problem:** Confusion about whether to include `userId` in the request body for `/api/chat/start`
- **Solution:** **Do NOT include the authenticated user's `userId` in the request body.** The authenticated user's `userId` is automatically extracted from the JWT token in the `Authorization` header. The authenticated user's ID is used as the chat owner. Only include the other user's `userId` (required - the userId of the user with INFLUENCER role) and `campaignId` (optional) in the request body.

### 2a. "Invalid access token" Error (401 Unauthorized) - COMMON ISSUE

**If you're getting "Invalid access token" even though you're sure the token is correct, try these steps:**
- **Problem:** Getting `401 Unauthorized` with message "Invalid access token" when calling `/api/chat/start`
- **Possible Causes:**
  1. Token is missing or not set correctly
  2. Token is expired (access tokens expire in 15 minutes by default)
  3. Token is malformed or truncated
  4. Token has quotes around it (should be plain text)
  5. Token was generated with a different JWT_SECRET
  6. User doesn't exist in database (token is valid but user was deleted)

- **Step-by-Step Solution:**

  **Step 1: Get a Fresh Token**
  1. Make a new request: `POST http://localhost:5000/api/auth/login`
  2. Body (JSON):
     ```json
     {
       "email": "your-email@example.com",
       "password": "your-password"
     }
     ```
  3. Send the request
  4. Copy the **entire** `accessToken` from the response (it's a long string starting with `eyJ...`)

  **Step 2: Verify Token Format**
  - Token should look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY5MTEyMTgxLCJleHAiOjE3NjkxMTMwODF9.vCSOU08z1RxrOG6g0LoAVxE7VjPqpD0RVMvxlWr2PIU`
  - It should have **3 parts** separated by dots (`.`)
  - **No quotes** around it
  - **No spaces** before or after

  **Step 3: Set Authorization in Postman**
  1. Open your `POST /api/chat/start` request
  2. Click the **"Authorization"** tab
  3. Select **Type**: `Bearer Token` from dropdown
  4. In the **Token** field:
     - **Option A:** If using environment variable: `{{access_token}}`
     - **Option B:** Paste the token directly (no quotes, no spaces)
  5. **Important:** Make sure there are NO quotes around the token in the field

  **Step 4: Verify Headers (Optional Check)**
  1. Click the **"Headers"** tab
  2. You should see: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  3. If you see quotes like `"Bearer eyJ..."`, remove them

  **Step 5: Test Token Validity**
  - Access tokens expire in **15 minutes** by default
  - If your token is old, login again to get a fresh one
  - Check the token expiration in the response when you login

  **Step 6: Check Server Configuration**
  - Make sure your server is using the same `JWT_SECRET` that was used to generate the token
  - Check your `.env` file or environment variables
  - Default secret is `'your-secret-key'` if no env variable is set

  **Step 7: Verify User Exists**
  - The token might be valid but the user might have been deleted
  - Try logging in again to verify the user account exists

  **Quick Test:**
  ```bash
  # Test with curl to verify token works
  curl -X POST http://localhost:5000/api/chat/start \
    -H "Authorization: Bearer YOUR_TOKEN_HERE" \
    -H "Content-Type: application/json" \
    -d '{"userId": 2, "campaignId": 1}'
  ```

### 3. Chat Not Found
- **Problem:** `Chat not found` or `Influencer not found`
- **Solution:** 
  - Verify the `userId` (in the request body) exists in the User table
  - Verify that user has the INFLUENCER role assigned (check UserRole table)
  - The user must have roleId corresponding to the 'INFLUENCER' role
  - Note: The `userId` in the request body is the userId of a user with the INFLUENCER role - there's no separate influencer table

### 4. Socket Connection Fails
- **Problem:** Socket doesn't connect
- **Solution:** 
  - Check server is running
  - Verify CORS settings in `config/socket.js`
  - Check token is valid

### 5. Messages Not Appearing in Real-Time
- **Problem:** Messages only appear after refresh
- **Solution:** 
  - Make sure both users have joined the chat room
  - Check socket connection is active
  - Verify event listeners are set up

## Quick Test Checklist

- [ ] Server starts without errors
- [ ] Can authenticate and get token
- [ ] Can start a chat with an influencer
- [ ] Can get all chats
- [ ] Can get chat by influencer name
- [ ] Can send message via REST API
- [ ] Can receive messages via REST API
- [ ] Socket.io connects successfully
- [ ] Can join chat room via socket
- [ ] Can send message via socket
- [ ] Can receive messages in real-time
- [ ] Typing indicator works
- [ ] Read receipts work

## Useful Commands

```bash
# Start server
npm run dev

# Check if port is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Test with curl (Windows PowerShell)
curl.exe -X GET "http://localhost:5000/api/chat" -H "Authorization: Bearer TOKEN"
```

