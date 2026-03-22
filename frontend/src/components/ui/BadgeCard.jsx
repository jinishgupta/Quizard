import React from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const RARITY_CONFIG = {
  common: { border: '#374151', glow: 'transparent', label: 'Common', labelColor: '#9CA3AF' },
  rare: { border: '#1D4ED8', glow: 'rgba(29,78,216,0.2)', label: 'Rare', labelColor: '#60A5FA' },
  epic: { border: '#7C3AED', glow: 'rgba(124,58,237,0.2)', label: 'Epic', labelColor: '#C4B5FD' },
  legendary: { border: '#D97706', glow: 'rgba(217,119,6,0.2)', label: 'Legendary', labelColor: '#FCD34D' },
};

export default function BadgeCard({
  emoji,
  name,
  description,
  earned,
  earnedDate,
  rarity = 'common',
  className = '',
}) {
  const config = RARITY_CONFIG[rarity];

  return (
    <motion.div
      whileHover={earned ? { scale: 1.04 } : {}}
      className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-200 ${
        earned ? 'bg-[#111827]' : 'bg-[#0D1117]'
      } ${className}`}
      style={{
        borderColor: earned ? config.border : '#1F2937',
        boxShadow: earned && rarity !== 'common' ? `0 0 16px ${config.glow}` : 'none',
      }}
    >
      {/* Emoji / Icon */}
      <div
        className={`text-3xl mb-2 ${!earned ? 'grayscale opacity-30' : ''}`}
        style={{ filter: !earned ? 'grayscale(100%) opacity(0.3)' : 'none' }}
      >
        {emoji}
      </div>

      {/* Lock overlay */}
      {!earned && (
        <div className="absolute top-3 right-3">
          <Lock size={12} className="text-[#4B5563]" />
        </div>
      )}

      {/* Rarity label */}
      {earned && rarity !== 'common' && (
        <span
          className="text-[9px] font-bold uppercase tracking-widest mb-1"
          style={{ color: config.labelColor }}
        >
          {config.label}
        </span>
      )}

      <p className={`text-xs font-bold leading-tight ${earned ? 'text-[#E5E7EB]' : 'text-[#4B5563]'}`}>
        {name}
      </p>
      <p className={`text-[10px] mt-1 leading-tight ${earned ? 'text-[#6B7280]' : 'text-[#374151]'}`}>
        {description}
      </p>
      {earned && earnedDate && (
        <p className="text-[9px] text-[#4B5563] mt-1.5 font-mono">{earnedDate}</p>
      )}
    </motion.div>
  );
}
