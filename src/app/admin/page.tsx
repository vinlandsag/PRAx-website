"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type { Submission } from "@/lib/db/submissions-store";
import { isSafeUrl, sanitizeUrl } from "@/lib/utils/url";

/**
 * Calculates human-readable pending age and visual severity badge variant.
 */
function getPendingAge(submittedAt: string): {
  label: string;
  variant: "neutral" | "warning" | "danger";
} {
  const diffMs = Date.now() - new Date(submittedAt).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return { label: `${diffMins}m ago`, variant: "neutral" };
  }
  if (diffHours < 12) {
    return { label: `${diffHours}h ago`, variant: "neutral" };
  }
  if (diffHours < 24) {
    return { label: `${diffHours}h ago`, variant: "warning" };
  }
  const diffDays = Math.floor(diffHours / 24);
  return { label: `${diffDays}d ago`, variant: "danger" };
}

export default function AdminReviewPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Rubric Scoring State for selected submission
  const [proofScore, setProofScore] = useState(10);
  const [qualityScore, setQualityScore] = useState(13);
  const [explanationScore, setExplanationScore] = useState(7);
  const [feedback, setFeedback] = useState("Strong implementation and clear measurements.");

  // Manual refetch handler for retry and refresh buttons
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/submissions?status=SUBMITTED");
      if (!res.ok) {
        throw new Error(`Failed to load queue (HTTP ${res.status})`);
      }
      const data = await res.json();
      const list: Submission[] = data.submissions || [];
      setSubmissions(list);
      if (list.length > 0) {
        setSelectedId((prev) => (prev && list.find((s) => s.id === prev) ? prev : list[0].id));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load review queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load review queue from API on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/submissions?status=SUBMITTED");
        if (!res.ok) {
          throw new Error(`Failed to load queue (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) {
          const list: Submission[] = data.submissions || [];
          setSubmissions(list);
          if (list.length > 0) {
            setSelectedId(list[0].id);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load review queue.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = submissions.find((s) => s.id === selectedId) || submissions[0] || null;
  const totalScore = Math.min(
    proofScore + qualityScore + explanationScore,
    selected?.maxPoints ?? 100
  );

  // Approve action
  const handleApprove = useCallback(async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${selected.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsAwarded: totalScore }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to approve submission.");
      }

      setActionNotice({
        message: `Approved & awarded ${totalScore} pts to ${selected.authorName}!`,
        type: "success",
      });

      // Remove from pending list and select next
      const remaining = submissions.filter((s) => s.id !== selected.id);
      setSubmissions(remaining);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (err: unknown) {
      setActionNotice({
        message: err instanceof Error ? err.message : "Error approving submission",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selected, isSubmitting, totalScore, submissions]);

  // Reject action
  const handleReject = useCallback(async () => {
    if (!selected || isSubmitting) return;
    const trimmedFeedback = feedback.trim();
    if (trimmedFeedback.length < 3) {
      setActionNotice({
        message: "Rejection requires constructive feedback of at least 3 characters.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${selected.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: trimmedFeedback }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to reject submission.");
      }

      setActionNotice({
        message: `Rejected submission with feedback sent to ${selected.authorName}.`,
        type: "success",
      });

      const remaining = submissions.filter((s) => s.id !== selected.id);
      setSubmissions(remaining);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (err: unknown) {
      setActionNotice({
        message: err instanceof Error ? err.message : "Error rejecting submission",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selected, isSubmitting, feedback, submissions]);

  // Request revision action
  const handleRequestRevision = useCallback(async () => {
    if (!selected || isSubmitting) return;
    const trimmedFeedback = feedback.trim();
    if (trimmedFeedback.length < 3) {
      setActionNotice({
        message: "Requesting revision requires actionable feedback of at least 3 characters.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${selected.id}/request-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: trimmedFeedback }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to request revision.");
      }

      setActionNotice({
        message: `Revision requested from ${selected.authorName}.`,
        type: "success",
      });

      const remaining = submissions.filter((s) => s.id !== selected.id);
      setSubmissions(remaining);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (err: unknown) {
      setActionNotice({
        message: err instanceof Error ? err.message : "Error requesting revision",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selected, isSubmitting, feedback, submissions]);

  // Filtered queue items
  const filteredQueue = submissions.filter(
    (item) =>
      item.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        // Allow Cmd+Enter to approve even when typing in textarea
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          handleApprove();
        }
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleApprove();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleReject();
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        handleRequestRevision();
      } else if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        if (filteredQueue.length > 0) {
          const currentIndex = filteredQueue.findIndex((s) => s.id === selectedId);
          const nextIndex = (currentIndex + 1) % filteredQueue.length;
          setSelectedId(filteredQueue[nextIndex].id);
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        if (filteredQueue.length > 0) {
          const currentIndex = filteredQueue.findIndex((s) => s.id === selectedId);
          const prevIndex = (currentIndex - 1 + filteredQueue.length) % filteredQueue.length;
          setSelectedId(filteredQueue[prevIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredQueue, handleApprove, handleReject, handleRequestRevision, selectedId]);

  return (
    <AppShell breadcrumbs={["PRAX", "Review Queue"]} variant="admin">
      {/* Title & Keyboard Shortcuts Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Review Queue</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Evaluate proof, explain your decision, then award points
          </p>
        </div>
        <button
          onClick={() => setShowShortcutsModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-medium text-text-muted hover:text-text hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden transition-all cursor-pointer w-fit shadow-2xs"
          aria-label="View keyboard shortcuts"
        >
          <kbd className="px-1.5 py-0.5 rounded bg-surface-hover text-[10px] font-mono border border-border">
            ?
          </kbd>
          <span>Shortcuts</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          role="alert"
          className={`mb-6 p-4 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
            actionNotice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>
            {actionNotice.type === "success" ? "✓" : "⚠"} {actionNotice.message}
          </span>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 hover:bg-black/5 rounded-md cursor-pointer focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-hidden"
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-pulse">
          <Card className="lg:col-span-3 p-5 h-96 bg-surface-subtle" />
          <Card className="lg:col-span-5 p-7 h-96 bg-surface-subtle" />
          <Card className="lg:col-span-4 p-7 h-96 bg-surface-subtle" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-sm font-bold text-text mb-1">Failed to Load Review Queue</h3>
            <p className="text-xs text-text-muted">{error}</p>
          </div>
          <Button variant="primary" size="sm" onClick={fetchQueue}>
            Retry
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && submissions.length === 0 && (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xl mb-1">
            ✓
          </div>
          <h2 className="text-base font-bold text-text">All Caught Up!</h2>
          <p className="text-xs text-text-muted max-w-sm">
            There are currently no submissions waiting for review. You can safely return to the
            dashboard.
          </p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={fetchQueue}>
            Check for new submissions
          </Button>
        </Card>
      )}

      {/* 3-Column Desktop Review Workspace */}
      {!loading && !error && submissions.length > 0 && selected && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Review Queue (3 cols) */}
          <Card className="lg:col-span-3 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-text">Review queue</h2>
              <Badge variant="warning" size="sm">
                {submissions.length} PENDING
              </Badge>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pending proofs..."
              aria-label="Search pending proofs"
              className="w-full bg-background border border-border text-xs rounded-xl px-3 py-2 mb-3 text-text placeholder:text-text-faint focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
            />
            <div
              className="flex flex-col gap-1.5 max-h-[560px] overflow-y-auto pr-0.5"
              role="tablist"
              aria-label="Pending submissions"
            >
              {filteredQueue.map((item) => {
                const isSelected = item.id === selected.id;
                const age = getPendingAge(item.submittedAt);
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    aria-selected={isSelected}
                    role="tab"
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden ${
                      isSelected
                        ? "bg-lavender/60 border border-lavender-border shadow-2xs"
                        : "hover:bg-surface-hover border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={item.authorName} size="sm" colorScheme="purple" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-text truncate">
                          {item.authorName}
                        </span>
                        <span className="text-[11px] text-text-muted truncate">
                          {item.taskTitle}
                        </span>
                      </div>
                    </div>
                    {/* Pending Age Badge with urgency color coding */}
                    <Badge
                      variant={age.variant}
                      size="sm"
                      className="shrink-0 text-[10px] font-mono"
                    >
                      {age.label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Column 2: Proof & Requirements (5 cols) */}
          <Card className="lg:col-span-5 p-6 sm:p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h2 className="text-sm font-bold text-text">Proof &amp; requirements</h2>
              <span className="text-xs font-medium text-text-muted">
                {selected.category} · {selected.maxPoints} pts
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-text mb-1">{selected.taskTitle}</h3>
              <span className="text-xs text-text-muted">
                Submitted by <strong className="text-text">{selected.authorName}</strong> ·{" "}
                {getPendingAge(selected.submittedAt).label}
              </span>
            </div>

            {/* Safe Link Handling */}
            {isSafeUrl(selected.proofUrl) ? (
              <a
                href={sanitizeUrl(selected.proofUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-background border border-border text-xs text-primary font-medium hover:underline flex items-center justify-between group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-text-muted">🔗</span>
                  <span className="truncate">{selected.proofUrl}</span>
                </div>
                <span className="shrink-0 font-bold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  ↗
                </span>
              </a>
            ) : (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <span>⚠️</span>
                <span>Unsafe link protocol detected. Link was disabled for security.</span>
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-text block mb-1.5">Note to reviewer</span>
              <p className="text-xs text-text-secondary leading-relaxed p-3.5 rounded-xl bg-surface-subtle border border-border-subtle">
                {selected.note}
              </p>
            </div>

            {selected.codeSnippet && (
              <div>
                <span className="text-xs font-bold text-text block mb-1.5">
                  Submitted code / evidence
                </span>
                <div className="bg-sidebar text-white p-3.5 rounded-xl text-xs font-mono border border-border overflow-x-auto">
                  <pre className="whitespace-pre-wrap leading-relaxed">{selected.codeSnippet}</pre>
                </div>
              </div>
            )}

            {selected.checklist && selected.checklist.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-text block mb-2">
                  Checklist &amp; Task Rules
                </span>
                <div className="flex flex-col gap-2 text-xs text-text-secondary">
                  {selected.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Column 3: Your Decision (4 cols) */}
          <Card className="lg:col-span-4 p-6 sm:p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h2 className="text-sm font-bold text-text">Your decision</h2>
              <span className="text-xs text-text-muted">
                Points awarded max {selected.maxPoints}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">{totalScore}</span>
              <span className="text-xs font-medium text-text-muted">
                / {selected.maxPoints} pts
              </span>
            </div>

            {/* Rubric Criteria Sliders */}
            <div className="flex flex-col gap-3.5 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text">Proof Authenticity</span>
                  <span className="font-mono text-text-muted">{proofScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={proofScore}
                  onChange={(e) => setProofScore(parseInt(e.target.value))}
                  aria-label="Proof score"
                  className="w-full accent-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text">Solution Quality</span>
                  <span className="font-mono text-text-muted">{qualityScore} / 15</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={qualityScore}
                  onChange={(e) => setQualityScore(parseInt(e.target.value))}
                  aria-label="Quality score"
                  className="w-full accent-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text">Explanation &amp; Docs</span>
                  <span className="font-mono text-text-muted">{explanationScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={explanationScore}
                  onChange={(e) => setExplanationScore(parseInt(e.target.value))}
                  aria-label="Explanation score"
                  className="w-full accent-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                />
              </div>
            </div>

            {/* Reviewer Feedback Textarea */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label htmlFor="reviewer-feedback" className="text-xs font-bold text-text">
                  Reviewer feedback
                </label>
                <span className="text-[10px] text-text-muted">Required for rejection</span>
              </div>
              <textarea
                id="reviewer-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Provide constructive feedback for the member..."
                className="w-full bg-surface border border-border text-xs rounded-xl p-3 text-text placeholder:text-text-faint focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                ✓ Approve &amp; award ({totalScore} pts)
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1 text-danger-text hover:bg-danger-bg hover:border-danger/40"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  ✕ Reject
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1 text-text-muted hover:text-text"
                  onClick={handleRequestRevision}
                  disabled={isSubmitting}
                >
                  ↺ Revision
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-text-muted text-center">
              Rejection requires constructive reason · Shortcuts:{" "}
              <kbd className="px-1 py-0.5 rounded bg-surface-subtle font-mono border border-border">
                A
              </kbd>{" "}
              approve,{" "}
              <kbd className="px-1 py-0.5 rounded bg-surface-subtle font-mono border border-border">
                R
              </kbd>{" "}
              reject,{" "}
              <kbd className="px-1 py-0.5 rounded bg-surface-subtle font-mono border border-border">
                J/K
              </kbd>{" "}
              navigate
            </p>
          </Card>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <Modal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        title="Review Queue Keyboard Shortcuts"
      >
        <div className="flex flex-col gap-3 py-2 text-xs">
          <p className="text-text-muted leading-relaxed mb-2">
            Use these keyboard shortcuts to speed up review workflows on desktop:
          </p>
          <div className="grid grid-cols-2 gap-2 pb-2">
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between">
              <span className="font-semibold text-text">Approve &amp; Award</span>
              <kbd className="px-2 py-1 rounded bg-surface font-mono font-bold text-primary border border-border">
                A
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between">
              <span className="font-semibold text-text">Reject with Reason</span>
              <kbd className="px-2 py-1 rounded bg-surface font-mono font-bold text-danger-text border border-border">
                R
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between">
              <span className="font-semibold text-text">Request Revision</span>
              <kbd className="px-2 py-1 rounded bg-surface font-mono font-bold text-text border border-border">
                V
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between">
              <span className="font-semibold text-text">Approve via Textarea</span>
              <kbd className="px-2 py-1 rounded bg-surface font-mono font-bold text-text border border-border">
                ⌘ + ↵
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between">
              <span className="font-semibold text-text">Next Submission</span>
              <kbd className="px-2 py-1 rounded bg-surface font-mono font-bold text-text border border-border">
                J / ↓
              </kbd>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between">
              <span className="font-semibold text-text">Previous Submission</span>
              <kbd className="px-2 py-1 rounded bg-surface font-mono font-bold text-text border border-border">
                K / ↑
              </kbd>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowShortcutsModal(false)}
            className="w-full mt-2"
          >
            Got it
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
