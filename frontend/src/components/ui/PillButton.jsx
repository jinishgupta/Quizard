'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface PillButtonProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export default function PillButton({
  children,
  active = false,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  icon,
}: PillButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs gap-1',
    md: 'px-4 py-1.5 text-sm gap-1.5',
    lg: 'px-6 py-2.5 text-base gap-2',
  };

  const getVariantClasses = () => {
    if (active) return 'bg-[#1D4ED8] text-white border-[#1D4ED8]';
    switch (variant) {
      case 'primary': return 'bg-[#1D4ED8] text-white border-[#1D4ED8] hover:bg-[#1E40AF]';
      case 'secondary': return 'bg-[#1F2937] text-[#9CA3AF] border-[#374151] hover:border-[#1D4ED8] hover:text-white';
      case 'ghost': return 'bg-transparent text-[#9CA3AF] border-transparent hover:bg-[#1F2937] hover:text-white';
      case 'danger': return 'bg-[#450A0A] text-[#F87171] border-[#DC2626] hover:bg-[#7F1D1D]';
      default: return 'bg-[#1F2937] text-[#9CA3AF] border-[#374151]';
    }
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full border font-semibold transition-all duration-150 ${sizeClasses[size]} ${getVariantClasses()} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </motion.button>
  );
}
