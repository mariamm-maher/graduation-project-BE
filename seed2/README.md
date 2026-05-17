# Enterprise Seed Data Generator

A comprehensive, production-ready seeding system for the Influencer Marketing Platform database.

## Features

- **Realistic Data**: All data generated uses real names, company names, and content - no "test1@test.com"
- **Relationship Integrity**: All foreign keys and associations properly maintained
- **Validation Compliant**: All data validated against Sequelize model constraints before insertion
- **Transaction Safe**: All-or-nothing seeding - if anything fails, everything rolls back
- **Idempotent**: Safe to run multiple times - existing data is skipped, not duplicated
- **Configurable**: Three data volume levels (low/medium/high) via environment variables
- **Progress Logging**: Clear, color-coded console output showing progress and statistics

## Quick Start

```bash
# Basic seed with medium data volume (default)
node seed2/index.js

# Low data volume (faster, less data)
SEED_COUNT=low node seed2/index.js

# High data volume (comprehensive testing)
SEED_COUNT=high node seed2/index.js

# Verbose output with detailed logging
SEED_VERBOSE=true node seed2/index.js
```

## Generated Data Quantities

### Low (`SEED_COUNT=low`)
- 3 Owners, 4 Influencers, 1 Admin
- ~6 Campaigns
- 5 Collaborations
- ~40 Messages
- ~32 Notifications

### Medium (`SEED_COUNT=medium`) - Default
- 8 Owners, 12 Influencers, 2 Admins
- ~32 Campaigns
- 15 Collaborations
- ~225 Messages
- ~176 Notifications

### High (`SEED_COUNT=high`)
- 15 Owners, 25 Influencers, 3 Admins
- ~90 Campaigns
- 30 Collaborations
- ~750 Messages
- ~450 Notifications

Plus test accounts:
- `demo.owner@example.com` / `DemoPass123!`
- `demo.influencer@example.com` / `DemoPass123!`
- `admin@example.com` / `AdminPass123!`
- `onboarding@example.com` / `TestPass123!` (incomplete status)
- `suspended@example.com` / `TestPass123!` (suspended status)

## Architecture

```
seed2/
├── index.js                 # Main orchestrator with transaction handling
├── AUDIT_REPORT.md          # Comprehensive schema analysis
├── README.md               # This file
├── config/
│   └── seed-config.js      # Data volume configurations
├── factories/
│   ├── user-factory.js     # User, Role generation
│   ├── profile-factory.js  # OwnerProfile, InfluencerProfile
│   ├── brand-factory.js    # Brand generation
│   ├── campaign-factory.js # Campaign, KPI, TargetAudience, ContentCalendar, CampaignAIVersion
│   ├── collaboration-factory.js  # CollaborationRequest, Collaboration, Contract, Tasks
│   ├── chat-factory.js     # ChatRoom, ChatParticipant, Message
│   ├── notification-factory.js     # Notification generation
│   ├── review-factory.js   # Review generation
│   └── social-factory.js   # Channel, ScheduledPost, PostAnalytics
├── data/
│   ├── constants.js        # Industries, categories, enums, templates
│   └── names.js           # Name generators, company names
└── utils/
    ├── id-tracker.js       # ID mapping for foreign key relationships
    ├── progress-logger.js  # Consistent logging with colors
    └── validators.js      # Pre-insertion validation against Sequelize constraints
```

## Seeding Phases

1. **Core Entities** (Roles, Users, UserRoles)
2. **Profiles** (OwnerProfiles, InfluencerProfiles, Brands)
3. **Campaigns** (Campaigns, KPIs, TargetAudiences, ContentCalendars, CampaignAIVersions)
4. **Social Data** (Channels for influencers)
5. **Collaborations** (Requests, Collaborations, Contracts, Tasks)
6. **Communication** (ChatRooms, Participants, Messages, Notifications)
7. **Reviews** (Reviews for completed collaborations)
8. **Interest Messages** (Influencer outreach to owners)

## Data Quality Standards

### ✅ Included
- Realistic person names (census-based distributions)
- Business emails (firstname@company.com)
- Coherent brand-influencer category matching
- Realistic follower counts (micro to macro distribution)
- Logical budget ranges per company size
- Spread timestamps (not all createdAt=NOW)
- Varied statuses reflecting real workflow states
- Proper JSON structures for complex fields
- Varied engagement rates based on follower tiers

### ❌ Excluded
- Fake emails like test1@test.com
- Placeholder text ("lorem ipsum")
- Nonsensical addresses ("123 Main St")
- Sequential naming (user1, user2)
- Impossible data states

## Validation

All seed data is validated before insertion against:
- ENUM constraints (must match model definitions exactly)
- String length constraints (min/max)
- Numeric ranges (min/max)
- Email format
- URL format
- Business logic (e.g., completedAt only when status='completed')

Failed validation throws detailed error messages before any database insertion.

## Extending

### Adding New Entity Types

1. Create factory file in `factories/my-entity-factory.js`
2. Import in `index.js`
3. Add seeding function following the pattern:

```javascript
async function seedMyEntities(transaction, dependencies) {
  logger.section('Phase X: My Entities');
  
  for (const item of items) {
    const [instance, created] = await models.MyEntity.findOrCreate({
      where: { uniqueField: item.uniqueField },
      defaults: item,
      transaction
    });
    
    if (created) {
      idTracker.set('MyEntity', item.key, instance.id);
      logger.created('MyEntity', instance.id);
    }
    logger.track('MyEntity', created ? 'created' : 'skipped');
  }
}
```

### Custom Data Templates

Edit `data/constants.js` to add:
- New industries
- Content templates
- Task templates
- Review templates

Edit `data/names.js` to add:
- New first/last names
- Company name patterns
- Brand name generators

## Troubleshooting

### Seed fails with validation error
Check the error message - it will specify:
- Which entity failed
- Which constraint was violated
- The actual data that failed validation

### Duplicate key errors
The seed is designed to be idempotent. If you see duplicate key errors, there may be a bug in the `findOrCreate` where clause. Check that unique fields are properly specified.

### Transaction rollback
If seeding fails, all changes are automatically rolled back. Check the error stack trace for the root cause.

## Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `SEED_COUNT` | `low`, `medium`, `high` | Data volume level |
| `SEED_VERBOSE` | `true`, `false` | Detailed logging |
| `SEED_TRUNCATE` | `true`, `false` | ⚠️ DANGER: Clears all data before seeding |

## Model Coverage

All 27 models are seeded:
- ✓ User, Role, UserRole
- ✓ OwnerProfile, InfluencerProfile
- ✓ Brand
- ✓ Campaign, KPI, TargetAudience, ContentCalendar, CampaignAIVersion
- ✓ CollaborationRequest, Collaboration, CollaborationContract, CollaborationTask
- ✓ ChatRoom, ChatParticipant, Message
- ✓ Notification, InterestMessage
- ✓ Review
- ✓ Channel, ScheduledPost, PostAnalytics
- ✓ Session, Log (created via application usage)

## License

Part of the Influencer Marketing Platform project.
