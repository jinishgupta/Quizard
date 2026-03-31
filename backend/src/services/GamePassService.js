import { config } from '../config/env.js';

/**
 * Game Pass Service
 * Handles Orange Game Pass timed access validation
 * 
 * In Timed Mode:
 * - Timer starts on first redeem
 * - All features (hints, explanations) are FREE during active pass
 * - Access blocked when expired
 * - Use ends_at for countdown calculations
 */
export class GamePassService {
  constructor() {
    this.tenantCode = config.orange.tenantCode;
    this.apiBaseUrl = config.orange.gamePassApiUrl || 'https://app.orangeweb3.com/api/games/passes';
    
    // Cache status checks to avoid hammering the API (cache for 15 seconds)
    this.statusCache = new Map();
    this.CACHE_TTL_MS = 15000;
  }

  /**
   * Redeem/activate a game pass token (starts the timer)
   * POST /api/games/passes/redeem
   * 
   * @param {string} passToken - Orange Game Pass token
   * @returns {Promise<Object>} Redemption result with time info
   */
  async redeemPass(passToken) {
    try {
      console.log('\n>>> GamePassService.redeemPass');
      console.log('Tenant Code:', this.tenantCode);
      console.log('Pass Token:', passToken ? 'Present' : 'Missing');

      if (!passToken) {
        throw new Error('Game pass token is required');
      }

      const response = await fetch(`${this.apiBaseUrl}/redeem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${passToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_code: this.tenantCode,
        }),
      });

      console.log('Orange Redeem API Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Redeem Error:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          error = { message: errorText };
        }
        throw new Error(error.message || `Pass redemption failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Pass redeemed:', JSON.stringify(result));

      // Cache the status
      this.statusCache.set(passToken, {
        data: result,
        timestamp: Date.now(),
      });

      console.log('<<< GamePassService.redeemPass SUCCESS\n');
      return result;
    } catch (error) {
      console.error('❌ GamePassService.redeemPass ERROR:', error.message);
      throw new Error(`Failed to redeem pass: ${error.message}`);
    }
  }

  /**
   * Check game pass status (remaining time)
   * GET /api/games/passes/status
   * 
   * Response: { seconds_remaining: 300, ends_at: "...", status: "ACTIVE" }
   * 
   * @param {string} passToken - Orange Game Pass token
   * @returns {Promise<Object>} Status with seconds_remaining, ends_at, status
   */
  async checkStatus(passToken) {
    try {
      if (!passToken) {
        return { status: 'NO_TOKEN', seconds_remaining: 0, ends_at: null };
      }

      // Check cache first
      const cached = this.statusCache.get(passToken);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
        // Adjust seconds_remaining based on elapsed time since cache
        const elapsed = Math.floor((Date.now() - cached.timestamp) / 1000);
        const adjustedSeconds = Math.max(0, (cached.data.seconds_remaining || 0) - elapsed);
        return {
          ...cached.data,
          seconds_remaining: adjustedSeconds,
          status: adjustedSeconds > 0 ? 'ACTIVE' : 'EXPIRED',
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${passToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          error = { message: errorText };
        }
        
        // If 401/403, pass is invalid or expired
        if (response.status === 401 || response.status === 403) {
          return { status: 'EXPIRED', seconds_remaining: 0, ends_at: null };
        }
        throw new Error(error.message || `Status check failed: ${response.status}`);
      }

      const result = await response.json();

      // Cache the result
      this.statusCache.set(passToken, {
        data: result,
        timestamp: Date.now(),
      });

      return {
        seconds_remaining: result.seconds_remaining || 0,
        ends_at: result.ends_at || null,
        status: result.status || (result.seconds_remaining > 0 ? 'ACTIVE' : 'EXPIRED'),
      };
    } catch (error) {
      console.error('GamePassService.checkStatus ERROR:', error.message);
      // On network error, return expired to be safe
      return { status: 'ERROR', seconds_remaining: 0, ends_at: null, error: error.message };
    }
  }

  /**
   * Verify pass is currently active
   * @param {string} passToken - Orange Game Pass token
   * @returns {Promise<boolean>} true if pass is active
   */
  async isActive(passToken) {
    const status = await this.checkStatus(passToken);
    return status.status === 'ACTIVE' && status.seconds_remaining > 0;
  }

  /**
   * Clear cached status for a token
   * @param {string} passToken - Token to clear cache for
   */
  clearCache(passToken) {
    if (passToken) {
      this.statusCache.delete(passToken);
    }
  }
}

export default new GamePassService();
