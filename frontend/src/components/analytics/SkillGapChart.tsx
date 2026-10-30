import React from 'react';

export interface MissingSkillItem {
  skill: string;
  studentCount: number;
  percentageOfCohort: number;
  recommendedLearningPathId?: string;
  recommendedLearningPathTitle?: string;
}

export interface SkillGapChartProps {
  title?: string;
  subtitle?: string;
  missingSkills: MissingSkillItem[];
  onNavigateToLearning?: (pathId?: string) => void;
}

export const SkillGapChart: React.FC<SkillGapChartProps> = ({
  title = 'Institutional Skill Gap Distribution',
  subtitle = 'Top technical and domain skills missing across student profiles with recommended learning paths',
  missingSkills,
  onNavigateToLearning,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
      </div>

      <div className="mt-5 space-y-4">
        {missingSkills.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No critical skill gaps detected. Student profiles align well with target roles.
          </p>
        ) : (
          missingSkills.map((item) => (
            <div
              key={item.skill}
              className="rounded-lg border border-gray-100 bg-gray-50/60 p-3.5 transition hover:border-gray-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{item.skill}</h4>
                  <p className="text-xs text-gray-500">
                    Missing in <span className="font-semibold text-gray-700">{item.studentCount} students</span> ({item.percentageOfCohort}% of cohort)
                  </p>
                </div>

                {item.recommendedLearningPathTitle && (
                  <button
                    type="button"
                    onClick={() => onNavigateToLearning?.(item.recommendedLearningPathId)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <span>📚 {item.recommendedLearningPathTitle}</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              {/* Progress bar representing missing severity */}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    item.percentageOfCohort > 40
                      ? 'bg-rose-500'
                      : item.percentageOfCohort > 25
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, item.percentageOfCohort)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
