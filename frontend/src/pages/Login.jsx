import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();

  const handleOrangeLogin = () => {
    // Construct Orange ID login URL
    const tenantId = import.meta.env.VITE_BEDROCK_TENANT_ID;
    const callbackUrl = encodeURIComponent(import.meta.env.VITE_BEDROCK_AUTH_CALLBACK_URL);
    const baseUrl = import.meta.env.VITE_BEDROCK_BASE_URL;
    
    const loginUrl = `${baseUrl}/auth/login?tenant_id=${tenantId}&redirect_uri=${callbackUrl}`;
    
    // Redirect to Orange ID login
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1A] via-[#1a1f2e] to-[#0A0F1A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-[#1a1f2e] rounded-2xl shadow-2xl p-8 border border-gray-800">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-4"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-4xl">🧠</span>
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Trivia Platform</h1>
            <p className="text-gray-400">Test your knowledge, compete with friends</p>
          </div>

          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOrangeLogin}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>Login with Orange ID</span>
          </motion.button>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Secure authentication powered by Bedrock Passport
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400">🎯</span>
              </div>
              <span className="text-sm">Multiple quiz categories</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-purple-400">🏆</span>
              </div>
              <span className="text-sm">Weekly league competitions</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400">⚡</span>
              </div>
              <span className="text-sm">Real-time challenges</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            Built for Orange Agent Jam Competition
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
