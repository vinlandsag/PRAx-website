import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquareWarning,
  MessageSquare,
  ShieldAlert,
  Send,
  Flag,
  Pin,
  Trash2,
  VolumeX,
  Volume2,
  CheckCircle2,
  XCircle,
  Filter,
  History,
  AlertTriangle,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';

export default function ChatModerationView({ onStatsUpdated }) {
  const { user: currentUser, isStaff, isAdmin, isModerator } = useAuth();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [activeTab, setActiveTab] = useState(isStaff ? 'moderation' : 'chat');

  // Live Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [mutedUntil, setMutedUntil] = useState(null);
  const messagesEndRef = useRef(null);

  // Moderation state
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [flaggedPagination, setFlaggedPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [loadingFlags, setLoadingFlags] = useState(false);

  // Modals
  const [flagModalMessage, setFlagModalMessage] = useState(null);
  const [flagReason, setFlagReason] = useState('Spam');
  const [flagDetails, setFlagDetails] = useState('');
  const [flagging, setFlagging] = useState(false);

  // Mute Modal
  const [muteModalUser, setMuteModalUser] = useState(null);
  const [muteDuration, setMuteDuration] = useState(60);
  const [muteReason, setMuteReason] = useState('Violation of community chat guidelines');
  const [muting, setMuting] = useState(false);

  // Review Flag Modal
  const [reviewModalFlag, setReviewModalFlag] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('action_taken');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [updatingFlag, setUpdatingFlag] = useState(false);

  // Moderation History
  const [moderationHistory, setModerationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: false,
  });

  const fetchChatMessages = useCallback(async () => {
    try {
      const res = await api.getChatMessages();
      setMessages(res.messages);
      setIsMuted(res.currentUserMuted);
      setMutedUntil(res.mutedUntil);
    } catch (err) {
      console.warn('Failed to fetch chat messages:', err);
    }
  }, []);

  const fetchFlaggedItems = useCallback(async () => {
    if (!isStaff) return;
    setLoadingFlags(true);
    try {
      const res = await api.getFlaggedMessages({
        status: statusFilter,
        reason: reasonFilter,
        page: flaggedPagination.page,
        limit: flaggedPagination.limit,
      });
      setFlaggedItems(res.flaggedItems);
      setFlaggedPagination(res.pagination);
    } catch (err) {
      toastError(err.message || 'Failed to fetch flagged items');
    } finally {
      setLoadingFlags(false);
    }
  }, [isStaff, statusFilter, reasonFilter, flaggedPagination.page, flaggedPagination.limit, toastError]);

  const fetchHistory = useCallback(async () => {
    if (!isStaff) return;
    try {
      const res = await api.getModerationHistory();
      setModerationHistory(res.history);
    } catch (err) {
      console.warn('Failed to load moderation history:', err);
    }
  }, [isStaff]);

  useEffect(() => {
    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchChatMessages]);

  useEffect(() => {
    if (activeTab === 'moderation') {
      fetchFlaggedItems();
    }
  }, [activeTab, fetchFlaggedItems]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      await api.sendChatMessage(newMessage.trim());
      setNewMessage('');
      fetchChatMessages();
    } catch (err) {
      toastError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagModalMessage) return;

    setFlagging(true);
    try {
      await api.flagChatMessage(flagModalMessage.id, {
        reason: flagReason,
        details: flagDetails,
      });
      toastSuccess('Message reported to community moderators.');
      setFlagModalMessage(null);
      setFlagDetails('');
      if (activeTab === 'moderation') fetchFlaggedItems();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      toastError(err.message || 'Failed to flag message');
    } finally {
      setFlagging(false);
    }
  };

  const handleReviewFlag = async (e) => {
    e.preventDefault();
    if (!reviewModalFlag) return;

    setUpdatingFlag(true);
    try {
      await api.reviewFlaggedMessage(reviewModalFlag.id, {
        status: reviewStatus,
        moderatorNotes,
      });
      toastSuccess(`Flagged report marked as "${reviewStatus}".`);
      setReviewModalFlag(null);
      fetchFlaggedItems();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      toastError(err.message || 'Failed to update flag status');
    } finally {
      setUpdatingFlag(false);
    }
  };

  const handleDeleteMessage = (messageId, messageSnippet) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Chat Message',
      message: `Permanently delete this message from the public chat stream? Action will be recorded in audit logs.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.deleteChatMessage(messageId);
          toastSuccess('Message removed from public chat.');
          setConfirmModal({ isOpen: false });
          fetchChatMessages();
          if (activeTab === 'moderation') fetchFlaggedItems();
          if (onStatsUpdated) onStatsUpdated();
        } catch (err) {
          toastError(err.message || 'Failed to delete message');
        }
      },
      onCancel: () => setConfirmModal({ isOpen: false }),
    });
  };

  const handleTogglePin = async (messageId) => {
    try {
      const res = await api.togglePinChatMessage(messageId);
      toastSuccess(res.message);
      fetchChatMessages();
    } catch (err) {
      toastError(err.message || 'Failed to update pin status');
    }
  };

  const handleMuteSubmit = async (e) => {
    e.preventDefault();
    if (!muteModalUser) return;

    setMuting(true);
    try {
      const res = await api.muteUser({
        userId: muteModalUser.id,
        durationMinutes: muteDuration,
        reason: muteReason,
      });
      toastSuccess(res.message);
      setMuteModalUser(null);
      if (activeTab === 'moderation') fetchFlaggedItems();
      fetchChatMessages();
    } catch (err) {
      toastError(err.message || 'Failed to mute user');
    } finally {
      setMuting(false);
    }
  };

  const handleUnmute = async (userId, displayName) => {
    try {
      const res = await api.unmuteUser(userId);
      toastSuccess(res.message);
      if (activeTab === 'moderation') fetchFlaggedItems();
      fetchChatMessages();
    } catch (err) {
      toastError(err.message || 'Failed to unmute user');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#252C3A]">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#F3F5FA] flex items-center gap-2.5 font-display">
            Chat Moderation & Community Safety
            {isStaff && flaggedPagination.total > 0 && (
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#FF6B78]/15 text-[#FF6B78] border border-[#FF6B78]/30">
                {flaggedPagination.total} Flagged
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-[#A0A8B8]">
            Real-time chat feed, reported content triage, user mutes, and pinned community announcements.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          {isStaff && (
            <div className="flex items-center p-1 bg-[#0D1017] border border-[#252C3A] rounded-xl font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('moderation')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'moderation' ? 'bg-[#8B7CFF] text-white shadow-sm' : 'text-[#737E91] hover:text-[#F3F5FA]'
                }`}
              >
                Moderation Queue
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'chat' ? 'bg-[#8B7CFF] text-white shadow-sm' : 'text-[#737E91] hover:text-[#F3F5FA]'
                }`}
              >
                Live Chat Stream
              </button>
            </div>
          )}

          {isStaff && activeTab === 'moderation' && (
            <button
              type="button"
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) fetchHistory();
              }}
              className="px-3 py-1.5 rounded-xl border border-[#252C3A] bg-[#0D1017] text-[#A0A8B8] hover:text-[#F3F5FA] text-xs font-semibold flex items-center gap-1.5 font-mono a11y-focus"
            >
              <History className="w-3.5 h-3.5 text-[#55D6BE]" />
              {showHistory ? 'Hide History' : 'Moderation Log'}
            </button>
          )}
        </div>
      </div>

      {/* MODERATION QUEUE VIEW */}
      {isStaff && activeTab === 'moderation' ? (
        <div className="space-y-6">
          {/* Moderation History Audit Tray */}
          {showHistory && (
            <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl p-5 shadow-sm animate-fade-in">
              <h2 className="text-sm font-bold text-[#F3F5FA] mb-3 flex items-center gap-2 font-display">
                <History className="w-4 h-4 text-[#8B7CFF]" />
                Recent Moderation Actions Audit Record
              </h2>
              <div className="divide-y divide-[#252C3A]/60 max-h-60 overflow-y-auto">
                {moderationHistory.length === 0 ? (
                  <p className="text-xs text-[#737E91] py-4 text-center">No recent moderation actions recorded.</p>
                ) : (
                  moderationHistory.map((h) => (
                    <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[#F3F5FA] font-mono">{h.action}</span> by{' '}
                        <span className="text-[#8B7CFF] font-medium">{h.moderator_name}</span> ({h.moderator_role})
                        <p className="text-[11px] text-[#A0A8B8] mt-0.5">{h.details}</p>
                      </div>
                      <span className="text-[11px] text-[#737E91] font-mono whitespace-nowrap">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0D1017] p-4 rounded-2xl border border-[#252C3A] max-w-lg">
            <div>
              <label htmlFor="flag-status-filter" className="block text-[11px] font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
                Moderation Status
              </label>
              <select
                id="flag-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF]"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="action_taken">Action Taken</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div>
              <label htmlFor="flag-reason-filter" className="block text-[11px] font-semibold text-[#737E91] uppercase tracking-wider mb-1 font-mono">
                Flag Reason
              </label>
              <select
                id="flag-reason-filter"
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF]"
              >
                <option value="">All Reasons</option>
                <option value="Spam">Spam</option>
                <option value="Harassment">Harassment</option>
                <option value="Inappropriate">Inappropriate</option>
                <option value="Off-topic">Off-topic</option>
                <option value="Malicious Link">Malicious Link</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Flagged Items List */}
          <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl overflow-hidden shadow-sm">
            {loadingFlags ? (
              <div className="p-8 text-center text-[#737E91]">Loading flagged reports...</div>
            ) : flaggedItems.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#48D6A0] mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#A0A8B8]">Clean Moderation Queue</h3>
                <p className="text-xs text-[#737E91] mt-1 max-w-sm mx-auto">
                  No flagged messages require review at this time. All community standards are currently satisfied.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#252C3A]/60">
                {flaggedItems.map((flag) => {
                  let statusBadge = 'bg-[#F2BD69]/15 text-[#F2BD69] border-[#F2BD69]/30';
                  if (flag.status === 'action_taken') statusBadge = 'bg-[#FF6B78]/15 text-[#FF6B78] border-[#FF6B78]/30';
                  if (flag.status === 'dismissed') statusBadge = 'bg-[#131722] text-[#737E91] border-[#252C3A]';
                  if (flag.status === 'reviewed') statusBadge = 'bg-[#8B7CFF]/15 text-[#8B7CFF] border-[#8B7CFF]/30';

                  const senderIsMuted = flag.sender_muted_until && new Date(flag.sender_muted_until) > new Date();

                  return (
                    <div key={flag.id} className="p-5 hover:bg-[#131722]/40 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FF6B78]/15 text-[#FF6B78] border border-[#FF6B78]/30">
                              Reason: {flag.reason}
                            </span>
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge}`}>
                              {flag.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-[#737E91] font-mono">
                              Flagged by <strong className="text-[#A0A8B8]">{flag.flagger_name}</strong> on{' '}
                              {new Date(flag.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Reported Message Content Preview */}
                          <div className="mt-3 p-3.5 bg-[#131722] rounded-xl border border-[#252C3A]">
                            <div className="flex items-center justify-between text-xs text-[#737E91] mb-1 font-mono">
                              <span className="font-semibold text-[#8B7CFF]">
                                Message from: {flag.sender_name} ({flag.sender_email})
                              </span>
                              <span>Posted {new Date(flag.message_created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-[#F3F5FA] leading-relaxed font-sans">
                              {flag.message_is_deleted ? (
                                <em className="text-[#FF6B78]">[Message has already been deleted]</em>
                              ) : (
                                flag.message_content
                              )}
                            </p>
                          </div>

                          {/* Flag Details if provided */}
                          {flag.details && (
                            <div className="mt-2 text-xs text-[#A0A8B8]">
                              <span className="font-semibold text-[#F3F5FA] font-mono">Reporter Note:</span> {flag.details}
                            </div>
                          )}

                          {/* Moderator Notes if reviewed */}
                          {flag.moderator_notes && (
                            <div className="mt-2 text-xs text-[#8B7CFF] bg-[#8B7CFF]/10 p-2.5 rounded-xl border border-[#8B7CFF]/20 font-mono">
                              <span className="font-semibold">Reviewer ({flag.reviewer_name || 'Staff'}):</span>{' '}
                              {flag.moderator_notes}
                            </div>
                          )}
                        </div>

                        {/* Moderation Controls */}
                        <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#252C3A] shrink-0">
                          {/* Review Action */}
                          <button
                            type="button"
                            onClick={() => {
                              setReviewModalFlag(flag);
                              setReviewStatus(flag.status === 'pending' ? 'action_taken' : flag.status);
                              setModeratorNotes(flag.moderator_notes || '');
                            }}
                            className="px-3 py-1.5 rounded-xl border border-[#252C3A] bg-[#131722] hover:bg-[#191F2B] text-xs text-[#F3F5FA] font-semibold transition-all min-h-[36px] a11y-focus font-mono"
                          >
                            Update Status
                          </button>

                          {/* Delete Message */}
                          {!flag.message_is_deleted && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(flag.message_id, flag.message_content)}
                              className="px-3 py-1.5 rounded-xl border border-[#FF6B78]/30 bg-[#FF6B78]/10 hover:bg-[#FF6B78]/20 text-[#FF6B78] text-xs font-semibold transition-all min-h-[36px] flex items-center gap-1.5 a11y-focus font-mono"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Message
                            </button>
                          )}

                          {/* Mute / Unmute User */}
                          {senderIsMuted ? (
                            <button
                              type="button"
                              onClick={() => handleUnmute(flag.sender_id, flag.sender_name)}
                              className="px-3 py-1.5 rounded-xl border border-[#48D6A0]/30 bg-[#48D6A0]/10 hover:bg-[#48D6A0]/20 text-[#48D6A0] text-xs font-semibold transition-all min-h-[36px] flex items-center gap-1.5 a11y-focus font-mono"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              Unmute User
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setMuteModalUser({
                                  id: flag.sender_id,
                                  display_name: flag.sender_name,
                                  role: flag.sender_role,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl border border-[#F2BD69]/30 bg-[#F2BD69]/10 hover:bg-[#F2BD69]/20 text-[#F2BD69] text-xs font-semibold transition-all min-h-[36px] flex items-center gap-1.5 a11y-focus font-mono"
                            >
                              <VolumeX className="w-3.5 h-3.5" />
                              Mute Member
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LIVE CHAT STREAM VIEW */
        <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl overflow-hidden shadow-sm flex flex-col h-[650px]">
          {/* Chat Stream Header */}
          <div className="p-4 border-b border-[#252C3A] bg-[#08090D]/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#8B7CFF]" />
              <span className="text-sm font-bold text-[#F3F5FA] font-display"># Veylith Community Operations Stream</span>
            </div>
            <span className="text-xs text-[#737E91] font-mono">Auto-refreshes every 5s</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <p className="text-xs text-[#737E91] text-center py-16 font-mono">No messages in chat stream yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                let senderBadge = 'text-[#A0A8B8] bg-[#131722] border-[#252C3A]';
                if (msg.sender_role === 'super_admin') senderBadge = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
                if (msg.sender_role === 'admin') senderBadge = 'text-[#8B7CFF] bg-[#8B7CFF]/15 border-[#8B7CFF]/30';
                if (msg.sender_role === 'moderator') senderBadge = 'text-[#55D6BE] bg-[#55D6BE]/15 border-[#55D6BE]/30';

                return (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-2xl transition-all border ${
                      msg.is_pinned
                        ? 'bg-[#8B7CFF]/10 border-[#8B7CFF]/30 ring-1 ring-[#8B7CFF]/20'
                        : 'bg-[#131722] border-[#252C3A] hover:border-[#8B7CFF]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#F3F5FA] font-display">{msg.sender_name}</span>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 rounded-full border ${senderBadge}`}>
                          {msg.sender_role.replace('_', ' ')}
                        </span>
                        {msg.is_pinned === 1 && (
                          <span className="text-[10px] font-mono font-bold text-[#F2BD69] bg-[#F2BD69]/10 px-2 py-0.2 rounded-full border border-[#F2BD69]/20 flex items-center gap-1">
                            <Pin className="w-3 h-3" />
                            Pinned Announcement
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-[11px] text-[#737E91]">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Pin / Unpin (Staff only) */}
                        {isStaff && (
                          <button
                            type="button"
                            onClick={() => handleTogglePin(msg.id)}
                            title={msg.is_pinned ? 'Unpin announcement' : 'Pin as announcement'}
                            className="p-1 text-[#737E91] hover:text-[#F2BD69] rounded transition-colors a11y-focus"
                          >
                            <Pin className={`w-3.5 h-3.5 ${msg.is_pinned ? 'fill-[#F2BD69] text-[#F2BD69]' : ''}`} />
                          </button>
                        )}

                        {/* Delete message (Staff only) */}
                        {isStaff && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id, msg.content)}
                            title="Delete message"
                            className="p-1 text-[#737E91] hover:text-[#FF6B78] rounded transition-colors a11y-focus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Flag message (Any user) */}
                        <button
                          type="button"
                          onClick={() => setFlagModalMessage(msg)}
                          title="Report / Flag Message"
                          className="p-1 text-[#737E91] hover:text-[#FF6B78] rounded transition-colors a11y-focus"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-[#F3F5FA] leading-relaxed font-sans">{msg.content}</p>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="p-4 border-t border-[#252C3A] bg-[#08090D]/60">
            {isMuted ? (
              <div className="p-3 bg-[#FF6B78]/10 border border-[#FF6B78]/20 rounded-xl text-xs text-[#FF6B78] flex items-center gap-2 font-mono">
                <VolumeX className="w-4 h-4 shrink-0" />
                <span>
                  You are temporarily muted from sending chat messages until {new Date(mutedUntil).toLocaleString()}.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to the community or team leads..."
                  className="flex-1 px-4 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA] placeholder-[#737E91] focus:outline-none focus:border-[#8B7CFF]"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#6355d8] hover:from-[#9c90ff] hover:to-[#7466e3] text-white text-xs font-semibold shadow-md shadow-[#8B7CFF]/20 flex items-center gap-2 disabled:opacity-50 min-h-[44px] a11y-focus"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REPORT / FLAG MODAL */}
      {flagModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090D]/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-6 text-[#F3F5FA]">
            <h2 className="text-lg font-bold tracking-tight text-[#F3F5FA] mb-1 font-display">
              Flag Message for Moderator Review
            </h2>
            <p className="text-xs text-[#A0A8B8] mb-4">
              Our safety team evaluates reports against community guidelines.
            </p>

            <form onSubmit={handleFlagSubmit} className="space-y-4">
              <div className="p-3 bg-[#131722] rounded-xl border border-[#252C3A] text-xs text-[#F3F5FA] italic">
                "{flagModalMessage.content}"
              </div>

              <div>
                <label htmlFor="flag-reason-select" className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Violation Reason *
                </label>
                <select
                  id="flag-reason-select"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA]"
                >
                  <option value="Spam">Spam</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Inappropriate">Inappropriate</option>
                  <option value="Off-topic">Off-topic</option>
                  <option value="Malicious Link">Malicious Link</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="flag-details" className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Additional Details (Optional)
                </label>
                <textarea
                  id="flag-details"
                  rows="2"
                  value={flagDetails}
                  onChange={(e) => setFlagDetails(e.target.value)}
                  placeholder="Context, scam link details, or background information..."
                  className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#252C3A]">
                <button
                  type="button"
                  onClick={() => setFlagModalMessage(null)}
                  disabled={flagging}
                  className="px-4 py-2 rounded-xl border border-[#252C3A] bg-[#131722] text-xs text-[#A0A8B8] hover:text-[#F3F5FA] a11y-focus"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={flagging}
                  className="px-5 py-2 rounded-xl bg-[#FF6B78] hover:bg-[#ff828d] text-[#08090D] font-bold text-xs shadow-md shadow-[#FF6B78]/20 a11y-focus"
                >
                  {flagging ? 'Submitting...' : 'Submit Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MUTE USER MODAL */}
      {muteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090D]/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-6 text-[#F3F5FA]">
            <h2 className="text-lg font-bold tracking-tight text-[#F3F5FA] mb-1 font-display">
              Mute User from Community Stream
            </h2>
            <p className="text-xs text-[#A0A8B8] mb-4">
              Temporarily restrict <strong className="text-[#F3F5FA]">{muteModalUser.display_name}</strong> from sending chat messages.
            </p>

            <form onSubmit={handleMuteSubmit} className="space-y-4">
              <div>
                <label htmlFor="mute-duration-select" className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Mute Duration
                </label>
                <select
                  id="mute-duration-select"
                  value={muteDuration}
                  onChange={(e) => setMuteDuration(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA]"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={1440}>24 Hours (1 Day)</option>
                  <option value={10080}>7 Days (1 Week)</option>
                  <option value={525600}>Permanent Mute</option>
                </select>
              </div>

              <div>
                <label htmlFor="mute-reason" className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Moderator Reason
                </label>
                <input
                  id="mute-reason"
                  type="text"
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#252C3A]">
                <button
                  type="button"
                  onClick={() => setMuteModalUser(null)}
                  disabled={muting}
                  className="px-4 py-2 rounded-xl border border-[#252C3A] bg-[#131722] text-xs text-[#A0A8B8] hover:text-[#F3F5FA] a11y-focus"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={muting}
                  className="px-5 py-2 rounded-xl bg-[#F2BD69] hover:bg-[#fad082] text-[#08090D] font-bold text-xs shadow-md shadow-[#F2BD69]/20 a11y-focus"
                >
                  {muting ? 'Applying Mute...' : 'Apply Mute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE FLAGGED STATUS MODAL */}
      {reviewModalFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090D]/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-6 text-[#F3F5FA]">
            <h2 className="text-lg font-bold tracking-tight text-[#F3F5FA] mb-1 font-display">
              Triage Flagged Content
            </h2>
            <p className="text-xs text-[#A0A8B8] mb-4">
              Update status and record moderator decision for the audit log.
            </p>

            <form onSubmit={handleReviewFlag} className="space-y-4">
              <div>
                <label htmlFor="triage-status-select" className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Resolution Status
                </label>
                <select
                  id="triage-status-select"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA]"
                >
                  <option value="pending">Pending Review</option>
                  <option value="reviewed">Reviewed (No further action needed)</option>
                  <option value="action_taken">Action Taken (Message deleted or user muted)</option>
                  <option value="dismissed">Dismissed (False positive)</option>
                </select>
              </div>

              <div>
                <label htmlFor="triage-notes" className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Internal Moderator Notes
                </label>
                <textarea
                  id="triage-notes"
                  rows="2"
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Record justification for dismissal or action taken..."
                  className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#252C3A]">
                <button
                  type="button"
                  onClick={() => setReviewModalFlag(null)}
                  disabled={updatingFlag}
                  className="px-4 py-2 rounded-xl border border-[#252C3A] bg-[#131722] text-xs text-[#A0A8B8] hover:text-[#F3F5FA] a11y-focus"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingFlag}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#6355d8] hover:from-[#9c90ff] hover:to-[#7466e3] text-white text-xs font-semibold shadow-md shadow-[#8B7CFF]/20 a11y-focus"
                >
                  {updatingFlag ? 'Saving...' : 'Save Resolution'}
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
