import React, { useState } from 'react';
import { AppSidebar, AppSidebarNavTarget } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { OfflineIndicator } from '../pwa/OfflineIndicator';
import { StudentPlacementTab } from '../StudentPlacementView';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  currentView: string;
  currentStudentTab?: StudentPlacementTab;
  onNavigateView: (target: AppSidebarNavTarget) => void;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
  currentView,
  currentStudentTab,
  onNavigateView,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Offline Status & Network Resiliency Alert */}
      <OfflineIndicator />

      {/* Role-Specific Application Sidebar (Desktop Fixed + Mobile Drawer) */}
      <AppSidebar
        currentView={currentView}
        currentStudentTab={currentStudentTab}
        onNavigateView={onNavigateView}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Right Column: Top App Header + Dynamic View Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Compact App Header (Replaces the Marketing Navbar Completely) */}
        <AppHeader
          currentView={currentView}
          currentStudentTab={currentStudentTab}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onNavigateToProfile={() => onNavigateView({ view: 'profile' })}
        />

        {/* Authenticated View Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
