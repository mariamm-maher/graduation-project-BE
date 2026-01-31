const { Role, User, UserRole } = require('../models');

const seedRoles = async () => {
  try {
    // Check if roles already exist
    const existingRoles = await Role.count();
    
    if (existingRoles === 0) {
      await Role.bulkCreate([
        { name: 'OWNER' },
        { name: 'INFLUENCER' },
        { name: 'ADMIN' }
      ]);
      console.log('Roles seeded successfully');
    } else {
      console.log('Roles already exist');
    }

    // Seed Admin User
    const adminEmail = 'admin@admin.com';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      console.log('Creating admin user...');
      const adminUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: 'Admin123'
      });

      const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
      
      if (adminRole) {
        await UserRole.create({
          userId: adminUser.id,
          roleId: adminRole.id
        });
        console.log('Admin user (admin@admin.com) created with password: Admin123');
      }
    } else {
      console.log('Admin user already exists');
    }

  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

module.exports = seedRoles;