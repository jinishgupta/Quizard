import express from 'express';
import telemetryService from '../services/TelemetryService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/telemetry/metrics
 * Get competition metrics with date range filter
 * Query params: startDate (ISO string), endDate (ISO string)
 */
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'startDate and endDate query parameters are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
      });
    }

    if (start > end) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'startDate must be before endDate',
      });
    }

    const metrics = await telemetryService.getMetrics(start, end);

    res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get telemetry metrics',
      message: error.message,
    });
  }
});

/**
 * GET /api/telemetry/engagement
 * Get engagement statistics
 * Query params: startDate (ISO string), endDate (ISO string)
 */
router.get('/engagement', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'startDate and endDate query parameters are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
      });
    }

    if (start > end) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'startDate must be before endDate',
      });
    }

    const stats = await telemetryService.getEngagementStats(start, end);

    res.json({
      success: true,
      engagement: stats,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get engagement statistics',
      message: error.message,
    });
  }
});

/**
 * GET /api/telemetry/credits
 * Get credit redemption breakdown by type
 * Query params: startDate (ISO string), endDate (ISO string)
 */
router.get('/credits', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'startDate and endDate query parameters are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
      });
    }

    if (start > end) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'startDate must be before endDate',
      });
    }

    const breakdown = await telemetryService.getCreditRedemptionBreakdown(start, end);

    res.json({
      success: true,
      creditRedemptions: breakdown,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get credit redemption breakdown',
      message: error.message,
    });
  }
});

export default router;
