import React from 'react';
import StreakDisplay from '../StreakDisplay';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const STREAK_DATA = {
  count: 14,
  weekHistory: [true, true, true, true, true, false, true],
  shieldCount: 2,
};

export default function StreakBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-card"
      style={{
        background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(15,15,15,0.6))',
        border: '1px solid rgba(249,115,22,0.2)',
      }}
    >
      <StreakDisplay
        streakCount={STREAK_DATA.count}
        weekHistory={STREAK_DATA.weekHistory}
      />
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
        <Shield size={16} className="text-primary-400" />
        <span className="text-sm font-semibold text-gray-300">
          <span className="text-primary-400 font-bold">{STREAK_DATA.shieldCount}</span> streak shields left
        </span>
      </div>
    </motion.div>
  );
}
