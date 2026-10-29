import React from 'react';
import { Layers, Network, Award, ShieldCheck, Check } from 'lucide-react';

export const ValueProps: React.FC = () => {
  const pillars = [
    {
      icon: Layers,
      title: 'Cloud TPO-as-a-Service',
      subtitle: 'For Colleges with Zero Placement Infrastructure',
      description:
        'Small colleges cannot afford dedicated corporate relations teams. CareerBridge provides an automated, AI-driven placement management system to track student cohorts, schedule drives, and manage credentials.',
      highlights: [
        'Automated student profile & resume builder',
        'One-click college cohort registration',
        'Direct notification pipeline for upcoming drives',
      ],
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Network,
      title: 'Regional Pooled Talent Pools',
      subtitle: 'Eliminating the "Campus Visit Minimum" Hurdle',
      description:
        'Corporate recruiters often skip remote colleges due to low batch sizes. CareerBridge pools 50+ colleges in a district into a single unified regional talent drive, making recruitment cost-effective.',
      highlights: [
        'Consortium-based campus recruitment drives',
        'Unified test centers & remote interview rooms',
        'Equalized visibility regardless of college pin code',
      ],
      color: 'from-teal-500 to-cyan-600',
    },
    {
      icon: Award,
      title: 'Standardized ICAN Assessment Ready',
      subtitle: 'Bridging the Corporate Trust Deficit',
      description:
        'Recruiters hesitate to hire from unranked colleges due to uncertain curriculum quality. Standardized benchmarks evaluate actual coding, aptitude, and domain competencies.',
      highlights: [
        'Standardized technical & communication assessments',
        'Proctored, tamper-proof skill scorecards',
        'Future-ready ICAN sandbox integration layer',
      ],
      color: 'from-indigo-500 to-blue-600',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Credential Portfolios',
      subtitle: 'Zero-Friction Hiring for Recruiters',
      description:
        'Recruiters get direct access to pre-vetted, benchmarked student profiles with authenticated project repositories and verified academic records—eliminating weeks of resume screening.',
      highlights: [
        'Live code repo & project proof links',
        'Automated background & marksheet verification',
        'Role-specific talent shortlisting filters',
      ],
      color: 'from-violet-500 to-purple-600',
    },
  ];

  return (
    <section id="pillars" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
            Architected for Mission Bharat
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How CareerBridge Solves the Placement Divide
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg">
            A comprehensive, technology-driven ecosystem transforming every under-served college into a high-visibility placement launchpad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{pillar.title}</h3>
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {pillar.subtitle}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed mt-4">
                    {pillar.description}
                  </p>

                  <div className="mt-6 space-y-2.5">
                    {pillar.highlights.map((item, hIdx) => (
                      <div key={hIdx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">Pillar 0{idx + 1}</span>
                  <span className="text-emerald-600 font-medium">Phase 1 Schema Ready</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
