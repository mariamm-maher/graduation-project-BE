const ownerAccounts = [
  {
    user: { firstName: 'Alice', lastName: 'Johnson', email: 'owner01@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      brand_name: 'Tech Haven',
      unique_selling_point: 'Affordable smart home gadgets with seamless integration.',
      product_or_service: 'Smart Home Devices',
      company_size: 'Small',
      target_market: ['US', 'Canada'],
      competitors: ['Nest', 'Ring', 'Wyze'],
      has_previous_campaigns: true,
      previous_campaign_description: 'Worked with 5 micro-influencers for our summer launch.',
      industry: 'Technology',
      website: 'https://techhaven.example.com',
      platforms: ['Instagram', 'Facebook', 'YouTube'],
      targetAudience: { ageRange: '25-45', gender: 'all', location: 'North America' },
      image: 'https://images.example.com/brands/techhaven.jpg',
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  // {
  //   user: { firstName: 'Bob', lastName: 'Smith', email: 'owner02@example.com', password: 'password123', status: 'ACTIVE' },
  //   profile: {
  //     brand_name: 'Fitness Fuel',
  //     unique_selling_point: 'Organic, plant-based pre-workout supplements.',
  //     product_or_service: 'Protein Powders and Supplements',
  //     company_size: 'Mid',
  //     target_market: ['UK', 'Europe'],
  //     competitors: ['MyProtein', 'Optimum Nutrition'],
  //     has_previous_campaigns: true,
  //     previous_campaign_description: 'Ongoing ambassadorship program with fitness influencers.',
  //     industry: 'Health & Fitness',
  //     website: 'https://fitnessfuel.example.com',
  //     platforms: ['Instagram', 'TikTok'],
  //     targetAudience: { ageRange: '18-35', gender: 'all', location: 'Europe' },
  //     image: 'https://images.example.com/brands/fitnessfuel.jpg',
  //     completionPercentage: 100,
  //     isOnboarded: true,
  //     isCompleted: true
  //   }
  // },
  // {
  //   user: { firstName: 'Catherine', lastName: 'Lee', email: 'owner03@example.com', password: 'password123', status: 'ACTIVE' },
  //   profile: {
  //     brand_name: 'Glow Cosmetics',
  //     unique_selling_point: 'Cruelty-free skincare tailored for sensitive skin.',
  //     product_or_service: 'Skincare products',
  //     company_size: 'Small',
  //     target_market: ['US', 'Australia'],
  //     competitors: ['Glossier', 'The Ordinary'],
  //     has_previous_campaigns: false,
  //     previous_campaign_description: '',
  //     industry: 'Beauty',
  //     website: 'https://glowcosmetics.example.com',
  //     platforms: ['Instagram', 'TikTok', 'Pinterest'],
  //     targetAudience: { ageRange: '16-30', gender: 'female', location: 'Global' },
  //     image: 'https://images.example.com/brands/glowcosmetics.jpg',
  //     completionPercentage: 100,
  //     isOnboarded: true,
  //     isCompleted: true
  //   }
  // },
  // {
  //   user: { firstName: 'David', lastName: 'Martinez', email: 'owner04@example.com', password: 'password123', status: 'ACTIVE' },
  //   profile: {
  //     brand_name: 'Urban Threads',
  //     unique_selling_point: 'Sustainable streetwear made from recycled materials.',
  //     product_or_service: 'Clothing & Apparel',
  //     company_size: 'Mid',
  //     target_market: ['US', 'UK', 'Germany'],
  //     competitors: ['Supreme', 'Patagonia'],
  //     has_previous_campaigns: true,
  //     previous_campaign_description: 'Collaborated with streetwear vloggers for limited drops.',
  //     industry: 'Fashion',
  //     website: 'https://urbanthreads.example.com',
  //     platforms: ['Instagram', 'Twitter'],
  //     targetAudience: { ageRange: '18-28', gender: 'all', location: 'Urban Centers' },
  //     image: 'https://images.example.com/brands/urbanthreads.jpg',
  //     completionPercentage: 100,
  //     isOnboarded: true,
  //     isCompleted: true
  //   }
  // },
  // {
  //   user: { firstName: 'Elena', lastName: 'Russo', email: 'owner05@example.com', password: 'password123', status: 'ACTIVE' },
  //   profile: {
  //     brand_name: 'Gourmet Bites',
  //     unique_selling_point: 'Artisanal snack boxes delivered monthly.',
  //     product_or_service: 'Snack Subscription Box',
  //     company_size: 'Solo',
  //     target_market: ['US'],
  //     competitors: ['SnackCrate', 'Universal Yums'],
  //     has_previous_campaigns: true,
  //     previous_campaign_description: 'Sent PR boxes to food reviewers on TikTok.',
  //     industry: 'Food & Beverage',
  //     website: 'https://gourmetbites.example.com',
  //     platforms: ['Instagram', 'TikTok', 'Facebook'],
  //     targetAudience: { ageRange: '20-50', gender: 'all', location: 'US' },
  //     image: 'https://images.example.com/brands/gourmetbites.jpg',
  //     completionPercentage: 100,
  //     isOnboarded: true,
  //     isCompleted: true
  //   }
  // },
  // {
  //   user: { firstName: 'Frank', lastName: 'Castle', email: 'owner06@example.com', password: 'password123', status: 'ACTIVE' },
  //   profile: {
  //     brand_name: 'Zenith Watches',
  //     unique_selling_point: 'Minimalist watches built with premium Swiss movement.',
  //     product_or_service: 'Luxury Watches',
  //     company_size: 'Enterprise',
  //     target_market: ['Global'],
  //     competitors: ['Daniel Wellington', 'MVMT'],
  //     has_previous_campaigns: true,
  //     previous_campaign_description: 'Wide scale influencer affiliate program spanning multiple years.',
  //     industry: 'Accessories',
  //     website: 'https://zenithwatches.example.com',
  //     platforms: ['Instagram', 'Facebook', 'YouTube'],
  //     targetAudience: { ageRange: '25-55', gender: 'male', location: 'Global' },
  //     image: 'https://images.example.com/brands/zenithwatches.jpg',
  //     completionPercentage: 100,
  //     isOnboarded: true,
  //     isCompleted: true
  //   }
  // },
  // {
  //   user: { firstName: 'Grace', lastName: 'Kim', email: 'owner07@example.com', password: 'password123', status: 'ACTIVE' },
  //   profile: {
  //     brand_name: 'Pawfect Toys',
  //     unique_selling_point: 'Durable, non-toxic toys for aggressive chewers.',
  //     product_or_service: 'Pet Accessories',
  //     company_size: 'Small',
  //     target_market: ['US', 'Canada'],
  //     competitors: ['BarkBox', 'KONG'],
  //     has_previous_campaigns: false,
  //     previous_campaign_description: '',
  //     industry: 'Pets',
  //     website: 'https://pawfecttoys.example.com',
  //     platforms: ['Instagram', 'TikTok'],
  //     targetAudience: { ageRange: '20-60', gender: 'all', location: 'North America' },
  //     image: 'https://images.example.com/brands/pawfecttoys.jpg',
  //     completionPercentage: 100,
  //     isOnboarded: true,
  //     isCompleted: true
  //   }
  // },
  // {
  //   user: { firstName: 'Henry', lastName: 'Ford', email: 'owner08@example.com', password: 'password123', status: 'ACTIVE' },
  //   profile: {
  //     brand_name: 'Nomad Gear',
  //     unique_selling_point: 'Ultra-lightweight travel backpacks for digital nomads.',
  //     product_or_service: 'Travel Bags',
  //     company_size: 'Mid',
  //     target_market: ['Global'],
  //     competitors: ['Nomatic', 'Peak Design'],
  //     has_previous_campaigns: true,
  //     previous_campaign_description: 'Sponsored multiple travel vloggers on YouTube.',
  //     industry: 'Travel',
  //     website: 'https://nomadgear.example.com',
  //     platforms: ['YouTube', 'Instagram'],
  //     targetAudience: { ageRange: '22-40', gender: 'all', location: 'Global' },
  //     image: 'https://images.example.com/brands/nomadgear.jpg',
  //     completionPercentage: 100,
  //     isOnboarded: true,
  //     isCompleted: true
  //   }
  // },
  // {
  //   user: { firstName: 'Isabella', lastName: 'Swan', email: 'owner09@example.com', password: 'password123', status: 'ACTIVE' },
  //   profile: {
  //     brand_name: 'EcoClean',
  //     unique_selling_point: 'Zero-waste household cleaning products.',
  //     product_or_service: 'Cleaning Supplies',
  //     company_size: 'Small',
  //     target_market: ['US'],
  //     competitors: ['Blueland', 'Grove Collaborative'],
  //     has_previous_campaigns: true,
  //     previous_campaign_description: 'Instagram reels campaigns with eco-conscious creators.',
  //     industry: 'Home & Lifestyle',
  //     website: 'https://ecoclean.example.com',
  //     platforms: ['Instagram', 'Pinterest', 'TikTok'],
  //     targetAudience: { ageRange: '25-50', gender: 'all', location: 'US' },
  //     image: 'https://images.example.com/brands/ecoclean.jpg',
  //     completionPercentage: 100,
  //     isOnboarded: true,
  //     isCompleted: true
  //   }
  // },
  // {
  //   user: { firstName: 'Jack', lastName: 'Dawson', email: 'owner10@example.com', password: 'password123', status: 'ACTIVE' },
  //   profile: {
  //     brand_name: 'LevelUp Gaming',
  //     unique_selling_point: 'Ergonomic gaming chairs with advanced cooling.',
  //     product_or_service: 'Gaming Furniture',
  //     company_size: 'Mid',
  //     target_market: ['US', 'Europe', 'Asia'],
  //     competitors: ['Secretlab', 'DXRacer'],
  //     has_previous_campaigns: true,
  //     previous_campaign_description: 'Twitch streamer sponsorships and hardware giveaways.',
  //     industry: 'Gaming',
  //     website: 'https://levelupgaming.example.com',
  //     platforms: ['Twitch', 'YouTube', 'Twitter'],
  //     targetAudience: { ageRange: '15-35', gender: 'all', location: 'Global' },
  //     image: 'https://images.example.com/brands/levelupgaming.jpg',
  //     completionPercentage: 100,
  //     isOnboarded: true,
  //     isCompleted: true
  //   }
  // }
];

module.exports = ownerAccounts;