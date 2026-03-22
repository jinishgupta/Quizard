import express from 'express';
import orangeAuthService from '../services/OrangeAuthService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/auth/verify
 * Verify Orange ID token and sync user profile
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Bedrock Passport
    const orangeUser = await orangeAuthService.verifyToken(token);

    // Sync user profile with database
    const user = await orangeAuthService.syncUserProfile(orangeUser);

    res.json({
      success: true,
      user: {
        id: user.id,
        orangeId: user.orange_id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        bio: user.bio,
        avatar: user.avatar,
        banner: user.banner,
        ethAddress: user.eth_address,
        provider: user.provider,
        credits: user.credits,
        currentStreak: user.current_streak,
        bestStreak: user.best_streak,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh Orange ID token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required',
      });
    }

    // Refresh token with Bedrock Passport
    const tokens = await orangeAuthService.refreshToken(refreshToken);

    res.json({
      success: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({
      error: 'Token refresh failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate user session
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from storage
    // We can optionally track logout events for telemetry
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Logout failed',
      message: error.message,
    });
  }
});

export default router;
