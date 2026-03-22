import orangeAuthService from '../services/OrangeAuthService.js';
import { User } from '../db/models/User.js';

/**
 * Authentication middleware
 * Extracts and verifies Orange ID token from Authorization header
 * Attaches user data to request object
 */
export async function authenticate(req, res, next) {
  try {
    console.log('\n=== AUTHENTICATION MIDDLEWARE ===');
    console.log('Request URL:', req.method, req.originalUrl);
    
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid Authorization header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');

    // Verify token with Orange Auth Service
    console.log('Verifying token with Orange Auth Service...');
    const orangeUser = await orangeAuthService.verifyToken(token);
    console.log('✅ Token verified. Orange User ID:', orangeUser.id);

    // Get user from database
    console.log('Looking up user in database...');
    const user = await User.findByOrangeId(orangeUser.id);

    if (!user) {
      console.log('❌ User not found in database for Orange ID:', orangeUser.id);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    console.log('✅ User found:', user.id, user.username);

    // Attach user data to request
    req.user = user;
    req.orangeUser = orangeUser;
    req.token = token;

    console.log('=== AUTHENTICATION SUCCESS ===\n');
    next();
  } catch (error) {
    console.log('❌ AUTHENTICATION ERROR:', error.message);
    console.log('Error stack:', error.stack);
    console.log('=== AUTHENTICATION FAILED ===\n');
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token provided
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const orangeUser = await orangeAuthService.verifyToken(token);
    const user = await User.findByOrangeId(orangeUser.id);

    if (user) {
      req.user = user;
      req.orangeUser = orangeUser;
      req.token = token;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
