"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export interface ProfileProps {
  isPublic?: boolean;
  name?: string;
  handle?: string;
  bio?: string;
  totalPoints?: string;
  weeklyRank?: string;
  dayStreak?: string;
  tasksApproved?: string;
  currentProject?: string;
}

export function ProfileView({
  isPublic = false,
  name = "Arjun Varma",
  handle = "@arjunbuilds",
  bio = "Building useful things, learning in public, and sharing the process.",
  totalPoints = "1,240",
  weeklyRank = "#7",
  dayStreak = "12",
  tasksApproved = "24",
  currentProject = "A faster, friendlier developer dashboard",
}: ProfileProps) {
  return (
    <AppShell breadcrumbs={["PRAX", isPublic ? "Member profile" : "My profile"]}>
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
        <div className="p-6 sm:p-8 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-10 sm:-mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            <Avatar
              name={name}
              size="xl"
              colorScheme="purple"
              className="ring-4 ring-surface shadow-md"
            />
            <div className="mb-1">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-text tracking-tight">{name}</h2>
                <span className="text-xs sm:text-sm text-text-muted">{handle}</span>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-xl leading-relaxed">
                {bio}
              </p>

              {/* Social / Portfolio Links Row */}
              <div className="flex items-center gap-4 mt-3 text-xs font-medium text-text-muted">
                <a
                  href="https://portfolio.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>Portfolio</span>
                  <span className="text-[10px]">↗</span>
                </a>
                <span className="text-border">·</span>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>GitHub</span>
                  <span className="text-[10px]">↗</span>
                </a>
                <span className="text-border">·</span>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span>LinkedIn</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2.5 self-start md:self-end">
            {isPublic ? (
              <Button variant="primary" size="md">
                View portfolio
              </Button>
            ) : (
              <Button variant="primary" size="md">
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
                <button className="text-xs text-primary font-semibold hover:underline cursor-pointer">
                  Edit →
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {["Frontend", "Backend", "UI/UX Design", "Open source", "Product thinking"].map(
                (skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 text-xs rounded-xl bg-surface-subtle border border-border text-text font-medium"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </Card>

          {/* Currently Building */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <h2 className="text-sm font-bold text-text">Currently building</h2>
              <a
                href="https://portfolio.dev"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-semibold hover:underline"
              >
                See portfolio →
              </a>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-border flex items-center justify-center font-mono text-primary font-bold shrink-0">
                {"{}"}
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-text tracking-tight truncate">
                  {currentProject}
                </h3>
                <span className="text-xs text-text-muted mt-1">
                  Work in progress · Last updated 2 days ago
                </span>
              </div>
            </div>
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
              <div className="h-44 flex items-end justify-between gap-3 px-2 pt-6">
                {[
                  { week: "W1", height: "40%", val: 3 },
                  { week: "W2", height: "55%", val: 4 },
                  { week: "W3", height: "30%", val: 2 },
                  { week: "W4", height: "70%", val: 6 },
                  { week: "W5", height: "85%", val: 7 },
                  { week: "W6", height: "45%", val: 3 },
                  { week: "W7", height: "65%", val: 5 },
                  { week: "W8", height: "95%", val: 8 },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <span className="text-[10px] font-semibold text-text-muted">{item.val}</span>
                    <div
                      style={{ height: item.height }}
                      className={`w-full max-w-[32px] rounded-t-lg transition-all ${
                        idx === 7
                          ? "bg-primary shadow-xs"
                          : "bg-lavender-border hover:bg-primary/60"
                      }`}
                    />
                    <span className="text-[10px] font-medium text-text-muted">{item.week}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
