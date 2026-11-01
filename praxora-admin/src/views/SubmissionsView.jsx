import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  User,
  AlertCircle,
  MessageSquare,
  Check,
  X,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';

export default function SubmissionsView({ searchQuery, onStatsUpdated }) {
  const { user, isStaff, isAdmin } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Submission for Review Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: false,
  });

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSubmissions({
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setSubmissions(res.submissions);
      setPagination(res.pagination);
    } catch (err) {
      toastError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.page, pagination.limit, toastError]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const openReviewModal = (submission, defaultAction = 'approve') => {
    setSelectedSubmission(submission);
    setReviewAction(defaultAction);
    setReviewComment(
      defaultAction === 'approve'
        ? 'Verified and approved according to task rubric.'
        : ''
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    if (reviewAction === 'reject' && !reviewComment.trim()) {
      toastError('A review comment explaining the rejection reason is required.');
      return;
    }

    setReviewing(true);
    try {
      const res = await api.reviewSubmission(selectedSubmission.id, {
        action: reviewAction,
        reviewComment: reviewComment.trim(),
      });

      if (reviewAction === 'approve') {
        toastSuccess(
          `Submission approved! Credited ${res.pointsAwarded} points to ${selectedSubmission.member_name} (New balance: ${res.memberNewTotalPoints} pts)`
        );
      } else {
        toastSuccess(`Submission rejected. Review comment saved.`);
      }

      setSelectedSubmission(null);
      fetchSubmissions();
      if (onStatsUpdated) onStatsUpdated();
    } catch (err) {
      toastError(err.message || 'Failed to review submission');
    } finally {
      setReviewing(false);
    }
  };

  const displayedSubmissions = searchQuery?.trim()
    ? submissions.filter((sub) => {
        const q = searchQuery.toLowerCase();
        return (
          sub.task_title?.toLowerCase().includes(q) ||
          sub.member_name?.toLowerCase().includes(q) ||
          sub.member_email?.toLowerCase().includes(q) ||
          sub.content?.toLowerCase().includes(q) ||
          sub.task_category?.toLowerCase().includes(q)
        );
      })
    : submissions;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#252C3A]">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#F3F5FA] flex items-center gap-2.5 font-display">
            Submissions & Ledger Authorization
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#131722] text-[#A0A8B8] border border-[#252C3A]">
              {pagination.total} Submissions
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#A0A8B8]">
            Inspect member proof, verify task completions, and execute atomic point awards with zero duplication.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0D1017] border border-[#252C3A] rounded-xl font-mono">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === '' ? 'bg-[#8B7CFF] text-white shadow-sm' : 'text-[#737E91] hover:text-[#F3F5FA]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'pending' ? 'bg-[#F2BD69] text-[#08090D] font-bold shadow-sm' : 'text-[#737E91] hover:text-[#F3F5FA]'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'approved' ? 'bg-[#48D6A0] text-[#08090D] font-bold shadow-sm' : 'text-[#737E91] hover:text-[#F3F5FA]'
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'rejected' ? 'bg-[#FF6B78] text-[#08090D] font-bold shadow-sm' : 'text-[#737E91] hover:text-[#F3F5FA]'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-[#737E91]">Loading submissions...</div>
        ) : displayedSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck2 className="w-10 h-10 text-[#737E91] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#A0A8B8]">No submissions found</h3>
            <p className="text-xs text-[#737E91] mt-1 max-w-sm mx-auto">
              There are no submissions currently matching this status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#252C3A]/60">
            {displayedSubmissions.map((sub) => {
              let statusBadge = 'bg-[#131722] text-[#A0A8B8] border-[#252C3A]';
              let StatusIcon = Clock;
              if (sub.status === 'approved') {
                statusBadge = 'bg-[#48D6A0]/15 text-[#48D6A0] border-[#48D6A0]/30';
                StatusIcon = CheckCircle2;
              } else if (sub.status === 'rejected') {
                statusBadge = 'bg-[#FF6B78]/15 text-[#FF6B78] border-[#FF6B78]/30';
                StatusIcon = XCircle;
              } else if (sub.status === 'pending') {
                statusBadge = 'bg-[#F2BD69]/15 text-[#F2BD69] border-[#F2BD69]/30';
                StatusIcon = Clock;
              }

              return (
                <div key={sub.id} className="p-5 hover:bg-[#131722]/40 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Submission Core Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusBadge}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sub.status}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#131722] border border-[#252C3A] text-[#A0A8B8]">
                          {sub.task_category}
                        </span>
                        <span className="text-xs text-[#737E91] font-mono">
                          Submitted on {new Date(sub.created_at).toLocaleDateString()} at{' '}
                          {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#F3F5FA] tracking-tight mt-1.5 font-display">
                        {sub.task_title}
                      </h3>

                      <div className="mt-2 text-xs text-[#F3F5FA] bg-[#131722] p-3 rounded-xl border border-[#252C3A] leading-relaxed font-sans">
                        <p className="font-semibold text-[#A0A8B8] mb-1 font-mono text-[11px]">Member Solution / Findings:</p>
                        {sub.content}
                      </div>

                      {/* Proof link if available */}
                      {sub.proof_url && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#8B7CFF] hover:text-[#55D6BE] transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <a
                            href={sub.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline truncate max-w-lg font-mono text-xs"
                          >
                            {sub.proof_url}
                          </a>
                        </div>
                      )}

                      {/* Review Comment display if already reviewed */}
                      {sub.review_comment && (
                        <div className="mt-3 text-xs bg-[#131722] p-2.5 rounded-xl border border-[#252C3A] flex items-start gap-2 text-[#A0A8B8]">
                          <MessageSquare className="w-4 h-4 text-[#737E91] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-[#F3F5FA] font-mono text-[11px]">
                              Reviewer Feedback ({sub.reviewer_name || 'Staff'}):
                            </span>{' '}
                            {sub.review_comment}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Member Details & Reward Info */}
                    <div className="flex flex-row lg:flex-col lg:items-end justify-between items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#252C3A] shrink-0">
                      <div className="text-left lg:text-right">
                        <div className="text-xs font-semibold text-[#F3F5FA] flex items-center lg:justify-end gap-1.5 font-display">
                          <User className="w-3.5 h-3.5 text-[#8B7CFF]" />
                          {sub.member_name}
                        </div>
                        <div className="text-[11px] text-[#737E91] font-mono">{sub.member_email}</div>
                        <div className="text-xs text-[#F2BD69] font-bold mt-1 flex items-center lg:justify-end gap-1 font-mono">
                          <Sparkles className="w-3 h-3" />
                          Reward: {sub.task_reward_points} pts
                        </div>
                      </div>

                      {/* Action buttons (only for admin/staff) */}
                      {isAdmin && sub.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openReviewModal(sub, 'approve')}
                            className="px-3.5 py-2 rounded-xl bg-[#48D6A0] hover:bg-[#5ce2ad] text-[#08090D] text-xs font-bold shadow-md shadow-[#48D6A0]/20 flex items-center gap-1.5 transition-all a11y-focus min-h-[40px]"
                          >
                            <Check className="w-4 h-4" />
                            Approve (+{sub.task_reward_points} pts)
                          </button>
                          <button
                            type="button"
                            onClick={() => openReviewModal(sub, 'reject')}
                            className="px-3.5 py-2 rounded-xl border border-[#FF6B78]/40 bg-[#FF6B78]/15 hover:bg-[#FF6B78]/25 text-[#FF6B78] text-xs font-semibold flex items-center gap-1.5 transition-all a11y-focus min-h-[40px]"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[#252C3A] flex items-center justify-between text-xs text-[#737E91] font-mono">
            <span>
              Showing {submissions.length} of {pagination.total} submissions (Page {pagination.page} of {pagination.totalPages})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#252C3A] bg-[#131722] text-[#A0A8B8] hover:text-[#F3F5FA] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#191F2B]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#252C3A] bg-[#131722] text-[#A0A8B8] hover:text-[#F3F5FA] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#191F2B]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REVIEW & AUTHORIZE MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08090D]/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0D1017] border border-[#252C3A] rounded-2xl shadow-2xl p-6 text-[#F3F5FA] my-8">
            <h2 className="text-xl font-bold tracking-tight text-[#F3F5FA] mb-1 font-display">
              {reviewAction === 'approve' ? 'Authorize Points Award' : 'Reject Submission'}
            </h2>
            <p className="text-xs text-[#A0A8B8] mb-4">
              {reviewAction === 'approve'
                ? `Executing approval will atomically award +${selectedSubmission.task_reward_points} bounty points to ${selectedSubmission.member_name} inside SQLite WAL transaction.`
                : `Provide clear reviewer reasoning so the member can review feedback.`}
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A0A8B8] mb-1 font-mono">
                  Review Action Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewAction('approve');
                      setReviewComment('Verified and approved according to task rubric.');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      reviewAction === 'approve'
                        ? 'bg-[#48D6A0]/20 border-[#48D6A0] text-[#48D6A0]'
                        : 'border-[#252C3A] bg-[#131722] text-[#737E91]'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    Approve (+{selectedSubmission.task_reward_points} pts)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewAction('reject');
                      setReviewComment('');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      reviewAction === 'reject'
                        ? 'bg-[#FF6B78]/20 border-[#FF6B78] text-[#FF6B78]'
                        : 'border-[#252C3A] bg-[#131722] text-[#737E91]'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    Reject Work
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="review-comment" className="block text-xs font-semibold text-[#A0A8B8] mb-1">
                  Reviewer Comment / Feedback {reviewAction === 'reject' && '*'}
                </label>
                <textarea
                  id="review-comment"
                  rows="3"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Feedback, test results, or instructions..."
                  className="w-full px-3.5 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF]"
                />
              </div>

              <div className="pt-3 border-t border-[#252C3A] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  disabled={reviewing}
                  className="px-5 py-2.5 rounded-xl border border-[#252C3A] bg-[#131722] text-[#A0A8B8] hover:text-[#F3F5FA] text-xs font-semibold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-all shadow-lg ${
                    reviewAction === 'approve'
                      ? 'bg-[#48D6A0] hover:bg-[#5ce2ad] text-[#08090D] font-bold shadow-[#48D6A0]/20'
                      : 'bg-[#FF6B78] hover:bg-[#ff828d] text-[#08090D] font-bold shadow-[#FF6B78]/20'
                  }`}
                >
                  {reviewing
                    ? 'Processing Transaction...'
                    : reviewAction === 'approve'
                    ? 'Confirm & Award Points'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
