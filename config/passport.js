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

// Configure Google OAuth 2.0 strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let isNewUser = false;

    // Check if user exists with this Google ID
    let existingUser = await User.findOne({ where: { googleId: profile.id } });

    if (existingUser) {
      return done(null, { user: existingUser, isNewUser: false });
    }

    // Check if user exists with this email
    existingUser = await User.findOne({ where: { email: profile.emails[0].value } });

    if (existingUser) {
      // Link Google account to existing user
      existingUser.googleId = profile.id;
      await existingUser.save();
      return done(null, { user: existingUser, isNewUser: false });
    }

    // Extract name from profile
    const displayName = profile.displayName || '';
    const nameParts = displayName.split(' ');
    const firstName = profile.name?.givenName || nameParts[0] || 'User';
    const lastName = profile.name?.familyName || nameParts.slice(1).join(' ') || 'Google';

    // Create new user (Sign-up)
    const newUser = await User.create({
      googleId: profile.id,
      firstName,
      lastName,
      email: profile.emails[0].value,
      password: null // No password for Google users
    });

    isNewUser = true;
    done(null, { user: newUser, isNewUser });
  } catch (err) {
    done(err, null);
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