import React from 'react';
import { Compass, WifiOff, Globe, Building2, CheckCircle2 } from 'lucide-react';

export const ImpactAccessibility: React.FC = () => {
  const pillars = [
    {
      icon: Compass,
      title: 'Beyond Metropolitan Campuses',
      description:
        'Architected specifically for institutions located in rural and district-level geographies across Bharat, ensuring student opportunities do not depend on campus pin codes.',
    },
    {
      icon: Building2,
      title: 'Digital TPO for Non-Placement Colleges',
      description:
        'Equips colleges lacking corporate placement offices with an automated, cloud-based platform to organize student cohorts and connect directly to regional recruiter consortia.',
    },
    {
      icon: Globe,
      title: 'Bilingual Interface (English & Hindi)',
      description:
        'Full bilingual localization enabling students to navigate career workflows, understand job requirements, and review guidelines in their preferred language.',
    },
    {
      icon: WifiOff,
      title: 'Low-Bandwidth & PWA Offline Resilience',
      description:
        'Installable Progressive Web App with optimized data payload compression and client-side asset caching, maintaining reliable operation over spotty rural mobile networks.',
    },
  ];

  return (
    <section id="accessibility" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Inclusive by Design
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Wider Access to Career Opportunities.
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
            CareerBridge is engineered to remove geographical, linguistic, and infrastructural friction
            so that student ambition translates into tangible career access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-800 flex items-center justify-center border border-slate-200 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
