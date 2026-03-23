import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { supabase } from '../db/index.js';
import creditService from './CreditService.js';
import telemetryService from './TelemetryService.js';

/**
 * AI Service
 * Handles Google Gemini integration for AI-powered features
 * 
 * Features:
 * - Weekly performance digests (Requirement 7.1, 7.2)
 * - Question generation (Requirement 7.5, 9.5)
 * - Performance analysis
 * - Contextual clue generation
 */
export class AIService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    this.model = config.gemini.model;
  }

  /**
   * Generate weekly digest for a user
   * Analyzes weekly performance across categories and generates personalized summary
   * 
   * Requirements: 7.1, 7.2
   * 
   * @param {string} userId - User ID
   * @param {number} weekNumber - ISO week number
   * @param {number} year - Year
   * @returns {Promise<Object>} Weekly digest with summary, strengths, suggestions, fun_fact
   */
  async generateWeeklyDigest(userId, weekNumber, year) {
    try {
      // Get weekly performance data
      const weeklyStats = await this.getWeeklyStats(userId, weekNumber, year);

      if (!weeklyStats || weeklyStats.totalSessions === 0) {
        throw new Error('No activity data for this week');
      }

      // Analyze performance
      const analysis = await this.analyzePerformance(userId, weeklyStats);

      // Generate digest using Gemini
      const prompt = `Generate a personalized weekly performance digest for a trivia quiz player.

Weekly Statistics:
- Total Sessions: ${weeklyStats.totalSessions}
- Total Questions: ${weeklyStats.totalQuestions}
- Correct Answers: ${weeklyStats.correctAnswers}
- Overall Accuracy: ${weeklyStats.accuracy.toFixed(1)}%
- Average Time per Question: ${weeklyStats.avgTimePerQuestion.toFixed(1)}s
- Total Points: ${weeklyStats.totalPoints}
- League Rank: ${weeklyStats.leagueRank || 'N/A'}

Category Performance:
${weeklyStats.categoryBreakdown.map(cat => 
  `- ${cat.categoryName}: ${cat.questionsAnswered} questions, ${cat.accuracy.toFixed(1)}% accuracy`
).join('\n')}

Analysis:
${analysis.insights}

Generate a JSON response with:
1. summary: A 2-3 sentence encouraging summary of their week
2. strengths: Array of 2-3 specific strengths (e.g., "Excellent accuracy in Science category")
3. suggestions: Array of 2-3 actionable improvement suggestions
4. fun_fact: One interesting trivia fact related to their best category

Format as JSON:
{
  "summary": "...",
  "strengths": ["...", "..."],
  "suggestions": ["...", "..."],
  "fun_fact": "..."
}`;

      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });
      const text = result.text.trim();

      // Extract JSON from response
      let jsonText = text;
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.substring(0, jsonText.length - 3);
      }
      jsonText = jsonText.trim();

      const digest = JSON.parse(jsonText);

      // Store digest in database
      const { data, error } = await supabase
        .from('weekly_digests')
        .upsert({
          user_id: userId,
          week_number: weekNumber,
          year: year,
          summary: digest.summary,
          strengths: digest.strengths,
          suggestions: digest.suggestions,
          fun_fact: digest.fun_fact,
          generated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,week_number,year',
        })
        .select()
        .single();

      if (error) throw error;

      // Track AI usage in telemetry
      await this.trackAIUsage(userId, 'weekly_digest', { weekNumber, year });

      return data;
    } catch (error) {
      throw new Error(`Failed to generate weekly digest: ${error.message}`);
    }
  }

  /**
   * Generate quiz questions via AI
   * 
   * Requirements: 7.5, 9.5
   * 
   * @param {string} topic - Topic/category name
   * @param {string} difficulty - Difficulty level (easy, medium, hard)
   * @param {number} count - Number of questions to generate
   * @returns {Promise<Array>} Array of generated questions
   */
  async generateQuestions(topic, difficulty, count = 10) {
    try {
      const prompt = `Generate ${count} multiple-choice trivia questions about ${topic} at ${difficulty} difficulty level.

Requirements:
- Each question should have exactly 4 answer options (A, B, C, D)
- Only ONE option should be correct
- Include a brief explanation for the correct answer
- Questions should be appropriate for ${difficulty} difficulty
- Format as JSON array

Example format:
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": "Paris",
    "explanation": "Paris has been the capital of France since the 12th century."
  }
]

Generate ${count} questions now:`;

      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });
      const text = result.text.trim();

      // Extract JSON from response
      let jsonText = text;
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.substring(0, jsonText.length - 3);
      }
      jsonText = jsonText.trim();

      const questions = JSON.parse(jsonText);

      // Validate questions
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format from AI');
      }

      return questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'No explanation provided.',
      }));
    } catch (error) {
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  /**
   * Analyze user performance and identify strengths/weaknesses
   * 
   * Requirements: 7.2
   * 
   * @param {string} userId - User ID
   * @param {Object} weekData - Weekly statistics
   * @returns {Promise<Object>} Analysis with insights
   */
  async analyzePerformance(userId, weekData) {
    try {
      // Identify strengths (categories with >75% accuracy)
      const strengths = weekData.categoryBreakdown
        .filter(cat => cat.accuracy >= 75)
        .map(cat => cat.categoryName);

      // Identify weaknesses (categories with <60% accuracy)
      const weaknesses = weekData.categoryBreakdown
        .filter(cat => cat.accuracy < 60)
        .map(cat => cat.categoryName);

      // Speed analysis
      const speedAnalysis = weekData.avgTimePerQuestion < 15
        ? 'Fast responder'
        : weekData.avgTimePerQuestion < 25
        ? 'Moderate pace'
        : 'Thoughtful responder';

      // Consistency analysis
      const consistencyScore = weekData.totalSessions >= 5
        ? 'Highly consistent'
        : weekData.totalSessions >= 3
        ? 'Moderately consistent'
        : 'Occasional player';

      const insights = `
Strengths: ${strengths.length > 0 ? strengths.join(', ') : 'Building foundation'}
Areas for improvement: ${weaknesses.length > 0 ? weaknesses.join(', ') : 'Well-rounded performance'}
Response speed: ${speedAnalysis}
Play consistency: ${consistencyScore}
      `.trim();

      return {
        strengths,
        weaknesses,
        speedAnalysis,
        consistencyScore,
        insights,
      };
    } catch (error) {
      throw new Error(`Failed to analyze performance: ${error.message}`);
    }
  }

  /**
   * Generate contextual clue for a question
   * 
   * Requirements: 9.5
   * 
   * @param {string} question - Question text
   * @param {string} correctAnswer - Correct answer
   * @returns {Promise<string>} Contextual clue
   */
  async generateContextualClue(question, correctAnswer) {
    try {
      const prompt = `Generate a helpful but not too obvious clue for this trivia question:

Question: ${question}
Correct Answer: ${correctAnswer}

Provide a single sentence clue that hints at the answer without giving it away directly.`;

      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });
      const clue = result.text.trim();

      return clue;
    } catch (error) {
      throw new Error(`Failed to generate contextual clue: ${error.message}`);
    }
  }

  /**
   * Get weekly statistics for a user
   * 
   * @param {string} userId - User ID
   * @param {number} weekNumber - ISO week number
   * @param {number} year - Year
   * @returns {Promise<Object>} Weekly statistics
   */
  async getWeeklyStats(userId, weekNumber, year) {
    try {
      // Get all sessions for the week
      const weekStart = this.getWeekStartDate(weekNumber, year);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select(`
          id,
          score,
          correct_answers,
          total_questions,
          avg_time_per_question,
          category_id,
          categories (name)
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', weekStart.toISOString())
        .lt('completed_at', weekEnd.toISOString());

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        return null;
      }

      // Calculate overall stats
      const totalSessions = sessions.length;
      const totalQuestions = sessions.reduce((sum, s) => sum + s.total_questions, 0);
      const correctAnswers = sessions.reduce((sum, s) => sum + s.correct_answers, 0);
      const totalPoints = sessions.reduce((sum, s) => sum + s.score, 0);
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const avgTimePerQuestion = sessions.reduce((sum, s) => sum + parseFloat(s.avg_time_per_question || 0), 0) / totalSessions;

      // Category breakdown
      const categoryMap = new Map();
      sessions.forEach(session => {
        const categoryName = session.categories?.name || 'Unknown';
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            categoryName,
            questionsAnswered: 0,
            correctAnswers: 0,
            accuracy: 0,
          });
        }
        const cat = categoryMap.get(categoryName);
        cat.questionsAnswered += session.total_questions;
        cat.correctAnswers += session.correct_answers;
        cat.accuracy = (cat.correctAnswers / cat.questionsAnswered) * 100;
      });

      const categoryBreakdown = Array.from(categoryMap.values());

      // Get league rank
      const { data: leagueData } = await supabase
        .from('league_scores')
        .select('rank')
        .eq('user_id', userId)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .single();

      return {
        totalSessions,
        totalQuestions,
        correctAnswers,
        totalPoints,
        accuracy,
        avgTimePerQuestion,
        categoryBreakdown,
        leagueRank: leagueData?.rank,
      };
    } catch (error) {
      throw new Error(`Failed to get weekly stats: ${error.message}`);
    }
  }

  /**
   * Request early digest (costs CREDITS_EARLY_DIGEST)
   * 
   * Requirements: 7.1
   * 
   * @param {string} userId - User ID
   * @param {string} gamePassToken - Orange Game Pass token for credit redemption
   * @returns {Promise<Object>} Early digest result
   */
  async requestEarlyDigest(userId, gamePassToken) {
    try {
      // Get current week
      const { weekNumber, year } = this.getCurrentWeek();

      // Check if digest already exists for this week
      const { data: existingDigest } = await supabase
        .from('weekly_digests')
        .select('*')
        .eq('user_id', userId)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .single();

      if (existingDigest) {
        return {
          success: true,
          digest: existingDigest,
          message: 'Digest already generated for this week',
          creditsCharged: 0,
        };
      }

      // Redeem credits
      const creditCost = creditService.constructor.COSTS.EARLY_DIGEST;
      const redemptionResult = await creditService.redeemCredits(
        userId,
        creditCost,
        'EARLY_DIGEST',
        gamePassToken,
        { weekNumber, year }
      );

      if (!redemptionResult.success) {
        throw new Error(redemptionResult.message || 'Insufficient credits');
      }

      // Generate digest
      const digest = await this.generateWeeklyDigest(userId, weekNumber, year);

      return {
        success: true,
        digest,
        creditsCharged: creditCost,
        newBalance: redemptionResult.newBalance,
      };
    } catch (error) {
      throw new Error(`Failed to request early digest: ${error.message}`);
    }
  }

  /**
   * Get current ISO week number and year
   * 
   * @returns {Object} { weekNumber, year }
   */
  getCurrentWeek() {
    const now = new Date();
    const weekNumber = this.getISOWeek(now);
    const year = now.getFullYear();
    return { weekNumber, year };
  }

  /**
   * Get ISO week number for a date
   * 
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
   * Track AI usage in telemetry
   * 
   * @param {string} userId - User ID
   * @param {string} featureType - Type of AI feature used
   * @param {Object} metadata - Additional metadata
   */
  async trackAIUsage(userId, featureType, metadata = {}) {
    try {
      await telemetryService.trackAIUsage(userId, featureType, metadata);
    } catch (error) {
      console.error('Failed to track AI usage:', error);
      // Don't throw - telemetry failure shouldn't block the main operation
    }
  }

  /**
   * Get user's weekly digest
   * 
   * @param {string} userId - User ID
   * @param {number} weekNumber - ISO week number (optional, defaults to current week)
   * @param {number} year - Year (optional, defaults to current year)
   * @returns {Promise<Object>} Weekly digest
   */
  async getWeeklyDigest(userId, weekNumber = null, year = null) {
    try {
      const currentWeek = this.getCurrentWeek();
      const targetWeek = weekNumber || currentWeek.weekNumber;
      const targetYear = year || currentWeek.year;

      const { data, error } = await supabase
        .from('weekly_digests')
        .select('*')
        .eq('user_id', userId)
        .eq('week_number', targetWeek)
        .eq('year', targetYear)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get weekly digest: ${error.message}`);
    }
  }
}

export default new AIService();
