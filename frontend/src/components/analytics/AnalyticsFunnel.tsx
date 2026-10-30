import React from 'react';

export interface FunnelStage {
  stage: string;
  count: number;
  conversionPercentage: number;
  description?: string;
}

export interface AnalyticsFunnelProps {
  title?: string;
  subtitle?: string;
  stages: FunnelStage[];
  countingUnit?: 'UNIQUE_STUDENTS' | 'APPLICATIONS';
}

export const AnalyticsFunnel: React.FC<AnalyticsFunnelProps> = ({
  title = 'Placement Conversion Funnel',
  subtitle = 'Tracking student progression through recruitment milestones',
  stages,
  countingUnit = 'UNIQUE_STUDENTS',
}) => {
  const maxCount = stages.length > 0 ? Math.max(...stages.map((s) => s.count), 1) : 1;

  const stageColors = [
    'bg-blue-600',
    'bg-indigo-600',
    'bg-sky-600',
    'bg-amber-600',
    'bg-purple-600',
    'bg-emerald-600',
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {countingUnit === 'UNIQUE_STUDENTS' ? '👤 Unique Students' : '📄 Applications'}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {stages.map((stage, idx) => {
          const widthPercent = Math.max(8, Math.round((stage.count / maxCount) * 100));
          const colorClass = stageColors[idx % stageColors.length];

          return (
            <div key={stage.stage} className="relative">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{stage.stage}</span>
                  {stage.description && (
                    <span className="hidden text-gray-400 sm:inline">({stage.description})</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{stage.count.toLocaleString()}</span>
                  <span
                    className={`inline-block w-12 text-right font-medium ${
                      stage.conversionPercentage >= 70
                        ? 'text-green-600'
                        : stage.conversionPercentage >= 40
                        ? 'text-amber-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {idx === 0 ? '100%' : `${stage.conversionPercentage}%`}
                  </span>
                </div>
              </div>

              {/* Funnel Bar */}
              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>

              {idx < stages.length - 1 && (
                <div className="ml-4 h-2 border-l border-dashed border-gray-300" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
        <p className="font-medium">Methodology Guarantee:</p>
        <p className="mt-0.5 text-blue-700">
          • Unique student counts are tracked across all stages to prevent distortion from multiple job applications.
          <br />
          • Verified placements reflect only offers marked with verified status <span className="font-semibold">SELECTED</span>. Shortlisted candidates are not counted as selected.
        </p>
      </div>
    </div>
  );
};
