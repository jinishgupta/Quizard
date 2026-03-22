import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Zap, Star, Brain, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import BadgeCard from '../components/ui/BadgeCard';
import StatChip from '../components/ui/StatChip';
import Card from '../components/ui/Card';

const PLAYER = {
  name: 'Alex Mercer',
  playerId: 'TL-7842',
  avatar: '🧠',
  streak: 14,
  totalRounds: 312,
  accuracy: 74,
  bestStreak: 22,
  creditsSpent: 1840,
  leagueTier: 'Gold',
  weeklyRank: 8,
  weeklyScore: 2340,
};

const WEEKLY_DIGEST = {
  summary: 'Strong week overall — you dominated Science & Tech but struggled with History. Your speed improved by 18% compared to last week.',
  strengths: ['Science & Tech', 'Space & Cosmos', 'Code & Dev'],
  suggestions: ['Review World History timelines', 'Practice Geography capitals'],
  funFact: 'You answered 47 questions correctly in under 8 seconds each — faster than 91% of players this week.',
};

const CATEGORY_MASTERY = [
  { name: 'Science & Tech', emoji: '🔬', level: 'Expert', progress: 82, color: '#1D4ED8' },
  { name: 'Space & Cosmos', emoji: '🚀', level: 'Expert', progress: 78, color: '#7C3AED' },
  { name: 'Code & Dev', emoji: '💻', level: 'Adept', progress: 65, color: '#0891B2' },
  { name: 'World History', emoji: '🏛️', level: 'Adept', progress: 58, color: '#D97706' },
  { name: 'Pop Culture', emoji: '🎬', level: 'Novice', progress: 42, color: '#DC2626' },
  { name: 'Geography', emoji: '🌍', level: 'Novice', progress: 35, color: '#16A34A' },
  { name: 'Music & Arts', emoji: '🎵', level: 'Beginner', progress: 22, color: '#9333EA' },
  { name: 'Sports', emoji: '⚽', level: 'Beginner', progress: 18, color: '#EA580C' },
];

const BADGES = [
  { emoji: '🔥', name: 'On Fire', description: '10-day streak', earned: true, earnedDate: 'Mar 12', rarity: 'rare' },
  { emoji: '🧠', name: 'Big Brain', description: '100% in any round', earned: true, earnedDate: 'Mar 8', rarity: 'epic' },
  { emoji: '⚡', name: 'Speed Demon', description: 'Avg under 6s/Q', earned: true, earnedDate: 'Feb 28', rarity: 'rare' },
  { emoji: '👑', name: 'League King', description: 'Reach Gold tier', earned: true, earnedDate: 'Mar 1', rarity: 'legendary' },
  { emoji: '🎯', name: 'Sharpshooter', description: '90%+ accuracy x5', earned: true, earnedDate: 'Mar 15', rarity: 'epic' },
  { emoji: '🌟', name: 'All-Rounder', description: 'Play all categories', earned: false, rarity: 'rare' },
  { emoji: '💎', name: 'Diamond Mind', description: 'Reach Diamond tier', earned: false, rarity: 'legendary' },
  { emoji: '🏆', name: 'Champion', description: 'Rank #1 in a week', earned: false, rarity: 'legendary' },
  { emoji: '📚', name: 'Scholar', description: 'Unlock 50 explanations', earned: false, rarity: 'common' },
];

const TIER_COLORS = {
  Bronze: { bg: '#92400E', text: '#FDE68A', border: '#B45309' },
  Silver: { bg: '#374151', text: '#E5E7EB', border: '#6B7280' },
  Gold: { bg: '#78350F', text: '#FDE68A', border: '#D97706' },
  Platinum: { bg: '#1E3A5F', text: '#BAE6FD', border: '#0284C7' },
  Diamond: { bg: '#1E1B4B', text: '#C7D2FE', border: '#6366F1' },
};

export default function Profile() {
  const navigate = useNavigate();
  const tierColors = TIER_COLORS[PLAYER.leagueTier];

  return (
    <div className="min-h-screen bg-[#0A0F1A] dot-pattern">
      <Navbar credits={247} notificationCount={3} />

      <main className="max-w-3xl mx-auto px-4 md:px-6 pb-28 md:pb-10 pt-6 space-y-6">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card variant="brutal" padding="lg">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative shrink-0">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-[#1F2937] border-2 border-[#374151]"
                  style={{
                    boxShadow: PLAYER.streak > 7 ? '0 0 0 3px #1D4ED8, 0 0 20px rgba(29,78,216,0.4)' : 'none',
                  }}
                >
                  {PLAYER.avatar}
                </div>
                {PLAYER.streak > 7 && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1D4ED8] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    🔥 {PLAYER.streak} streak
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-black text-white">{PLAYER.name}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="text-xs font-mono text-[#6B7280] bg-[#1F2937] border border-[#374151] px-2 py-0.5 rounded-md">
                    #{PLAYER.playerId}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md border"
                    style={{ background: tierColors.bg, color: tierColors.text, borderColor: tierColors.border }}
                  >
                    {PLAYER.leagueTier} League
                  </span>
                </div>
                <p className="text-sm text-[#9CA3AF] mt-2">
                  Rank <span className="text-white font-bold">#{PLAYER.weeklyRank}</span> this week ·{' '}
                  <span className="text-[#60A5FA] font-bold">{PLAYER.weeklyScore.toLocaleString()} pts</span>
                </p>
              </div>

              <button
                onClick={() => {}}
                className="shrink-0 px-4 py-2 rounded-lg border border-[#374151] text-sm font-semibold text-[#9CA3AF] hover:border-[#1D4ED8] hover:text-white transition-all duration-150 bg-[#1F2937]"
              >
                Edit Profile
              </button>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Total Rounds', value: PLAYER.totalRounds, color: 'blue', icon: <Trophy size={16} /> },
            { label: 'Accuracy', value: `${PLAYER.accuracy}%`, color: 'green', icon: <Target size={16} /> },
            { label: 'Best Streak', value: PLAYER.bestStreak, color: 'yellow', icon: <Zap size={16} /> },
            { label: 'Credits Spent', value: PLAYER.creditsSpent.toLocaleString(), color: 'purple', icon: <Star size={16} /> },
          ].map((stat) => (
            <StatChip
              key={`stat-${stat.label}`}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              className="w-full"
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card variant="default" padding="md">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
                <Brain size={14} className="text-[#60A5FA]" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Weekly AI Digest</h2>
              <span className="ml-auto text-[10px] font-mono text-[#6B7280] bg-[#1F2937] px-2 py-0.5 rounded-full border border-[#374151]">
                Week 12
              </span>
            </div>

            <p className="text-sm text-[#9CA3AF] leading-relaxed mb-4">{WEEKLY_DIGEST.summary}</p>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-[#14532D] border border-[#16A34A] rounded-lg p-3">
                <p className="text-xs font-bold text-[#4ADE80] mb-2 uppercase tracking-wider">💪 Strengths</p>
                <ul className="space-y-1">
                  {WEEKLY_DIGEST.strengths.map((s) => (
                    <li key={`strength-${s}`} className="text-xs text-[#86EFAC] flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#4ADE80] shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#1E3A5F] border border-[#1D4ED8] rounded-lg p-3">
                <p className="text-xs font-bold text-[#60A5FA] mb-2 uppercase tracking-wider">📌 Suggestions</p>
                <ul className="space-y-1">
                  {WEEKLY_DIGEST.suggestions.map((s) => (
                    <li key={`suggestion-${s}`} className="text-xs text-[#93C5FD] flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#60A5FA] shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-3 bg-[#1F2937] border border-[#374151] rounded-lg p-3">
              <p className="text-xs font-bold text-[#FCD34D] mb-1">⚡ Fun Fact</p>
              <p className="text-xs text-[#9CA3AF]">{WEEKLY_DIGEST.funFact}</p>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Category Mastery</h2>
            <button
              onClick={() => navigate('/categories')}
              className="text-xs text-[#60A5FA] font-semibold flex items-center gap-1 hover:text-white transition-colors"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {CATEGORY_MASTERY.map((cat, i) => (
              <motion.div
                key={`mastery-${cat.name}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className="bg-[#111827] border border-[#1F2937] rounded-lg p-3 hover:border-[#374151] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-sm font-semibold text-[#E5E7EB]">{cat.name}</span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${cat.color}22`,
                      color: cat.color,
                      border: `1px solid ${cat.color}44`,
                    }}
                  >
                    {cat.level}
                  </span>
                </div>
                <div className="mastery-bar">
                  <div
                    className="mastery-bar-fill"
                    style={{ width: `${cat.progress}%`, background: cat.color }}
                  />
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1 font-mono">{cat.progress}%</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Badges
              <span className="ml-2 text-[#6B7280] font-mono text-xs">
                {BADGES.filter((b) => b.earned).length}/{BADGES.length}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {BADGES.map((badge, i) => (
              <motion.div
                key={`badge-${badge.name}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.04 }}
              >
                <BadgeCard
                  emoji={badge.emoji}
                  name={badge.name}
                  description={badge.description}
                  earned={badge.earned}
                  earnedDate={badge.earnedDate}
                  rarity={badge.rarity}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

      </main>

      <MobileBottomNav active="nav-profile" />
    </div>
  );
}
