const CampaignAIVersion = require('../models/CampaignAIVersion');
const ContentCalendar = require('../models/ContentCalendar');
const AppError = require('../utils/AppError');

/* =========================
   SAFE CONSTANTS
========================= */

const CONTENT_TYPES = new Set(['video', 'carousel', 'story', 'reel', 'post', 'article']);
const CONTENT_STATUSES = new Set(['scheduled', 'posted', 'failed']);

const PLATFORM_MAP = {
  instagram: 'instagram',
  facebook: 'facebook',
  twitter: 'twitter',
  linkedin: 'linkedin',
  tiktok: 'tiktok',
  youtube: 'youtube',
};

/* =========================
   SAFE HELPERS
========================= */

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

const safeNumber = (v, fallback = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const safeString = (v, fallback = null) => {
  if (typeof v !== 'string') return fallback;
  const t = v.trim();
  return t.length ? t : fallback;
};

function deepSanitize(input) {
  if (Array.isArray(input)) {
    return input.map(deepSanitize);
  }

  if (!isObject(input)) {
    if (typeof input === 'number') return Number.isFinite(input) ? input : null;
    if (typeof input === 'string') return input.trim() || null;
    return input;
  }

  const out = {};
  for (const k in input) {
    const v = input[k];

    if (v === undefined || v === null) {
      out[k] = null;
    } else if (typeof v === 'number') {
      out[k] = Number.isFinite(v) ? v : null; // ❗ fixes NaN
    } else if (typeof v === 'string') {
      out[k] = v.trim() || null;
    } else if (typeof v === 'object') {
      out[k] = deepSanitize(v);
    } else {
      out[k] = v;
    }
  }

  return out;
}

function safeJson(value, fallback = null) {
  if (value === undefined || value === null) return fallback;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      throw new AppError('Invalid JSON in AI payload', 400);
    }
  }

  if (typeof value === 'object') return value;

  return fallback;
}

/* =========================
   AI EXTRACTION
========================= */

function extractAiPayload(body = {}) {
  const source =
    body.ai ||
    body.aiVersion ||
    body.aiPreview ||
    (body.strategy || body.calendar || body.influencer_matches ? body : null);

  if (!isObject(source)) return null;

  return {
    strategy: source.strategy ?? null,
    calendar: source.calendar ?? null,
    influencer_matches: Array.isArray(source.influencer_matches)
      ? source.influencer_matches
      : [],
    influencer_strategy_note:
      source.influencer_strategy_note ??
      source.influencer_strategy_notes ??
      source.influencerStrategyNote ??
      null,
    influencer_stage_skipped: Boolean(source.influencer_stage_skipped ?? false),
    generatedAt: source.generatedAt || source.generated_at || null,
    versionNumber: source.versionNumber || source.version_number || null,
    rawPayload: source,
  };
}

/* =========================
   NORMALIZERS
========================= */

function normalizePlatform(value) {
  if (!value || typeof value !== 'string') return 'instagram';
  return PLATFORM_MAP[value.toLowerCase().trim()] || 'instagram';
}

function normalizeContentType(value) {
  const v = (value || 'post').toLowerCase();
  return CONTENT_TYPES.has(v) ? v : 'post';
}

/* =========================
   CALENDAR MAPPING
========================= */

function calendarDaysToContentRows(calendar, campaignId) {
  const cal = safeJson(calendar, null);
  if (!cal || !Array.isArray(cal.days)) return [];

  const startDate = cal.start_date ? new Date(cal.start_date) : null;

  return cal.days
    .map((d, i) => {
      if (!isObject(d)) return null;

      const day = Number.isInteger(Number(d.day)) ? Number(d.day) : i + 1;

      let date = d.date ? new Date(d.date) : null;

      if (!date && startDate && !Number.isNaN(startDate.getTime())) {
        date = new Date(startDate);
        date.setDate(date.getDate() + (day - 1));
      }

      if (!date || Number.isNaN(date.getTime())) return null;

      const status = (d.status || 'scheduled').toLowerCase();

      return {
        campaignId,
        day,
        date,
        platform: normalizePlatform(d.platform),
        contentType: normalizeContentType(d.contentType || d.content_type),
        caption: d.caption || d.task || '',
        mediaUrl: d.mediaUrl || null,
        task: d.task || `Day ${day} content`,
        status: CONTENT_STATUSES.has(status) ? status : 'scheduled',
      };
    })
    .filter(Boolean);
}

/* =========================
   VERSION CONTROL
========================= */

async function getNextVersionNumber(campaignId, transaction) {
  const latest = await CampaignAIVersion.findOne({
    where: { campaignId },
    order: [['versionNumber', 'DESC']],
    attributes: ['versionNumber'],
    transaction,
  });

  return latest ? latest.versionNumber + 1 : 1;
}

/* =========================
   SAVE AI VERSION (SAFE)
========================= */

async function saveAiVersion({
  campaignId,
  aiData,
  transaction,
  setActive = true,
}) {
  const normalized = extractAiPayload(aiData);
  if (!normalized) return null;

  const strategy = deepSanitize(safeJson(normalized.strategy, null));
  const calendar = deepSanitize(safeJson(normalized.calendar, null));
  const influencer_matches = deepSanitize(
    safeJson(normalized.influencer_matches, [])
  );

  if (setActive) {
    await CampaignAIVersion.update(
      { isActive: false },
      { where: { campaignId, isActive: true }, transaction }
    );
  }

  const versionNumber =
    safeNumber(normalized.versionNumber) ||
    (await getNextVersionNumber(campaignId, transaction));

  return CampaignAIVersion.create(
    {
      campaignId,
      versionNumber,
      generatedAt: normalized.generatedAt
        ? new Date(normalized.generatedAt)
        : new Date(),

      strategy,
      calendar,
      influencer_matches,

      influencer_strategy_note: safeString(normalized.influencer_strategy_note),
      influencer_stage_skipped: Boolean(normalized.influencer_stage_skipped),

      rawPayload: deepSanitize(normalized.rawPayload || {}),
      isActive: setActive,
    },
    { transaction }
  );
}

/* =========================
   SYNC CONTENT CALENDAR
========================= */

async function syncContentCalendarFromAi({
  campaignId,
  calendar,
  transaction,
  replace = false,
}) {
  const rows = calendarDaysToContentRows(calendar, campaignId);
  if (!rows.length) return [];

  if (replace) {
    await ContentCalendar.destroy({ where: { campaignId }, transaction });
  }

  return ContentCalendar.bulkCreate(rows, { transaction });
}

/* =========================
   PUBLIC API
========================= */

async function persistCampaignAi({
  campaignId,
  body = {},
  transaction,
  setActive = true,
  syncCalendar = true,
}) {
  const aiData = extractAiPayload(body);
  if (!aiData) return null;

  const version = await saveAiVersion({
    campaignId,
    aiData,
    transaction,
    setActive,
  });

  const hasManualCalendar =
    Array.isArray(body.contentCalendar) &&
    body.contentCalendar.length > 0;

  if (syncCalendar && !hasManualCalendar && aiData.calendar) {
    await syncContentCalendarFromAi({
      campaignId,
      calendar: aiData.calendar,
      transaction,
      replace: false,
    });
  }

  return version;
}

/* =========================
   API RESPONSE SHAPE
========================= */

function getActiveAiVersion(aiVersions = []) {
  if (!Array.isArray(aiVersions) || aiVersions.length === 0) return null;
  return aiVersions.find((v) => v.isActive) || aiVersions[0];
}

function formatAiVersion(version) {
  if (!version) return null;
  const v = typeof version.toJSON === 'function' ? version.toJSON() : version;
  return {
    id: v.id,
    versionNumber: v.versionNumber,
    generatedAt: v.generatedAt,
    isActive: v.isActive,
    strategy: v.strategy ?? null,
    calendar: v.calendar ?? null,
    influencer_matches: Array.isArray(v.influencer_matches) ? v.influencer_matches : [],
    influencer_strategy_note: v.influencer_strategy_note ?? null,
    influencer_stage_skipped: Boolean(v.influencer_stage_skipped),
  };
}

function formatCampaignWithRelations(campaignModel) {
  const campaign =
    typeof campaignModel.toJSON === 'function' ? campaignModel.toJSON() : campaignModel;

  const aiVersions = Array.isArray(campaign.aiVersions) ? campaign.aiVersions : [];
  const activeAi = getActiveAiVersion(aiVersions);

  return {
    id: campaign.id,
    campaignName: campaign.campaignName,
    status: campaign.status,
    lifecycleStage: campaign.status,
    isPublished: campaign.isPublished,
    userId: campaign.userId,
    campaign_goal: campaign.campaign_goal,
    goalType: campaign.campaign_goal,
    budget_amount: campaign.budget_amount,
    budget_currency: campaign.budget_currency,
    campaign_duration_weeks: campaign.campaign_duration_weeks,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    brandTone: campaign.brandTone ?? null,
    aiSnapshot: campaign.aiSnapshot ?? null,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    targetAudience: campaign.targetAudience ?? null,
    kpis: Array.isArray(campaign.kpis) ? campaign.kpis : [],
    contentCalendar: Array.isArray(campaign.contentCalendar) ? campaign.contentCalendar : [],
    ai: formatAiVersion(activeAi),
    aiVersions: aiVersions.map(formatAiVersion).filter(Boolean),
  };
}

/* =========================
   EXPORTS
========================= */

module.exports = {
  extractAiPayload,
  saveAiVersion,
  syncContentCalendarFromAi,
  persistCampaignAi,
  calendarDaysToContentRows,
  getActiveAiVersion,
  formatAiVersion,
  formatCampaignWithRelations,
};