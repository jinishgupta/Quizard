import cron from 'node-cron';
import { supabase } from '../db/index.js';
import aiService from './AIService.js';

/**
 * Weekly Digest Scheduler
 * Generates AI-powered weekly digests for all active users
 * 
 * Schedule: Every Monday at 01:00 UTC (after league reset on Sunday midnight)
 * Requirements: 7.1
 */
export class WeeklyDigestScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Start the weekly digest scheduler
   * Runs every Monday at 01:00 UTC (1 hour after league reset)
   */
  start() {
    if (this.isRunning) {
      console.log('Weekly digest scheduler is already running');
      return;
    }

    // Schedule: Every Monday at 01:00 UTC
    // Cron format: second minute hour day month weekday
    // 0 0 1 * * 1 = At 01:00:00 on Monday
    this.cronJob = cron.schedule('0 0 1 * * 1', async () => {
      console.log('Starting weekly digest generation...');
      try {
        await this.generateDigestsForAllUsers();
        console.log('Weekly digest generation completed successfully');
      } catch (error) {
        console.error('Weekly digest generation failed:', error);
      }
    }, {
      timezone: 'UTC',
    });

    this.isRunning = true;
    console.log('Weekly digest scheduler started (runs every Monday at 01:00 UTC)');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('Weekly digest scheduler stopped');
    }
  }

  /**
   * Generate digests for all active users
   * Requirements: 7.1
   * 
   * Active users are those who played at least one session in the previous week
   */
  async generateDigestsForAllUsers() {
    try {
      // Get previous week (the week that just ended)
      const previousWeek = this.getPreviousWeek();
      
      console.log(`Generating digests for week ${previousWeek.weekNumber}, year ${previousWeek.year}`);
      
      // Get all active users from previous week
      const activeUsers = await this.getActiveUsers(previousWeek.weekNumber, previousWeek.year);
      
      console.log(`Found ${activeUsers.length} active users`);
      
      let successCount = 0;
      let failureCount = 0;
      
      // Generate digest for each active user
      for (const user of activeUsers) {
        try {
          await aiService.generateWeeklyDigest(
            user.user_id,
            previousWeek.weekNumber,
            previousWeek.year
          );
          successCount++;
          console.log(`Generated digest for user ${user.user_id}`);
        } catch (error) {
          failureCount++;
          console.error(`Failed to generate digest for user ${user.user_id}:`, error.message);
        }
      }
      
      console.log(`Digest generation complete: ${successCount} succeeded, ${failureCount} failed`);
      
      return {
        success: true,
        weekNumber: previousWeek.weekNumber,
        year: previousWeek.year,
        totalUsers: activeUsers.length,
        successCount,
        failureCount,
      };
    } catch (error) {
      throw new Error(`Failed to generate digests for all users: ${error.message}`);
    }
  }

  /**
   * Get active users for a specific week
   * Active users are those who completed at least one session during the week
   * 
   * @param {number} weekNumber - ISO week number
   * @param {number} year - Year
   * @returns {Promise<Array>} Array of active users
   */
  async getActiveUsers(weekNumber, year) {
    try {
      // Calculate week date range
      const weekStart = this.getWeekStartDate(weekNumber, year);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Get distinct users who completed sessions during the week
      const { data, error } = await supabase
        .from('game_sessions')
        .select('user_id')
        .eq('status', 'completed')
        .gte('completed_at', weekStart.toISOString())
        .lt('completed_at', weekEnd.toISOString());

      if (error) throw error;

      // Get unique user IDs
      const uniqueUsers = [...new Set(data.map(s => s.user_id))];
      
      return uniqueUsers.map(userId => ({ user_id: userId }));
    } catch (error) {
      throw new Error(`Failed to get active users: ${error.message}`);
    }
  }

  /**
   * Get previous week number and year
   * @returns {Object} { weekNumber, year }
   */
  getPreviousWeek() {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Calculate ISO week number
    const weekNumber = this.getISOWeek(lastWeek);
    const year = lastWeek.getFullYear();
    
    return { weekNumber, year };
  }

  /**
   * Get ISO week number for a date
   * @param {Date} date - Date
   * @returns {number} ISO week number
   */
  getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }

  /**
   * Get start date of an ISO week
   * 
   * @param {number} weekNumber - ISO week number
   * @param {number} year - Year
   * @returns {Date} Start date of the week (Monday)
   */
  getWeekStartDate(weekNumber, year) {
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const weekStart = new Date(jan4);
    weekStart.setDate(jan4.getDate() - jan4Day + 1 + (weekNumber - 1) * 7);
    return weekStart;
  }

  /**
   * Manually trigger digest generation (for testing)
   * @returns {Promise<Object>} Generation result
   */
  async manualGeneration() {
    console.log('Manual weekly digest generation triggered');
    return await this.generateDigestsForAllUsers();
  }
}

export default new WeeklyDigestScheduler();
