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
      const response = await fetch(`${this.baseUrl}/api/v1/auth/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': this.tenantId,
          'X-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Token verification failed: ${response.status}`);
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
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
