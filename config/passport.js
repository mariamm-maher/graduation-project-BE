const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../models');
const AppError = require('../utils/AppError');

// Configure passport local strategy for signup
passport.use('local-signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
async (req, email, password, done) => {
  try {
    const { firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return done(new AppError('Email already in use', 400), false);
    }

    // Validate required fields
    if (!firstName || !lastName) {
      return done(new AppError('First name and last name are required', 400), false);
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Configure passport local strategy for login
passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
async (email, password, done) => {
  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return done(new AppError('Invalid email or password', 401), false);
    }

    // Check if password matches
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return done(new AppError('Invalid email or password', 401), false);
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;