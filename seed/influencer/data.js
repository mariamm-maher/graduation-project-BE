const influencerAccounts = [
  {
    user: { firstName: 'Ava', lastName: 'Morgan', email: 'influencer01@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Tech and productivity creator sharing practical workflows.',
      image: 'https://images.example.com/influencers/ava-morgan.jpg',
      location: 'San Francisco, US',
      socialMediaLinks: {
        instagram: 'https://instagram.com/avamorgan01',
        tiktok: 'https://tiktok.com/@avamorgan01',
        youtube: 'https://youtube.com/@avamorgan01'
      },
      primaryPlatform: 'YouTube',
      followersCount: '185000',
      engagementRate: '6.4',
      categories: ['Technology', 'Productivity'],
      contentTypes: ['video', 'reel', 'post'],
      collaborationTypes: ['sponsored_post', 'product_review', 'affiliate'],
      audienceAgeRange: '18-34',
      audienceGender: 'all',
      audienceLocation: 'US, Canada, UK',
      interests: ['apps', 'gadgets', 'career'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Liam', lastName: 'Reed', email: 'influencer02@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Fitness coach focused on realistic training plans.',
      image: 'https://images.example.com/influencers/liam-reed.jpg',
      location: 'Austin, US',
      socialMediaLinks: {
        instagram: 'https://instagram.com/liamreedfit02',
        tiktok: 'https://tiktok.com/@liamreedfit02',
        youtube: 'https://youtube.com/@liamreedfit02'
      },
      primaryPlatform: 'Instagram',
      followersCount: '132000',
      engagementRate: '5.8',
      categories: ['Fitness', 'Health'],
      contentTypes: ['reel', 'story', 'post'],
      collaborationTypes: ['sponsored_post', 'brand_ambassador'],
      audienceAgeRange: '18-30',
      audienceGender: 'all',
      audienceLocation: 'US',
      interests: ['workouts', 'nutrition', 'wellness'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Mia', lastName: 'Santos', email: 'influencer03@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Beauty educator with simple tutorials and reviews.',
      image: 'https://images.example.com/influencers/mia-santos.jpg',
      location: 'Los Angeles, US',
      socialMediaLinks: {
        instagram: 'https://instagram.com/miasantos03',
        tiktok: 'https://tiktok.com/@miasantos03',
        youtube: 'https://youtube.com/@miasantos03'
      },
      primaryPlatform: 'TikTok',
      followersCount: '248000',
      engagementRate: '7.1',
      categories: ['Beauty', 'Lifestyle'],
      contentTypes: ['video', 'reel', 'live'],
      collaborationTypes: ['product_review', 'tutorial', 'sponsored_post'],
      audienceAgeRange: '18-29',
      audienceGender: 'female',
      audienceLocation: 'US, Mexico',
      interests: ['makeup', 'skincare', 'fashion'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Noah', lastName: 'Bennett', email: 'influencer04@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Outdoor filmmaker and travel storyteller.',
      image: 'https://images.example.com/influencers/noah-bennett.jpg',
      location: 'Vancouver, CA',
      socialMediaLinks: {
        instagram: 'https://instagram.com/noahbennett04',
        tiktok: 'https://tiktok.com/@noahbennett04',
        youtube: 'https://youtube.com/@noahbennett04'
      },
      primaryPlatform: 'YouTube',
      followersCount: '176500',
      engagementRate: '6.0',
      categories: ['Travel', 'Lifestyle'],
      contentTypes: ['video', 'post', 'story'],
      collaborationTypes: ['destination_campaign', 'sponsored_post'],
      audienceAgeRange: '20-38',
      audienceGender: 'all',
      audienceLocation: 'Canada, US, Europe',
      interests: ['travel', 'nature', 'photography'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Emma', lastName: 'Khan', email: 'influencer05@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Food creator sharing quick recipes and reviews.',
      image: 'https://images.example.com/influencers/emma-khan.jpg',
      location: 'Dubai, UAE',
      socialMediaLinks: {
        instagram: 'https://instagram.com/emmakhan05',
        tiktok: 'https://tiktok.com/@emmakhan05',
        youtube: 'https://youtube.com/@emmakhan05'
      },
      primaryPlatform: 'Instagram',
      followersCount: '98000',
      engagementRate: '5.2',
      categories: ['Food', 'Lifestyle'],
      contentTypes: ['reel', 'story', 'post'],
      collaborationTypes: ['restaurant_review', 'sponsored_post'],
      audienceAgeRange: '18-35',
      audienceGender: 'all',
      audienceLocation: 'GCC region',
      interests: ['recipes', 'cafes', 'travel'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Oliver', lastName: 'Price', email: 'influencer06@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Gaming streamer and esports commentator.',
      image: 'https://images.example.com/influencers/oliver-price.jpg',
      location: 'Manchester, UK',
      socialMediaLinks: {
        instagram: 'https://instagram.com/oliverprice06',
        tiktok: 'https://tiktok.com/@oliverprice06',
        youtube: 'https://youtube.com/@oliverprice06'
      },
      primaryPlatform: 'YouTube',
      followersCount: '301000',
      engagementRate: '8.3',
      categories: ['Gaming', 'Technology'],
      contentTypes: ['live', 'video', 'short'],
      collaborationTypes: ['sponsored_stream', 'product_review'],
      audienceAgeRange: '16-30',
      audienceGender: 'male',
      audienceLocation: 'UK, Europe',
      interests: ['esports', 'pc build', 'streaming'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Sophia', lastName: 'Nouri', email: 'influencer07@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Modest fashion and styling creator.',
      image: 'https://images.example.com/influencers/sophia-nouri.jpg',
      location: 'Amman, JO',
      socialMediaLinks: {
        instagram: 'https://instagram.com/sophianouri07',
        tiktok: 'https://tiktok.com/@sophianouri07',
        youtube: 'https://youtube.com/@sophianouri07'
      },
      primaryPlatform: 'Instagram',
      followersCount: '143000',
      engagementRate: '6.9',
      categories: ['Fashion', 'Lifestyle'],
      contentTypes: ['reel', 'post', 'story'],
      collaborationTypes: ['sponsored_post', 'lookbook'],
      audienceAgeRange: '18-34',
      audienceGender: 'female',
      audienceLocation: 'MENA',
      interests: ['style', 'beauty', 'shopping'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Ethan', lastName: 'Flores', email: 'influencer08@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Personal finance educator for young professionals.',
      image: 'https://images.example.com/influencers/ethan-flores.jpg',
      location: 'Chicago, US',
      socialMediaLinks: {
        instagram: 'https://instagram.com/ethanflores08',
        tiktok: 'https://tiktok.com/@ethanflores08',
        youtube: 'https://youtube.com/@ethanflores08'
      },
      primaryPlatform: 'TikTok',
      followersCount: '211000',
      engagementRate: '7.7',
      categories: ['Business', 'Education'],
      contentTypes: ['video', 'carousel', 'post'],
      collaborationTypes: ['sponsored_post', 'webinar', 'affiliate'],
      audienceAgeRange: '20-40',
      audienceGender: 'all',
      audienceLocation: 'US',
      interests: ['investing', 'budgeting', 'career'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Isabella', lastName: 'Chen', email: 'influencer09@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Home decor and DIY creator.',
      image: 'https://images.example.com/influencers/isabella-chen.jpg',
      location: 'Seattle, US',
      socialMediaLinks: {
        instagram: 'https://instagram.com/isabellachen09',
        tiktok: 'https://tiktok.com/@isabellachen09',
        youtube: 'https://youtube.com/@isabellachen09'
      },
      primaryPlatform: 'Instagram',
      followersCount: '119000',
      engagementRate: '5.6',
      categories: ['Lifestyle', 'Home'],
      contentTypes: ['reel', 'post', 'story'],
      collaborationTypes: ['sponsored_post', 'product_review'],
      audienceAgeRange: '24-44',
      audienceGender: 'female',
      audienceLocation: 'US, Canada',
      interests: ['decor', 'organization', 'diy'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'James', lastName: 'Haddad', email: 'influencer10@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Automotive reviewer and road-trip creator.',
      image: 'https://images.example.com/influencers/james-haddad.jpg',
      location: 'Riyadh, SA',
      socialMediaLinks: {
        instagram: 'https://instagram.com/jameshaddad10',
        tiktok: 'https://tiktok.com/@jameshaddad10',
        youtube: 'https://youtube.com/@jameshaddad10'
      },
      primaryPlatform: 'YouTube',
      followersCount: '264000',
      engagementRate: '6.7',
      categories: ['Automotive', 'Technology'],
      contentTypes: ['video', 'short', 'story'],
      collaborationTypes: ['product_review', 'test_drive_campaign'],
      audienceAgeRange: '18-39',
      audienceGender: 'male',
      audienceLocation: 'GCC region',
      interests: ['cars', 'travel', 'gadgets'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Charlotte', lastName: 'Ibrahim', email: 'influencer11@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Parenting and family lifestyle storyteller.',
      image: 'https://images.example.com/influencers/charlotte-ibrahim.jpg',
      location: 'Doha, QA',
      socialMediaLinks: {
        instagram: 'https://instagram.com/charlotteibrahim11',
        tiktok: 'https://tiktok.com/@charlotteibrahim11',
        youtube: 'https://youtube.com/@charlotteibrahim11'
      },
      primaryPlatform: 'Instagram',
      followersCount: '87000',
      engagementRate: '4.8',
      categories: ['Parenting', 'Lifestyle'],
      contentTypes: ['post', 'story', 'reel'],
      collaborationTypes: ['sponsored_post', 'brand_ambassador'],
      audienceAgeRange: '25-44',
      audienceGender: 'female',
      audienceLocation: 'MENA',
      interests: ['family', 'education', 'wellness'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Henry', lastName: 'Walker', email: 'influencer12@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Street photography and camera gear creator.',
      image: 'https://images.example.com/influencers/henry-walker.jpg',
      location: 'Melbourne, AU',
      socialMediaLinks: {
        instagram: 'https://instagram.com/henrywalker12',
        tiktok: 'https://tiktok.com/@henrywalker12',
        youtube: 'https://youtube.com/@henrywalker12'
      },
      primaryPlatform: 'Instagram',
      followersCount: '154000',
      engagementRate: '6.2',
      categories: ['Photography', 'Travel'],
      contentTypes: ['post', 'reel', 'video'],
      collaborationTypes: ['sponsored_post', 'product_review'],
      audienceAgeRange: '18-35',
      audienceGender: 'all',
      audienceLocation: 'Australia, Asia',
      interests: ['cameras', 'editing', 'travel'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Amelia', lastName: 'Yousef', email: 'influencer13@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Wellness creator focused on mental health habits.',
      image: 'https://images.example.com/influencers/amelia-yousef.jpg',
      location: 'Abu Dhabi, UAE',
      socialMediaLinks: {
        instagram: 'https://instagram.com/ameliayousef13',
        tiktok: 'https://tiktok.com/@ameliayousef13',
        youtube: 'https://youtube.com/@ameliayousef13'
      },
      primaryPlatform: 'TikTok',
      followersCount: '126000',
      engagementRate: '6.5',
      categories: ['Health', 'Lifestyle'],
      contentTypes: ['video', 'story', 'post'],
      collaborationTypes: ['sponsored_post', 'affiliate'],
      audienceAgeRange: '18-34',
      audienceGender: 'all',
      audienceLocation: 'MENA',
      interests: ['mindfulness', 'sleep', 'nutrition'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Lucas', lastName: 'Grant', email: 'influencer14@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Music producer sharing tutorials and studio setups.',
      image: 'https://images.example.com/influencers/lucas-grant.jpg',
      location: 'Toronto, CA',
      socialMediaLinks: {
        instagram: 'https://instagram.com/lucasgrant14',
        tiktok: 'https://tiktok.com/@lucasgrant14',
        youtube: 'https://youtube.com/@lucasgrant14'
      },
      primaryPlatform: 'YouTube',
      followersCount: '207000',
      engagementRate: '7.3',
      categories: ['Music', 'Education'],
      contentTypes: ['video', 'short', 'live'],
      collaborationTypes: ['product_review', 'sponsored_post'],
      audienceAgeRange: '17-33',
      audienceGender: 'all',
      audienceLocation: 'North America',
      interests: ['music production', 'audio gear', 'creativity'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Harper', lastName: 'Salim', email: 'influencer15@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Booktok creator and reading community host.',
      image: 'https://images.example.com/influencers/harper-salim.jpg',
      location: 'Cairo, EG',
      socialMediaLinks: {
        instagram: 'https://instagram.com/harpersalim15',
        tiktok: 'https://tiktok.com/@harpersalim15',
        youtube: 'https://youtube.com/@harpersalim15'
      },
      primaryPlatform: 'TikTok',
      followersCount: '94000',
      engagementRate: '5.9',
      categories: ['Education', 'Lifestyle'],
      contentTypes: ['video', 'post', 'story'],
      collaborationTypes: ['sponsored_post', 'affiliate'],
      audienceAgeRange: '16-30',
      audienceGender: 'female',
      audienceLocation: 'MENA, Europe',
      interests: ['books', 'writing', 'culture'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Benjamin', lastName: 'Costa', email: 'influencer16@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Chef and kitchen hacks content creator.',
      image: 'https://images.example.com/influencers/benjamin-costa.jpg',
      location: 'Lisbon, PT',
      socialMediaLinks: {
        instagram: 'https://instagram.com/benjamincosta16',
        tiktok: 'https://tiktok.com/@benjamincosta16',
        youtube: 'https://youtube.com/@benjamincosta16'
      },
      primaryPlatform: 'Instagram',
      followersCount: '136000',
      engagementRate: '6.1',
      categories: ['Food', 'Education'],
      contentTypes: ['reel', 'video', 'story'],
      collaborationTypes: ['sponsored_post', 'product_review'],
      audienceAgeRange: '20-40',
      audienceGender: 'all',
      audienceLocation: 'Europe',
      interests: ['recipes', 'nutrition', 'kitchen'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Evelyn', lastName: 'Patel', email: 'influencer17@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Sustainable living and zero-waste creator.',
      image: 'https://images.example.com/influencers/evelyn-patel.jpg',
      location: 'Berlin, DE',
      socialMediaLinks: {
        instagram: 'https://instagram.com/evelynpatel17',
        tiktok: 'https://tiktok.com/@evelynpatel17',
        youtube: 'https://youtube.com/@evelynpatel17'
      },
      primaryPlatform: 'Instagram',
      followersCount: '112000',
      engagementRate: '5.5',
      categories: ['Sustainability', 'Lifestyle'],
      contentTypes: ['post', 'reel', 'story'],
      collaborationTypes: ['brand_ambassador', 'sponsored_post'],
      audienceAgeRange: '20-39',
      audienceGender: 'all',
      audienceLocation: 'Europe, US',
      interests: ['eco living', 'home', 'shopping'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Daniel', lastName: 'Farouk', email: 'influencer18@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Business and startup storyteller for founders.',
      image: 'https://images.example.com/influencers/daniel-farouk.jpg',
      location: 'Singapore, SG',
      socialMediaLinks: {
        instagram: 'https://instagram.com/danielfarouk18',
        tiktok: 'https://tiktok.com/@danielfarouk18',
        youtube: 'https://youtube.com/@danielfarouk18'
      },
      primaryPlatform: 'LinkedIn',
      followersCount: '173000',
      engagementRate: '6.6',
      categories: ['Business', 'Technology'],
      contentTypes: ['post', 'video', 'live'],
      collaborationTypes: ['webinar', 'sponsored_post', 'affiliate'],
      audienceAgeRange: '22-45',
      audienceGender: 'all',
      audienceLocation: 'Asia, MENA',
      interests: ['startups', 'leadership', 'product'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  }
];

// Extra influencer entries for extended testing
influencerAccounts.push(
  {
    user: { firstName: 'Zara', lastName: 'Omar', email: 'influencer19@example.com', password: 'password123', status: 'SUSPENDED' },
    profile: {
      bio: 'Lifestyle content creator currently on hiatus.',
      image: 'https://images.example.com/influencers/zara-omar.jpg',
      location: 'Cairo, EG',
      socialMediaLinks: {
        instagram: 'https://instagram.com/zaraomar19'
      },
      primaryPlatform: 'Instagram',
      followersCount: '42000',
      engagementRate: '3.2',
      categories: ['Lifestyle'],
      contentTypes: ['post', 'story'],
      collaborationTypes: ['sponsored_post'],
      audienceAgeRange: '20-35',
      audienceGender: 'female',
      audienceLocation: 'EG',
      interests: ['family', 'home'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  },
  {
    user: { firstName: 'Marco', lastName: 'Rossi', email: 'influencer20@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Micro-influencer focused on niche woodworking tutorials.',
      image: 'https://images.example.com/influencers/marco-rossi.jpg',
      location: 'Naples, IT',
      socialMediaLinks: {},
      primaryPlatform: 'YouTube',
      followersCount: '4200',
      engagementRate: '9.8',
      categories: ['Crafts', 'DIY'],
      contentTypes: ['video'],
      collaborationTypes: ['product_review', 'tutorial'],
      audienceAgeRange: '25-55',
      audienceGender: 'male',
      audienceLocation: 'Europe',
      interests: ['woodworking', 'tools'],
      completionPercentage: 80,
      isOnboarded: true,
      isCompleted: false
    }
  },
  {
    user: { firstName: 'Nadia', lastName: 'Rahman', email: 'influencer21@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Emerging fashion stylist building a portfolio.',
      image: 'https://images.example.com/influencers/nadia-rahman.jpg',
      location: 'Amman, JO',
      socialMediaLinks: {
        instagram: 'https://instagram.com/nadiarahman21',
        tiktok: 'https://tiktok.com/@nadiarahman21'
      },
      primaryPlatform: 'TikTok',
      followersCount: '15000',
      engagementRate: '7.0',
      categories: ['Fashion'],
      contentTypes: ['reel', 'post'],
      collaborationTypes: ['sponsored_post'],
      audienceAgeRange: '18-30',
      audienceGender: 'female',
      audienceLocation: 'MENA',
      interests: ['style', 'sustainable fashion'],
      completionPercentage: 45,
      isOnboarded: false,
      isCompleted: false
    }
  },
  {
    user: { firstName: 'Victor', lastName: 'Ng', email: 'influencer22@example.com', password: 'password123', status: 'ACTIVE' },
    profile: {
      bio: 'Tech journalist and long-form reviewer.',
      image: 'https://images.example.com/influencers/victor-ng.jpg',
      location: 'Singapore, SG',
      socialMediaLinks: {
        twitter: 'https://twitter.com/victorng22',
        youtube: 'https://youtube.com/@victorng22'
      },
      primaryPlatform: 'YouTube',
      followersCount: '950000',
      engagementRate: '4.1',
      categories: ['Technology', 'Review'],
      contentTypes: ['video', 'article'],
      collaborationTypes: ['sponsored_post', 'webinar'],
      audienceAgeRange: '20-45',
      audienceGender: 'all',
      audienceLocation: 'Global',
      interests: ['gadgets', 'reviews'],
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true
    }
  }
);

module.exports = influencerAccounts;
