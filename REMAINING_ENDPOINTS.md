# API Endpoints Documentation



## ✅ Already Implemented

### Authentication (`/api/auth`)
- ✅ POST `/signup` - Register new user
- ✅ POST `/login` - Login user
- ✅ POST `/select-role` - Assign role to user
- ✅ POST `/refresh-token` - Refresh access token
- ✅ GET `/google` - Initiate Google OAuth
- ✅ GET `/google/callback` - Google OAuth callback
- ✅ POST `/logout` - Logout user
- ✅ POST `/logout-all` - Logout from all sessions
- ✅ GET `/sessions` - Get user sessions
- ✅ DELETE `/sessions/:id` - Revoke specific session
- ✅ GET `/profile` - Get user profile

### Campaigns (`/api/campaigns`)
- ✅ GET `/` - Get all campaigns for user (with pagination/filters)
- ✅ POST `/ai/generate` - Generate AI campaign preview
- ✅ POST `/draft` - Create campaign as draft
- ✅ POST `/save-and-publish` - Create and publish campaign
- ✅ POST `/save` - Create saved campaign
- ✅ POST `/:id/complete` - Mark campaign as completed
- ✅ POST `/:id/cancel` - Cancel campaign
- ✅ POST `/` - Create manual campaign

### Owner (`/api/owner`)
- ✅ GET `/influencers` - Get all influencer profiles (with filters)
- ✅ GET `/influencers/:id` - Get single influencer profile

### Collaboration (`/api/collaborations`)
- ✅ POST `/` - Send collaboration request

### Admin (`/api/admin`)
- ✅ GET `/analytics` - Get system analytics
- ✅ GET `/users` - Get all users
- ✅ GET `/users/:id` - Get user by ID
- ✅ PATCH `/users/:id/role` - Update user role
- ✅ PATCH `/users/:id/status` - Update user status
- ✅ DELETE `/users/:id` - Delete user
- ✅ GET `/sessions` - Get all sessions
- ✅ GET `/campaigns` - Get all campaigns
- ✅ GET `/campaigns/:id` - Get campaign by ID
- ✅ PATCH `/campaigns/:id/status` - Update campaign status
- ✅ DELETE `/campaigns/:id` - Delete campaign
- ✅ GET `/collaborations` - Get all collaborations
- ✅ GET `/collaboration-requests` - Get all collaboration requests
- ✅ PATCH `/collaboration-requests/:id/status` - Update collaboration request status
- ✅ GET `/collaborations/:id` - Get collaboration by ID
- ✅ PATCH `/collaborations/:id/status` - Update collaboration status
- ✅ GET `/logs` - Get system logs
- ✅ GET `/recent-activity` - Get recent activity
- ✅ DELETE `/service-listings/:id` - Delete service listing
- ✅ GET `/service-listings` - Get all service listings

---

## Missing Endpoints to Implement

### 1. User Profile Management (`/api/profile`)

#### Owner Profile
```
GET    /api/profile/owner              - Get authenticated owner profile
POST   /api/profile/owner              - Create owner profile (onboarding)
PUT    /api/profile/owner              - Update owner profile
DELETE /api/profile/owner              - Delete owner profile
GET    /api/profile/owner/completion   - Get profile completion status
```

#### Influencer Profile
```
GET    /api/profile/influencer         - Get authenticated influencer profile
POST   /api/profile/influencer         - Create influencer profile (onboarding)
PUT    /api/profile/influencer         - Update influencer profile
DELETE /api/profile/influencer         - Delete influencer profile
GET    /api/profile/influencer/completion - Get profile completion status
```

---

### 2. Campaign Details & Relations (`/api/campaigns`)

#### Campaign Detailed Operations
```
GET    /api/campaigns/:id                    - Get single campaign with all relations
PUT    /api/campaigns/:id                    - Update campaign details
DELETE /api/campaigns/:id                    - Delete campaign
```

#### Target Audience (nested under campaign)
```
GET    /api/campaigns/:id/target-audience    - Get campaign target audience
PUT    /api/campaigns/:id/target-audience    - Update target audience
DELETE /api/campaigns/:id/target-audience    - Remove target audience
```

#### KPIs (nested under campaign)
```
GET    /api/campaigns/:id/kpis               - Get campaign KPIs
POST   /api/campaigns/:id/kpis               - Add new KPI
PUT    /api/campaigns/:id/kpis/:kpiId        - Update KPI
DELETE /api/campaigns/:id/kpis/:kpiId        - Delete KPI
```

#### Content Calendar (nested under campaign)
```
GET    /api/campaigns/:id/content-calendar        - Get campaign content calendar
POST   /api/campaigns/:id/content-calendar        - Add content calendar item
PUT    /api/campaigns/:id/content-calendar/:itemId - Update calendar item
DELETE /api/campaigns/:id/content-calendar/:itemId - Delete calendar item
PATCH  /api/campaigns/:id/content-calendar/:itemId/status - Update content status
```

#### Campaign AI Versions (nested under campaign)
```
GET    /api/campaigns/:id/ai-versions             - Get all AI versions for campaign
GET    /api/campaigns/:id/ai-versions/:versionId  - Get specific AI version
POST   /api/campaigns/:id/ai-versions             - Create new AI version
PATCH  /api/campaigns/:id/ai-versions/:versionId/activate - Activate AI version
DELETE /api/campaigns/:id/ai-versions/:versionId  - Delete AI version
```

---

### 3. Collaboration Requests (`/api/collaboration-requests`)

**Purpose:** Manage the request lifecycle BEFORE a collaboration is created. Once a request is accepted, a Collaboration entity is created automatically.

**State Machine:**
```
pending → negotiated → accepted (creates Collaboration) | rejected | expired
```

**Allowed Transitions:**
- `pending` → `negotiated` (influencer counter-proposes)
- `pending` → `accepted` (creates Collaboration entity)
- `pending` → `rejected`
- `pending` → `expired` (auto-transition after timeout)
- `negotiated` → `accepted` (owner agrees to new terms)
- `negotiated` → `rejected`
- `negotiated` → `expired`

#### Owner Operations
```
POST   /api/collaboration-requests               - Send collaboration request to influencer
GET    /api/collaboration-requests               - Get all sent requests (owner view)
GET    /api/collaboration-requests/:id           - Get request details
PUT    /api/collaboration-requests/:id           - Update request details (only in pending state)
DELETE /api/collaboration-requests/:id           - Cancel/withdraw request
```

#### Influencer Operations
```
GET    /api/collaboration-requests/incoming      - Get received requests (influencer view)
POST   /api/collaboration-requests/:id/accept    - Accept request (creates Collaboration)
POST   /api/collaboration-requests/:id/reject    - Reject request
POST   /api/collaboration-requests/:id/negotiate - Counter-propose terms (updates to negotiated state)
```

---

### 4. Collaborations (`/api/collaborations`)

**Purpose:** Manage ACTIVE collaborations (created after request acceptance). This is the working environment for both parties.

**Note:** Collaborations are **automatically created** when a collaboration request is accepted. They cannot be manually created via POST.

#### Main Operations
```
GET    /api/collaborations                   - Get all user's collaborations (filterable by status)
GET    /api/collaborations/:id               - Get collaboration details with full data
PATCH  /api/collaborations/:id/status        - Update collaboration status
DELETE /api/collaborations/:id               - Delete/archive collaboration
```

#### Analytics & Reporting
```
GET    /api/collaborations/:id/analytics     - Get collaboration performance metrics
GET    /api/collaborations/:id/timeline      - Get collaboration timeline/activity log
GET    /api/collaborations/:id/deliverables  - Get all deliverables for collaboration
```

---

### 5. Collaboration Contracts (`/api/collaborations/:collabId/contracts`)

**Purpose:** Legal agreements within an active collaboration.

```
POST   /api/collaborations/:collabId/contracts              - Create contract
GET    /api/collaborations/:collabId/contracts              - Get all contracts
GET    /api/collaborations/:collabId/contracts/:id          - Get contract details
PUT    /api/collaborations/:collabId/contracts/:id          - Update contract (draft only)
PATCH  /api/collaborations/:collabId/contracts/:id/status   - Update contract status
POST   /api/collaborations/:collabId/contracts/:id/sign     - Sign contract
POST   /api/collaborations/:collabId/contracts/:id/terminate - Terminate contract
```

---

### 6. Collaboration Boards (`/api/collaborations/:collabId/boards`)

**Purpose:** Task organization boards within a collaboration (Kanban-style).

```
GET    /api/collaborations/:collabId/boards           - Get all boards
POST   /api/collaborations/:collabId/boards           - Create new board
GET    /api/collaborations/:collabId/boards/:boardId  - Get board with tasks
PUT    /api/collaborations/:collabId/boards/:boardId  - Update board details
DELETE /api/collaborations/:collabId/boards/:boardId  - Delete board
```

---

### 7. Collaboration Tasks (`/api/collaborations/:collabId/tasks`)

**Purpose:** Task management within collaboration boards.

```
GET    /api/collaborations/:collabId/tasks                - Get all tasks (filterable)
POST   /api/collaborations/:collabId/tasks                - Create new task
GET    /api/collaborations/:collabId/tasks/:taskId        - Get task details
PUT    /api/collaborations/:collabId/tasks/:taskId        - Update task
DELETE /api/collaborations/:collabId/tasks/:taskId        - Delete task
PATCH  /api/collaborations/:collabId/tasks/:taskId/status - Update task status
PATCH  /api/collaborations/:collabId/tasks/:taskId/assign - Assign task to user
PATCH  /api/collaborations/:collabId/tasks/:taskId/complete - Mark task complete
```

---

### 8. Collaboration Chat (`/api/collaborations/:collabId/chat`)

**Purpose:** Real-time communication within a collaboration context. Each collaboration has its own chat room.

**Architecture Note:** Chat is nested under collaborations, not standalone. Chat rooms are automatically created with each collaboration.

#### Chat Room Operations
```
GET    /api/collaborations/:collabId/chat              - Get chat room details
PUT    /api/collaborations/:collabId/chat              - Update chat settings
```

#### Participants Management
```
GET    /api/collaborations/:collabId/chat/participants     - Get chat participants
POST   /api/collaborations/:collabId/chat/participants     - Add participant
DELETE /api/collaborations/:collabId/chat/participants/:userId - Remove participant
PATCH  /api/collaborations/:collabId/chat/participants/:userId/role - Update role
```

#### Messages
```
GET    /api/collaborations/:collabId/chat/messages                - Get messages (paginated)
POST   /api/collaborations/:collabId/chat/messages                - Send message
GET    /api/collaborations/:collabId/chat/messages/:messageId     - Get specific message
PUT    /api/collaborations/:collabId/chat/messages/:messageId     - Edit message
DELETE /api/collaborations/:collabId/chat/messages/:messageId     - Delete message
PATCH  /api/collaborations/:collabId/chat/messages/:messageId/read - Mark as read
```

#### Real-time Communication
```
WS     /api/collaborations/:collabId/chat/live         - WebSocket connection for live chat
```

---

### 9. Service Listings (`/api/service-listings`)

**Purpose:** Influencers advertise their services; Owners browse and make offers.

#### Influencer Operations
```
POST   /api/service-listings                - Create service listing
GET    /api/service-listings/my-listings    - Get my listings
GET    /api/service-listings/:id            - Get listing details
PUT    /api/service-listings/:id            - Update listing
DELETE /api/service-listings/:id            - Delete listing
PATCH  /api/service-listings/:id/status     - Update status (draft/published/archived)
```

#### Browse & Search
```
GET    /api/service-listings                - Browse all published listings (public/owner)
GET    /api/service-listings/search         - Search with filters
GET    /api/service-listings/categories     - Get available categories
```

---

### 10. Offers (`/api/offers`)

**Purpose:** Owners make offers on influencer service listings.

**State Machine:**
```
pending → negotiated → accepted | rejected | expired | withdrawn
```

**Allowed Transitions:**
- `pending` → `negotiated` (influencer counter-offers)
- `pending` → `accepted` (influencer accepts)
- `pending` → `rejected` (influencer declines)
- `pending` → `withdrawn` (owner cancels)
- `pending` → `expired` (auto-transition after timeout)
- `negotiated` → `accepted` (owner agrees to counter)
- `negotiated` → `rejected`
- `negotiated` → `withdrawn`
- `negotiated` → `expired`

#### Owner Operations
```
POST   /api/service-listings/:id/offers     - Make offer on listing
GET    /api/offers                          - Get all my offers
GET    /api/offers/:id                      - Get offer details
PUT    /api/offers/:id                      - Update offer (pending/negotiated only)
DELETE /api/offers/:id                      - Withdraw offer
```

#### Influencer Operations
```
GET    /api/offers/incoming                 - Get received offers
POST   /api/offers/:id/accept               - Accept offer
POST   /api/offers/:id/reject               - Reject offer
POST   /api/offers/:id/counter              - Counter-offer (updates to negotiated state)
```

---

### 11. Service Requests (`/api/service-requests`)

**Purpose:** Owners post service needs; Influencers submit proposals.

#### Owner Operations
```
POST   /api/service-requests                - Create service request
GET    /api/service-requests/my-requests    - Get my requests
GET    /api/service-requests/:id            - Get request details
PUT    /api/service-requests/:id            - Update request
DELETE /api/service-requests/:id            - Delete request
PATCH  /api/service-requests/:id/status     - Update status (draft/published/closed/cancelled)
```

#### Browse & Search
```
GET    /api/service-requests                - Browse all published requests (public/influencer)
GET    /api/service-requests/search         - Search with filters
```

---

### 12. Proposals (`/api/proposals`)

**Purpose:** Influencers submit proposals for owner service requests.

**State Machine:**
```
pending → negotiated → accepted | rejected | expired | withdrawn
```

**Allowed Transitions:**
- `pending` → `negotiated` (owner requests changes)
- `pending` → `accepted` (owner accepts)
- `pending` → `rejected` (owner declines)
- `pending` → `withdrawn` (influencer cancels)
- `pending` → `expired` (auto-transition after timeout)
- `negotiated` → `accepted` (influencer agrees to changes)
- `negotiated` → `rejected`
- `negotiated` → `withdrawn`
- `negotiated` → `expired`

#### Influencer Operations
```
POST   /api/service-requests/:id/proposals  - Submit proposal
GET    /api/proposals                       - Get all my proposals
GET    /api/proposals/:id                   - Get proposal details
PUT    /api/proposals/:id                   - Update proposal (pending/negotiated only)
DELETE /api/proposals/:id                   - Withdraw proposal
```

#### Owner Operations
```
GET    /api/proposals/incoming              - Get received proposals
POST   /api/proposals/:id/accept            - Accept proposal
POST   /api/proposals/:id/reject            - Reject proposal
POST   /api/proposals/:id/negotiate         - Request changes (updates to negotiated state)
```

---

### 13. Notifications (`/api/notifications`)

**Purpose:** System notifications for users.

```
GET    /api/notifications                   - Get all user notifications (paginated)
GET    /api/notifications/unread            - Get unread notifications count
PATCH  /api/notifications/:id/read          - Mark notification as read
PATCH  /api/notifications/read-all          - Mark all as read
DELETE /api/notifications/:id               - Delete notification
```

---

### 14. Search & Discovery (`/api/search`)

**Purpose:** Unified search endpoint with type-based filtering.

**Query Parameter Architecture:**
```
GET /api/search?type={entity_type}&q={query}&filters={json}
```

**Supported Types:**
- `influencer` - Search influencer profiles
- `campaign` - Search campaigns (admin only)
- `service-listing` - Search service listings
- `service-request` - Search service requests
- `global` - Search across all entities

**Examples:**
```
GET    /api/search?type=influencer&q=fitness&location=NYC
GET    /api/search?type=service-listing&category=photography
GET    /api/search?type=service-request&budget_min=1000
GET    /api/search?type=global&q=marketing
```

---

### 15. Password Management (`/api/auth`)

**Purpose:** Password reset and change operations.

```
POST   /api/auth/forgot-password            - Request password reset email
POST   /api/auth/reset-password/:token      - Reset password with token
POST   /api/auth/change-password            - Change password (authenticated)
```

---

### 16. File Upload (`/api/upload`)

**Purpose:** Handle media and document uploads.

```
POST   /api/upload/image                    - Upload single image
POST   /api/upload/images                   - Upload multiple images
POST   /api/upload/document                 - Upload document (PDF, DOCX)
DELETE /api/upload/:fileId                  - Delete uploaded file
GET    /api/upload/:fileId                  - Get file metadata/URL
```

---

### 17. Analytics & Reports (`/api/analytics`)

**Purpose:** Platform analytics with role-based views using query parameters.

**Query Parameter Architecture:**
```
GET /api/analytics?role={owner|influencer}&metric={metric_name}
```

#### Dashboard Analytics
```
GET    /api/analytics?role=owner              - Owner dashboard overview
GET    /api/analytics?role=influencer         - Influencer dashboard overview
```

#### Detailed Analytics
```
GET    /api/analytics/campaigns?userId={id}        - Campaign performance analytics
GET    /api/analytics/collaborations?userId={id}   - Collaboration analytics
GET    /api/analytics/earnings?userId={id}         - Earnings overview (influencer)
GET    /api/analytics/roi?userId={id}              - ROI analysis (owner)
GET    /api/analytics/performance?userId={id}      - Performance metrics
```

**Example Queries:**
```
GET /api/analytics?role=owner
GET /api/analytics/campaigns?userId=123&dateRange=30d
GET /api/analytics/earnings?userId=456&period=monthly
```

---

## Recommended File Structure

```
controllers/
├── authController.js ✅
├── adminController.js ✅
├── compaginController.js ✅
├── ownerController.js ✅
├── collaborationController.js ✅ (expand for requests + active collaborations)
├── profileController.js ❌ (NEW)
├── collaborationChatController.js ❌ (NEW - nested chat)
├── serviceListingController.js ❌ (NEW)
├── serviceRequestController.js ❌ (NEW)
├── offerController.js ❌ (NEW)
├── proposalController.js ❌ (NEW)
├── notificationController.js ❌ (NEW)
├── uploadController.js ❌ (NEW)
└── analyticsController.js ❌ (NEW)

routes/
├── auth.js ✅
├── admin.js ✅
├── campaign.js ✅
├── owner.js ✅
├── collaboration.js ✅ (expand for nested resources)
├── collaborationRequest.js ❌ (NEW - separate from collaborations)
├── profile.js ❌ (NEW)
├── serviceListing.js ❌ (NEW)
├── serviceRequest.js ❌ (NEW)
├── offer.js ❌ (NEW)
├── proposal.js ❌ (NEW)
├── notification.js ❌ (NEW)
├── upload.js ❌ (NEW)
├── analytics.js ❌ (NEW)
└── search.js ❌ (NEW - unified search)
```

---

## Implementation Notes

### Authentication & Authorization
- All endpoints require `authenticate` middleware except public search/browse
- Role-based authorization via `authorize` middleware (OWNER, INFLUENCER, ADMIN)
- Session-based authentication with refresh tokens

### Validation

- Validate state transitions for Offers, Proposals, and Collaboration Requests

### Error Handling
- Use `AppError` class for consistent error responses
- Include proper HTTP status codes (400, 401, 403, 404, 409, 500)
- Log errors using `logAction` service

### Data Operations

- Add pagination (default: page=1, limit=10) for list endpoints


### Documentation
- Update Swagger/OpenAPI specs for all new endpoints
- Include request/response examples
- Document query parameters and filters
