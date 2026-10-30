import React, { useState } from 'react';
import { ReportFormat, ReportScopeType, AnalyticsDateFilter } from '../../types';
import { generateReportApi, downloadReportApi } from '../../services/api';

export interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scopeType: ReportScopeType;
  scopeId: string;
  defaultTitle?: string;
  token?: string | null;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  scopeType,
  scopeId,
  defaultTitle = 'CareerBridge Analytics Report',
  token,
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [format, setFormat] = useState<ReportFormat>('CSV');
  const [preset, setPreset] = useState<string>('30D');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setStatusMessage('Generating verified report data...');
    setErrorMessage('');

    try {
      const filter: AnalyticsDateFilter = {
        preset: preset as any,
        from: preset === 'CUSTOM' ? fromDate : undefined,
        to: preset === 'CUSTOM' ? toDate : undefined,
      };

      const res = await generateReportApi(
        {
          title,
          reportType: `${scopeType}_ANALYTICS_EXPORT`,
          format,
          scopeType,
          scopeId,
          filter,
        },
        token
      );

      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to generate report');
      }

      const generated = res.data;
      setStatusMessage('Report compiled. Initiating download...');

      // Download content
      const downloadRes = await downloadReportApi(generated.id, token);
      if (downloadRes.success && downloadRes.content) {
        const mimeType = format === 'CSV' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;';
        const blob = new Blob([downloadRes.content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadRes.filename || `${scopeType.toLowerCase()}_report.${format === 'CSV' ? 'csv' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatusMessage('Report downloaded successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        throw new Error(downloadRes.error || 'Failed to download report content');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error generating report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-lg font-bold text-gray-900">Generate & Export Report</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleGenerate} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Report Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Format</label>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition ${
                  format === 'CSV'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="CSV"
                  checked={format === 'CSV'}
                  onChange={() => setFormat('CSV')}
                  className="sr-only"
                />
                <span>📊 CSV Spreadsheet</span>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition ${
                  format === 'PDF'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="PDF"
                  checked={format === 'PDF'}
                  onChange={() => setFormat('PDF')}
                  className="sr-only"
                />
                <span>📄 Summary Document</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Date Range Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="90D">Last 90 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="PREVIOUS_MONTH">Previous Month</option>
              <option value="THIS_QUARTER">This Quarter</option>
              <option value="THIS_YEAR">This Year</option>
              <option value="ALL">All Time</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>

          {preset === 'CUSTOM' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-600">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-800"
                />
              </div>
            </div>
          )}

          {statusMessage && (
            <p className="rounded-md bg-blue-50 p-2 text-center text-xs font-medium text-blue-700">
              {statusMessage}
            </p>
          )}

          {errorMessage && (
            <p className="rounded-md bg-rose-50 p-2 text-center text-xs font-medium text-rose-700">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : '📥 Generate & Download'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
