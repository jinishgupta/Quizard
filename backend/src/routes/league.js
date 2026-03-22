import express from 'express';
import leagueService from '../services/LeagueService.js';
import leagueResetScheduler from '../services/LeagueResetScheduler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/league/leaderboard
 * Get current leaderboard with optional tier filter
 * Query params: tier (optional), limit (optional, default 100)
 * Requirements: 4.5
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { tier, limit } = req.query;
    
    // Validate tier if provided
    const validTiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    if (tier && !validTiers.includes(tier)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid tier. Must be one of: Bronze, Silver, Gold, Platinum, Diamond',
      });
    }
    
    // Validate limit if provided
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid limit. Must be between 1 and 1000',
      });
    }
    
    const leaderboard = await leagueService.getLeaderboard(tier || null, parsedLimit);
    
    res.json({
      success: true,
      tier: tier || 'all',
      count: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get leaderboard',
      message: error.message,
    });
  }
});

/**
 * GET /api/league/rank
 * Get user's current rank and tier
 * Requirements: 4.5
 */
router.get('/rank', authenticate, async (req, res) => {
  try {
    const rankInfo = await leagueService.getUserRank(req.user.id);
    
    res.json({
      success: true,
      rank: rankInfo,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get user rank',
      message: error.message,
    });
  }
});

/**
 * GET /api/league/tiers
 * Get all tier information
 * Requirements: 4.5
 */
router.get('/tiers', async (req, res) => {
  try {
    const tiers = leagueService.getTiers();
    
    res.json({
      success: true,
      tiers,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get tiers',
      message: error.message,
    });
  }
});

/**
 * GET /api/league/history
 * Get league history for authenticated user
 * Query params: limit (optional, default 10)
 * Requirements: 4.5
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { limit } = req.query;
    
    // Validate limit if provided
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid limit. Must be between 1 and 100',
      });
    }
    
    const history = await leagueService.getLeagueHistory(req.user.id, parsedLimit);
    
    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get league history',
      message: error.message,
    });
  }
});

/**
 * POST /api/league/reset (Admin only - for testing)
 * Manually trigger league reset
 * Requirements: 4.2, 4.6
 */
router.post('/reset', authenticate, async (req, res) => {
  try {
    // In production, add admin role check here
    // For now, allow any authenticated user for testing
    
    const result = await leagueResetScheduler.manualReset();
    
    res.json({
      success: true,
      message: 'League reset completed',
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset league',
      message: error.message,
    });
  }
});

export default router;
