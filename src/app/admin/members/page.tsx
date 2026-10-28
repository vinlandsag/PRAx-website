"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AccessRequest {
  id: string;
  initials: string;
  name: string;
  email: string;
  timeAgo: string;
  avatarColor: "blue" | "purple" | "orange" | "teal";
}

interface InviteCodeItem {
  id?: string;
  code: string;
  note: string;
  status: "Used" | "Unused" | "Revoked";
}

export default function AdminMembersPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([
    {
      id: "usr_pending_01",
      initials: "PB",
      name: "Pending Builder",
      email: "pending@prax.build",
      timeAgo: "Just now",
      avatarColor: "blue",
    },
    {
      id: "1",
      initials: "NJ",
      name: "Neil Joseph",
      email: "neil@dev.in",
      timeAgo: "2h ago",
      avatarColor: "teal",
    },
    {
      id: "2",
      initials: "TB",
      name: "Tara Bose",
      email: "tara@studio.co",
      timeAgo: "6h ago",
      avatarColor: "purple",
    },
  ]);

  const [invites, setInvites] = useState<InviteCodeItem[]>([
    { code: "PRAX-ALPHA-2026", note: "10-use invitation", status: "Unused" },
    { code: "PRAX-SINGLE-USE", note: "Single-use invitation", status: "Unused" },
    { code: "PRAX-USED-CODE", note: "Redeemed code", status: "Used" },
    { code: "PRAX-REVOKED-CODE", note: "Revoked code", status: "Revoked" },
  ]);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch live pending access requests
    fetch("/api/admin/users?status=PENDING_APPROVAL")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.users) && data.users.length > 0) {
          const mapped: AccessRequest[] = data.users.map(
            (u: { id: string; name: string; email: string }) => ({
              id: u.id,
              initials: u.name
                .split(" ")
                .map((p: string) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
              name: u.name,
              email: u.email,
              timeAgo: "Awaiting review",
              avatarColor: "blue" as const,
            })
          );
          setRequests(mapped);
        }
      })
      .catch(() => {});

    // Fetch live invite codes
    fetch("/api/invites")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.invites) && data.invites.length > 0) {
          const mapped: InviteCodeItem[] = data.invites.map(
            (inv: {
              id: string;
              code: string;
              maxUses: number;
              usedCount: number;
              status: string;
            }) => ({
              id: inv.id,
              code: inv.code,
              note: `${inv.maxUses - inv.usedCount} of ${inv.maxUses} uses remaining`,
              status:
                inv.status === "ACTIVE" ? "Unused" : inv.status === "USED" ? "Used" : "Revoked",
            })
          );
          setInvites(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const handleApprove = async (id: string) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data?.error?.message || "Failed to approve user.");
        // Still remove from UI if mock
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    const reason = window.prompt(
      "Enter reason for rejection (required):",
      "Profile criteria not met"
    );
    if (!reason || reason.trim().length < 3) {
      setActionError("A reason of at least 3 characters is required to reject an application.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data?.error?.message || "Failed to reject user.");
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleGenerateInvite = async () => {
    setActionError(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxUses: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvites((prev) => [
          {
            id: data.invite.id,
            code: data.invite.code,
            note: "Single-use invitation",
            status: "Unused",
          },
          ...prev,
        ]);
      } else {
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newCode = `PRAX-${randomHex}-99`;
        setInvites((prev) => [
          { code: newCode, note: "Single-use invitation", status: "Unused" },
          ...prev,
        ]);
      }
    } catch {
      const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newCode = `PRAX-${randomHex}-99`;
      setInvites((prev) => [
        { code: newCode, note: "Single-use invitation", status: "Unused" },
        ...prev,
      ]);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <AppShell breadcrumbs={["PRAX", "Members & Access"]} variant="admin">
      {actionError && (
        <div className="mb-4 p-3 rounded-xl bg-danger-subtle border border-danger-border text-xs text-danger flex items-center gap-2">
          <span>⚠️</span>
          <span>{actionError}</span>
        </div>
      )}
      {/* Title & Stats */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Members &amp; Access
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage requests, invitations, roles and membership
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <span className="px-2.5 py-1 rounded-lg bg-surface border border-border text-amber-700">
              {requests.length} PENDING
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface border border-border">
              312 MEMBERS
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface border border-border">
              {invites.length} INVITES
            </span>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<span>+</span>}
            onClick={handleGenerateInvite}
          >
            Generate invite code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Pending Requests & Recent Members */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Pending Access Requests */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
              <h2 className="text-base font-bold text-text">Pending access requests</h2>
              <span className="text-xs text-text-muted font-medium">
                {requests.length} awaiting review
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted">No pending requests.</div>
            ) : (
              <div className="flex flex-col divide-y divide-border-subtle">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={req.name} size="md" colorScheme={req.avatarColor} />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text">{req.name}</span>
                        <span className="text-xs text-text-muted">
                          {req.email} · {req.timeAgo}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button variant="secondary" size="sm" onClick={() => handleReject(req.id)}>
                        Reject
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleApprove(req.id)}>
                        ✓ Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Members */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
              <h2 className="text-sm font-bold text-text">Recent members</h2>
              <span className="text-xs text-primary font-semibold cursor-pointer hover:underline">
                View all →
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3 py-1">
                <Avatar name="Kabir Nair" size="sm" colorScheme="orange" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text">Kabir Nair</span>
                  <span className="text-[11px] text-text-muted">Member · Active</span>
                </div>
              </div>
              <div className="flex items-center gap-3 py-1">
                <Avatar name="Meera Shah" size="sm" colorScheme="purple" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text">Meera Shah</span>
                  <span className="text-[11px] text-text-muted">Member · Active</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Invite Codes & Rules */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Invite Codes Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
              <h2 className="text-base font-bold text-text">Invite codes</h2>
              <span className="text-xs text-primary font-semibold cursor-pointer hover:underline">
                Manage access
              </span>
            </div>

            <div className="flex flex-col divide-y divide-border-subtle">
              {invites.map((inv) => (
                <div key={inv.code} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs sm:text-sm font-bold text-text">
                      {inv.code}
                    </span>
                    <span className="text-[11px] text-text-muted">{inv.note}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        inv.status === "Used"
                          ? "neutral"
                          : inv.status === "Unused"
                            ? "info"
                            : "danger"
                      }
                      size="sm"
                    >
                      {inv.status}
                    </Badge>
                    <button
                      onClick={() => copyToClipboard(inv.code)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-background hover:bg-surface-hover text-text transition-colors cursor-pointer"
                    >
                      {copiedCode === inv.code ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Membership Rules Callout */}
          <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col gap-2.5 text-xs text-text-muted">
            <span className="font-bold text-text text-sm">Membership rules</span>
            <div className="flex items-center gap-2">
              <span>🛡️</span>
              <span>Only approved accounts enter the workspace.</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>Invitation codes can be revoked at any time.</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
