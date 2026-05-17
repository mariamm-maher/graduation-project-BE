/**
 * User Factory
 * 
 * Generates realistic User, Role, and UserRole seed data.
 */

const { generateName, generateUsername, generateCompanyName, pick, pickMultiple } = require('../data/names');
const { Validators } = require('../utils/validators');

class UserFactory {
  constructor() {
    this.usedEmails = new Set();
    this.usedGoogleIds = new Set();
  }

  /**
   * Generate Role seed data
   * @returns {Array}
   */
  static generateRoles() {
    const roles = [
      { name: 'OWNER' },
      { name: 'INFLUENCER' },
      { name: 'ADMIN' }
    ];
    
    // Validate
    roles.forEach(role => {
      if (!Validators.isValidEnum(role.name, 'RoleName')) {
        throw new Error(`Invalid role name: ${role.name}`);
      }
    });
    
    return roles;
  }

  /**
   * Generate a unique email
   * @param {string} firstName 
   * @param {string} lastName 
   * @param {string} companyName 
   * @param {string} role 
   * @returns {string}
   */
  generateEmail(firstName, lastName, companyName, role) {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanCompany = companyName 
      ? companyName.toLowerCase().replace(/[^a-z]/g, '')
      : role.toLowerCase();
    
    const patterns = [
      `${cleanFirst}@${cleanCompany}.com`,
      `${cleanFirst}.${cleanLast}@${cleanCompany}.com`,
      `${cleanFirst}${cleanLast.slice(0, 2)}@${cleanCompany}.co`,
      `${cleanFirst}@${cleanCompany}.co`,
      `${cleanFirst}.${cleanLast}@${cleanCompany}.io`,
      `${cleanLast}.${cleanFirst}@${cleanCompany}.com`,
      `${cleanFirst}_${cleanLast}@${cleanCompany}.net`,
      `${cleanFirst}@${cleanCompany}hq.com`,
      `${cleanFirst}${Math.floor(Math.random() * 99) + 1}@${cleanCompany}.com`,
    ];
    
    for (const pattern of patterns.sort(() => 0.5 - Math.random())) {
      if (!this.usedEmails.has(pattern)) {
        this.usedEmails.add(pattern);
        return pattern;
      }
    }
    
    // Fallback with timestamp
    const fallback = `${cleanFirst}.${cleanLast}.${Date.now()}@${cleanCompany}.com`;
    this.usedEmails.add(fallback);
    return fallback;
  }

  /**
   * Generate a User record
   * @param {object} options
   * @returns {object}
   */
  generateUser(options = {}) {
    const {
      role = 'OWNER',
      status = 'ACTIVE',
      gender = 'random',
      withPassword = true,
      withGoogle = false
    } = options;

    const name = generateName(gender);
    const companyName = generateCompanyName();
    const email = this.generateEmail(name.firstName, name.lastName, companyName, role);
    
    const user = {
      firstName: name.firstName,
      lastName: name.lastName,
      email: email,
      status: status,
      // Password will be hashed by Sequelize hook
      password: withPassword ? 'Password123!' : null,
      googleId: withGoogle ? this.generateGoogleId() : null,
      resetPasswordToken: null,
      resetPasswordExpires: null
    };

    // Validate
    const errors = Validators.validateUser(user);
    Validators.assertValid('User', user, errors);

    return user;
  }

  /**
   * Generate a unique Google ID
   * @returns {string}
   */
  generateGoogleId() {
    const id = `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (this.usedGoogleIds.has(id)) {
      return this.generateGoogleId();
    }
    this.usedGoogleIds.add(id);
    return id;
  }

  /**
   * Generate multiple users
   * @param {number} count 
   * @param {object} options 
   * @returns {Array}
   */
  generateUsers(count, options = {}) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(this.generateUser(options));
    }
    return users;
  }

  /**
   * Generate Owner users
   * @param {number} count 
   * @returns {Array}
   */
  generateOwners(count = 10) {
    return this.generateUsers(count, { role: 'OWNER', status: 'ACTIVE' });
  }

  /**
   * Generate Influencer users
   * @param {number} count 
   * @returns {Array}
   */
  generateInfluencers(count = 12) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(this.generateUser({ 
        role: 'INFLUENCER', 
        status: 'ACTIVE',
        gender: Math.random() > 0.6 ? 'female' : 'male' // Influencer skew female
      }));
    }
    return users;
  }

  /**
   * Generate Admin users
   * @param {number} count 
   * @returns {Array}
   */
  generateAdmins(count = 3) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(this.generateUser({ 
        role: 'ADMIN', 
        status: 'ACTIVE' 
      }));
    }
    return users;
  }

  /**
   * Generate special test accounts
   * @returns {Array}
   */
  generateTestAccounts() {
    return [
      {
        firstName: 'Demo',
        lastName: 'Owner',
        email: 'demo.owner@example.com',
        password: 'DemoPass123!',
        status: 'ACTIVE'
      },
      {
        firstName: 'Demo',
        lastName: 'Influencer',
        email: 'demo.influencer@example.com',
        password: 'DemoPass123!',
        status: 'ACTIVE'
      },
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: 'AdminPass123!',
        status: 'ACTIVE'
      },
      {
        firstName: 'Pending',
        lastName: 'Onboarding',
        email: 'onboarding@example.com',
        password: 'TestPass123!',
        status: 'INCOMPLETE'
      },
      {
        firstName: 'Suspended',
        lastName: 'User',
        email: 'suspended@example.com',
        password: 'TestPass123!',
        status: 'SUSPENDED'
      }
    ];
  }
}

module.exports = new UserFactory();
