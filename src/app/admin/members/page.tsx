"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, Badge, Button, Card, EmptyState, Modal, Notice, Textarea } from "@/components/ui";
import { ResourceState } from "@/components/ui/ResourceState";
import { useResource } from "@/lib/api/use-resource";
import { apiRequest } from "@/lib/api/client";
import type { InviteCode } from "@/lib/auth/types";
interface AccessRequest {
  id: string;
  name: string;
  email: string;
}
export default function AdminMembersPage() {
  const requests = useResource<{ users: AccessRequest[] }>(
    "/api/admin/users?status=PENDING_APPROVAL"
  );
  const invites = useResource<{ invites: InviteCode[] }>("/api/invites");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reject, setReject] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const act = async (path: string, body?: unknown) => {
    setSaving(true);
    setError("");
    try {
      await apiRequest(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      await Promise.all([requests.refresh(), invites.refresh()]);
      setReject(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not complete this action.");
    } finally {
      setSaving(false);
    }
  };
  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
    } catch {
      setError("Could not copy this invitation. Select and copy the code manually.");
    }
  };
  const createInvite = async () => {
    setSaving(true);
    setError("");
    try {
      const result = await apiRequest<{ invite: InviteCode }>("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxUses: 1 }),
      });
      setNewInviteCode(result.invite.code);
      await invites.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create this invitation.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <AppShell breadcrumbs={["PRAX", "Member management"]} variant="admin">
      <h1 className="mb-6 text-2xl font-bold">Member management</h1>
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold">Access requests</h2>
          {!requests.data ? (
            <ResourceState
              loading={requests.loading}
              error={requests.error}
              onRetry={() => void requests.refresh()}
            />
          ) : requests.data.users.length ? (
            <ul className="divide-y divide-border">
              {requests.data.users.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar name={user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{user.name}</p>
                    <p className="break-all text-xs text-text-muted">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={() =>
                      void act("/api/admin/users/" + encodeURIComponent(user.id) + "/approve")
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={saving}
                    onClick={() => {
                      setReject(user.id);
                      setReason("");
                    }}
                  >
                    Reject
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No access requests" />
          )}
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">Invitations</h2>
            <Button
              size="sm"
              disabled={!invites.data || saving}
              onClick={() => void createInvite()}
            >
              Create invitation
            </Button>
          </div>
          {newInviteCode && (
            <Notice tone="success">
              <div className="flex flex-wrap items-center gap-3">
                <span>Copy this invitation now. It is only shown once:</span>
                <code className="font-mono">{newInviteCode}</code>
                <Button size="sm" variant="secondary" onClick={() => void copy(newInviteCode)}>
                  {copied === newInviteCode ? "Copied" : "Copy code"}
                </Button>
              </div>
            </Notice>
          )}
          {!invites.data ? (
            <ResourceState
              loading={invites.loading}
              error={invites.error}
              onRetry={() => void invites.refresh()}
            />
          ) : invites.data.invites.length ? (
            <ul className="divide-y divide-border">
              {invites.data.invites.map((invite) => (
                <li key={invite.id} className="space-y-2 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="break-all text-xs">
                      {invite.code ?? "Code hidden after creation"}
                    </code>
                    <Badge>{invite.status}</Badge>
                  </div>
                  <p className="text-xs text-text-muted">
                    {invite.usedCount} / {invite.maxUses} uses
                  </p>
                  <Button
                    size="sm"
                    variant="text"
                    disabled={!invite.code}
                    onClick={() => invite.code && void copy(invite.code)}
                  >
                    {invite.code && copied === invite.code ? "Copied" : "Copy code"}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No invitations" />
          )}
        </Card>
      </div>
      <Modal
        isOpen={!!reject}
        onClose={() => {
          if (!saving) setReject(null);
        }}
        title="Reject access request"
        footer={
          <>
            <Button variant="secondary" disabled={saving} onClick={() => setReject(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={saving}
              disabled={reason.trim().length < 3}
              onClick={() =>
                void act("/api/admin/users/" + encodeURIComponent(reject!) + "/reject", {
                  reason: reason.trim(),
                })
              }
            >
              Reject request
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        {error && <Notice tone="danger">{error}</Notice>}
      </Modal>
    </AppShell>
  );
}
