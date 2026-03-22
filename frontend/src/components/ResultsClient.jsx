import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Share2, Trophy, RotateCcw, Users, Star, Zap, Clock, Target } from 'lucide-react';
import CreditBadge from './ui/CreditBadge';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useUnlockExplanation, useCreditBalance } from '../hooks/useApi';

const CREDITS_EXPLANATION_PACK = 15;


// Mock fallback data if sessionStorage is empty
const FALLBACK_RESULTS = {
  score: 7,
  total: 10,
  totalTime: 142,
  category: 'Tech & AI',
  results: [
    { questionId: 'q-001', selectedIndex: 1, correct: true, timeSpent: 12 },
    { questionId: 'q-002', selectedIndex: 1, correct: true, timeSpent: 9 },
    { questionId: 'q-003', selectedIndex: 2, correct: true, timeSpent: 15 },
    { questionId: 'q-004', selectedIndex: 0, correct: false, timeSpent: 22 },
    { questionId: 'q-005', selectedIndex: 1, correct: true, timeSpent: 18 },
    { questionId: 'q-006', selectedIndex: null, correct: false, timeSpent: 28 },
    { questionId: 'q-007', selectedIndex: 2, correct: true, timeSpent: 11 },
    { questionId: 'q-008', selectedIndex: 3, correct: true, timeSpent: 8 },
    { questionId: 'q-009', selectedIndex: 1, correct: false, timeSpent: 20 },
    { questionId: 'q-010', selectedIndex: 0, correct: true, timeSpent: 14 },
  ],
  questions: [
    { id: 'q-001', text: 'Which architecture forms the backbone of most modern large language models?', options: [{ text: 'RNN' }, { text: 'Transformer Architecture' }, { text: 'CNN' }, { text: 'LSTM' }], correctIndex: 1, explanation: 'The Transformer architecture, introduced in "Attention Is All You Need" (2017), enabled parallel self-attention mechanisms used in GPT and BERT.', timeLimit: 30 },
    { id: 'q-002', text: 'What does "hallucination" mean in the context of large language models?', options: [{ text: 'Generating images from text' }, { text: 'Confidently producing false information' }, { text: 'A visual artifact in image generation' }, { text: 'The model entering an infinite loop' }], correctIndex: 1, explanation: 'LLM hallucination is generating plausible but factually incorrect information with high confidence.', timeLimit: 25 },
    { id: 'q-003', text: 'Which company developed AlphaGo that defeated Lee Sedol in 2016?', options: [{ text: 'OpenAI' }, { text: 'Meta AI' }, { text: 'DeepMind' }, { text: 'IBM Research' }], correctIndex: 2, explanation: 'DeepMind, a Google subsidiary, developed AlphaGo. It defeated Lee Sedol 4-1 in 2016.', timeLimit: 20 },
    { id: 'q-004', text: 'In machine learning, what is "overfitting"?', options: [{ text: 'Using too many training epochs' }, { text: 'Model performs well on training but poorly on new data' }, { text: 'A model with too few parameters' }, { text: 'Training on imbalanced datasets' }], correctIndex: 1, explanation: 'Overfitting occurs when a model memorizes training data rather than learning generalizable patterns.', timeLimit: 22 },
    { id: 'q-005', text: 'What does "RAG" stand for in modern AI systems?', options: [{ text: 'Rapid Algorithmic Generation' }, { text: 'Retrieval-Augmented Generation' }, { text: 'Recursive Attention Gradient' }, { text: 'Real-time Adaptive Grounding' }], correctIndex: 1, explanation: 'Retrieval-Augmented Generation combines an LLM with external knowledge retrieval to reduce hallucinations.', timeLimit: 28 },
    { id: 'q-006', text: 'Which activation function is most commonly used in modern deep neural network hidden layers?', options: [{ text: 'Sigmoid' }, { text: 'Tanh' }, { text: 'ReLU' }, { text: 'Softmax' }], correctIndex: 2, explanation: 'ReLU (Rectified Linear Unit) is preferred for hidden layers due to its computational efficiency and ability to mitigate the vanishing gradient problem.', timeLimit: 18 },
    { id: 'q-007', text: 'What is the primary purpose of dropout in neural network training?', options: [{ text: 'Speed up training' }, { text: 'Reduce memory usage' }, { text: 'Prevent overfitting via random neuron deactivation' }, { text: 'Normalize input data' }], correctIndex: 2, explanation: 'Dropout randomly deactivates neurons during training, forcing the network to learn redundant representations and reducing overfitting.', timeLimit: 24 },
    { id: 'q-008', text: 'In the context of NLP, what does "tokenization" refer to?', options: [{ text: 'Converting text to audio' }, { text: 'Compressing text files' }, { text: 'Splitting text into semantic units for processing' }, { text: 'Encrypting text data' }], correctIndex: 2, explanation: 'Tokenization splits text into individual units (tokens) — words, subwords, or characters — that the model processes. Modern LLMs use subword tokenization like BPE.', timeLimit: 20 },
    { id: 'q-009', text: 'What does "temperature" control in language model text generation?', options: [{ text: 'Processing speed' }, { text: 'Randomness and creativity of output' }, { text: 'Memory usage' }, { text: 'Training learning rate' }], correctIndex: 1, explanation: 'Temperature controls the probability distribution of token selection. Higher temperature = more random/creative output; lower = more deterministic/focused.', timeLimit: 22 },
    { id: 'q-010', text: 'Which technique allows language models to follow instructions more reliably?', options: [{ text: 'RLHF (Reinforcement Learning from Human Feedback)' }, { text: 'Data augmentation' }, { text: 'Weight pruning' }, { text: 'Batch normalization' }], correctIndex: 0, explanation: 'RLHF fine-tunes models using human preference ratings, making them more helpful, harmless, and honest — used in ChatGPT and Claude.', timeLimit: 26 },
  ],
};

function getPerformanceTier(pct) {
  if (pct >= 90) return 'legend';
  if (pct >= 70) return 'expert';
  if (pct >= 50) return 'solid';
  if (pct >= 30) return 'learning';
  return 'struggling';
}

const TIER_CONFIG = {
  legend: { label: 'LEGEND', emoji: '👑', color: '#ffd700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.35)', description: 'Flawless performance. You dominate this category.' },
  expert: { label: 'EXPERT', emoji: '🔥', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', description: 'Outstanding! You clearly know your stuff.' },
  solid: { label: 'SOLID', emoji: '⭐', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', description: 'Good performance. Keep practicing to reach Expert.' },
  learning: { label: 'LEARNING', emoji: '📚', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', description: 'You\'re building knowledge. Try again for a better score.' },
  struggling: { label: 'KEEP TRYING', emoji: '💪', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.35)', description: 'Every attempt teaches you something new. Don\'t give up!' },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ResultsClient() {
  const navigate = useNavigate();
  const [displayScore, setDisplayScore] = useState(0);
  const [expandedExplanations, setExpandedExplanations] = useState(new Set());
  const [unlockedExplanations, setUnlockedExplanations] = useState(new Set());
  const hasLaunched = useRef(false);

  const { data: creditData } = useCreditBalance();
  const unlockExplanation = useUnlockExplanation();

  const credits = creditData?.balance || 0;

  // Try to get results from sessionStorage, fallback to mock data
  const storedResults = sessionStorage.getItem('triviaResults');
  const data = storedResults ? JSON.parse(storedResults) : FALLBACK_RESULTS;
  const pct = Math.round((data.score / data.total) * 100);
  const accuracy = pct;
  const tier = getPerformanceTier(pct);
  const tierConfig = TIER_CONFIG[tier];
  const avgTime = Math.round(data.totalTime / data.total);

  // Score count-up
  useEffect(() => {
    let frame;
    const duration = 1200;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * data.score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [data.score]);

  // Confetti
  useEffect(() => {
    if (pct > 60 && !hasLaunched.current) {
      hasLaunched.current = true;
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.4 },
          colors: ['#f97316', '#fb923c', '#ffd700', '#ffffff', '#22c55e'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 60,
            spread: 100,
            origin: { y: 0.5, x: 0.2 },
            colors: ['#f97316', '#ffd700'],
          });
          confetti({
            particleCount: 60,
            spread: 100,
            origin: { y: 0.5, x: 0.8 },
            colors: ['#fb923c', '#ffffff'],
          });
        }, 400);
      }, 600);
    }
  }, [pct]);

  const toggleExplanation = (questionId, isWrong) => {
    if (isWrong && !unlockedExplanations.has(questionId)) {
      // Needs purchase
      return;
    }
    setExpandedExplanations((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const purchaseExplanation = async (questionId) => {
    if (credits < CREDITS_EXPLANATION_PACK) {
      toast.error(`Insufficient credits. Need ${CREDITS_EXPLANATION_PACK} credits.`);
      return;
    }

    try {
      await unlockExplanation.mutateAsync({
        sessionId: data.sessionId,
        questionId,
      });
      setUnlockedExplanations((prev) => new Set([...prev, questionId]));
      setExpandedExplanations((prev) => new Set([...prev, questionId]));
      toast.success('Explanation unlocked!');
    } catch (error) {
      toast.error(error.message || 'Failed to unlock explanation');
    }
  };

  const leaguePointsEarned = Math.round((data.score / data.total) * 50 * (tier === 'legend' ? 1.5 : 1));

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: 'linear-gradient(180deg, #0F0F0F 0%, #141414 100%)' }}
    >
      <Toaster position="top-center" theme="dark" />

      {/* Header */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 py-4"
        style={{
          background: 'rgba(15,15,15,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Results</span>
        <CreditBadge amount={credits} size="sm" />
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 space-y-6 mt-6">

        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative overflow-hidden rounded-2xl p-8 text-center noise-texture"
          style={{
            background: `linear-gradient(135deg, ${tierConfig.bg.replace('0.12', '0.2')}, rgba(15,15,15,0.9))`,
            border: `1px solid ${tierConfig.border}`,
            boxShadow: `0 8px 40px ${tierConfig.color}22`,
          }}
        >
          {/* Background decoration */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 space-y-4">
            {/* Performance badge */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest"
              style={{
                background: tierConfig.bg,
                border: `1px solid ${tierConfig.border}`,
                color: tierConfig.color,
              }}
            >
              <span className="text-lg">{tierConfig.emoji}</span>
              {tierConfig.label}
            </motion.div>

            {/* Score display */}
            <div className="score-entrance">
              <div className="flex items-baseline justify-center gap-2">
                <span
                  className="text-7xl md:text-8xl font-black font-mono tabular-nums"
                  style={{ color: tierConfig.color }}
                >
                  {displayScore}
                </span>
                <span className="text-3xl font-bold text-gray-500">/{data.total}</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">{tierConfig.description}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { icon: Target, label: 'Accuracy', value: `${accuracy}%`, color: '#22c55e' },
                { icon: Clock, label: 'Avg Time', value: `${avgTime}s/Q`, color: '#3b82f6' },
                { icon: Zap, label: 'League Pts', value: `+${leaguePointsEarned}`, color: '#f97316' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div
                  key={`stat-${label}`}
                  className="p-3 rounded-xl text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Icon size={16} className="mx-auto mb-1" style={{ color }} />
                  <p className="text-lg font-black font-mono tabular-nums" style={{ color }}>{value}</p>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* Category + time */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Star size={12} className="text-primary-400" />
                {data.category}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatTime(data.totalTime)} total
              </span>
            </div>
          </div>
        </motion.div>

        {/* Question breakdown */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>Question Breakdown</span>
            <span className="text-sm font-normal text-gray-500">
              {data.results.filter((r) => r.correct).length} correct · {data.results.filter((r) => !r.correct).length} wrong
            </span>
          </h2>

          <div className="space-y-2">
            {data.questions.map((q, i) => {
              const result = data.results[i];
              const isCorrect = result?.correct ?? false;
              const isExpanded = expandedExplanations.has(q.id);
              const isUnlocked = isCorrect || unlockedExplanations.has(q.id);
              const isPurchasing = unlockExplanation.isPending;
              const userAnswer = result?.selectedIndex !== null && result?.selectedIndex !== undefined
                ? q.options[result.selectedIndex]?.text
                : 'No answer (timed out)';

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: isCorrect
                      ? 'rgba(22,163,74,0.06)'
                      : 'rgba(220,38,38,0.06)',
                    border: isCorrect
                      ? '1px solid rgba(34,197,94,0.15)'
                      : '1px solid rgba(239,68,68,0.15)',
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div className="shrink-0 mt-0.5">
                        {isCorrect ? (
                          <CheckCircle size={18} className="text-green-400" />
                        ) : (
                          <XCircle size={18} className="text-red-400" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white leading-snug line-clamp-2 flex-1">
                            <span className="text-gray-500 font-mono text-xs mr-1">Q{i + 1}.</span>
                            {q.text}
                          </p>
                          <span
                            className="text-xs font-mono tabular-nums shrink-0 px-2 py-0.5 rounded"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              color: '#6b7280',
                            }}
                          >
                            {result?.timeSpent ?? 0}s
                          </span>
                        </div>

                        {!isCorrect && (
                          <div className="space-y-0.5">
                            <p className="text-xs text-red-400">
                              Your answer: <span className="font-semibold text-red-300">{userAnswer}</span>
                            </p>
                            <p className="text-xs text-green-400">
                              Correct: <span className="font-semibold text-green-300">{q.options[q.correctIndex].text}</span>
                            </p>
                          </div>
                        )}

                        {isCorrect && (
                          <p className="text-xs text-green-400/80">
                            ✓ {q.options[q.correctIndex].text}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* View explanation */}
                    <div className="mt-3 pl-7">
                      {isUnlocked ? (
                        <button
                          onClick={() => toggleExplanation(q.id, !isCorrect)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors duration-150"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Hide' : 'View'} Explanation
                        </button>
                      ) : (
                        <button
                          onClick={() => purchaseExplanation(q.id)}
                          disabled={isPurchasing || credits < CREDITS_EXPLANATION_PACK}
                          className="flex items-center gap-1.5 text-xs font-semibold transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ color: '#fb923c' }}
                        >
                          {isPurchasing ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <ChevronDown size={14} />
                          )}
                          Unlock Explanation
                          <span
                            className="px-1.5 py-0.5 rounded text-xs font-mono"
                            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.25)' }}
                          >
                            {CREDITS_EXPLANATION_PACK} 🪙
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Explanation panel */}
                  <AnimatePresence>
                    {isExpanded && isUnlocked && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4 pl-11"
                      >
                        <div
                          className="p-3 rounded-lg text-sm text-gray-300 leading-relaxed"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                          }}
                        >
                          <span className="text-yellow-400 font-bold mr-1">💡</span>
                          {q.explanation}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <button
            onClick={() => navigate('/play-screen')}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all duration-150 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #ea580c, #f97316)',
              boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
            }}
          >
            <RotateCcw size={16} />
            Play Again
          </button>

          <button
            onClick={() => {
              toast.success('Challenge link copied!');
            }}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all duration-150 hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Users size={16} />
            Challenge a Friend
          </button>

          <button
            onClick={() => navigate('/home-dashboard')}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all duration-150 hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Trophy size={16} />
            View Leaderboard
          </button>
        </motion.div>

        {/* Share score */}
        <div className="flex justify-center">
          <button
            onClick={() => toast.success('Score card copied to clipboard!')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-400 transition-colors duration-150 font-semibold"
          >
            <Share2 size={14} />
            Share my score
          </button>
        </div>
      </div>

      {/* Sticky bonus round banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(15,15,15,0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(249,115,22,0.2)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-white flex items-center gap-1.5">
              <Zap size={14} className="text-primary-400" />
              Bonus Round Available!
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Double your league points — 5 rapid-fire questions
            </p>
          </div>
          <button
            onClick={() => navigate('/play-screen')}
            className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-sm text-white transition-all duration-150 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #ea580c, #f97316)',
              boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
            }}
          >
            Play Bonus Round
            <Star size={14} className="fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
}