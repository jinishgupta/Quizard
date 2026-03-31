import express from 'express';
import aiService from '../services/AIService.js';
import { authenticate } from '../middleware/auth.js';
import { requireActiveGamePass } from '../middleware/gamepass.js';

const router = express.Router();

/**
 * GET /api/ai/digest
 * Get weekly digest for current user
 * Query params: weekNumber (optional), year (optional)
 */
router.get('/digest', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { weekNumber, year } = req.query;

    const digest = await aiService.getWeeklyDigest(
      userId,
      weekNumber ? parseInt(weekNumber) : null,
      year ? parseInt(year) : null
    );

    if (!digest) {
      return res.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Weekly digest not found for the specified week',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      id: digest.id,
      userId: digest.user_id,
      weekNumber: digest.week_number,
      year: digest.year,
      summary: digest.summary,
      strengths: digest.strengths,
      suggestions: digest.suggestions,
      funFact: digest.fun_fact,
      generatedAt: digest.generated_at,
    });
  } catch (error) {
    console.error('Get digest error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to retrieve weekly digest',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/ai/digest/early
 * Request early digest generation (costs CREDITS_EARLY_DIGEST)
 */
router.post('/digest/early', authenticate, requireActiveGamePass, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await aiService.requestEarlyDigest(userId, req.gamePassToken);

    res.json({
      success: result.success,
      digest: {
        id: result.digest.id,
        userId: result.digest.user_id,
        weekNumber: result.digest.week_number,
        year: result.digest.year,
        summary: result.digest.summary,
        strengths: result.digest.strengths,
        suggestions: result.digest.suggestions,
        funFact: result.digest.fun_fact,
        generatedAt: result.digest.generated_at,
      },
      message: result.message,
    });
  } catch (error) {
    console.error('Request early digest error:', error);
    
    // Handle insufficient credits
    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        error: {
          code: 'PAYMENT_REQUIRED',
          message: 'Insufficient credits for early digest',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to request early digest',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ai/stats/weekly
 * Get weekly statistics for current user
 * Query params: weekNumber (optional), year (optional)
 */
router.get('/stats/weekly', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { weekNumber, year } = req.query;

    const currentWeek = aiService.getCurrentWeek();
    const targetWeek = weekNumber ? parseInt(weekNumber) : currentWeek.weekNumber;
    const targetYear = year ? parseInt(year) : currentWeek.year;

    const stats = await aiService.getWeeklyStats(userId, targetWeek, targetYear);

    if (!stats) {
      return res.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'No activity data found for the specified week',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      userId,
      weekNumber: targetWeek,
      year: targetYear,
      statistics: {
        totalSessions: stats.totalSessions,
        totalQuestions: stats.totalQuestions,
        correctAnswers: stats.correctAnswers,
        totalPoints: stats.totalPoints,
        accuracy: parseFloat(stats.accuracy.toFixed(2)),
        avgTimePerQuestion: parseFloat(stats.avgTimePerQuestion.toFixed(2)),
        leagueRank: stats.leagueRank,
      },
      categoryBreakdown: stats.categoryBreakdown.map(cat => ({
        categoryName: cat.categoryName,
        questionsAnswered: cat.questionsAnswered,
        correctAnswers: cat.correctAnswers,
        accuracy: parseFloat(cat.accuracy.toFixed(2)),
      })),
    });
  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to retrieve weekly statistics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
