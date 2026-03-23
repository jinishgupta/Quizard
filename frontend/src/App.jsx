import React, { useState, useEffect } from 'react';
import { BedrockPassportProvider } from "@bedrock_org/passport";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/tailwind.css';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { ChallengeProvider } from './contexts/ChallengeContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AuthTest from './pages/AuthTest';
import HomeDashboard from './pages/HomeDashboard';
import Categories from './pages/Categories';
import Challenge from './pages/Challenge';
import ChallengePlay from './pages/ChallengePlay';
import Leagues from './pages/Leagues';
import Profile from './pages/Profile';
import PlayScreen from './pages/PlayScreen';
import ResultsScreen from './pages/ResultsScreen';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// Global variable to track WalletConnect initialization
let walletConnectInitialized = false;

// Suppress WalletConnect initialization warnings
const originalConsoleWarn = console.warn;
console.warn = function(msg, ...args) {
  if (typeof msg === 'string' && (
    msg.includes('WalletConnect Core is already initialized') ||
    msg.includes('Firebase') ||
    msg.includes('CONFIGURATION_NOT_FOUND')
  )) {
    return;
  }
  originalConsoleWarn(msg, ...args);
};

// PassportProvider wrapper component
const PassportProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [providerInstance, setProviderInstance] = useState(null);

  useEffect(() => {
    if (!isReady) {
      setIsReady(true);
    }

    return () => {
      if (providerInstance && typeof providerInstance.removeAllListeners === 'function') {
        providerInstance.removeAllListeners();
      }
      walletConnectInitialized = false;
    };
  }, [isReady, providerInstance]);

  const handleError = (error) => {
    console.log('Auth provider error handled:', error.message);
    if (error.message.includes('Firebase') || error.message.includes('CONFIGURATION_NOT_FOUND')) {
      return;
    }
  };

  const handleProviderInit = (provider) => {
    walletConnectInitialized = true;
    setProviderInstance(provider);
  };

  return isReady ? (
    <BedrockPassportProvider
      baseUrl="https://api.bedrockpassport.com"
      authCallbackUrl="https://quizard-gljo.onrender.com/auth/callback"
      tenantId="orangeid-zEFEgXMII3"
      subscriptionKey="65c863c47911431abbc97f610f0fbba1"
      redirectionState={{}}
      passportOptions={{
        autoConnect: !walletConnectInitialized,
        cacheProvider: true,
        onProviderInit: handleProviderInit,
        onError: handleError
      }}
    >
      {children}
    </BedrockPassportProvider>
  ) : null;
};

function App() {
  // Capture Orange Game Pass token from URL on app load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const passToken = params.get('pass_token');
    
    if (passToken) {
      // Store in sessionStorage (per Orange Game Pass best practices)
      sessionStorage.setItem('game_pass_token', passToken);
      console.log('✅ Orange Game Pass token captured and stored');
      
      // Remove pass_token from URL to prevent accidental exposure
      params.delete('pass_token');
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Wagmi configuration
  const config = createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(),
    },
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PassportProvider>
          <Router>
            <AuthProvider>
              <ChallengeProvider>
                <div className="bg-[#0A0F1A] text-white antialiased">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/test" element={<ProtectedRoute><AuthTest /></ProtectedRoute>} />
                    
                    {/* Protected Routes */}
                    <Route path="/" element={<Navigate to="/home-dashboard" replace />} />
                    <Route path="/home-dashboard" element={<ProtectedRoute><HomeDashboard /></ProtectedRoute>} />
                    <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                    <Route path="/challenge" element={<ProtectedRoute><Challenge /></ProtectedRoute>} />
                    <Route path="/challenge/play" element={<ProtectedRoute><ChallengePlay /></ProtectedRoute>} />
                    <Route path="/leagues" element={<ProtectedRoute><Leagues /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/play-screen" element={<ProtectedRoute><PlayScreen /></ProtectedRoute>} />
                    <Route path="/results-screen" element={<ProtectedRoute><ResultsScreen /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  
                  {/* Rocket scripts */}
                  <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Faitriviale2100back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.17" />
                  <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.2" />
                </div>
              </ChallengeProvider>
            </AuthProvider>
          </Router>
        </PassportProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
