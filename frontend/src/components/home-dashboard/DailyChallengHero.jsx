import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const DAILY_CHALLENGE = {
  topic: 'The Frontier of Machine Intelligence',
  category: 'Tech & AI',
  difficulty: 'Hard',
  questionsCount: 10,
  estimatedTime: '4–6 min',
  bonusMultiplier: '2×',
  expiresIn: '6h 43m',
  playersToday: 1847,
};

export default function DailyChallengHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative rounded-3xl overflow-hidden noise-texture scanlines"
      style={{
        background: 'linear-gradient(135deg, #C2410C 0%, #EA580C 30%, #F97316 65%, #FB923C 100%)',
        boxShadow: '0 8px 40px rgba(249,115,22,0.35)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-black/20 text-white/90 uppercase tracking-wider">
                <Zap size={10} className="text-yellow-300" />
                Daily Challenge
              </span>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{
                  background: DAILY_CHALLENGE.difficulty === 'Hard' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)',
                  color: DAILY_CHALLENGE.difficulty === 'Hard' ? '#fde68a' : '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {DAILY_CHALLENGE.difficulty}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-black/20 text-white/80">
                <Clock size={10} />
                Expires in {DAILY_CHALLENGE.expiresIn}
              </span>
            </div>

            <div>
              <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">
                {DAILY_CHALLENGE.category}
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {DAILY_CHALLENGE.topic}
              </h1>
            </div>

            <div className="flex items-center gap-4 text-white/70 text-sm">
              <span className="flex items-center gap-1">
                <Star size={13} className="text-yellow-300" />
                {DAILY_CHALLENGE.questionsCount} questions
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {DAILY_CHALLENGE.estimatedTime}
              </span>
              <span className="flex items-center gap-1">
                <Zap size={13} className="text-yellow-300" />
                {DAILY_CHALLENGE.bonusMultiplier} league points
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'].map((color, i) => (
                  <div
                    key={`avatar-${i}`}
                    className={`w-6 h-6 rounded-full ${color} border-2 border-orange-500 flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span className="text-white/70 text-sm">
                <span className="font-bold text-white">{DAILY_CHALLENGE.playersToday.toLocaleString()}</span> players today
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 live-dot" />
                <span className="text-green-300 text-xs font-semibold">LIVE</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <Link
              to="/play-screen"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-lg text-orange-600 transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ffffff, #fff7ed)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <Play size={20} className="fill-orange-500" />
              Play Today's Challenge
            </Link>
            <p className="text-white/60 text-xs text-center md:text-right">
              Complete for <span className="text-yellow-300 font-bold">+50 league points</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
