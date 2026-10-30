import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider } from './i18n/I18nContext';
import { Navbar, NavigationTarget } from './components/Navbar';
import { Hero } from './components/Hero';
import { SystemHealthBanner } from './components/SystemHealthBanner';
import { ProblemStatement } from './components/landing/ProblemStatement';
import { PlatformOverview } from './components/landing/PlatformOverview';
import { CoreFeatures } from './components/landing/CoreFeatures';
import { HowItWorks } from './components/landing/HowItWorks';
import { AiIntelligence } from './components/landing/AiIntelligence';
import { ImpactAccessibility } from './components/landing/ImpactAccessibility';
import { FinalCta } from './components/landing/FinalCta';
import { Footer } from './components/Footer';
import { RegisterView } from './components/RegisterView';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { UnauthorizedView } from './components/UnauthorizedView';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { PwaInstallBanner } from './components/pwa/PwaInstallBanner';
import { fetchSystemHealth } from './services/api';
import { SystemHealthResponse, Role } from './types';
import { Loader2 } from 'lucide-react';

// Code-split heavy views for optimal low-bandwidth initial load
const ProfileEditView = lazy(() => import('./components/ProfileEditView').then(m => ({ default: m.ProfileEditView })));
const CohortManagementView = lazy(() => import('./components/CohortManagementView').then(m => ({ default: m.CohortManagementView })));
const DriveManagementView = lazy(() => import('./components/DriveManagementView').then(m => ({ default: m.DriveManagementView })));
const StudentPlacementView = lazy(() => import('./components/StudentPlacementView').then(m => ({ default: m.StudentPlacementView })));
const OpportunityManagementView = lazy(() => import('./components/employer/OpportunityManagementView').then(m => ({ default: m.OpportunityManagementView })));
const EmployerApplicantView = lazy(() => import('./components/employer/EmployerApplicantView').then(m => ({ default: m.EmployerApplicantView })));
const InterviewManagementView = lazy(() => import('./components/employer/InterviewManagementView').then(m => ({ default: m.InterviewManagementView })));
const CollegeConnectionsView = lazy(() => import('./components/employer/CollegeConnectionsView').then(m => ({ default: m.CollegeConnectionsView })));
const CompanyProfileView = lazy(() => import('./components/employer/CompanyProfileView').then(m => ({ default: m.CompanyProfileView })));
const AdminControlCentreView = lazy(() => import('./components/admin/AdminControlCentreView').then(m => ({ default: m.AdminControlCentreView })));

export type ViewMode =
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
  | 'admin-control-centre'
  | 'unauthorized';

const ViewLoadingFallback: React.FC = () => (
  <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[360px] text-slate-500">
    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
    <span className="text-sm font-semibold text-slate-700">Loading Section...</span>
    <span className="text-xs text-slate-400 mt-1">Optimizing data usage for your network</span>
  </div>
);

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewMode>('landing');
  const [selectedDriveIdForApplicants, setSelectedDriveIdForApplicants] = useState<string | null>(null);
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  const checkHealth = useCallback(async () => {
    setLoadingHealth(true);
    const result = await fetchSystemHealth();
    setHealth(result);
    setLoadingHealth(false);
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // When a user successfully authenticates, transition to the Dashboard
  useEffect(() => {
    if (user && (activeView === 'login' || activeView === 'register')) {
      setActiveView('dashboard');
    }
  }, [user, activeView]);

  const handleRoleCardSelect = (_roleKey: Role) => {
    setActiveView('register');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Offline Status & Low-Bandwidth Indicator */}
      <OfflineIndicator />

      {/* Navigation */}
      <Navbar
        health={health}
        loadingHealth={loadingHealth}
        activeView={activeView}
        onNavigate={(view: NavigationTarget) => setActiveView(view as ViewMode)}
      />

      {/* Main Content Area wrapped in Suspense for Code-Splitting */}
      <main className="flex-1">
        <Suspense fallback={<ViewLoadingFallback />}>
          {activeView === 'landing' && (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <PwaInstallBanner variant="banner" />
              </div>
              <Hero
                onExplore={() => {
                  const el = document.getElementById('platform');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                onJoin={() => setActiveView('register')}
              />
              <SystemHealthBanner health={health} loading={loadingHealth} onRefresh={checkHealth} />
              <ProblemStatement />
              <PlatformOverview onSelectRole={handleRoleCardSelect} />
              <CoreFeatures />
              <HowItWorks onGetStarted={() => setActiveView('register')} />
              <AiIntelligence />
              <ImpactAccessibility />
              <FinalCta onSelectRole={handleRoleCardSelect} />
            </>
          )}

          {activeView === 'login' && (
            <LoginView
              onSuccess={() => setActiveView('dashboard')}
              onSwitchToRegister={() => setActiveView('register')}
            />
          )}

          {activeView === 'register' && (
            <RegisterView
              onSuccess={() => setActiveView('dashboard')}
              onSwitchToLogin={() => setActiveView('login')}
            />
          )}

          {activeView === 'dashboard' && (
            user ? (
              <DashboardView
                onEditProfile={() => setActiveView('profile')}
                onNavigateToCohorts={() => setActiveView('cohorts')}
                onNavigateToDrives={() => setActiveView('drives')}
                onNavigateToStudentPlacement={() => setActiveView('student-placement')}
                onNavigateToEmployerOpportunities={() => setActiveView('employer-opportunities')}
                onNavigateToEmployerApplicants={() => setActiveView('employer-applicants')}
                onNavigateToEmployerInterviews={() => setActiveView('employer-interviews')}
                onNavigateToEmployerConnections={() => setActiveView('employer-connections')}
                onNavigateToEmployerProfile={() => setActiveView('employer-profile')}
              />
            ) : (
              <LoginView
                onSuccess={() => setActiveView('dashboard')}
                onSwitchToRegister={() => setActiveView('register')}
              />
            )
          )}

          {activeView === 'profile' && (
            user ? (
              <ProfileEditView onBack={() => setActiveView('dashboard')} />
            ) : (
              <LoginView
                onSuccess={() => setActiveView('dashboard')}
                onSwitchToRegister={() => setActiveView('register')}
              />
            )
          )}

          {activeView === 'cohorts' && (
            user?.role === 'COLLEGE' ? (
              <CohortManagementView onBack={() => setActiveView('dashboard')} />
            ) : (
              <UnauthorizedView onBack={() => setActiveView('dashboard')} userRole={user?.role} />
            )
          )}

          {activeView === 'drives' && (
            user?.role === 'COLLEGE' ? (
              <DriveManagementView onBack={() => setActiveView('dashboard')} />
            ) : (
              <UnauthorizedView onBack={() => setActiveView('dashboard')} userRole={user?.role} />
            )
          )}

          {activeView === 'student-placement' && (
            user?.role === 'STUDENT' ? (
              <StudentPlacementView
                onBack={() => setActiveView('dashboard')}
                onNavigateToProfile={() => setActiveView('profile')}
              />
            ) : (
              <UnauthorizedView onBack={() => setActiveView('dashboard')} userRole={user?.role} />
            )
          )}

          {/* Phase 4 Employer Views */}
          {activeView === 'employer-opportunities' && (
            user?.role === 'EMPLOYER' ? (
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <OpportunityManagementView
                  onSelectDriveApplicants={(driveId) => {
                    setSelectedDriveIdForApplicants(driveId);
                    setActiveView('employer-applicants');
                  }}
                />
              </div>
            ) : (
              <UnauthorizedView onBack={() => setActiveView('dashboard')} userRole={user?.role} />
            )
          )}

          {activeView === 'employer-applicants' && (
            user?.role === 'EMPLOYER' ? (
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <EmployerApplicantView
                  initialDriveId={selectedDriveIdForApplicants}
                  onNavigateToInterviews={() => setActiveView('employer-interviews')}
                />
              </div>
            ) : (
              <UnauthorizedView onBack={() => setActiveView('dashboard')} userRole={user?.role} />
            )
          )}

          {activeView === 'employer-interviews' && (
            user?.role === 'EMPLOYER' ? (
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <InterviewManagementView />
              </div>
            ) : (
              <UnauthorizedView onBack={() => setActiveView('dashboard')} userRole={user?.role} />
            )
          )}

          {activeView === 'employer-connections' && (
            user?.role === 'EMPLOYER' ? (
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <CollegeConnectionsView />
              </div>
            ) : (
              <UnauthorizedView onBack={() => setActiveView('dashboard')} userRole={user?.role} />
            )
          )}

          {activeView === 'employer-profile' && (
            user?.role === 'EMPLOYER' ? (
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <CompanyProfileView />
              </div>
            ) : (
              <UnauthorizedView onBack={() => setActiveView('dashboard')} userRole={user?.role} />
            )
          )}

          {/* Phase 9 Admin Control Centre View */}
          {activeView === 'admin-control-centre' && (
            user?.role === 'ADMIN' ? (
              <AdminControlCentreView />
            ) : (
              <UnauthorizedView onBack={() => setActiveView('dashboard')} userRole={user?.role} />
            )
          )}

          {activeView === 'unauthorized' && (
            <UnauthorizedView
              onBack={() => setActiveView('dashboard')}
              userRole={user?.role}
            />
          )}
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

const I18nBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  return (
    <I18nProvider
      authToken={token}
      userPreferredLanguage={user?.preferredLanguage}
    >
      {children}
    </I18nProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <I18nBridge>
        <AppContent />
      </I18nBridge>
    </AuthProvider>
  );
};

export default App;
