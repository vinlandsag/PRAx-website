"use client";
import { useState, type FormEvent } from "react";
import { ProfileView } from "./ProfileView";
import { Button, Input, Modal, Notice, Skeleton, Textarea } from "@/components/ui";
import { AppShell } from "@/components/layout/AppShell";
import { useWorkspace } from "@/lib/workspace/use-workspace";
import type { Profile } from "@/lib/workspace/types";

export function EditableProfile() {
  const { data, error, saving, mutate, refresh } = useWorkspace();
  const [section, setSection] = useState<"profile" | "skills" | "project" | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null),
    [skills, setSkills] = useState("");
  const edit = (part: typeof section) => {
    if (!data) return;
    setDraft({ ...data.profile });
    setSkills(data.profile.skills.join(", "));
    setSection(part);
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
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
    if (await mutate({ resource: "profile", operation: "update", data: fields })) setSection(null);
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
  if (!data)
    return (
      <AppShell breadcrumbs={["PRAX", "My profile"]}>
        {error ? (
          <Notice tone="danger">
            {error}
            <Button onClick={() => void refresh()}>Retry</Button>
          </Notice>
        ) : (
          <Skeleton className="h-64" label="Loading profile" />
        )}
      </AppShell>
    );
  return (
    <>
      <ProfileView
        {...data.profile}
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
        {error && <Notice tone="danger">{error}</Notice>}
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
