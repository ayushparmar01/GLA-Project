import React from 'react';
import { UserCheck, School, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Role } from '../types';

interface RoleCardsProps {
  onSelectRole?: (role: Role) => void;
}

export const RoleCards: React.FC<RoleCardsProps> = ({ onSelectRole }) => {
  const roles: Array<{
    roleKey: Role;
    title: string;
    role: string;
    icon: typeof UserCheck;
    badge: string;
    description: string;
    benefits: string[];
    actionText: string;
    color: string;
    badgeColor: string;
    btnColor: string;
  }> = [
    {
      roleKey: 'STUDENT',
      title: 'For Students',
      role: 'Tier-2, 3 & Rural College Students',
      icon: UserCheck,
      badge: 'Job Seekers & Innovators',
      description:
        'Overcome the geographical barrier. Build an industry-ready portfolio, take verified skill assessments, and unlock opportunities with national employers.',
      benefits: [
        'Free automated portfolio & resume generator',
        'Direct invitations to pooled off-campus drives',
        'Skill benchmarking & mock interview prep',
      ],
      actionText: 'Register as Student',
      color: 'border-emerald-200 hover:border-emerald-400',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      roleKey: 'COLLEGE',
      title: 'For College Principals & Faculty',
      role: 'Non-Placement Institutions',
      icon: School,
      badge: 'Academic Partners',
      description:
        'Instantly equip your college with an institutional placement cell without expensive overheads. Connect your student batches to regional pooled recruitment consortia.',
      benefits: [
        'Zero-cost cloud placement management portal',
        'Track batch skill competencies & placement rate',
        'Join regional college placement clusters',
      ],
      actionText: 'Register College TPO',
      color: 'border-teal-200 hover:border-teal-400',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      btnColor: 'bg-teal-700 hover:bg-teal-800 text-white',
    },
    {
      roleKey: 'EMPLOYER',
      title: 'For Industry Recruiters',
      role: 'Companies & Startups',
      icon: Briefcase,
      badge: 'Talent Hirers',
      description:
        'Access untapped, hungry, high-retention talent pools from across India without visiting dozens of remote campuses. Pre-screened with ICAN-ready skill evaluations.',
      benefits: [
        'Hire from consolidated regional talent drives',
        'Pre-evaluated coding & aptitude test scores',
        'Dramatically reduced cost per hire & higher loyalty',
      ],
      actionText: 'Register as Recruiter',
      color: 'border-indigo-200 hover:border-indigo-400',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
  ];

  return (
    <section id="roles" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
            Tailored Stakeholder Portals
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Every Stakeholder in Bharat
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg">
            Empowering students, giving colleges institutional pride, and helping companies tap India's deep talent reserves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl p-7 border-2 ${item.color} shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{item.role}</div>

                  <p className="mt-4 text-slate-600 text-sm leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-6 space-y-2.5">
                    {item.benefits.map((benefit, bIdx) => (
                      <div key={bIdx} className="flex items-start space-x-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectRole?.(item.roleKey)}
                    className={`w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${item.btnColor}`}
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Phase 2: Live Registration & Profile Setup
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
