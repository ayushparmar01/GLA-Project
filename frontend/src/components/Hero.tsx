import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  Briefcase,
  GraduationCap,
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
              <span>MISSION BHARAT</span>
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
              and recruitment platform — expanding access to opportunities beyond traditional campus placement networks.
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

          {/* Right Column: Premium Professional Photography Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative">
              {/* Primary Image: Collaborative Campus Learning */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-slate-200/60 border border-slate-200/80 bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                  alt="University students collaborating around laptops in a modern campus learning environment"
                  className="w-full h-64 sm:h-72 lg:h-76 object-cover"
                  width={1200}
                  height={800}
                  loading="eager"
                />
                {/* Editorial Caption Tag */}
                <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 shadow-sm">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Collaborative Campus Learning</span>
                </div>
              </div>

              {/* Supporting Editorial Images */}
              <div className="grid grid-cols-2 gap-3.5 mt-3.5">
                {/* Supporting Image 1: Employer Recruitment & Interview */}
                <div className="relative rounded-xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-200/80 bg-slate-100 group">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
                    alt="Professional recruitment interview and career discussion between employer and candidate"
                    className="w-full h-36 sm:h-40 object-cover"
                    width={800}
                    height={533}
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center space-x-1.5 truncate">
                    <Briefcase className="w-3 h-3 text-teal-400 shrink-0" />
                    <span className="truncate">Industry Recruitment</span>
                  </div>
                </div>

                {/* Supporting Image 2: Technology Skill Development */}
                <div className="relative rounded-xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-200/80 bg-slate-100 group">
                  <img
                    src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
                    alt="Students engaged in collaborative software development and technology skill problem-solving"
                    className="w-full h-36 sm:h-40 object-cover"
                    width={800}
                    height={533}
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center space-x-1.5 truncate">
                    <GraduationCap className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="truncate">Skill Development</span>
                  </div>
                </div>
              </div>

              {/* Subtle background ambient depth */}
              <div className="absolute -bottom-2 -right-2 w-full h-full rounded-3xl bg-emerald-600/5 -z-10 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
