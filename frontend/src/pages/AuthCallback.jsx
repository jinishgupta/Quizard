import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBedrockPassport } from '@bedrock_org/passport';
import { motion } from 'framer-motion';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loginCallback } = useBedrockPassport();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');

        if (!token || !refreshToken) {
          setError('Missing authentication tokens');
          setStatus('Authentication failed');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        setStatus('Processing Orange ID login...');

        // Call Bedrock Passport loginCallback
        const success = await loginCallback(token, refreshToken);

        if (!success) {
          throw new Error('Bedrock Passport login callback failed');
        }

        // Store passport-token state object (required by Bedrock Passport)
        localStorage.setItem('passport-token', JSON.stringify({ 
          state: { accessToken: token, refreshToken } 
        }));

        setStatus('Verifying with backend...');

        // Verify token with backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Authentication verification failed');
        }

        const data = await response.json();

        if (data.success && data.user) {
          setStatus('Success! Redirecting...');
          // Store tokens and user data
          login(token, refreshToken, data.user);
          
          // Redirect to home dashboard
          setTimeout(() => navigate('/home-dashboard'), 500);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err.message);
        setStatus('Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login, loginCallback]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1A] via-[#1a1f2e] to-[#0A0F1A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <div className="bg-[#1a1f2e] rounded-2xl shadow-2xl p-8 border border-gray-800 text-center">
          {/* Spinner or Success Icon */}
          <div className="mb-6">
            {error ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center"
              >
                <span className="text-5xl">❌</span>
              </motion.div>
            ) : status.includes('Success') ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center"
              >
                <span className="text-5xl">✅</span>
              </motion.div>
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center"
              >
                <span className="text-4xl">🔄</span>
              </motion.div>
            )}
          </div>

          {/* Status Text */}
          <h2 className="text-2xl font-bold text-white mb-2">{status}</h2>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-gray-500 text-xs mt-2">Redirecting to login...</p>
            </div>
          )}

          {!error && !status.includes('Success') && (
            <p className="text-gray-400 text-sm">
              Please wait while we verify your Orange ID...
            </p>
          )}

          {status.includes('Success') && (
            <p className="text-green-400 text-sm">
              Taking you to your dashboard...
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallback;
