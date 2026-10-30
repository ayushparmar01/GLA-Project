import React from 'react';
import { Menu, Zap, Wifi, User, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { StudentPlacementTab } from '../StudentPlacementView';

interface AppHeaderProps {
  currentView: string;
  currentStudentTab?: StudentPlacementTab;
  onOpenMobileSidebar: () => void;
  onNavigateToProfile: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  currentStudentTab,
  onOpenMobileSidebar,
  onNavigateToProfile,
}) => {
  const { user, token, logout } = useAuth();

  const getBreadcrumb = (): { parent: string; current: string } => {
    if (!user) return { parent: 'Portal', current: 'Overview' };

    switch (user.role) {
      case 'STUDENT': {
        if (currentView === 'profile') return { parent: 'Student Portal', current: 'Profile & Settings' };
        if (currentView === 'student-placement') {
          switch (currentStudentTab) {
            case 'READINESS':
              return { parent: 'Student Portal', current: 'Career Readiness (50 kbps)' };
            case 'MATCHING':
              return { parent: 'Student Portal', current: 'Recommended Opportunities' };
            case 'DRIVES':
              return { parent: 'Campus Placement', current: 'Open Drives' };
            case 'APPLICATIONS':
              return { parent: 'Campus Placement', current: 'My Applications' };
            case 'INTERVIEWS':
              return { parent: 'Campus Placement', current: 'Scheduled Interviews' };
            case 'COHORTS':
              return { parent: 'Campus Placement', current: 'My Cohorts' };
            case 'ASSESSMENTS':
              return { parent: 'Skills', current: 'Skill Assessments' };
            case 'SKILL_GAPS':
              return { parent: 'Skills', current: 'Skill Gap Analysis' };
            case 'RESUMES':
              return { parent: 'Credentials', current: 'ATS Resume Builder' };
            case 'PORTFOLIO':
              return { parent: 'Credentials', current: 'Project Portfolio' };
            case 'ATS_ANALYZER':
              return { parent: 'Credentials', current: 'ATS Resume Analyzer' };
            case 'LEARNING_HUB':
              return { parent: 'Learning', current: 'Learning Resource Hub' };
            case 'ROADMAPS':
              return { parent: 'Learning', current: 'Career Roadmaps' };
            case 'MENTORSHIP':
              return { parent: 'Network', current: 'Mentorship Network' };
            default:
              return { parent: 'Student Portal', current: 'Placement Desk' };
          }
        }
        return { parent: 'Student Portal', current: 'Dashboard Overview' };
      }
      case 'COLLEGE': {
        if (currentView === 'cohorts') return { parent: 'Placement Cell', current: 'Student Cohorts' };
        if (currentView === 'drives') return { parent: 'Placement Cell', current: 'Placement Drives' };
        if (currentView === 'profile') return { parent: 'Placement Cell', current: 'Institution Profile' };
        return { parent: 'Placement Cell', current: 'Institutional Dashboard' };
      }
      case 'EMPLOYER': {
        if (currentView === 'employer-opportunities') return { parent: 'Recruiter Console', current: 'Opportunity Management' };
        if (currentView === 'employer-applicants') return { parent: 'Recruiter Console', current: 'Candidate Applicants' };
        if (currentView === 'employer-interviews') return { parent: 'Recruiter Console', current: 'Interview Schedules' };
        if (currentView === 'employer-connections') return { parent: 'Recruiter Console', current: 'College Partnerships' };
        if (currentView === 'employer-profile') return { parent: 'Recruiter Console', current: 'Company Profile' };
        return { parent: 'Recruiter Console', current: 'Recruiter Dashboard' };
      }
      case 'ADMIN': {
        if (currentView === 'profile') return { parent: 'Admin', current: 'Security & Profile' };
        return { parent: 'Governance', current: 'Admin Control Centre' };
      }
      default:
        return { parent: 'Portal', current: 'Dashboard' };
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16 flex items-center px-4 sm:px-6 lg:px-8 justify-between shadow-2xs">
      {/* Left: Mobile menu toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3.5 truncate">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Contextual Breadcrumb */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium truncate">
          <span className="hidden sm:inline text-slate-400">{breadcrumb.parent}</span>
          <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-300 shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {breadcrumb.current}
          </h2>
        </div>
      </div>

      {/* Right: Network indicator, Language, Notifications & User */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Network Resilience Status Pill */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>Low-Bandwidth Optimized</span>
        </div>

        {/* Compact Language Selector */}
        <LanguageSelector variant="compact" />

        {/* Real Notification Dropdown */}
        <NotificationDropdown token={token} />

        {/* User Profile Mini Trigger */}
        <button
          type="button"
          onClick={onNavigateToProfile}
          className="hidden sm:flex items-center space-x-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left"
          title="Account Settings & Profile"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate hidden md:inline">
            {user?.fullName}
          </span>
        </button>

        {/* Logout Quick Trigger */}
        <button
          type="button"
          onClick={logout}
          title="Sign out of portal"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
