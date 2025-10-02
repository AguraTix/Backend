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

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Start Google OAuth flow
 *     description: |
 *       Redirects user to Google login page to authenticate.
 *       
 *       **⚠️ IMPORTANT: This endpoint cannot be tested directly from Swagger UI because it redirects to Google.**
 *       
 *       **To test this endpoint:**
 *       1. Open this URL directly in your browser: https://agura-ticketing-backend.onrender.com/api/auth/google
 *       3. You will be redirected to Google's login page
 *       4. After login, you'll be redirected back to the callback endpoint with your token
 *       
 *       **Production URL:** https://agura-ticketing-backend.onrender.com/api/auth/google
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth consent screen (https://accounts.google.com/oauth/authorize...)
 *       500:
 *         description: Server configuration error
 */
router.get('/google', (req, res, next) => {
  console.log('Starting Google OAuth flow...');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
  console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
  console.log('Base URL:', process.env.BASE_URL);
  console.log('Expected callback URL:', `${process.env.BASE_URL}/api/auth/google/callback`);
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'select_account'
  })(req, res, next);
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: |
 *       Receives Google's response and redirects to frontend with token.
 *       
 *       **⚠️ This endpoint is called automatically by Google after authentication.**
 *       
 *       **Success redirect:** `https://agura-web-v-1.vercel.app/?token=JWT_TOKEN&user=USER_DATA&auth=success`
 *       
 *       **Error redirect:** `https://agura-web-v-1.vercel.app/?error=ERROR_TYPE&message=ERROR_MESSAGE`
 *       
 *       **Frontend should parse URL parameters to get:**
 *       - `token`: JWT authentication token
 *       - `user`: JSON string with user data (needs decoding with decodeURIComponent)
 *       - `auth`: "success" if login successful
 *       - `error`: Error type if login failed
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         description: Authorization code from Google (automatically provided)
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to frontend with token or error parameters
 */
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/google/failure',
    session: false 
  }),
  async (req, res) => {
    try {
      console.log('Google OAuth callback successful');
      console.log('User authenticated:', req.user ? req.user.email : 'No user');
      
      if (!req.user) {
        // Redirect to frontend with error
        return res.redirect('https://agura-web-v-1.vercel.app/?error=authentication_failed');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          user_id: req.user.user_id, 
          role: req.user.role,
          email: req.user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Encode user data for URL
      const userData = encodeURIComponent(JSON.stringify({
        user_id: req.user.user_id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        profile_photo: req.user.profile_photo
      }));

      // Redirect to frontend with token and user data
      const redirectUrl = `https://agura-web-v-1.vercel.app/?token=${token}&user=${userData}&auth=success`;
      
      console.log('Redirecting to frontend:', redirectUrl);
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('Google OAuth callback error:', error);
      // Redirect to frontend with error
      return res.redirect('https://agura-web-v-1.vercel.app/?error=server_error');
    }
  }
);

/**
 * @swagger
 * /api/auth/google/failure:
 *   get:
 *     summary: Google OAuth failure
 *     description: Called when Google authentication fails
 *     tags: [Authentication]
 *     responses:
 *       401:
 *         description: Authentication failed
 */
// Failure route
router.get('/google/failure', (req, res) => {
  console.log('Google OAuth authentication failed');
  // Redirect to frontend with error
  res.redirect('https://agura-web-v-1.vercel.app/?error=google_auth_failed&message=Unable to authenticate with Google');
});

/**
 * @swagger
 * /api/auth/test-config:
 *   get:
 *     summary: Test Google OAuth configuration
 *     description: |
 *       Check if Google OAuth is properly configured (Development only).
 *       
 *       **✅ This endpoint CAN be tested directly from Swagger UI.**
 *       
 *       **Example response:**
 *       ```json
 *       {
 *         "message": "Google OAuth configuration test",
 *         "config": {
 *           "clientId": "Set",
 *           "clientSecret": "Set",
 *           "jwtSecret": "Set",
 *           "callbackURL": "http://localhost:3000/api/auth/google/callback",
 *           "sessionSecret": "Set"
 *         },
 *         "instructions": [
 *           "1. Make sure Google+ API is enabled in Google Cloud Console",
 *           "2. Verify the callback URL matches exactly in Google Console"
 *         ]
 *       }
 *       ```
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Configuration status and setup instructions
 *       500:
 *         description: Configuration error
 */
router.get('/test-config', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  res.json({
    message: 'Google OAuth configuration test',
    config: {
      clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Missing',
      callbackURL: `${baseUrl}/api/auth/google/callback`,
      sessionSecret: process.env.SESSION_SECRET ? 'Set' : 'Missing',
      baseUrl: baseUrl
    },
    instructions: [
      '1. Make sure Google+ API is enabled in Google Cloud Console',
      '2. Verify the callback URL matches exactly in Google Console',
      '3. Check that your OAuth consent screen is configured',
      '4. Ensure the app is not in testing mode or add your email as a test user'
    ],
    testingInstructions: {
      step1: 'First test this /test-config endpoint (✅ works in Swagger)',
      step2: `Then open ${baseUrl}/api/auth/google in browser (⚠️ will redirect to Google)`,
      step3: 'Complete Google login to test the full flow',
      note: 'The /api/auth/google endpoint cannot be tested in Swagger UI because it redirects to Google',
      productionUrl: `${baseUrl}/api/auth/google`
    }
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