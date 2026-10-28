"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export default function DashboardPage() {
  return (
    <AppShell breadcrumbs={["PRAX", "Dashboard"]}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Dashboard</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Friday, October 9 · Your next good idea starts with one small step
        </p>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="This week"
          value="185 pts"
          subtext="40 more than last week"
          subtextTrend="up"
          icon={<span className="text-primary text-sm">✦</span>}
          iconBg="bg-lavender"
        />
        <StatCard
          label="Weekly rank"
          value="#7"
          subtext="Only 3 pts behind #6"
          icon={<span className="text-purple-600 text-sm">🏆</span>}
          iconBg="bg-purple-50"
        />
        <StatCard
          label="Awaiting review"
          value="02"
          subtext="Oldest submission: 9h"
          icon={<span className="text-blue-600 text-sm">🕒</span>}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Approval rate"
          value="88%"
          subtext="Your last 8 submissions"
          icon={<span className="text-emerald-600 text-sm">✓</span>}
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Featured Task + Recent Activity */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Featured Task Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2E2863] via-[#231F4F] to-[#171434] p-6 sm:p-8 text-white shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-start gap-4 z-10 max-w-md">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-200 uppercase">
                <span>✦ FEATURED TASK</span>
                <span>·</span>
                <span className="text-indigo-300">Due in 2 days</span>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                  Make the web feel a little better.
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
                  Build a beautifully responsive landing page for an imaginary product. Share the
                  live result and explain your choices.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-white border border-white/15">
                  Frontend
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-white border border-white/15">
                  40 pts max
                </span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Link href="/tasks/1">
                  <Button variant="primary" size="md">
                    View task →
                  </Button>
                </Link>
                <Link href="/space">
                  <Button
                    variant="ghost"
                    size="md"
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    Save to Space
                  </Button>
                </Link>
              </div>
            </div>

            {/* Illustrative mini browser preview */}
            <div className="shrink-0 w-64 bg-white/95 rounded-xl shadow-lg border border-white/20 p-3 hidden sm:block">
              <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-border-subtle">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-3/4 rounded bg-indigo-100" />
                <div className="h-2 w-full rounded bg-border-subtle" />
                <div className="h-2 w-5/6 rounded bg-border-subtle" />
                <div className="pt-2 flex gap-1.5">
                  <div className="h-6 w-1/3 rounded bg-primary/20" />
                  <div className="h-6 w-1/4 rounded bg-border-subtle" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle>Recent activity</CardTitle>
              <Link
                href="/submissions"
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <span>View all</span>
                <span>→</span>
              </Link>
            </CardHeader>
            <CardContent className="pt-0 divide-y divide-border-subtle">
              {/* Activity 1 */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-semibold text-text">
                      REST API for a habit tracker
                    </span>
                    <span className="text-xs text-text-muted">Approved yesterday</span>
                  </div>
                </div>
                <Badge variant="success">+55 pts</Badge>
              </div>

              {/* Activity 2 */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-lavender text-primary flex items-center justify-center shrink-0 text-xs">
                    ✦
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-semibold text-text">
                      New task published
                    </span>
                    <span className="text-xs text-text-muted">Optimise a slow SQL query</span>
                  </div>
                </div>
                <Badge variant="lavender">NEW</Badge>
              </div>

              {/* Activity 3 */}
              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 text-xs">
                    🕒
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-semibold text-text">
                      Fintech onboarding redesign
                    </span>
                    <span className="text-xs text-text-muted">Feedback will arrive soon</span>
                  </div>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Consistency & Weekly Leaderboard */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Consistency Card */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">
                YOUR CONSISTENCY
              </span>
              <Badge variant="warning" size="sm">
                Not yet today
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔥</span>
              <span className="text-2xl font-bold tracking-tight text-text">12 day streak</span>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Submit one platform task today to keep it going.
            </p>
            {/* Days row */}
            <div className="grid grid-cols-7 gap-1.5 pt-2 border-t border-border-subtle">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
                const isCompleted = idx < 5;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-medium text-text-muted">{day}</span>
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                        isCompleted
                          ? "bg-streak text-white shadow-2xs"
                          : "bg-background text-text-faint border border-border"
                      }`}
                    >
                      {isCompleted ? "●" : "○"}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Weekly Leaderboard Widget */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text">Weekly leaderboard</h3>
              <Link
                href="/leaderboard"
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <span>See rankings</span>
                <span>→</span>
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { rank: 4, name: "Sana Patel", pts: 201, color: "teal" as const },
                { rank: 5, name: "Dev Mehta", pts: 196, color: "blue" as const },
                { rank: 6, name: "Isha Rao", pts: 188, color: "purple" as const },
                { rank: 7, name: "You · Arjun", pts: 185, color: "purple" as const, isUser: true },
                { rank: 8, name: "Tara Bose", pts: 160, color: "orange" as const },
              ].map((row) => (
                <div
                  key={row.rank}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                    row.isUser
                      ? "bg-lavender/60 border border-lavender-border font-semibold"
                      : "hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-medium text-text-muted w-4">
                      {row.rank}
                    </span>
                    <Avatar name={row.name} size="xs" colorScheme={row.color} />
                    <span className="text-xs text-text">{row.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-text">{row.pts}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
