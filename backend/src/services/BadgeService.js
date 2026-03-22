import { supabase } from '../db/index.js';

/**
 * Badge Service
 * Handles badge criteria evaluation and award logic
 */
export class BadgeService {
  /**
   * Check badge criteria for a user and award eligible badges
   * Called after session completion
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of newly earned badges
   */
  async checkAndAwardBadges(userId) {
    try {
      // Get all active badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true);

      if (badgesError) throw badgesError;

      // Get user's already earned badges
      const { data: earnedBadges, error: earnedError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      if (earnedError) throw earnedError;

      const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id));

      // Get user data for criteria evaluation
      const userData = await this.getUserDataForBadges(userId);

      // Check each badge that hasn't been earned yet
      const newlyEarnedBadges = [];

      for (const badge of badges) {
        // Skip if already earned
        if (earnedBadgeIds.has(badge.id)) {
          continue;
        }

        // Check if criteria is met
        const criteriaMet = await this.checkBadgeCriteria(badge.criteria, userData);

        if (criteriaMet) {
          // Award the badge
          const awarded = await this.awardBadge(userId, badge.id);
          if (awarded) {
            newlyEarnedBadges.push({
              id: badge.id,
              name: badge.name,
              description: badge.description,
              emoji: badge.emoji,
              rarity: badge.rarity,
            });
          }
        }
      }

      return newlyEarnedBadges;
    } catch (error) {
      throw new Error(`Failed to check and award badges: ${error.message}`);
    }
  }

  /**
   * Check if badge criteria is met
   * 
   * @param {Object} criteria - Badge criteria (JSONB object)
   * @param {Object} userData - User data for evaluation
   * @returns {Promise<boolean>} True if criteria is met
   */
  async checkBadgeCriteria(criteria, userData) {
    try {
      const { type } = criteria;

      switch (type) {
        case 'sessions_completed':
          return userData.totalRounds >= criteria.count;

        case 'correct_answers':
          return userData.totalCorrect >= criteria.count;

        case 'streak':
          return userData.currentStreak >= criteria.days;

        case 'categories_played':
          return userData.categoriesPlayed >= criteria.count;

        case 'perfect_session':
          // Check if user has any perfect session with min questions
          return userData.hasPerfectSession >= criteria.min_questions;

        case 'fast_answers':
          // Check if user has fast answers count
          return userData.fastAnswersCount >= criteria.count;

        case 'mastery_level':
          // Check if user has reached mastery level in required number of categories
          return userData.expertCategoriesCount >= criteria.count;

        case 'challenges_won':
          return userData.challengesWon >= criteria.count;

        case 'league_rank':
          // Check if user's current league rank is within max_rank
          return userData.leagueRank > 0 && userData.leagueRank <= criteria.max_rank;

        case 'league_tier':
          // Check if user has reached the specified tier
          return userData.leagueTier === criteria.tier;

        default:
          return false;
      }
    } catch (error) {
      throw new Error(`Failed to check badge criteria: ${error.message}`);
    }
  }

  /**
   * Award a badge to a user
   * Prevents duplicate awards using UNIQUE constraint
   * 
   * @param {string} userId - User ID
   * @param {string} badgeId - Badge ID
   * @returns {Promise<boolean>} True if badge was awarded
   */
  async awardBadge(userId, badgeId) {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
          earned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Check if error is due to duplicate (UNIQUE constraint violation)
        if (error.code === '23505') {
          // Badge already awarded, return false
          return false;
        }
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to award badge: ${error.message}`);
    }
  }

  /**
   * Get user data needed for badge criteria evaluation
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data object
   */
  async getUserDataForBadges(userId) {
    try {
      // Get user basic stats
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('total_rounds, total_correct, total_questions, current_streak, best_streak')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get categories played count
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('game_sessions')
        .select('category_id')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (categoriesError) throw categoriesError;

      const uniqueCategories = new Set(categoriesData.map(s => s.category_id));
      const categoriesPlayed = uniqueCategories.size;

      // Get expert level categories count
      const { data: masteryData, error: masteryError } = await supabase
        .from('category_mastery')
        .select('mastery_level')
        .eq('user_id', userId)
        .eq('mastery_level', 'Expert');

      if (masteryError) throw masteryError;

      const expertCategoriesCount = masteryData.length;

      // Check for perfect sessions
      const { data: perfectSessions, error: perfectError } = await supabase
        .from('game_sessions')
        .select('total_questions, correct_answers')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('total_questions', 10);

      if (perfectError) throw perfectError;

      const hasPerfectSession = perfectSessions.some(
        s => s.correct_answers === s.total_questions && s.total_questions >= 10
      ) ? 10 : 0;

      // Get fast answers count (answers under 5 seconds)
      const { data: fastAnswers, error: fastError } = await supabase
        .from('session_answers')
        .select('time_spent')
        .eq('is_correct', true)
        .lte('time_spent', 5);

      if (fastError) throw fastError;

      const fastAnswersCount = fastAnswers.length;

      // Get challenges won count
      const { data: challengesWon, error: challengesError } = await supabase
        .from('challenges')
        .select('winner_id')
        .eq('winner_id', userId)
        .eq('status', 'completed');

      if (challengesError) throw challengesError;

      const challengesWonCount = challengesWon.length;

      // Get current league rank and tier
      const { data: leagueData, error: leagueError } = await supabase
        .from('league_scores')
        .select('rank, tier')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const leagueRank = leagueData?.rank || 0;
      const leagueTier = leagueData?.tier || 'Bronze';

      return {
        totalRounds: user.total_rounds || 0,
        totalCorrect: user.total_correct || 0,
        totalQuestions: user.total_questions || 0,
        currentStreak: user.current_streak || 0,
        bestStreak: user.best_streak || 0,
        categoriesPlayed,
        expertCategoriesCount,
        hasPerfectSession,
        fastAnswersCount,
        challengesWon: challengesWonCount,
        leagueRank,
        leagueTier,
      };
    } catch (error) {
      throw new Error(`Failed to get user data for badges: ${error.message}`);
    }
  }
}

export default new BadgeService();
