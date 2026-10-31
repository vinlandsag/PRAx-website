import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Key,
  Copy,
  Check,
  Plus,
  Search,
  Filter,
  Sparkles,
  Calendar,
  AlertTriangle,
  History,
  FileCheck2,
  X,
  Lock,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';

export default function MembersView({ searchQuery, onStatsUpdated, initialTab = 'members' }) {
  const { user: currentUser, isStaff, isAdmin, isSuperAdmin } = useAuth();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Tab: Members or Invitations
  const [activeTab, setActiveTab] = useState(initialTab || 'members');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Profile Drawer
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Role Change Modal
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('member');
  const [roleUpdating, setRoleUpdating] = useState(false);

  // Invitation Generator Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    role: 'member',
    maxUses: 10,
    expiresAt: '',
    customCode: '',
  });
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: false,
  });

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMembers({
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setMembers(res.members);
      setPagination(res.pagination);
    } catch (err) {
      toastError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, pagination.page, pagination.limit, toastError]);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await api.getInvitations();
      setInvitations(res.invitations);
    } catch (err) {
      console.warn('Failed to load invitations:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers();
    } else {
      fetchInvitations();
    }
  }, [activeTab, fetchMembers, fetchInvitations]);

  const openProfileDrawer = async (member) => {
    setSelectedProfile(member);
    setLoadingProfile(true);
    try {
      const res = await api.getMemberProfile(member.id);
      setProfileData(res);
    } catch (err) {
      toastError(err.message || 'Failed to load member profile history');
    } finally {
      setLoadingProfile(false);
    }
  };

  const openRoleChangeModal = (member) => {
    setRoleModalUser(member);
    setSelectedNewRole(member.role);
  };

  const handleRoleChangeSubmit = async (e) => {
    e.preventDefault();
    if (!roleModalUser) return;

    if (roleModalUser.id === currentUser.id) {
      toastError('Self-escalation guard: you cannot change your own role.');
      return;
    }

    if (!isSuperAdmin && ['admin', 'super_admin'].includes(selectedNewRole)) {
      toastError('Only Super Admins can promote users to Admin or Super Admin.');
      return;
    }

    setRoleUpdating(true);
    try {
      const res = await api.updateMemberRole(roleModalUser.id, selectedNewRole);
      toastSuccess(`Role updated to "${selectedNewRole}" for ${roleModalUser.display_name}.`);
      setRoleModalUser(null);
      fetchMembers();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      toastError(err.message || 'Failed to update member role');
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleToggleStatus = (member) => {
    const isSuspending = member.status === 'active';
    const actionLabel = isSuspending ? 'Suspend Account' : 'Reactivate Account';

    setConfirmModal({
      isOpen: true,
      title: `${actionLabel}: ${member.display_name}`,
      message: isSuspending
        ? `Suspending this account will immediately revoke login sessions, submission rights, and public chat messaging. Proceed?`
        : `Reactivating this account will restore full access to task submissions and chat. Proceed?`,
      isDestructive: isSuspending,
      onConfirm: async () => {
        try {
          const newStatus = isSuspending ? 'suspended' : 'active';
          await api.updateMemberStatus(member.id, newStatus);
          toastSuccess(`Member account marked as ${newStatus}.`);
          setConfirmModal({ isOpen: false });
          fetchMembers();
          if (onStatsUpdated) onStatsUpdated();
        } catch (err) {
          toastError(err.message || 'Failed to alter member account status');
        }
      },
      onCancel: () => setConfirmModal({ isOpen: false }),
    });
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    setGeneratingInvite(true);
    try {
      const res = await api.createInvitation({
        role: inviteForm.role,
        maxUses: parseInt(inviteForm.maxUses, 10) || 1,
        expiresAt: inviteForm.expiresAt || null,
        code: inviteForm.customCode.trim() || undefined,
      });
      toastSuccess(`Invitation code generated: ${res.invitation.code}`);
      setInviteModalOpen(false);
      setInviteForm({
        role: 'member',
        maxUses: 10,
        expiresAt: '',
        customCode: '',
      });
      fetchInvitations();
    } catch (err) {
      toastError(err.message || 'Failed to generate invitation code');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleRevokeInvitation = (inv) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Invitation Code',
      message: `Revoking code "${inv.code}" will permanently invalidate it for any future registrations.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.revokeInvitation(inv.id);
          toastSuccess(`Invitation "${inv.code}" revoked.`);
          setConfirmModal({ isOpen: false });
          fetchInvitations();
        } catch (err) {
          toastError(err.message || 'Failed to revoke invitation');
        }
      },
      onCancel: () => setConfirmModal({ isOpen: false }),
    });
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toastSuccess(`Code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#252C3A]">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#F3F5FA] flex items-center gap-2.5 font-display">
            Members & Access Governance
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#131722] text-[#A0A8B8] border border-[#252C3A]">
              {pagination.total} Accounts
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#A0A8B8]">
            Role-based access control, privilege audits, account lifecycle, and invitation provisioning.
          </p>
        </div>

        {/* Tab Toggle & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-[#0D1017] border border-[#252C3A] rounded-xl font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'members' ? 'bg-[#8B7CFF] text-white shadow-sm' : 'text-[#737E91] hover:text-[#F3F5FA]'
              }`}
            >
              Member Directory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invitations')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'invitations' ? 'bg-[#8B7CFF] text-white shadow-sm' : 'text-[#737E91] hover:text-[#F3F5FA]'
              }`}
            >
              Invitation Codes
            </button>
          </div>

          {activeTab === 'invitations' && isAdmin && (
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#6355d8] hover:from-[#9c90ff] hover:to-[#7466e3] text-white text-xs font-semibold shadow-md shadow-[#8B7CFF]/20 flex items-center gap-1.5 min-h-[40px] a11y-focus"
            >
              <Plus className="w-4 h-4" />
              Generate Code
            </button>
          )}
        </div>
      </div>

      {activeTab === 'members' ? (
        <>
          {/* Member Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0D1017] p-4 rounded-2xl border border-[#252C3A] max-w-lg">
            <div>
              <label htmlFor="member-role-filter" className="block text-[11px] font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
                Filter Role
              </label>
              <select
                id="member-role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF]"
              >
                <option value="">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Operations Admin</option>
                <option value="moderator">Moderator</option>
                <option value="member">Member</option>
              </select>
            </div>

            <div>
              <label htmlFor="member-status-filter" className="block text-[11px] font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
                Account Status
              </label>
              <select
                id="member-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF]"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-[#737E91]">Loading directory...</div>
            ) : members.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-[#737E91] mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#A0A8B8]">No members found</h3>
                <p className="text-xs text-[#737E91] mt-1">Adjust search filters to view member accounts.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#A0A8B8]">
                  <thead className="bg-[#08090D] text-[11px] font-semibold text-[#737E91] uppercase tracking-wider border-b border-[#252C3A] font-mono">
                    <tr>
                      <th scope="col" className="px-5 py-4">User</th>
                      <th scope="col" className="px-4 py-4">Role</th>
                      <th scope="col" className="px-4 py-4">Status</th>
                      <th scope="col" className="px-4 py-4">Points</th>
                      <th scope="col" className="px-4 py-4">Submissions</th>
                      <th scope="col" className="px-4 py-4">Joined</th>
                      <th scope="col" className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252C3A]/60">
                    {members.map((member) => {
                      let roleBadge = 'bg-[#131722] text-[#A0A8B8] border-[#252C3A]';
                      if (member.role === 'super_admin') roleBadge = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                      if (member.role === 'admin') roleBadge = 'bg-[#8B7CFF]/15 text-[#8B7CFF] border-[#8B7CFF]/30';
                      if (member.role === 'moderator') roleBadge = 'bg-[#55D6BE]/15 text-[#55D6BE] border-[#55D6BE]/30';

                      const isSuspended = member.status === 'suspended';

                      return (
                        <tr key={member.id} className="hover:bg-[#131722]/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#131722] border border-[#252C3A] flex items-center justify-center font-bold text-xs text-[#8B7CFF] shrink-0 font-display">
                                {member.display_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-[#F3F5FA] truncate flex items-center gap-1.5 font-display">
                                  {member.display_name}
                                  {member.id === currentUser.id && (
                                    <span className="text-[10px] bg-[#131722] text-[#8B7CFF] px-1.5 py-0.2 rounded border border-[#8B7CFF]/30 font-mono">
                                      (You)
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#737E91] truncate font-mono">{member.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${roleBadge}`}>
                              {member.role.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                                isSuspended
                                  ? 'bg-[#FF6B78]/15 text-[#FF6B78] border border-[#FF6B78]/30'
                                  : 'bg-[#48D6A0]/15 text-[#48D6A0] border border-[#48D6A0]/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-[#FF6B78]' : 'bg-[#48D6A0]'}`} />
                              {member.status}
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-[#F2BD69] flex items-center gap-1 font-mono">
                              <Sparkles className="w-3.5 h-3.5" />
                              {member.points} pts
                            </span>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-xs text-[#737E91] font-mono">
                            <span className="text-[#F3F5FA] font-semibold">{member.approved_submissions || 0}</span> approved /{' '}
                            {member.total_submissions || 0} total
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap text-xs text-[#737E91] font-mono">
                            {new Date(member.created_at).toLocaleDateString()}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Profile Activity */}
                              <button
                                type="button"
                                onClick={() => openProfileDrawer(member)}
                                title="Inspect Profile & Audit"
                                className="px-2.5 py-1.5 rounded-lg border border-[#252C3A] bg-[#131722] hover:bg-[#191F2B] text-xs text-[#A0A8B8] hover:text-[#F3F5FA] transition-colors a11y-focus"
                              >
                                Profile
                              </button>

                              {/* Change Role */}
                              {isAdmin && member.id !== currentUser.id && (
                                <button
                                  type="button"
                                  onClick={() => openRoleChangeModal(member)}
                                  title="Change Role Permissions"
                                  className="px-2.5 py-1.5 rounded-lg border border-[#252C3A] bg-[#131722] hover:bg-[#8B7CFF]/15 text-xs text-[#8B7CFF] hover:border-[#8B7CFF]/40 transition-colors a11y-focus"
                                >
                                  Role
                                </button>
                              )}

                              {/* Suspend / Reactivate */}
                              {isAdmin && member.id !== currentUser.id && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(member)}
                                  title={isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                                  className={`p-1.5 rounded-lg border transition-colors a11y-focus ${
                                    isSuspended
                                      ? 'border-[#48D6A0]/40 text-[#48D6A0] hover:bg-[#48D6A0]/20'
                                      : 'border-[#252C3A] text-[#737E91] hover:text-[#FF6B78] hover:bg-[#131722]'
                                  }`}
                                >
                                  {isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* INVITATION CODES TAB */
        <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#252C3A] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#F3F5FA] tracking-tight flex items-center gap-2 font-display">
                <Key className="w-4 h-4 text-[#8B7CFF]" />
                Active Registration Invitation Codes
              </h2>
              <p className="text-xs text-[#A0A8B8] mt-0.5">
                Manage restricted onboarding tokens with custom role assignments and usage caps.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#252C3A]/60">
            {invitations.length === 0 ? (
              <p className="text-xs text-[#737E91] text-center py-8">No invitation codes generated yet.</p>
            ) : (
              invitations.map((inv) => {
                let statusBadge = 'bg-[#48D6A0]/15 text-[#48D6A0] border-[#48D6A0]/30';
                if (inv.status === 'revoked') statusBadge = 'bg-[#FF6B78]/15 text-[#FF6B78] border-[#FF6B78]/30';
                if (inv.status === 'expired') statusBadge = 'bg-[#F2BD69]/15 text-[#F2BD69] border-[#F2BD69]/30';

                return (
                  <div key={inv.id} className="p-4 hover:bg-[#131722]/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#131722] border border-[#252C3A] font-mono text-sm font-bold text-[#8B7CFF] flex items-center gap-2">
                        <span>{inv.code}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(inv.code)}
                          title="Copy Invitation Code"
                          className="p-1 hover:text-white rounded hover:bg-[#191F2B] text-[#737E91] transition-colors a11y-focus"
                        >
                          {copiedCode === inv.code ? (
                            <Check className="w-3.5 h-3.5 text-[#48D6A0]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#F3F5FA] capitalize font-mono">
                            Role: {inv.role.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 rounded-full border ${statusBadge}`}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#A0A8B8] mt-0.5 font-mono">
                          Used: <span className="text-[#F3F5FA] font-semibold">{inv.uses_count}</span> / {inv.max_uses} max uses
                          {inv.expires_at && ` · Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>

                    {isAdmin && inv.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleRevokeInvitation(inv)}
                        className="px-3 py-1.5 rounded-lg border border-[#FF6B78]/30 bg-[#FF6B78]/10 hover:bg-[#FF6B78]/20 text-[#FF6B78] text-xs font-semibold a11y-focus"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MEMBER PROFILE DRAWER */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#08090D]/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl h-full bg-[#0D1017] border-l border-[#252C3A] shadow-2xl p-6 text-[#F3F5FA] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#252C3A]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#8B7CFF] to-[#55D6BE] flex items-center justify-center text-lg font-bold text-[#08090D] shadow-md font-display">
                  {selectedProfile.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#F3F5FA] font-display">{selectedProfile.display_name}</h2>
                  <p className="text-xs text-[#737E91] font-mono">{selectedProfile.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="p-2 text-[#737E91] hover:text-[#F3F5FA] rounded-lg hover:bg-[#131722] a11y-focus"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingProfile ? (
              <p className="text-xs text-[#737E91] text-center py-12">Loading activity history...</p>
            ) : profileData ? (
              <div className="py-6 space-y-6">
                {/* Account Summary Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#131722] rounded-xl border border-[#252C3A]">
                    <span className="text-[11px] font-semibold text-[#737E91] uppercase font-mono">Points Balance</span>
                    <p className="text-xl font-bold text-[#F2BD69] flex items-center gap-1 mt-1 font-mono">
                      <Sparkles className="w-4 h-4" />
                      {profileData.user.points} pts
                    </p>
                  </div>
                  <div className="p-3 bg-[#131722] rounded-xl border border-[#252C3A]">
                    <span className="text-[11px] font-semibold text-[#737E91] uppercase font-mono">Assigned Role</span>
                    <p className="text-base font-bold text-[#8B7CFF] mt-1 capitalize font-mono">
                      {profileData.user.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Submissions List */}
                <div>
                  <h3 className="text-xs font-bold text-[#A0A8B8] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                    <FileCheck2 className="w-4 h-4 text-[#8B7CFF]" />
                    Completed & Submitted Tasks ({profileData.submissions.length})
                  </h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {profileData.submissions.length === 0 ? (
                      <p className="text-xs text-[#737E91] py-3 text-center">No submissions yet.</p>
                    ) : (
                      profileData.submissions.map((s) => (
                        <div key={s.id} className="p-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-xs">
                          <div className="flex justify-between font-semibold text-[#F3F5FA]">
                            <span>{s.task_title}</span>
                            <span className="text-[#F2BD69] font-mono">+{s.reward_points} pts</span>
                          </div>
                          <div className="flex justify-between text-[#737E91] mt-1 text-[11px] font-mono">
                            <span className="capitalize">{s.status}</span>
                            <span>{new Date(s.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Audit & Point Transaction History */}
                <div>
                  <h3 className="text-xs font-bold text-[#A0A8B8] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                    <History className="w-4 h-4 text-[#48D6A0]" />
                    Point Ledger Audit Trail
                  </h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {profileData.pointTransactions.length === 0 ? (
                      <p className="text-xs text-[#737E91] py-3 text-center">No transactions recorded.</p>
                    ) : (
                      profileData.pointTransactions.map((tx) => (
                        <div key={tx.id} className="p-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-xs flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-[#F3F5FA]">{tx.note}</p>
                            <p className="text-[10px] text-[#737E91] font-mono">{new Date(tx.created_at).toLocaleString()}</p>
                          </div>
                          <span className="font-bold text-[#48D6A0] font-mono">+{tx.points} pts</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090D]/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-6 text-[#F3F5FA]">
            <h2 className="text-lg font-bold tracking-tight text-[#F3F5FA] mb-1 font-display">
              Modify Member Role
            </h2>
            <p className="text-xs text-[#A0A8B8] mb-4">
              Reassign permissions for <strong className="text-[#F3F5FA]">{roleModalUser.display_name}</strong>.
            </p>

            <form onSubmit={handleRoleChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A0A8B8] mb-2 font-mono">
                  Select Role Assignment
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'member', label: 'Member', desc: 'Standard member: browse tasks, submit work, chat.' },
                    { id: 'moderator', label: 'Moderator', desc: 'Review flagged messages, mute users, delete content.' },
                    { id: 'admin', label: 'Operations Admin', desc: 'Manage tasks, review submissions, issue points, invites.', superOnly: true },
                    { id: 'super_admin', label: 'Super Admin', desc: 'Full administrative access and user role controls.', superOnly: true },
                  ].map((r) => {
                    const disabled = r.superOnly && !isSuperAdmin;
                    return (
                      <label
                        key={r.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedNewRole === r.id
                            ? 'bg-[#8B7CFF]/15 border-[#8B7CFF]'
                            : 'bg-[#131722] border-[#252C3A]'
                        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.id}
                          disabled={disabled}
                          checked={selectedNewRole === r.id}
                          onChange={(e) => setSelectedNewRole(e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-xs font-bold text-[#F3F5FA] flex items-center gap-1.5 font-mono">
                            {r.label}
                            {r.superOnly && <Lock className="w-3 h-3 text-[#F2BD69]" />}
                          </div>
                          <p className="text-[11px] text-[#A0A8B8]">{r.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#252C3A]">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  disabled={roleUpdating}
                  className="px-4 py-2 rounded-xl border border-[#252C3A] bg-[#131722] text-xs text-[#A0A8B8] hover:text-[#F3F5FA] a11y-focus"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleUpdating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#6355d8] hover:from-[#9c90ff] hover:to-[#7466e3] text-white text-xs font-semibold shadow-md shadow-[#8B7CFF]/20 a11y-focus"
                >
                  {roleUpdating ? 'Updating...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE INVITATION MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090D]/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-6 text-[#F3F5FA]">
            <h2 className="text-lg font-bold tracking-tight text-[#F3F5FA] mb-1 font-display">
              Generate Registration Invitation
            </h2>
            <p className="text-xs text-[#A0A8B8] mb-4">
              Create an onboarding token with assigned role and redemption limits.
            </p>

            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div>
                <label htmlFor="invite-role" className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Assigned Role Upon Registration
                </label>
                <select
                  id="invite-role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA]"
                >
                  <option value="member">Member</option>
                  <option value="moderator">Moderator</option>
                  {isSuperAdmin && <option value="admin">Operations Admin</option>}
                  {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                </select>
              </div>

              <div>
                <label htmlFor="invite-uses" className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Maximum Uses Limit
                </label>
                <input
                  id="invite-uses"
                  type="number"
                  min="1"
                  max="1000"
                  value={inviteForm.maxUses}
                  onChange={(e) => setInviteForm({ ...inviteForm, maxUses: e.target.value })}
                  className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] font-mono"
                />
              </div>

              <div>
                <label htmlFor="invite-expiry" className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Expiration Date (Optional)
                </label>
                <input
                  id="invite-expiry"
                  type="date"
                  value={inviteForm.expiresAt}
                  onChange={(e) => setInviteForm({ ...inviteForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] font-mono"
                />
              </div>

              <div>
                <label htmlFor="custom-code" className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Custom Code (Optional, leave blank to auto-generate)
                </label>
                <input
                  id="custom-code"
                  type="text"
                  placeholder="e.g. VEYLITH-VIP-2026"
                  value={inviteForm.customCode}
                  onChange={(e) => setInviteForm({ ...inviteForm, customCode: e.target.value })}
                  className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] uppercase font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#252C3A]">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  disabled={generatingInvite}
                  className="px-4 py-2 rounded-xl border border-[#252C3A] bg-[#131722] text-xs text-[#A0A8B8] hover:text-[#F3F5FA] a11y-focus"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingInvite}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#6355d8] hover:from-[#9c90ff] hover:to-[#7466e3] text-white text-xs font-semibold shadow-md shadow-[#8B7CFF]/20 a11y-focus"
                >
                  {generatingInvite ? 'Generating...' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
}
