// Helper function to calculate owner profile completion
exports.calculateOwnerProfileCompletion = (profile) => {
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

  let filledFields = 0;
  fields.forEach(field => {
    const value = profile[field];
    if (value !== null && value !== undefined && value !== '' && 
        !(Array.isArray(value) && value.length === 0) &&
        !(typeof value === 'object' && Object.keys(value).length === 0)) {
      filledFields++;
    }
  });

  return Math.round((filledFields / fields.length) * 100);
};

// Helper function to calculate influencer profile completion
exports.calculateInfluencerProfileCompletion = (profile) => {
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

  let filledFields = 0;
  fields.forEach(field => {
    const value = profile[field];
    if (value !== null && value !== undefined && value !== '' && 
        !(Array.isArray(value) && value.length === 0) &&
        !(typeof value === 'object' && Object.keys(value).length === 0) &&
        value !== 0) {
      filledFields++;
    }
  });

  return Math.round((filledFields / fields.length) * 100);
};
