import React from 'react';
import { Flame } from 'lucide-react';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StreakDisplay({ streakCount, weekHistory, compact = false }) {
  return (
    <div
      className={`flex items-center ${compact ? 'gap-2' : 'gap-4'} px-4 py-3 rounded-2xl`}
      style={{
        background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.08))',
        border: '1px solid rgba(249,115,22,0.2)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <Flame size={compact ? 16 : 20} className="text-primary-400" style={{ filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.6))' }} />
        <span className={`font-mono font-bold tabular-nums ${compact ? 'text-base' : 'text-xl'} text-primary-400`}>
          {streakCount}
        </span>
        {!compact && <span className="text-xs text-gray-400 font-medium">day streak</span>}
      </div>
      <div className="flex items-center gap-1.5">
        {weekHistory.map((completed, i) => (
          <div
            key={`day-pill-${i}`}
            className="flex flex-col items-center gap-0.5"
          >
            <div
              className={`rounded-full flex items-center justify-center transition-all duration-150 ${
                compact ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-xs'
              } ${
                completed
                  ? 'streak-pill-active text-white font-bold' :'bg-surface-elevated text-gray-600 border border-gray-700'
              }`}
            >
              {completed ? <Flame size={compact ? 10 : 12} /> : DAY_LABELS[i]}
            </div>
            {!compact && (
              <span className="text-gray-600 text-xs">{DAY_LABELS[i]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}