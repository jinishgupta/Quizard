import express from 'express';
import gameService from '../services/GameService.js';
import { Category } from '../db/models/Category.js';
import { GameSession } from '../db/models/GameSession.js';
import { authenticate } from '../middleware/auth.js';
import { requireActiveGamePass } from '../middleware/gamepass.js';

const router = express.Router();

/**
 * POST /api/game/session
 * Create new standard game session
 * Requires active game pass (timed access — no per-action credit cost)
 * Body: { categoryId, difficulty }
 */ 
router.post('/session', authenticate, requireActiveGamePass, async (req, res) => {
  try {
    console.log('\n=== CREATE GAME SESSION ===');
    console.log('User ID:', req.user.id);
    const { categoryId, difficulty } = req.body;
    console.log('Category ID:', categoryId, 'Difficulty:', difficulty);

    // Validate input
    if (!categoryId) {
      console.log('❌ Missing categoryId');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category ID is required',
      });
    }

    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
      console.log('❌ Invalid difficulty:', difficulty);
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid difficulty (easy, medium, hard) is required',
      });
    }

    // Create session (no credit charge — timed access mode)
    console.log('Creating session...');
    const session = await gameService.createSession(
      req.user.id,
      categoryId,
      difficulty,
      'standard'
    );

    console.log('✅ Session created:', session.sessionId);
    console.log('=== CREATE GAME SESSION SUCCESS ===\n');

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('❌ CREATE GAME SESSION ERROR:', error);
    console.error('Error stack:', error.stack);
    console.log('=== CREATE GAME SESSION FAILED ===\n');
    res.status(500).json({
      error: 'Failed to create session',
      message: error.message,
    });
  }
});

/**
 * POST /api/game/session/custom
 * Create custom topic quiz
 * Requires active game pass
 * Body: { topic, difficulty }
 */
router.post('/session/custom', authenticate, requireActiveGamePass, async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

    // Validate input
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Topic is required',
      });
    }

    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid difficulty (easy, medium, hard) is required',
      });
    }

    // Use a default category ID for custom quizzes
    const categories = await Category.getAll();
    const defaultCategory = categories[0];

    if (!defaultCategory) {
      return res.status(500).json({
        error: 'Server Error',
        message: 'No categories available',
      });
    }

    // Create custom session (free with active pass)
    const session = await gameService.createSession(
      req.user.id,
      defaultCategory.id,
      difficulty,
      'custom',
      topic
    );

    res.json({
      success: true,
      session: {
        ...session,
        customTopic: topic,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create custom quiz',
      message: error.message,
    });
  }
});

/**
 * POST /api/game/session/bonus
 * Create bonus round
 * Requires active game pass
 * Body: { categoryId, difficulty }
 */
router.post('/session/bonus', authenticate, requireActiveGamePass, async (req, res) => {
  try {
    const { categoryId, difficulty } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category ID is required',
      });
    }

    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid difficulty (easy, medium, hard) is required',
      });
    }

    // Create bonus session (free with active pass)
    const session = await gameService.createSession(
      req.user.id,
      categoryId,
      difficulty,
      'bonus'
    );

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create bonus round',
      message: error.message,
    });
  }
});

/**
 * GET /api/game/session/:id
 * Get session details
 */
router.get('/session/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const session = await GameSession.findById(id);

    if (!session) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found',
      });
    }

    if (session.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this session',
      });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        userId: session.user_id,
        categoryId: session.category_id,
        categoryName: session.categories?.name,
        difficulty: session.difficulty,
        status: session.status,
        score: session.score,
        correctAnswers: session.correct_answers,
        totalQuestions: session.total_questions,
        avgTimePerQuestion: session.avg_time_per_question,
        startedAt: session.started_at,
        completedAt: session.completed_at,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get session',
      message: error.message,
    });
  }
});

/**
 * POST /api/game/session/:id/answer
 * Submit answer with time tracking
 * Body: { answer, timeSpent }
 */
router.post('/session/:id/answer', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { answer, timeSpent } = req.body;

    if (!answer || typeof answer !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Answer is required',
      });
    }

    if (typeof timeSpent !== 'number' || timeSpent < 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid time spent is required',
      });
    }

    const session = await GameSession.findById(id);
    if (!session || session.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid session',
      });
    }

    const result = await gameService.submitAnswer(id, answer, timeSpent);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to submit answer',
      message: error.message,
    });
  }
});

/**
 * POST /api/game/session/:id/complete
 * Complete session and get results
 */
router.post('/session/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const session = await GameSession.findById(id);
    if (!session || session.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid session',
      });
    }

    const results = await gameService.completeSession(id);

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to complete session',
      message: error.message,
    });
  }
});

/**
 * GET /api/game/categories
 * Get all active categories (public, no auth required)
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.getAll();

    res.json({
      success: true,
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        description: c.description,
        color: c.color,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get categories',
      message: error.message,
    });
  }
});

/**
 * POST /api/game/unlock-explanation
 * Unlock question explanation — FREE with active game pass
 * Body: { sessionId }
 */
router.post('/unlock-explanation', authenticate, requireActiveGamePass, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Session ID is required',
      });
    }

    const session = await GameSession.findById(sessionId);
    if (!session || session.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid session',
      });
    }

    // Free with active game pass — no credit charge
    const result = await gameService.unlockExplanation(req.user.id, sessionId);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to unlock explanation',
      message: error.message,
    });
  }
});

/**
 * POST /api/game/hint/eliminate
 * Eliminate two wrong answers — FREE with active pass, 15s cooldown
 * Body: { sessionId, questionIndex }
 */
router.post('/hint/eliminate', authenticate, requireActiveGamePass, async (req, res) => {
  try {
    const { sessionId, questionIndex } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Session ID is required' });
    }
    if (typeof questionIndex !== 'number' || questionIndex < 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Valid question index is required' });
    }

    const session = await GameSession.findById(sessionId);
    if (!session || session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Invalid session' });
    }

    // Free with active pass — has cooldown timer
    const result = await gameService.eliminateWrongAnswers(req.user.id, sessionId, questionIndex);
    res.json(result);
  } catch (error) {
    res.status(error.message.includes('cooldown') ? 429 : 500).json({
      error: 'Failed to eliminate answers',
      message: error.message,
    });
  }
});

/**
 * POST /api/game/hint/clue
 * Get contextual clue — FREE with active pass, 20s cooldown
 * Body: { sessionId, questionIndex }
 */
router.post('/hint/clue', authenticate, requireActiveGamePass, async (req, res) => {
  try {
    const { sessionId, questionIndex } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Session ID is required' });
    }
    if (typeof questionIndex !== 'number' || questionIndex < 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Valid question index is required' });
    }

    const session = await GameSession.findById(sessionId);
    if (!session || session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Invalid session' });
    }

    const result = await gameService.getContextualClue(req.user.id, sessionId, questionIndex);
    res.json(result);
  } catch (error) {
    res.status(error.message.includes('cooldown') ? 429 : 500).json({
      error: 'Failed to get clue',
      message: error.message,
    });
  }
});

/**
 * POST /api/game/hint/first-letter
 * Reveal first letter — FREE with active pass, 10s cooldown
 * Body: { sessionId, questionIndex }
 */
router.post('/hint/first-letter', authenticate, requireActiveGamePass, async (req, res) => {
  try {
    const { sessionId, questionIndex } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Session ID is required' });
    }
    if (typeof questionIndex !== 'number' || questionIndex < 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Valid question index is required' });
    }

    const session = await GameSession.findById(sessionId);
    if (!session || session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Invalid session' });
    }

    const result = await gameService.revealFirstLetter(req.user.id, sessionId, questionIndex);
    res.json(result);
  } catch (error) {
    res.status(error.message.includes('cooldown') ? 429 : 500).json({
      error: 'Failed to reveal first letter',
      message: error.message,
    });
  }
});

export default router;
