import React from 'react';
import { UserCheck, Search, BookOpen, TrendingUp, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onGetStarted: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onGetStarted }) => {
  const steps = [
    {
      step: '01',
      title: 'Build Your Profile',
      subtitle: 'Verified Identity',
      icon: UserCheck,
      description:
        'Create a comprehensive career profile highlighting verified coursework, GitHub projects, certifications, technical skills, and ATS-optimized resumes.',
    },
    {
      step: '02',
      title: 'Discover Opportunities',
      subtitle: 'Merit-Based Matching',
      icon: Search,
      description:
        'Explore verified full-time jobs, paid internships, and pooled off-campus recruitment drives aligned with your eligibility and demonstrated skills.',
    },
    {
      step: '03',
      title: 'Develop Your Skills',
      subtitle: 'Targeted Preparation',
      icon: BookOpen,
      description:
        'Bridge skill gaps with structured learning paths, take proctored domain assessments, practice with AI mock interviews, and connect with alumni mentors.',
    },
    {
      step: '04',
      title: 'Track Your Progress',
      subtitle: 'Transparent Outcomes',
      icon: TrendingUp,
      description:
        'Follow your recruitment pipeline in real time from application submission to shortlisting, video interview rounds, and final verified selection offers.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Structured Progression
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            From Skills to Career Opportunities.
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
            A clear, predictable roadmap taking students from initial profile creation to verified job offers
            with continuous skill feedback at every stage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-300 tracking-tight">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                    {item.subtitle}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-700/20 hover:shadow-lg"
          >
            <span>Start Your Career Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
