import React from 'react';
import { Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreditBadge({
  amount,
  size = 'md',
  animated = false,
  className = '',
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };
  const iconSizes = { sm: 12, md: 14, lg: 16 };

  const badge = (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} 
        bg-[#1E3A5F] border border-[#1D4ED8] rounded-full 
        font-semibold font-mono text-[#60A5FA]
        ${className}`}
    >
      <Coins size={iconSizes[size]} className="text-[#FCD34D]" />
      <span className="tabular-nums">{amount.toLocaleString()}</span>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex"
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}