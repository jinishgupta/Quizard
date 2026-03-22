import orangeAuthService from '../services/OrangeAuthService.js';
import { User } from '../db/models/User.js';

/**
 * Authentication middleware
 * Extracts and verifies Orange ID token from Authorization header
 * Attaches user data to request object
 */
export async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Orange Auth Service
    const orangeUser = await orangeAuthService.verifyToken(token);

    // Get user from database
    const user = await User.findByOrangeId(orangeUser.id);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    // Attach user data to request
    req.user = user;
    req.orangeUser = orangeUser;
    req.token = token;

    next();
  } catch (error) {
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
