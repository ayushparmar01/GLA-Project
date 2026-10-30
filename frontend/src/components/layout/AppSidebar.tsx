import React from 'react';
import {
  LayoutDashboard,
  Target,
  Sparkles,
  Briefcase,
  FileCheck,
  Video,
  Users,
  CheckSquare,
  Compass,
  UserCheck,
  FileText,
  FolderGit2,
  BookOpen,
  GraduationCap,
  Map,
  MessageSquare,
  Building2,
  Calendar,
  Network,
  ShieldAlert,
  User,
  LogOut,
  X,
  Zap,
  Bell,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { StudentPlacementTab } from '../StudentPlacementView';

export interface AppSidebarNavTarget {
  view: string;
  studentTab?: StudentPlacementTab;
}

interface AppSidebarProps {
  currentView: string;
  currentStudentTab?: StudentPlacementTab;
  onNavigateView: (target: AppSidebarNavTarget) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  view: string;
  studentTab?: StudentPlacementTab;
  badge?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  currentStudentTab = 'DRIVES',
  onNavigateView,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'STUDENT':
        return { label: 'STUDENT PORTAL', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'COLLEGE':
        return { label: 'PLACEMENT CELL', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
      case 'EMPLOYER':
        return { label: 'RECRUITER CONSOLE', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      case 'ADMIN':
        return { label: 'ADMIN CONTROL', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      default:
        return { label: 'CAREER PORTAL', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  const roleMeta = getRoleBadge(user.role);

  // Define navigation groups tailored strictly per user role
  const getNavGroups = (): NavGroup[] => {
    if (user.role === 'STUDENT') {
      return [
        {
          groupName: 'Core Overview',
          items: [
            { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, view: 'dashboard' },
            { id: 'readiness', label: 'Career Readiness (50 kbps)', icon: Target, view: 'student-placement', studentTab: 'READINESS', badge: '50 kbps' },
            { id: 'matching', label: 'Job Matches & Rationale', icon: Sparkles, view: 'student-placement', studentTab: 'MATCHING', badge: 'Explainable' },
          ],
        },
        {
          groupName: 'Campus Placement',
          items: [
            { id: 'drives', label: 'Open Campus Drives', icon: Briefcase, view: 'student-placement', studentTab: 'DRIVES' },
            { id: 'applications', label: 'My Applications', icon: FileCheck, view: 'student-placement', studentTab: 'APPLICATIONS' },
            { id: 'interviews', label: 'Scheduled Interviews', icon: Video, view: 'student-placement', studentTab: 'INTERVIEWS' },
            { id: 'cohorts', label: 'Enrolled Cohorts', icon: Users, view: 'student-placement', studentTab: 'COHORTS' },
          ],
        },
        {
          groupName: 'Assessments & Skills',
          items: [
            { id: 'assessments', label: 'Skill Assessments', icon: CheckSquare, view: 'student-placement', studentTab: 'ASSESSMENTS' },
            { id: 'skill-gaps', label: 'Skill Gap Analysis', icon: Compass, view: 'student-placement', studentTab: 'SKILL_GAPS' },
          ],
        },
        {
          groupName: 'Portfolio & Credentials',
          items: [
            { id: 'career-profile', label: 'Career Profile', icon: UserCheck, view: 'student-placement', studentTab: 'CAREER_PROFILE' },
            { id: 'resumes', label: 'ATS Resume Builder', icon: FileText, view: 'student-placement', studentTab: 'RESUMES' },
            { id: 'portfolio', label: 'Project Portfolio', icon: FolderGit2, view: 'student-placement', studentTab: 'PORTFOLIO' },
            { id: 'profile-settings', label: 'Voice & Profile Setup', icon: User, view: 'profile', badge: 'Voice/தமிழ்' },
          ],
        },
        {
          groupName: 'Learning & Community',
          items: [
            { id: 'learning-hub', label: 'Learning Hub', icon: BookOpen, view: 'student-placement', studentTab: 'LEARNING_HUB' },
            { id: 'roadmaps', label: 'Career Roadmaps', icon: Map, view: 'student-placement', studentTab: 'ROADMAPS' },
            { id: 'mentorship', label: 'Mentorship Network', icon: MessageSquare, view: 'student-placement', studentTab: 'MENTORSHIP' },
            { id: 'communication-centre', label: 'Communication & Notices', icon: Bell, view: 'student-placement', studentTab: 'COMMUNICATION_CENTRE', badge: 'WhatsApp' },
          ],
        },
      ];
    }

    if (user.role === 'COLLEGE') {
      return [
        {
          groupName: 'Institutional Desk',
          items: [
            { id: 'dashboard', label: 'Placement Cell Dashboard', icon: LayoutDashboard, view: 'dashboard' },
            { id: 'cohorts', label: 'Student Cohorts', icon: Users, view: 'cohorts' },
            { id: 'drives', label: 'Placement Drives Coordination', icon: Briefcase, view: 'drives' },
            { id: 'profile', label: 'Institution Profile', icon: Building2, view: 'profile' },
          ],
        },
      ];
    }

    if (user.role === 'EMPLOYER') {
      return [
        {
          groupName: 'Recruiter Console',
          items: [
            { id: 'dashboard', label: 'Recruitment Dashboard', icon: LayoutDashboard, view: 'dashboard' },
            { id: 'employer-opportunities', label: 'Job & Drive Postings', icon: Briefcase, view: 'employer-opportunities', badge: '< 3 Mins' },
            { id: 'employer-applicants', label: 'Candidate Applicants', icon: Users, view: 'employer-applicants' },
            { id: 'employer-interviews', label: 'Interview Schedules', icon: Calendar, view: 'employer-interviews' },
            { id: 'employer-connections', label: 'College Partnerships', icon: Network, view: 'employer-connections' },
            { id: 'employer-profile', label: 'Company Profile & Verification', icon: Building2, view: 'employer-profile' },
          ],
        },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        {
          groupName: 'Platform Governance',
          items: [
            { id: 'admin-control-centre', label: 'Admin Control Centre', icon: ShieldAlert, view: 'admin-control-centre' },
            { id: 'profile', label: 'Admin Profile & Security', icon: User, view: 'profile' },
          ],
        },
      ];
    }

    // Default / Mentor
    return [
      {
        groupName: 'Workspace',
        items: [
          { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, view: 'dashboard' },
          { id: 'profile', label: 'Profile & Settings', icon: User, view: 'profile' },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  const isItemActive = (item: NavItem) => {
    if (item.view === 'student-placement') {
      return currentView === 'student-placement' && currentStudentTab === item.studentTab;
    }
    return currentView === item.view;
  };

  const handleSelectNav = (item: NavItem) => {
    onNavigateView({
      view: item.view,
      studentTab: item.studentTab,
    });
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <BrandLogo
          size="md"
          theme="dark"
          onClick={() => {
            onNavigateView({ view: 'dashboard' });
            onCloseMobile();
          }}
        />
        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close navigation sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill */}
      <div className="px-5 pt-4 pb-2">
        <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-wider flex items-center justify-between ${roleMeta.bg}`}>
          <span>{roleMeta.label}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Navigation Links Scrollable Area */}
      <nav
        aria-label="Application Role Navigation"
        className="flex-1 overflow-y-auto px-3 py-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h4 className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {group.groupName}
            </h4>
            {group.items.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectNav(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                    active
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                        active
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer Profile & Sign Out */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              onNavigateView({ view: 'profile' });
              onCloseMobile();
            }}
            className="flex items-center space-x-2.5 text-left truncate flex-1 hover:opacity-90 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{user.fullName}</div>
              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={logout}
            title="Sign out of portal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-2"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 h-screen sticky top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-Over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-fadeInLeft">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
