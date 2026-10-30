import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  badge?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'purple';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  trend,
  badge,
  variant = 'default',
  onClick,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'border-blue-200 bg-blue-50/50 hover:border-blue-300';
      case 'success':
        return 'border-green-200 bg-green-50/50 hover:border-green-300';
      case 'warning':
        return 'border-amber-200 bg-amber-50/50 hover:border-amber-300';
      case 'purple':
        return 'border-purple-200 bg-purple-50/50 hover:border-purple-300';
      default:
        return 'border-gray-200 bg-white hover:border-gray-300';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-5 transition-all shadow-sm ${getVariantStyles()} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-gray-900">{value}</span>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isNeutral
                  ? 'text-gray-500'
                  : trend.isPositive
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
