"use client";
import { useState, type FormEvent } from "react";
import { ProfileView } from "./ProfileView";
import { Button, Input, Modal, Notice, Skeleton, Textarea } from "@/components/ui";
import { AppShell } from "@/components/layout/AppShell";
import { apiRequest } from "@/lib/api/client";
import { useResource } from "@/lib/api/use-resource";
import type { Profile } from "@/lib/workspace/types";
import type { OwnProfileStats } from "@/lib/profile/service";

export function EditableProfile() {
  const api = useResource<{ profile: Profile; stats: OwnProfileStats }>("/api/users/me/profile");
  const [savedData, setSavedData] = useState<{
    profile: Profile;
    stats: OwnProfileStats;
  } | null>(null);
  const [section, setSection] = useState<"profile" | "skills" | "project" | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null),
    [skills, setSkills] = useState(""),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState(""),
    [success, setSuccess] = useState("");
  const data = savedData ?? api.data;
  const profile = data?.profile ?? null;
  const edit = (part: typeof section) => {
    if (!profile) return;
    setDraft({ ...profile });
    setSkills(profile.skills.join(", "));
    setSaveError("");
    setSuccess("");
    setSection(part);
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setSaveError("");
    setSuccess("");
    const fields =
      section === "skills"
        ? {
            skills: skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : section === "project"
          ? { currentProject: draft.currentProject, portfolioUrl: draft.portfolioUrl }
          : {
              name: draft.name,
              handle: draft.handle,
              bio: draft.bio,
              githubUrl: draft.githubUrl,
              linkedinUrl: draft.linkedinUrl,
              avatarUrl: draft.avatarUrl,
            };
    try {
      const result = await apiRequest<{ profile: Profile; stats: OwnProfileStats }>("/api/users/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      setSavedData(result);
      setSection(null);
      setSuccess("Your profile has been saved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };
  const field = (key: Exclude<keyof Profile, "skills">, label: string, type = "text") => (
    <Input
      label={label}
      type={type}
      value={draft?.[key] || ""}
      required={key === "name" || key === "handle"}
      maxLength={
        key === "name" ? 100 : key === "handle" ? 50 : key === "currentProject" ? 200 : 2048
      }
      onChange={(e) => setDraft((p) => (p ? { ...p, [key]: e.target.value } : p))}
    />
  );
  if (!profile)
    return (
      <AppShell breadcrumbs={["PRAX", "My profile"]}>
        {api.error ? (
          <Notice tone="danger">
            {api.error}
            <Button onClick={() => void api.refresh()}>Retry</Button>
          </Notice>
        ) : (
          <Skeleton className="h-64" label="Loading profile" />
        )}
      </AppShell>
    );
  return (
    <>
      {success && <Notice tone="success">{success}</Notice>}
      <ProfileView
        {...profile}
        totalPoints={data?.stats.totalPoints.toLocaleString()}
        weeklyRank={data?.stats.weeklyRank === null ? "—" : `#${data?.stats.weeklyRank}`}
        dayStreak={String(data?.stats.dayStreak ?? 0)}
        tasksApproved={String(data?.stats.tasksApproved ?? 0)}
        onEditProfile={() => edit("profile")}
        onEditSkills={() => edit("skills")}
        onEditProject={() => edit("project")}
      />
      <Modal
        isOpen={!!section}
        onClose={() => {
          if (!saving) setSection(null);
        }}
        title={
          section === "skills"
            ? "Edit skills & interests"
            : section === "project"
              ? "Edit current project"
              : "Edit profile"
        }
        footer={
          <>
            <Button variant="secondary" disabled={saving} onClick={() => setSection(null)}>
              Cancel
            </Button>
            <Button form="profile-editor" type="submit" isLoading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        {saveError && <Notice tone="danger">{saveError}</Notice>}
        <form id="profile-editor" onSubmit={save} className="space-y-4">
          {section === "skills" ? (
            <Input
              label="Skills & interests"
              helperText="Separate skills with commas. Up to 15 skills, 40 characters each."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          ) : section === "project" ? (
            <>
              {field("currentProject", "Project title")}
              {field("portfolioUrl", "Portfolio URL", "url")}
              <p className="text-xs text-text-muted">
                Leave the URL empty to remove your portfolio link.
              </p>
            </>
          ) : (
            <>
              {field("name", "Display name")}
              {field("handle", "Handle")}
              <Textarea
                label="Bio"
                maxLength={500}
                value={draft?.bio || ""}
                onChange={(e) => setDraft((p) => (p ? { ...p, bio: e.target.value } : p))}
              />
              {field("githubUrl", "GitHub URL", "url")}
              {field("linkedinUrl", "LinkedIn URL", "url")}
              {field("avatarUrl", "Profile photo URL", "url")}
            </>
          )}
        </form>
      </Modal>
    </>
  );
}
