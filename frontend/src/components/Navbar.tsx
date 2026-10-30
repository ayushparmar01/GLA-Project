import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PublicNavbar } from './layout/PublicNavbar';

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
  activeView: string;
  onNavigate: (view: NavigationTarget) => void;
  onNavigateSection?: (sectionId: string) => void;
}

/**
 * Navbar - Preserves backward compatibility.
 * Strict Rule: For authenticated users, this marketing navbar must NEVER render.
 * Authenticated layouts use AppSidebar + AppHeader.
 */
export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate, onNavigateSection }) => {
  const { user } = useAuth();

  // If user is authenticated, the public marketing navbar MUST NOT BE MOUNTED
  if (user) {
    return null;
  }

  const publicTarget = (activeView === 'login' || activeView === 'register') ? activeView : 'landing';

  return (
    <PublicNavbar
      activeView={publicTarget}
      onNavigate={(target) => onNavigate(target as NavigationTarget)}
      onNavigateSection={onNavigateSection}
    />
  );
};
