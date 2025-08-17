const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('Missing Google OAuth environment variables:');
  console.error('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
  console.error('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
  throw new Error('Google OAuth environment variables are required');
}

// Determine callback URL based on environment
const getCallbackURL = () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const callbackURL = `${baseURL}/api/auth/google/callback`;
  console.log('Google OAuth callback URL:', callbackURL);
  return callbackURL;
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: getCallbackURL(),
    proxy: true, // Enable proxy support
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth profile received:', {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value,
        provider: profile.provider
      });

      // Validate profile has email
      if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
        return done(new Error('No email found in Google profile'), null);
      }

      const email = profile.emails[0].value;
      
      // Check if user already exists
      let user = await User.findOne({ where: { email: email } });
      
      if (!user) {
        // Create new user
        user = await User.create({
          email: email,
          name: profile.displayName || 'Google User',
          password: '', // Empty password for OAuth users
          phone_number: profile.phoneNumbers?.[0]?.value || '',
          role: 'Attendee',
          profile_photo: profile.photos?.[0]?.value || null
        });
        console.log('New user created via Google OAuth:', user.email);
      } else {
        console.log('Existing user found via Google OAuth:', user.email);
      }
      
      return done(null, user);
    } catch (err) {
      console.error('Error in Google OAuth strategy:', err);
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    console.error('Error deserializing user:', err);
    done(err, null);
  }
});

module.exports = passport; 