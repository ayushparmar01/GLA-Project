import React from 'react';
import { ArrowRight, UserCheck, School, Briefcase } from 'lucide-react';
import { Role } from '../../types';

interface FinalCtaProps {
  onSelectRole: (role: Role) => void;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ onSelectRole }) => {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider mb-4 inline-block">
          MISSION BHARAT HACKATHON
        </span>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mt-2">
          Your Potential Deserves a Path Forward.
        </h2>

        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Connect with opportunities, strengthen your skills, and take the next step in your career journey.
          No expensive placement overheads. No geographical boundaries.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => onSelectRole('STUDENT')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-700/25 flex items-center justify-center space-x-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Join as Student</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onSelectRole('COLLEGE')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center justify-center space-x-2"
          >
            <School className="w-4 h-4" />
            <span>Register College</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectRole('EMPLOYER')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center justify-center space-x-2"
          >
            <Briefcase className="w-4 h-4" />
            <span>Recruit Talent</span>
          </button>
        </div>
      </div>
    </section>
  );
};
