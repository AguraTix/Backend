const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { User } = require('../models');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required for Google OAuth');
  throw new Error('JWT_SECRET is not configured');
}

router.get('/google', (req, res, next) => {
  console.log('Starting Google OAuth flow...');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
  console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
  
  passport.authenticate('google', { 
    scope: ['profile', 'email', 'openid'],
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
});

router.get('/google/callback', async (req, res) => {
  console.log('Google OAuth callback received');
  console.log('Query parameters:', req.query);
  
  // Check if we have the authorization code
  if (!req.query.code) {
    console.error('No authorization code received');
    return res.status(400).json({
      error: 'Authorization code missing',
      message: 'No authorization code received from Google'
    });
  }

  try {

    const tokenData = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code: req.query.code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`
    });

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000 
    });

    const { access_token } = tokenResponse.data;
    console.log('Access token received');

    // Get user profile using access token
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      },
      timeout: 15000 
    });

    const profile = profileResponse.data;
    console.log('User profile received:', {
      id: profile.sub,
      email: profile.email,
      name: profile.name
    });


    if (!profile.email) {
      return res.status(400).json({
        error: 'No email found in Google profile',
        message: 'Google profile does not contain email information'
      });
    }

    let user = await User.findOne({ where: { email: profile.email } });
    
    if (!user) {

      user = await User.create({
        email: profile.email,
        name: profile.name || 'Google User',
        password: '',
        phone_number: '',
        role: 'Attendee',
        profile_photo: profile.picture || null
      });
      console.log('New user created via Google OAuth:', user.email);
    } else {
      console.log('Existing user found via Google OAuth:', user.email);
    }


    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_photo: user.profile_photo
      },
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        error: 'Google OAuth timeout',
        message: 'Request to Google timed out. Please try again.',
        details: 'Network timeout occurred while communicating with Google'
      });
    }

    if (error.response) {
      // Google API error
      return res.status(error.response.status).json({
        error: 'Google API error',
        message: error.response.data?.error_description || error.response.data?.error || 'Google API error',
        details: process.env.NODE_ENV === 'development' ? error.response.data : undefined
      });
    }

    return res.status(500).json({
      error: 'Google OAuth error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get('/test-config', (req, res) => {
  res.json({
    message: 'Google OAuth configuration test',
    config: {
      clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Missing',
      callbackURL: `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`,
      sessionSecret: process.env.SESSION_SECRET ? 'Set' : 'Missing'
    },
    instructions: [
      '1. Make sure Google+ API is enabled in Google Cloud Console',
      '2. Verify the callback URL matches exactly in Google Console',
      '3. Check that your OAuth consent screen is configured',
      '4. Ensure the app is not in testing mode or add your email as a test user'
    ]
  });
});
router.use((err, req, res, next) => {
  console.error('Google OAuth route error:', err);
  res.status(500).json({
    error: 'Google OAuth error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = router; 