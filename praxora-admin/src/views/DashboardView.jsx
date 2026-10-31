import React from 'react';
import {
  Users,
  CheckSquare,
  FileCheck2,
  Sparkles,
  MessageSquareWarning,
  History,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Plus,
  UserPlus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardView({ stats, loading, onRefresh, setActiveView }) {
  const { isStaff, isAdmin, isSuperAdmin } = useAuth();
  const metrics = stats?.metrics;

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-[#131722] rounded-xl w-64 border border-[#252C3A]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-[#0D1017] border border-[#252C3A] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      id: 'members',
      title: 'Registered Members',
      value: metrics?.totalRegisteredMembers ?? 0,
      subtext: `${metrics?.totalUsers ?? 0} total accounts (staff + members)`,
      icon: Users,
      color: 'from-[#8B7CFF]/15 to-[#6355d8]/10 text-[#8B7CFF] border-[#8B7CFF]/20',
      action: () => setActiveView('members'),
    },
    {
      id: 'tasks',
      title: 'Operational Tasks',
      value: metrics?.activeTasks ?? 0,
      subtext: `${metrics?.inactiveTasks ?? 0} inactive · ${metrics?.draftTasks ?? 0} draft`,
      icon: CheckSquare,
      color: 'from-[#55D6BE]/15 to-[#3ebda7]/10 text-[#55D6BE] border-[#55D6BE]/20',
      action: () => setActiveView('tasks'),
    },
    {
      id: 'pending',
      title: 'Pending Submissions',
      value: metrics?.pendingSubmissions ?? 0,
      subtext: 'Awaiting points verification & audit',
      icon: Clock,
      color: 'from-[#F2BD69]/15 to-[#d8a44d]/10 text-[#F2BD69] border-[#F2BD69]/20',
      action: () => setActiveView('submissions'),
      highlight: (metrics?.pendingSubmissions ?? 0) > 0,
    },
    {
      id: 'submissions',
      title: 'Approved Submissions',
      value: metrics?.approvedSubmissions ?? 0,
      subtext: `${metrics?.rejectedSubmissions ?? 0} rejected submissions`,
      icon: FileCheck2,
      color: 'from-[#48D6A0]/15 to-[#38b888]/10 text-[#48D6A0] border-[#48D6A0]/20',
      action: () => setActiveView('submissions'),
    },
    {
      id: 'points',
      title: 'Total Points Awarded',
      value: (metrics?.totalPointsAwarded ?? 0).toLocaleString(),
      subtext: 'Audited reward transactions ledger',
      icon: Sparkles,
      color: 'from-[#F2BD69]/15 to-[#e0a845]/10 text-[#F2BD69] border-[#F2BD69]/20',
      action: () => setActiveView('submissions'),
    },
    {
      id: 'flags',
      title: 'Flagged Messages',
      value: metrics?.flaggedChatMessages ?? 0,
      subtext: `${metrics?.pendingFlaggedChatMessages ?? 0} pending moderator review`,
      icon: MessageSquareWarning,
      color: 'from-[#FF6B78]/15 to-[#e04f5d]/10 text-[#FF6B78] border-[#FF6B78]/20',
      action: () => setActiveView('chat'),
      highlight: (metrics?.pendingFlaggedChatMessages ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#252C3A]">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#F3F5FA] flex items-center gap-2.5 font-display">
            Veylith Control — Operations
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30 font-mono">
              In Sync
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#A0A8B8]">
            Real-time analytics, task governance, member authorizations, and moderation telemetry.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveView('tasks')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#6355d8] hover:from-[#9c90ff] hover:to-[#7466e3] text-white text-xs font-semibold shadow-lg shadow-[#8B7CFF]/20 flex items-center gap-2 transition-all a11y-focus min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
            <button
              type="button"
              onClick={() => setActiveView('invitations')}
              className="px-4 py-2.5 rounded-xl border border-[#252C3A] bg-[#0D1017] hover:bg-[#131722] text-[#F3F5FA] text-xs font-semibold flex items-center gap-2 transition-all a11y-focus min-h-[44px]"
            >
              <UserPlus className="w-4 h-4 text-[#55D6BE]" />
              Invite Member
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.action}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') card.action();
              }}
              className={`group relative p-6 bg-[#0D1017] border rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-[#8B7CFF]/50 a11y-focus overflow-hidden ${
                card.highlight ? 'border-[#F2BD69]/40 ring-1 ring-[#F2BD69]/20' : 'border-[#252C3A]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-[#A0A8B8] uppercase font-mono">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-display font-bold text-[#F3F5FA] tracking-tight">
                  {card.value}
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#737E91] group-hover:text-[#F3F5FA] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <p className="mt-2 text-xs text-[#737E91] font-medium">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Administrative Activity & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Stream (2 cols) */}
        <div className="lg:col-span-2 bg-[#0D1017] border border-[#252C3A] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#252C3A]">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#8B7CFF]" />
              <h2 className="font-semibold text-base text-[#F3F5FA]">Recent Operational Activity</h2>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveView('audit')}
                className="text-xs font-semibold text-[#8B7CFF] hover:text-[#55D6BE] transition-colors font-mono"
              >
                View Full Audit Trail &rarr;
              </button>
            )}
          </div>

          <div className="mt-4 divide-y divide-[#252C3A]/60 max-h-96 overflow-y-auto">
            {stats?.recentActivity?.length === 0 ? (
              <p className="text-sm text-[#737E91] text-center py-8">No recent activity logged.</p>
            ) : (
              stats?.recentActivity?.map((act) => {
                let badgeColor = 'bg-[#131722] text-[#A0A8B8] border-[#252C3A]';
                if (act.action.includes('APPROVED')) badgeColor = 'bg-[#48D6A0]/15 text-[#48D6A0] border-[#48D6A0]/30';
                if (act.action.includes('REJECTED') || act.action.includes('SUSPENDED'))
                  badgeColor = 'bg-[#FF6B78]/15 text-[#FF6B78] border-[#FF6B78]/30';
                if (act.action.includes('TASK')) badgeColor = 'bg-[#8B7CFF]/15 text-[#8B7CFF] border-[#8B7CFF]/30';
                if (act.action.includes('MUTED')) badgeColor = 'bg-[#F2BD69]/15 text-[#F2BD69] border-[#F2BD69]/30';

                return (
                  <div key={act.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {act.action}
                        </span>
                        <span className="text-xs font-semibold text-[#A0A8B8]">
                          by {act.display_name || 'System Operator'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#F3F5FA] leading-relaxed truncate">{act.details}</p>
                    </div>
                    <span className="text-[11px] text-[#737E91] font-mono shrink-0 whitespace-nowrap">
                      {new Date(act.created_at).toLocaleDateString()} {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Categories & Submissions Breakdown (1 col) */}
        <div className="space-y-6">
          {/* Submissions Ratio */}
          <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-sm text-[#F3F5FA] flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#55D6BE]" />
              Submission Review Status
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-[#A0A8B8] font-medium mb-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#48D6A0]" />
                    Approved
                  </span>
                  <span className="font-bold text-[#F3F5FA] font-mono">{metrics?.approvedSubmissions ?? 0}</span>
                </div>
                <div className="w-full h-2 bg-[#131722] rounded-full overflow-hidden border border-[#252C3A]/50">
                  <div
                    className="h-full bg-[#48D6A0] rounded-full"
                    style={{
                      width: `${
                        metrics?.totalSubmissions
                          ? Math.round((metrics.approvedSubmissions / metrics.totalSubmissions) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-[#A0A8B8] font-medium mb-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#F2BD69]" />
                    Pending Review
                  </span>
                  <span className="font-bold text-[#F3F5FA] font-mono">{metrics?.pendingSubmissions ?? 0}</span>
                </div>
                <div className="w-full h-2 bg-[#131722] rounded-full overflow-hidden border border-[#252C3A]/50">
                  <div
                    className="h-full bg-[#F2BD69] rounded-full"
                    style={{
                      width: `${
                        metrics?.totalSubmissions
                          ? Math.round((metrics.pendingSubmissions / metrics.totalSubmissions) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-[#A0A8B8] font-medium mb-1">
                  <span className="flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-[#FF6B78]" />
                    Rejected
                  </span>
                  <span className="font-bold text-[#F3F5FA] font-mono">{metrics?.rejectedSubmissions ?? 0}</span>
                </div>
                <div className="w-full h-2 bg-[#131722] rounded-full overflow-hidden border border-[#252C3A]/50">
                  <div
                    className="h-full bg-[#FF6B78] rounded-full"
                    style={{
                      width: `${
                        metrics?.totalSubmissions
                          ? Math.round((metrics.rejectedSubmissions / metrics.totalSubmissions) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Task Categories */}
          <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-sm text-[#F3F5FA] mb-3">Task Governance Categories</h3>
            <div className="flex flex-wrap gap-2">
              {stats?.categoryStats?.map((cat) => (
                <span
                  key={cat.category}
                  className="px-3 py-1.5 rounded-xl bg-[#131722] border border-[#252C3A] text-xs font-medium text-[#A0A8B8] flex items-center gap-2"
                >
                  {cat.category}
                  <span className="px-1.5 py-0.2 rounded-full bg-[#191F2B] text-[10px] text-[#F3F5FA] font-mono font-semibold">
                    {cat.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
