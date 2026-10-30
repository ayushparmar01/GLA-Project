import React from 'react';
import { GraduationCap, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigateToSection?: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToSection }) => {
  const currentYear = new Date().getFullYear();

  const handleScroll = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateToSection) {
      onNavigateToSection(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Column 1 — Brand & Mission (spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3 text-white">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Career<span className="text-emerald-400">Bridge</span>
              </span>
            </div>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Autonomous career development and recruitment infrastructure built for grassroots engineering
              and technical colleges lacking dedicated placement cells.
            </p>

            <div className="pt-2 flex flex-col space-y-1 text-xs">
              <span className="text-emerald-400 font-semibold tracking-wide">
                MISSION BHARAT HACKATHON
              </span>
              <span className="text-slate-500 font-medium">
                Problem Statement #07 — Career Access for Colleges with No Placement Cell
              </span>
            </div>
          </div>

          {/* Column 2 — Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#platform" onClick={(e) => handleScroll('platform', e)} className="hover:text-emerald-400 transition-colors">
                  For Students
                </a>
              </li>
              <li>
                <a href="#platform" onClick={(e) => handleScroll('platform', e)} className="hover:text-emerald-400 transition-colors">
                  For Colleges (TPO)
                </a>
              </li>
              <li>
                <a href="#platform" onClick={(e) => handleScroll('platform', e)} className="hover:text-emerald-400 transition-colors">
                  For Employers
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => handleScroll('features', e)} className="hover:text-emerald-400 transition-colors">
                  Learning Resource Hub
                </a>
              </li>
              <li>
                <a href="#platform" onClick={(e) => handleScroll('platform', e)} className="hover:text-emerald-400 transition-colors">
                  Alumni Mentorship Network
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 — Resources & Preparation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#features" onClick={(e) => handleScroll('features', e)} className="hover:text-emerald-400 transition-colors">
                  ATS Resume Analyzer
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => handleScroll('features', e)} className="hover:text-emerald-400 transition-colors">
                  AI Mock Interview Practice
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => handleScroll('features', e)} className="hover:text-emerald-400 transition-colors">
                  Standardized Assessments
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={(e) => handleScroll('how-it-works', e)} className="hover:text-emerald-400 transition-colors">
                  Career Roadmaps
                </a>
              </li>
              <li>
                <a href="#accessibility" onClick={(e) => handleScroll('accessibility', e)} className="hover:text-emerald-400 transition-colors">
                  Low-Bandwidth PWA
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 — Hackathon & Governance */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Governance</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#problem" onClick={(e) => handleScroll('problem', e)} className="hover:text-emerald-400 transition-colors">
                  Problem Analysis
                </a>
              </li>
              <li>
                <a href="#ai-intelligence" onClick={(e) => handleScroll('ai-intelligence', e)} className="hover:text-emerald-400 transition-colors">
                  AI Ethics & Disclosure
                </a>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">Open Source (MIT)</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">Privacy Policy</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-default">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {currentYear} CareerBridge. Designed and built for the Mission Bharat Hackathon.</p>
          <div className="flex items-center space-x-1">
            <span>Empowering Tier-2/3 & rural student talent across India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
