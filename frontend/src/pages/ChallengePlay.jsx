import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Swords, Clock, CheckCircle, XCircle, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useChallenge } from '../contexts/ChallengeContext';

export default function ChallengePlay() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    currentQuestion,
    opponentAnswered,
    challengeResult,
    answerResult,
    submitAnswer,
    clearResult,
    isConnected,
  } = useChallenge();

  const challengeId = searchParams.get('id');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Timer countdown
  useEffect(() => {
    if (!currentQuestion || hasAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, hasAnswered]);

  // Reset state when new question arrives
  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswer(null);
      setHasAnswered(false);
      setTimeLeft(currentQuestion.timeLimit || 30);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion]);

  // Handle answer result from context
  useEffect(() => {
    if (answerResult && answerResult.challengeId === challengeId) {
      if (answerResult.isCorrect) {
        setMyScore((prev) => prev + answerResult.pointsEarned);
        toast.success(`+${answerResult.pointsEarned} points!`);
      } else {
        toast.error('Incorrect answer');
      }
    }
  }, [answerResult, challengeId]);

  // Handle challenge result
  useEffect(() => {
    if (challengeResult) {
      // Show result modal after a brief delay
      setTimeout(() => {
        // Navigate to results page or show modal
      }, 1000);
    }
  }, [challengeResult]);

  const handleTimeout = () => {
    if (hasAnswered) return;
    
    setHasAnswered(true);
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    // Submit empty answer for timeout
    submitAnswer(challengeId, currentQuestion.index, '', timeSpent);
    
    toast.error('Time\'s up!');
  };

  const handleAnswerSelect = (answer) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(answer);
    setHasAnswered(true);
    
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    // Submit answer via WebSocket
    submitAnswer(challengeId, currentQuestion.index, answer, timeSpent);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] diagonal-pattern flex flex-col items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto mb-4 text-[#60A5FA] animate-pulse" size={48} />
          <p className="text-white text-xl font-bold">Connecting to challenge...</p>
        </div>
      </div>
    );
  }

  if (challengeResult) {
    const isWinner = challengeResult.winnerId === user?.id;
    const isDraw = !challengeResult.winnerId;

    return (
      <div className="min-h-screen bg-[#0A0F1A] diagonal-pattern flex flex-col">
        <Navbar />

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg"
          >
            <Card variant="elevated" padding="lg">
              <div className="text-center space-y-6">
                <div className="text-6xl">
                  {isWinner ? '🏆' : isDraw ? '🤝' : '😔'}
                </div>
                
                <div>
                  <h1 className="text-3xl font-black text-white mb-2">
                    {isWinner ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat'}
                  </h1>
                  <p className="text-[#6B7280]">
                    {isWinner
                      ? 'You won the challenge!'
                      : isDraw
                      ? 'You tied with your opponent!'
                      : 'Better luck next time!'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1F2937] rounded-lg p-4">
                    <p className="text-xs text-[#6B7280] mb-1">Your Score</p>
                    <p className="text-2xl font-black text-[#FCD34D]">
                      {challengeResult.challengerScore}
                    </p>
                  </div>
                  <div className="bg-[#1F2937] rounded-lg p-4">
                    <p className="text-xs text-[#6B7280] mb-1">Opponent Score</p>
                    <p className="text-2xl font-black text-[#60A5FA]">
                      {challengeResult.opponentScore}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      clearResult();
                      navigate('/challenge');
                    }}
                    className="w-full py-3 rounded-xl bg-[#1D4ED8] border-2 border-[#3B82F6] text-white font-bold hover:bg-[#1E40AF] transition-colors"
                  >
                    Back to Challenges
                  </button>
                  <button
                    onClick={() => navigate('/home-dashboard')}
                    className="w-full py-3 rounded-xl border border-[#374151] text-[#6B7280] font-semibold hover:border-[#4B5563] hover:text-[#9CA3AF] transition-all"
                  >
                    Home
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] diagonal-pattern flex flex-col items-center justify-center">
        <div className="text-center">
          <Swords className="mx-auto mb-4 text-[#60A5FA] animate-pulse" size={48} />
          <p className="text-white text-xl font-bold">Waiting for challenge to start...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1A] diagonal-pattern flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Disconnection Warning */}
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card variant="elevated" padding="md" className="border-[#DC2626] bg-[#7F1D1D]">
                <div className="flex items-center gap-3">
                  <XCircle className="text-[#F87171]" size={24} />
                  <div>
                    <p className="text-sm font-bold text-[#F87171]">
                      Connection Lost
                    </p>
                    <p className="text-xs text-[#FCA5A5]">
                      Attempting to reconnect...
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Header with timer and scores */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Swords className="text-[#60A5FA]" size={24} />
              <div>
                <p className="text-xs text-[#6B7280]">Question {currentQuestion.index + 1}</p>
                <p className="text-sm font-bold text-white">Live Challenge</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* My Score */}
              <div className="text-right">
                <p className="text-xs text-[#6B7280]">Your Score</p>
                <p className="text-lg font-black text-[#FCD34D]">{myScore}</p>
              </div>

              {/* Timer */}
              <div
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                  timeLeft <= 5
                    ? 'border-[#F87171] bg-[#7F1D1D]'
                    : 'border-[#3B82F6] bg-[#1E3A5F]'
                }`}
              >
                <span className="text-2xl font-black text-white">{timeLeft}</span>
              </div>
            </div>
          </div>

          {/* Opponent Status */}
          <Card variant="elevated" padding="sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1F2937] flex items-center justify-center">
                  👤
                </div>
                <p className="text-sm font-bold text-white">Opponent</p>
              </div>
              <div className="flex items-center gap-2">
                {opponentAnswered ? (
                  <>
                    <CheckCircle className="text-[#4ADE80]" size={16} />
                    <span className="text-xs font-bold text-[#4ADE80]">Answered</span>
                  </>
                ) : (
                  <>
                    <Clock className="text-[#F59E0B] animate-pulse" size={16} />
                    <span className="text-xs font-bold text-[#F59E0B]">Thinking...</span>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Question */}
          <motion.div
            key={currentQuestion.index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card variant="brutal" padding="lg">
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                {currentQuestion.question}
              </h2>
            </Card>
          </motion.div>

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {currentQuestion.options?.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const showResult = hasAnswered && answerResult;
                const isCorrectAnswer = showResult && answerResult.isCorrect && isSelected;
                const isWrongAnswer = showResult && !answerResult.isCorrect && isSelected;

                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={hasAnswered}
                    className={`p-4 rounded-xl border-2 text-left font-bold transition-all ${
                      isCorrectAnswer
                        ? 'bg-[#14532D] border-[#16A34A] text-[#4ADE80]'
                        : isWrongAnswer
                        ? 'bg-[#7F1D1D] border-[#DC2626] text-[#F87171]'
                        : isSelected
                        ? 'bg-[#1E3A5F] border-[#3B82F6] text-white'
                        : hasAnswered
                        ? 'bg-[#1F2937] border-[#374151] text-[#6B7280] cursor-not-allowed'
                        : 'bg-[#1F2937] border-[#374151] text-white hover:border-[#4B5563] hover:bg-[#374151]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {isCorrectAnswer && <CheckCircle size={20} />}
                      {isWrongAnswer && <XCircle size={20} />}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Answer Feedback */}
          {hasAnswered && answerResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                variant="elevated"
                padding="md"
                className={
                  answerResult.isCorrect
                    ? 'border-[#16A34A]'
                    : 'border-[#DC2626]'
                }
              >
                <div className="flex items-center gap-3">
                  {answerResult.isCorrect ? (
                    <>
                      <Zap className="text-[#4ADE80]" size={24} />
                      <div>
                        <p className="text-sm font-bold text-[#4ADE80]">
                          Correct! +{answerResult.pointsEarned} points
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          Waiting for next question...
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-[#F87171]" size={24} />
                      <div>
                        <p className="text-sm font-bold text-[#F87171]">
                          Incorrect
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          Waiting for next question...
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
