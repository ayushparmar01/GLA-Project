import React from 'react';
import { AlertCircle, Building, MapPin, Compass, ShieldAlert, Award } from 'lucide-react';

export const ProblemStatement: React.FC = () => {
  const problems = [
    {
      icon: Building,
      title: 'Limited Placement Cell Infrastructure',
      subtitle: 'Institutional Divide',
      description:
        'Grassroots and rural colleges rarely have dedicated Training & Placement Officers (TPOs) or corporate relations budgets. Faculty members manage recruitment as an auxiliary duty alongside heavy teaching loads.',
      tag: 'Zero Overhead Needed',
      accentColor: 'text-rose-500 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400',
    },
    {
      icon: MapPin,
      title: 'Geographical Hiring Disconnect',
      subtitle: 'Logistical Bottleneck',
      description:
        'Enterprise recruiters naturally concentrate on metropolitan campuses to optimize travel logistics. Talented students in Tier-2, Tier-3 and district-level institutes remain unseen and uninvited to off-campus pipelines.',
      tag: 'Consortium Pooling',
      accentColor: 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400',
    },
    {
      icon: ShieldAlert,
      title: 'The Resume & Credential Trust Deficit',
      subtitle: 'Screening Friction',
      description:
        'Without trusted campus brand recognition, automated ATS filters indiscriminately reject resumes. Employers lack verifiable proof of real coding competence, project authenticity, and practical readiness.',
      tag: 'Standardized Portfolios',
      accentColor: 'text-sky-500 bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-400',
    },
    {
      icon: Compass,
      title: 'Fragmented Guidance & Skill Visibility',
      subtitle: 'Readiness Gap',
      description:
        'Students lack clear visibility into actual industry technology stacks, role-specific prerequisites, ATS formatting, and technical interview rubrics — creating avoidable rejection cycles.',
      tag: 'Autonomous Guidance',
      accentColor: 'text-teal-500 bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-400',
    },
  ];

  return (
    <section id="problem" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80 mb-3">
            <AlertCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>Problem Statement #07 — The Placement Divide</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Opportunity Should Not Depend on Campus Infrastructure.
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
            Talented graduates across non-metropolitan India possess raw capability, drive, and ambition.
            Yet traditional campus recruitment models fail to reach them due to four structural obstacles.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${prob.accentColor}`}>
                      {prob.tag}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {prob.subtitle}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">
                      {prob.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {prob.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
