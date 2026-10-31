"use client";
import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { applyTheme } from "@/components/layout/ThemeSync";
import {
  Avatar,
  Button,
  Card,
  Input,
  Notice,
  SegmentedControl,
  Skeleton,
  Toggle,
} from "@/components/ui";
import { useWorkspace } from "@/lib/workspace/use-workspace";
import type { WorkspaceData, WorkspaceMutation } from "@/lib/workspace/types";
import { isSafeUrl } from "@/lib/utils/url";

export default function SettingsPage() {
  const api = useWorkspace();
  return (
    <AppShell breadcrumbs={["PRAX", "Settings"]}>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 mb-6 text-xs text-text-muted">Your account, your preferences</p>
      {!api.data ? (
        api.error ? (
          <Notice tone="danger">
            {api.error}
            <Button onClick={() => void api.refresh()}>Retry</Button>
          </Notice>
        ) : (
          <Skeleton className="h-64" label="Loading settings" />
        )
      ) : (
        <Suspense fallback={<Skeleton className="h-64" label="Loading settings" />}>
          <SettingsForm
            key={api.data.user.id}
            data={api.data}
            mutate={api.mutate}
            error={api.error}
            saving={api.saving}
          />
        </Suspense>
      )}
    </AppShell>
  );
}
function SettingsForm({
  data,
  mutate,
  error,
  saving,
}: {
  data: WorkspaceData;
  mutate: (value: WorkspaceMutation) => Promise<boolean>;
  error: string;
  saving: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const requestedTab = params.get("tab");
  const initialTab = ["account", "appearance", "notifications", "privacy", "security"].includes(
    requestedTab || ""
  )
    ? requestedTab!
    : "account";
  const [tab, setTab] = useState(initialTab),
    [profile, setProfile] = useState(data.profile),
    [settings, setSettings] = useState(data.settings),
    [photo, setPhoto] = useState(false),
    [notice, setNotice] = useState(""),
    [logoutError, setLogoutError] = useState("");
  const update = (key: keyof typeof settings, value: boolean | "light" | "dark") =>
    setSettings((s) => ({ ...s, [key]: value }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");
    if (
      !(await mutate({
        resource: "profile",
        operation: "update",
        data: { name: profile.name, handle: profile.handle, avatarUrl: profile.avatarUrl },
      }))
    )
      return;
    if (await mutate({ resource: "settings", operation: "update", data: { ...settings } })) {
      applyTheme(settings.theme);
      setNotice("Your settings are saved.");
    }
  };
  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Try again.");
      router.replace("/login");
      router.refresh();
    } catch (e) {
      setLogoutError(e instanceof Error ? e.message : "Could not sign out.");
    }
  };
  return (
    <form onSubmit={save} className="grid items-start gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto lg:flex-col">
        {["account", "appearance", "notifications", "privacy", "security"].map((id) => (
          <Button
            key={id}
            aria-pressed={tab === id}
            variant={tab === id ? "lavender" : "text"}
            onClick={() => setTab(id)}
            className="justify-start capitalize"
          >
            {id}
          </Button>
        ))}
      </nav>
      <div className="space-y-4">
        {error && <Notice tone="danger">{error}</Notice>}
        {notice && <Notice tone="success">{notice}</Notice>}
        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 text-base font-bold capitalize">{tab}</h2>
          {tab === "account" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={profile.name}
                    src={isSafeUrl(profile.avatarUrl) ? profile.avatarUrl : undefined}
                    size="lg"
                  />
                  <div>
                    <p className="text-sm font-bold">{data.profile.name}</p>
                    <p className="text-xs text-text-muted">{data.user.email}</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setPhoto((value) => !value)}>
                  Change photo
                </Button>
              </div>
              {photo && (
                <Input
                  label="Profile photo URL"
                  type="url"
                  placeholder="https://…"
                  helperText="Use a full image URL, or leave empty to use your initials."
                  value={profile.avatarUrl}
                  onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
                />
              )}
              <Input
                label="Display name"
                maxLength={100}
                required
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              />
              <Input
                label="Handle"
                maxLength={50}
                required
                value={profile.handle}
                helperText="@ followed by 2–49 letters, numbers or underscores."
                onChange={(e) => setProfile((p) => ({ ...p, handle: e.target.value }))}
              />
            </div>
          )}
          {tab === "appearance" && (
            <div className="space-y-4">
              <SegmentedControl
                label="Color theme"
                value={settings.theme}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
                onChange={(value) => {
                  update("theme", value as "light" | "dark");
                  applyTheme(value as "light" | "dark");
                }}
              />
              <p className="text-xs text-text-muted">
                Preview updates immediately. Save changes to keep your account preference.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSettings(data.settings);
                  applyTheme(data.settings.theme);
                }}
              >
                Reset preview
              </Button>
            </div>
          )}
          {tab === "notifications" && (
            <div className="space-y-4">
              <Toggle
                label="Submission review notifications"
                helperText="Allow review updates in your notification preferences."
                checked={settings.reviewNotifications}
                onChange={(e) => update("reviewNotifications", e.target.checked)}
              />
              <Toggle
                label="Streak reminder"
                checked={settings.streakReminder}
                onChange={(e) => update("streakReminder", e.target.checked)}
              />
              <Toggle
                label="All chat messages"
                checked={settings.chatNotifications}
                onChange={(e) => update("chatNotifications", e.target.checked)}
              />
              <p className="text-xs text-text-muted">
                These preferences are saved to your account. Email and push delivery are not
                configured on this local build.
              </p>
            </div>
          )}
          {tab === "privacy" && (
            <Toggle
              label="Show portfolio on public profile"
              helperText="Your own profile still shows your link. Other members only see it when this is enabled."
              checked={settings.showPortfolio}
              onChange={(e) => update("showPortfolio", e.target.checked)}
            />
          )}
          {tab === "security" && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                Signed in as {data.user.email}. Role: {data.user.role.toLowerCase()}.
              </p>
              <p className="text-xs text-text-muted">
                Account email and role are managed by the administrator and cannot be changed here.
              </p>
              {logoutError && <Notice tone="danger">{logoutError}</Notice>}
              <Button variant="secondary" onClick={() => void logout()}>
                Sign out of this session
              </Button>
            </div>
          )}
        </Card>
        {tab !== "security" && (
          <Button type="submit" isLoading={saving}>
            Save changes
          </Button>
        )}
      </div>
    </form>
  );
}
