'use client';
import React from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import MasteryBar from './MasteryBar';

interface CategoryCardProps {
  id: string;
  emoji: string;
  name: string;
  mastery: number;
  masteryLabel: string;
  locked?: boolean;
  unlockCost?: number;
  accent?: string;
  onClick?: () => void;
}

export default function CategoryCard({
  emoji,
  name,
  mastery,
  masteryLabel,
  locked = false,
  unlockCost,
  accent = '#FF6B00',
  onClick,
}: CategoryCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '5px 5px 0px #1A1A1A' }}
      whileTap={{ scale: 0.97, boxShadow: '2px 2px 0px #1A1A1A' }}
      onClick={locked ? undefined : onClick}
      className={`relative bg-white border-2 border-[#1A1A1A] rounded-xl p-3 
        shadow-[4px_4px_0px_#1A1A1A] cursor-pointer transition-all duration-150
        ${locked ? 'opacity-70' : ''}`}
    >
      {locked && (
        <div className="absolute inset-0 bg-[#F5EDD8]/80 rounded-xl flex flex-col items-center justify-center z-10 border-2 border-[#1A1A1A]">
          <Lock size={20} className="text-[#6B6B6B] mb-1" />
          {unlockCost && (
            <span className="text-xs font-semibold text-[#6B6B6B]">{unlockCost} credits</span>
          )}
        </div>
      )}
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="font-display font-700 text-[13px] text-[#1A1A1A] leading-tight mb-1" style={{ fontWeight: 700 }}>
        {name}
      </div>
      <div className="text-[11px] text-[#A0998A] mb-2">{masteryLabel}</div>
      <MasteryBar value={mastery} height={6} />
    </motion.div>
  );
}