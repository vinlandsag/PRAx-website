"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("weekly");

  return (
    <AppShell breadcrumbs={["PRAX", "Leaderboard"]}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Leaderboard</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Verified work. Recognised progress.
        </p>
      </div>

      {/* Tabs & Reset Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <Tabs
          variant="segmented"
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "weekly", label: "Weekly" },
            { id: "alltime", label: "All-time" },
          ]}
        />
        <span className="text-xs text-text-muted font-medium">Resets Monday at 00:00 IST</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Podium + Ranked List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="p-6 sm:p-8">
            {/* 3-Step Visual Podium */}
            <div className="flex items-end justify-center gap-4 sm:gap-8 pb-8 pt-4 border-b border-border-subtle">
              {/* #2 Meera Shah (Silver) */}
              <div className="flex flex-col items-center">
                <Avatar name="Meera Shah" size="lg" colorScheme="purple" className="mb-2" />
                <span className="text-xs font-bold text-text">Meera Shah</span>
                <span className="text-[11px] text-text-muted mb-2 font-mono">268 points</span>
                <div className="w-20 sm:w-24 h-24 rounded-t-xl bg-purple-100/70 border border-purple-200/80 flex items-center justify-center font-bold text-2xl text-purple-700 shadow-2xs">
                  2
                </div>
              </div>

              {/* #1 Kabir Nair (Gold) */}
              <div className="flex flex-col items-center -mt-6">
                <span className="text-sm mb-1">👑</span>
                <Avatar
                  name="Kabir Nair"
                  size="xl"
                  colorScheme="orange"
                  className="mb-2 ring-4 ring-orange-200"
                />
                <span className="text-xs sm:text-sm font-bold text-text">Kabir Nair</span>
                <span className="text-[11px] text-text-muted mb-2 font-mono font-semibold">
                  301 points
                </span>
                <div className="w-24 sm:w-28 h-32 rounded-t-xl bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-3xl text-amber-700 shadow-xs">
                  1
                </div>
              </div>

              {/* #3 Rohan Das (Bronze) */}
              <div className="flex flex-col items-center">
                <Avatar name="Rohan Das" size="lg" colorScheme="blue" className="mb-2" />
                <span className="text-xs font-bold text-text">Rohan Das</span>
                <span className="text-[11px] text-text-muted mb-2 font-mono">212 points</span>
                <div className="w-20 sm:w-24 h-16 rounded-t-xl bg-blue-100/60 border border-blue-200 flex items-center justify-center font-bold text-2xl text-blue-700 shadow-2xs">
                  3
                </div>
              </div>
            </div>

            {/* Ranked List (Positions 4 - 8) */}
            <div className="flex flex-col divide-y divide-border-subtle pt-2">
              {[
                {
                  rank: "04",
                  initials: "SP",
                  name: "Sana Patel",
                  streak: "18 day streak",
                  pts: "201 pts",
                  color: "purple" as const,
                },
                {
                  rank: "05",
                  initials: "DM",
                  name: "Dev Mehta",
                  streak: "9 day streak",
                  pts: "196 pts",
                  color: "blue" as const,
                },
                {
                  rank: "06",
                  initials: "IR",
                  name: "Isha Rao",
                  streak: "12 day streak",
                  pts: "188 pts",
                  color: "teal" as const,
                },
                {
                  rank: "07",
                  initials: "AV",
                  name: "You · Arjun",
                  streak: "12 day streak",
                  pts: "185 pts",
                  isUser: true,
                  color: "purple" as const,
                },
                {
                  rank: "08",
                  initials: "TB",
                  name: "Tara Bose",
                  streak: "4 day streak",
                  pts: "160 pts",
                  color: "orange" as const,
                },
              ].map((row) => (
                <div
                  key={row.rank}
                  className={`py-3.5 px-3 flex items-center justify-between rounded-xl transition-colors ${
                    row.isUser
                      ? "bg-lavender/60 border border-lavender-border my-1"
                      : "hover:bg-surface-hover/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-text-muted w-6">
                      {row.rank}
                    </span>
                    <Avatar name={row.name} size="sm" colorScheme={row.color} />
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-semibold text-text">{row.name}</span>
                      <span className="text-[11px] text-text-muted">{row.streak}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs sm:text-sm text-text">
                    {row.pts}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (4 cols): Standing, How Points Work, Spotlight */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Your Standing Card */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-text">Your standing</h3>
              <Badge variant="lavender" size="sm">
                Weekly
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-extrabold text-primary">#7</span>
              <span className="text-xs text-text-muted">/ 312 builders</span>
            </div>
            <p className="text-xs font-medium text-text-muted mb-3">185 points this week</p>
            {/* Progress bar */}
            <div className="w-full bg-border-subtle h-2 rounded-full overflow-hidden mb-2">
              <div className="bg-primary h-full rounded-full w-[94%]" />
            </div>
            <p className="text-[11px] text-text-muted">Only 3 points to pass Isha Rao.</p>
          </Card>

          {/* How Points Work */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-text">How points work</h3>
              <Link
                href="/admin/rubric"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Full rules →
              </Link>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Only admin-approved platform tasks count toward ranking.
            </p>
            <div className="flex flex-col gap-2 text-xs border-y border-border-subtle py-3 mb-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Clear proof</span>
                <span className="font-mono font-bold text-text">0–10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Work quality</span>
                <span className="font-mono font-bold text-text">0–15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Explanation</span>
                <span className="font-mono font-bold text-text">0–10</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-background border border-border text-[11px] text-text-muted leading-relaxed">
              Personal to-dos and chat never change your rank.
            </div>
          </Card>

          {/* Consistency Spotlight */}
          <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col gap-1">
            <span className="text-xs font-bold text-text">Consistency spotlight</span>
            <span className="text-xs text-text-muted leading-relaxed">
              Leaderboard celebrates verified work, not time spent online.
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
