import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Lightbulb, Eye, AlignLeft, ArrowRight, Home } from 'lucide-react';
import CreditBadge from './CreditBadge';
import { Toaster, toast } from 'sonner';
import { useCreateSession, useSubmitAnswer, useCompleteSession, useHintEliminate, useHintClue, useHintFirstLetter, useCreditBalance } from '../hooks/useApi';

const CREDITS_HINT_ELIMINATE = 6;
const CREDITS_HINT_CLUE = 6;
const CREDITS_HINT_FIRST_LETTER = 6;

export default function PlayScreenClient() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId, categoryName } = location.state || {};
  
  const [session, setSession] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered');
  const [timeLeft, setTimeLeft] = useState(30);
  const [results, setResults] = useState([]);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [clueText, setClueText] = useState(null);
  const [firstLetter, setFirstLetter] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const { data: creditData } = useCreditBalance();
  const createSession = useCreateSession();
  const submitAnswer = useSubmitAnswer();
  const completeSession = useCompleteSession();
  const hintEliminate = useHintEliminate();
  const hintClue = useHintClue();
  const hintFirstLetter = useHintFirstLetter();

  const credits = creditData?.balance || 0;

  // Create session on mount
  useEffect(() => {
    if (!categoryId) {
      toast.error('Please select a category');
      navigate('/home-dashboard');
      return;
    }

    createSession.mutate(
      { categoryId, difficulty: 'medium' },
      {
        onSuccess: (data) => {
          setSession(data.session);
          setTimeLeft(data.session.questions[0]?.timeLimit || 30);
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to create session');
          navigate('/home-dashboard');
        },
      }
    );
  }, [categoryId]);

  const question = session?.questions?.[currentQ];
  const progress = session ? ((currentQ) / session.totalQuestions) * 100 : 0;
  const isAnswered = answerState !== 'unanswered';
  const timerPercent = question ? (timeLeft / question.timeLimit) * 100 : 0;
  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#f97316';

  const handleTimeUp = useCallback(() => {
    if (answerState === 'unanswered' && question) {
      setAnswerState('wrong');
      submitAnswer.mutate({
        sessionId: session.id,
        questionIndex: currentQ,
        answer: null,
        timeSpent: question.timeLimit,
      });
      setResults((prev) => [
        ...prev,
        { questionIndex: currentQ, selectedIndex: null, correct: false, timeSpent: question.timeLimit },
      ]);
    }
  }, [answerState, question, session, currentQ]);

  useEffect(() => {
    if (isAnswered || !question) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQ, isAnswered, handleTimeUp, question]);

  const handleAnswer = (index) => {
    if (isAnswered || !question) return;
    clearInterval(timerRef.current);
    const timeSpent = question.timeLimit - timeLeft;
    const selectedAnswerText = question.options[index];
    const correct = selectedAnswerText === question.correctAnswer;
    
    setSelectedAnswer(index);
    setAnswerState(correct ? 'correct' : 'wrong');
    
    submitAnswer.mutate({
      sessionId: session.id,
      questionIndex: currentQ,
      answer: selectedAnswerText,
      timeSpent,
    });
    
    setResults((prev) => [...prev, { questionIndex: currentQ, selectedIndex: index, correct, timeSpent }]);
  };

  const handleNext = () => {
    if (isTransitioning || !session) return;
    setIsTransitioning(true);

    const nextQ = currentQ + 1;
    if (nextQ >= session.totalQuestions) {
      completeSession.mutate(session.id, {
        onSuccess: (data) => {
          sessionStorage.setItem('triviaResults', JSON.stringify({
            ...data,
            category: categoryName,
          }));
          navigate('/results-screen');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to complete session');
          navigate('/home-dashboard');
        },
      });
      return;
    }

    setTimeout(() => {
      setCurrentQ(nextQ);
      setSelectedAnswer(null);
      setAnswerState('unanswered');
      setTimeLeft(session.questions[nextQ]?.timeLimit || 30);
      setEliminatedOptions([]);
      setClueText(null);
      setFirstLetter(null);
      setIsTransitioning(false);
      startTimeRef.current = Date.now();
    }, 300);
  };

  const handleEliminate = () => {
    if (!question || !session) return;
    if (eliminatedOptions.length > 0) {
      toast.info('Already used on this question');
      return;
    }
    if (credits < CREDITS_HINT_ELIMINATE) {
      toast.error(`Insufficient credits. Need ${CREDITS_HINT_ELIMINATE} credits.`);
      return;
    }

    hintEliminate.mutate(
      { sessionId: session.id, questionIndex: currentQ },
      {
        onSuccess: (data) => {
          setEliminatedOptions(data.eliminatedIndices || []);
          toast.success('2 wrong answers eliminated!');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to eliminate options');
        },
      }
    );
  };

  const handleClue = () => {
    if (!question || !session) return;
    if (clueText) {
      toast.info('Clue already revealed');
      return;
    }
    if (credits < CREDITS_HINT_CLUE) {
      toast.error(`Insufficient credits. Need ${CREDITS_HINT_CLUE} credits.`);
      return;
    }

    hintClue.mutate(
      { sessionId: session.id, questionIndex: currentQ },
      {
        onSuccess: (data) => {
          setClueText(data.clue);
          toast.success('Clue revealed!');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to get clue');
        },
      }
    );
  };

  const handleFirstLetterReveal = () => {
    if (!question || !session) return;
    if (firstLetter) {
      toast.info('Already revealed');
      return;
    }
    if (credits < CREDITS_HINT_FIRST_LETTER) {
      toast.error(`Insufficient credits. Need ${CREDITS_HINT_FIRST_LETTER} credits.`);
      return;
    }

    hintFirstLetter.mutate(
      { sessionId: session.id, questionIndex: currentQ },
      {
        onSuccess: (data) => {
          setFirstLetter(data.firstLetter);
          toast.success(`First letter: "${data.firstLetter}"`);
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to reveal first letter');
        },
      }
    );
  };

  const getOptionClass = (index) => {
    if (!question) return 'answer-btn';
    if (eliminatedOptions.includes(index)) return 'answer-btn dimmed';
    if (!isAnswered) return 'answer-btn';
    const correctIndex = question.options.indexOf(question.correctAnswer);
    if (index === correctIndex) return 'answer-btn correct';
    if (index === selectedAnswer && index !== correctIndex) return 'answer-btn wrong';
    return 'answer-btn dimmed';
  };

  if (!session || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0F0F0F 0%, #141414 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timerPercent / 100) * circumference;
  const correctIndex = question.options.indexOf(question.correctAnswer);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0F0F0F 0%, #141414 100%)' }}
    >
      <Toaster position="top-center" theme="dark" />

      <div className="h-1 w-full bg-surface-elevated">
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #ea580c, #f97316, #fb923c)' }}
          initial={{ width: `${progress}%` }}
          animate={{ width: `${((currentQ) / session.totalQuestions) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        <button
          onClick={() => navigate('/home-dashboard')}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-150"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            {categoryName}
          </span>
          <span
            className="text-sm font-black text-white px-3 py-1 rounded-full"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}
          >
            Q {currentQ + 1}/{session.totalQuestions}
          </span>
        </div>

        <CreditBadge amount={credits} size="sm" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-4 max-w-2xl mx-auto w-full">

        <AnimatePresence mode="wait">
          <motion.div
            key={`question-${currentQ}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full space-y-6"
          >
            <div className="flex justify-center">
              <div className="relative">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle
                    cx="40" cy="40" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="40" cy="40" r={radius}
                    fill="none"
                    stroke={timerColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="timer-circle transition-all duration-1000 linear"
                    style={{
                      filter: timeLeft <= 5 ? 'drop-shadow(0 0 6px rgba(239,68,68,0.6))' : 'drop-shadow(0 0 4px rgba(249,115,22,0.4))',
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-xl font-black font-mono tabular-nums"
                    style={{ color: timerColor }}
                  >
                    {timeLeft}
                  </span>
                </div>
              </div>
            </div>

            {clueText && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-4 py-3 rounded-lg text-sm text-yellow-300 font-medium"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                💡 <span className="font-bold">Clue:</span> {clueText}
              </motion.div>
            )}

            {firstLetter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-4 py-3 rounded-lg text-sm text-blue-300 font-medium"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                🔤 <span className="font-bold">First letter of answer:</span>{' '}
                <span className="text-2xl font-black font-mono">{firstLetter}</span>
              </motion.div>
            )}

            <div
              className="p-6 md:p-8 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(22,22,22,0.98))',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <p className="text-xl md:text-2xl font-bold text-white leading-snug">
                {question.question}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={`option-${index}`}
                  onClick={() => handleAnswer(index)}
                  disabled={isAnswered || eliminatedOptions.includes(index)}
                  className={`${getOptionClass(index)} min-h-[56px] p-4 rounded-xl text-left flex items-center gap-3 w-full`}
                  style={{
                    background: isAnswered
                      ? undefined
                      : selectedAnswer === index
                      ? 'rgba(249,115,22,0.15)'
                      : 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(22,22,22,0.98))',
                    border: isAnswered
                      ? undefined
                      : '1px solid rgba(255,255,255,0.08)',
                  }}
                  whileTap={!isAnswered ? { scale: 0.97 } : {}}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 transition-all duration-150"
                    style={{
                      background:
                        isAnswered && index === correctIndex
                          ? 'rgba(255,255,255,0.2)'
                          : isAnswered && index === selectedAnswer
                          ? 'rgba(255,255,255,0.15)'
                          : 'rgba(249,115,22,0.15)',
                      color:
                        isAnswered && index === correctIndex
                          ? '#fff'
                          : isAnswered && index === selectedAnswer
                          ? '#fff' :'#f97316',
                    }}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-sm md:text-base font-semibold text-white leading-snug">
                    {option}
                  </span>
                  {isAnswered && index === correctIndex && (
                    <CheckCircle size={18} className="ml-auto text-green-300 shrink-0" />
                  )}
                  {isAnswered && index === selectedAnswer && index !== correctIndex && (
                    <XCircle size={18} className="ml-auto text-red-300 shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-4 rounded-xl flex items-start gap-3 ${
                    answerState === 'correct' ?'bg-green-500/10 border border-green-500/25' :'bg-red-500/10 border border-red-500/25'
                  }`}
                >
                  {answerState === 'correct' ? (
                    <CheckCircle size={20} className="text-green-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-bold text-sm mb-1 ${answerState === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                      {answerState === 'correct' ? '🎉 Correct!' : selectedAnswer === null ? '⏰ Time\'s up!' : '✗ Incorrect'}
                    </p>
                    {answerState !== 'correct' && (
                      <p className="text-sm text-gray-300">
                        Correct answer: <span className="font-bold text-white">{question.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="sticky bottom-0 px-4 md:px-8 py-4 space-y-3"
        style={{
          background: 'rgba(15,15,15,0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {!isAnswered && (
          <div className="flex items-center justify-center gap-2 flex-wrap max-w-2xl mx-auto">
            <span className="text-xs text-gray-600 font-medium mr-1">Hints:</span>
            <button
              onClick={handleEliminate}
              disabled={eliminatedOptions.length > 0 || hintEliminate.isPending || credits < CREDITS_HINT_ELIMINATE}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                eliminatedOptions.length > 0 || hintEliminate.isPending || credits < CREDITS_HINT_ELIMINATE
                  ? 'opacity-40 cursor-not-allowed' :'hover:scale-105 active:scale-95'
              }`}
              style={{
                background: 'rgba(249,115,22,0.12)',
                border: '1px solid rgba(249,115,22,0.25)',
                color: '#fb923c',
              }}
            >
              <Eye size={12} />
              Eliminate 2 Wrong
              <span className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(249,115,22,0.2)' }}>
                {CREDITS_HINT_ELIMINATE} 🪙
              </span>
            </button>
            <button
              onClick={handleClue}
              disabled={!!clueText || hintClue.isPending || credits < CREDITS_HINT_CLUE}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                clueText || hintClue.isPending || credits < CREDITS_HINT_CLUE ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
              }`}
              style={{
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#fbbf24',
              }}
            >
              <Lightbulb size={12} />
              Get a Clue
              <span className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(245,158,11,0.2)' }}>
                {CREDITS_HINT_CLUE} 🪙
              </span>
            </button>
            <button
              onClick={handleFirstLetterReveal}
              disabled={!!firstLetter || hintFirstLetter.isPending || credits < CREDITS_HINT_FIRST_LETTER}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                firstLetter || hintFirstLetter.isPending || credits < CREDITS_HINT_FIRST_LETTER ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
              }`}
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: '#60a5fa',
              }}
            >
              <AlignLeft size={12} />
              First Letter
              <span className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(59,130,246,0.2)' }}>
                {CREDITS_HINT_FIRST_LETTER} 🪙
              </span>
            </button>
          </div>
        )}

        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-center max-w-2xl mx-auto w-full"
            >
              <button
                onClick={handleNext}
                disabled={isTransitioning || completeSession.isPending}
                className="flex items-center justify-center gap-2 w-full max-w-sm py-4 rounded-xl font-black text-base text-white transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #ea580c, #f97316)',
                  boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
                }}
              >
                {currentQ + 1 >= session.totalQuestions ? (
                  <>See Results <Home size={18} /></>
                ) : (
                  <>Next Question <ArrowRight size={18} /></>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
