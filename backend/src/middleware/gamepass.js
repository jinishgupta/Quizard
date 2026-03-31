import gamePassService from '../services/GamePassService.js';

/**
 * Game Pass middleware
 * Verifies that the Orange Game Pass is active (timed mode)
 * Must be used after authenticate middleware
 * 
 * Extracts game pass token from X-Game-Pass-Token header
 * Attaches req.gamePassStatus with { seconds_remaining, ends_at, status }
 */
export async function requireActiveGamePass(req, res, next) {
  try {
    const gamePassToken = req.headers['x-game-pass-token'] || req.gamePassToken;

    if (!gamePassToken) {
      return res.status(403).json({
        error: 'GAME_PASS_REQUIRED',
        message: 'Orange Game Pass token is required. Please access the app via your Game Pass link.',
      });
    }

    // Check pass status
    const status = await gamePassService.checkStatus(gamePassToken);

    if (status.status !== 'ACTIVE' || status.seconds_remaining <= 0) {
      return res.status(403).json({
        error: 'GAME_PASS_EXPIRED',
        message: 'Your Game Pass has expired. Please purchase a new one to continue playing.',
        seconds_remaining: 0,
        ends_at: status.ends_at,
      });
    }

    // Attach status to request for downstream use
    req.gamePassStatus = status;
    req.gamePassToken = gamePassToken;

    // Add remaining time to response header
    res.setHeader('X-Game-Pass-Status', JSON.stringify({
      seconds_remaining: status.seconds_remaining,
      ends_at: status.ends_at,
    }));

    next();
  } catch (error) {
    console.error('Game Pass middleware error:', error.message);
    return res.status(500).json({
      error: 'GAME_PASS_CHECK_FAILED',
      message: 'Failed to verify Game Pass status. Please try again.',
    });
  }
}

/**
 * Optional game pass check
 * Attaches game pass status if present, but doesn't require it
 */
export async function optionalGamePass(req, res, next) {
  try {
    const gamePassToken = req.headers['x-game-pass-token'] || req.gamePassToken;

    if (gamePassToken) {
      const status = await gamePassService.checkStatus(gamePassToken);
      req.gamePassStatus = status;
      req.gamePassToken = gamePassToken;
    }

    next();
  } catch (error) {
    // Continue without game pass info
    next();
  }
}

export default { requireActiveGamePass, optionalGamePass };
