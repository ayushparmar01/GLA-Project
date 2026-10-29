import React from 'react';
import { ArrowRight, CheckCircle2, Building2, Users2, Sparkles, Target } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-white via-slate-50 to-white bg-grid-pattern">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-800 mb-6 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>MISSION BHARAT — Equal Opportunity Across Every District</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Bridging the Placement Divide for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">
              India's Grassroots Colleges
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            Over 35,000 colleges across Tier-2, Tier-3, and rural India operate without a Training & Placement Officer (TPO).
            <span className="font-semibold text-slate-800"> CareerBridge</span> delivers an autonomous, cloud-native placement cell as a service—pooling students into verified talent consortiums directly accessible by top industry recruiters.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#roles"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base transition-all shadow-lg shadow-emerald-700/25 hover:shadow-xl hover:-translate-y-0.5"
            >
              <span>Get Started as Student</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#problem"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-slate-300 transition-all hover:border-slate-400"
            >
              <span>View Problem Analysis</span>
            </a>
          </div>

          {/* Trust bullets */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-500 font-medium">
            <span className="inline-flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero setup cost for non-placement colleges</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ICAN Sandbox assessment aligned</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Direct regional pooled recruitment drives</span>
            </span>
          </div>
        </div>

        {/* Statistical Highlights Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Target Coverage</span>
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">35,000+</div>
            <p className="mt-2 text-sm text-slate-600">
              Colleges across India lacking institutional industry placement ties, now connected through unified regional clusters.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Student Empowerment</span>
              <Users2 className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">10 Million+</div>
            <p className="mt-2 text-sm text-slate-600">
              Talented graduates from Tier-2/3 & rural districts who gain verified, merit-based visibility to national employers.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Skill Benchmarking</span>
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">100% Verified</div>
            <p className="mt-2 text-sm text-slate-600">
              Standardized skill assessments designed to bridge the trust deficit between remote colleges and top-tier recruiters.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
