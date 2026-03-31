import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const GamePassContext = createContext(null);

export const useGamePass = () => {
  const context = useContext(GamePassContext);
  if (!context) {
    throw new Error('useGamePass must be used within a GamePassProvider');
  }
  return context;
};

const API_URL = import.meta.env.VITE_API_URL;

export const GamePassProvider = ({ children }) => {
  const { token } = useAuth();
  const [passStatus, setPassStatus] = useState({
    isActive: false,
    secondsRemaining: 0,
    endsAt: null,
    status: 'UNKNOWN',
    loading: true,
  });
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [hasRedeemed, setHasRedeemed] = useState(false);
  const pollIntervalRef = useRef(null);
  const countdownRef = useRef(null);

  const getPassToken = () => sessionStorage.getItem('game_pass_token');

  // Redeem the game pass (starts the timer)
  const redeemPass = useCallback(async () => {
    const passToken = getPassToken();
    if (!passToken || isRedeeming) return null;

    setIsRedeeming(true);
    try {
      const response = await fetch(`${API_URL}/api/gamepass/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Game-Pass-Token': passToken,
        },
        body: JSON.stringify({ passToken }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to redeem pass');
      }

      const result = await response.json();
      setHasRedeemed(true);
      setPassStatus({
        isActive: true,
        secondsRemaining: result.seconds_remaining || 0,
        endsAt: result.ends_at || null,
        status: 'ACTIVE',
        loading: false,
      });
      return result;
    } catch (error) {
      console.error('Failed to redeem game pass:', error.message);
      return null;
    } finally {
      setIsRedeeming(false);
    }
  }, [isRedeeming]);

  // Check game pass status
  const checkStatus = useCallback(async () => {
    const passToken = getPassToken();
    if (!passToken) {
      setPassStatus(prev => ({ ...prev, isActive: false, status: 'NO_TOKEN', loading: false }));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/gamepass/status`, {
        method: 'GET',
        headers: {
          'X-Game-Pass-Token': passToken,
        },
      });

      if (!response.ok) {
        setPassStatus(prev => ({ ...prev, isActive: false, status: 'ERROR', loading: false }));
        return;
      }

      const result = await response.json();
      const isActive = result.status === 'ACTIVE' && (result.seconds_remaining || 0) > 0;
      
      setPassStatus({
        isActive,
        secondsRemaining: result.seconds_remaining || 0,
        endsAt: result.ends_at || null,
        status: result.status || 'UNKNOWN',
        loading: false,
      });
    } catch (error) {
      console.error('Failed to check game pass status:', error.message);
      setPassStatus(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Auto-redeem on first load when pass token is present
  useEffect(() => {
    const passToken = getPassToken();
    if (passToken && !hasRedeemed) {
      redeemPass();
    } else if (!passToken) {
      setPassStatus(prev => ({ ...prev, loading: false, status: 'NO_TOKEN' }));
    }
  }, []);

  // Poll status every 30 seconds while active
  useEffect(() => {
    if (passStatus.isActive) {
      pollIntervalRef.current = setInterval(() => {
        checkStatus();
      }, 30000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [passStatus.isActive, checkStatus]);

  // Local countdown timer (decrements every second without API call)
  useEffect(() => {
    if (passStatus.isActive && passStatus.secondsRemaining > 0) {
      countdownRef.current = setInterval(() => {
        setPassStatus(prev => {
          const newRemaining = prev.secondsRemaining - 1;
          if (newRemaining <= 0) {
            return {
              ...prev,
              isActive: false,
              secondsRemaining: 0,
              status: 'EXPIRED',
            };
          }
          return { ...prev, secondsRemaining: newRemaining };
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [passStatus.isActive, passStatus.endsAt]);

  // Format remaining time for display
  const formatTime = (seconds) => {
    if (seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const value = {
    ...passStatus,
    formattedTime: formatTime(passStatus.secondsRemaining),
    isRedeeming,
    hasRedeemed,
    redeemPass,
    checkStatus,
    getPassToken,
  };

  return (
    <GamePassContext.Provider value={value}>
      {children}
      
      {/* Floating Game Pass Timer — visible when active */}
      {passStatus.isActive && passStatus.secondsRemaining > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 9999,
            background: passStatus.secondsRemaining <= 60
              ? 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.95))'
              : 'linear-gradient(135deg, rgba(249,115,22,0.9), rgba(234,88,12,0.95))',
            backdropFilter: 'blur(12px)',
            borderRadius: 12,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.15)',
            animation: passStatus.secondsRemaining <= 60 ? 'pulse 2s infinite' : 'none',
          }}
        >
          <span style={{ fontSize: 14 }}>⏳</span>
          <span style={{
            fontFamily: 'monospace',
            fontWeight: 900,
            fontSize: 14,
            color: '#fff',
            letterSpacing: 1,
          }}>
            {formatTime(passStatus.secondsRemaining)}
          </span>
        </div>
      )}

      {/* Game Pass Expired overlay */}
      {passStatus.status === 'EXPIRED' && hasRedeemed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: 20,
              padding: '40px 32px',
              maxWidth: 420,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
              Game Pass Expired
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Your timed access has ended. Purchase a new Game Pass to continue playing quizzes and using hints.
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem('game_pass_token');
                window.location.href = '/home-dashboard';
              }}
              style={{
                background: 'linear-gradient(135deg, #ea580c, #f97316)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px 32px',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
              }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </GamePassContext.Provider>
  );
};
