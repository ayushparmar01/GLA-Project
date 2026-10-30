import React from 'react';
import { UserCheck, School, Briefcase, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react';
import { Role } from '../../types';

interface PlatformOverviewProps {
  onSelectRole: (role: Role) => void;
}

export const PlatformOverview: React.FC<PlatformOverviewProps> = ({ onSelectRole }) => {
  const stakeholders = [
    {
      role: 'STUDENT' as Role,
      title: 'For Students',
      target: 'Tier-2, 3 & Rural College Students',
      icon: UserCheck,
      badge: 'Job Seekers & Innovators',
      description:
        'Overcome the geographical barrier. Build an industry-ready portfolio, take verified skill assessments, and unlock opportunities with national employers.',
      features: [
        'Unified career profile & project portfolio',
        'Direct access to regional pooled recruitment drives',
        'AI-assisted ATS resume analysis & optimization',
        'Interactive mock interviews with rubric feedback',
        'Curated technical learning paths & quizzes',
      ],
      ctaText: 'Explore as Student',
      color: 'border-slate-200 hover:border-emerald-300',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      role: 'COLLEGE' as Role,
      title: 'For Colleges',
      target: 'Non-Placement Institutions',
      icon: School,
      badge: 'Academic Partners',
      description:
        'Instantly equip your college with an institutional placement cell without expensive overheads. Connect your student batches to regional pooled recruitment consortia.',
      features: [
        'Zero-cost cloud placement management portal',
        'Student cohort creation & readiness monitoring',
        'Direct connection pipeline to verified employers',
        'Departmental analytics & placement funnel tracking',
        'Digital audit logs for institutional accreditation',
      ],
      ctaText: 'Register Institution',
      color: 'border-slate-200 hover:border-teal-300',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      btnColor: 'bg-teal-700 hover:bg-teal-800 text-white',
    },
    {
      role: 'EMPLOYER' as Role,
      title: 'For Employers',
      target: 'National Recruiters & Startups',
      icon: Briefcase,
      badge: 'Talent Hirers',
      description:
        'Access untapped, hungry, high-retention talent pools from across India without visiting dozens of remote campuses. Pre-screened with standardized skill evaluations.',
      features: [
        'Publish full-time opportunities and internships',
        'Explainable multi-pillar candidate matching',
        'Multi-stage recruitment workflow & video interviews',
        'Objective verification of academic & technical criteria',
        'Access regional pooled consortia with zero travel cost',
      ],
      ctaText: 'Start Hiring Talent',
      color: 'border-slate-200 hover:border-indigo-300',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    {
      role: 'MENTOR' as Role,
      title: 'For Alumni Mentors',
      target: 'Experienced Industry Leaders',
      icon: HeartHandshake,
      badge: 'Ecosystem Guides',
      description:
        'Give back to grassroots colleges. Guide ambitious Tier-2/3 undergraduates through system design, campus-to-corporate transitions, and technical interview mastery.',
      features: [
        'Verified alumni & mentor public profile',
        'Flexible slot scheduling (weekends/evenings)',
        '1-on-1 video sessions with structured agendas',
        'Milestone-driven mentee goal tracking',
        'AI notes summarization & actionable feedback',
      ],
      ctaText: 'Join as Mentor',
      color: 'border-slate-200 hover:border-purple-300',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      btnColor: 'bg-purple-700 hover:bg-purple-800 text-white',
    },
  ];

  return (
    <section id="platform" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Ecosystem Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            One Platform. Multiple Career Stakeholders.
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
            CareerBridge connects every participant in the early-career pipeline through an integrated,
            transparent, and merit-based operating model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stakeholders.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl p-6 border ${s.color} shadow-xs hover:shadow-lg transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-200">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                  <div className="text-xs font-medium text-slate-500 mb-3">{s.target}</div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {s.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    {s.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start space-x-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRole(s.role)}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-1.5 ${s.btnColor} shadow-xs`}
                >
                  <span>{s.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
