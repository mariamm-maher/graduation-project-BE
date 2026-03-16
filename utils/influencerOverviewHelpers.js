const AppError = require('./AppError');
const { calculateInfluencerProfileCompletion } = require('./profileCompletion');

const DATE_RANGE_CONFIG = {
  '7d': { days: 7, groupBy: 'day' },
  '30d': { days: 30, groupBy: 'day' },
  '90d': { days: 90, groupBy: 'week' },
  '365d': { days: 365, groupBy: 'month' }
};

const parseNumeric = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return 0;

  const multiplier = normalized.endsWith('k') ? 1_000 : normalized.endsWith('m') ? 1_000_000 : 1;
  const raw = normalized.replace(/[^0-9.-]/g, '').replace(/,/g, '');
  const parsed = parseFloat(raw);

  if (!Number.isFinite(parsed)) return 0;
  return parsed * multiplier;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toDateRange = (dateRange = '30d') => {
  const config = DATE_RANGE_CONFIG[dateRange];

  if (!config) {
    throw new AppError('Invalid dateRange. Allowed values: 7d, 30d, 90d, 365d', 400);
  }

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - config.days);

  return { startDate, endDate, groupBy: config.groupBy };
};

const getWeekStart = (date) => {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utcDate.setUTCDate(utcDate.getUTCDate() + diff);
  return utcDate;
};

const getBucketKey = (date, groupBy) => {
  const utcDate = new Date(date);

  if (groupBy === 'month') {
    return `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  if (groupBy === 'week') {
    const weekStart = getWeekStart(utcDate);
    return weekStart.toISOString().slice(0, 10);
  }

  return utcDate.toISOString().slice(0, 10);
};

const buildSeriesSkeleton = (startDate, endDate, groupBy) => {
  const buckets = [];
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

  while (cursor <= end) {
    if (groupBy === 'month') {
      cursor.setUTCDate(1);
      const key = getBucketKey(cursor, groupBy);
      if (!buckets.includes(key)) buckets.push(key);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      continue;
    }

    if (groupBy === 'week') {
      const weekStart = getWeekStart(cursor);
      const key = weekStart.toISOString().slice(0, 10);
      if (!buckets.includes(key)) buckets.push(key);
      cursor.setUTCDate(cursor.getUTCDate() + 7);
      continue;
    }

    buckets.push(getBucketKey(cursor, groupBy));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return buckets;
};

const computeProfileCompletion = (profileInstance) => {
  const completionPercentage = calculateInfluencerProfileCompletion(profileInstance);

  if (!profileInstance) {
    return {
      completionPercentage,
      missingFields: [
        'bio',
        'image',
        'location',
        'socialMediaLinks',
        'primaryPlatform',
        'followersCount',
        'engagementRate',
        'categories',
        'contentTypes',
        'collaborationTypes',
        'audienceAgeRange',
        'audienceGender',
        'audienceLocation',
        'interests'
      ]
    };
  }

  const profile = typeof profileInstance.toJSON === 'function' ? profileInstance.toJSON() : profileInstance;

  const requiredFields = [
    'bio',
    'image',
    'location',
    'socialMediaLinks',
    'primaryPlatform',
    'followersCount',
    'engagementRate',
    'categories',
    'contentTypes',
    'collaborationTypes',
    'audienceAgeRange',
    'audienceGender',
    'audienceLocation',
    'interests'
  ];

  const isFilled = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number' || typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.length > 0;
    if (value instanceof Date) return true;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  };

  const missingFields = requiredFields.filter((field) => !isFilled(profile[field]));

  return {
    completionPercentage,
    missingFields
  };
};

module.exports = {
  parseNumeric,
  clamp,
  toDateRange,
  getBucketKey,
  buildSeriesSkeleton,
  computeProfileCompletion
};
