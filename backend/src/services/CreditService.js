import { config } from '../config/env.js';
import { supabase } from '../db/index.js';
import { User } from '../db/models/User.js';
import telemetryService from './TelemetryService.js';

/**
 * Credit Service
 * Handles Orange Game Pass credit redemption and balance management
 * 
 * IMPORTANT: This app can ONLY deduct credits via Orange Game Pass redemption API.
 * Orange manages credit balance entirely (sign-up bonus, Go3 rewards, purchases).
 * All credit redemptions are tracked in telemetry for competition scoring.
 */
export class CreditService {
  constructor() {
    this.tenantCode = config.orange.tenantCode;
    this.gamePassApiUrl = config.orange.gamePassApiUrl || 'https://app.orangeweb3.com/api/games/passes/redeem';
  }

  /**
   * Credit cost constants for all 9 action types
   * 
   * Action Types and Costs:
   * - STANDARD_ROUND (12 credits): Playing a 10-question standard round
   * - HINT_ELIMINATE (6 credits): Removing two wrong answer options
   * - HINT_CLUE (6 credits): Receiving a contextual clue from Gemini
   * - HINT_FIRST_LETTER (6 credits): Revealing first letter of correct answer
   * - EXPLANATION_PACK (15 credits): Post-round AI explanations for all 10 questions
   * - BONUS_ROUND (10 credits): Sudden-death bonus round after standard round
   * - CUSTOM_QUIZ (30 credits): User-defined topic quiz (highest token cost)
   * - SEND_CHALLENGE (10 credits): Sending a friend challenge link
   * - EARLY_DIGEST (10 credits): Requesting weekly digest before Monday auto-generation
   */
  static COSTS = {
    STANDARD_ROUND: config.credits.standardRound,           // 12 credits
    HINT_ELIMINATE: config.credits.hintEliminate,           // 6 credits
    HINT_CLUE: config.credits.hintClue,                     // 6 credits
    HINT_FIRST_LETTER: config.credits.hintFirstLetter,      // 6 credits
    EXPLANATION_PACK: config.credits.explanationPack,       // 15 credits
    BONUS_ROUND: config.credits.bonusRound,                 // 10 credits
    CUSTOM_QUIZ: config.credits.customQuiz,                 // 30 credits
    SEND_CHALLENGE: config.credits.sendChallenge,           // 10 credits
    EARLY_DIGEST: config.credits.earlyDigest,               // 10 credits
  };

  /**
   * Redeem credits by calling Orange Game Pass API
   * 
   * This method:
   * 1. Checks user has sufficient credits
   * 2. Calls Orange Game Pass redemption API (POST https://app.orangeweb3.com/api/games/passes/redeem)
   * 3. Updates user balance in database
   * 4. Records transaction in credit_transactions table with Orange transaction_id
   * 5. Tracks telemetry event for competition scoring
   * 
   * Orange Game Pass API Request:
   * - Headers: Authorization: Bearer <orange_token>, Content-Type: application/json
   * - Body: { tenant_code, amount, action_type, metadata }
   * 
   * Orange Game Pass API Response:
   * - { success: true, transaction_id: "orange_tx_123", remaining_balance: 88 }
   * 
   * @param {string} userId - User ID
   * @param {number} amount - Amount of credits to redeem
   * @param {string} actionType - Type of action (e.g., 'STANDARD_ROUND', 'HINT_ELIMINATE')
   * @param {string} gamePassToken - Orange Game Pass token for authentication
   * @param {Object} metadata - Additional metadata for the transaction
   * @returns {Promise<Object>} Redemption result with success, newBalance, orangeTransactionId
   */
  async redeemCredits(userId, amount, actionType, gamePassToken, metadata = {}) {
    try {
      console.log('\n>>> CreditService.redeemCredits');
      console.log('User ID:', userId);
      console.log('Amount:', amount);
      console.log('Action Type:', actionType);
      console.log('Game Pass Token:', gamePassToken ? 'Present' : 'Missing');
      console.log('Metadata:', JSON.stringify(metadata));

      // Validate Game Pass token
      if (!gamePassToken) {
        throw new Error('Orange Game Pass token is missing. Please ensure you accessed the app via an Orange Game Pass link.');
      }
      
      // Get current user balance
      console.log('Fetching user balance...');
      const user = await User.findById(userId);
      if (!user) {
        console.log('❌ User not found');
        throw new Error('User not found');
      }

      console.log('Current balance:', user.credits);

      // Check if user has sufficient credits
      if (user.credits < amount) {
        console.log('❌ Insufficient credits. Required:', amount, 'Available:', user.credits);
        return {
          success: false,
          error: 'insufficient_credits',
          message: 'Insufficient credits',
          currentBalance: user.credits,
          required: amount,
        };
      }

      console.log('✅ Sufficient credits available');

      // Call Orange Game Pass redemption API
      console.log('Calling Orange Game Pass API...');
      console.log('API URL:', this.gamePassApiUrl);
      console.log('Tenant Code:', this.tenantCode);
      
      const response = await fetch(this.gamePassApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gamePassToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_code: this.tenantCode,
          amount: amount,
          action_type: actionType,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      console.log('Orange API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Orange API Error Response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          error = { message: errorText };
        }
        throw new Error(error.message || `Orange Game Pass API error: ${response.status}`);
      }

      const redemptionResult = await response.json();
      console.log('✅ Orange API Success:', JSON.stringify(redemptionResult));

      // Update user credits in database
      const newBalance = user.credits - amount;
      console.log('Updating user balance to:', newBalance);
      await User.updateCredits(userId, newBalance);
      console.log('✅ Balance updated');

      // Record transaction in credit_transactions table
      console.log('Recording transaction...');
      await this.recordTransaction(
        userId,
        -amount,
        'spend',
        actionType,
        redemptionResult.transaction_id || redemptionResult.transactionId,
        newBalance,
        metadata
      );
      console.log('✅ Transaction recorded');

      // Track telemetry event
      console.log('Tracking telemetry...');
      await this.trackCreditRedemption(userId, amount, actionType, redemptionResult.transaction_id || redemptionResult.transactionId);
      console.log('✅ Telemetry tracked');

      console.log('<<< CreditService.redeemCredits SUCCESS\n');

      return {
        success: true,
        newBalance: newBalance,
        orangeTransactionId: redemptionResult.transaction_id || redemptionResult.transactionId,
        remainingBalance: redemptionResult.remaining_balance || redemptionResult.remainingBalance,
      };
    } catch (error) {
      console.error('❌ CreditService.redeemCredits ERROR:', error);
      console.error('Error stack:', error.stack);
      console.log('<<< CreditService.redeemCredits FAILED\n');
      throw new Error(`Failed to redeem credits: ${error.message}`);
    }
  }

  /**
   * Get user credit balance
   * @param {string} userId - User ID
   * @returns {Promise<number>} Current credit balance
   */
  async getBalance(userId) {
    try {
      console.log('\n>>> CreditService.getBalance');
      console.log('User ID:', userId);
      
      const user = await User.findById(userId);
      
      if (!user) {
        console.log('❌ User not found');
        throw new Error('User not found');
      }
      
      console.log('✅ Balance:', user.credits);
      console.log('<<< CreditService.getBalance SUCCESS\n');
      
      return user.credits;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Sync balance with Orange Game Pass
   * Note: This is a placeholder - actual implementation depends on Orange API
   * @param {string} userId - User ID
   * @param {string} gamePassToken - Orange Game Pass token
   * @returns {Promise<Object>} Sync result
   */
  async syncWithOrangePass(userId, gamePassToken) {
    try {
      // In a real implementation, this would call an Orange API endpoint
      // to get the authoritative balance from Orange Game Pass
      // For now, we'll just return the current balance
      const balance = await this.getBalance(userId);

      // Record sync transaction
      await this.recordTransaction(
        userId,
        0,
        'sync',
        'Balance synchronization with Orange Game Pass',
        null,
        balance,
        { syncedAt: new Date().toISOString() }
      );

      return {
        success: true,
        balance: balance,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to sync with Orange Pass: ${error.message}`);
    }
  }

  /**
   * Record credit transaction in database
   * @param {string} userId - User ID
   * @param {number} amount - Transaction amount (negative for spending)
   * @param {string} transactionType - Type: 'earn', 'spend', 'sync'
   * @param {string} reason - Reason for transaction
   * @param {string} orangeTransactionId - Orange transaction ID
   * @param {number} balanceAfter - Balance after transaction
   * @param {Object} metadata - Additional metadata
   */
  async recordTransaction(userId, amount, transactionType, reason, orangeTransactionId, balanceAfter, metadata = {}) {
    try {
      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          transaction_type: transactionType,
          reason: reason,
          orange_transaction_id: orangeTransactionId,
          balance_after: balanceAfter,
          metadata: metadata,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to record transaction:', error);
      // Don't throw - transaction recording failure shouldn't block the main operation
    }
  }

  /**
   * Track credit redemption in telemetry
   * @param {string} userId - User ID
   * @param {number} amount - Amount redeemed
   * @param {string} actionType - Action type
   * @param {string} orangeTransactionId - Orange transaction ID
   */
  async trackCreditRedemption(userId, amount, actionType, orangeTransactionId) {
    try {
      await telemetryService.trackCreditRedemption(
        userId,
        amount,
        actionType,
        orangeTransactionId
      );
    } catch (error) {
      console.error('Failed to track telemetry:', error);
      // Don't throw - telemetry failure shouldn't block the main operation
    }
  }

  /**
   * Get credit transaction history
   * @param {string} userId - User ID
   * @param {number} limit - Number of transactions to retrieve
   * @returns {Promise<Array>} Transaction history
   */
  async getTransactionHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }
}

export default new CreditService();
