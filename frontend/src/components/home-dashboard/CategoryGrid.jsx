import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const CATEGORIES = [
  { id: 'cat-geography', name: 'Geography', emoji: '🌍', mastery: 72, masteryLevel: 'Expert', color: '#3b82f6', questions: 240, premium: false },
  { id: 'cat-movies', name: 'Movies & TV', emoji: '🎬', mastery: 58, masteryLevel: 'Advanced', color: '#8b5cf6', questions: 312, premium: false },
  { id: 'cat-sports', name: 'Sports', emoji: '⚽', mastery: 45, masteryLevel: 'Intermediate', color: '#22c55e', questions: 280, premium: false },
  { id: 'cat-science', name: 'Science', emoji: '🔬', mastery: 83, masteryLevel: 'Master', color: '#06b6d4', questions: 195, premium: false },
  { id: 'cat-music', name: 'Music', emoji: '🎵', mastery: 34, masteryLevel: 'Beginner', color: '#ec4899', questions: 220, premium: false },
  { id: 'cat-history', name: 'History', emoji: '📜', mastery: 61, masteryLevel: 'Advanced', color: '#f59e0b', questions: 265, premium: false },
  { id: 'cat-tech', name: 'Tech & AI', emoji: '🤖', mastery: 91, masteryLevel: 'Legend', color: '#f97316', questions: 178, premium: false },
  { id: 'cat-food', name: 'Food & Culture', emoji: '🍜', mastery: 27, masteryLevel: 'Novice', color: '#ef4444', questions: 198, premium: false },
  { id: 'cat-custom', name: 'Custom Quiz', emoji: '✨', mastery: 0, masteryLevel: '', color: '#14b8a6', questions: 0, premium: false, isCustom: true },
];

const MASTERY_COLORS = {
  Legend: '#f97316',
  Master: '#8b5cf6',
  Expert: '#3b82f6',
  Advanced: '#22c55e',
  Intermediate: '#f59e0b',
  Beginner: '#ec4899',
  Novice: '#6b7280',
};

export default function CategoryGrid() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Categories</h2>
        <span className="text-sm text-gray-500 font-medium">9 available</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Link
              to="/play-screen"
              className={`block p-4 rounded-card card-hover cursor-pointer relative overflow-hidden ${
                cat.isCustom ? '' : ''
              }`}
              style={{
                background: cat.isCustom
                  ? 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(15,15,15,0.8))'
                  : 'linear-gradient(135deg, rgba(30,30,30,0.9), rgba(20,20,20,0.95))',
                border: cat.isCustom
                  ? '1px solid rgba(20,184,166,0.35)'
                  : '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            >
              <div
                className="absolute inset-0 opacity-0 hover:opacity-5 transition-opacity duration-150 rounded-card"
                style={{ background: cat.color }}
              />

              <div className="relative z-10 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-2xl leading-none">{cat.emoji}</span>
                    <p className="text-sm font-bold text-white leading-tight">{cat.name}</p>
                  </div>
                  {cat.masteryLevel && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-bold"
                      style={{
                        background: `${MASTERY_COLORS[cat.masteryLevel] || '#6b7280'}22`,
                        color: MASTERY_COLORS[cat.masteryLevel] || '#6b7280',
                        border: `1px solid ${MASTERY_COLORS[cat.masteryLevel] || '#6b7280'}33`,
                      }}
                    >
                      {cat.masteryLevel}
                    </span>
                  )}
                  {cat.isCustom && (
                    <Star size={14} className="text-teal-400" />
                  )}
                </div>

                {!cat.isCustom && (
                  <div className="space-y-1">
                    <div className="mastery-bar">
                      <div
                        className="mastery-bar-fill"
                        style={{
                          width: `${cat.mastery}%`,
                          background: `linear-gradient(90deg, ${cat.color}, ${cat.color}cc)`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-mono tabular-nums">{cat.mastery}%</span>
                      <span className="text-xs text-gray-600">{cat.questions} Qs</span>
                    </div>
                  </div>
                )}

                {cat.isCustom && (
                  <p className="text-xs text-teal-400/80 font-medium">Build your own quiz</p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
