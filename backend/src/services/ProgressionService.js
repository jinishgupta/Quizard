import { supabase } from '../db/index.js';
import { User } from '../db/models/User.js';
import { Category } from '../db/models/Category.js';
import badgeService from './BadgeService.js';

/**
 * Progression Service
 * Handles user progression tracking, mastery calculation, and streak management
 */
export class ProgressionService {
  /**
   * Calculate mastery level based on total questions and accuracy
   * 
   * Thresholds:
   * - Expert: 100+ questions, 80%+ accuracy
   * - Adept: 50+ questions, 70%+ accuracy
   * - Novice: 20+ questions, 60%+ accuracy
   * - Beginner: < 20 questions or < 60% accuracy
   * 
   * @param {number} correctAnswers - Number of correct answers
   * @param {number} totalQuestions - Total questions answered
   * @returns {Object} { level: string, progress: number }
   */
  calculateMasteryLevel(correctAnswers, totalQuestions) {
    if (totalQuestions === 0) {
      return { level: 'Beginner', progress: 0 };
    }

    const accuracy = (correctAnswers / totalQuestions) * 100;

    // Thresholds
    const thresholds = {
      Expert: { minQuestions: 100, minAccuracy: 80 },
      Adept: { minQuestions: 50, minAccuracy: 70 },
      Novice: { minQuestions: 20, minAccuracy: 60 },
      Beginner: { minQuestions: 0, minAccuracy: 0 },
    };

    let level = 'Beginner';
    let progress = 0;

    if (totalQuestions >= thresholds.Expert.minQuestions && accuracy >= thresholds.Expert.minAccuracy) {
      level = 'Expert';
      progress = Math.min(100, accuracy);
    } else if (totalQuestions >= thresholds.Adept.minQuestions && accuracy >= thresholds.Adept.minAccuracy) {
      level = 'Adept';
      progress = Math.floor((totalQuestions / thresholds.Expert.minQuestions) * 100);
    } else if (totalQuestions >= thresholds.Novice.minQuestions && accuracy >= thresholds.Novice.minAccuracy) {
      level = 'Novice';
      progress = Math.floor((totalQuestions / thresholds.Adept.minQuestions) * 100);
    } else {
      level = 'Beginner';
      progress = Math.floor((totalQuestions / thresholds.Novice.minQuestions) * 100);
    }

    return { level, progress: Math.min(100, progress) };
  }

  /**
   * Update streak based on last play date
   * 
   * Rules:
   * - Same day: no change
   * - Consecutive day: increment by 1
   * - Missed days: reset to 1
   * 
   * @param {string} userId - User ID
   * @param {Date|string|null} lastPlayDate - Last play date
   * @returns {Promise<Object>} { currentStreak: number, bestStreak: number }
   */
  async updateStreak(userId, lastPlayDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 1;
    let bestStreak = 1;

    // Get user's current streak data
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (lastPlayDate) {
      const last = new Date(lastPlayDate);
      last.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, no change
        currentStreak = user.current_streak || 1;
        bestStreak = user.best_streak || 1;
      } else if (daysDiff === 1) {
        // Consecutive day, increment
        currentStreak = (user.current_streak || 0) + 1;
        bestStreak = Math.max(currentStreak, user.best_streak || 0);
      } else {
        // Missed days, reset
        currentStreak = 1;
        bestStreak = user.best_streak || 1;
      }
    } else {
      // First time playing
      currentStreak = 1;
      bestStreak = 1;
    }

    // Update user streak in database
    await User.updateStreak(userId, currentStreak, bestStreak);

    return { currentStreak, bestStreak };
  }

  /**
   * Update category mastery after a session
   * 
   * @param {string} userId - User ID
   * @param {string} categoryId - Category ID
   * @param {number} correctAnswers - Number of correct answers in session
   * @param {number} totalQuestions - Total questions in session
   * @returns {Promise<Object>} Updated mastery data
   */
  async updateCategoryMastery(userId, categoryId, correctAnswers, totalQuestions) {
    // Get or create mastery record
    const mastery = await Category.getOrCreateMastery(userId, categoryId);

    // Calculate new totals
    const newTotalQuestions = mastery.total_questions + totalQuestions;
    const newCorrectAnswers = mastery.correct_answers + correctAnswers;

    // Calculate new mastery level
    const { level, progress } = this.calculateMasteryLevel(newCorrectAnswers, newTotalQuestions);

    // Update mastery in database
    const { data, error } = await supabase
      .from('category_mastery')
      .update({
        total_questions: newTotalQuestions,
        correct_answers: newCorrectAnswers,
        mastery_level: level,
        progress_percentage: progress,
        last_played: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user statistics after session completion
   * 
   * @param {string} userId - User ID
   * @param {number} correctAnswers - Number of correct answers
   * @param {number} totalQuestions - Total questions answered
   * @returns {Promise<void>}
   */
  async updateUserStatistics(userId, correctAnswers, totalQuestions) {
    // Increment user statistics
    const { data, error } = await supabase
      .from('users')
      .select('total_rounds, total_correct, total_questions')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const newTotalRounds = (data.total_rounds || 0) + 1;
    const newTotalCorrect = (data.total_correct || 0) + correctAnswers;
    const newTotalQuestions = (data.total_questions || 0) + totalQuestions;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_rounds: newTotalRounds,
        total_correct: newTotalCorrect,
        total_questions: newTotalQuestions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;
  }

  /**
   * Process session completion - update all progression metrics
   * 
   * @param {string} userId - User ID
   * @param {string} categoryId - Category ID
   * @param {number} correctAnswers - Number of correct answers
   * @param {number} totalQuestions - Total questions answered
   * @returns {Promise<Object>} Updated progression data
   */
  async processSessionCompletion(userId, categoryId, correctAnswers, totalQuestions) {
    try {
      // Get user's last play date
      const user = await User.findById(userId);
      
      // Update streak
      const streakData = await this.updateStreak(userId, user?.last_play_date);

      // Update category mastery
      const masteryData = await this.updateCategoryMastery(userId, categoryId, correctAnswers, totalQuestions);

      // Update user statistics
      await this.updateUserStatistics(userId, correctAnswers, totalQuestions);

      // Check and award badges
      const newBadges = await badgeService.checkAndAwardBadges(userId);

      return {
        streak: streakData,
        mastery: masteryData,
        newBadges,
      };
    } catch (error) {
      throw new Error(`Failed to process session completion: ${error.message}`);
    }
  }
}

export default new ProgressionService();
