import React, { useState } from 'react';
import { AnalyticsDateFilter, AnalyticsDatePeriod } from '../../types';

export interface DateRangeFilterProps {
  value: AnalyticsDateFilter;
  onChange: (filter: AnalyticsDateFilter) => void;
  disabled?: boolean;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isCustomOpen, setIsCustomOpen] = useState(value.preset === 'CUSTOM');
  const [fromDate, setFromDate] = useState(value.from || '');
  const [toDate, setToDate] = useState(value.to || '');

  const presetLabels: Record<AnalyticsDatePeriod, string> = {
    TODAY: 'Today',
    '7D': 'Last 7 Days',
    '30D': 'Last 30 Days',
    '90D': 'Last 90 Days',
    THIS_MONTH: 'This Month',
    PREVIOUS_MONTH: 'Previous Month',
    THIS_QUARTER: 'This Quarter',
    THIS_YEAR: 'This Year',
    ALL: 'All Time',
    CUSTOM: 'Custom Range',
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value as AnalyticsDatePeriod;
    if (preset === 'CUSTOM') {
      setIsCustomOpen(true);
      onChange({ preset: 'CUSTOM', from: fromDate, to: toDate });
    } else {
      setIsCustomOpen(false);
      onChange({ preset });
    }
  };

  const handleApplyCustom = () => {
    if (fromDate && toDate) {
      onChange({ preset: 'CUSTOM', from: fromDate, to: toDate });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <select
          value={value.preset || '30D'}
          onChange={handlePresetChange}
          disabled={disabled}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        >
          {Object.entries(presetLabels).map(([presetKey, label]) => (
            <option key={presetKey} value={presetKey}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isCustomOpen && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1.5 text-xs shadow-sm">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            disabled={disabled}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            disabled={disabled}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleApplyCustom}
            disabled={disabled || !fromDate || !toDate}
            className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};
