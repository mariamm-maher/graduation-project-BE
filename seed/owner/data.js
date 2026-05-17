// ./owner/data.js
module.exports = [
  {
    user: {
      firstName: 'Tarek',
      lastName: 'Mansour',
      email: 'technochill353@gmail.com',
      password: '$2b$12$OnAzIGgT23cDgLZn7Up0j.gjgNzVioes4Cg7fE5swbWeBn/vRz0jO',
      googleId: null,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    profile: {
      brand_name: 'Saasify Automation',
      unique_selling_point: 'Automate your customer support workflows effortlessly with production-ready AI agents.',
      product_or_service: 'B2B AI Software-as-a-Service Platform',
      company_size: '11-50', // Matches common custom enum styles
      target_market: ['Small Business Owners', 'Support Managers', 'Tech Startups'],
      competitors: JSON.stringify([{ name: 'Zendesk' }, { name: 'Intercom' }]),
      has_previous_campaigns: true,
      previous_campaign_description: 'Ran LinkedIn programmatic ads targeting operations heads with moderate conversion success.',
      industry: 'Software & Technology',
      website: 'https://saasify.co',
      platforms: ['linkedin', 'twitter', 'instagram'],
      targetAudience: JSON.stringify({ age: '25-45', demographics: 'Tech professionals', locations: ['US', 'EG', 'UAE'] }),
      image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623',
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
[
  {
    user: {
      firstName: 'Nour',
      lastName: 'Farid',
      email: 'technochill353@gmail.com',
      password: '$2b$12$OnAzIGgT23cDgLZn7Up0j.gjgNzVioes4Cg7fE5swbWeBn/vRz0jO',
      googleId: null,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    profile: {
      brand_name: 'UrbanThread Egypt',
      unique_selling_point: 'Premium streetwear made exclusively from 100% locally sourced Egyptian cotton.',
      product_or_service: 'E-commerce Apparel Brand',
      company_size: '1-10',
      target_market: ['Gen-Z Trends', 'College Students', 'Streetwear Enthusiasts'],
      competitors: JSON.stringify([{ name: 'Invenio' }, { name: 'Raw' }]),
      has_previous_campaigns: false,
      previous_campaign_description: null,
      industry: 'Fashion & Retail',
      website: 'https://urbanthread.eg',
      platforms: ['instagram', 'tiktok'],
      targetAudience: JSON.stringify({ age: '16-26', interest: 'Streetwear culture', location: ['Cairo', 'Alexandria'] }),
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
      completionPercentage: 100,
      isOnboarded: true,
      isCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
]
];