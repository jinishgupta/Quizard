import express from 'express';
import challengeService from '../services/ChallengeService.js';
import { authenticate } from '../middleware/auth.js';
import { requireActiveGamePass } from '../middleware/gamepass.js';

const router = express.Router();

/**
 * POST /api/challenge/create
 * Create a new challenge (charges CREDITS_SEND_CHALLENGE)
 * Body: { opponentId, categoryId, difficulty }
 */
router.post('/create', authenticate, requireActiveGamePass, async (req, res) => {
  try {
    const { opponentId, categoryId, difficulty } = req.body;

    // Validate input
    if (!opponentId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Opponent ID is required',
      });
    }

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

    // Create challenge
    const challenge = await challengeService.createChallenge(
      req.user.id,
      opponentId,
      categoryId,
      difficulty,
      req.gamePassToken
    );

    res.json({
      success: true,
      challenge,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create challenge',
      message: error.message,
    });
  }
});

/**
 * POST /api/challenge/:id/join
 * Join an existing challenge
 */
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Join challenge
    const result = await challengeService.joinChallenge(id, req.user.id);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to join challenge',
      message: error.message,
    });
  }
});

/**
 * GET /api/challenge/active
 * Get active challenges for the authenticated user
 */
router.get('/active', authenticate, async (req, res) => {
  try {
    const challenges = await challengeService.getActiveChallenges(req.user.id);

    res.json({
      success: true,
      challenges,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get active challenges',
      message: error.message,
    });
  }
});

/**
 * GET /api/challenge/:id
 * Get challenge details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await challengeService.getChallengeDetails(id);

    // Verify user is part of this challenge
    if (
      challenge.challenger.id !== req.user.id &&
      challenge.opponent.id !== req.user.id
    ) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not part of this challenge',
      });
    }

    res.json({
      success: true,
      challenge,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get challenge',
      message: error.message,
    });
  }
});

export default router;
