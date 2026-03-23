import { GoogleGenAI  } from '@google/genai';
import { config } from '../config/env.js';
import { GameSession } from '../db/models/GameSession.js';
import { Category } from '../db/models/Category.js';
import creditService from './CreditService.js';
import progressionService from './ProgressionService.js';
import leagueService from './LeagueService.js';
import telemetryService from './TelemetryService.js';

/**
 * Game Service
 * Handles quiz gameplay, AI question generation, scoring, and hint system
 * 
 * IMPORTANT: NO questions table - all questions generated on-demand by Google Gemini
 */
export class GameService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    
    // In-memory storage for active sessions (questions and hints)
    this.activeSessions = new Map();
  }

  /**
   * Create a new quiz session
   * Charges CREDITS_STANDARD_ROUND for standard sessions
   * 
   * @param {string} userId - User ID
   * @param {string} categoryId - Category ID
   * @param {string} difficulty - Difficulty level (easy, medium, hard)
   * @param {string} gamePassToken - Orange Game Pass token for credit redemption
   * @param {string} sessionType - Session type: 'standard', 'custom', 'bonus'
   * @param {string} customTopic - Custom topic for custom quizzes
   * @returns {Promise<Object>} Session data with first question
   */
  async createSession(userId, categoryId, difficulty, gamePassToken, sessionType = 'standard', customTopic = null) {
    try {
      console.log('\n>>> GameService.createSession');
      console.log('User ID:', userId);
      console.log('Category ID:', categoryId);
      console.log('Difficulty:', difficulty);
      console.log('Session Type:', sessionType);
      console.log('Custom Topic:', customTopic);
      console.log('Game Pass Token:', gamePassToken ? 'Present' : 'Missing');
      
      // Determine credit cost based on session type
      let creditCost;
      let actionType;
      
      switch (sessionType) {
        case 'custom':
          creditCost = creditService.constructor.COSTS.CUSTOM_QUIZ;
          actionType = 'CUSTOM_QUIZ';
          break;
        case 'bonus':
          creditCost = creditService.constructor.COSTS.BONUS_ROUND;
          actionType = 'BONUS_ROUND';
          break;
        case 'standard':
        default:
          creditCost = creditService.constructor.COSTS.STANDARD_ROUND;
          actionType = 'STANDARD_ROUND';
          break;
      }

      console.log('Credit cost:', creditCost, 'Action type:', actionType);

      // Redeem credits before creating session
      console.log('Redeeming credits...');
      const redemptionResult = await creditService.redeemCredits(
        userId,
        creditCost,
        actionType,
        gamePassToken,
        {
          categoryId,
          difficulty,
          sessionType,
          customTopic,
        }
      );

      if (!redemptionResult.success) {
        console.log('❌ Credit redemption failed:', redemptionResult.message);
        throw new Error(redemptionResult.message || 'Insufficient credits');
      }

      console.log('✅ Credits redeemed successfully');

      // Get category info
      console.log('Fetching category info...');
      const category = await Category.findById(categoryId);
      if (!category) {
        console.log('❌ Category not found');
        throw new Error('Category not found');
      }

      console.log('✅ Category found:', category.name);

      // Create session in database
      console.log('Creating session in database...');
      const session = await GameSession.create(userId, categoryId, difficulty);
      console.log('✅ Session created:', session.id);

      // Generate questions via AI
      console.log('Generating questions via AI...');
      const questions = await this.generateQuestions(
        customTopic || category.name,
        difficulty,
        10
      );

      console.log('✅ Questions generated:', questions.length);

      // Track AI usage telemetry for question generation
      try {
        console.log('Tracking AI usage telemetry...');
        await telemetryService.trackAIUsage(userId, 'question_generation', {
          sessionId: session.id,
          topic: customTopic || category.name,
          difficulty,
          questionCount: questions.length,
          sessionType,
        });
      } catch (telemetryError) {
        console.error('Failed to track question generation telemetry:', telemetryError);
      }

      // Store session data in memory
      this.activeSessions.set(session.id, {
        questions,
        currentQuestionIndex: 0,
        startTime: Date.now(),
        difficulty,
        usedHints: {
          eliminate: [],
          clue: [],
          firstLetter: [],
        },
      });

      // Return session with first question
      return {
        sessionId: session.id,
        category: category.name,
        difficulty,
        totalQuestions: questions.length,
        currentQuestion: 1,
        question: this.formatQuestion(questions[0], 0),
        creditsCharged: creditCost,
        newBalance: redemptionResult.newBalance,
      };
    } catch (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Generate questions via Google Gemini AI
   * 
   * @param {string} topic - Topic/category name
   * @param {string} difficulty - Difficulty level
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
        model: config.gemini.model,
        contents: prompt,
      });
      const text = result.text;

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = text.trim();
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

      const formattedQuestions = questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'No explanation provided.',
      }));

      // Track AI usage telemetry for question generation
      // Note: We don't have userId in this context, so telemetry is tracked at session creation
      
      return formattedQuestions;
    } catch (error) {
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  /**
   * Get next question for a session
   * 
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Next question data
   */
  async getNextQuestion(sessionId) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or expired');
      }

      const { questions, currentQuestionIndex } = sessionData;

      if (currentQuestionIndex >= questions.length) {
        return {
          completed: true,
          message: 'All questions answered',
        };
      }

      const question = questions[currentQuestionIndex];

      return {
        completed: false,
        currentQuestion: currentQuestionIndex + 1,
        totalQuestions: questions.length,
        question: this.formatQuestion(question, currentQuestionIndex),
      };
    } catch (error) {
      throw new Error(`Failed to get next question: ${error.message}`);
    }
  }

  /**
   * Submit answer for a question
   * 
   * @param {string} sessionId - Session ID
   * @param {string} userAnswer - User's answer
   * @param {number} timeSpent - Time spent in seconds
   * @returns {Promise<Object>} Answer result with correctness and points
   */
  async submitAnswer(sessionId, userAnswer, timeSpent) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or expired');
      }

      const { questions, currentQuestionIndex } = sessionData;
      const question = questions[currentQuestionIndex];

      if (!question) {
        throw new Error('No active question');
      }

      // Check correctness
      const isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

      // Calculate points
      const timeLimit = 30; // Default 30 seconds per question
      const points = this.calculateScore(isCorrect, sessionData.difficulty, timeSpent, timeLimit);

      // Record answer in database
      const session = await GameSession.findById(sessionId);
      await GameSession.recordAnswer(
        sessionId,
        question.question,
        question.correctAnswer,
        userAnswer,
        isCorrect,
        timeSpent,
        points
      );

      // Move to next question
      sessionData.currentQuestionIndex++;

      return {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        pointsEarned: points,
        currentQuestion: currentQuestionIndex + 1,
        totalQuestions: questions.length,
      };
    } catch (error) {
      throw new Error(`Failed to submit answer: ${error.message}`);
    }
  }

  /**
   * Complete a session and calculate final results
   * 
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Session results
   */
  async completeSession(sessionId) {
    try {
      // Complete session in database
      const result = await GameSession.complete(sessionId);

      // Clean up in-memory session data
      const sessionData = this.activeSessions.get(sessionId);
      this.activeSessions.delete(sessionId);

      const { session, answers } = result;

      // Update progression tracking (streak, mastery, statistics)
      await progressionService.processSessionCompletion(
        session.user_id,
        session.category_id,
        session.correct_answers,
        session.total_questions
      );

      // Add score to weekly league (Requirement 4.1)
      try {
        await leagueService.addScore(session.user_id, session.score);
      } catch (leagueError) {
        console.error('Failed to add league score:', leagueError);
        // Don't fail the session completion if league update fails
      }

      // Track telemetry for competition scoring
      try {
        const sessionStartTime = sessionData?.startTime || Date.now();
        const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const accuracy = session.total_questions > 0
          ? (session.correct_answers / session.total_questions) * 100
          : 0;

        // Get category name
        const category = await Category.findById(session.category_id);

        await telemetryService.trackSession(
          session.user_id,
          session.id,
          {
            duration: sessionDuration,
            questionsAnswered: session.total_questions,
            correctAnswers: session.correct_answers,
            accuracy: parseFloat(accuracy.toFixed(2)),
            category: category?.name || 'Unknown',
            difficulty: sessionData?.difficulty || 'medium',
            score: session.score,
          }
        );
      } catch (telemetryError) {
        console.error('Failed to track session telemetry:', telemetryError);
        // Don't fail the session completion if telemetry fails
      }

      // Calculate accuracy
      const accuracy = session.total_questions > 0
        ? (session.correct_answers / session.total_questions) * 100
        : 0;

      return {
        sessionId: session.id,
        score: session.score,
        correctAnswers: session.correct_answers,
        totalQuestions: session.total_questions,
        accuracy: accuracy.toFixed(2),
        avgTimePerQuestion: parseFloat(session.avg_time_per_question),
        completedAt: session.completed_at,
        answers: answers.map(a => ({
          question: a.question_text,
          userAnswer: a.user_answer,
          correctAnswer: a.correct_answer,
          isCorrect: a.is_correct,
          pointsEarned: a.points_earned,
          timeSpent: a.time_spent,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to complete session: ${error.message}`);
    }
  }

  /**
   * Calculate score based on difficulty and speed
   * 
   * @param {boolean} isCorrect - Whether answer is correct
   * @param {string} difficulty - Difficulty level
   * @param {number} timeSpent - Time spent in seconds
   * @param {number} timeLimit - Time limit in seconds
   * @returns {number} Points earned
   */
  calculateScore(isCorrect, difficulty, timeSpent, timeLimit) {
    if (!isCorrect) return 0;

    const basePoints = {
      easy: 10,
      medium: 20,
      hard: 30,
    };

    const base = basePoints[difficulty] || basePoints.medium;
    const timeRatio = timeSpent / timeLimit;

    // Speed multiplier
    let speedMultiplier = 1.0;
    if (timeRatio < 0.25) speedMultiplier = 2.0;      // < 25% of time
    else if (timeRatio < 0.50) speedMultiplier = 1.5; // < 50% of time
    else if (timeRatio < 0.75) speedMultiplier = 1.2; // < 75% of time

    return Math.floor(base * speedMultiplier);
  }

  /**
   * Unlock explanation for a question (costs CREDITS_EXPLANATION_PACK)
   * 
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {string} gamePassToken - Orange Game Pass token
   * @returns {Promise<Object>} Explanations for all questions
   */
  async unlockExplanation(userId, sessionId, gamePassToken) {
    try {
      // Redeem credits
      const creditCost = creditService.constructor.COSTS.EXPLANATION_PACK;
      const redemptionResult = await creditService.redeemCredits(
        userId,
        creditCost,
        'EXPLANATION_PACK',
        gamePassToken,
        { sessionId }
      );

      if (!redemptionResult.success) {
        throw new Error(redemptionResult.message || 'Insufficient credits');
      }

      // Get session answers
      const answers = await GameSession.getAnswers(sessionId);

      // Track telemetry for explanation pack usage
      try {
        await telemetryService.trackAIUsage(userId, 'explanation_pack', {
          sessionId,
          creditsCharged: creditCost,
          questionsCount: answers.length,
        });
      } catch (telemetryError) {
        console.error('Failed to track explanation pack telemetry:', telemetryError);
      }

      return {
        success: true,
        creditsCharged: creditCost,
        newBalance: redemptionResult.newBalance,
        explanations: answers.map(a => ({
          question: a.question_text,
          correctAnswer: a.correct_answer,
          explanation: 'Detailed explanation available after unlocking.',
        })),
      };
    } catch (error) {
      throw new Error(`Failed to unlock explanation: ${error.message}`);
    }
  }

  /**
   * Eliminate two wrong answers (costs CREDITS_HINT_ELIMINATE)
   * 
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {number} questionIndex - Question index
   * @param {string} gamePassToken - Orange Game Pass token
   * @returns {Promise<Object>} Remaining options
   */
  async eliminateWrongAnswers(userId, sessionId, questionIndex, gamePassToken) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or expired');
      }

      // Check if hint already used for this question
      if (sessionData.usedHints.eliminate.includes(questionIndex)) {
        throw new Error('Eliminate hint already used for this question');
      }

      // Redeem credits
      const creditCost = creditService.constructor.COSTS.HINT_ELIMINATE;
      const redemptionResult = await creditService.redeemCredits(
        userId,
        creditCost,
        'HINT_ELIMINATE',
        gamePassToken,
        { sessionId, questionIndex }
      );

      if (!redemptionResult.success) {
        throw new Error(redemptionResult.message || 'Insufficient credits');
      }

      const question = sessionData.questions[questionIndex];
      const correctAnswer = question.correctAnswer;

      // Find wrong answers
      const wrongAnswers = question.options.filter(opt => opt !== correctAnswer);

      // Randomly select 2 wrong answers to eliminate
      const toEliminate = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 2);

      // Mark hint as used
      sessionData.usedHints.eliminate.push(questionIndex);

      // Track telemetry for hint usage
      try {
        await telemetryService.trackAIUsage(userId, 'hint_eliminate', {
          sessionId,
          questionIndex,
          creditsCharged: creditCost,
        });
      } catch (telemetryError) {
        console.error('Failed to track hint telemetry:', telemetryError);
      }

      return {
        success: true,
        creditsCharged: creditCost,
        newBalance: redemptionResult.newBalance,
        eliminatedOptions: toEliminate,
        remainingOptions: question.options.filter(opt => !toEliminate.includes(opt)),
      };
    } catch (error) {
      throw new Error(`Failed to eliminate wrong answers: ${error.message}`);
    }
  }

  /**
   * Get AI-generated contextual clue (costs CREDITS_HINT_CLUE)
   * 
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {number} questionIndex - Question index
   * @param {string} gamePassToken - Orange Game Pass token
   * @returns {Promise<Object>} Contextual clue
   */
  async getContextualClue(userId, sessionId, questionIndex, gamePassToken) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or expired');
      }

      // Check if hint already used for this question
      if (sessionData.usedHints.clue.includes(questionIndex)) {
        throw new Error('Clue hint already used for this question');
      }

      // Redeem credits
      const creditCost = creditService.constructor.COSTS.HINT_CLUE;
      const redemptionResult = await creditService.redeemCredits(
        userId,
        creditCost,
        'HINT_CLUE',
        gamePassToken,
        { sessionId, questionIndex }
      );

      if (!redemptionResult.success) {
        throw new Error(redemptionResult.message || 'Insufficient credits');
      }

      const question = sessionData.questions[questionIndex];

      // Generate clue via Gemini
      const prompt = `Generate a helpful but not too obvious clue for this trivia question:

Question: ${question.question}
Correct Answer: ${question.correctAnswer}

Provide a single sentence clue that hints at the answer without giving it away directly.`;

      const result = await this.ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
      });
      const clue = result.text.trim();

      // Mark hint as used
      sessionData.usedHints.clue.push(questionIndex);

      // Track telemetry for hint usage
      try {
        await telemetryService.trackAIUsage(userId, 'hint_clue', {
          sessionId,
          questionIndex,
          creditsCharged: creditCost,
        });
      } catch (telemetryError) {
        console.error('Failed to track hint telemetry:', telemetryError);
      }

      return {
        success: true,
        creditsCharged: creditCost,
        newBalance: redemptionResult.newBalance,
        clue,
      };
    } catch (error) {
      throw new Error(`Failed to get contextual clue: ${error.message}`);
    }
  }

  /**
   * Reveal first letter of correct answer (costs CREDITS_HINT_FIRST_LETTER)
   * 
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {number} questionIndex - Question index
   * @param {string} gamePassToken - Orange Game Pass token
   * @returns {Promise<Object>} First letter hint
   */
  async revealFirstLetter(userId, sessionId, questionIndex, gamePassToken) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or expired');
      }

      // Check if hint already used for this question
      if (sessionData.usedHints.firstLetter.includes(questionIndex)) {
        throw new Error('First letter hint already used for this question');
      }

      // Redeem credits
      const creditCost = creditService.constructor.COSTS.HINT_FIRST_LETTER;
      const redemptionResult = await creditService.redeemCredits(
        userId,
        creditCost,
        'HINT_FIRST_LETTER',
        gamePassToken,
        { sessionId, questionIndex }
      );

      if (!redemptionResult.success) {
        throw new Error(redemptionResult.message || 'Insufficient credits');
      }

      const question = sessionData.questions[questionIndex];
      const firstLetter = question.correctAnswer.charAt(0).toUpperCase();

      // Mark hint as used
      sessionData.usedHints.firstLetter.push(questionIndex);

      // Track telemetry for hint usage
      try {
        await telemetryService.trackAIUsage(userId, 'hint_first_letter', {
          sessionId,
          questionIndex,
          creditsCharged: creditCost,
        });
      } catch (telemetryError) {
        console.error('Failed to track hint telemetry:', telemetryError);
      }

      return {
        success: true,
        creditsCharged: creditCost,
        newBalance: redemptionResult.newBalance,
        firstLetter,
        hint: `The correct answer starts with "${firstLetter}"`,
      };
    } catch (error) {
      throw new Error(`Failed to reveal first letter: ${error.message}`);
    }
  }

  /**
   * Format question for response
   * 
   * @param {Object} question - Question object
   * @param {number} index - Question index
   * @returns {Object} Formatted question
   */
  formatQuestion(question, index) {
    return {
      index,
      question: question.question,
      options: question.options,
      timeLimit: 30, // Default 30 seconds
    };
  }
}

export default new GameService();
