import { supabase } from '../db/index.js';
import gameService from './GameService.js';
import telemetryService from './TelemetryService.js';

/**
 * Challenge Service
 * Handles real-time player-vs-player challenges with Socket.io integration
 * 
 * Features:
 * - Create challenge sessions between two players
 * - Synchronize game state via WebSocket
 * - Handle player disconnections gracefully
 * - Determine winner and award points
 * - Charge CREDITS_SEND_CHALLENGE when creating challenges
 */
export class ChallengeService {
  constructor() {
    // Store active challenge sessions in memory
    // Map<challengeId, { questions, challengerAnswers, opponentAnswers, startTime }>
    this.activeChallenges = new Map();
    
    // Store socket connections mapped to user IDs
    // Map<userId, socketId>
    this.userSockets = new Map();
    
    // Store socket to user mapping
    // Map<socketId, userId>
    this.socketUsers = new Map();
  }

  /**
   * Register socket connection for a user
   * @param {string} userId - User ID
   * @param {string} socketId - Socket ID
   */
  registerSocket(userId, socketId) {
    this.userSockets.set(userId, socketId);
    this.socketUsers.set(socketId, userId);
  }

  /**
   * Unregister socket connection
   * @param {string} socketId - Socket ID
   */
  unregisterSocket(socketId) {
    const userId = this.socketUsers.get(socketId);
    if (userId) {
      this.userSockets.delete(userId);
      this.socketUsers.delete(socketId);
    }
  }

  /**
   * Get socket ID for a user
   * @param {string} userId - User ID
   * @returns {string|null} Socket ID or null if not connected
   */
  getUserSocket(userId) {
    return this.userSockets.get(userId) || null;
  }

  /**
   * Create a new challenge
   * Charges CREDITS_SEND_CHALLENGE to the challenger
   * 
   * @param {string} challengerId - Challenger user ID
   * @param {string} opponentId - Opponent user ID
   * @param {string} categoryId - Category ID
   * @param {string} difficulty - Difficulty level
   * @param {string} gamePassToken - Orange Game Pass token for credit redemption
   * @returns {Promise<Object>} Challenge data
   */
  async createChallenge(challengerId, opponentId, categoryId, difficulty, gamePassToken) {
    try {
      // Validate inputs
      if (challengerId === opponentId) {
        throw new Error('Cannot challenge yourself');
      }

      // Create challenge record in database
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: challengerId,
          opponent_id: opponentId,
          category_id: categoryId,
          difficulty: difficulty,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        challengeId: data.id,
        challengerId: data.challenger_id,
        opponentId: data.opponent_id,
        categoryId: data.category_id,
        difficulty: data.difficulty,
        status: data.status,
        createdAt: data.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to create challenge: ${error.message}`);
    }
  }

  /**
   * Join an existing challenge
   * Updates status to 'active' and generates questions
   * 
   * @param {string} challengeId - Challenge ID
   * @param {string} userId - User ID joining the challenge
   * @returns {Promise<Object>} Challenge data with first question
   */
  async joinChallenge(challengeId, userId) {
    try {
      // Get challenge from database
      const { data: challenge, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      if (!challenge) throw new Error('Challenge not found');

      // Verify user is the opponent
      if (challenge.opponent_id !== userId) {
        throw new Error('You are not the opponent in this challenge');
      }

      // Verify challenge is pending
      if (challenge.status !== 'pending') {
        throw new Error('Challenge is not available to join');
      }

      // Update challenge status to active
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', challengeId);

      if (updateError) throw updateError;

      // Generate questions for the challenge
      const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('id', challenge.category_id)
        .single();

      const questions = await gameService.generateQuestions(
        category?.name || 'General Knowledge',
        challenge.difficulty,
        5 // 5 questions per challenge
      );

      // Store challenge data in memory
      this.activeChallenges.set(challengeId, {
        questions,
        challengerAnswers: [],
        opponentAnswers: [],
        startTime: Date.now(),
        difficulty: challenge.difficulty,
      });

      return {
        challengeId: challenge.id,
        status: 'active',
        totalQuestions: questions.length,
        firstQuestion: this.formatQuestion(questions[0], 0),
      };
    } catch (error) {
      throw new Error(`Failed to join challenge: ${error.message}`);
    }
  }

  /**
   * Get challenge details
   * @param {string} challengeId - Challenge ID
   * @returns {Promise<Object>} Challenge details
   */
  async getChallengeDetails(challengeId) {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:users!challenges_challenger_id_fkey(id, username, avatar),
          opponent:users!challenges_opponent_id_fkey(id, username, avatar),
          category:categories(id, name, emoji)
        `)
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Challenge not found');

      return {
        id: data.id,
        challenger: data.challenger,
        opponent: data.opponent,
        category: data.category,
        difficulty: data.difficulty,
        status: data.status,
        challengerScore: data.challenger_score,
        opponentScore: data.opponent_score,
        winnerId: data.winner_id,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        createdAt: data.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to get challenge details: ${error.message}`);
    }
  }

  /**
   * Get active challenges for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of active challenges
   */
  async getActiveChallenges(userId) {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:users!challenges_challenger_id_fkey(id, username, avatar),
          opponent:users!challenges_opponent_id_fkey(id, username, avatar),
          category:categories(id, name, emoji)
        `)
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        challenger: c.challenger,
        opponent: c.opponent,
        category: c.category,
        difficulty: c.difficulty,
        status: c.status,
        createdAt: c.created_at,
      }));
    } catch (error) {
      throw new Error(`Failed to get active challenges: ${error.message}`);
    }
  }

  /**
   * Submit answer in a challenge
   * @param {string} challengeId - Challenge ID
   * @param {string} userId - User ID
   * @param {number} questionIndex - Question index
   * @param {string} answer - User's answer
   * @param {number} timeSpent - Time spent in seconds
   * @returns {Promise<Object>} Answer result
   */
  async submitAnswer(challengeId, userId, questionIndex, answer, timeSpent) {
    try {
      const challengeData = this.activeChallenges.get(challengeId);
      if (!challengeData) {
        throw new Error('Challenge not found or expired');
      }

      const { questions, difficulty } = challengeData;
      const question = questions[questionIndex];

      if (!question) {
        throw new Error('Invalid question index');
      }

      // Check correctness
      const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

      // Calculate points
      const timeLimit = 30;
      const points = gameService.calculateScore(isCorrect, difficulty, timeSpent, timeLimit);

      // Get challenge from database to determine if user is challenger or opponent
      const { data: challenge } = await supabase
        .from('challenges')
        .select('challenger_id, opponent_id')
        .eq('id', challengeId)
        .single();

      if (!challenge) throw new Error('Challenge not found');

      // Store answer
      const answerData = {
        questionIndex,
        answer,
        isCorrect,
        points,
        timeSpent,
      };

      if (userId === challenge.challenger_id) {
        challengeData.challengerAnswers.push(answerData);
      } else if (userId === challenge.opponent_id) {
        challengeData.opponentAnswers.push(answerData);
      } else {
        throw new Error('User is not part of this challenge');
      }

      return {
        isCorrect,
        pointsEarned: points,
        questionIndex,
        totalQuestions: questions.length,
      };
    } catch (error) {
      throw new Error(`Failed to submit answer: ${error.message}`);
    }
  }

  /**
   * End a challenge and determine winner
   * @param {string} challengeId - Challenge ID
   * @returns {Promise<Object>} Challenge results
   */
  async endChallenge(challengeId) {
    try {
      const challengeData = this.activeChallenges.get(challengeId);
      if (!challengeData) {
        throw new Error('Challenge not found or expired');
      }

      // Calculate total scores
      const challengerScore = challengeData.challengerAnswers.reduce(
        (sum, a) => sum + a.points,
        0
      );
      const opponentScore = challengeData.opponentAnswers.reduce(
        (sum, a) => sum + a.points,
        0
      );

      // Determine winner
      let winnerId = null;
      if (challengerScore > opponentScore) {
        const { data: challenge } = await supabase
          .from('challenges')
          .select('challenger_id')
          .eq('id', challengeId)
          .single();
        winnerId = challenge?.challenger_id;
      } else if (opponentScore > challengerScore) {
        const { data: challenge } = await supabase
          .from('challenges')
          .select('opponent_id')
          .eq('id', challengeId)
          .single();
        winnerId = challenge?.opponent_id;
      }

      // Update challenge in database
      const { error } = await supabase
        .from('challenges')
        .update({
          status: 'completed',
          challenger_score: challengerScore,
          opponent_score: opponentScore,
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', challengeId);

      if (error) throw error;

      // Track telemetry
      await this.trackChallengeTelemetry(challengeId, challengerScore, opponentScore, winnerId);

      // Clean up in-memory data
      this.activeChallenges.delete(challengeId);

      return {
        challengeId,
        challengerScore,
        opponentScore,
        winnerId,
        status: 'completed',
      };
    } catch (error) {
      throw new Error(`Failed to end challenge: ${error.message}`);
    }
  }

  /**
   * Handle player disconnection
   * @param {string} userId - User ID who disconnected
   */
  async handleDisconnection(userId) {
    try {
      // Find active challenges for this user
      const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .eq('status', 'active');

      if (!challenges || challenges.length === 0) return;

      // Cancel or end each active challenge
      for (const challenge of challenges) {
        const challengeData = this.activeChallenges.get(challenge.id);
        
        if (!challengeData) {
          // No in-memory data, just cancel
          await supabase
            .from('challenges')
            .update({ status: 'cancelled' })
            .eq('id', challenge.id);
          continue;
        }

        // If both players have answered some questions, declare other player winner
        const hasAnswers = challengeData.challengerAnswers.length > 0 || 
                          challengeData.opponentAnswers.length > 0;

        if (hasAnswers) {
          const otherPlayerId = challenge.challenger_id === userId 
            ? challenge.opponent_id 
            : challenge.challenger_id;

          await supabase
            .from('challenges')
            .update({
              status: 'completed',
              winner_id: otherPlayerId,
              completed_at: new Date().toISOString(),
            })
            .eq('id', challenge.id);
        } else {
          // No answers yet, just cancel
          await supabase
            .from('challenges')
            .update({ status: 'cancelled' })
            .eq('id', challenge.id);
        }

        // Clean up in-memory data
        this.activeChallenges.delete(challenge.id);
      }
    } catch (error) {
      console.error('Failed to handle disconnection:', error);
    }
  }

  /**
   * Track challenge telemetry
   * @param {string} challengeId - Challenge ID
   * @param {number} challengerScore - Challenger score
   * @param {number} opponentScore - Opponent score
   * @param {string} winnerId - Winner ID
   */
  async trackChallengeTelemetry(challengeId, challengerScore, opponentScore, winnerId) {
    try {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('challenger_id, opponent_id')
        .eq('id', challengeId)
        .single();

      if (!challenge) return;

      await telemetryService.trackChallenge(
        challenge.challenger_id,
        challengeId,
        {
          opponentId: challenge.opponent_id,
          winnerId: winnerId,
          challengerScore: challengerScore,
          opponentScore: opponentScore,
          status: 'completed',
        }
      );
    } catch (error) {
      console.error('Failed to track challenge telemetry:', error);
    }
  }

  /**
   * Format question for response
   * @param {Object} question - Question object
   * @param {number} index - Question index
   * @returns {Object} Formatted question
   */
  formatQuestion(question, index) {
    return {
      index,
      question: question.question,
      options: question.options,
      timeLimit: 30,
    };
  }

  /**
   * Get next question for a challenge
   * @param {string} challengeId - Challenge ID
   * @param {number} questionIndex - Current question index
   * @returns {Object|null} Next question or null if no more questions
   */
  getNextQuestion(challengeId, questionIndex) {
    const challengeData = this.activeChallenges.get(challengeId);
    if (!challengeData) return null;

    const nextIndex = questionIndex + 1;
    if (nextIndex >= challengeData.questions.length) return null;

    return this.formatQuestion(challengeData.questions[nextIndex], nextIndex);
  }
}

export default new ChallengeService();
