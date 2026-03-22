import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { get } from '../utils/api';
import { motion } from 'framer-motion';

const AuthTest = () => {
  const { user, token, logout } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAuthEndpoint = async () => {
    setLoading(true);
    try {
      const response = await get('/api/auth/verify');
      setTestResult({ success: true, data: response });
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1A] via-[#1a1f2e] to-[#0A0F1A] p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1f2e] rounded-2xl shadow-2xl p-8 border border-gray-800"
        >
          <h1 className="text-3xl font-bold text-white mb-6">🔐 Authentication Test</h1>

          {/* User Info */}
          <div className="mb-6 p-4 bg-[#0A0F1A] rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">User Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-400 w-32">Orange ID:</span>
                <span className="text-white font-mono">{user?.orangeId || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-32">Username:</span>
                <span className="text-white">{user?.username || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-32">Display Name:</span>
                <span className="text-white">{user?.displayName || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-32">Email:</span>
                <span className="text-white">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-32">ETH Address:</span>
                <span className="text-white font-mono text-xs">{user?.ethAddress || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-32">Provider:</span>
                <span className="text-white">{user?.provider || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-32">Credits:</span>
                <span className="text-white">{user?.credits || 0}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-32">Current Streak:</span>
                <span className="text-white">{user?.currentStreak || 0} days</span>
              </div>
            </div>
          </div>

          {/* Token Info */}
          <div className="mb-6 p-4 bg-[#0A0F1A] rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">Token Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-400 w-32">Token:</span>
                <span className="text-white font-mono text-xs break-all">
                  {token ? `${token.substring(0, 50)}...` : 'N/A'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-32">Status:</span>
                <span className="text-green-400">✓ Authenticated</span>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="mb-6">
            <button
              onClick={testAuthEndpoint}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test /api/auth/verify Endpoint'}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                testResult.success
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">
                {testResult.success ? '✅ Success' : '❌ Error'}
              </h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
              </pre>
            </motion.div>
          )}

          {/* Logout Button */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <button
              onClick={logout}
              className="w-full bg-red-500/20 text-red-400 font-semibold py-3 px-6 rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthTest;
