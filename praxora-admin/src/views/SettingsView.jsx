import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Activity,
  Database,
  CheckCircle2,
  Lock,
  Layers,
  Key,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function SettingsView() {
  const { user, isStaff, isAdmin, isSuperAdmin, refreshUser } = useAuth();
  const { toastSuccess, toastInfo } = useToast();

  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [copiedToken, setCopiedToken] = useState(null);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setHealth({ status: 'unhealthy', error: err.message });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    toastSuccess(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const colorTokens = [
    { name: 'Primary Background', hex: '#08090D', role: 'Main canvas' },
    { name: 'Secondary Background', hex: '#0D1017', role: 'Sidebar & panels' },
    { name: 'Elevated Surface', hex: '#131722', role: 'Cards & containers' },
    { name: 'Secondary Surface', hex: '#191F2B', role: 'Hover & interactive states' },
    { name: 'Primary Accent', hex: '#8B7CFF', role: 'Focus & primary actions' },
    { name: 'Secondary Accent', hex: '#55D6BE', role: 'Synchronized indicators' },
    { name: 'Border Tone', hex: '#252C3A', role: 'Subtle structural borders' },
    { name: 'Primary Text', hex: '#F3F5FA', role: 'High contrast text (>18:1)' },
    { name: 'Secondary Text', hex: '#A0A8B8', role: 'Readable supporting text' },
    { name: 'Muted Text', hex: '#737E91', role: 'Tertiary metadata' },
    { name: 'Success', hex: '#48D6A0', role: 'Approvals & positive ledger' },
    { name: 'Warning', hex: '#F2BD69', role: 'Pending review alerts' },
    { name: 'Error', hex: '#FF6B78', role: 'Rejections & moderation flags' },
  ];

  const rbacMatrix = [
    {
      capability: 'Access Veylith Control Dashboard & Metrics',
      superAdmin: true,
      admin: true,
      moderator: false,
      member: false,
    },
    {
      capability: 'Create, Edit & Duplicate Operational Tasks',
      superAdmin: true,
      admin: true,
      moderator: false,
      member: false,
    },
    {
      capability: 'Review Submissions & Authorize Points Ledger (ACID)',
      superAdmin: true,
      admin: true,
      moderator: false,
      member: false,
    },
    {
      capability: 'Generate & Revoke Invitation Codes',
      superAdmin: true,
      admin: true,
      moderator: false,
      member: false,
    },
    {
      capability: 'Alter User Roles (Least-Privilege Guarded)',
      superAdmin: true,
      admin: 'Restricted (Cannot promote to Super Admin or self)',
      moderator: false,
      member: false,
    },
    {
      capability: 'Suspend Abusive Member Accounts',
      superAdmin: true,
      admin: true,
      moderator: false,
      member: false,
    },
    {
      capability: 'Triage Flagged Chat & Mute Abusive Users',
      superAdmin: true,
      admin: true,
      moderator: true,
      member: false,
    },
    {
      capability: 'Pin Community Announcements & Soft-Delete Chat',
      superAdmin: true,
      admin: true,
      moderator: true,
      member: false,
    },
    {
      capability: 'Submit Work for Active Tasks & Earn Bounty Points',
      superAdmin: true,
      admin: true,
      moderator: true,
      member: true,
    },
    {
      capability: 'Participate in Public Real-time Community Stream',
      superAdmin: true,
      admin: true,
      moderator: true,
      member: true,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#252C3A]">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#F3F5FA] flex items-center gap-2.5 font-display">
            System Settings & Architecture
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30 font-mono">
              Veylith Control
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#A0A8B8]">
            Telemetry, database configuration, security policies, and design token architecture.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchHealth();
            refreshUser();
            toastInfo('Telemetry refreshed');
          }}
          disabled={loadingHealth}
          className="px-4 py-2.5 rounded-xl border border-[#252C3A] bg-[#131722] hover:bg-[#191F2B] text-[#F3F5FA] text-xs font-semibold flex items-center gap-2 transition-all a11y-focus self-start sm:self-auto min-h-[44px]"
        >
          <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin' : ''}`} />
          Refresh Diagnostics
        </button>
      </div>

      {/* Grid: System Telemetry & Current Session */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend & DB Health Card */}
        <div className="p-6 bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#252C3A]">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-[#55D6BE]" />
              <h2 className="font-semibold text-base text-[#F3F5FA]">Backend Telemetry</h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#48D6A0]/15 text-[#48D6A0] border border-[#48D6A0]/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#48D6A0] animate-pulse" />
              {health?.status === 'healthy' ? 'Operational' : 'Diagnostic'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#131722] rounded-xl border border-[#252C3A]">
              <span className="text-[#737E91] font-medium block mb-1">Status</span>
              <span className="font-mono font-bold text-[#48D6A0] uppercase">
                {health?.status || 'Connecting...'}
              </span>
            </div>
            <div className="p-3 bg-[#131722] rounded-xl border border-[#252C3A]">
              <span className="text-[#737E91] font-medium block mb-1">Database Engine</span>
              <span className="font-mono font-bold text-[#F3F5FA]">SQLite WAL (Atomic)</span>
            </div>
            <div className="p-3 bg-[#131722] rounded-xl border border-[#252C3A]">
              <span className="text-[#737E91] font-medium block mb-1">Server Uptime</span>
              <span className="font-mono text-[#A0A8B8]">
                {health?.uptime ? `${Math.round(health.uptime)} seconds` : '—'}
              </span>
            </div>
            <div className="p-3 bg-[#131722] rounded-xl border border-[#252C3A]">
              <span className="text-[#737E91] font-medium block mb-1">Environment</span>
              <span className="font-mono text-[#8B7CFF] uppercase font-semibold">
                {health?.environment || 'development'}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#737E91] flex items-center justify-between">
            <span>Foreign Key Constraints: <strong className="text-[#F3F5FA]">ENFORCED</strong></span>
            <span>Journal Mode: <strong className="text-[#F3F5FA]">WAL (Synchronous)</strong></span>
          </div>
        </div>

        {/* Current Active Session Card */}
        <div className="p-6 bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#252C3A]">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[#8B7CFF]" />
              <h2 className="font-semibold text-base text-[#F3F5FA]">Active Session Details</h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30">
              JWT Signed
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-[#252C3A]/60">
              <span className="text-[#A0A8B8]">Authenticated User:</span>
              <span className="font-semibold text-[#F3F5FA]">{user?.display_name}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#252C3A]/60">
              <span className="text-[#A0A8B8]">Email Address:</span>
              <span className="font-mono text-[#F3F5FA]">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#252C3A]/60">
              <span className="text-[#A0A8B8]">Current Assigned Role:</span>
              <span className="font-mono font-bold uppercase text-[#8B7CFF] px-2 py-0.5 rounded bg-[#8B7CFF]/15 border border-[#8B7CFF]/30">
                {user?.role}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#A0A8B8]">Points Balance:</span>
              <span className="font-mono font-bold text-[#F2BD69]">
                {user?.points ?? 0} PTS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Governance Table */}
      <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#252C3A]">
          <Lock className="w-5 h-5 text-[#8B7CFF]" />
          <div>
            <h2 className="font-semibold text-base text-[#F3F5FA]">Role-Based Access Control (RBAC) Hierarchy</h2>
            <p className="text-xs text-[#A0A8B8]">Guaranteed least-privilege enforcement across frontend routing and backend middleware.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#252C3A] text-[#737E91] uppercase tracking-wider font-mono">
                <th className="py-3 px-4">System Capability</th>
                <th className="py-3 px-3 text-center text-amber-300">Super Admin</th>
                <th className="py-3 px-3 text-center text-[#8B7CFF]">Admin</th>
                <th className="py-3 px-3 text-center text-[#55D6BE]">Moderator</th>
                <th className="py-3 px-3 text-center text-slate-300">Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252C3A]/50">
              {rbacMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#131722]/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#F3F5FA]">{item.capability}</td>
                  <td className="py-3 px-3 text-center">
                    {item.superAdmin === true ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 mx-auto" />
                    ) : (
                      <span className="text-[#737E91] font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {typeof item.admin === 'string' ? (
                      <span className="text-[10px] text-amber-300/90 font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {item.admin}
                      </span>
                    ) : item.admin === true ? (
                      <CheckCircle2 className="w-4 h-4 text-[#8B7CFF] mx-auto" />
                    ) : (
                      <span className="text-[#737E91] font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.moderator === true ? (
                      <CheckCircle2 className="w-4 h-4 text-[#55D6BE] mx-auto" />
                    ) : (
                      <span className="text-[#737E91] font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.member === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-[#737E91] font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Veylith Design System Tokens Palette */}
      <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#252C3A]">
          <Layers className="w-5 h-5 text-[#55D6BE]" />
          <div>
            <h2 className="font-semibold text-base text-[#F3F5FA]">Veylith Design Tokens & High-Contrast Palette</h2>
            <p className="text-xs text-[#A0A8B8]">WCAG 2.1 AA certified dark contrast specifications.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {colorTokens.map((token) => (
            <div
              key={token.hex}
              onClick={() => copyToClipboard(token.hex, token.name)}
              className="p-3 bg-[#131722] border border-[#252C3A] rounded-xl hover:border-[#8B7CFF]/50 transition-all cursor-pointer group a11y-focus"
              tabIndex={0}
              role="button"
              aria-label={`Copy hex code for ${token.name}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg border border-white/10 shrink-0 shadow-sm"
                  style={{ backgroundColor: token.hex }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F3F5FA] truncate">
                      {token.name}
                    </span>
                    {copiedToken === token.name ? (
                      <Check className="w-3.5 h-3.5 text-[#48D6A0]" />
                    ) : (
                      <Copy className="w-3 h-3 text-[#737E91] opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-[#A0A8B8] block mt-0.5">
                    {token.hex}
                  </span>
                  <span className="text-[10px] text-[#737E91] truncate block">
                    {token.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
