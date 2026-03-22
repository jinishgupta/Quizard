import { supabase } from '../index.js';

/**
 * GameSession model for quiz session operations
 */
export class GameSession {
  /**
   * Create a new game session
   */
  static async create(userId, categoryId, difficulty) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        category_id: categoryId,
        difficulty,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get session by ID
   */
  static async findById(sessionId) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        categories (name, emoji, color),
        users (username, display_name, avatar)
      `)
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Record an answer for a session
   */
  static async recordAnswer(sessionId, questionText, correctAnswer, userAnswer, isCorrect, timeSpent, pointsEarned) {
    const { data, error } = await supabase
      .from('session_answers')
      .insert({
        session_id: sessionId,
        question_text: questionText,
        correct_answer: correctAnswer,
        user_answer: userAnswer,
        is_correct: isCorrect,
        time_spent: timeSpent,
        points_earned: pointsEarned,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Complete a session and calculate final stats
   */
  static async complete(sessionId) {
    // Get all answers for the session
    const { data: answers, error: answersError } = await supabase
      .from('session_answers')
      .select('*')
      .eq('session_id', sessionId);

    if (answersError) throw answersError;

    // Calculate stats
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.is_correct).length;
    const totalScore = answers.reduce((sum, a) => sum + a.points_earned, 0);
    const avgTime = answers.reduce((sum, a) => sum + a.time_spent, 0) / totalQuestions;

    // Update session
    const { data, error } = await supabase
      .from('game_sessions')
      .update({
        status: 'completed',
        score: totalScore,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        avg_time_per_question: avgTime.toFixed(2),
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return { session: data, answers };
  }

  /**
   * Get user's session history
   */
  static async getUserSessions(userId, limit = 10) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        categories (name, emoji, color)
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Get session answers
   */
  static async getAnswers(sessionId) {
    const { data, error } = await supabase
      .from('session_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('answered_at', { ascending: true });

    if (error) throw error;
    return data;
  }
}

export default GameSession;
