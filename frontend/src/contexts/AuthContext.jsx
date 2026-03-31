import { createContext, useContext, useEffect, useState } from 'react';
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
  const bedrockAuth = useBedrockPassport();
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // Get the auth token from Bedrock Passport
  const getToken = () => {
    // Try from hook first
    const hookToken = bedrockAuth.token || bedrockAuth.accessToken;
    if (hookToken) return hookToken;
    
    // Try localStorage fallbacks
    const stored = localStorage.getItem('bedrock_passport_token');
    if (stored) return stored;
    
    return null;
  };

  // Store token in localStorage when user logs in via Bedrock
  useEffect(() => {
    if (bedrockAuth.isLoggedIn && bedrockAuth.user) {
      const token = getToken();
      
      if (token) {
        localStorage.setItem('bedrock_passport_token', token);
      }
      
      if (bedrockAuth.user) {
        localStorage.setItem('bedrock_passport_user', JSON.stringify(bedrockAuth.user));
      }

      // Verify with backend to get DB user ID
      if (!verifying && !backendUser) {
        verifyWithBackend(token);
      }
    }
  }, [bedrockAuth.isLoggedIn, bedrockAuth.user, bedrockAuth.token, bedrockAuth.accessToken]);

  // On mount, check if we have a stored token and verify it
  useEffect(() => {
    const token = getToken();
    if (token && !bedrockAuth.isLoggedIn) {
      // We have a stored token but Bedrock hasn't initialized yet
      // Wait for Bedrock to catch up
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    if (!bedrockAuth.isLoggedIn) {
      setLoading(false);
    }
  }, []);

  // When bedrock auth state settles, update loading
  useEffect(() => {
    if (bedrockAuth.isLoggedIn !== undefined) {
      if (!bedrockAuth.isLoggedIn) {
        setLoading(false);
        setBackendUser(null);
      }
    }
  }, [bedrockAuth.isLoggedIn]);

  // Verify token with our backend (syncs user profile to DB)
  const verifyWithBackend = async (token) => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setVerifying(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setBackendUser(data.user);
          console.log('✅ Backend user verified:', data.user.username);
        }
      } else {
        console.warn('Backend auth verify failed:', response.status);
      }
    } catch (error) {
      console.error('Backend verify error:', error.message);
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Clear all stored auth data
    const keysToRemove = [
      'bedrock_passport_token',
      'bedrock_passport_refresh_token',
      'bedrock_passport_user',
      'bedrock_passport_wallet',
      'WEB3_CONNECT_CACHED_PROVIDER',
      'walletconnect',
      'WALLETCONNECT_DEEPLINK_CHOICE'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear game pass token
    sessionStorage.removeItem('game_pass_token');
    
    setBackendUser(null);
    
    // Call Bedrock Passport signOut
    if (bedrockAuth.signOut) {
      await bedrockAuth.signOut();
    }
    
    window.location.href = '/login';
  };

  const value = {
    user: backendUser || bedrockAuth.user,
    backendUser,
    isAuthenticated: bedrockAuth.isLoggedIn && !!getToken(),
    loading,
    logout: handleLogout,
    token: getToken(),
    refreshToken: null,
    login: () => {},
    refreshAccessToken: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
