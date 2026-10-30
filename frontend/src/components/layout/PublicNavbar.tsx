import React, { useState } from 'react';
import { Menu, X, ArrowRight, Sparkles, LogIn } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSelector } from '../common/LanguageSelector';

export interface PublicNavbarProps {
  activeView: 'landing' | 'login' | 'register';
  onNavigate: (target: 'landing' | 'login' | 'register') => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  activeView,
  onNavigate,
  onNavigateSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (activeView !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      if (onNavigateSection) {
        onNavigateSection(sectionId);
      } else {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      {/* Top Hackathon Banner */}
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded text-[11px] border border-emerald-400/30">
              MISSION BHARAT
            </span>
            <span className="hidden sm:inline text-slate-300">
              Career Access for Colleges with No Placement Cell
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-300 font-medium">
            <span className="hidden md:inline-flex items-center space-x-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Full-Stack Platform Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Public Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo */}
          <BrandLogo
            size="md"
            onClick={() => onNavigate('landing')}
          />

          {/* Center: Navigation Links */}
          <nav
            aria-label="Public Marketing Navigation"
            className="hidden lg:flex items-center space-x-7 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              For Students
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              For Colleges
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              For Employers
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('features')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Learning Hub
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('problem')}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            <LanguageSelector variant="compact" />

            <div className="hidden sm:flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeView === 'login'
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="px-4.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm shadow-emerald-700/20 flex items-center space-x-1.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Platform Overview
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              For Students
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              For Colleges
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              For Employers
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('features')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Learning Hub
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('problem')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              About the Initiative
            </button>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('login');
              }}
              className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Log In to Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('register');
              }}
              className="w-full py-2.5 rounded-xl text-center text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center justify-center space-x-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
