import { createContext, useContext, useState, useEffect } from 'react';
import { useBedrockPassport } from '@bedrock_org/passport';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { signOut } = useBedrockPassport();

  // Load user data from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('orange_token');
    const storedRefreshToken = localStorage.getItem('orange_refresh_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (tokenData, refreshTokenData, userData) => {
    localStorage.setItem('orange_token', tokenData);
    localStorage.setItem('orange_refresh_token', refreshTokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenData);
    setRefreshToken(refreshTokenData);
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Call Bedrock Passport signOut to clear SDK state
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all local storage
      localStorage.removeItem('orange_token');
      localStorage.removeItem('orange_refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('passport-token');
      localStorage.removeItem('bedrock:accessToken');
      localStorage.removeItem('bedrock:refreshToken');
      
      // Clear state
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
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
      login(data.token, data.refreshToken, user);
      return data.token;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return null;
    }
  };

  const value = {
    user,
    token,
    refreshToken,
    loading,
    login,
    logout,
    refreshAccessToken,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
