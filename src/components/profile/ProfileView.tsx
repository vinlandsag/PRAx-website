"use client";

import React from "react";
import Link from "next/link";
import { isSafeUrl } from "@/lib/utils/url";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export interface ProfileProps {
  isPublic?: boolean;
  returnTo?: "chat" | "leaderboard";
  name?: string;
  handle?: string;
  bio?: string;
  totalPoints?: string;
  weeklyRank?: string;
  dayStreak?: string;
  tasksApproved?: string;
  currentProject?: string;
  skills?: string[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  onEditProfile?: () => void;
  onEditSkills?: () => void;
  onEditProject?: () => void;
}

export function ProfileView({
  isPublic = false,
  returnTo = "chat",
  name = "Member",
  handle = "",
  bio = "",
  totalPoints = "—",
  weeklyRank = "—",
  dayStreak = "—",
  tasksApproved = "—",
  currentProject = "",
  skills = [],
  portfolioUrl = "",
  githubUrl = "",
  linkedinUrl = "",
  avatarUrl,
  onEditProfile,
  onEditSkills,
  onEditProject,
}: ProfileProps) {
  return (
    <AppShell breadcrumbs={["PRAX", isPublic ? "Member profile" : "My profile"]}>
      {isPublic && (
        <Link
          href={`/${returnTo}`}
          className="mb-4 inline-block text-xs font-semibold text-primary hover:underline"
        >
          ← Back to {returnTo === "chat" ? "chat" : "leaderboard"}
        </Link>
      )}
      {/* Page Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          {isPublic ? "Member profile" : "My profile"}
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          {isPublic ? "A record of real work and growing skills" : "Your journey as a builder"}
        </p>
      </div>

      {/* Main Profile Header Card */}
      <Card className="overflow-hidden mb-6">
        {/* Banner Graphic with Tagline and 8-Ray Star */}
        <div className="h-32 sm:h-36 bg-gradient-to-r from-[#2A2366] via-[#1E194D] to-[#12102E] p-6 sm:p-8 flex items-center justify-between text-white relative">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase block mb-1">
              BUILDER / MAKER / LEARNER
            </span>
            <span className="text-xl sm:text-2xl font-bold tracking-tight">
              Small steps. Real things.
            </span>
          </div>
          <div className="opacity-30">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="12" y1="3" x2="12" y2="21" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="5.64" y1="5.64" x2="18.36" y2="18.36" />
              <line x1="5.64" y1="18.36" x2="18.36" y2="5.64" />
            </svg>
          </div>
        </div>

        {/* User Info Bar with Overlapping Avatar */}
        <div className="relative flex flex-col justify-between gap-6 p-6 sm:p-8 md:flex-row md:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <Avatar
              name={name}
              src={avatarUrl || undefined}
              size="xl"
              colorScheme="purple"
              className="-mt-12 self-start rounded-full ring-4 ring-surface shadow-md sm:-mt-18"
            />
            <div className="mb-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 className="min-w-0 max-w-full [overflow-wrap:anywhere] text-xl sm:text-2xl font-bold text-text tracking-tight">
                  {name}
                </h2>
                <span className="break-all text-xs sm:text-sm text-text-muted">{handle}</span>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-xl break-words leading-relaxed">
                {bio}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-primary">
                {[
                  { label: "Portfolio", url: portfolioUrl },
                  { label: "GitHub", url: githubUrl },
                  { label: "LinkedIn", url: linkedinUrl },
                ]
                  .filter((link) => isSafeUrl(link.url))
                  .map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {link.label} ↗
                    </a>
                  ))}
                {!isPublic && !portfolioUrl && (
                  <Button size="sm" variant="text" onClick={onEditProject}>
                    Add portfolio
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex shrink-0 items-center gap-2.5 self-start md:self-end">
            {isPublic ? (
              isSafeUrl(portfolioUrl) ? (
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white"
                >
                  View portfolio
                </a>
              ) : (
                <span className="text-xs text-text-muted">No portfolio shared</span>
              )
            ) : (
              <Button variant="primary" size="md" onClick={onEditProfile}>
                Edit profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 4 Standalone Stat Cards in a Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 flex flex-col gap-1">
          <span className="text-xs text-text-muted">Total points</span>
          <span className="text-2xl font-bold text-text tracking-tight">{totalPoints}</span>
        </Card>
        <Card className="p-5 flex flex-col gap-1">
          <span className="text-xs text-text-muted">Weekly rank</span>
          <span className="text-2xl font-bold text-primary tracking-tight">{weeklyRank}</span>
        </Card>
        <Card className="p-5 flex flex-col gap-1">
          <span className="text-xs text-text-muted">Day streak</span>
          <span className="text-2xl font-bold text-streak tracking-tight">{dayStreak}</span>
        </Card>
        <Card className="p-5 flex flex-col gap-1">
          <span className="text-xs text-text-muted">Tasks approved</span>
          <span className="text-2xl font-bold text-text tracking-tight">{tasksApproved}</span>
        </Card>
      </div>

      {/* Two Column Layout: Left (Skills + Currently Building) & Right (Momentum) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (6 cols): Skills & Interests + Currently Building */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Skills & Interests */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <h2 className="text-sm font-bold text-text">Skills &amp; interests</h2>
              {!isPublic && (
                <button
                  onClick={onEditSkills}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  Edit →
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 text-xs rounded-xl bg-surface-subtle border border-border text-text font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
            {!skills.length && (
              <p className="text-xs text-text-muted">
                {isPublic ? "No skills shared yet." : "Add your skills and interests with Edit."}
              </p>
            )}
          </Card>

          {/* Currently Building */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <h2 className="text-sm font-bold text-text">Currently building</h2>
              {isSafeUrl(portfolioUrl) ? (
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  See portfolio →
                </a>
              ) : !isPublic ? (
                <Button variant="text" size="sm" onClick={onEditProject}>
                  Add portfolio
                </Button>
              ) : null}
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-border flex items-center justify-center font-mono text-primary font-bold shrink-0">
                {"{}"}
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-text tracking-tight truncate">
                  {currentProject ||
                    (isPublic ? "No project shared yet" : "Add what you are building")}
                </h3>
                <span className="text-xs text-text-muted mt-1">
                  {currentProject
                    ? "Work in progress"
                    : "Share a project title and portfolio link."}
                </span>
              </div>
            </div>
            {!isPublic && (
              <Button variant="text" size="sm" onClick={onEditProject} className="mt-3">
                Edit current project
              </Button>
            )}
          </Card>
        </div>

        {/* Right (6 cols): Momentum Bar Chart */}
        <div className="lg:col-span-6">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
                <h2 className="text-sm font-bold text-text">Momentum</h2>
                <span className="text-xs text-text-muted font-medium">Last 8 weeks</span>
              </div>
              <p className="py-12 text-center text-xs text-text-muted">
                Activity will appear when it is available.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
