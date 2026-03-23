import express from 'express';
import creditService from '../services/CreditService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/credits/balance
 * Get current credit balance
 */
router.get('/balance', authenticate, async (req, res) => {
  try {
    const balance = await creditService.getBalance(req.user.id);

    res.json({
      success: true,
      balance: balance,
      userId: req.user.id,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get balance',
      message: error.message,
    });
  }
});

/**
 * POST /api/credits/redeem
 * Redeem credits with Orange Game Pass API call
 * Body: { amount, actionType, metadata }
 */
router.post('/redeem', authenticate, async (req, res) => {
  try {
    const { amount, actionType, metadata } = req.body;

    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid amount is required',
      });
    }

    if (!actionType || typeof actionType !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Action type is required',
      });
    }

    // Redeem credits
    const result = await creditService.redeemCredits(
      req.user.id,
      amount,
      actionType,
      req.gamePassToken,
      metadata || {}
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: result.message,
        currentBalance: result.currentBalance,
        required: result.required,
      });
    }

    res.json({
      success: true,
      newBalance: result.newBalance,
      orangeTransactionId: result.orangeTransactionId,
      message: 'Credits redeemed successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to redeem credits',
      message: error.message,
    });
  }
});

/**
 * GET /api/credits/history
 * Get credit transaction history
 * Query params: limit (optional, default 50)
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Limit must be between 1 and 100',
      });
    }

    const history = await creditService.getTransactionHistory(req.user.id, limit);

    res.json({
      success: true,
      transactions: history,
      count: history.length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get transaction history',
      message: error.message,
    });
  }
});

/**
 * POST /api/credits/sync
 * Sync with Orange Game Pass balance
 */
router.post('/sync', authenticate, async (req, res) => {
  try {
    const result = await creditService.syncWithOrangePass(req.user.id, req.gamePassToken);

    res.json({
      success: true,
      balance: result.balance,
      syncedAt: result.syncedAt,
      message: 'Balance synchronized successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to sync balance',
      message: error.message,
    });
  }
});

export default router;
