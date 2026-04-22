// Prevent Sequelize associations from running in unit tests by mocking the
// whole models index before any module requires that might trigger it.
jest.mock('../models', () => ({
  User: { hasMany: jest.fn(), belongsToMany: jest.fn(), belongsTo: jest.fn(), hasOne: jest.fn() },
  Campaign: function DummyCampaign() {},
  KPI: function DummyKPI() {},
  TargetAudience: function DummyTargetAudience() {},
  ContentCalendar: function DummyContentCalendar() {},
  CampaignAIVersion: function DummyAIVersion() {},
  sequelize: { transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }) }
}));

const request = require('supertest');
const express = require('express');
const campaignController = require('../controllers/compaginController');       

// ─── Mock all external dependencies ───────────────────────────────────────────

jest.mock('../models/Campaign');
jest.mock('../models/KPI');
jest.mock('../models/TargetAudience');
jest.mock('../models/ContentCalendar');
jest.mock('../models/CampaignAIVersion');
jest.mock('../services/campaignAIService');
jest.mock('../services/logServices');
jest.mock('../services/notificationService');

const Campaign         = require('../models/Campaign');
const KPI              = require('../models/KPI');
const TargetAudience   = require('../models/TargetAudience');
const ContentCalendar  = require('../models/ContentCalendar');
const CampaignAIVersion = require('../models/CampaignAIVersion');
const { generateCampaignWithAI } = require('../services/campaignAIService');
const { logAction }    = require('../services/logServices');
const notificationService = require('../services/notificationService');

// ─── Minimal Express app ──────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Inject a fake authenticated user on every request
app.use((req, _res, next) => {
  req.user = { id: 42 };
  next();
});

app.post('/api/campaigns/ai/generate',  campaignController.generateAICampaign);
app.post('/api/campaigns/draft',         campaignController.draftCampaign);
app.post('/api/campaigns/save-and-publish', campaignController.saveAndPublish);
app.post('/api/campaigns/save',          campaignController.saveCampaign);
app.post('/api/campaigns/:id/complete',  campaignController.completeCampaign);
app.post('/api/campaigns/:id/cancel',    campaignController.cancelCampaign);
app.get('/api/campaigns/overview',       campaignController.getCampaignsOverview);
app.get('/api/campaigns/active',         campaignController.getActiveCampaigns);
app.get('/api/campaigns/:id',            campaignController.getCampaignById);
app.get('/api/campaigns',               campaignController.getCampaigns);
app.delete('/api/campaigns/:id',        campaignController.deleteCampaign);
app.post('/api/campaigns',              campaignController.createCampaign);

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const VALID_CAMPAIGN_BODY = {
  campaignName:    'Summer Sale 2025',
  campaign_goal:   'brand_awareness',
  budget_amount:   5000,
  budget_currency: 'USD',
  startDate:       '2025-06-01',
  endDate:         '2025-08-31',
};

const MOCK_CAMPAIGN = {
  id:             1,
  campaignName:   'Summer Sale 2025',
  lifecycleStage: 'draft',
  isPublished:    false,
  userId:         42,
  createdAt:      new Date().toISOString(),
  updatedAt:      new Date().toISOString(),
  save:           jest.fn().mockResolvedValue(true),
  destroy:        jest.fn().mockResolvedValue(true),
  toJSON:         jest.fn().mockReturnValue({
    id:             1,
    campaignName:   'Summer Sale 2025',
    lifecycleStage: 'draft',
    isPublished:    false,
    userId:         42,
    campaign_goal:  'brand_awareness',
    budget_amount:  5000,
    budget_currency:'USD',
    campaign_duration_weeks: 4,
    createdAt:      new Date().toISOString(),
  }),
};

// ─── beforeEach helper ────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Default happy-path mock for the transaction pattern
  const mockTransaction = {
    commit:   jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };
  Campaign.sequelize = {
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  };

  Campaign.create        = jest.fn().mockResolvedValue(MOCK_CAMPAIGN);
  Campaign.findByPk      = jest.fn().mockResolvedValue({ ...MOCK_CAMPAIGN });
  Campaign.findOne       = jest.fn().mockResolvedValue({ ...MOCK_CAMPAIGN });
  Campaign.findAndCountAll = jest.fn().mockResolvedValue({ count: 1, rows: [MOCK_CAMPAIGN] });
  Campaign.findAll       = jest.fn().mockResolvedValue([MOCK_CAMPAIGN]);
  Campaign.count         = jest.fn().mockResolvedValue(1);

  KPI.create             = jest.fn().mockResolvedValue({});
  TargetAudience.create  = jest.fn().mockResolvedValue({});
  ContentCalendar.create = jest.fn().mockResolvedValue({});
  CampaignAIVersion.create = jest.fn().mockResolvedValue({});

  generateCampaignWithAI = jest.fn().mockResolvedValue({ strategy: 'mock strategy' });
  logAction              = jest.fn().mockResolvedValue(undefined);
  notificationService.createNotification = jest.fn().mockResolvedValue(undefined);
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. POST /api/campaigns/ai/generate
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/campaigns/ai/generate', () => {
  const validBody = {
    ...VALID_CAMPAIGN_BODY,
    brand_name:        'Acme',
    product_or_service:'Widget',
    industry:          'e-commerce',
    target_market:     'millennials',
  };

  test('returns 201 and aiPreview on valid input', async () => {
    const { generateCampaignWithAI } = require('../services/campaignAIService');
    generateCampaignWithAI.mockResolvedValueOnce({ strategy: 'summer push' });

    const res = await request(app)
      .post('/api/campaigns/ai/generate')
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('aiPreview');
  });

  test('returns 400 when budget is 0', async () => {
    const res = await request(app)
      .post('/api/campaigns/ai/generate')
      .send({ ...validBody, budget_amount: 0 });

    expect(res.status).toBe(400);
  });

  test('returns 400 when endDate is before startDate', async () => {
    const res = await request(app)
      .post('/api/campaigns/ai/generate')
      .send({ ...validBody, startDate: '2025-09-01', endDate: '2025-06-01' });

    expect(res.status).toBe(400);
  });

  test('sends AI_CAMPAIGN_READY notification', async () => {
    const { generateCampaignWithAI } = require('../services/campaignAIService');
    generateCampaignWithAI.mockResolvedValueOnce({});

    await request(app).post('/api/campaigns/ai/generate').send(validBody);

    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'AI_CAMPAIGN_READY' })
    );
  });

  test('still succeeds even if notification throws', async () => {
    const { generateCampaignWithAI } = require('../services/campaignAIService');
    generateCampaignWithAI.mockResolvedValueOnce({});
    notificationService.createNotification.mockRejectedValueOnce(new Error('notif fail'));

    const res = await request(app).post('/api/campaigns/ai/generate').send(validBody);
    expect(res.status).toBe(201);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. POST /api/campaigns/draft
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/campaigns/draft', () => {
  test('creates a draft campaign and returns 201', async () => {
    const res = await request(app)
      .post('/api/campaigns/draft')
      .send(VALID_CAMPAIGN_BODY);

    expect(res.status).toBe(201);
    expect(res.body.data.campaign).toMatchObject({
      id: 1,
      lifecycleStage: 'draft',
    });
  });

  test('creates related KPIs when provided', async () => {
    await request(app)
      .post('/api/campaigns/draft')
      .send({
        ...VALID_CAMPAIGN_BODY,
        kpis: [{ metric: 'impressions', targetValue: 10000 }],
      });

    expect(KPI.create).toHaveBeenCalledWith(
      expect.objectContaining({ metric: 'impressions', targetValue: 10000 }),
      expect.anything()
    );
  });

  test('creates targetAudience when provided', async () => {
    await request(app)
      .post('/api/campaigns/draft')
      .send({
        ...VALID_CAMPAIGN_BODY,
        targetAudience: { ageRange: '18-35', gender: 'all' },
      });

    expect(TargetAudience.create).toHaveBeenCalledWith(
      expect.objectContaining({ ageRange: '18-35' }),
      expect.anything()
    );
  });

  test('creates contentCalendar entries when provided', async () => {
    await request(app)
      .post('/api/campaigns/draft')
      .send({
        ...VALID_CAMPAIGN_BODY,
        contentCalendar: [{ day: 'Monday', platform: 'Instagram', contentType: 'image' }],
      });

    expect(ContentCalendar.create).toHaveBeenCalled();
  });

  test('rollbacks transaction on DB error', async () => {
    const t = await Campaign.sequelize.transaction();
    Campaign.create.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/api/campaigns/draft')
      .send(VALID_CAMPAIGN_BODY);

    expect(res.status).toBe(500);
    expect(t.rollback).toHaveBeenCalled();
  });

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/campaigns/draft')
      .send({ campaignName: 'Test only' });

    expect(res.status).toBe(400);
  });

  test('returns 400 when budget is negative', async () => {
    const res = await request(app)
      .post('/api/campaigns/draft')
      .send({ ...VALID_CAMPAIGN_BODY, budget_amount: -100 });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. POST /api/campaigns/save-and-publish
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/campaigns/save-and-publish', () => {
  test('creates campaign with isPublished=true', async () => {
    const res = await request(app)
      .post('/api/campaigns/save-and-publish')
      .send(VALID_CAMPAIGN_BODY);

    expect(res.status).toBe(201);
    expect(Campaign.create).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: true, lifecycleStage: 'saved' }),
      expect.anything()
    );
  });

  test('sends CAMPAIGN_PUBLISHED notification', async () => {
    await request(app)
      .post('/api/campaigns/save-and-publish')
      .send(VALID_CAMPAIGN_BODY);

    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CAMPAIGN_PUBLISHED' })
    );
  });

  test('calls logAction after commit', async () => {
    await request(app)
      .post('/api/campaigns/save-and-publish')
      .send(VALID_CAMPAIGN_BODY);

    expect(logAction).toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. POST /api/campaigns/save
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/campaigns/save', () => {
  test('saves with isPublished=false by default', async () => {
    const res = await request(app)
      .post('/api/campaigns/save')
      .send(VALID_CAMPAIGN_BODY);

    expect(res.status).toBe(201);
    expect(Campaign.create).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: false }),
      expect.anything()
    );
  });

  test('respects explicit isPublished=true', async () => {
    await request(app)
      .post('/api/campaigns/save')
      .send({ ...VALID_CAMPAIGN_BODY, isPublished: true });

    expect(Campaign.create).toHaveBeenCalledWith(
      expect.objectContaining({ isPublished: true }),
      expect.anything()
    );
  });

  test('sends notification only when isPublished=true', async () => {
    // not published — no notification
    await request(app).post('/api/campaigns/save').send(VALID_CAMPAIGN_BODY);
    expect(notificationService.createNotification).not.toHaveBeenCalled();

    // published — notification fired
    await request(app)
      .post('/api/campaigns/save')
      .send({ ...VALID_CAMPAIGN_BODY, isPublished: true });
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CAMPAIGN_PUBLISHED' })
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. POST /api/campaigns/:id/complete
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/campaigns/:id/complete', () => {
  test('marks campaign as completed', async () => {
    const mockCampaign = {
      ...MOCK_CAMPAIGN,
      userId:         42,
      lifecycleStage: 'saved',
      save:           jest.fn().mockResolvedValue(true),
    };
    Campaign.findByPk.mockResolvedValueOnce(mockCampaign);

    const res = await request(app).post('/api/campaigns/1/complete');

    expect(res.status).toBe(200);
    expect(mockCampaign.lifecycleStage).toBe('completed');
    expect(mockCampaign.save).toHaveBeenCalled();
  });

  test('returns 404 when campaign not found', async () => {
    Campaign.findByPk.mockResolvedValueOnce(null);
    const res = await request(app).post('/api/campaigns/999/complete');
    expect(res.status).toBe(404);
  });

  test('returns 403 when user does not own the campaign', async () => {
    Campaign.findByPk.mockResolvedValueOnce({ ...MOCK_CAMPAIGN, userId: 99 });
    const res = await request(app).post('/api/campaigns/1/complete');
    expect(res.status).toBe(403);
  });

  test('returns 400 when campaign is not in saved stage', async () => {
    Campaign.findByPk.mockResolvedValueOnce({
      ...MOCK_CAMPAIGN,
      userId:         42,
      lifecycleStage: 'draft',
    });
    const res = await request(app).post('/api/campaigns/1/complete');
    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. POST /api/campaigns/:id/cancel
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/campaigns/:id/cancel', () => {
  test('cancels a campaign', async () => {
    const mockCampaign = {
      ...MOCK_CAMPAIGN,
      userId:         42,
      lifecycleStage: 'saved',
      save:           jest.fn().mockResolvedValue(true),
    };
    Campaign.findByPk.mockResolvedValueOnce(mockCampaign);

    const res = await request(app).post('/api/campaigns/1/cancel');

    expect(res.status).toBe(200);
    expect(mockCampaign.lifecycleStage).toBe('cancelled');
  });

  test('returns 400 when trying to cancel a completed campaign', async () => {
    Campaign.findByPk.mockResolvedValueOnce({
      ...MOCK_CAMPAIGN,
      userId:         42,
      lifecycleStage: 'completed',
    });
    const res = await request(app).post('/api/campaigns/1/cancel');
    expect(res.status).toBe(400);
  });

  test('returns 403 when user does not own the campaign', async () => {
    Campaign.findByPk.mockResolvedValueOnce({ ...MOCK_CAMPAIGN, userId: 99 });
    const res = await request(app).post('/api/campaigns/1/cancel');
    expect(res.status).toBe(403);
  });

  test('sends CAMPAIGN_REJECTED notification', async () => {
    Campaign.findByPk.mockResolvedValueOnce({
      ...MOCK_CAMPAIGN,
      userId:         42,
      lifecycleStage: 'saved',
      save:           jest.fn().mockResolvedValue(true),
    });
    await request(app).post('/api/campaigns/1/cancel');
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CAMPAIGN_REJECTED' })
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. GET /api/campaigns
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/campaigns', () => {
  test('returns paginated campaigns', async () => {
    const res = await request(app).get('/api/campaigns');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('campaigns');
    expect(res.body.data).toHaveProperty('pagination');
    expect(res.body.data.pagination).toMatchObject({ total: 1, page: 1, limit: 10 });
  });

  test('passes search filter to query', async () => {
    await request(app).get('/api/campaigns?search=summer');
    expect(Campaign.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ campaignName: expect.anything() }),
      })
    );
  });

  test('passes lifecycleStage filter to query', async () => {
    await request(app).get('/api/campaigns?lifecycleStage=draft');
    expect(Campaign.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ lifecycleStage: 'draft' }),
      })
    );
  });

  test('adds alias fields (goalType, goals, duration) to each campaign', async () => {
    const res = await request(app).get('/api/campaigns');
    const campaign = res.body.data.campaigns[0];
    expect(campaign).toHaveProperty('goalType');
    expect(campaign).toHaveProperty('goals');
    expect(campaign).toHaveProperty('duration');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. GET /api/campaigns/overview
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/campaigns/overview', () => {
  test('returns overview stats', async () => {
    Campaign.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
    Campaign.findAll.mockResolvedValueOnce([MOCK_CAMPAIGN]);

    const res = await request(app).get('/api/campaigns/overview');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalCampaigns:   5,
      totalDraft:       2,
      recentCampaigns:  expect.any(Array),
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. GET /api/campaigns/:id
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/campaigns/:id', () => {
  test('returns a single campaign with relations', async () => {
    Campaign.findOne.mockResolvedValueOnce(MOCK_CAMPAIGN);
    const res = await request(app).get('/api/campaigns/1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('campaign');
  });

  test('returns 404 when campaign not found', async () => {
    Campaign.findOne.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/campaigns/999');
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. DELETE /api/campaigns/:id
// ═════════════════════════════════════════════════════════════════════════════

describe('DELETE /api/campaigns/:id', () => {
  test('deletes campaign and returns 200', async () => {
    const mockCampaign = { ...MOCK_CAMPAIGN, destroy: jest.fn().mockResolvedValue(true) };
    Campaign.findOne.mockResolvedValueOnce(mockCampaign);

    const res = await request(app).delete('/api/campaigns/1');

    expect(res.status).toBe(200);
    expect(mockCampaign.destroy).toHaveBeenCalled();
    expect(res.body.data).toHaveProperty('deletedCampaignId');
  });

  test('returns 404 when campaign not found', async () => {
    Campaign.findOne.mockResolvedValueOnce(null);
    const res = await request(app).delete('/api/campaigns/999');
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. POST /api/campaigns  (createCampaign)
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/campaigns', () => {
  test('creates manual campaign with draft stage', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .send(VALID_CAMPAIGN_BODY);

    expect(res.status).toBe(201);
    expect(Campaign.create).toHaveBeenCalledWith(
      expect.objectContaining({ lifecycleStage: 'draft' })
    );
  });

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .send({ campaignName: 'Incomplete' });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12. GET /api/campaigns/active
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/campaigns/active', () => {
  test('returns active campaigns with tracking data', async () => {
    Campaign.findAll.mockResolvedValueOnce([MOCK_CAMPAIGN]);

    const res = await request(app).get('/api/campaigns/active');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('campaigns');
    expect(res.body.data).toHaveProperty('trackingTools');
    expect(res.body.data.campaigns[0]).toHaveProperty('tracking');
  });

  test('tracking includes duration, kpis, content, and ai sections', async () => {
    Campaign.findAll.mockResolvedValueOnce([MOCK_CAMPAIGN]);

    const res = await request(app).get('/api/campaigns/active');
    const tracking = res.body.data.campaigns[0].tracking;

    expect(tracking).toHaveProperty('duration');
    expect(tracking).toHaveProperty('kpis');
    expect(tracking).toHaveProperty('content');
    expect(tracking).toHaveProperty('ai');
  });

  test('excludes cancelled campaigns', async () => {
    await request(app).get('/api/campaigns/active');

    expect(Campaign.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          lifecycleStage: expect.objectContaining({ [Symbol.for('not in')] : expect.anything() }),
        }),
      })
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 13. Budget resolver edge cases (unit tests)
// ═════════════════════════════════════════════════════════════════════════════

describe('Budget / goal field resolution (field aliases)', () => {
  test('accepts totalBudget alias', async () => {
    const body = { ...VALID_CAMPAIGN_BODY, budget_amount: undefined, totalBudget: 3000 };
    const res = await request(app).post('/api/campaigns/draft').send(body);
    expect(res.status).toBe(201);
  });

  test('accepts goalType alias', async () => {
    const body = { ...VALID_CAMPAIGN_BODY, campaign_goal: undefined, goalType: 'lead_gen' };
    const res = await request(app).post('/api/campaigns/draft').send(body);
    expect(res.status).toBe(201);
  });

  test('accepts campaignGoal alias', async () => {
    const body = { ...VALID_CAMPAIGN_BODY, campaign_goal: undefined, campaignGoal: 'conversion' };
    const res = await request(app).post('/api/campaigns/draft').send(body);
    expect(res.status).toBe(201);
  });

  test('accepts budget_currency alias via currency field', async () => {
    const body = { ...VALID_CAMPAIGN_BODY, budget_currency: undefined, currency: 'EUR' };
    const res = await request(app).post('/api/campaigns/draft').send(body);
    expect(res.status).toBe(201);
  });
});