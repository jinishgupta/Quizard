import React from 'react';

export default function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
}) {
  const variantClasses = {
    default: 'bg-[#111827] border border-[#1F2937]',
    brutal: 'bg-[#111827] border-2 border-[#374151] shadow-[4px_4px_0px_#1D4ED8]',
    elevated: 'bg-[#1F2937] border border-[#374151]',
    outlined: 'bg-transparent border-2 border-[#1D4ED8]',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-5',
    lg: 'p-6 md:p-8',
  };

  return (
    <div
      className={`rounded-[10px] ${variantClasses[variant]} ${paddingClasses[padding]} ${onClick ? 'cursor-pointer card-hover' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
