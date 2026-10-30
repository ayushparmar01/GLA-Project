import React from 'react';
import { PublicNavbar } from './PublicNavbar';
import { Footer } from '../Footer';
import { OfflineIndicator } from '../pwa/OfflineIndicator';

interface PublicLayoutProps {
  children: React.ReactNode;
  activeView: 'landing' | 'login' | 'register';
  onNavigate: (view: 'landing' | 'login' | 'register') => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  activeView,
  onNavigate,
  onNavigateSection,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Offline Status & Low-Bandwidth Indicator */}
      <OfflineIndicator />

      {/* Public Marketing Navbar (ONLY mounted on public marketing pages) */}
      <PublicNavbar
        activeView={activeView}
        onNavigate={onNavigate}
        onNavigateSection={onNavigateSection}
      />

      {/* Main Public Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Public Marketing Footer */}
      <Footer onNavigateToSection={onNavigateSection} />
    </div>
  );
};
