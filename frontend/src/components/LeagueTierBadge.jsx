import React from 'react';

const TIER_CONFIG = {
  Bronze: { gradient: 'linear-gradient(135deg, #cd7f32, #a0522d)', textColor: '#f5deb3', icon: '🥉' },
  Silver: { gradient: 'linear-gradient(135deg, #c0c0c0, #a8a8a8)', textColor: '#f0f0f0', icon: '🥈' },
  Gold: { gradient: 'linear-gradient(135deg, #ffd700, #ffa500)', textColor: '#fff8dc', icon: '🥇' },
  Platinum: { gradient: 'linear-gradient(135deg, #e5e4e2, #b0b0b0)', textColor: '#f8f8ff', icon: '💎' },
  Diamond: { gradient: 'linear-gradient(135deg, #b9f2ff, #89cff0)', textColor: '#e0f7ff', icon: '💠' },
};

export default function LeagueTierBadge({ tier, size = 'md', showLabel = true }) {
  const config = TIER_CONFIG[tier];
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${sizeClasses[size]}`}
      style={{ background: config.gradient, color: config.textColor, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{tier}</span>}
    </div>
  );
}