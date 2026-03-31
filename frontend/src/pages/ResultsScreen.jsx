import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Share2, Trophy, RotateCcw, Users, Star, Zap, Clock, Target } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useGamePass } from '../contexts/GamePassContext';

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
  learning: { label: 'LEARNING', emoji: '📚', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', description: "You're building knowledge. Try again for a better score." },
  struggling: { label: 'KEEP TRYING', emoji: '💪', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.35)', description: "Every attempt teaches you something new. Don't give up!" },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ResultsScreen() {
  const navigate = useNavigate();
  const [displayScore, setDisplayScore] = useState(0);
  const [expandedExplanations, setExpandedExplanations] = useState(new Set());
  const hasLaunched = useRef(false);
  const { isActive: gamePassActive } = useGamePass();

  // Get results from sessionStorage
  const storedResults = sessionStorage.getItem('triviaResults');
  const data = storedResults ? JSON.parse(storedResults) : null;

  useEffect(() => {
    if (!data) {
      navigate('/home-dashboard');
    }
  }, [data, navigate]);

  if (!data) return null;

  const score = data.correctAnswers || data.score || 0;
  const total = data.totalQuestions || data.total || 10;
  const totalTime = data.avgTimePerQuestion ? Math.round(data.avgTimePerQuestion * total) : (data.totalTime || 0);
  const pct = Math.round((score / total) * 100);
  const tier = getPerformanceTier(pct);
  const tierConfig = TIER_CONFIG[tier];
  const avgTime = total > 0 ? Math.round(totalTime / total) : 0;
  const answers = data.answers || [];

  // Score count-up
  useEffect(() => {
    let frame;
    const duration = 1200;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

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
          confetti({ particleCount: 60, spread: 100, origin: { y: 0.5, x: 0.2 }, colors: ['#f97316', '#ffd700'] });
          confetti({ particleCount: 60, spread: 100, origin: { y: 0.5, x: 0.8 }, colors: ['#fb923c', '#ffffff'] });
        }, 400);
      }, 600);
    }
  }, [pct]);

  const toggleExplanation = (index) => {
    setExpandedExplanations(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const leaguePointsEarned = Math.round((score / total) * 50 * (tier === 'legend' ? 1.5 : 1));

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
        {gamePassActive && (
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            ✓ Pass Active
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 space-y-6 mt-6">

        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative overflow-hidden rounded-2xl p-8 text-center"
          style={{
            background: `linear-gradient(135deg, ${tierConfig.bg.replace('0.12', '0.2')}, rgba(15,15,15,0.9))`,
            border: `1px solid ${tierConfig.border}`,
            boxShadow: `0 8px 40px ${tierConfig.color}22`,
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative z-10 space-y-4">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest"
              style={{ background: tierConfig.bg, border: `1px solid ${tierConfig.border}`, color: tierConfig.color }}
            >
              <span className="text-lg">{tierConfig.emoji}</span>
              {tierConfig.label}
            </motion.div>

            <div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-7xl md:text-8xl font-black font-mono tabular-nums" style={{ color: tierConfig.color }}>
                  {displayScore}
                </span>
                <span className="text-3xl font-bold text-gray-500">/{total}</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">{tierConfig.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { icon: Target, label: 'Accuracy', value: `${pct}%`, color: '#22c55e' },
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

            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Star size={12} className="text-orange-400" />
                {data.category || 'Quiz'}
              </span>
              {totalTime > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatTime(totalTime)} total
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Question breakdown */}
        {answers.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span>Question Breakdown</span>
              <span className="text-sm font-normal text-gray-500">
                {answers.filter(r => r.isCorrect).length} correct · {answers.filter(r => !r.isCorrect).length} wrong
              </span>
            </h2>

            <div className="space-y-2">
              {answers.map((a, i) => {
                const isCorrect = a.isCorrect;
                const isExpanded = expandedExplanations.has(i);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: isCorrect ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)',
                      border: isCorrect ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(239,68,68,0.15)',
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {isCorrect ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-white leading-snug line-clamp-2 flex-1">
                              <span className="text-gray-500 font-mono text-xs mr-1">Q{i + 1}.</span>
                              {a.question}
                            </p>
                            <span className="text-xs font-mono tabular-nums shrink-0 px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
                              {a.timeSpent ?? 0}s
                            </span>
                          </div>

                          {!isCorrect && (
                            <div className="space-y-0.5">
                              <p className="text-xs text-red-400">
                                Your answer: <span className="font-semibold text-red-300">{a.userAnswer || 'No answer'}</span>
                              </p>
                              <p className="text-xs text-green-400">
                                Correct: <span className="font-semibold text-green-300">{a.correctAnswer}</span>
                              </p>
                            </div>
                          )}

                          {isCorrect && (
                            <p className="text-xs text-green-400/80">✓ {a.correctAnswer}</p>
                          )}
                        </div>
                      </div>

                      {/* Explanation toggle — FREE with active game pass */}
                      <div className="mt-3 pl-7">
                        <button
                          onClick={() => toggleExplanation(i)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors duration-150"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Hide' : 'View'} Explanation
                          {gamePassActive && (
                            <span className="text-green-400 text-xs ml-1">✓ Free</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Explanation panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 pl-11"
                        >
                          <div
                            className="p-3 rounded-lg text-sm text-gray-300 leading-relaxed"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            <span className="text-yellow-400 font-bold mr-1">💡</span>
                            {a.explanation || `The correct answer is "${a.correctAnswer}".`}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <button
            onClick={() => navigate('/categories')}
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
            onClick={() => toast.success('Challenge link copied!')}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all duration-150 hover:scale-105 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Users size={16} />
            Challenge a Friend
          </button>

          <button
            onClick={() => navigate('/home-dashboard')}
            className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all duration-150 hover:scale-105 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Trophy size={16} />
            Dashboard
          </button>
        </motion.div>

        {/* Share score */}
        <div className="flex justify-center">
          <button
            onClick={() => toast.success('Score card copied to clipboard!')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-400 transition-colors duration-150 font-semibold"
          >
            <Share2 size={14} />
            Share my score
          </button>
        </div>
      </div>

      {/* Sticky bonus round banner */}
      {gamePassActive && (
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
                <Zap size={14} className="text-orange-400" />
                Bonus Round Available!
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Double your league points — 5 rapid-fire questions (free with pass)
              </p>
            </div>
            <button
              onClick={() => navigate('/categories')}
              className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-sm text-white transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ea580c, #f97316)',
                boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
              }}
            >
              Play Bonus
              <Star size={14} className="fill-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
