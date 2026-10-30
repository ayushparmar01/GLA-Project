import React from 'react';
import {
  FileText,
  Target,
  Briefcase,
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  Users2,
  BarChart3,
  Globe2,
  CheckCircle,
} from 'lucide-react';

export const CoreFeatures: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: 'Unified Career Profiles & ATS Resumes',
      description:
        'Standardized student portfolios with verified education history, GitHub project showcases, dynamic ATS resume builder, and verifiable credential links.',
      tag: 'Live in Platform',
    },
    {
      icon: Target,
      title: 'Explainable AI Job Matching',
      description:
        'Transparent 5-pillar candidate matching algorithm analyzing technical skills, academic qualification, readiness scores, and location preferences with complete score breakdowns.',
      tag: 'Live in Platform',
    },
    {
      icon: Briefcase,
      title: 'Pooled Campus Drives & Pipelines',
      description:
        'Regional recruitment drive coordination allowing multiple colleges to participate in pooled hiring pipelines with integrated online video interviews and stage tracking.',
      tag: 'Live in Platform',
    },
    {
      icon: Award,
      title: 'Standardized Skill Assessments',
      description:
        'Timed, proctored domain assessments covering Web Development, Programming Languages, DSA, and Core CS with automated scoring and skill breakdown scorecards.',
      tag: 'Live in Platform',
    },
    {
      icon: BookOpen,
      title: 'Advanced Learning & Resource Hub',
      description:
        'Curated technical library across 10+ industry tracks with structured milestone learning paths, progress tracking, personal bookmarks, and verified knowledge quizzes.',
      tag: 'Live in Platform',
    },
    {
      icon: BrainCircuit,
      title: 'AI Mock Interviews & Coaching',
      description:
        'Practice technical, behavioral, and role-specific interviews with an AI coach that evaluates answers against structured rubrics, offering actionable improvement tips.',
      tag: 'Live in Platform',
    },
    {
      icon: Bot,
      title: 'ATS Resume Analyzer & Optimizer',
      description:
        'Upload PDF/DOCX resumes for instant parsing, job-description keyword matching, formatting compliance checks, and concrete bullet-point enhancements.',
      tag: 'Live in Platform',
    },
    {
      icon: Users2,
      title: 'Alumni & Industry Mentorship',
      description:
        'Connect Tier-2/3 students with verified corporate alumni. Schedule 1-on-1 video sessions with structured agendas, goal tracking, and AI session summaries.',
      tag: 'Live in Platform',
    },
    {
      icon: BarChart3,
      title: 'Institutional Analytics & Reporting',
      description:
        'Multi-role analytics dashboards for students, colleges, employers, and administrators with placement funnel metrics, skill-gap heatmaps, and downloadable CSV/PDF reports.',
      tag: 'Live in Platform',
    },
    {
      icon: Globe2,
      title: 'Bilingual & Low-Bandwidth Resilience',
      description:
        'Engineered for rural India: installable Progressive Web App (PWA), lightweight offline asset fallback, and native English/Hindi bilingual interface support.',
      tag: 'Live in Platform',
    },
  ];

  return (
    <section id="features" className="py-20 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full mb-3">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fully Implemented Full-Stack Modules</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Enterprise-Grade Capabilities Built for National Impact.
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg leading-relaxed">
            Every module in CareerBridge is a functional, full-stack capability designed to eliminate
            inequities in campus placement access across Indian districts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 hover:border-slate-500 hover:bg-slate-800 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 border border-slate-700">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {feat.description}
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
