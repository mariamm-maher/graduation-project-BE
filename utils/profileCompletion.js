/**
 * Checks if a field value is considered "completed" or "filled".
 * - Returns false for null or undefined.
 * - Returns false for empty strings.
 * - Returns false for empty arrays.
 * - Returns false for empty objects (excluding Date).
 * - Returns true for 0 (numbers).
 * - Returns true for false (booleans).
 */
const isFieldFilled = (value) => {
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'string') return value.trim().length > 0;
  
  if (typeof value === 'number') return true; // Treat 0 as valid input
  
  if (typeof value === 'boolean') return true; // Treat false as valid input (if any)

  if (Array.isArray(value)) return value.length > 0;
  
  if (value instanceof Date) return true;
  
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  
  return true;
};

// Helper function to extract plain data from input
const getProfileData = (profile) => {
  if (!profile) return null;
  return typeof profile.toJSON === 'function' ? profile.toJSON() : profile;
};

// Calculate owner profile completion
exports.calculateOwnerProfileCompletion = (profileInstance) => {
  const profile = getProfileData(profileInstance);
  if (!profile) return 0;

  const fields = [
    'businessName',
    'businessType',
    'industry',
    'location',
    'description',
    'image',
    'website',
    'phoneNumber',
    'platformsUsed',
    'primaryMarketingGoal',
    'targetAudience'
  ];

  const filledCount = fields.filter(field => isFieldFilled(profile[field])).length;
  return Math.round((filledCount / fields.length) * 100);
};

// Calculate influencer profile completion
exports.calculateInfluencerProfileCompletion = (profileInstance) => {
  const profile = getProfileData(profileInstance);
  if (!profile) return 0;

  const fields = [
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

  const filledCount = fields.filter(field => isFieldFilled(profile[field])).length;
  return Math.round((filledCount / fields.length) * 100);
};
