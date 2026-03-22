const API_URL = import.meta.env.VITE_API_URL;

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Get the Bedrock Passport token from localStorage
 */
const getBedrockToken = () => {
  // Bedrock Passport stores token with this key
  return localStorage.getItem('bedrock_passport_token');
};

/**
 * Get the Bedrock Passport refresh token from localStorage
 */
const getBedrockRefreshToken = () => {
  // Bedrock Passport stores refresh token with this key
  return localStorage.getItem('bedrock_passport_refresh_token');
};

/**
 * Refresh the access token
 */
const refreshAccessToken = async () => {
  const refreshToken = getBedrockRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  localStorage.setItem('bedrock_passport_token', data.token);
  localStorage.setItem('bedrock_passport_refresh_token', data.refreshToken);
  
  return data.token;
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/api/users/profile')
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getBedrockToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Handle 401 Unauthorized - token expired
  if (response.status === 401 && token) {
    if (!isRefreshing) {
      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(newToken);
        
        // Retry the original request with new token
        config.headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(`${API_URL}${endpoint}`, config);
        
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({}));
          throw new Error(error.message || `Request failed: ${retryResponse.status}`);
        }
        
        return retryResponse.json();
      } catch (error) {
        isRefreshing = false;
        // Clear tokens and redirect to login
        localStorage.removeItem('bedrock_passport_token');
        localStorage.removeItem('bedrock_passport_refresh_token');
        localStorage.removeItem('bedrock_passport_user');
        window.location.href = '/login';
        throw error;
      }
    } else {
      // Wait for token refresh to complete
      return new Promise((resolve, reject) => {
        addRefreshSubscriber(async (newToken) => {
          try {
            config.headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(`${API_URL}${endpoint}`, config);
            
            if (!retryResponse.ok) {
              const error = await retryResponse.json().catch(() => ({}));
              reject(new Error(error.message || `Request failed: ${retryResponse.status}`));
            }
            
            resolve(retryResponse.json());
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  return response.json();
};

/**
 * GET request
 */
export const get = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

/**
 * POST request
 */
export const post = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request
 */
export const put = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request
 */
export const del = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};
