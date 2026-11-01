import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import TasksView from './views/TasksView';
import SubmissionsView from './views/SubmissionsView';
import MembersView from './views/MembersView';
import ChatModerationView from './views/ChatModerationView';
import AuditTrailView from './views/AuditTrailView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import VeylithLogo from './components/VeylithLogo';
import { api } from './api';

function AppContent() {
  const { user, isStaff, isAdmin, loading: authLoading } = useAuth();
  const { toastError } = useToast();

  const [activeView, setActiveView] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch admin stats when staff is active
  const fetchStats = useCallback(async () => {
    if (!isAdmin) {
      setStatsLoading(false);
      return;
    }
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.warn('Stats fetch issue:', err.message);
    } finally {
      setStatsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Adjust active view if role doesn't have access
  useEffect(() => {
    if (!isAdmin && (activeView === 'dashboard' || activeView === 'members' || activeView === 'invitations' || activeView === 'audit')) {
      setActiveView(isStaff ? 'chat' : 'tasks');
    }
  }, [isAdmin, isStaff, activeView]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08090D] flex flex-col items-center justify-center text-[#A0A8B8] relative overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8B7CFF]/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col items-center">
          <VeylithLogo size="xl" showTagline={false} subBadge="CONTROL" />
          <div className="w-8 h-8 border-2 border-[#8B7CFF] border-t-transparent rounded-full animate-spin mt-6 mb-3" />
          <p className="text-sm font-semibold tracking-wide text-[#F3F5FA] font-display">
            Initializing Veylith Control...
          </p>
          <span className="text-xs text-[#737E91] font-mono mt-1">Everything in sync.</span>
        </div>
      </div>
    );
  }

  // Not authenticated: render Veylith Login & Authentication experience
  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#08090D] flex text-[#F3F5FA] antialiased selection:bg-[#8B7CFF] selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        stats={stats?.metrics}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header */}
        <Header
          setMobileOpen={setMobileOpen}
          stats={stats?.metrics}
          setActiveView={setActiveView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefreshStats={fetchStats}
        />

        {/* View Content Container */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={statsLoading}
              onRefresh={fetchStats}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'tasks' && (
            <TasksView
              searchQuery={searchQuery}
              onStatsUpdated={fetchStats}
            />
          )}

          {activeView === 'submissions' && (
            <SubmissionsView
              searchQuery={searchQuery}
              onStatsUpdated={fetchStats}
            />
          )}

          {(activeView === 'members' || activeView === 'invitations') && (
            <MembersView
              searchQuery={searchQuery}
              onStatsUpdated={fetchStats}
              initialTab={activeView === 'invitations' ? 'invitations' : 'members'}
            />
          )}

          {activeView === 'chat' && (
            <ChatModerationView
              onStatsUpdated={fetchStats}
            />
          )}

          {activeView === 'audit' && (
            <AuditTrailView
              searchQuery={searchQuery}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
