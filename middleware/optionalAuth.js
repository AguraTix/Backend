const jwt = require('jsonwebtoken');

/**
 * Optional authentication middleware
 * Sets req.user if token is provided and valid, but doesn't fail if no token
 * Useful for endpoints that need to filter by user role when authenticated,
 * but allow public access when not authenticated
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  // If no auth header, continue without setting req.user
  if (!authHeader) {
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(); // Invalid format, but continue without auth
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Invalid or expired token, but continue without auth
    // Don't fail the request, just don't set req.user
    next();
  }
}

module.exports = optionalAuth;


