import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { GameSession } from '../db/models/GameSession.js';
import { Category } from '../db/models/Category.js';
import progressionService from './ProgressionService.js';
import leagueService from './LeagueService.js';
import telemetryService from './TelemetryService.js';

/**
 * Game Service
 * Handles quiz gameplay, AI question generation, scoring, and hint system
 * 
 * TIMED ACCESS MODEL:
 * - All features are FREE while game pass is active
 * - Hints have cooldown timers to prevent spam
 * - No per-action credit costs
 */
export class GameService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    
    // In-memory storage for active sessions (questions and hints)
    this.activeSessions = new Map();

    // Hint cooldown timers per user (userId -> { lastHintTime })
    // Cooldown periods in seconds
    this.HINT_COOLDOWNS = {
      eliminate: 60,   // 60 second cooldown
      clue: 60,        // 60 second cooldown
      firstLetter: 60, // 60 second cooldown
    };
    this.userHintCooldowns = new Map();
  }

  /**
   * Check if a hint is on cooldown for a user
   * @param {string} userId - User ID
   * @param {string} hintType - Type of hint
   * @returns {{ onCooldown: boolean, remainingSeconds: number }}
   */
  checkHintCooldown(userId, hintType) {
    const key = `${userId}:${hintType}`;
    const lastUsed = this.userHintCooldowns.get(key);
    
    if (!lastUsed) return { onCooldown: false, remainingSeconds: 0 };
    
    const elapsed = (Date.now() - lastUsed) / 1000;
    const cooldownPeriod = this.HINT_COOLDOWNS[hintType] || 10;
    
    if (elapsed < cooldownPeriod) {
      return {
        onCooldown: true,
        remainingSeconds: Math.ceil(cooldownPeriod - elapsed),
      };
    }
    
    return { onCooldown: false, remainingSeconds: 0 };
  }

  /**
   * Record hint usage for cooldown tracking
   * @param {string} userId - User ID
   * @param {string} hintType - Type of hint
   */
  recordHintUsage(userId, hintType) {
    const key = `${userId}:${hintType}`;
    this.userHintCooldowns.set(key, Date.now());
  }

  /**
   * Create a new quiz session
   * FREE with active game pass — no credit charges
   */
  async createSession(userId, categoryId, difficulty, sessionType = 'standard', customTopic = null) {
    try {
      console.log('\n>>> GameService.createSession');
      console.log('User ID:', userId);
      console.log('Category ID:', categoryId);
      console.log('Difficulty:', difficulty);
      console.log('Session Type:', sessionType);

      // Get category info
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      console.log('✅ Category found:', category.name);

      // Create session in database
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

      // Track AI usage telemetry
      try {
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
      };
    } catch (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Generate questions via Google Gemini AI
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

      // Extract JSON from response
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
   * Get next question for a session
   */
  async getNextQuestion(sessionId) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or expired');
      }

      const { questions, currentQuestionIndex } = sessionData;

      if (currentQuestionIndex >= questions.length) {
        return { completed: true, message: 'All questions answered' };
      }

      return {
        completed: false,
        currentQuestion: currentQuestionIndex + 1,
        totalQuestions: questions.length,
        question: this.formatQuestion(questions[currentQuestionIndex], currentQuestionIndex),
      };
    } catch (error) {
      throw new Error(`Failed to get next question: ${error.message}`);
    }
  }

  /**
   * Submit answer for a question
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

      const isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      const timeLimit = 30;
      const points = this.calculateScore(isCorrect, sessionData.difficulty, timeSpent, timeLimit);

      await GameSession.recordAnswer(
        sessionId,
        question.question,
        question.correctAnswer,
        userAnswer,
        isCorrect,
        timeSpent,
        points
      );

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
   */
  async completeSession(sessionId) {
    try {
      const result = await GameSession.complete(sessionId);
      const sessionData = this.activeSessions.get(sessionId);
      this.activeSessions.delete(sessionId);

      const { session, answers } = result;

      // Update progression
      await progressionService.processSessionCompletion(
        session.user_id,
        session.category_id,
        session.correct_answers,
        session.total_questions
      );

      // Add league score
      try {
        await leagueService.addScore(session.user_id, session.score);
      } catch (leagueError) {
        console.error('Failed to add league score:', leagueError);
      }

      // Track telemetry
      try {
        const sessionStartTime = sessionData?.startTime || Date.now();
        const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const accuracy = session.total_questions > 0
          ? (session.correct_answers / session.total_questions) * 100
          : 0;

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
      }

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
   */
  calculateScore(isCorrect, difficulty, timeSpent, timeLimit) {
    if (!isCorrect) return 0;

    const basePoints = { easy: 10, medium: 20, hard: 30 };
    const base = basePoints[difficulty] || basePoints.medium;
    const timeRatio = timeSpent / timeLimit;

    let speedMultiplier = 1.0;
    if (timeRatio < 0.25) speedMultiplier = 2.0;
    else if (timeRatio < 0.50) speedMultiplier = 1.5;
    else if (timeRatio < 0.75) speedMultiplier = 1.2;

    return Math.floor(base * speedMultiplier);
  }

  /**
   * Unlock explanation — FREE with active game pass
   */
  async unlockExplanation(userId, sessionId) {
    try {
      const answers = await GameSession.getAnswers(sessionId);

      // Track telemetry
      try {
        await telemetryService.trackAIUsage(userId, 'explanation_pack', {
          sessionId,
          questionsCount: answers.length,
          cost: 'free_with_pass',
        });
      } catch (telemetryError) {
        console.error('Failed to track explanation pack telemetry:', telemetryError);
      }

      return {
        success: true,
        free: true,
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
   * Eliminate two wrong answers — FREE with cooldown timer
   */
  async eliminateWrongAnswers(userId, sessionId, questionIndex) {
    try {
      // Check cooldown
      const cooldown = this.checkHintCooldown(userId, 'eliminate');
      if (cooldown.onCooldown) {
        throw new Error(`Hint on cooldown. Please wait ${cooldown.remainingSeconds} seconds.`);
      }

      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or expired');
      }

      if (sessionData.usedHints.eliminate.includes(questionIndex)) {
        throw new Error('Eliminate hint already used for this question');
      }

      const question = sessionData.questions[questionIndex];
      const correctAnswer = question.correctAnswer;
      const wrongAnswers = question.options.filter(opt => opt !== correctAnswer);
      const toEliminate = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 2);

      sessionData.usedHints.eliminate.push(questionIndex);
      this.recordHintUsage(userId, 'eliminate');

      // Track telemetry
      try {
        await telemetryService.trackAIUsage(userId, 'hint_eliminate', {
          sessionId, questionIndex, cost: 'free_with_pass',
        });
      } catch (e) { /* ignore */ }

      return {
        success: true,
        free: true,
        eliminatedOptions: toEliminate,
        remainingOptions: question.options.filter(opt => !toEliminate.includes(opt)),
        cooldownSeconds: this.HINT_COOLDOWNS.eliminate,
      };
    } catch (error) {
      throw new Error(`Failed to eliminate wrong answers: ${error.message}`);
    }
  }

  /**
   * Get AI-generated contextual clue — FREE with cooldown timer
   */
  async getContextualClue(userId, sessionId, questionIndex) {
    try {
      // Check cooldown
      const cooldown = this.checkHintCooldown(userId, 'clue');
      if (cooldown.onCooldown) {
        throw new Error(`Hint on cooldown. Please wait ${cooldown.remainingSeconds} seconds.`);
      }

      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or expired');
      }

      if (sessionData.usedHints.clue.includes(questionIndex)) {
        throw new Error('Clue hint already used for this question');
      }

      const question = sessionData.questions[questionIndex];

      const prompt = `Generate a helpful but not too obvious clue for this trivia question:

Question: ${question.question}
Correct Answer: ${question.correctAnswer}

Provide a single sentence clue that hints at the answer without giving it away directly.`;

      const result = await this.ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
      });
      const clue = result.text.trim();

      sessionData.usedHints.clue.push(questionIndex);
      this.recordHintUsage(userId, 'clue');

      // Track telemetry
      try {
        await telemetryService.trackAIUsage(userId, 'hint_clue', {
          sessionId, questionIndex, cost: 'free_with_pass',
        });
      } catch (e) { /* ignore */ }

      return {
        success: true,
        free: true,
        clue,
        cooldownSeconds: this.HINT_COOLDOWNS.clue,
      };
    } catch (error) {
      throw new Error(`Failed to get contextual clue: ${error.message}`);
    }
  }

  /**
   * Reveal first letter of correct answer — FREE with cooldown timer
   */
  async revealFirstLetter(userId, sessionId, questionIndex) {
    try {
      // Check cooldown
      const cooldown = this.checkHintCooldown(userId, 'firstLetter');
      if (cooldown.onCooldown) {
        throw new Error(`Hint on cooldown. Please wait ${cooldown.remainingSeconds} seconds.`);
      }

      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or expired');
      }

      if (sessionData.usedHints.firstLetter.includes(questionIndex)) {
        throw new Error('First letter hint already used for this question');
      }

      const question = sessionData.questions[questionIndex];
      const firstLetter = question.correctAnswer.charAt(0).toUpperCase();

      sessionData.usedHints.firstLetter.push(questionIndex);
      this.recordHintUsage(userId, 'firstLetter');

      // Track telemetry
      try {
        await telemetryService.trackAIUsage(userId, 'hint_first_letter', {
          sessionId, questionIndex, cost: 'free_with_pass',
        });
      } catch (e) { /* ignore */ }

      return {
        success: true,
        free: true,
        firstLetter,
        hint: `The correct answer starts with "${firstLetter}"`,
        cooldownSeconds: this.HINT_COOLDOWNS.firstLetter,
      };
    } catch (error) {
      throw new Error(`Failed to reveal first letter: ${error.message}`);
    }
  }

  /**
   * Format question for response (no correct answer exposed)
   */
  formatQuestion(question, index) {
    return {
      index,
      question: question.question,
      options: question.options,
      timeLimit: 30,
    };
  }
}

export default new GameService();
