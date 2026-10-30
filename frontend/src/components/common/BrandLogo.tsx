import React from 'react';
import { GraduationCap } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  theme = 'light',
  subtitle = 'Placement Access Platform',
  onClick,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const capSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const isDark = theme === 'dark';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={`flex items-center space-x-2.5 select-none ${onClick ? 'cursor-pointer focus:outline-hidden' : ''} ${className}`}
    >
      {/* Refined Brand Emblem */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0 border border-emerald-500/30`}
      >
        <GraduationCap className={capSizes[size]} />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col text-left leading-tight">
        <span
          className={`${titleSizes[size]} font-extrabold tracking-tight font-heading ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          Career<span className="text-emerald-600">Bridge</span>
        </span>
        {subtitle && (
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
