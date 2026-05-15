# Production QA & Architecture Audit Checklist
## Influencer Marketing Platform — Full System Audit

> **Auditor Role:** Senior QA Engineer + Senior Software Architect  
> **Scope:** Full-stack audit based on actual backend source code  
> **Date:** 2026-05-15  
> **Status:** COMPLETE

---

## TABLE OF CONTENTS

1. [AUTH FLOW](#1-auth-flow)
2. [ONBOARDING FLOW](#2-onboarding-flow)
3. [CAMPAIGN FLOW](#3-campaign-flow)
4. [COLLABORATION REQUEST FLOW](#4-collaboration-request-flow)
5. [CONTRACT FLOW](#5-contract-flow)
6. [TASK FLOW](#6-task-flow)
7. [CHAT / MESSAGING FLOW](#7-chat--messaging-flow)
8. [NOTIFICATION FLOW](#8-notification-flow)
9. [REVIEW FLOW](#9-review-flow)
10. [PROFILE MANAGEMENT FLOW](#10-profile-management-flow)
11. [ADMIN FLOW](#11-admin-flow)
12. [SEARCH / FILTER / PAGINATION FLOW](#12-search--filter--pagination-flow)
13. [ANALYTICS FLOW](#13-analytics-flow)
14. [SOCIAL CHANNELS & SCHEDULED POSTS FLOW](#14-social-channels--scheduled-posts-flow)
15. [MASTER AUDIT CHECKLIST](#15-master-project-audit-checklist)

---

## 1. AUTH FLOW

### 1.1 Signup

**Happy Path**
- [ ] POST `/api/auth/signup` with valid email + password → 201 + `{ userId, needsRoleSelection: true }`
- [ ] Password is hashed by Sequelize `beforeCreate` hook (not stored plaintext)
- [ ] User is created with `status: 'INCOMPLETE'`
- [ ] `logAction` fires (fire-and-forget, non-blocking)

**Edge Cases**
- [ ] Duplicate email → passport local-signup returns 400, not 500
- [ ] Email with uppercase characters → test normalization (`A@B.com` vs `a@b.com`)
- [ ] Password exactly 6 chars → allowed; 5 chars → rejected
- [ ] Very long passwords (>100 chars) → rejected by model validator
- [ ] Empty firstName / lastName (spaces only) → model `notEmpty` validation fires

**Invalid States**
- [ ] Signup with `status: 'ACTIVE'` in body → ignored or blocked? (model defaults to INCOMPLETE but body field isn't blocked)
- [ ] Signup with `googleId` in body → should not be settable via signup route

**Security Checks**
- [ ] No JWT is returned at signup — must login separately ✓
- [ ] Passport error objects don't leak stack traces to client
- [ ] Password never returned in any response body

**Backend Validation**
- [ ] `isEmail` validated by Sequelize model ✓
- [ ] Length `[2,50]` on first/last name ✓
- [ ] **MISSING**: No rate limiting on signup endpoint — brute-force account creation possible 🔴

**DB Consistency**
- [ ] After signup: User exists, NO UserRole row exists, NO profile exists — correct state
- [ ] If `logAction` throws, transaction is NOT rolled back (fire-and-forget) — acceptable ✓

**Potential Bugs**
- 🔴 **BUG**: `passport.authenticate('local-signup', ...)` — if passport strategy throws, `next(err)` is called, but the response `sendSuccess` has already been called in some error paths. Check for double-response scenarios.
- 🟡 **BUG**: No email verification step. Users can sign up with any email without proving ownership.

---

### 1.2 Login

**Happy Path**
- [ ] POST `/api/auth/login` → 200 + `{ accessToken, roles, needsRoleSelection, needsOnboarding }`
- [ ] `refreshToken` set as HttpOnly cookie (30 days)
- [ ] Session record created in DB with hashed token
- [ ] `logAction` fires for LOGIN

**Edge Cases**
- [ ] Login with Google OAuth user (no password) → `comparePassword` returns false — returns 401 ✓
- [ ] Login with BLOCKED user → passport returns user, but **no status check exists** 🔴
- [ ] Login with SUSPENDED user → **same — no status check** 🔴
- [ ] Login when user has no roles → returns `needsRoleSelection: true` ✓
- [ ] User has INFLUENCER role but no InfluencerProfile → `needsOnboarding: true` ✓
- [ ] Multiple roles (OWNER + INFLUENCER) → only checks INFLUENCER first due to `else if`

**Security Checks**
- [ ] `secure: process.env.NODE_ENV === 'production'` on cookie — correct ✓
- [ ] `sameSite: 'strict'` on cookie ✓
- [ ] **MISSING**: No rate limiting on login endpoint — brute-force password attacks possible 🔴
- [ ] **MISSING**: No account lockout after N failed attempts 🔴
- [ ] Refresh token stored as SHA256 hash in DB — plain token only in cookie ✓

**DB Consistency**
- [ ] Each login creates a new Session row — old sessions not cleaned up automatically 🟡
- [ ] `expiresAt` set to 30 days — but no cron job to purge expired sessions confirmed

**Race Condition**
- [ ] Two simultaneous logins from same user → two sessions created (acceptable but worth limiting)

---

### 1.3 Token Refresh

**Happy Path**
- [ ] POST `/api/auth/refresh-token` with valid cookie → 200 + new `accessToken`
- [ ] Session lookup by hash + `revokedAt: null` ✓
- [ ] JWT `userId` binding verified against session user ✓

**Edge Cases**
- [ ] Expired JWT refresh token → `TokenExpiredError` → 401 ✓
- [ ] Revoked session → `revokedAt !== null` → 401 ✓
- [ ] Session `expiresAt` in the past → `isExpired()` check → 401 ✓
- [ ] Cookie contains quoted string → trimmed by `replace(/^["']|["']$/g, '')` ✓
- [ ] Token with wrong format (not 3 parts) → rejected ✓

**Potential Bugs**
- 🟡 **BUG**: Refresh does not issue a new refresh token (token rotation not implemented). If refresh token is stolen, attacker can use it indefinitely until session expires.

---

### 1.4 Logout

**Happy Path**
- [ ] POST `/api/auth/logout` → 200, session `revokedAt` set, cookie cleared ✓

**Edge Cases**
- [ ] Logout without cookie → 400 "No active session found" ✓
- [ ] `req.user` is required (authenticate middleware must run first) ✓
- [ ] Session not found in DB (already revoked) → `if (session)` guard skips gracefully ✓

**Missing**
- [ ] **MISSING**: No websocket disconnect triggered on logout 🟡

---

### 1.5 Google OAuth

**Happy Path**
- [ ] New user via Google → `isNewUser: true` → creates User, redirects with `needsRoleSelection: true`
- [ ] Existing user with same email → links `googleId` to existing account ✓
- [ ] `accessToken` appended to redirect URL as query param

**Security Issues**
- 🔴 **CRITICAL SECURITY BUG**: `accessToken` is passed in the URL query string on Google callback redirect: `redirectUrl.searchParams.append('accessToken', accessToken)`. This means the JWT appears in:
  - Browser history
  - Server access logs
  - Referrer headers
  - Any analytics tools
  - **This is a major security vulnerability — token should be in a cookie or short-lived code**
- 🔴 **HARDCODED URL**: `new URL('http://localhost:5173/auth/google/callback')` — hardcoded localhost. Will break in production.

---

### 1.6 Role Selection

**Happy Path**
- [ ] POST `/api/auth/select-role` with `userId` + `roleId` → 201 + `needsOnBoarding: true`
- [ ] ADMIN role blocked from self-assignment ✓
- [ ] Duplicate role assignment blocked ✓
- [ ] Profile created automatically on role assignment ✓

**Security Issues**
- 🔴 **CRITICAL**: `selectRole` is NOT authenticated. Any anonymous request can assign a role to any `userId` by guessing IDs. The route `/api/auth/select-role` has no `authenticate` middleware.
- [ ] **MISSING**: No check that `userId === req.user.id` — an attacker can assign roles to other users

---

## 2. ONBOARDING FLOW

### 2.1 Owner Onboarding

**Happy Path**
- [ ] PATCH/POST onboarding endpoint with profile data → profile updated
- [ ] `completionPercentage` recalculated after update
- [ ] `isOnboarded: true` set when sufficient data provided

**Edge Cases**
- [ ] Onboarding with empty arrays for `target_market` → allowed by model
- [ ] `company_size` must be one of `Solo|Small|Mid|Enterprise` — enum validation
- [ ] Partial onboarding → `isCompleted: false`, user can still use platform partially

**DB Consistency**
- [ ] OwnerProfile.userId is unique — no duplicate profiles per user ✓

---

### 2.2 Influencer Onboarding

**Happy Path**
- [ ] Update `InfluencerProfile` via `PATCH /api/auth/influencer-profile`
- [ ] `allowed` field list enforced — unknown fields ignored ✓
- [ ] JSON string fields (socialMediaLinks, categories etc.) parsed automatically ✓

**Potential Bugs**
- 🟡 `calculateInfluencerProfileCompletion` result written back, but original `updates` applied first — if `isOnboarded` is set to `true` in updates, completion might not be recalculated against full profile state
- 🟡 `image` field can be set to any URL — no validation that it's an actual image or from trusted CDN

---

## 3. CAMPAIGN FLOW

### 3.1 AI Campaign Generation

**Happy Path**
- [ ] POST `/api/campaigns/ai/generate` → AI strategy generated (NOT saved to DB) ✓
- [ ] `AI_CAMPAIGN_READY` notification sent after generation ✓

**Edge Cases**
- [ ] `startDate >= endDate` → 400 ✓
- [ ] `budget_amount <= 0` → 400 ✓
- [ ] `campaign_goal` not in ENUM set → 400 ✓
- [ ] Missing required fields → 400 'Please provide all required fields'
- [ ] AI service throws → 500 propagated to client

**Missing Checks**
- 🟡 **MISSING**: No timeout on AI generation call — long-running AI requests can block the event loop
- 🟡 `entityId: null` set on `AI_CAMPAIGN_READY` notification — can't navigate to entity from notification

---

### 3.2 Campaign Lifecycle

**Happy Path**
- [ ] `draft` → saved via POST `/api/campaigns/draft`
- [ ] `saved` → via POST `/api/campaigns/save`
- [ ] `saved + isPublished: true` → via POST `/api/campaigns/save-and-publish`
- [ ] `completed` → via POST `/api/campaigns/:id/complete`
- [ ] `cancelled` → via POST `/api/campaigns/:id/cancel`

**Critical Issues**
- 🔴 **BUG**: `draftCampaign` uses `userId: req.user?.id || 1` — falls back to `userId: 1` if `req.user` is null. The `authenticate` middleware should ensure `req.user` exists, but this fallback is dangerous.
- 🔴 **BUG**: Same fallback exists in `saveCampaign` and `saveAndPublish`.
- 🟡 **MISSING**: No ownership check when completing/cancelling a campaign — any OWNER can complete any campaign by guessing `id`.
- 🟡 **MISSING**: No check that all active collaborations are resolved before completing a campaign.

**Permission Checks**
- [ ] All campaign routes use `authenticate + authorize('OWNER')` ✓
- [ ] Influencers cannot access `/api/campaigns/*` ✓
- [ ] **MISSING**: No check that `campaign.userId === req.user.id` on GET `/api/campaigns/:id` — any owner can read any campaign 🟡

**DB Consistency**
- [ ] Campaign creation with relations uses transaction ✓
- [ ] ContentCalendar platform field uses `ENUM` — not validated in `createCampaignRelations` (only contentType validated) 🟡
- [ ] KPI `targetValue` is a string — no format validation

---

## 4. COLLABORATION REQUEST FLOW

### 4.1 Invite (Owner → Influencer)

**Happy Path**
- [ ] POST `/api/collaboration-requests` → request created with `status: 'pending'`
- [ ] Duplicate active request blocked ✓
- [ ] Campaign ownership verified ✓
- [ ] Campaign in INVALID_CAMPAIGN_STAGES (`draft`, `cancelled`) blocked ✓
- [ ] `CAMPAIGN_INVITATION` notification sent to influencer ✓

**Critical Issues**
- 🔴 **BUG**: `INVALID_CAMPAIGN_STAGES = ['draft', 'cancelled']` — allows invitations on `ai_generated` campaigns. Campaign comment says "Only active campaigns (ai_generated, saved, completed) are allowed" — but `ai_generated` campaigns may not be ready for influencer engagement.
- 🟡 **MISSING**: No check that influencer exists and has INFLUENCER role — owner can invite any userId including another owner or admin.
- 🟡 **MISSING**: No limit on how many invitations an owner can send per campaign.

**State Machine**
- [ ] PENDING → NEGOTIATING ✓ (influencer counters)
- [ ] PENDING → ACCEPTED ✓ (influencer accepts)
- [ ] PENDING → REJECTED ✓ (influencer rejects)
- [ ] PENDING → CANCELLED ✓ (owner cancels)
- [ ] NEGOTIATING → ACCEPTED ✓
- [ ] NEGOTIATING → REJECTED ✓
- [ ] NEGOTIATING → NEGOTIATING ✓ (further counters)

**Turn-Based Logic**
- [ ] PENDING state → only influencer can respond ✓
- [ ] NEGOTIATING state → whoever countered last must wait ✓
- [ ] `lastCounteredBy` tracked correctly ✓

**Race Conditions**
- 🔴 **RACE CONDITION**: `respond` function does NOT use a database transaction. If two requests arrive simultaneously (e.g., both parties accept at same time), the state machine transition check and save are not atomic. Two Collaborations could be created.

---

### 4.2 Accept → Collaboration Creation

**Happy Path**
- [ ] Influencer accepts → request status = `accepted`, Collaboration created with `pending_contract_sign` ✓
- [ ] Duplicate Collaboration guard exists ✓
- [ ] `CAMPAIGN_APPROVED` notification sent ✓

**Issues**
- 🟡 `notifyUserId` logic: `actorId === request.ownerId ? request.influencerId : request.ownerId` — correct but notification type `CAMPAIGN_APPROVED` is misleading for a collaboration request acceptance (not a campaign approval).

---

## 5. CONTRACT FLOW

### 5.1 Contract Creation

**Happy Path**
- [ ] POST contract → requires `pending_contract_sign` status ✓
- [ ] `agreedPrice` pulled from accepted `proposedBudget` — owner cannot change price ✓
- [ ] `deliverables` must be non-empty array ✓
- [ ] Duplicate contract blocked ✓
- [ ] `CONTRACT_CREATED` notification to owner ✓
- [ ] `CONTRACT_SENT` notification to influencer ✓

**Critical Issues**
- 🔴 **BUG**: Contract creation only allowed when collaboration is `pending_contract_sign`. But if influencer's counter-offer was accepted, `proposedBudget` is updated to `counterPrice`. However, if NO budget was set on initial request, `finalPrice` = 0 → throws error. **EDGE CASE**: Collaborations created without a budget will be permanently stuck.
- 🟡 **MISSING**: No `startDate` / `endDate` required validation on contract creation.

---

### 5.2 Contract Signing

**Happy Path**
- [ ] Owner signs → `ownerSigned: true`, `ownerSignedAt` set ✓
- [ ] Influencer signs → `influencerSigned: true`, `influencerSignedAt` set ✓
- [ ] Both signed → `finalizeSignedContract` called → status = `signed`, collaboration advances ✓
- [ ] Uses `SELECT ... FOR UPDATE` (row-level locking) ✓ — race condition protected

**Edge Cases**
- [ ] Owner signs twice → `contract.status !== 'sent'` check after first sign — what is status after first sign? (remains `sent` until both signed) ✓
- [ ] Influencer signs after owner → triggers finalization ✓
- [ ] Contract in `cancelled` status → cannot be signed ✓

**Missing Checks**
- 🟡 **MISSING**: No notification emitted when influencer signs (owner not notified of partial signature)
- 🟡 **MISSING**: After both sign, `CONTRACT_SIGNED` notification not confirmed in service — check `finalizeSignedContract` implementation

---

## 6. TASK FLOW

### 6.1 Task Lifecycle

**State Machine**
- [ ] `todo` → `in_progress` (influencer starts)
- [ ] `in_progress` → `in_review` (influencer submits)
- [ ] `in_review` → `approved` (owner approves)
- [ ] `in_review` → `rejected` (owner rejects, goes back to `in_progress` or `todo`)
- [ ] `rejected` → `in_progress` (influencer revises)

**Happy Path**
- [ ] Owner creates task for collaboration in `in_progress` or `live` status
- [ ] Influencer starts task → `todo` → `in_progress`
- [ ] Influencer submits with `submissionNote` → `in_review`
- [ ] Owner approves → `approved`, `completedAt` set

**Critical Issues**
- 🔴 **MISSING**: `createTask` in controller does not verify that the collaboration belongs to `req.user.id` (owner). Any authenticated OWNER can create tasks on any collaboration by guessing `collaborationId`.
- 🔴 **MISSING**: `getTaskById` has no authorization check — any authenticated user can read any task.
- 🟡 **MISSING**: No check that all tasks are approved before `completeCollaboration` can be called (check in collaborationService.completeCollaboration — needs verification).
- 🟡 **MISSING**: No `TASK_FINAL_REJECTED` notification trigger after N rejections.

**DB Consistency**
- [ ] `completedAt` set on approval ✓
- [ ] `submittedAt` set on submission ✓
- [ ] `reviewNote` set on rejection — check implementation

---

## 7. CHAT / MESSAGING FLOW

### 7.1 WebSocket Connection

**Happy Path**
- [ ] Client connects with valid JWT → `socket.userId` set, user joins `user:{id}` room
- [ ] Client emits `join_collaboration_chat` → chat room found or created, last 50 messages returned ✓
- [ ] Unread count returned on join ✓

**Security Issues**
- 🔴 **MISSING**: Socket authentication mechanism — check `socket/index.js` for JWT verification on connection. If no auth on socket upgrade, any client can connect without a valid token.
- 🟡 **MISSING**: `join_room` event accepts any `chatRoomId` — participant check is there ✓ but room existence check doesn't verify the room belongs to a collaboration the user is part of.

**Message Sending**
- [ ] `send_message` → participant check ✓ → message created → `message_received` emitted to room ✓
- [ ] `MESSAGE_RECEIVED` notification sent to other participants ✓
- [ ] Empty message content rejected ✓
- [ ] Media URL fallback (`[Media]` as content) — not stored as actual media, just text marker 🟡

**Race Conditions**
- 🟡 `getOrCreateCollaborationChat` — check if row-level lock used to prevent duplicate ChatRoom creation on simultaneous connections.

**Missing Features**
- 🟡 **MISSING**: Message edit does not emit WebSocket event — other clients won't see the edit in real time.
- 🟡 **MISSING**: Message delete does not emit WebSocket event — other clients won't see the deletion.
- 🟡 **MISSING**: No pagination for `join_room` (only loads last 50 messages — older messages inaccessible via socket).
- 🟡 **MISSING**: `replyToId` captured in `send_message` data but not saved to Message model (Message model has no `replyToId` field).
- 🟡 **MISSING**: Typing indicator uses `socket.user.name` but socket attaches `socket.user` as full user object — verify `name` property exists or use `firstName + lastName`.

**Status Flow**
- [ ] New message → `sent` ✓
- [ ] Immediately updated to `delivered` after emission ✓
- [ ] `mark_messages_read` → `read` ✓
- [ ] `messages_read` event emitted to room after marking ✓

---

## 8. NOTIFICATION FLOW

### 8.1 Notification Creation

**Happy Path**
- [ ] `createNotification` → DB insert → `emitToUser(userId, 'notification', ...)` ✓
- [ ] `notification_count_updated` emitted after creation ✓
- [ ] Pagination supported in `getUserNotifications` ✓

**Missing Triggers** (Events that should create notifications but may not)
- 🟡 No `TASK_SUBMITTED` notification when influencer submits task
- 🟡 No `TASK_APPROVED` notification when owner approves task
- 🟡 No `TASK_REJECTED` notification when owner rejects task
- 🟡 No `CONTRACT_SIGNED` notification when both parties sign
- 🟡 Counter offer uses `CAMPAIGN_INVITATION` type — misleading, should use `OFFER_MADE` 🔴
- 🟡 No notification when collaboration is cancelled

**Security**
- [ ] `markAsRead` verifies `userId` matches notification's `userId` ✓ (check implementation)
- 🔴 **MISSING**: No authorization check that user can only read THEIR OWN notifications via REST endpoint

---

## 9. REVIEW FLOW

### 9.1 Review Creation

**Happy Path**
- [ ] Owner reviews influencer after completed collaboration
- [ ] `rating` 1-5 validated ✓
- [ ] Optional `reviewText`

**Critical Issues**
- 🔴 **MISSING**: No check that the collaboration is `completed` before allowing review — reviews on active collaborations possible.
- 🔴 **MISSING**: No uniqueness check — owner can submit multiple reviews for same collaboration.
- 🟡 **MISSING**: No check that `ownerId` / `influencerId` in request body matches actual collaboration participants.

---

## 10. PROFILE MANAGEMENT FLOW

### 10.1 Owner Profile

**Issues**
- 🟡 `brand_name` in OwnerProfile is snake_case (inconsistent with camelCase convention)
- 🟡 No validation on `website` field (any string accepted — not necessarily a URL)
- 🟡 `image` field set to any URL — no CDN validation

### 10.2 Influencer Profile

**Issues**
- 🟡 `followersCount` is stored as STRING not INTEGER — arithmetic queries impossible
- 🟡 `engagementRate` is stored as STRING — same issue
- 🔴 **MISSING**: `completionPercentage` is recalculated after `profile.update(updates)` — but `profile` object in memory may not reflect the saved state if `updates` contain partial data. Should reload from DB before calculating.

---

## 11. ADMIN FLOW

**Critical Issues**
- 🔴 **MISSING**: No admin-specific routes confirmed. Check `controllers/adminController.js` for admin-only endpoints.
- 🔴 **MISSING**: Admin role cannot be self-assigned (blocked in `selectRole`) ✓, but no endpoint to assign admin role at all — admin users can only be created via seed data.
- 🟡 **MISSING**: No audit log viewer for admins
- 🟡 **MISSING**: No user management (block/suspend/activate) routes confirmed via routes scan

---

## 12. SEARCH / FILTER / PAGINATION FLOW

**Issues Found**
- 🟡 `listByCampaign` accepts `status` as raw query param — no ENUM validation before DB query.
- 🟡 `listMySent`, `listMyReceived` — same raw status param issue.
- 🔴 **MISSING**: No pagination on collaboration request lists — could return thousands of records.
- 🔴 **MISSING**: No pagination on task lists per collaboration.
- 🟡 **MISSING**: No sorting options on most list endpoints.
- 🟡 **MISSING**: No input sanitization on text-based search params — SQL injection partially mitigated by Sequelize ORM but parameterized queries should be confirmed everywhere.

---

## 13. ANALYTICS FLOW

**Issues Found**
- 🟡 `getCampaignAnalytics` returns aggregated data — check if it respects `userId` ownership (only owner's own campaigns).
- 🟡 `PostAnalytics` model exists but no confirmed cron job to fetch analytics from social platforms automatically.
- 🟡 Dashboard statistics may include data from `cancelled` collaborations in totals — verify filter logic.
- 🔴 **MISSING**: No caching on analytics endpoints — repeated calls will hit DB every time.

---

## 14. SOCIAL CHANNELS & SCHEDULED POSTS FLOW

**Issues Found**
- 🔴 `accessToken` and `refreshToken` stored in Channel table — if DB is compromised, all OAuth tokens leak. Should be encrypted at rest.
- 🟡 `tokenExpiresAt` tracked, but no confirmed auto-refresh logic for expired tokens.
- 🟡 `retryCount` tracked on `ScheduledPost` but no confirmed retry logic (cron job?).
- 🟡 `ScheduledPost.status = 'failed'` with `errorMessage` but no alert/notification to user.

---

## 15. MASTER PROJECT AUDIT CHECKLIST

---

### 🔴 CRITICAL ISSUES (Must fix before production)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | `selectRole` route has no `authenticate` middleware — anonymous users can assign roles to any userId | `routes/auth.js:36` | Auth bypass |
| 2 | Google OAuth callback passes JWT in URL query string | `authController.js:567` | Token exposure in logs/history |
| 3 | Google callback URL hardcoded to `localhost:5173` | `authController.js:562` | Production breakage |
| 4 | No check for BLOCKED/SUSPENDED user status at login | `authController.js:117` | Blocked users can log in |
| 5 | `respond()` in collaboration request has no DB transaction | `collaborationRequestService.js:144` | Race condition creating duplicate Collaborations |
| 6 | `createTask` does not verify collaboration ownership | `collaborationTasksController.js:7` | IDOR vulnerability |
| 7 | `getTaskById` has no authorization check | `collaborationTasksController.js:42` | Unauthorized data access |
| 8 | No review uniqueness constraint — duplicate reviews possible | `reviewController` | Data integrity |
| 9 | No review requires collaboration to be `completed` | Review service | Logic violation |
| 10 | Social channel OAuth tokens stored unencrypted | `Channel` model | Token exposure on DB breach |
| 11 | `userId: req.user?.id \|\| 1` fallback in campaign controllers | `compaginController.js:313,357,431` | Data assigned to user #1 on auth error |

---

### 🔒 SECURITY ISSUES

| # | Issue | Severity |
|---|-------|----------|
| 1 | No rate limiting on `/api/auth/login` — brute force possible | HIGH |
| 2 | No rate limiting on `/api/auth/signup` — spam account creation | HIGH |
| 3 | No account lockout after failed login attempts | HIGH |
| 4 | JWT in URL query string on OAuth redirect | CRITICAL |
| 5 | No refresh token rotation — stolen token reusable for 30 days | MEDIUM |
| 6 | WebSocket authentication not confirmed — verify JWT check on socket upgrade | HIGH |
| 7 | Notification endpoints may not enforce userId ownership | MEDIUM |
| 8 | Raw `status` query param passed to DB without ENUM validation | LOW |

---

### ⚙️ LOGIC ISSUES

| # | Issue | Location |
|---|-------|----------|
| 1 | User with both OWNER+INFLUENCER roles: `needsOnboarding` only checks first matching role | `authController.js:180` |
| 2 | Counter-offer notification uses wrong type `CAMPAIGN_INVITATION` instead of `OFFER_MADE` | `collaborationRequestService.js:242` |
| 3 | Campaign `ai_generated` stage allows invitations — likely unintended | `collaborationRequestController.js:9` |
| 4 | No check that all tasks approved before `completeCollaboration` | collaborationService |
| 5 | `proposedBudget = null` leads to stuck collaboration (no contract possible) | contractService |
| 6 | Message `replyToId` accepted but not persisted (no DB column) | chatHandler |
| 7 | Typing indicator accesses `socket.user.name` (non-existent property) | chatHandler.js:206 |
| 8 | Any OWNER can GET any campaign by ID (no ownership check on GET `/api/campaigns/:id`) | compaginController |
| 9 | `influencerId` in invite not verified to be an actual INFLUENCER role user | collaborationRequestService |
| 10 | `TASK_SUBMITTED/APPROVED/REJECTED` notifications not triggered | tasksService |

---

### 🎨 UX ISSUES

| # | Issue |
|---|-------|
| 1 | No email verification — users can sign up with fake emails |
| 2 | Password reset flow exists (tokens in User model) but completeness unconfirmed |
| 3 | `needsOnBoarding` (capital B) vs `needsOnboarding` inconsistency in API responses |
| 4 | `completionPercentage` recalculated but caller must re-fetch — not returned as part of update in all flows |
| 5 | No typing indicator stop timeout — if user closes browser mid-typing, `user_typing` never cleared |
| 6 | Chat messages only load last 50 — no REST pagination endpoint for older messages confirmed |
| 7 | `[Media]` as message content for media uploads is jarring UX |
| 8 | No `read` receipt visible to sender in chat |

---

### 📈 SCALABILITY ISSUES

| # | Issue |
|---|-------|
| 1 | No caching layer (Redis) — every analytics/dashboard call hits PostgreSQL |
| 2 | No pagination on collaboration request lists or task lists |
| 3 | Session table grows indefinitely — no cleanup job for expired sessions |
| 4 | `bulkCreate` for notifications in chatHandler sends N DB queries for N participants |
| 5 | `getUnreadCount` queried on every notification creation — high DB load at scale |
| 6 | No index confirmation on `ChatParticipant(chatRoomId, userId)` — large chat tables will be slow |
| 7 | No connection pooling configuration confirmed in `config/db.js` |

---

### 🗄️ DATA CONSISTENCY ISSUES

| # | Issue |
|---|-------|
| 1 | `followersCount` stored as STRING — prevents range queries on influencer search |
| 2 | `engagementRate` stored as STRING — prevents sorting by engagement |
| 3 | `completionPercentage` recalculated from stale in-memory profile object |
| 4 | `cancelledAt` / `completedAt` not guaranteed to be set — model has no DB-level constraint |
| 5 | No cascade definition confirmed on `Campaign → CollaborationRequest` onDelete |
| 6 | `CollaborationRequest.expiresAt` not automatically updated to `expired` status — manual check only |
| 7 | `ContentCalendar.platform` not validated in `createCampaignRelations` (only contentType is) |
| 8 | Review.collaborationId is nullable — reviews can exist without a linked collaboration |

---

### ⚡ PERFORMANCE ISSUES

| # | Issue |
|---|-------|
| 1 | No query result caching on `getCampaignAnalytics` |
| 2 | `Message.findAll` in `join_collaboration_chat` — no index on `(chatRoomId, sentAt)` confirmed |
| 3 | `authorize()` middleware queries DB on every request to fetch user roles — no role caching |
| 4 | `logAction` may still consume DB write cycles even when fire-and-forget |
| 5 | `getCampaignById` with full relations (KPIs, ContentCalendar, TargetAudience, AIVersions) — N+1 potential |

---

### ✅ MISSING VALIDATIONS

| # | Missing Validation | Model/Route |
|---|-------------------|-------------|
| 1 | `website` field not URL-validated | OwnerProfile |
| 2 | `image` field accepts any string | OwnerProfile, InfluencerProfile |
| 3 | `socialMediaLinks` JSONB structure not schema-validated | InfluencerProfile |
| 4 | `ContentCalendar.platform` not validated in `createCampaignRelations` | compaginController |
| 5 | `expiresAt` in collaboration request not validated as future date | CollaborationRequest |
| 6 | `proposedBudget` not validated as positive number in invite | collaborationRequestService |
| 7 | Task `dueDate` not validated as future date | tasksService |
| 8 | `accessToken` format not validated on socket connection | socket/index.js |

---

### 🔄 REALTIME / WEBSOCKET ISSUES

| # | Issue |
|---|-------|
| 1 | Message edit/delete not emitted via WebSocket — clients don't see updates in real time |
| 2 | No typing indicator timeout — stuck `user_typing` state if user disconnects |
| 3 | `emitToUser` silently fails if io not initialized — no fallback |
| 4 | Socket auth (JWT verify on upgrade) — confirm implementation in `socket/index.js` |
| 5 | `notification_count_updated` queried from DB on every notification — should use increment instead |
| 6 | No reconnection handling spec — clients that disconnect mid-chat miss messages |

---

### 🏭 PRODUCTION READINESS

| # | Check | Status |
|---|-------|--------|
| 1 | Environment variables: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRE`, `GOOGLE_CLIENT_ID/SECRET` | ⚠️ Confirm non-default in prod |
| 2 | Database password `mariam` hardcoded in `config/db.js` | 🔴 Must use env var |
| 3 | `secure: true` on cookies only in production | ✓ |
| 4 | CORS configuration | ⚠️ Unconfirmed |
| 5 | Global error handler | ✓ (AppError pattern) |
| 6 | SQL injection protection | ✓ (Sequelize ORM) |
| 7 | Helmet / security headers | ⚠️ Unconfirmed |
| 8 | Request body size limiting | ⚠️ Unconfirmed |
| 9 | Google callback URL uses localhost | 🔴 Hardcoded |
| 10 | Session cleanup cron job | 🔴 Missing |
| 11 | Rate limiting middleware | 🔴 Missing |
| 12 | API versioning (e.g., `/api/v1/`) | 🟡 Missing |
| 13 | Health check endpoint | ⚠️ Unconfirmed |
| 14 | Graceful shutdown handling | ⚠️ Unconfirmed |

---

### 📋 MISSING CONSTRAINTS (DB Level)

| # | Missing Constraint |
|---|-------------------|
| 1 | No `CHECK (rating >= 1 AND rating <= 5)` DB constraint on Review |
| 2 | No unique constraint on (ownerId, influencerId, collaborationId) in Review |
| 3 | No DB-level constraint ensuring `completedAt IS NOT NULL` when `status = 'completed'` |
| 4 | No DB index on `Notification(userId, isRead)` for fast unread count queries |
| 5 | No DB index on `Message(chatRoomId, sentAt)` for chat history queries |
| 6 | No DB index on `CollaborationRequest(campaignId, influencerId, status)` for duplicate check |

---

## PRIORITY SUMMARY

### Fix Immediately (P0 — Blocks Production)
1. Remove `|| 1` userId fallback in campaign controllers
2. Add `authenticate` to `selectRole` route + verify `userId === req.user.id`
3. Remove JWT from Google OAuth redirect URL — use HttpOnly cookie instead
4. Replace hardcoded `localhost:5173` with environment variable
5. Add BLOCKED/SUSPENDED user check at login
6. Wrap `respond()` in DB transaction

### Fix Before Launch (P1 — Security/Data)
1. Add rate limiting to auth endpoints
2. Verify WebSocket authentication on connection upgrade
3. Encrypt social channel OAuth tokens at rest
4. Add ownership check to `createTask` and `getTaskById`
5. Add `completeCollaboration` prerequisite: all tasks approved
6. Add duplicate review prevention

### Fix Before Scale (P2 — Performance/UX)
1. Cache role lookups (reduce DB query per request)
2. Add pagination to all list endpoints
3. Session cleanup cron job
4. Fix `followersCount`/`engagementRate` to numeric types
5. Emit WebSocket events for message edit/delete
6. Add missing notification triggers (TASK_SUBMITTED/APPROVED/REJECTED)

---

*End of Audit — Total Issues: 11 Critical, 8 Security, 10 Logic, 8 UX, 7 Scalability, 8 Data Consistency, 5 Performance, 8 Missing Validations, 6 DB Constraints*
