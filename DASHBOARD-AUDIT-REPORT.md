# Owner Dashboard Audit Report

## Overview
The owner dashboard (`GET /api/owner/dashboard`) aggregates data from 7 parallel queries to provide a comprehensive view of brand performance. All queries run concurrently using `Promise.all()` for optimal performance.

---

## Query A: Brand Health Score

### Purpose
Calculates an overall brand health score based on campaign performance, engagement, collaborations, and goal achievement.

### Data Sources
- `Campaign` table (counts by lifecycleStage)
- `KPI` table (average engagement_rate)
- `Collaboration` table (success rate)

### Calculations

#### 1. Campaign Counts
- `totalCampaigns`: Count of all campaigns for the user
- `completedCampaigns`: Count of campaigns with `lifecycleStage = 'completed'`
- `activeCampaigns`: Count of campaigns with `lifecycleStage = 'active'`

#### 2. Average Engagement Rate
```javascript
// Fetch all campaign IDs for the user
const campaigns = await Campaign.findAll({ where: { userId }, attributes: ['id'] });
const campaignIds = campaigns.map(c => c.id);

// Calculate average engagement_rate from KPIs
const kpiResult = await KPI.findOne({
  attributes: [[sequelize.fn('AVG', sequelize.cast(sequelize.col('targetValue'), 'FLOAT')), 'avgEngagement']],
  where: { metric: 'engagement_rate', campaignId: { [Op.in]: campaignIds } }
});
const avgEngagement = kpiResult?.dataValues?.avgEngagement || 0;
```

#### 3. Collaboration Success Rate
```javascript
const totalCollabs = await Collaboration.count({ where: { ownerId: userId } });
const successfulCollabs = await Collaboration.count({
  where: { ownerId: userId, status: { [Op.in]: ['live', 'completed'] } }
});
```

#### 4. Score Calculation (Max 100 points)
```javascript
// Component calculations (clamped to max values)
const completionRate = totalCampaigns > 0 ? (completedCampaigns / totalCampaigns) * 30 : 0;  // Max 30
const engagementScore = clamp(avgEngagement * 20, 0, 25);  // Max 25
const activeRatio = clamp((activeCampaigns / Math.max(totalCampaigns, 1)) * 20, 0, 20);  // Max 20
const collabSuccess = clamp((successfulCollabs / Math.max(totalCollabs, 1)) * 15, 0, 15);  // Max 15
const goalAchievement = clamp(0.75 * 10, 0, 10);  // Max 10 (MOCK VALUE - hardcoded 75%)

// Total score
const score = Math.round(completionRate + engagementScore + activeRatio + collabSuccess + goalAchievement);
```

#### 5. Status Determination
```javascript
let status = 'Needs Attention';
if (score >= 80) status = 'Excellent';
else if (score >= 60) status = 'Good';
else if (score >= 40) status = 'Average';
```

#### 6. Trend (Mock)
```javascript
const trend = Math.random() > 0.5 ? 'up' : 'down';  // RANDOM - not based on actual historical data
```

### Response Structure
```javascript
{
  score: number,      // 0-100
  trend: 'up' | 'down' | 'stable',
  status: 'Excellent' | 'Good' | 'Average' | 'Needs Attention'
}
```

### Issues Identified
1. **Goal achievement is hardcoded to 75%** - should be calculated from actual KPI performance
2. **Trend is random** - should compare with previous period data
3. **No error handling for missing campaign IDs** - if user has no campaigns, avgEngagement will be 0

---

## Query B: KPIs

### Purpose
Aggregates key performance indicators across all campaigns.

### Data Sources
- `KPI` table (filtered by user's campaigns)
- `Campaign` table (count of active campaigns)

### Calculations

#### 1. KPI Aggregation
```javascript
const kpis = await KPI.findAll({
  attributes: ['metric', 'targetValue'],
  include: [{ model: Campaign, as: 'campaign', where: { userId }, attributes: [] }]
});

// Aggregate by metric type
let totalReach = 0, engagementRate = 0, totalConversions = 0, campaignROI = 0;
let reachCount = 0, engagementCount = 0, roiCount = 0;

kpis.forEach(kpi => {
  const value = parseFloat(kpi.targetValue) || 0;
  if (kpi.metric === 'reach') { totalReach += value; reachCount++; }
  if (kpi.metric === 'engagement_rate') { engagementRate += value; engagementCount++; }
  if (kpi.metric === 'conversions') { totalConversions += value; }
  if (kpi.metric === 'ROAS') { campaignROI += value; roiCount++; }
});

// Calculate averages
engagementRate = engagementCount > 0 ? engagementRate / engagementCount : 0;
campaignROI = roiCount > 0 ? campaignROI / roiCount : 0;
```

#### 2. Active Campaigns Count
```javascript
const activeCampaigns = await Campaign.count({ where: { userId, lifecycleStage: 'active' } });
```

#### 3. Trends (Mock)
```javascript
const trends = {
  totalReach: Math.random() > 0.5 ? '+12%' : '-5%',      // RANDOM
  engagementRate: Math.random() > 0.5 ? '+8%' : '-3%',   // RANDOM
  totalConversions: Math.random() > 0.5 ? '+15%' : '-2%', // RANDOM
  campaignROI: Math.random() > 0.5 ? '+10%' : '-7%'     // RANDOM
};
```

### Response Structure
```javascript
{
  totalReach: number,           // Sum of all reach KPIs
  engagementRate: number,       // Average of engagement_rate KPIs
  totalConversions: number,     // Sum of all conversions KPIs
  campaignROI: number,          // Average of ROAS KPIs
  activeCampaigns: number,     // Count of active campaigns
  trends: {
    totalReach: string,         // Percentage change (mock)
    engagementRate: string,     // Percentage change (mock)
    totalConversions: string,   // Percentage change (mock)
    campaignROI: string         // Percentage change (mock)
  }
}
```

### Issues Identified
1. **Trends are random** - should compare with previous period data
2. **No validation of metric values** - assumes all targetValues are valid numbers
3. **Missing metrics not handled** - if a metric type doesn't exist, returns 0

---

## Query C: Campaign Progress

### Purpose
Shows progress of all campaigns with budget tracking.

### Data Sources
- `Campaign` table (with KPIs)

### Calculations

#### 1. Campaign Fetch
```javascript
const campaigns = await Campaign.findAll({
  where: { userId },
  include: [{ model: KPI, as: 'kpis', attributes: ['metric', 'targetValue'] }]
});
```

#### 2. Progress Calculation
```javascript
campaigns.map(campaign => {
  const kpis = campaign.kpis || [];
  
  // Sum all numeric KPI values
  const numericKpiSum = kpis
    .filter(k => !isNaN(parseFloat(k.targetValue)))
    .reduce((sum, k) => sum + parseFloat(k.targetValue), 0);
  
  const budget = parseFloat(campaign.budget_amount) || 0;
  
  // Spent is either KPI sum or 60% of budget (fallback)
  const spent = numericKpiSum > 0 ? numericKpiSum : budget * 0.6;
  
  // Progress as percentage
  const progress = clamp((spent / Math.max(budget, 1)) * 100, 0, 100);
  
  return {
    id: campaign.id,
    name: campaign.campaignName,
    status: campaign.lifecycleStage,
    budget,
    spent: Math.round(spent * 100) / 100,
    progress: Math.round(progress),
    startDate: campaign.startDate,
    endDate: campaign.endDate
  };
});
```

### Response Structure
```javascript
[{
  id: number,
  name: string,
  status: string,           // lifecycleStage
  budget: number,
  spent: number,
  progress: number,        // 0-100 percentage
  startDate: date,
  endDate: date
}]
```

### Issues Identified
1. **Spent calculation is flawed** - sums all KPI values regardless of metric type (reach + engagement + conversions doesn't make sense)
2. **Fallback to 60% of budget is arbitrary** - no basis for this value
3. **No actual spend tracking** - should use actual campaign spend data, not KPI target values

---

## Query D: Business Goals

### Purpose
Shows progress toward business goals based on campaign goals.

### Data Sources
- `Campaign` table (filtered by campaigns with goals)
- `KPI` table (first KPI for each campaign)

### Calculations

#### 1. Campaign Fetch
```javascript
const campaigns = await Campaign.findAll({
  where: { userId, campaign_goal: { [Op.ne]: null } },
  include: [{ model: KPI, as: 'kpis', attributes: ['metric', 'targetValue'], limit: 1 }],
  limit: 5
});
```

#### 2. Goal Progress Calculation
```javascript
const goals = {};
campaigns.forEach(campaign => {
  const goalType = campaign.campaign_goal;
  if (!goals[goalType]) {
    const target = parseFloat(campaign.kpis?.[0]?.targetValue) || 100;  // Uses first KPI value
    const progress = 0.75;  // MOCK - hardcoded 75%
    const current = target * progress;
    
    goals[goalType] = {
      name: goalType,
      target,
      current: Math.round(current * 100) / 100,
      percentage: clamp((current / target) * 100, 0, 100)
    };
  }
});
```

### Response Structure
```javascript
[{
  name: string,        // campaign_goal type
  target: number,
  current: number,
  percentage: number   // 0-100
}]
```

### Issues Identified
1. **Progress is hardcoded to 75%** - should calculate from actual performance
2. **Uses first KPI value as target** - doesn't validate if it's the correct metric for the goal
3. **Deduplicates by goal type** - only shows one goal per type, even if multiple campaigns have the same goal
4. **Limited to 5 campaigns** - may miss important goals

---

## Query E: Top Channels

### Purpose
Shows performance metrics for connected social media channels.

### Data Sources
- `Channel` table (active channels)
- `ScheduledPost` table (with PostAnalytics)

### Calculations

#### 1. Channel Fetch
```javascript
const channels = await Channel.findAll({
  where: { userId, status: 'active' },
  include: [
    {
      model: ScheduledPost,
      as: 'scheduledPosts',
      attributes: ['id', 'status'],
      include: [{
        model: PostAnalytics,
        as: 'postAnalytics',
        attributes: ['likes', 'comments']
      }]
    }
  ]
});
```

#### 2. Metrics Calculation
```javascript
channels.map(channel => {
  let totalLikes = 0, totalComments = 0, postCount = 0;

  // Aggregate analytics from all posts
  channel.scheduledPosts?.forEach(post => {
    if (post.postAnalytics) {
      totalLikes += post.postAnalytics.likes || 0;
      totalComments += post.postAnalytics.comments || 0;
    }
    if (post.status === 'published') postCount++;
  });

  // Extract followers from platformData (platform-specific field names)
  const pd = channel.platformData || {};
  let followers = 0;
  if (channel.platform === 'facebook') {
    followers = pd.followers || 0;
  } else if (channel.platform === 'instagram') {
    followers = pd.followerCount || 0;
  } else if (channel.platform === 'youtube') {
    followers = pd.subscriberCount || 0;
  } else if (channel.platform === 'tiktok') {
    followers = pd.followerCount || 0;
  } else {
    // Fallback for other platforms
    followers = pd.followers_count || pd.follower_count || pd.fans_count || 
                pd.fan_count || pd.statistics?.subscriberCount || 
                pd.followersCount || pd.subscriber_count || 
                pd.subscriberCount || pd.followerCount || 0;
  }

  return {
    id: channel.id,
    platform: channel.platform,
    accountName: channel.accountName,
    followers,
    totalLikes,
    totalComments,
    postCount
  };
}).sort((a, b) => b.followers - a.followers).slice(0, 5);  // Top 5 by followers
```

### Response Structure
```javascript
[{
  id: number,
  platform: string,
  accountName: string,
  followers: number,
  totalLikes: number,
  totalComments: number,
  postCount: number
}]
```

### Issues Identified
1. **Only shows active channels** - inactive channels are excluded
2. **Limited to top 5** - may miss important channels
3. **PostAnalytics dependency** - if PostAnalytics records don't exist, likes/comments will be 0
4. **Platform-specific field names** - relies on correct field names in platformData JSON

---

## Query F: Influencers

### Purpose
Shows influencers the owner has collaborated with.

### Data Sources
- `Collaboration` table
- `User` table (influencer data)
- `InfluencerProfile` table
- `Campaign` table

### Calculations

#### 1. Collaboration Fetch
```javascript
const collaborations = await Collaboration.findAll({
  where: { ownerId: userId },
  include: [
    {
      model: User,
      as: 'influencer',
      include: [{ model: InfluencerProfile, as: 'influencerProfile' }]
    },
    {
      model: Campaign,
      as: 'campaign',
      attributes: ['id', 'campaignName']
    }
  ]
});
```

#### 2. Influencer Aggregation
```javascript
const influencerMap = new Map();

collaborations.forEach(collab => {
  const influencer = collab.influencer;
  if (!influencer) return;
  
  const profile = influencer.influencerProfile;
  if (!influencerMap.has(influencer.id)) {
    influencerMap.set(influencer.id, {
      id: influencer.id,
      name: `${influencer.firstName} ${influencer.lastName}`,
      campaigns: 0,
      reach: parseInt(profile?.followersCount) || 0,
      engagementRate: parseFloat(profile?.engagementRate) || 0,
      collaborations: []
    });
  }
  
  const data = influencerMap.get(influencer.id);
  data.campaigns++;
  data.collaborations.push({
    id: collab.id,
    status: collab.status,
    campaign: collab.campaign
  });
});

const influencers = Array.from(influencerMap.values());
```

### Response Structure
```javascript
[{
  id: number,
  name: string,
  campaigns: number,           // Number of campaigns collaborated on
  reach: number,               // From InfluencerProfile.followersCount
  engagementRate: number,       // From InfluencerProfile.engagementRate
  collaborations: [{
    id: number,
    status: string,
    campaign: { id, campaignName }
  }]
}]
```

### Issues Identified
1. **No sorting** - returns influencers in arbitrary order
2. **No limit** - could return many influencers
3. **Relies on InfluencerProfile** - if profile is missing, reach/engagement will be 0
4. **Shows all influencers** - no filtering by collaboration status or recency

---

## Query G: Recent Activity

### Purpose
Shows recent notifications/activity for the user.

### Data Sources
- `Notification` table

### Calculations

#### 1. Notification Fetch
```javascript
const notifications = await Notification.findAll({
  where: { userId },
  order: [['createdAt', 'DESC']],
  limit: 10
});
```

#### 2. Type Mapping
```javascript
const typeMap = {
  'CAMPAIGN_PUBLISHED': 'Campaign Published',
  'CONTRACT_SIGNED': 'Contract Signed',
  'TASK_APPROVED': 'Task Approved',
  'CHANNEL_CONNECTED': 'Channel Connected',
  'AI_CAMPAIGN_READY': 'AI Campaign Ready'
};

return notifications.map(notif => ({
  id: notif.id,
  title: typeMap[notif.type] || notif.type,
  description: notif.message,
  timestamp: notif.createdAt,
  status: notif.isRead ? 'read' : 'unread',
  type: notif.type
}));
```

### Response Structure
```javascript
[{
  id: number,
  title: string,
  description: string,
  timestamp: date,
  status: 'read' | 'unread',
  type: string
}]
```

### Issues Identified
1. **Limited to 10 notifications** - may miss older important notifications
2. **Type mapping is incomplete** - unknown notification types show raw type
3. **No filtering** - shows all notifications regardless of type or importance

---

## Overall Response Structure

```javascript
{
  success: true,
  status: 200,
  message: 'Dashboard data retrieved successfully',
  data: {
    brandHealth: { score, trend, status },
    kpis: { totalReach, engagementRate, totalConversions, campaignROI, activeCampaigns, trends },
    campaigns: [{ id, name, status, budget, spent, progress, startDate, endDate }],
    goals: [{ name, target, current, percentage }],
    channels: [{ id, platform, accountName, followers, totalLikes, totalComments, postCount }],
    influencers: [{ id, name, campaigns, reach, engagementRate, collaborations }],
    recentActivity: [{ id, title, description, timestamp, status, type }]
  }
}
```

---

## Critical Issues Summary

### High Priority
1. **Query A**: Goal achievement is hardcoded to 75% - should calculate from actual KPI performance
2. **Query A**: Trend is random - should compare with historical data
3. **Query B**: All trends are random - should compare with previous period
4. **Query C**: Spent calculation sums all KPI values regardless of metric type - flawed logic
5. **Query D**: Progress is hardcoded to 75% - should calculate from actual performance

### Medium Priority
1. **Query A**: No error handling for users with no campaigns
2. **Query B**: No validation of KPI metric values
3. **Query D**: Uses first KPI value as target without validation
4. **Query E**: PostAnalytics dependency - shows 0 if analytics don't exist
5. **Query F**: No sorting or limiting of influencers

### Low Priority
1. **Query E**: Limited to top 5 channels
2. **Query F**: No filtering by collaboration status
3. **Query G**: Limited to 10 notifications
4. **Query G**: Incomplete type mapping for notifications

---

## Recommendations

### Immediate Fixes
1. Replace hardcoded 75% values with actual calculations
2. Replace random trends with historical comparisons
3. Fix Query C spent calculation to use actual spend data
4. Add error handling for edge cases (no campaigns, no KPIs, etc.)

### Future Improvements
1. Add caching for dashboard data to improve performance
2. Add date range filtering for historical comparisons
3. Add more granular KPI tracking
4. Implement real-time analytics fetching from social platforms
5. Add pagination for large datasets (influencers, notifications)
