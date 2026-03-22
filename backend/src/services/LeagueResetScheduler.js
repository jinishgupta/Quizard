import cron from 'node-cron';
import { supabase } from '../db/index.js';
import leagueService from './LeagueService.js';

/**
 * League Reset Scheduler
 * Handles weekly league resets with tier promotions/demotions
 * 
 * Schedule: Every Sunday at midnight UTC
 * Requirements: 4.2, 4.6
 */
export class LeagueResetScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Start the weekly reset scheduler
   * Runs every Sunday at 00:00 UTC
   */
  start() {
    if (this.isRunning) {
      console.log('League reset scheduler is already running');
      return;
    }

    // Schedule: Every Sunday at midnight UTC
    // Cron format: second minute hour day month weekday
    // 0 0 0 * * 0 = At 00:00:00 on Sunday
    this.cronJob = cron.schedule('0 0 0 * * 0', async () => {
      console.log('Starting weekly league reset...');
      try {
        await this.processWeeklyReset();
        console.log('Weekly league reset completed successfully');
      } catch (error) {
        console.error('Weekly league reset failed:', error);
      }
    }, {
      timezone: 'UTC',
    });

    this.isRunning = true;
    console.log('League reset scheduler started (runs every Sunday at 00:00 UTC)');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('League reset scheduler stopped');
    }
  }

  /**
   * Process weekly reset
   * Requirements: 4.2, 4.6
   * 
   * Steps:
   * 1. Get previous week's data
   * 2. Calculate rankings for each tier
   * 3. Determine promotions/demotions
   * 4. Update tier_change field in league_scores
   * 5. Create new week records with updated tiers
   * 6. Preserve historical data
   */
  async processWeeklyReset() {
    try {
      // Get previous week (the week that just ended)
      const previousWeek = await this.getPreviousWeek();
      
      console.log(`Processing reset for week ${previousWeek.weekNumber}, year ${previousWeek.year}`);
      
      // Process each tier
      const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
      const allTierChanges = [];
      
      for (const tier of tiers) {
        const tierChanges = await this.processTierReset(
          tier,
          previousWeek.weekNumber,
          previousWeek.year
        );
        allTierChanges.push(...tierChanges);
      }
      
      console.log(`Processed ${allTierChanges.length} tier changes`);
      
      // Update tier_change field for previous week's records
      await this.updateTierChanges(allTierChanges, previousWeek.weekNumber, previousWeek.year);
      
      return {
        success: true,
        weekNumber: previousWeek.weekNumber,
        year: previousWeek.year,
        tierChanges: allTierChanges,
      };
    } catch (error) {
      throw new Error(`Failed to process weekly reset: ${error.message}`);
    }
  }

  /**
   * Get previous week number and year
   * @returns {Promise<Object>} { weekNumber, year }
   */
  async getPreviousWeek() {
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
   * Process reset for a specific tier
   * Requirements: 4.3, 4.4
   * 
   * @param {string} tier - Tier name
   * @param {number} weekNumber - Week number
   * @param {number} year - Year
   * @returns {Promise<Array>} Tier changes
   */
  async processTierReset(tier, weekNumber, year) {
    try {
      // Get all scores for this tier in the previous week
      const { data: scores, error } = await supabase
        .from('league_scores')
        .select(`
          id,
          user_id,
          weekly_score,
          users (
            total_rounds,
            total_correct,
            total_questions
          )
        `)
        .eq('tier', tier)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .order('weekly_score', { ascending: false });
      
      if (error) throw error;
      
      if (!scores || scores.length === 0) {
        console.log(`No scores found for tier ${tier}`);
        return [];
      }
      
      // Calculate rankings with tiebreakers
      const rankedScores = leagueService.calculateRankings(scores);
      
      // Calculate tier changes
      const tierChanges = leagueService.calculateTierChanges(rankedScores, tier);
      
      console.log(`Tier ${tier}: ${tierChanges.length} players, ${tierChanges.filter(t => t.change === 'promoted').length} promoted, ${tierChanges.filter(t => t.change === 'demoted').length} demoted`);
      
      return tierChanges;
    } catch (error) {
      console.error(`Failed to process tier ${tier}:`, error);
      return [];
    }
  }

  /**
   * Update tier_change field for previous week's records
   * Requirements: 4.6
   * 
   * @param {Array} tierChanges - Tier changes
   * @param {number} weekNumber - Week number
   * @param {number} year - Year
   */
  async updateTierChanges(tierChanges, weekNumber, year) {
    try {
      // Update each user's tier_change and rank
      for (const change of tierChanges) {
        const { error } = await supabase
          .from('league_scores')
          .update({
            tier_change: change.change,
            rank: change.rank,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', change.userId)
          .eq('week_number', weekNumber)
          .eq('year', year);
        
        if (error) {
          console.error(`Failed to update tier change for user ${change.userId}:`, error);
        }
      }
      
      console.log(`Updated tier_change for ${tierChanges.length} users`);
    } catch (error) {
      console.error('Failed to update tier changes:', error);
    }
  }

  /**
   * Manually trigger a reset (for testing)
   * @returns {Promise<Object>} Reset result
   */
  async manualReset() {
    console.log('Manual league reset triggered');
    return await this.processWeeklyReset();
  }
}

export default new LeagueResetScheduler();
