import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  FileCheck2,
  Users,
  Key,
  MessageSquareWarning,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VeylithLogo from './VeylithLogo';

export default function Sidebar({
  activeView,
  setActiveView,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
  stats,
}) {
  const { user, isStaff, isAdmin, isSuperAdmin, isModerator } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      adminOnly: true,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: stats?.activeTasks,
      badgeColor: 'bg-[#8B7CFF]/20 text-[#8B7CFF] border border-[#8B7CFF]/30',
    },
    {
      id: 'submissions',
      label: 'Submissions',
      icon: FileCheck2,
      badge: isStaff ? stats?.pendingSubmissions : null,
      badgeColor: 'bg-[#F2BD69]/20 text-[#F2BD69] border border-[#F2BD69]/30',
    },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      adminOnly: true,
      badge: stats?.totalRegisteredMembers,
      badgeColor: 'bg-[#191F2B] text-[#A0A8B8] border border-[#252C3A]',
    },
    {
      id: 'invitations',
      label: 'Access & Invites',
      icon: Key,
      adminOnly: true,
    },
    {
      id: 'chat',
      label: 'Chat Moderation',
      icon: MessageSquareWarning,
      badge: isStaff ? stats?.pendingFlaggedChatMessages : null,
      badgeColor: 'bg-[#FF6B78]/20 text-[#FF6B78] border border-[#FF6B78]/30',
    },
    {
      id: 'audit',
      label: 'Activity & Audit',
      icon: History,
      adminOnly: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.staffOnly && !isStaff) return false;
    return true;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return { label: 'SUPER ADMIN', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'admin':
        return { label: 'OPERATIONS ADMIN', bg: 'bg-[#8B7CFF]/15 text-[#8B7CFF] border-[#8B7CFF]/30' };
      case 'moderator':
        return { label: 'MODERATOR', bg: 'bg-[#55D6BE]/15 text-[#55D6BE] border-[#55D6BE]/30' };
      default:
        return { label: 'MEMBER', bg: 'bg-slate-800/60 text-[#A0A8B8] border-slate-700' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          role="presentation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[#08090D]/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="Veylith Control Navigation Sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#0D1017] border-r border-[#252C3A] backdrop-blur-xl transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand / Logo Header */}
        <div className="h-18 flex items-center justify-between px-5 border-b border-[#252C3A]">
          <div className="flex items-center gap-3 overflow-hidden">
            {isCollapsed ? (
              <VeylithLogo variant="mark" size="md" />
            ) : (
              <VeylithLogo variant="full" size="md" subBadge="CONTROL" />
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-[#737E91] hover:text-[#F3F5FA] hover:bg-[#191F2B] transition-colors a11y-focus"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Current User Role Header */}
        <div className="px-4 py-3 border-b border-[#252C3A]/80 bg-[#08090D]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#131722] border border-[#252C3A] flex items-center justify-center text-sm font-bold text-[#8B7CFF] shrink-0 font-display">
              {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'V'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#F3F5FA] truncate">
                  {user?.display_name || 'Veylith Operator'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${roleInfo.bg}`}>
                    {roleInfo.label}
                  </span>
                  {user?.points !== undefined && (
                    <span className="text-xs text-[#F2BD69] font-semibold flex items-center gap-0.5 font-mono">
                      <Sparkles className="w-3 h-3" />
                      {user.points} pts
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveView(item.id);
                  setMobileOpen(false);
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all a11y-focus min-h-[44px] ${
                  isActive
                    ? 'bg-[#8B7CFF]/20 text-[#F3F5FA] border border-[#8B7CFF]/40 shadow-sm font-semibold'
                    : 'text-[#A0A8B8] hover:text-[#F3F5FA] hover:bg-[#131722] border border-transparent'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#8B7CFF]' : 'text-[#737E91]'}`}
                  aria-hidden="true"
                />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      item.badgeColor || 'bg-[#191F2B] text-[#A0A8B8]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info / Telemetry */}
        {!isCollapsed && (
          <div className="p-4 border-t border-[#252C3A] bg-[#08090D]/40 text-xs text-[#737E91]">
            <div className="flex items-center justify-between font-medium">
              <span>Telemetry</span>
              <span className="text-[#55D6BE] font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#55D6BE] animate-pulse" />
                In Sync
              </span>
            </div>
            <div className="mt-2 text-[11px] flex items-center justify-between">
              <span>Engine</span>
              <span className="font-mono text-[#A0A8B8]">SQLite WAL</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
