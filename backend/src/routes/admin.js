import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { supabase, sql } from '../db/index.js';
import telemetryService from '../services/TelemetryService.js';

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard
 * Get dashboard metrics (active users, total rounds, engagement)
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get active users (played in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activeSessions, error: activeError } = await supabase
      .from('game_sessions')
      .select('user_id')
      .gte('started_at', sevenDaysAgo.toISOString())
      .eq('status', 'completed');

    if (activeError) throw activeError;

    const activeUsers = new Set(activeSessions.map(s => s.user_id)).size;

    // Get total rounds (all time)
    const { count: totalRounds, error: roundsError } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (roundsError) throw roundsError;

    // Get total questions answered (all time)
    const { data: statsData, error: statsError } = await supabase
      .from('users')
      .select('total_questions');

    if (statsError) throw statsError;

    const totalQuestions = statsData.reduce((sum, user) => sum + (user.total_questions || 0), 0);

    // Get engagement metrics from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const engagementStats = await telemetryService.getEngagementStats(
      thirtyDaysAgo,
      new Date()
    );

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    res.json({
      activeUsers,
      totalRounds: totalRounds || 0,
      totalQuestions,
      totalUsers: totalUsers || 0,
      engagement: {
        avgDailyActiveUsers: engagementStats.avgDailyActiveUsers,
        avgSessionsPerUser: engagementStats.avgSessionsPerUser,
        avgRedemptionsPerUser: engagementStats.avgRedemptionsPerUser,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to retrieve dashboard metrics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/admin/health
 * Get system health check with database status
 */
router.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        responseTime: 0,
      },
    };

    // Test database connection
    const startTime = Date.now();
    try {
      await sql`SELECT 1 as health_check`;
      const endTime = Date.now();
      healthCheck.database.connected = true;
      healthCheck.database.responseTime = endTime - startTime;
    } catch (dbError) {
      healthCheck.status = 'unhealthy';
      healthCheck.database.error = dbError.message;
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/activity
 * Get user activity logs from telemetry
 */
router.get('/activity', async (req, res) => {
  try {
    const { userId, eventType, limit = 100, offset = 0 } = req.query;

    let query = supabase
      .from('telemetry_events')
      .select(`
        *,
        users (
          id,
          username,
          email,
          display_name
        )
      `)
      .order('timestamp', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data: activities, error } = await query;

    if (error) throw error;

    res.json({
      activities: activities.map(activity => ({
        id: activity.id,
        userId: activity.user_id,
        username: activity.users?.username,
        email: activity.users?.email,
        displayName: activity.users?.display_name,
        eventType: activity.event_type,
        eventData: activity.event_data,
        timestamp: activity.timestamp,
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: activities.length,
      },
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to retrieve activity logs',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/admin/reports
 * Export data in JSON/CSV format
 */
router.get('/reports', async (req, res) => {
  try {
    const { format = 'json', type, startDate, endDate } = req.query;

    if (!type) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_REQUIRED_FIELD',
          message: 'Report type is required (users, sessions, credits, telemetry)',
          timestamp: new Date().toISOString(),
        },
      });
    }

    let data = [];
    let filename = '';

    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    switch (type) {
      case 'users':
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        
        if (usersError) throw usersError;
        data = users;
        filename = `users_report_${Date.now()}`;
        break;

      case 'sessions':
        const { data: sessions, error: sessionsError } = await supabase
          .from('game_sessions')
          .select(`
            *,
            users (username, email),
            categories (name)
          `)
          .gte('started_at', start.toISOString())
          .lte('started_at', end.toISOString());
        
        if (sessionsError) throw sessionsError;
        data = sessions;
        filename = `sessions_report_${Date.now()}`;
        break;

      case 'credits':
        const { data: credits, error: creditsError } = await supabase
          .from('credit_transactions')
          .select(`
            *,
            users (username, email)
          `)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
        
        if (creditsError) throw creditsError;
        data = credits;
        filename = `credits_report_${Date.now()}`;
        break;

      case 'telemetry':
        const { data: telemetry, error: telemetryError } = await supabase
          .from('telemetry_events')
          .select(`
            *,
            users (username, email)
          `)
          .gte('timestamp', start.toISOString())
          .lte('timestamp', end.toISOString());
        
        if (telemetryError) throw telemetryError;
        data = telemetry;
        filename = `telemetry_report_${Date.now()}`;
        break;

      default:
        return res.status(400).json({
          error: {
            code: 'VALIDATION_INVALID_FORMAT',
            message: 'Invalid report type. Must be: users, sessions, credits, or telemetry',
            timestamp: new Date().toISOString(),
          },
        });
    }

    // Format response based on requested format
    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return res.status(200).send('');
      }

      const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object');
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvRows.push(values.join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvRows.join('\n'));
    } else {
      // Return JSON
      res.json({
        type,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        count: data.length,
        data,
      });
    }
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to generate report',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/admin/credits
 * View credit redemption analytics by type
 */
router.get('/credits', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Parse date range (default to last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get credit redemption breakdown
    const breakdown = await telemetryService.getCreditRedemptionBreakdown(start, end);

    // Get total credits in system
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('credits');

    if (usersError) throw usersError;

    const totalCreditsInSystem = usersData.reduce((sum, user) => sum + (user.credits || 0), 0);

    // Get credit transactions summary
    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('transaction_type, amount')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (transError) throw transError;

    const summary = {
      totalEarned: 0,
      totalSpent: 0,
      totalSynced: 0,
    };

    transactions.forEach(trans => {
      if (trans.transaction_type === 'earn') {
        summary.totalEarned += trans.amount;
      } else if (trans.transaction_type === 'spend') {
        summary.totalSpent += Math.abs(trans.amount);
      } else if (trans.transaction_type === 'sync') {
        summary.totalSynced += trans.amount;
      }
    });

    res.json({
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalCreditsInSystem,
      summary,
      redemptionsByType: breakdown.breakdown,
      totalRedemptions: breakdown.totalRedemptions,
      totalAmountRedeemed: breakdown.totalAmount,
    });
  } catch (error) {
    console.error('Get credit analytics error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to retrieve credit analytics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
