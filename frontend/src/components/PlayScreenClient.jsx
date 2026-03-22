import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Lightbulb, Eye, AlignLeft, ArrowRight, Home } from 'lucide-react';
import CreditBadge from './CreditBadge';
import { Toaster, toast } from 'sonner';

const QUIZ_DATA = {
  category: 'Tech & AI',
  totalQuestions: 10,
  questions: [
    {
      id: 'q-001',
      text: 'Which architecture forms the backbone of most modern large language models, enabling parallel processing of sequential data through self-attention mechanisms?',
      options: [
        { id: 'q-001-a', label: 'A', text: 'Recurrent Neural Network (RNN)' },
        { id: 'q-001-b', label: 'B', text: 'Transformer Architecture' },
        { id: 'q-001-c', label: 'C', text: 'Convolutional Neural Network (CNN)' },
        { id: 'q-001-d', label: 'D', text: 'Long Short-Term Memory (LSTM)' },
      ],
      correctIndex: 1,
      explanation: 'The Transformer architecture, introduced in "Attention Is All You Need" (2017), revolutionized NLP by replacing sequential processing with parallel self-attention mechanisms, enabling models like GPT and BERT.',
      firstLetter: 'T',
      timeLimit: 30,
    },
    {
      id: 'q-002',
      text: 'What does "hallucination" mean in the context of large language models?',
      options: [
        { id: 'q-002-a', label: 'A', text: 'The model generating images from text' },
        { id: 'q-002-b', label: 'B', text: 'Confidently producing false or fabricated information' },
        { id: 'q-002-c', label: 'C', text: 'A visual artifact in image generation' },
        { id: 'q-002-d', label: 'D', text: 'The model entering an infinite loop' },
      ],
      correctIndex: 1,
      explanation: 'LLM hallucination refers to the model generating plausible-sounding but factually incorrect or entirely fabricated information, often with high confidence — a critical challenge in AI safety.',
      firstLetter: 'C',
      timeLimit: 25,
    },
    {
      id: 'q-003',
      text: 'Which company developed the AlphaGo program that defeated world champion Go player Lee Sedol in 2016?',
      options: [
        { id: 'q-003-a', label: 'A', text: 'OpenAI' },
        { id: 'q-003-b', label: 'B', text: 'Meta AI Research' },
        { id: 'q-003-c', label: 'C', text: 'DeepMind' },
        { id: 'q-003-d', label: 'D', text: 'IBM Research' },
      ],
      correctIndex: 2,
      explanation: 'DeepMind, a Google subsidiary, developed AlphaGo. Its victory over Lee Sedol in a best-of-five series (4-1) was a landmark moment in AI history, demonstrating mastery of a game long thought beyond machine capability.',
      firstLetter: 'D',
      timeLimit: 20,
    },
    {
      id: 'q-004',
      text: 'In machine learning, what is "overfitting"?',
      options: [
        { id: 'q-004-a', label: 'A', text: 'Using too many training epochs' },
        { id: 'q-004-b', label: 'B', text: 'When a model performs well on training data but poorly on new data' },
        { id: 'q-004-c', label: 'C', text: 'A model with too few parameters' },
        { id: 'q-004-d', label: 'D', text: 'Training on imbalanced datasets' },
      ],
      correctIndex: 1,
      explanation: 'Overfitting occurs when a model memorizes training data — including its noise — rather than learning generalizable patterns, causing poor performance on unseen data. Regularization, dropout, and cross-validation help prevent it.',
      firstLetter: 'W',
      timeLimit: 22,
    },
    {
      id: 'q-005',
      text: 'What does "RAG" stand for in the context of modern AI systems?',
      options: [
        { id: 'q-005-a', label: 'A', text: 'Rapid Algorithmic Generation' },
        { id: 'q-005-b', label: 'B', text: 'Retrieval-Augmented Generation' },
        { id: 'q-005-c', label: 'C', text: 'Recursive Attention Gradient' },
        { id: 'q-005-d', label: 'D', text: 'Real-time Adaptive Grounding' },
      ],
      correctIndex: 1,
      explanation: 'Retrieval-Augmented Generation (RAG) combines a language model with an external knowledge retrieval system, allowing the model to fetch relevant documents before generating a response — reducing hallucinations and enabling up-to-date answers.',
      firstLetter: 'R',
      timeLimit: 28,
    },
  ],
};

export default function PlayScreenClient() {
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered');
  const [timeLeft, setTimeLeft] = useState(QUIZ_DATA.questions[0].timeLimit);
  const [credits, setCredits] = useState(247);
  const [results, setResults] = useState([]);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [clueShown, setClueShown] = useState(false);
  const [firstLetterShown, setFirstLetterShown] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const question = QUIZ_DATA.questions[Math.min(currentQ, QUIZ_DATA.questions.length - 1)];
  const progress = ((currentQ) / QUIZ_DATA.totalQuestions) * 100;
  const isAnswered = answerState !== 'unanswered';
  const timerPercent = (timeLeft / question.timeLimit) * 100;
  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#f97316';

  const handleTimeUp = useCallback(() => {
    if (answerState === 'unanswered') {
      setAnswerState('wrong');
      setResults((prev) => [
        ...prev,
        { questionId: question.id, selectedIndex: null, correct: false, timeSpent: question.timeLimit },
      ]);
    }
  }, [answerState, question.id, question.timeLimit]);

  useEffect(() => {
    if (isAnswered) return;
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
  }, [currentQ, isAnswered, handleTimeUp]);

  const handleAnswer = (index) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    const timeSpent = question.timeLimit - timeLeft;
    const correct = index === question.correctIndex;
    setSelectedAnswer(index);
    setAnswerState(correct ? 'correct' : 'wrong');
    setResults((prev) => [...prev, { questionId: question.id, selectedIndex: index, correct, timeSpent }]);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const nextQ = currentQ + 1;
    if (nextQ >= QUIZ_DATA.questions.length) {
      const correctCount = results.filter((r) => r.correct).length + (answerState === 'correct' ? 1 : 0);
      const totalTime = results.reduce((acc, r) => acc + r.timeSpent, 0);
      sessionStorage.setItem('triviaResults', JSON.stringify({
        score: correctCount,
        total: QUIZ_DATA.questions.length,
        totalTime,
        category: QUIZ_DATA.category,
        results: [...results, { questionId: question.id, selectedIndex: selectedAnswer, correct: answerState === 'correct', timeSpent: question.timeLimit - timeLeft }],
        questions: QUIZ_DATA.questions,
      }));
      navigate('/results-screen');
      return;
    }

    setTimeout(() => {
      setCurrentQ(nextQ);
      setSelectedAnswer(null);
      setAnswerState('unanswered');
      setTimeLeft(QUIZ_DATA.questions[nextQ].timeLimit);
      setEliminatedOptions([]);
      setClueShown(false);
      setFirstLetterShown(false);
      setIsTransitioning(false);
      startTimeRef.current = Date.now();
    }, 300);
  };

  const handleEliminate = () => {
    if (credits < 3) { toast.error('Not enough credits!'); return; }
    if (eliminatedOptions.length > 0) { toast.info('Already used on this question'); return; }
    const wrongIndices = question.options
      .map((_, i) => i)
      .filter((i) => i !== question.correctIndex && selectedAnswer !== i);
    const toEliminate = wrongIndices.slice(0, 2);
    setEliminatedOptions(toEliminate);
    setCredits((c) => c - 3);
    toast.success('2 wrong answers eliminated!');
  };

  const handleClue = () => {
    if (credits < 3) { toast.error('Not enough credits!'); return; }
    if (clueShown) { toast.info('Clue already revealed'); return; }
    setClueShown(true);
    setCredits((c) => c - 3);
    toast.success('Clue revealed!');
  };

  const handleFirstLetter = () => {
    if (credits < 2) { toast.error('Not enough credits!'); return; }
    if (firstLetterShown) { toast.info('Already revealed'); return; }
    setFirstLetterShown(true);
    setCredits((c) => c - 2);
    toast.success(`First letter: "${question.firstLetter}"`);
  };

  const getOptionClass = (index) => {
    if (eliminatedOptions.includes(index)) return 'answer-btn dimmed';
    if (!isAnswered) return 'answer-btn';
    if (index === question.correctIndex) return 'answer-btn correct';
    if (index === selectedAnswer && index !== question.correctIndex) return 'answer-btn wrong';
    return 'answer-btn dimmed';
  };

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timerPercent / 100) * circumference;

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
          animate={{ width: `${((currentQ) / QUIZ_DATA.totalQuestions) * 100}%` }}
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
            {QUIZ_DATA.category}
          </span>
          <span
            className="text-sm font-black text-white px-3 py-1 rounded-full"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}
          >
            Q {currentQ + 1}/{QUIZ_DATA.totalQuestions}
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

            {clueShown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-4 py-3 rounded-lg text-sm text-yellow-300 font-medium"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                💡 <span className="font-bold">Clue:</span> Focus on the architecture that introduced self-attention mechanisms in the seminal 2017 paper.
              </motion.div>
            )}

            {firstLetterShown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-4 py-3 rounded-lg text-sm text-blue-300 font-medium"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                🔤 <span className="font-bold">First letter of answer:</span>{' '}
                <span className="text-2xl font-black font-mono">{question.firstLetter}</span>
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
                {question.text}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={option.id}
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
                        isAnswered && index === question.correctIndex
                          ? 'rgba(255,255,255,0.2)'
                          : isAnswered && index === selectedAnswer
                          ? 'rgba(255,255,255,0.15)'
                          : 'rgba(249,115,22,0.15)',
                      color:
                        isAnswered && index === question.correctIndex
                          ? '#fff'
                          : isAnswered && index === selectedAnswer
                          ? '#fff' :'#f97316',
                    }}
                  >
                    {option.label}
                  </span>
                  <span className="text-sm md:text-base font-semibold text-white leading-snug">
                    {option.text}
                  </span>
                  {isAnswered && index === question.correctIndex && (
                    <CheckCircle size={18} className="ml-auto text-green-300 shrink-0" />
                  )}
                  {isAnswered && index === selectedAnswer && index !== question.correctIndex && (
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
                        Correct answer: <span className="font-bold text-white">{question.options[question.correctIndex].text}</span>
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
              disabled={eliminatedOptions.length > 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                eliminatedOptions.length > 0
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
                3 🪙
              </span>
            </button>
            <button
              onClick={handleClue}
              disabled={clueShown}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                clueShown ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
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
                3 🪙
              </span>
            </button>
            <button
              onClick={handleFirstLetter}
              disabled={firstLetterShown}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                firstLetterShown ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
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
                2 🪙
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
                disabled={isTransitioning}
                className="flex items-center justify-center gap-2 w-full max-w-sm py-4 rounded-xl font-black text-base text-white transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #ea580c, #f97316)',
                  boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
                }}
              >
                {currentQ + 1 >= QUIZ_DATA.questions.length ? (
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
