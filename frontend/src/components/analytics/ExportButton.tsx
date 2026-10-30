import React, { useState, useRef, useEffect } from 'react';

export interface ExportButtonProps {
  onExport: (format: 'CSV' | 'PDF') => Promise<void> | void;
  isExporting?: boolean;
  label?: string;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  isExporting = false,
  label = 'Export Report',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (format: 'CSV' | 'PDF') => {
    setIsOpen(false);
    await onExport(format);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <svg
              className="h-3.5 w-3.5 animate-spin text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <span>📥 {label}</span>
            <span className="text-gray-400">▾</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-gray-100 bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleSelect('CSV')}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <span>📊</span>
              <div>
                <p className="font-semibold text-gray-900">Export as CSV</p>
                <p className="text-[10px] text-gray-500">RFC 4180 spreadsheet</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleSelect('PDF')}
              className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <span>📄</span>
              <div>
                <p className="font-semibold text-gray-900">Export as Document</p>
                <p className="text-[10px] text-gray-500">Formatted summary</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
