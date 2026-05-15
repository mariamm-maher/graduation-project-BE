# Database Schema Audit Report

## Generated: 2026-05-15
## Project: Influencer Marketing Platform Backend

---

## 1. EXECUTIVE SUMMARY

This audit analyzes 27 database models with 150+ fields to identify constraints, validation rules, and seed data requirements for enterprise-grade realistic data generation.

### Model Inventory
- **Core**: User, Role, UserRole, Session, Log
- **Profiles**: OwnerProfile, InfluencerProfile
- **Business**: Brand, Campaign, KPI, TargetAudience, ContentCalendar, CampaignAIVersion
- **Collaboration**: CollaborationRequest, Collaboration, CollaborationContract, CollaborationTask
- **Communication**: ChatRoom, ChatParticipant, Message, Notification, InterestMessage
- **Social**: Channel, ScheduledPost, PostAnalytics
- **Feedback**: Review

---

## 2. CRITICAL CONSTRAINTS ANALYSIS

### 2.1 ENUM Constraints (MUST MATCH EXACTLY)

```
User.status:                    ACTIVE, BLOCKED, SUSPENDED, INCOMPLETE
Role.name:                      OWNER, INFLUENCER, ADMIN
OwnerProfile.company_size:      Solo, Small, Mid, Enterprise
Campaign.lifecycleStage:        draft, ai_generated, saved, completed, cancelled
Campaign.campaign_goal:         Awareness, Leads, Sales, Retention, Re-engagement
KPI.metric:                     impressions, reach, engagement_rate, conversions, ROAS, CPA, CTR
TargetAudience.gender:          all, male, female, custom
ContentCalendar.platform:       instagram, facebook, twitter, linkedin, tiktok, youtube
ContentCalendar.contentType:    video, carousel, story, reel, post, article
ContentCalendar.status:         scheduled, posted, failed
Collaboration.status:           pending_contract_sign, live, in_progress, completed, cancelled
CollaborationRequest.status:    pending, negotiating, accepted, rejected, cancelled, expired
CollaborationContract.status:   sent, partially_signed, signed, cancelled
CollaborationTask.status:       todo, in_progress, in_review, approved, rejected
CollaborationTask.platform:     instagram, tiktok, youtube, facebook, twitter, linkedin, snapchat, whatsapp, other
CollaborationTask.contentType:  post, story, reel, video, carousel, article, tweet, poll
ChatRoom.type:                  one_to_one, group
ChatParticipant.role:           owner, influencer, admin
Message.status:                 sent, delivered, read
Channel.status:                 active, disconnected, expired
Channel.platform:               instagram, facebook, twitter, linkedin, tiktok, youtube
ScheduledPost.status:           draft, scheduled, published, failed
Notification.type:              CAMPAIGN_INVITATION, CAMPAIGN_PUBLISHED, CAMPAIGN_APPROVED, CAMPAIGN_REJECTED, 
                               AI_CAMPAIGN_READY, CONTRACT_CREATED, CONTRACT_SENT, CONTRACT_SIGNED,
                               OFFER_MADE, OFFER_ACCEPTED, OFFER_REJECTED, PROPOSAL_SUBMITTED,
                               PROPOSAL_ACCEPTED, PROPOSAL_REJECTED, TASK_ASSIGNED, TASK_STARTED,
                               TASK_SUBMITTED, TASK_APPROVED, TASK_REJECTED, TASK_FINAL_REJECTED,
                               FILE_UPLOADED, MESSAGE_RECEIVED
```

### 2.2 Validation Rules

| Model | Field | Rule |
|-------|-------|------|
| User | firstName | len: [2, 50], notEmpty |
| User | lastName | len: [2, 50], notEmpty |
| User | email | isEmail, unique |
| User | password | len: [6, 100], allowNull true (OAuth) |
| User | googleId | unique, allowNull true |
| Campaign | campaignName | len: [3, 100], notEmpty |
| Campaign | campaign_duration_weeks | min: 1 |
| CollaborationContract | agreedPrice | min: 0 |
| CollaborationTask | taskName | len: [3, 200], notEmpty |
| Review | rating | min: 1, max: 5 |
| Message | content | notEmpty |

### 2.3 Unique Constraints

```
User.email
User.googleId
Role.name
OwnerProfile.userId
InfluencerProfile.userId
Brand.name
Brand.slug
CollaborationContract.collaborationId
ChatParticipant.(chatRoomId + userId) - composite
```

---

## 3. FOREIGN KEY DEPENDENCY MAP

### 3.1 Dependency Order (Parent → Child)

```
1. Role (no dependencies)
2. User → requires Role (via UserRole)
3. UserRole → requires User, Role
4. OwnerProfile → requires User
5. InfluencerProfile → requires User
6. Brand → requires User (ownerId)
7. Session → requires User
8. Log → requires User (actorId, nullable)
9. Campaign → requires User
10. TargetAudience → requires Campaign
11. KPI → requires Campaign
12. ContentCalendar → requires Campaign
13. CampaignAIVersion → requires Campaign
14. CollaborationRequest → requires Campaign, User (ownerId), User (influencerId)
15. Collaboration → requires CollaborationRequest, Campaign, User (ownerId), User (influencerId)
16. CollaborationContract → requires Collaboration
17. CollaborationTask → requires Collaboration
18. ChatRoom → requires Collaboration (nullable)
19. ChatParticipant → requires ChatRoom, User
20. Message → requires ChatRoom, User (senderId)
21. Notification → requires User
22. InterestMessage → requires Campaign, User (ownerId), User (influencerId)
23. Review → requires User (ownerId), User (influencerId), Collaboration (nullable)
24. Channel → requires User
25. ScheduledPost → requires Channel, Campaign (nullable), CollaborationTask (nullable), ContentCalendar (nullable)
26. PostAnalytics → requires ScheduledPost
```

### 3.2 Circular Dependencies: NONE DETECTED ✓

---

## 4. CRITICAL ISSUES DETECTED

### 4.1 Missing Default Values (Potential Issues)

| Model | Field | Issue |
|-------|-------|-------|
| Campaign | startDate | allowNull: true - campaigns without dates |
| Campaign | endDate | allowNull: true - incomplete scheduling |
| Campaign | budget_amount | allowNull: true - no budget tracking |
| CollaborationRequest | proposedBudget | allowNull: true - negotiation without price |
| CollaborationContract | deliverables | default: [] - empty deliverables accepted |

### 4.2 Logic-Business Constraint Mismatches

```
⚠️ CRITICAL: Campaign.lifecycleStage default is 'ai_generated' 
   but logically should start as 'draft'

⚠️ WARNING: Collaboration.status has 'live' (accepted, contract not yet)
   but 'pending_contract_sign' is default - confusing state machine

⚠️ WARNING: User.password allowNull: true enables OAuth-only users
   but no validation ensures either password OR googleId exists
```

### 4.3 Inconsistent Field Naming

```
✗ Found: Campaign.campaign_goal (snake_case)
✓ Expected: Campaign.campaignGoal (camelCase like other fields)

✗ Found: OwnerProfile.brand_name (snake_case)
✓ Expected: OwnerProfile.brandName (camelCase)
```

---

## 5. SEED DATA REQUIREMENTS

### 5.1 Minimum Data Quantities for Realistic Testing

| Entity | Minimum Count | Reason |
|--------|---------------|--------|
| Roles | 3 (OWNER, INFLUENCER, ADMIN) | Enum values |
| Users | 25 | 10 owners, 12 influencers, 3 admins |
| OwnerProfiles | 10 | Matching owners |
| InfluencerProfiles | 12 | Matching influencers |
| Brands | 15 | Multiple brands per owner |
| Campaigns | 30 | Various lifecycle stages |
| CollaborationRequests | 20 | Pending, negotiating, accepted, rejected states |
| Collaborations | 15 | Active and completed |
| Contracts | 12 | Various signing states |
| Tasks | 50+ | Multiple per collaboration |
| ChatRooms | 15 | One per collaboration |
| Messages | 200+ | Multiple per chat |
| Notifications | 100+ | Various types |
| Reviews | 20 | Ratings spread 1-5 |
| Channels | 20 | Social media connections |
| ScheduledPosts | 40 | Various statuses |
| PostAnalytics | 25 | Posted content analytics |

### 5.2 Required Cross-Reference Validations

```
✓ Every User with INFLUENCER role MUST have InfluencerProfile
✓ Every User with OWNER role MUST have OwnerProfile
✓ Every OwnerProfile with isOnboarded=true MUST have complete data
✓ Every InfluencerProfile with isOnboarded=true MUST have social links
✓ Every Collaboration MUST have matching ownerId/influencerId from request
✓ Every ChatParticipant role MUST match User's actual role
✓ Every Notification entityId MUST reference valid entity
```

---

## 6. SECURITY CONSIDERATIONS

### 6.1 Password Handling
- User model has beforeCreate/beforeUpdate hooks that bcrypt hash passwords
- Seed passwords will be automatically hashed on insert
- Use simple plaintext in seed data (e.g., 'Password123')

### 6.2 Token Handling
- Session.refreshTokenHash uses SHA256 hashing
- Seed data should use dummy hash values

---

## 7. RECOMMENDED SEED ARCHITECTURE

```
seed2/
├── index.js                    # Main entry with transactions
├── audit-report.md             # This file
├── config/
│   └── seed-config.js          # Quantities, flags, settings
├── factories/
│   ├── user-factory.js
│   ├── profile-factory.js
│   ├── campaign-factory.js
│   ├── collaboration-factory.js
│   ├── chat-factory.js
│   ├── notification-factory.js
│   └── social-factory.js
├── data/
│   ├── constants.js            # Enums, industry lists, etc.
│   ├── names.js                # Realistic names
│   └── content.js              # Realistic text content
└── utils/
    ├── id-tracker.js           # ID mapping during seed
    ├── progress-logger.js      # Consistent logging
    └── validators.js         # Seed data validation
```

---

## 8. DATA QUALITY RULES

### 8.1 Forbidden Patterns
```
✗ test1@test.com, test2@test.com, etc.
✗ abc, xyz, lorem ipsum
✗ 123 Main St, City, State (fake addresses)
✗ user1, user2 naming
```

### 8.2 Required Patterns
```
✓ Real first/last names from census data
✓ Business emails: firstname@company.com
✓ Realistic follower counts with variance
✓ Coherent brand-influencer category matching
✓ Logical budget ranges per company size
✓ Realistic timestamps (not all createdAt=NOW)
```

---

## 9. VALIDATION PRE-CHECKS FOR SEED DATA

Before insertion, verify:

1. **ENUM Validation**: All enum values match model definitions
2. **Unique Constraint**: No duplicate emails, brand names, or slugs
3. **Foreign Key Integrity**: All referenced IDs exist in parent tables
4. **Length Validation**: String fields within min/max bounds
5. **Numeric Validation**: Prices, ratings, counts in valid ranges
6. **JSON Validation**: Array and JSON fields have correct structure
7. **Date Validation**: startDate < endDate where applicable
8. **Business Logic**: 
   - completedAt only set when status='completed'
   - signedAt only set when signed=true
   - isPublished only when lifecycleStage in ['saved', 'completed']

---

## 10. AUDIT SIGN-OFF

| Check | Status |
|-------|--------|
| All 27 models reviewed | ✓ |
| All ENUM values documented | ✓ |
| All foreign keys mapped | ✓ |
| No circular dependencies | ✓ |
| Validation rules captured | ✓ |
| Edge cases identified | ✓ |
| Seed quantities defined | ✓ |
| Data quality rules defined | ✓ |

**Audit Status: COMPLETE**  
**Ready for Seed Generation: YES**

---

*End of Audit Report*
