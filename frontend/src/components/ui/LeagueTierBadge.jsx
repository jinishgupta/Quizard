'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface LeagueTierBadgeProps {
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const TIER_CONFIG = {
  Bronze: { bg: '#92400E', border: '#B45309', text: '#FDE68A', emoji: '🥉' },
  Silver: { bg: '#374151', border: '#6B7280', text: '#E5E7EB', emoji: '🥈' },
  Gold: { bg: '#78350F', border: '#D97706', text: '#FDE68A', emoji: '🥇' },
  Platinum: { bg: '#1E3A5F', border: '#0284C7', text: '#BAE6FD', emoji: '💎' },
  Diamond: { bg: '#1E1B4B', border: '#6366F1', text: '#C7D2FE', emoji: '💠' },
};

export default function LeagueTierBadge({
  tier,
  size = 'md',
  showLabel = true,
  className = '',
}: LeagueTierBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center ${sizeClasses[size]} 
        rounded-full border font-bold
        ${className}`}
      style={{
        background: config.bg,
        borderColor: config.border,
        color: config.text,
      }}
    >
      <span>{config.emoji}</span>
      {showLabel && <span>{tier}</span>}
    </motion.div>
  );
}