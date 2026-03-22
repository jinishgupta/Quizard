import { createContext, useContext } from 'react';
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

  // Simply pass through the Bedrock Passport values
  const value = {
    user: bedrockAuth.user,
    isAuthenticated: bedrockAuth.isLoggedIn,
    loading: false,
    logout: bedrockAuth.signOut,
    // Legacy compatibility
    token: null,
    refreshToken: null,
    login: () => {},
    refreshAccessToken: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
