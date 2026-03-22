import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const ChallengeContext = createContext(null);

export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return context;
};

export const ChallengeProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [challengeResult, setChallengeResult] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      }
      return;
    }

    // Create socket connection
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const newSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setIsConnected(true);
      
      // Authenticate socket connection
      newSocket.emit('authenticate', { token });
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsAuthenticated(false);
      
      // Only show error if we were in an active challenge
      if (currentChallenge) {
        toast.error('Connection lost. Reconnecting...');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      toast.error('Failed to connect to server');
    });

    newSocket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
      setIsAuthenticated(true);
      toast.success('Connected to challenge server');
    });

    // Challenge event handlers
    newSocket.on('challenge:created', (data) => {
      console.log('Challenge created:', data);
      setCurrentChallenge(data);
      toast.success('Challenge sent!');
    });

    newSocket.on('challenge:received', (data) => {
      console.log('Challenge received:', data);
      toast.info('You have a new challenge!');
    });

    newSocket.on('challenge:started', (data) => {
      console.log('Challenge started:', data);
      setCurrentChallenge((prev) => ({
        ...prev,
        status: 'active',
        totalQuestions: data.totalQuestions,
      }));
    });

    newSocket.on('challenge:question', (data) => {
      console.log('New question:', data);
      setCurrentQuestion(data.question);
      setOpponentAnswered(false);
    });

    newSocket.on('challenge:answer_result', (data) => {
      console.log('Answer result:', data);
      setAnswerResult(data);
    });

    newSocket.on('challenge:opponent_answer', (data) => {
      console.log('Opponent answered:', data);
      setOpponentAnswered(true);
    });

    newSocket.on('challenge:opponent_left', (data) => {
      console.log('Opponent left:', data);
      toast.warning('Your opponent has left the challenge');
      
      // Clear challenge state and navigate back
      setTimeout(() => {
        setCurrentChallenge(null);
        setCurrentQuestion(null);
      }, 2000);
    });

    newSocket.on('challenge:result', (data) => {
      console.log('Challenge result:', data);
      setChallengeResult(data);
      setCurrentChallenge(null);
      setCurrentQuestion(null);
    });

    newSocket.on('challenge:error', (error) => {
      console.error('Challenge error:', error);
      toast.error(error.message || 'Challenge error occurred');
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token, user]);

  // Create a new challenge
  const createChallenge = (opponentId, categoryId, difficulty) => {
    if (!socket || !isAuthenticated) {
      toast.error('Not connected to server');
      return;
    }

    socket.emit('challenge:create', {
      opponentId,
      categoryId,
      difficulty,
      token,
    });
  };

  // Join a challenge
  const joinChallenge = (challengeId) => {
    if (!socket || !isAuthenticated) {
      toast.error('Not connected to server');
      return;
    }

    socket.emit('challenge:join', { challengeId });
  };

  // Submit an answer
  const submitAnswer = (challengeId, questionIndex, answer, timeSpent) => {
    if (!socket || !isAuthenticated) {
      toast.error('Not connected to server');
      return;
    }

    socket.emit('challenge:answer', {
      challengeId,
      questionIndex,
      answer,
      timeSpent,
    });
  };

  // Leave a challenge
  const leaveChallenge = (challengeId) => {
    if (!socket || !isAuthenticated) {
      return;
    }

    socket.emit('challenge:leave', { challengeId });
    setCurrentChallenge(null);
    setCurrentQuestion(null);
    setOpponentAnswered(false);
  };

  // Reset state when new question arrives
  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setTimeLeft(currentQuestion.timeLimit || 30);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion]);

  // Clear challenge result
  const clearResult = () => {
    setChallengeResult(null);
    setAnswerResult(null);
  };

  const value = {
    socket,
    isConnected,
    isAuthenticated,
    currentChallenge,
    currentQuestion,
    opponentAnswered,
    challengeResult,
    answerResult,
    createChallenge,
    joinChallenge,
    submitAnswer,
    leaveChallenge,
    clearResult,
  };

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
};
