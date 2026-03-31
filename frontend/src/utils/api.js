const API_URL = import.meta.env.VITE_API_URL;

/**
 * Get the Orange Game Pass token from sessionStorage
 */
const getGamePassToken = () => {
  return sessionStorage.getItem('game_pass_token');
};

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
  // First try the standard key we set in AuthContext
  let token = localStorage.getItem('bedrock_passport_token');
  if (token) return token;
  
  // Try other possible keys
  const possibleKeys = [
    'bedrockPassportToken',
    'bp_token',
    'accessToken'
  ];
  
  for (const key of possibleKeys) {
    token = localStorage.getItem(key);
    if (token) return token;
  }
  
  // Check JSON storage
  try {
    const bedrockData = localStorage.getItem('bedrock_passport_user');
    if (bedrockData) {
      const parsed = JSON.parse(bedrockData);
      if (parsed.token || parsed.accessToken) {
        return parsed.token || parsed.accessToken;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  // Last resort: scan for JWT tokens
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      if (value && typeof value === 'string' && value.startsWith('eyJ') && value.split('.').length === 3) {
        return value;
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  return null;
};

/**
 * Get the Bedrock Passport refresh token from localStorage
 */
const getBedrockRefreshToken = () => {
  const possibleKeys = [
    'bedrock_passport_refresh_token',
    'bedrockPassportRefreshToken',
    'bp_refresh_token',
    'refreshToken'
  ];
  
  for (const key of possibleKeys) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  
  try {
    const bedrockData = localStorage.getItem('bedrock_passport_user');
    if (bedrockData) {
      const parsed = JSON.parse(bedrockData);
      if (parsed.refreshToken) return parsed.refreshToken;
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  return null;
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
    headers: { 'Content-Type': 'application/json' },
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

  // Attach Orange Game Pass token
  const gamePassToken = getGamePassToken();
  if (gamePassToken) {
    defaultHeaders['X-Game-Pass-Token'] = gamePassToken;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Handle 403 Game Pass Expired
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.error === 'GAME_PASS_EXPIRED') {
      // Dispatch custom event so GamePassContext can handle it
      window.dispatchEvent(new CustomEvent('gamepass:expired', { detail: errorData }));
      throw new Error('Game Pass has expired. Please purchase a new one.');
    }
    if (errorData.error === 'GAME_PASS_REQUIRED') {
      throw new Error('Game Pass required. Please access the app via your Game Pass link.');
    }
    throw new Error(errorData.message || 'Access forbidden');
  }

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
        localStorage.removeItem('bedrock_passport_token');
        localStorage.removeItem('bedrock_passport_refresh_token');
        localStorage.removeItem('bedrock_passport_user');
        window.location.href = '/login';
        throw error;
      }
    } else {
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

/** GET request */
export const get = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

/** POST request */
export const post = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/** PUT request */
export const put = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/** DELETE request */
export const del = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};
