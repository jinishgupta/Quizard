import { supabase } from '../db/index.js';

/**
 * Telemetry Service
 * Tracks engagement metrics for Orange Agent Jam competition scoring
 * 
 * Event Types:
 * - session: Gameplay session completion
 * - credit_redemption: Orange Game Pass credit transactions
 * - ai_usage: AI feature interactions (digests, question generation)
 * - challenge: Challenge participation and completion
 * 
 * All 9 credit redemption types tracked:
 * - CREDITS_STANDARD_ROUND
 * - CREDITS_HINT_ELIMINATE
 * - CREDITS_HINT_CLUE
 * - CREDITS_HINT_FIRST_LETTER
 * - CREDITS_EXPLANATION_PACK
 * - CREDITS_BONUS_ROUND
 * - CREDITS_CUSTOM_QUIZ
 * - CREDITS_SEND_CHALLENGE
 * - CREDITS_EARLY_DIGEST
 */
export class TelemetryService {
  /**
   * Track gameplay session completion
   * 
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Session data
   * @param {number} sessionData.duration - Session duration in seconds
   * @param {number} sessionData.questionsAnswered - Number of questions answered
   * @param {number} sessionData.correctAnswers - Number of correct answers
   * @param {number} sessionData.accuracy - Accuracy percentage
   * @param {string} sessionData.category - Category name
   * @param {string} sessionData.difficulty - Difficulty level
   * @param {number} sessionData.score - Total score earned
   * @returns {Promise<void>}
   */
  async trackSession(userId, sessionId, sessionData) {
    try {
      const { error } = await supabase
        .from('telemetry_events')
        .insert({
          user_id: userId,
          event_type: 'session',
          event_data: {
            session_id: sessionId,
            duration: sessionData.duration,
            questions_answered: sessionData.questionsAnswered,
            correct_answers: sessionData.correctAnswers,
            accuracy: sessionData.accuracy,
            category: sessionData.category,
            difficulty: sessionData.difficulty,
            score: sessionData.score,
            timestamp: new Date().toISOString(),
          },
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to track session telemetry:', error);
      // Don't throw - telemetry failure shouldn't block the main operation
    }
  }

  /**
   * Track credit redemption for competition scoring
   * 
   * @param {string} userId - User ID
   * @param {number} amount - Amount of credits redeemed
   * @param {string} actionType - Type of action (e.g., 'STANDARD_ROUND', 'HINT_ELIMINATE')
   * @param {string} orangeTransactionId - Orange transaction ID
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<void>}
   */
  async trackCreditRedemption(userId, amount, actionType, orangeTransactionId, metadata = {}) {
    try {
      const { error } = await supabase
        .from('telemetry_events')
        .insert({
          user_id: userId,
          event_type: 'credit_redemption',
          event_data: {
            amount: amount,
            action_type: actionType,
            orange_transaction_id: orangeTransactionId,
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to track credit redemption telemetry:', error);
      // Don't throw - telemetry failure shouldn't block the main operation
    }
  }

  /**
   * Track AI feature usage
   * 
   * @param {string} userId - User ID
   * @param {string} featureType - Type of AI feature ('weekly_digest', 'question_generation', 'contextual_clue')
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<void>}
   */
  async trackAIUsage(userId, featureType, metadata = {}) {
    try {
      const { error } = await supabase
        .from('telemetry_events')
        .insert({
          user_id: userId,
          event_type: 'ai_usage',
          event_data: {
            feature_type: featureType,
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to track AI usage telemetry:', error);
      // Don't throw - telemetry failure shouldn't block the main operation
    }
  }

  /**
   * Track challenge participation
   * 
   * @param {string} userId - User ID (challenger)
   * @param {string} challengeId - Challenge ID
   * @param {Object} challengeData - Challenge data
   * @param {string} challengeData.opponentId - Opponent user ID
   * @param {string} challengeData.winnerId - Winner user ID (null for tie)
   * @param {number} challengeData.challengerScore - Challenger score
   * @param {number} challengeData.opponentScore - Opponent score
   * @param {string} challengeData.status - Challenge status
   * @returns {Promise<void>}
   */
  async trackChallenge(userId, challengeId, challengeData) {
    try {
      const { error } = await supabase
        .from('telemetry_events')
        .insert({
          user_id: userId,
          event_type: 'challenge',
          event_data: {
            challenge_id: challengeId,
            opponent_id: challengeData.opponentId,
            winner_id: challengeData.winnerId,
            challenger_score: challengeData.challengerScore,
            opponent_score: challengeData.opponentScore,
            status: challengeData.status,
            timestamp: new Date().toISOString(),
          },
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to track challenge telemetry:', error);
      // Don't throw - telemetry failure shouldn't block the main operation
    }
  }

  /**
   * Get aggregated telemetry metrics for competition scoring
   * 
   * @param {Date} startDate - Start date for metrics
   * @param {Date} endDate - End date for metrics
   * @returns {Promise<Object>} Aggregated metrics
   */
  async getMetrics(startDate, endDate) {
    try {
      // Get all telemetry events in date range
      const { data: events, error } = await supabase
        .from('telemetry_events')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) throw error;

      // Aggregate metrics
      const metrics = {
        totalSessions: 0,
        totalCreditRedemptions: 0,
        totalAIInteractions: 0,
        totalChallenges: 0,
        uniqueUsers: new Set(),
        totalSessionDuration: 0,
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        creditRedemptionsByType: {},
      };

      events.forEach(event => {
        metrics.uniqueUsers.add(event.user_id);

        switch (event.event_type) {
          case 'session':
            metrics.totalSessions++;
            metrics.totalSessionDuration += event.event_data.duration || 0;
            metrics.totalQuestionsAnswered += event.event_data.questions_answered || 0;
            metrics.totalCorrectAnswers += event.event_data.correct_answers || 0;
            break;

          case 'credit_redemption':
            metrics.totalCreditRedemptions++;
            const actionType = event.event_data.action_type;
            if (actionType) {
              metrics.creditRedemptionsByType[actionType] = 
                (metrics.creditRedemptionsByType[actionType] || 0) + 1;
            }
            break;

          case 'ai_usage':
            metrics.totalAIInteractions++;
            break;

          case 'challenge':
            metrics.totalChallenges++;
            break;
        }
      });

      // Calculate averages
      const avgSessionDuration = metrics.totalSessions > 0
        ? metrics.totalSessionDuration / metrics.totalSessions
        : 0;

      const avgAccuracy = metrics.totalQuestionsAnswered > 0
        ? (metrics.totalCorrectAnswers / metrics.totalQuestionsAnswered) * 100
        : 0;

      return {
        totalSessions: metrics.totalSessions,
        totalCreditRedemptions: metrics.totalCreditRedemptions,
        totalAIInteractions: metrics.totalAIInteractions,
        totalChallenges: metrics.totalChallenges,
        uniqueUsers: metrics.uniqueUsers.size,
        avgSessionDuration: parseFloat(avgSessionDuration.toFixed(2)),
        avgAccuracy: parseFloat(avgAccuracy.toFixed(2)),
        creditRedemptionsByType: metrics.creditRedemptionsByType,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get telemetry metrics: ${error.message}`);
    }
  }

  /**
   * Get engagement statistics
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Engagement statistics
   */
  async getEngagementStats(startDate, endDate) {
    try {
      const { data: events, error } = await supabase
        .from('telemetry_events')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) throw error;

      // Calculate engagement metrics
      const dailyActiveUsers = new Map();
      const userSessions = new Map();
      const userCreditRedemptions = new Map();

      events.forEach(event => {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        
        // Track daily active users
        if (!dailyActiveUsers.has(date)) {
          dailyActiveUsers.set(date, new Set());
        }
        dailyActiveUsers.get(date).add(event.user_id);

        // Track user sessions
        if (event.event_type === 'session') {
          userSessions.set(event.user_id, (userSessions.get(event.user_id) || 0) + 1);
        }

        // Track user credit redemptions
        if (event.event_type === 'credit_redemption') {
          userCreditRedemptions.set(event.user_id, (userCreditRedemptions.get(event.user_id) || 0) + 1);
        }
      });

      // Calculate averages
      const avgDailyActiveUsers = dailyActiveUsers.size > 0
        ? Array.from(dailyActiveUsers.values()).reduce((sum, users) => sum + users.size, 0) / dailyActiveUsers.size
        : 0;

      const avgSessionsPerUser = userSessions.size > 0
        ? Array.from(userSessions.values()).reduce((sum, count) => sum + count, 0) / userSessions.size
        : 0;

      const avgRedemptionsPerUser = userCreditRedemptions.size > 0
        ? Array.from(userCreditRedemptions.values()).reduce((sum, count) => sum + count, 0) / userCreditRedemptions.size
        : 0;

      return {
        totalUsers: new Set(events.map(e => e.user_id)).size,
        avgDailyActiveUsers: parseFloat(avgDailyActiveUsers.toFixed(2)),
        avgSessionsPerUser: parseFloat(avgSessionsPerUser.toFixed(2)),
        avgRedemptionsPerUser: parseFloat(avgRedemptionsPerUser.toFixed(2)),
        totalEvents: events.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get engagement statistics: ${error.message}`);
    }
  }

  /**
   * Get credit redemption breakdown by type
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Credit redemption breakdown
   */
  async getCreditRedemptionBreakdown(startDate, endDate) {
    try {
      const { data: events, error } = await supabase
        .from('telemetry_events')
        .select('*')
        .eq('event_type', 'credit_redemption')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) throw error;

      // Aggregate by action type
      const breakdown = {};
      let totalAmount = 0;

      events.forEach(event => {
        const actionType = event.event_data.action_type;
        const amount = event.event_data.amount || 0;

        if (!breakdown[actionType]) {
          breakdown[actionType] = {
            count: 0,
            totalAmount: 0,
          };
        }

        breakdown[actionType].count++;
        breakdown[actionType].totalAmount += amount;
        totalAmount += amount;
      });

      return {
        breakdown,
        totalRedemptions: events.length,
        totalAmount,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get credit redemption breakdown: ${error.message}`);
    }
  }
}

export default new TelemetryService();
