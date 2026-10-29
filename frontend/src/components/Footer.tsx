import React from 'react';
import { GraduationCap, Heart, Terminal, Database, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Career<span className="text-emerald-500">Bridge</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400 max-w-sm">
              Empowering 35,000+ Indian colleges lacking placement cells with cloud-native TPO infrastructure, pooled recruitment drives, and ICAN-standardized skill verification.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-xs text-slate-500">
              <span>Built for</span>
              <span className="text-emerald-400 font-semibold">MISSION BHARAT HACKATHON</span>
              <span>&bull;</span>
              <span>Problem 07</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Node.js / Express / TypeScript</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>MongoDB + Mongoose ORM</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>ICAN Sandbox Alignment</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 text-teal-400 font-bold">&Delta;</span>
                <span>Vite + React + Tailwind CSS</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Roadmap</h4>
            <ul className="space-y-2 text-xs">
              <li className="text-emerald-400 font-medium">&bull; Phase 1: Project Foundation (Current)</li>
              <li className="text-slate-500">&bull; Phase 2: Multi-Role Auth & Profiles</li>
              <li className="text-slate-500">&bull; Phase 3: College Consortium Engine</li>
              <li className="text-slate-500">&bull; Phase 4: ICAN Skill Sandbox Integration</li>
              <li className="text-slate-500">&bull; Phase 5: Regional Pooled Job Drives</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} CareerBridge. Open-source under MIT License.</p>
          <div className="flex items-center space-x-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for rural and Tier-2/3 student empowerment across India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
