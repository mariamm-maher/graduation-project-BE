const { Role, User } = require('../models');

const seedRoles = async () => {
  try {
    /*Seed Roles*/
    const roleCount = await Role.count();

    if (roleCount === 0) {
      await Role.bulkCreate([
        { name: 'OWNER' },
        { name: 'INFLUENCER' },
        { name: 'ADMIN' }
      ]);
      console.log('Roles created successfully');
    } else {
      console.log('Roles already exist');
    }

    /* Seed Admin User (ONLY ONE)  */
    const adminEmail = 'admin@admin.com';

    // get ADMIN role (after roles are guaranteed to exist)
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });

    if (!adminRole) {
      console.log('ADMIN role not found');
      return;
    }

    // check if ANY admin user exists
    const existingAdmins = await User.findAll({
      attributes: { exclude: ['status'] },
      include: [{
        model: Role,
        as: 'roles',
        where: { name: 'ADMIN' }
      }]
    });

    // If admin already exists, don't create another one
    if (existingAdmins.length > 0) {
      console.log('Admin user already exists ✅');
      return;
    }

    // Create the ONLY admin user
    console.log('Creating the ONLY admin user...');

    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      password: 'Admin123'
    });

    // Assign ADMIN role
    await adminUser.setRoles([adminRole]);

    console.log('Admin user created successfully ✅');

  } catch (error) {
    console.error('Error seeding roles & admin user:', error);
  }
};

module.exports = seedRoles;


