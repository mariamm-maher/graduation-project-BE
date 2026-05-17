/**
 * Data Constants
 * 
 * Realistic data for seed generation - industries, categories, locations, etc.
 */

const INDUSTRIES = [
  'Technology & Apps',
  'Health & Fitness',
  'Beauty & Cosmetics',
  'Fashion & Apparel',
  'Food & Beverage',
  'Travel & Hospitality',
  'Gaming & Esports',
  'Finance & Fintech',
  'Education & E-learning',
  'Home & Lifestyle',
  'Automotive',
  'Pets & Animals',
  'Sustainability & Eco',
  'Entertainment & Media',
  'Professional Services',
  'Sports & Outdoors',
  'Parenting & Family',
  'Art & Design',
  'Music & Audio',
  'Books & Publishing'
];

const INFLUENCER_CATEGORIES = [
  'Technology',
  'Fitness',
  'Beauty',
  'Fashion',
  'Food',
  'Travel',
  'Gaming',
  'Lifestyle',
  'Business',
  'Education',
  'Health',
  'Home',
  'Automotive',
  'Parenting',
  'Photography',
  'Music',
  'Sustainability',
  'Finance',
  'Sports',
  'Art'
];

const PLATFORM_CONTENT_TYPES = {
  instagram: ['post', 'story', 'reel', 'carousel'],
  facebook: ['post', 'story', 'video', 'article'],
  twitter: ['post', 'article'],
  linkedin: ['article', 'post'],
  tiktok: ['video', 'story'],
  youtube: ['video', 'story']
};

const COLLABORATION_TYPES = [
  'sponsored_post',
  'product_review',
  'brand_ambassador',
  'affiliate',
  'tutorial',
  'unboxing',
  'takeover',
  'event_appearance',
  'content_series',
  'giveaway'
];

const CAMPAIGN_GOALS = ['Awareness', 'Leads', 'Sales', 'Retention', 'Re-engagement'];

const COMPANY_SIZES = ['Solo', 'Small', 'Mid', 'Enterprise'];

const LOCATIONS = [
  { city: 'San Francisco', country: 'US', region: 'North America' },
  { city: 'New York', country: 'US', region: 'North America' },
  { city: 'Los Angeles', country: 'US', region: 'North America' },
  { city: 'Chicago', country: 'US', region: 'North America' },
  { city: 'Austin', country: 'US', region: 'North America' },
  { city: 'Seattle', country: 'US', region: 'North America' },
  { city: 'Miami', country: 'US', region: 'North America' },
  { city: 'Boston', country: 'US', region: 'North America' },
  { city: 'Toronto', country: 'Canada', region: 'North America' },
  { city: 'Vancouver', country: 'Canada', region: 'North America' },
  { city: 'London', country: 'UK', region: 'Europe' },
  { city: 'Manchester', country: 'UK', region: 'Europe' },
  { city: 'Berlin', country: 'Germany', region: 'Europe' },
  { city: 'Paris', country: 'France', region: 'Europe' },
  { city: 'Amsterdam', country: 'Netherlands', region: 'Europe' },
  { city: 'Barcelona', country: 'Spain', region: 'Europe' },
  { city: 'Lisbon', country: 'Portugal', region: 'Europe' },
  { city: 'Rome', country: 'Italy', region: 'Europe' },
  { city: 'Dubai', country: 'UAE', region: 'MENA' },
  { city: 'Abu Dhabi', country: 'UAE', region: 'MENA' },
  { city: 'Riyadh', country: 'Saudi Arabia', region: 'MENA' },
  { city: 'Doha', country: 'Qatar', region: 'MENA' },
  { city: 'Cairo', country: 'Egypt', region: 'MENA' },
  { city: 'Amman', country: 'Jordan', region: 'MENA' },
  { city: 'Singapore', country: 'Singapore', region: 'Asia' },
  { city: 'Tokyo', country: 'Japan', region: 'Asia' },
  { city: 'Sydney', country: 'Australia', region: 'Oceania' },
  { city: 'Melbourne', country: 'Australia', region: 'Oceania' },
  { city: 'São Paulo', country: 'Brazil', region: 'South America' },
  { city: 'Mexico City', country: 'Mexico', region: 'North America' }
];

const AUDIENCE_AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

const AUDIENCE_GENDERS = ['all', 'male', 'female'];

const INTERESTS = [
  'fitness', 'wellness', 'nutrition', 'yoga', 'running',
  'technology', 'gadgets', 'apps', 'gaming', 'programming',
  'fashion', 'style', 'beauty', 'skincare', 'makeup',
  'travel', 'adventure', 'photography', 'nature', 'outdoors',
  'food', 'cooking', 'recipes', 'restaurants', 'wine',
  'music', 'movies', 'books', 'podcasts', 'art',
  'business', 'entrepreneurship', 'investing', 'career', 'productivity',
  'parenting', 'family', 'education', 'homeschooling',
  'sustainability', 'eco-friendly', 'zero-waste', 'vegan',
  'sports', 'football', 'basketball', 'tennis', 'swimming',
  'luxury', 'lifestyle', 'home', 'decor', 'diy'
];

const CONTENT_TOPICS = [
  'product_review', 'tutorial', 'how_to', 'tips_tricks', 'behind_the_scenes',
  'day_in_life', 'transformation', 'comparison', 'unboxing', 'haul',
  'q_and_a', 'interview', 'storytelling', 'educational', 'entertainment',
  'motivational', 'challenge', 'trend', 'news', 'event'
];

const KPI_TARGET_VALUES = {
  impressions: ['50000', '100000', '250000', '500000', '1000000'],
  reach: ['25000', '50000', '100000', '250000', '500000'],
  engagement_rate: ['2.5%', '3.5%', '5.0%', '6.5%', '8.0%'],
  conversions: ['100', '250', '500', '1000', '2500'],
  ROAS: ['2.0x', '3.0x', '4.5x', '6.0x', '8.0x'],
  CPA: ['$5', '$10', '$15', '$25', '$50'],
  CTR: ['1.0%', '1.5%', '2.5%', '3.5%', '5.0%']
};

const BRAND_VALUES = [
  'Innovation', 'Quality', 'Integrity', 'Sustainability', 'Customer First',
  'Transparency', 'Diversity', 'Excellence', 'Passion', 'Collaboration',
  'Authenticity', 'Creativity', 'Community', 'Responsibility', 'Trust'
];

const CAMPAIGN_OBJECTIVES = [
  'Increase brand awareness among target demographic',
  'Drive product trial and sampling',
  'Generate qualified leads for sales team',
  'Boost e-commerce conversions and sales',
  'Improve customer retention and loyalty',
  'Re-engage lapsed customers',
  'Build community and user-generated content',
  'Educate market about new product features',
  'Establish thought leadership in industry',
  'Support product launch momentum'
];

const DELIVERABLE_TYPES = [
  { type: 'Instagram Post', description: 'Static image post with caption' },
  { type: 'Instagram Reel', description: 'Short-form video (15-60 seconds)' },
  { type: 'Instagram Story', description: '24-hour ephemeral content' },
  { type: 'TikTok Video', description: 'Short-form video with trending audio' },
  { type: 'YouTube Video', description: 'Long-form video (5-15 minutes)' },
  { type: 'YouTube Short', description: 'Vertical short-form video' },
  { type: 'Twitter Thread', description: 'Multi-tweet story format' },
  { type: 'LinkedIn Article', description: 'Professional long-form content' },
  { type: 'Blog Post', description: 'Written review or feature' },
  { type: 'Live Stream', description: 'Real-time engagement session' }
];

const TASK_TEMPLATES = [
  { name: 'Content Concept Approval', description: 'Submit initial content concept for brand approval' },
  { name: 'First Draft Submission', description: 'Submit first draft of content' },
  { name: 'Content Revisions', description: 'Make requested edits to content' },
  { name: 'Final Content Approval', description: 'Get final sign-off on content' },
  { name: 'Content Publishing', description: 'Publish approved content to social channels' },
  { name: 'Performance Report', description: 'Submit analytics and performance report' },
  { name: 'Story Highlights', description: 'Add to permanent story highlights' },
  { name: 'Link in Bio', description: 'Maintain link in bio for campaign duration' },
  { name: 'Swipe Up CTA', description: 'Include swipe-up link in stories' },
  { name: 'Hashtag Usage', description: 'Use campaign-specific hashtags' }
];

const CHAT_MESSAGES = {
  owner: [
    'Hi! Excited to work together on this campaign.',
    'The brand guidelines are attached. Please review them.',
    'This looks great! Just a few minor tweaks needed.',
    'Approved! Go ahead and post whenever you\'re ready.',
    'Thanks for the quick turnaround!',
    'Can you share the performance metrics when ready?',
    'Amazing engagement on the last post!',
    'Let\'s discuss extending this partnership.',
    'Payment has been processed.',
    'Looking forward to our next collaboration!'
  ],
  influencer: [
    'Hi! Thank you for this opportunity!',
    'I\'ve reviewed the brief. Here are my initial ideas...',
    'Here is the first draft for your feedback.',
    'Thanks for the feedback! I\'ll make those changes now.',
    'Updated version attached. Let me know what you think!',
    'Content is now live! Here\'s the link.',
    'Performance report attached. Great results so far!',
    'Thank you! I\'d love to work together again.',
    'Received the payment. Thank you!',
    'Excited for our continued partnership!'
  ]
};

const NOTIFICATION_MESSAGES = {
  CAMPAIGN_INVITATION: (data) => `You've been invited to collaborate on "${data.campaignName}"`,
  CAMPAIGN_PUBLISHED: (data) => `"${data.campaignName}" has been published and is now live`,
  CAMPAIGN_APPROVED: (data) => `Your campaign "${data.campaignName}" has been approved`,
  CAMPAIGN_REJECTED: (data) => `Your campaign "${data.campaignName}" was not approved`,
  AI_CAMPAIGN_READY: (data) => `AI-generated strategy for "${data.campaignName}" is ready`,
  CONTRACT_CREATED: () => 'A new contract has been created for your review',
  CONTRACT_SENT: () => 'Contract sent for signature',
  CONTRACT_SIGNED: () => 'Contract has been signed by all parties',
  OFFER_MADE: (data) => `New offer: $${data.amount} for collaboration`,
  OFFER_ACCEPTED: () => 'Your offer has been accepted',
  OFFER_REJECTED: () => 'Your offer was declined',
  PROPOSAL_SUBMITTED: () => 'New collaboration proposal received',
  PROPOSAL_ACCEPTED: () => 'Your proposal has been accepted',
  PROPOSAL_REJECTED: () => 'Your proposal was not accepted',
  TASK_ASSIGNED: (data) => `New task assigned: ${data.taskName}`,
  TASK_STARTED: (data) => `Task started: ${data.taskName}`,
  TASK_SUBMITTED: (data) => `Task submitted for review: ${data.taskName}`,
  TASK_APPROVED: (data) => `Task approved: ${data.taskName}`,
  TASK_REJECTED: (data) => `Task needs revision: ${data.taskName}`,
  TASK_FINAL_REJECTED: (data) => `Task rejected: ${data.taskName}`,
  FILE_UPLOADED: () => 'New file uploaded to collaboration',
  MESSAGE_RECEIVED: (data) => `New message from ${data.senderName}`
};

module.exports = {
  INDUSTRIES,
  INFLUENCER_CATEGORIES,
  PLATFORM_CONTENT_TYPES,
  COLLABORATION_TYPES,
  CAMPAIGN_GOALS,
  COMPANY_SIZES,
  LOCATIONS,
  AUDIENCE_AGE_RANGES,
  AUDIENCE_GENDERS,
  INTERESTS,
  CONTENT_TOPICS,
  KPI_TARGET_VALUES,
  BRAND_VALUES,
  CAMPAIGN_OBJECTIVES,
  DELIVERABLE_TYPES,
  TASK_TEMPLATES,
  CHAT_MESSAGES,
  NOTIFICATION_MESSAGES
};
