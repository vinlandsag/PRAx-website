import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Sparkles,
  ShieldAlert,
  ArrowRightLeft,
  ChevronDown,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export default function Header({
  setMobileOpen,
  stats,
  setActiveView,
  searchQuery,
  setSearchQuery,
  onRefreshStats,
}) {
  const { user, logout, switchPersona, isStaff, isAdmin, isSuperAdmin } = useAuth();
  const { toastSuccess, toastInfo } = useToast();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePersonaSwitch = async (role) => {
    setSwitching(true);
    try {
      const switchedUser = await switchPersona(role);
      toastSuccess(`Switched persona to ${switchedUser.display_name} (${role.toUpperCase()})`);
      if (onRefreshStats) onRefreshStats();
      if (role === 'member') {
        setActiveView('tasks');
      }
    } catch (err) {
      toastInfo('Persona switch: ' + err.message);
    } finally {
      setSwitching(false);
      setProfileOpen(false);
    }
  };

  const notificationItems = [
    ...(stats?.pendingSubmissions > 0
      ? [
          {
            id: 'notif-sub',
            title: `${stats.pendingSubmissions} Submissions Pending Review`,
            desc: 'Member work awaiting points authorization',
            view: 'submissions',
            icon: Clock,
            color: 'text-[#F2BD69] bg-[#F2BD69]/10 border border-[#F2BD69]/20',
          },
        ]
      : []),
    ...(stats?.pendingFlaggedChatMessages > 0
      ? [
          {
            id: 'notif-mod',
            title: `${stats.pendingFlaggedChatMessages} Flagged Chat Messages`,
            desc: 'Community messages flagged for moderator audit',
            view: 'chat',
            icon: ShieldAlert,
            color: 'text-[#FF6B78] bg-[#FF6B78]/10 border border-[#FF6B78]/20',
          },
        ]
      : []),
    ...(stats?.activeTasks > 0
      ? [
          {
            id: 'notif-tasks',
            title: `${stats.activeTasks} Active Tasks Live`,
            desc: 'Ready for member submissions',
            view: 'tasks',
            icon: CheckCircle2,
            color: 'text-[#55D6BE] bg-[#55D6BE]/10 border border-[#55D6BE]/20',
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-30 h-18 bg-[#08090D]/85 border-b border-[#252C3A] backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation sidebar"
          className="lg:hidden p-2.5 rounded-xl text-[#A0A8B8] hover:text-[#F3F5FA] hover:bg-[#131722] transition-colors a11y-focus min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#252C3A]"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Filter / Search Bar */}
        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-[#737E91] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, members, or telemetry..."
            className="w-full pl-10 pr-4 py-2 bg-[#0D1017] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA] placeholder-[#737E91] focus:outline-none focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF] a11y-focus transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Persona Switcher, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Role Persona Switcher Pill */}
        <div className="relative">
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-[#0D1017] border border-[#252C3A] rounded-xl">
            <span className="text-[11px] font-semibold text-[#737E91] uppercase tracking-wider px-2 flex items-center gap-1 font-mono">
              <ArrowRightLeft className="w-3 h-3 text-[#8B7CFF]" />
              Role:
            </span>
            <button
              type="button"
              onClick={() => handlePersonaSwitch('super_admin')}
              disabled={switching}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all font-mono ${
                user?.role === 'super_admin'
                  ? 'bg-amber-500 text-[#08090D] shadow-sm font-bold'
                  : 'text-[#A0A8B8] hover:text-[#F3F5FA] hover:bg-[#131722]'
              }`}
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => handlePersonaSwitch('admin')}
              disabled={switching}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all font-mono ${
                user?.role === 'admin'
                  ? 'bg-[#8B7CFF] text-white shadow-sm font-bold'
                  : 'text-[#A0A8B8] hover:text-[#F3F5FA] hover:bg-[#131722]'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handlePersonaSwitch('moderator')}
              disabled={switching}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all font-mono ${
                user?.role === 'moderator'
                  ? 'bg-[#55D6BE] text-[#08090D] shadow-sm font-bold'
                  : 'text-[#A0A8B8] hover:text-[#F3F5FA] hover:bg-[#131722]'
              }`}
            >
              Moderator
            </button>
            <button
              type="button"
              onClick={() => handlePersonaSwitch('member')}
              disabled={switching}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all font-mono ${
                user?.role === 'member'
                  ? 'bg-[#F3F5FA] text-[#08090D] shadow-sm font-bold'
                  : 'text-[#A0A8B8] hover:text-[#F3F5FA] hover:bg-[#131722]'
              }`}
            >
              Member
            </button>
          </div>
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label={`View notifications (${notificationItems.length} active alerts)`}
            className="relative p-2.5 rounded-xl text-[#A0A8B8] hover:text-[#F3F5FA] hover:bg-[#131722] transition-colors a11y-focus min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#252C3A]"
          >
            <Bell className="w-5 h-5" />
            {notificationItems.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#8B7CFF] ring-2 ring-[#08090D] animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-4 text-[#F3F5FA] z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#252C3A]">
                <span className="font-semibold text-sm tracking-tight text-[#F3F5FA]">Operations Alerts</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30">
                  {notificationItems.length} active
                </span>
              </div>

              <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                {notificationItems.length === 0 ? (
                  <p className="text-xs text-[#737E91] text-center py-6">All systems normal. No pending actions.</p>
                ) : (
                  notificationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveView(item.view);
                          setNotificationsOpen(false);
                        }}
                        className="w-full text-left p-3 rounded-xl bg-[#131722] hover:bg-[#191F2B] border border-[#252C3A] flex items-start gap-3 transition-colors a11y-focus"
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#F3F5FA] truncate">{item.title}</p>
                          <p className="text-[11px] text-[#A0A8B8] mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Administrator Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="User profile menu"
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-[#252C3A] hover:border-[#8B7CFF]/50 hover:bg-[#131722] transition-all a11y-focus min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B7CFF] to-[#55D6BE] flex items-center justify-center text-xs font-bold text-[#08090D] shadow-sm font-display">
              {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'V'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#F3F5FA] leading-tight truncate max-w-[120px]">
                {user?.display_name || 'Veylith Operator'}
              </span>
              <span className="text-[10px] text-[#737E91] font-mono uppercase">{user?.role?.replace('_', ' ')}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#737E91] shrink-0" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-3 text-[#F3F5FA] z-50 animate-fade-in">
              <div className="p-3 bg-[#131722] rounded-xl border border-[#252C3A] mb-2">
                <p className="text-sm font-semibold text-[#F3F5FA]">{user?.display_name}</p>
                <p className="text-xs text-[#737E91] truncate font-mono">{user?.email}</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-[#A0A8B8] font-medium">Balance</span>
                  <span className="text-[#F2BD69] font-bold flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3" />
                    {user?.points ?? 0} pts
                  </span>
                </div>
              </div>

              {/* Mobile Role Switcher */}
              <div className="md:hidden py-2 border-t border-[#252C3A]">
                <p className="text-[11px] font-semibold text-[#737E91] uppercase tracking-wider mb-1.5 font-mono">Switch Persona</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePersonaSwitch('super_admin')}
                    className="p-1.5 text-xs text-left rounded bg-[#131722] hover:bg-[#191F2B] text-[#A0A8B8] font-mono"
                  >
                    Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonaSwitch('admin')}
                    className="p-1.5 text-xs text-left rounded bg-[#131722] hover:bg-[#191F2B] text-[#A0A8B8] font-mono"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonaSwitch('moderator')}
                    className="p-1.5 text-xs text-left rounded bg-[#131722] hover:bg-[#191F2B] text-[#A0A8B8] font-mono"
                  >
                    Moderator
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePersonaSwitch('member')}
                    className="p-1.5 text-xs text-left rounded bg-[#131722] hover:bg-[#191F2B] text-[#A0A8B8] font-mono"
                  >
                    Member
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="w-full mt-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#FF6B78] hover:bg-[#FF6B78]/10 hover:text-white transition-colors a11y-focus min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                Sign Out / Reset Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
