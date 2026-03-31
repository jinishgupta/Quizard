import express from 'express';
import gamePassService from '../services/GamePassService.js';

const router = express.Router();

/**
 * POST /api/gamepass/redeem
 * Redeem/activate a game pass (starts the timer)
 * Body: { passToken }
 */
router.post('/redeem', async (req, res) => {
  try {
    const passToken = req.headers['x-game-pass-token'] || req.body.passToken;

    if (!passToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Game pass token is required (in X-Game-Pass-Token header or body)',
      });
    }

    const result = await gamePassService.redeemPass(passToken);

    res.json({
      success: true,
      ...result,
      message: 'Game pass activated successfully!',
    });
  } catch (error) {
    res.status(400).json({
      error: 'Redemption failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/gamepass/status
 * Check game pass status (remaining time)
 */
router.get('/status', async (req, res) => {
  try {
    const passToken = req.headers['x-game-pass-token'];

    if (!passToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Game pass token is required in X-Game-Pass-Token header',
      });
    }

    const status = await gamePassService.checkStatus(passToken);

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Status check failed',
      message: error.message,
    });
  }
});

export default router;
