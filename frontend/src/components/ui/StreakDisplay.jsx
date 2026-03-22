'use client';
import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakDisplayProps {
  streak: number;
  completedDays: boolean[];
  compact?: boolean;
  className?: string;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StreakDisplay({
  streak,
  completedDays,
  compact = false,
  className = '',
}: StreakDisplayProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flame size={compact ? 20 : 24} className="text-[#FF6B00]" fill="#FF6B00" />
        </motion.div>
        <span className="font-display font-800 text-[#1A1A1A]" style={{ fontSize: compact ? '18px' : '22px', fontWeight: 800 }}>
          {streak} day streak
        </span>
        {streak >= 7 && (
          <span className="text-xs font-semibold bg-[#F5E642] border border-[#1A1A1A] rounded-full px-2 py-0.5 text-[#1A1A1A]">
            🔥 On fire!
          </span>
        )}
      </div>
      <div className="flex gap-1.5">
        {completedDays.map((completed, i) => (
          <motion.div
            key={`streak-day-${i}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className={`flex flex-col items-center gap-1 ${compact ? 'w-8' : 'flex-1 min-w-[36px]'}`}
          >
            <div
              className={`${compact ? 'w-8 h-8' : 'w-full h-9'} rounded-lg border-2 flex items-center justify-center
                ${completed
                  ? 'bg-[#FF6B00] border-[#CC5500] shadow-[2px_2px_0px_#CC5500]'
                  : 'bg-[#F5EDD8] border-[#D4D0C8]'
                }`}
            >
              {completed ? (
                <Flame size={compact ? 12 : 14} className="text-white" fill="white" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4D0C8]" />
              )}
            </div>
            {!compact && (
              <span className="text-[10px] font-medium text-[#A0998A]">{DAY_LABELS[i]}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}