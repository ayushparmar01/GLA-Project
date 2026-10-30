import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  User,
  LogOut,
  LayoutDashboard,
  UserCheck,
  Users,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { SystemHealthResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nContext';
import { NotificationDropdown } from './notifications/NotificationDropdown';
import { LanguageSelector } from './common/LanguageSelector';
import { PwaInstallBanner } from './pwa/PwaInstallBanner';

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
  health: SystemHealthResponse | null;
  loadingHealth: boolean;
  activeView: string;
  onNavigate: (view: NavigationTarget) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, loadingHealth, activeView, onNavigate }) => {
  const { user, token, logout } = useAuth();
  const { t } = useTranslation();

  const isHealthy = health?.success && health.data?.status === 'healthy';
  const isDegraded = health?.success && health.data?.status === 'degraded';

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'STUDENT':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'COLLEGE':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'EMPLOYER':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'ADMIN':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Hackathon Top Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded text-[11px] border border-emerald-400/30">
              MISSION BHARAT HACKATHON
            </span>
            <span className="hidden sm:inline text-slate-300">
              Problem 07: Career Access for Colleges with No Placement Cell
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-emerald-200/90 font-medium">
            <span className="inline-flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phase 5: Student Career Profile, ATS Resume Builder & Portfolio</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <button
            type="button"
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center space-x-3 text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-heading">
                Career<span className="text-emerald-600">Bridge</span>
              </span>
              <span className="hidden md:inline-block ml-2 text-[11px] font-semibold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                PLACEMENTS FOR BHARAT
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('landing')}
              className={`hover:text-emerald-600 transition-colors ${activeView === 'landing' ? 'text-emerald-600 font-semibold' : ''}`}
            >
              Overview
            </button>

            {user ? (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`hover:text-emerald-600 transition-colors flex items-center space-x-1 ${
                    activeView === 'dashboard' ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('nav.dashboard')}</span>
                </button>

                {user.role === 'COLLEGE' && (
                  <>
                    <button
                      onClick={() => onNavigate('cohorts')}
                      className={`hover:text-teal-600 transition-colors flex items-center space-x-1 ${
                        activeView === 'cohorts' ? 'text-teal-600 font-semibold' : ''
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>{t('nav.cohorts')}</span>
                    </button>
                    <button
                      onClick={() => onNavigate('drives')}
                      className={`hover:text-teal-600 transition-colors flex items-center space-x-1 ${
                        activeView === 'drives' ? 'text-teal-600 font-semibold' : ''
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>{t('nav.drives')}</span>
                    </button>
                  </>
                )}

                {user.role === 'EMPLOYER' && (
                  <>
                    <button
                      onClick={() => onNavigate('employer-opportunities')}
                      className={`hover:text-indigo-600 transition-colors flex items-center space-x-1 ${
                        activeView === 'employer-opportunities' ? 'text-indigo-600 font-semibold' : ''
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>{t('nav.opportunities')}</span>
                    </button>
                    <button
                      onClick={() => onNavigate('employer-applicants')}
                      className={`hover:text-indigo-600 transition-colors flex items-center space-x-1 ${
                        activeView === 'employer-applicants' ? 'text-indigo-600 font-semibold' : ''
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>{t('nav.candidates')}</span>
                    </button>
                    <button
                      onClick={() => onNavigate('employer-interviews')}
                      className={`hover:text-indigo-600 transition-colors flex items-center space-x-1 ${
                        activeView === 'employer-interviews' ? 'text-indigo-600 font-semibold' : ''
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{t('nav.interviews')}</span>
                    </button>
                  </>
                )}

                {user.role === 'STUDENT' && (
                  <button
                    onClick={() => onNavigate('student-placement')}
                    className={`hover:text-emerald-600 transition-colors flex items-center space-x-1 ${
                      activeView === 'student-placement' ? 'text-emerald-600 font-semibold' : ''
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>{t('nav.drives')}</span>
                  </button>
                )}

                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => onNavigate('admin-control-centre')}
                    className={`hover:text-purple-600 transition-colors flex items-center space-x-1 ${
                      activeView === 'admin-control-centre' ? 'text-purple-600 font-semibold' : ''
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('nav.controlCentre')}</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigate('profile')}
                  className={`hover:text-emerald-600 transition-colors flex items-center space-x-1 ${
                    activeView === 'profile' ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{t('nav.profile')}</span>
                </button>
              </>
            ) : (
              <>
                <a href="#problem" className="hover:text-emerald-600 transition-colors">
                  The Challenge
                </a>
                <a href="#pillars" className="hover:text-emerald-600 transition-colors">
                  Core Pillars
                </a>
                <a href="#diagnostics" className="hover:text-emerald-600 transition-colors">
                  Diagnostics
                </a>
              </>
            )}
          </nav>

          {/* Auth State & Health Controls */}
          <div className="flex items-center space-x-3">
            {/* Health pill */}
            <div className="hidden lg:flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full border bg-slate-50">
              <span className="relative flex h-2 w-2">
                {loadingHealth ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                ) : isHealthy ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                ) : isDegraded ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                )}
              </span>
              <span className="font-medium text-slate-700">
                {loadingHealth ? 'Probing...' : isHealthy ? 'API Healthy' : isDegraded ? 'API Degraded' : 'API Offline'}
              </span>
            </div>

            {/* Language Selector & PWA Install Button */}
            <LanguageSelector />
            <PwaInstallBanner variant="pill" />

            {/* User Profile or Login/Register buttons */}
            {user ? (
              <div className="flex items-center space-x-2">
                <NotificationDropdown token={token} />
                <span className={`hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span className="max-w-[120px] truncate">{user.fullName.split(' ')[0]}</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    onNavigate('landing');
                  }}
                  title={t('nav.logout')}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-xs font-semibold text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t('nav.login')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
                >
                  {t('nav.register')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
