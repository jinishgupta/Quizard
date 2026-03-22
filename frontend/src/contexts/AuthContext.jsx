import { createContext, useContext, useEffect } from 'react';
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
  // Use Bedrock Passport hook directly
  const bedrockAuth = useBedrockPassport();

  // Store token in localStorage when user logs in
  useEffect(() => {
    if (bedrockAuth.isLoggedIn && bedrockAuth.user) {
      // Try to get token from the hook or localStorage
      const token = bedrockAuth.token || bedrockAuth.accessToken;
      
      if (token) {
        localStorage.setItem('bedrock_passport_token', token);
      }
      
      // Store user data
      if (bedrockAuth.user) {
        localStorage.setItem('bedrock_passport_user', JSON.stringify(bedrockAuth.user));
      }
    }
  }, [bedrockAuth.isLoggedIn, bedrockAuth.user, bedrockAuth.token, bedrockAuth.accessToken]);

  // Simply pass through the Bedrock Passport values
  const value = {
    user: bedrockAuth.user,
    isAuthenticated: bedrockAuth.isLoggedIn,
    loading: false,
    logout: bedrockAuth.signOut,
    token: bedrockAuth.token || bedrockAuth.accessToken,
    // Legacy compatibility
    refreshToken: null,
    login: () => {},
    refreshAccessToken: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
