/**
 * Campaign Tracking Test Data
 * 
 * Seeds campaigns with realistic tracking scenarios for testing:
 * - On-track campaigns (good progress)
 * - At-risk campaigns (falling behind)
 * - Campaigns with actual performance data
 * - Various KPI achievement levels
 */

const trackingTestCampaigns = [
  // ─── 1. ON-TRACK CAMPAIGN (Good Progress) ─────────────────────────────────
  {
    ownerEmail: 'owner01@example.com',
    key: 'on-track-campaign',
    campaign: {
      campaignName: 'Summer Fashion Launch - On Track',
      lifecycleStage: 'saved',
      campaign_goal: 'Awareness',
      budget_amount: 5000,
      budget_currency: 'USD',
      campaign_duration_weeks: 6,
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days from now
      isPublished: true,
    },
    targetAudience: {
      ageRange: '18-35',
      gender: 'female',
      interests: ['fashion', 'beauty', 'lifestyle'],
      platformsUsed: ['instagram', 'tiktok'],
    },
    kpis: [
      { metric: 'impressions', targetValue: '500000' },
      { metric: 'reach', targetValue: '200000' },
      { metric: 'engagement_rate', targetValue: '4.5%' },
      { metric: 'conversions', targetValue: '1500' },
    ],
    contentCalendar: [
      // Posted content (high engagement)
      {
        day: 1,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram',
        contentType: 'reel',
        caption: 'Summer vibes are here! ☀️ New collection drops today',
        mediaUrl: 'https://example.com/fashion-reel-1.mp4',
        task: 'Launch day teaser',
        status: 'posted',
        scheduledPostId: 101, // For linking PostAnalytics
      },
      {
        day: 3,
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram',
        contentType: 'carousel',
        caption: '5 ways to style our new summer dress 👗',
        mediaUrl: 'https://example.com/fashion-carousel-1.jpg',
        task: 'Styling tips carousel',
        status: 'posted',
        scheduledPostId: 102,
      },
      {
        day: 5,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'tiktok',
        contentType: 'video',
        caption: 'POV: You found the perfect summer outfit',
        mediaUrl: 'https://example.com/fashion-tiktok-1.mp4',
        task: 'Viral outfit video',
        status: 'posted',
        scheduledPostId: 103,
      },
      {
        day: 7,
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram',
        contentType: 'story',
        caption: 'Behind the scenes of our photoshoot',
        mediaUrl: 'https://example.com/fashion-story-1.jpg',
        task: 'BTS story series',
        status: 'posted',
        scheduledPostId: 104,
      },
      // Scheduled content
      {
        day: 14,
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram',
        contentType: 'reel',
        caption: 'Customer reviews unboxing',
        mediaUrl: 'https://example.com/fashion-reel-2.mp4',
        task: 'UGC showcase',
        status: 'scheduled',
      },
      {
        day: 18,
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'tiktok',
        contentType: 'video',
        caption: 'Get ready with me - summer edition',
        mediaUrl: 'https://example.com/fashion-tiktok-2.mp4',
        task: 'GRWM video',
        status: 'scheduled',
      },
      {
        day: 21,
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram',
        contentType: 'post',
        caption: 'Limited edition summer colors',
        mediaUrl: 'https://example.com/fashion-post-1.jpg',
        task: 'Limited edition announcement',
        status: 'scheduled',
      },
    ],
    postAnalytics: {
      101: { likes: 15420, comments: 892, shares: 1240, reach: 85000, impressions: 125000 },
      102: { likes: 8230, comments: 456, shares: 380, reach: 45000, impressions: 68000 },
      103: { likes: 28450, comments: 1250, shares: 5680, reach: 145000, impressions: 210000 },
      104: { likes: 5340, comments: 230, shares: 120, reach: 25000, impressions: 38000 },
    },
  },

  // ─── 2. AT-RISK CAMPAIGN (Behind Schedule) ────────────────────────────────
  {
    ownerEmail: 'owner01@example.com',
    key: 'at-risk-campaign',
    campaign: {
      campaignName: 'Tech Gadget Review - At Risk',
      lifecycleStage: 'saved',
      campaign_goal: 'Leads',
      budget_amount: 3000,
      budget_currency: 'USD',
      campaign_duration_weeks: 4,
      startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      isPublished: true,
    },
    targetAudience: {
      ageRange: '25-45',
      gender: 'all',
      interests: ['technology', 'gadgets', 'reviews'],
      platformsUsed: ['youtube', 'instagram'],
    },
    kpis: [
      { metric: 'impressions', targetValue: '200000' },
      { metric: 'reach', targetValue: '80000' },
      { metric: 'conversions', targetValue: '500' },
    ],
    contentCalendar: [
      // Only 2 posted out of 8 scheduled (falling behind)
      {
        day: 1,
        date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'youtube',
        contentType: 'video',
        caption: 'Unboxing the latest tech gadget',
        mediaUrl: 'https://example.com/tech-unboxing.mp4',
        task: 'Unboxing video',
        status: 'posted',
        scheduledPostId: 201,
      },
      {
        day: 7,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram',
        contentType: 'reel',
        caption: 'Quick review in 60 seconds',
        mediaUrl: 'https://example.com/tech-reel-1.mp4',
        task: 'Quick review reel',
        status: 'posted',
        scheduledPostId: 202,
      },
      // Failed content
      {
        day: 10,
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'youtube',
        contentType: 'video',
        caption: 'Deep dive review and testing',
        mediaUrl: null,
        task: 'Deep dive video - FAILED',
        status: 'failed',
      },
      // Overdue scheduled content (should have been posted)
      {
        day: 14,
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram',
        contentType: 'carousel',
        caption: 'Comparison with competitors',
        mediaUrl: 'https://example.com/tech-comparison.jpg',
        task: 'Comparison carousel',
        status: 'scheduled', // OVERDUE - should be posted by now
      },
      {
        day: 18,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'youtube',
        contentType: 'video',
        caption: 'Final verdict - worth it?',
        mediaUrl: 'https://example.com/tech-verdict.mp4',
        task: 'Final verdict video',
        status: 'scheduled', // OVERDUE
      },
      // Future scheduled
      {
        day: 22,
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram',
        contentType: 'story',
        caption: 'Q&A about the gadget',
        mediaUrl: 'https://example.com/tech-qa.jpg',
        task: 'Q&A story',
        status: 'scheduled',
      },
    ],
    postAnalytics: {
      201: { likes: 3200, comments: 180, shares: 95, reach: 18000, impressions: 25000 },
      202: { likes: 1500, comments: 80, shares: 40, reach: 9500, impressions: 14000 },
    },
  },

  // ─── 3. HIGH-PERFORMING CAMPAIGN (Exceeding Targets) ───────────────────────
  {
    ownerEmail: 'owner01@example.com',
    key: 'high-performing-campaign',
    campaign: {
      campaignName: 'Fitness Challenge - Crushing It',
      lifecycleStage: 'saved',
      campaign_goal: 'Awareness',
      budget_amount: 8000,
      budget_currency: 'USD',
      campaign_duration_weeks: 8,
      startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days ago
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days from now
      isPublished: true,
    },
    targetAudience: {
      ageRange: '20-40',
      gender: 'all',
      interests: ['fitness', 'health', 'wellness', 'motivation'],
      platformsUsed: ['Instagram', 'TikTok', 'YouTube'],
    },
    kpis: [
      { metric: 'impressions', targetValue: '1000000' },
      { metric: 'reach', targetValue: '400000' },
      { metric: 'engagement_rate', targetValue: '6.0%' },
      { metric: 'conversions', targetValue: '3000' },
    ],
    contentCalendar: [
      // Many posted items with high engagement
      {
        day: 1, date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram', contentType: 'reel', caption: '30-day challenge announcement',
        mediaUrl: 'https://example.com/fitness-day1.mp4', task: 'Challenge kickoff', status: 'posted', scheduledPostId: 301,
      },
      {
        day: 3, date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'tiktok', contentType: 'video', caption: 'Day 3 transformation starting',
        mediaUrl: 'https://example.com/fitness-day3.mp4', task: 'Transformation video', status: 'posted', scheduledPostId: 302,
      },
      {
        day: 5, date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram', contentType: 'carousel', caption: 'Meal prep for fitness success',
        mediaUrl: 'https://example.com/fitness-meal.jpg', task: 'Meal prep carousel', status: 'posted', scheduledPostId: 303,
      },
      {
        day: 7, date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'youtube', contentType: 'video', caption: 'Full week 1 workout routine',
        mediaUrl: 'https://example.com/fitness-week1.mp4', task: 'Weekly workout video', status: 'posted', scheduledPostId: 304,
      },
      {
        day: 10, date: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'tiktok', contentType: 'video', caption: 'Quick HIIT routine - 15 mins',
        mediaUrl: 'https://example.com/fitness-hiit.mp4', task: 'HIIT workout', status: 'posted', scheduledPostId: 305,
      },
      {
        day: 12, date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram', contentType: 'reel', caption: 'Mid-challenge check in',
        mediaUrl: 'https://example.com/fitness-mid.mp4', task: 'Progress check-in', status: 'posted', scheduledPostId: 306,
      },
      {
        day: 14, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'instagram', contentType: 'story', caption: 'Behind the scenes',
        mediaUrl: 'https://example.com/fitness-bts.jpg', task: 'BTS content', status: 'posted', scheduledPostId: 307,
      },
      {
        day: 17, date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'tiktok', contentType: 'video', caption: 'Client success story',
        mediaUrl: 'https://example.com/fitness-success.mp4', task: 'Testimonial video', status: 'posted', scheduledPostId: 308,
      },
      // Scheduled content
      {
        day: 21, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'youtube', contentType: 'video', caption: 'Week 3 advanced moves',
        mediaUrl: 'https://example.com/fitness-week3.mp4', task: 'Advanced workout', status: 'scheduled',
      },
      {
        day: 28, date: new Date(Date.now()).toISOString(),
        platform: 'instagram', contentType: 'reel', caption: 'Final challenge results',
        mediaUrl: 'https://example.com/fitness-final.mp4', task: 'Results showcase', status: 'scheduled',
      },
      {
        day: 35, date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        platform: 'tiktok', contentType: 'video', caption: 'Challenge highlights reel',
        mediaUrl: 'https://example.com/fitness-highlights.mp4', task: 'Highlights compilation', status: 'scheduled',
      },
    ],
    postAnalytics: {
      // High engagement numbers exceeding targets
      301: { likes: 45600, comments: 2840, shares: 8900, reach: 245000, impressions: 380000 },
      302: { likes: 38200, comments: 1920, shares: 12500, reach: 198000, impressions: 310000 },
      303: { likes: 21500, comments: 1450, shares: 4200, reach: 125000, impressions: 195000 },
      304: { likes: 52100, comments: 4200, shares: 15600, reach: 280000, impressions: 450000 },
      305: { likes: 28900, comments: 1680, shares: 9800, reach: 165000, impressions: 260000 },
      306: { likes: 33400, comments: 2100, shares: 11200, reach: 185000, impressions: 295000 },
      307: { likes: 12800, comments: 680, shares: 2100, reach: 75000, impressions: 115000 },
      308: { likes: 41200, comments: 2400, shares: 14200, reach: 220000, impressions: 340000 },
    },
  },

  // ─── 4. COMPLETED CAMPAIGN (Full History) ────────────────────────────────
  {
    ownerEmail: 'owner01@example.com',
    key: 'completed-campaign',
    campaign: {
      campaignName: 'Holiday Sale 2025 - Completed',
      lifecycleStage: 'completed',
      campaign_goal: 'Sales',
      budget_amount: 12000,
      budget_currency: 'USD',
      campaign_duration_weeks: 3,
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
      endDate: new Date(Date.now() - 69 * 24 * 60 * 60 * 1000).toISOString(), // 69 days ago (completed)
      isPublished: true,
    },
    targetAudience: {
      ageRange: '25-55',
      gender: 'all',
      interests: ['shopping', 'deals', 'holiday', 'gifts'],
      platformsUsed: ['instagram', 'facebook', 'tiktok'],
    },
    kpis: [
      { metric: 'impressions', targetValue: '800000' },
      { metric: 'reach', targetValue: '350000' },
      { metric: 'conversions', targetValue: '5000' },
      { metric: 'ROAS', targetValue: '4.5' },
    ],
    contentCalendar: [
      // All content posted (campaign completed)
      { day: 1, date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), platform: 'instagram', contentType: 'reel', caption: 'Sale starts NOW!', status: 'posted', scheduledPostId: 401 },
      { day: 2, date: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000).toISOString(), platform: 'tiktok', contentType: 'video', caption: 'Best deals under $50', status: 'posted', scheduledPostId: 402 },
      { day: 4, date: new Date(Date.now() - 87 * 24 * 60 * 60 * 1000).toISOString(), platform: 'instagram', contentType: 'carousel', caption: 'Gift guide for everyone', status: 'posted', scheduledPostId: 403 },
      { day: 7, date: new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString(), platform: 'facebook', contentType: 'post', caption: 'Week 1 bestsellers', status: 'posted', scheduledPostId: 404 },
      { day: 10, date: new Date(Date.now() - 81 * 24 * 60 * 60 * 1000).toISOString(), platform: 'instagram', contentType: 'reel', caption: 'Limited time offer', status: 'posted', scheduledPostId: 405 },
      { day: 14, date: new Date(Date.now() - 77 * 24 * 60 * 60 * 1000).toISOString(), platform: 'tiktok', contentType: 'video', caption: 'Last chance sale alert', status: 'posted', scheduledPostId: 406 },
      { day: 17, date: new Date(Date.now() - 74 * 24 * 60 * 60 * 1000).toISOString(), platform: 'instagram', contentType: 'story', caption: 'Final hours!', status: 'posted', scheduledPostId: 407 },
      { day: 18, date: new Date(Date.now() - 73 * 24 * 60 * 60 * 1000).toISOString(), platform: 'facebook', contentType: 'post', caption: 'Sale extended 24h', status: 'posted', scheduledPostId: 408 },
      { day: 20, date: new Date(Date.now() - 71 * 24 * 60 * 60 * 1000).toISOString(), platform: 'instagram', contentType: 'reel', caption: 'Thank you for shopping!', status: 'posted', scheduledPostId: 409 },
    ],
    postAnalytics: {
      401: { likes: 89200, comments: 5200, shares: 28400, reach: 420000, impressions: 650000 },
      402: { likes: 42100, comments: 2800, shares: 15600, reach: 195000, impressions: 310000 },
      403: { likes: 36800, comments: 4200, shares: 12800, reach: 175000, impressions: 280000 },
      404: { likes: 15200, comments: 1800, shares: 6200, reach: 85000, impressions: 135000 },
      405: { likes: 68400, comments: 3800, shares: 22400, reach: 320000, impressions: 510000 },
      406: { likes: 52100, comments: 3100, shares: 18200, reach: 245000, impressions: 390000 },
      407: { likes: 28400, comments: 1200, shares: 5600, reach: 125000, impressions: 195000 },
      408: { likes: 22400, comments: 2100, shares: 4800, reach: 98000, impressions: 155000 },
      409: { likes: 45600, comments: 2800, shares: 14200, reach: 215000, impressions: 340000 },
    },
  },
];

module.exports = trackingTestCampaigns;
