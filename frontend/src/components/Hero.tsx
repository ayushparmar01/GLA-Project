import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  Users2,
  Target,
  ShieldCheck,
  Briefcase,
  Star,
  Award,
  Layers,
} from 'lucide-react';

interface HeroProps {
  onExplore?: () => void;
  onJoin?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore, onJoin }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-white via-slate-50/50 to-white">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-100/60 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading, Value Prop & CTAs */}
          <div className="lg:col-span-7 text-left space-y-6">
            {/* Hackathon Badge */}
            <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200/90 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>MISSION BHARAT HACKATHON — Problem Statement #07</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Bridging the Gap Between{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700">
                Talent and Opportunity.
              </span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl">
              CareerBridge connects students, colleges and employers through a unified career development
              and recruitment platform — making career opportunities more accessible to students beyond
              traditional campus placement networks.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onExplore || (() => {
                  const el = document.getElementById('platform');
                  el?.scrollIntoView({ behavior: 'smooth' });
                })}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-700/20 hover:shadow-lg hover:-translate-y-0.5"
              >
                <span>Explore the Platform</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onJoin}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 transition-all hover:border-slate-400"
              >
                <span>Join CareerBridge</span>
              </button>
            </div>

            {/* Credible Trust Badges (No fake stats) */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600 font-medium">
              <span className="inline-flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Setup Overhead for Colleges</span>
              </span>
              <span className="inline-flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Regional Pooled Recruitment Drives</span>
              </span>
              <span className="inline-flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Skill Readiness Portfolios</span>
              </span>
            </div>
          </div>

          {/* Right Column: Realistic Product Dashboard Visual */}
          <div className="lg:col-span-5 relative">
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl border border-slate-800 relative z-10 space-y-4">
              {/* Card Header: Student Profile Snapshot */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white text-base shadow-sm">
                    AS
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold text-sm text-white">Aarav Sharma</h4>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-400">B.Tech CSE • Kolhapur District</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Readiness: 88%
                  </span>
                </div>
              </div>

              {/* Active Recommended Drive */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                    <Target className="w-3.5 h-3.5" />
                    <span>Top Recommendation (94% Match)</span>
                  </span>
                  <span className="text-slate-400">Full-Time</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-100">
                    Associate Full-Stack Software Engineer
                  </div>
                  <div className="text-xs text-slate-400">ZenithPay Technologies (FinTech) • ₹6.5 - 8.5 LPA</div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['React', 'TypeScript', 'Node.js', 'PostgreSQL'].map((sk) => (
                    <span key={sk} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Application Status Pipeline Preview */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Application Pipeline</div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center space-x-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Selected for Technical Offer</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-400">Round 2 / 2</span>
                </div>
              </div>

              {/* Mentorship & Assessment Pulse */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-200">DSA Assessment</div>
                    <div className="text-[10px] text-slate-400">Score: 92/100 (Verified)</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 flex items-center space-x-2">
                  <Users2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-200">Alumni Mentor</div>
                    <div className="text-[10px] text-slate-400">Session Complete</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle background card depth accent */}
            <div className="absolute -bottom-3 -right-3 w-full h-full rounded-3xl bg-emerald-600/10 border border-emerald-500/20 pointer-events-none -z-0" />
          </div>
        </div>
      </div>
    </section>
  );
};
