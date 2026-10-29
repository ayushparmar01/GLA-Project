import React from 'react';
import { GraduationCap, ShieldCheck, User, LogOut, LayoutDashboard, UserCheck } from 'lucide-react';
import { SystemHealthResponse } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  health: SystemHealthResponse | null;
  loadingHealth: boolean;
  activeView: string;
  onNavigate: (view: 'landing' | 'login' | 'register' | 'dashboard' | 'profile') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, loadingHealth, activeView, onNavigate }) => {
  const { user, logout } = useAuth();

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
              <span>Phase 2: Auth & RBAC Active</span>
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
            onClick={() => onNavigate('landing')}
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
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
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
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => onNavigate('profile')}
                  className={`hover:text-emerald-600 transition-colors flex items-center space-x-1 ${
                    activeView === 'profile' ? 'text-emerald-600 font-semibold' : ''
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>My Profile</span>
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

            {/* User Profile or Login/Register buttons */}
            {user ? (
              <div className="flex items-center space-x-2">
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
                  title="Sign Out"
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
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
