/**
 * Brand Factory
 * 
 * Generates realistic Brand seed data.
 */

const { pick, pickMultiple, generateBrandName, generateCompanyName } = require('../data/names');
const { INDUSTRIES, BRAND_VALUES, COMPANY_SIZES, LOCATIONS } = require('../data/constants');

class BrandFactory {
  constructor() {
    this.usedSlugs = new Set();
    this.usedNames = new Set();
  }

  /**
   * Generate a slug from brand name
   * @param {string} name 
   * @returns {string}
   */
  generateSlug(name) {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    let slug = baseSlug;
    let counter = 1;

    while (this.usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.usedSlugs.add(slug);
    return slug;
  }

  /**
   * Generate a Brand
   * @param {number} ownerId 
   * @param {object} options
   * @returns {object}
   */
  generateBrand(ownerId, options = {}) {
    const name = options.name || this.generateUniqueBrandName();
    const industry = options.industry || pick(INDUSTRIES);
    const segment = industry.split(' & ')[0];

    const brand = {
      ownerId,
      name,
      segment,
      slug: this.generateSlug(name),
      mission: this.generateMission(name, industry),
      vision: this.generateVision(name),
      values: pickMultiple(BRAND_VALUES, 4),
      targetAudience: this.generateTargetAudience(),
      productsAndServices: this.generateProducts(industry),
      isActive: options.isActive !== undefined ? options.isActive : true
    };

    return brand;
  }

  /**
   * Generate a unique brand name
   * @returns {string}
   */
  generateUniqueBrandName() {
    for (let attempts = 0; attempts < 50; attempts++) {
      const name = generateBrandName();
      if (!this.usedNames.has(name)) {
        this.usedNames.add(name);
        return name;
      }
    }
    // Fallback with timestamp
    return `Brand-${Date.now()}`;
  }

  /**
   * Generate brand mission
   * @param {string} name 
   * @param {string} industry 
   * @returns {string}
   */
  generateMission(name, industry) {
    const templates = [
      `At ${name}, we are on a mission to revolutionize ${industry.toLowerCase()} by putting our customers first and delivering exceptional value every single day.`,
      `${name} exists to make ${industry.toLowerCase()} accessible, affordable, and outstanding for everyone. We believe quality should never be compromised.`,
      `Our mission is simple: to be the most trusted name in ${industry.toLowerCase()}. We achieve this through innovation, integrity, and an unwavering commitment to excellence.`,
      `At ${name}, we are building a future where ${industry.toLowerCase()} empowers rather than complicates. Every product we create serves this purpose.`,
      `We started ${name} with one goal: to solve real problems in ${industry.toLowerCase()}. Today, that mission drives everything we do.`
    ];
    return pick(templates);
  }

  /**
   * Generate brand vision
   * @param {string} name 
   * @returns {string}
   */
  generateVision(name) {
    const templates = [
      `To become the global leader in our industry, recognized for innovation, quality, and positive impact on communities worldwide.`,
      `We envision a world where our products are synonymous with excellence and trust, reaching millions of satisfied customers across the globe.`,
      `By 2030, ${name} aims to be the most sustainable and customer-loved brand in our category, setting new standards for the industry.`,
      `Our vision is to transform how people experience our category, making it more accessible, enjoyable, and meaningful for generations to come.`,
      `We see a future where ${name} is not just a brand, but a movement that inspires positive change in how people live and work.`
    ];
    return pick(templates);
  }

  /**
   * Generate target audience
   * @returns {object}
   */
  generateTargetAudience() {
    const location = pick(LOCATIONS);
    return {
      ageRange: pick(['18-35', '25-45', '30-50', '35-55']),
      gender: pick(['All', 'Female', 'Male', 'All']),
      interests: pickMultiple(['quality', 'innovation', 'value', 'sustainability', 'convenience'], 3),
      location: location.region,
      incomeLevel: pick(['Entry', 'Middle', 'Upper-Middle', 'High'])
    };
  }

  /**
   * Generate products and services
   * @param {string} industry 
   * @returns {Array}
   */
  generateProducts(industry) {
    const productTemplates = {
      'Technology & Apps': [
        { name: 'Mobile App Pro', category: 'Software', description: 'Advanced productivity application' },
        { name: 'Cloud Sync', category: 'Service', description: 'Data synchronization service' },
        { name: 'Analytics Dashboard', category: 'Software', description: 'Business intelligence platform' }
      ],
      'Health & Fitness': [
        { name: 'Protein Plus', category: 'Supplement', description: 'Premium protein powder' },
        { name: 'Fitness Tracker', category: 'Device', description: 'Wearable activity monitor' },
        { name: 'Online Coaching', category: 'Service', description: 'Personal training programs' }
      ],
      'Beauty & Cosmetics': [
        { name: 'Glow Serum', category: 'Skincare', description: 'Hydrating facial serum' },
        { name: 'Color Palette', category: 'Makeup', description: 'Professional eyeshadow set' },
        { name: 'Care Collection', category: 'Haircare', description: 'Complete hair treatment line' }
      ],
      'Fashion & Apparel': [
        { name: 'Essential Tee', category: 'Clothing', description: 'Premium cotton t-shirt' },
        { name: 'Urban Jacket', category: 'Outerwear', description: 'All-weather city jacket' },
        { name: 'Classic Denim', category: 'Clothing', description: 'Sustainable jeans collection' }
      ],
      'Food & Beverage': [
        { name: 'Artisan Blend', category: 'Coffee', description: 'Small-batch roasted beans' },
        { name: 'Organic Snacks', category: 'Food', description: 'Healthy on-the-go options' },
        { name: 'Craft Soda', category: 'Beverage', description: 'Natural ingredient soft drinks' }
      ]
    };

    const defaults = [
      { name: 'Premium Product', category: 'Main', description: 'Flagship offering' },
      { name: 'Essential Service', category: 'Service', description: 'Core business service' },
      { name: 'Special Edition', category: 'Limited', description: 'Exclusive release' }
    ];

    return productTemplates[industry] || defaults;
  }

  /**
   * Generate multiple brands for an owner
   * @param {number} ownerId 
   * @param {number} count 
   * @returns {Array}
   */
  generateBrandsForOwner(ownerId, count = 2) {
    const brands = [];
    for (let i = 0; i < count; i++) {
      brands.push(this.generateBrand(ownerId));
    }
    return brands;
  }

  /**
   * Generate brands for multiple owners
   * @param {Array} owners 
   * @returns {Array}
   */
  generateBrandsForOwners(owners) {
    const allBrands = [];
    for (const owner of owners) {
      // 1-3 brands per owner
      const count = Math.floor(Math.random() * 3) + 1;
      const brands = this.generateBrandsForOwner(owner.id, count);
      allBrands.push(...brands);
    }
    return allBrands;
  }
}

module.exports = new BrandFactory();
