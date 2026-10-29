import React, { useEffect, useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SystemHealthBanner } from './components/SystemHealthBanner';
import { ValueProps } from './components/ValueProps';
import { RoleCards } from './components/RoleCards';
import { Footer } from './components/Footer';
import { RegisterView } from './components/RegisterView';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { ProfileEditView } from './components/ProfileEditView';
import { UnauthorizedView } from './components/UnauthorizedView';
import { fetchSystemHealth } from './services/api';
import { SystemHealthResponse, Role } from './types';

type ViewMode = 'landing' | 'login' | 'register' | 'dashboard' | 'profile' | 'unauthorized';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewMode>('landing');
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

  const handleRoleCardSelect = (roleKey: Role) => {
    setActiveView('register');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        health={health}
        loadingHealth={loadingHealth}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'landing' && (
          <>
            <Hero />
            <SystemHealthBanner health={health} loading={loadingHealth} onRefresh={checkHealth} />
            <ValueProps />
            <RoleCards onSelectRole={handleRoleCardSelect} />
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
            <DashboardView onEditProfile={() => setActiveView('profile')} />
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

        {activeView === 'unauthorized' && (
          <UnauthorizedView
            onBack={() => setActiveView('dashboard')}
            userRole={user?.role}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
