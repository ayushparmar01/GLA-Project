import React from 'react';
import { Bot, Sparkles, BrainCircuit, ShieldCheck, FileCheck, Layers } from 'lucide-react';

export const AiIntelligence: React.FC = () => {
  const aiModules = [
    {
      icon: FileCheck,
      title: 'ATS Resume Scoring & Keyword Analysis',
      description:
        'Analyzes student resumes against specific job requirements. Evaluates keyword density, formatting compliance, section coverage, and quantifies action verbs with actionable bullet rewrite tips.',
    },
    {
      icon: BrainCircuit,
      title: 'Interactive Mock Interview Coaching',
      description:
        'Simulates real technical and behavioral interview scenarios based on target job descriptions. Evaluates candidate responses against structured rubrics, highlighting knowledge gaps and communication clarity.',
    },
    {
      icon: Layers,
      title: '5-Pillar Explainable Recommendation Engine',
      description:
        'Recommends job openings and learning resources with mathematical transparency: breaking down match scores by Skills, Academic Eligibility, Assessment Scores, Career Interests, and Location.',
    },
    {
      icon: Bot,
      title: 'AI Career Assistant & Roadmap Generator',
      description:
        'Generates step-by-step milestone learning roadmaps tailored to a student’s current year and target engineering specialization, complete with practice tasks and reference documentation.',
    },
  ];

  return (
    <section id="ai-intelligence" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Explainable Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Actionable Career Intelligence, Grounded in Real Data.
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
            CareerBridge employs AI to assist students with concrete, explainable career preparation —
            never replacing objective merit or verified skill assessments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {aiModules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl p-7 border border-slate-200/90 hover:border-indigo-300 transition-all flex items-start space-x-5"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{mod.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ethical Transparency Card */}
        <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-6 h-6 text-indigo-700 shrink-0" />
            <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed font-medium">
              <strong>Transparency Disclosure:</strong> AI recommendations provide assistive guidance only.
              All recruitment shortlisting, interview evaluations, and hiring selections depend strictly on
              verified academic criteria and standardized assessment scores.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
