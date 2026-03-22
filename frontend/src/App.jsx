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

function App() {
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
        <BedrockPassportProvider
          baseUrl={import.meta.env.VITE_BEDROCK_BASE_URL}
          authCallbackUrl={import.meta.env.VITE_BEDROCK_AUTH_CALLBACK_URL}
          tenantId={import.meta.env.VITE_BEDROCK_TENANT_ID}
          subscriptionKey={import.meta.env.VITE_BEDROCK_SUBSCRIPTION_KEY}
          defaultChainId={1}
          isBeta={false}
        >
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
        </BedrockPassportProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
