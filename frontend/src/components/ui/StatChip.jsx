import React from 'react';

const COLOR_MAP = {
  blue: { bg: '#1E3A5F', text: '#60A5FA', border: '#1D4ED8' },
  green: { bg: '#14532D', text: '#4ADE80', border: '#16A34A' },
  red: { bg: '#450A0A', text: '#F87171', border: '#DC2626' },
  yellow: { bg: '#451A03', text: '#FCD34D', border: '#D97706' },
  purple: { bg: '#2E1065', text: '#C4B5FD', border: '#7C3AED' },
  default: { bg: '#1F2937', text: '#9CA3AF', border: '#374151' },
};

export default function StatChip({
  label,
  value,
  icon,
  color = 'default',
  size = 'md',
  className = '',
}) {
  const colors = COLOR_MAP[color];

  return (
    <div
      className={`inline-flex flex-col items-center justify-center rounded-lg border ${size === 'sm' ? 'px-3 py-2' : 'px-4 py-3'} ${className}`}
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      {icon && <div className="mb-1" style={{ color: colors.text }}>{icon}</div>}
      <span
        className={`font-black font-mono tabular-nums ${size === 'sm' ? 'text-base' : 'text-xl'}`}
        style={{ color: colors.text }}
      >
        {value}
      </span>
      <span className={`font-medium text-[#6B7280] ${size === 'sm' ? 'text-[10px]' : 'text-xs'} mt-0.5`}>
        {label}
      </span>
    </div>
  );
}
