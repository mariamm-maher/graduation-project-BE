const { Role } = require('../models');

const seedRoles = async () => {
  try {
    // Check if roles already exist
    const existingRoles = await Role.count();
    
    if (existingRoles === 0) {
      await Role.bulkCreate([
        { name: 'OWNER' },
        { name: 'INFLUENCER' }
      ]);
      console.log('Roles seeded successfully');
    } else {
      console.log('Roles already exist');
    }
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

module.exports = seedRoles;