import React, { useState } from 'react';
import {
  GraduationCap,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { SystemHealthResponse, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nContext';
import { NotificationDropdown } from './notifications/NotificationDropdown';
import { LanguageSelector } from './common/LanguageSelector';

export type NavigationTarget =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'profile'
  | 'cohorts'
  | 'drives'
  | 'student-placement'
  | 'employer-opportunities'
  | 'employer-applicants'
  | 'employer-interviews'
  | 'employer-connections'
  | 'employer-profile'
  | 'admin-control-centre';

interface NavbarProps {
  health?: SystemHealthResponse | null;
  loadingHealth?: boolean;
  activeView: string;
  onNavigate: (view: NavigationTarget) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate }) => {
  const { user, token, logout } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'STUDENT':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'COLLEGE':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'EMPLOYER':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'ADMIN':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'MENTOR':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleLinkClick = (hashId: string) => {
    setMobileMenuOpen(false);
    if (activeView !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(hashId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(hashId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
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

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center space-x-3 text-left focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-heading">
                Career<span className="text-emerald-600">Bridge</span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold tracking-wider uppercase text-slate-600">
                Placement Access Platform
              </span>
            </div>
          </button>

          {/* Center: Navigation Links (When on landing page or not authenticated) */}
          <nav className="hidden lg:flex items-center space-x-7 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="hover:text-emerald-600 transition-colors"
            >
              Platform
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="hover:text-emerald-600 transition-colors"
            >
              For Students
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="hover:text-emerald-600 transition-colors"
            >
              For Colleges
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="hover:text-emerald-600 transition-colors"
            >
              For Employers
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('features')}
              className="hover:text-emerald-600 transition-colors"
            >
              Learning Hub
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('problem')}
              className="hover:text-emerald-600 transition-colors"
            >
              About
            </button>
          </nav>

          {/* Right: Actions (Language, Auth, Mobile Menu Toggle) */}
          <div className="flex items-center space-x-3">
            <LanguageSelector />

            {user ? (
              // Authenticated User Menu
              <div className="flex items-center space-x-2">
                <NotificationDropdown token={token} />

                <span
                  className={`hidden md:inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${getRoleBadgeStyle(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-2xs ${
                    activeView === 'dashboard'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Guest Actions
              <div className="hidden sm:flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs flex items-center space-x-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              Platform Overview
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              For Students
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              For Colleges
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('platform')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              For Employers
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('features')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              Learning Hub
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('problem')}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              About the Mission
            </button>
          </div>

          {!user && (
            <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('login');
                }}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('register');
                }}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
