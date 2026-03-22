import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function PlayerRow({
  rank,
  name,
  avatar,
  weeklyScore,
  accuracy,
  isCurrentUser = false,
  trend = 'same',
  className = '',
}) {
  const rankColors = {
    1: '#FCD34D',
    2: '#D1D5DB',
    3: '#CD7F32',
  };

  const trendIcon = {
    up: <ArrowUp size={12} className="text-green-400" />,
    down: <ArrowDown size={12} className="text-red-400" />,
    same: <Minus size={12} className="text-gray-500" />,
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-150 ${
        isCurrentUser
          ? 'bg-[#1E3A5F] border-[#1D4ED8] shadow-[0_0_0_1px_#1D4ED8]'
          : 'bg-[#111827] border-[#1F2937] hover:border-[#374151]'
      } ${className}`}
    >
      {/* Rank */}
      <div className="w-8 flex items-center justify-center">
        <span
          className="text-sm font-black font-mono tabular-nums"
          style={{ color: rankColors[rank] || (isCurrentUser ? '#60A5FA' : '#6B7280') }}
        >
          #{rank}
        </span>
      </div>

      {/* Trend */}
      <div className="w-4 flex items-center justify-center">
        {trendIcon[trend]}
      </div>

      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          isCurrentUser ? 'ring-2 ring-[#1D4ED8]' : ''
        }`}
        style={{ background: '#1F2937', border: '1px solid #374151' }}
      >
        {avatar}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-semibold truncate block ${
            isCurrentUser ? 'text-white' : 'text-[#E5E7EB]'
          }`}
        >
          {name}
          {isCurrentUser && (
            <span className="ml-2 text-[10px] font-bold text-[#60A5FA] bg-[#1E3A5F] px-1.5 py-0.5 rounded-full border border-[#1D4ED8]">
              YOU
            </span>
          )}
        </span>
      </div>

      {/* Score */}
      <div className="text-right">
        <p className="text-sm font-black font-mono tabular-nums text-white">{weeklyScore.toLocaleString()}</p>
        <p className="text-[10px] text-[#6B7280]">{accuracy}% acc</p>
      </div>
    </div>
  );
}
