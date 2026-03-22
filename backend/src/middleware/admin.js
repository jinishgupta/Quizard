import { User } from '../db/models/User.js';

/**
 * Admin authorization middleware
 * Requires user to be authenticated and have admin role
 * Must be used after authenticate middleware
 */
export async function requireAdmin(req, res, next) {
  try {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if user has admin role
    if (!req.user.is_admin) {
      return res.status(403).json({
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Authorization check failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export default requireAdmin;
