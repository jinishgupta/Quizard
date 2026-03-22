'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface MasteryBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  height?: number;
  className?: string;
}

export default function MasteryBar({
  value,
  showLabel = false,
  height = 8,
  className = '',
}: MasteryBarProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-1 rounded-full bg-[#E8DFC8] border border-[#D4D0C8] overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #FF6B00 0%, #F5E642 100%)',
          }}
          initial={{ width: '0%' }}
          animate={{ width: animated ? `${clampedValue}%` : '0%' }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-[#6B6B6B] tabular-nums w-8 text-right">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}