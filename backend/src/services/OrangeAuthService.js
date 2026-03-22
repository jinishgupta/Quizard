import { config } from '../config/env.js';
import { User } from '../db/models/User.js';

/**
 * Orange Authentication Service
 * Handles Orange ID authentication via Bedrock Passport API
 */
export class OrangeAuthService {
  constructor() {
    this.baseUrl = config.bedrock.baseUrl;
    this.tenantId = config.bedrock.tenantId;
    this.subscriptionKey = config.bedrock.subscriptionKey;
  }

  /**
   * Verify Orange ID token with Bedrock Passport API
   * @param {string} token - Orange ID JWT token
   * @returns {Promise<Object>} Orange user data
   */
  async verifyToken(token) {
    try {
      console.log('\n=== ORANGE AUTH SERVICE - VERIFY TOKEN ===');
      console.log('Base URL:', this.baseUrl);
      console.log('Tenant ID:', this.tenantId);
      console.log('Subscription Key:', this.subscriptionKey ? 'Present' : 'Missing');
      console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
      
      const response = await fetch(`${this.baseUrl}/api/v1/auth/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': this.tenantId,
          'X-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/json',
        },
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
        throw new Error(error.message || `Token verification failed: ${response.status}`);
      }

      const userData = await response.json();
      console.log('✅ Token verified successfully');
      console.log('User data:', JSON.stringify(userData, null, 2));
      console.log('=== ORANGE AUTH SERVICE SUCCESS ===\n');
      return userData;
    } catch (error) {
      console.log('❌ ORANGE AUTH SERVICE ERROR:', error.message);
      console.log('=== ORANGE AUTH SERVICE FAILED ===\n');
      throw new Error(`Failed to verify token: ${error.message}`);
    }
  }

  /**
   * Refresh Orange ID token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token and refresh token
   */
  async refreshToken(refreshToken) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'X-Tenant-Id': this.tenantId,
          'X-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Token refresh failed: ${response.status}`);
      }

      const tokens = await response.json();
      return {
        token: tokens.token || tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Sync user profile from Orange ID data
   * Upserts user data in database
   * @param {Object} orangeUser - Orange user data from Bedrock Passport
   * @returns {Promise<Object>} User record from database
   */
  async syncUserProfile(orangeUser) {
    try {
      // Map Orange user data to our user model
      const userData = {
        id: orangeUser.id,
        email: orangeUser.email,
        name: orangeUser.name,
        displayName: orangeUser.displayName,
        bio: orangeUser.bio,
        picture: orangeUser.picture,
        banner: orangeUser.banner,
        ethAddress: orangeUser.ethAddress,
        provider: orangeUser.provider,
      };

      // Upsert user in database
      const user = await User.upsertFromOrangeId(userData);
      return user;
    } catch (error) {
      throw new Error(`Failed to sync user profile: ${error.message}`);
    }
  }
}

export default new OrangeAuthService();
