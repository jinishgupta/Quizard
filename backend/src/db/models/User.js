import { supabase } from '../index.js';

/**
 * User model for database operations
 */
export class User {
  /**
   * Create or update user from Orange ID data
   */
  static async upsertFromOrangeId(orangeUser) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        orange_id: orangeUser.id,
        email: orangeUser.email,
        username: orangeUser.displayName || orangeUser.name,
        display_name: orangeUser.displayName,
        bio: orangeUser.bio,
        avatar: orangeUser.picture,
        banner: orangeUser.banner,
        eth_address: orangeUser.ethAddress,
        provider: orangeUser.provider,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'orange_id',
        returning: 'representation',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Find user by Orange ID
   */
  static async findByOrangeId(orangeId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('orange_id', orangeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Find user by ID
   */
  static async findById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update user credits
   */
  static async updateCredits(userId, amount) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        credits: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user streak
   */
  static async updateStreak(userId, currentStreak, bestStreak) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        current_streak: currentStreak,
        best_streak: bestStreak,
        last_play_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user statistics after session
   */
  static async updateStats(userId, roundsIncrement, correctIncrement, questionsIncrement) {
    const { data, error } = await supabase.rpc('increment_user_stats', {
      p_user_id: userId,
      p_rounds: roundsIncrement,
      p_correct: correctIncrement,
      p_questions: questionsIncrement,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get user profile with stats
   */
  static async getProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        category_mastery (
          category_id,
          total_questions,
          correct_answers,
          mastery_level,
          progress_percentage,
          categories (name, emoji, color)
        ),
        user_badges (
          badge_id,
          earned_at,
          badges (name, description, emoji, rarity)
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}

export default User;
