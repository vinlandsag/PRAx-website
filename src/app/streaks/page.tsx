"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function StreaksPage() {
  return (
    <AppShell breadcrumbs={["PRAX", "Streaks"]}>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Streaks</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Consistency is built, one day at a time
        </p>
      </div>

      {/* Top 2 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
        {/* Left Card (7 cols): Current Streak */}
        <Card className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">
                CURRENT STREAK
              </span>
              <Badge variant="warning">TODAY · NOT YET</Badge>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <span className="text-4xl sm:text-5xl">🔥</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text">
                  12
                </span>
                <span className="text-xl sm:text-2xl font-bold text-text-muted">days</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mb-6">
              One completed submission a day builds a lasting habit.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border-subtle text-xs">
            <div>
              <span className="text-text-muted block text-[11px]">Longest streak</span>
              <span className="text-base sm:text-lg font-bold text-text mt-0.5 block">26 days</span>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Active days / 30</span>
              <span className="text-base sm:text-lg font-bold text-text mt-0.5 block">26</span>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Today</span>
              <span className="text-base sm:text-lg font-bold text-warning-text mt-0.5 block">
                Pending
              </span>
            </div>
          </div>
        </Card>

        {/* Right Card (5 cols): Milestone Journey */}
        <Card className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-text">Milestone journey</h2>
            <span className="text-xs text-text-muted">Keep the flame alive</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-auto py-2">
            {[
              {
                days: "3 days",
                status: "Reached",
                reached: true,
                color: "bg-orange-50 border-orange-200 text-orange-600",
              },
              {
                days: "7 days",
                status: "Reached",
                reached: true,
                color: "bg-orange-50 border-orange-200 text-orange-600",
              },
              {
                days: "14 days",
                status: "2 days to go",
                reached: false,
                color: "bg-blue-50 border-blue-200 text-blue-600",
              },
              {
                days: "30 days",
                status: "Next goal",
                reached: false,
                color: "bg-purple-50 border-purple-200 text-purple-600",
              },
            ].map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex flex-col items-center text-center justify-center ${m.color}`}
              >
                <span className="text-xl mb-1">🔥</span>
                <span className="text-xs font-bold text-text">{m.days}</span>
                <span className="text-[10px] mt-0.5 font-medium opacity-90">{m.status}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-muted pt-4 border-t border-border-subtle">
            Reach 14 days to unlock the Consistent Builder badge on your public profile.
          </p>
        </Card>
      </div>

      {/* Bottom Grid: Activity Heat Map + How Streaks Work */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): Activity Heat Map */}
        <Card className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-text">Your activity</h2>
            <span className="text-xs text-text-muted">Last 6 weeks</span>
          </div>

          {/* 7 Columns for Days of week M-T-W-T-F-S-S x 6 Weeks */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center justify-between text-xs text-text-muted font-medium mb-3 px-1">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3, 4, 5].map((week) => (
                <div key={week} className="grid grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    // simulate active streak blocks matching PDF visual
                    const isActive =
                      (week === 5 && day < 5) ||
                      (week === 4 && day !== 3) ||
                      (week === 3 && day < 6) ||
                      (week === 2 && day > 1) ||
                      (week === 1 && day < 4) ||
                      (week === 0 && day === 1);

                    return (
                      <div
                        key={day}
                        className={`h-5 rounded-md transition-colors ${
                          isActive
                            ? "bg-streak shadow-2xs"
                            : "bg-warning-bg border border-warning-border"
                        }`}
                        title={`Week ${week + 1}, Day ${day + 1}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 text-[11px] text-text-muted mt-6 pt-4 border-t border-border-subtle">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-warning-bg border border-warning-border" />
              <span>Less activity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-streak" />
              <span>Streak day</span>
            </div>
          </div>
        </Card>

        {/* Right Column (5 cols): How Streaks Work */}
        <Card className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-text mb-4">How streaks work</h2>
            <div className="flex flex-col gap-3 text-xs text-text-secondary leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Log in and submit one general PRAX task each day.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Private to-dos do not count toward a streak.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>A missed day resets the current streak; longest stays.</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border-subtle">
            <Link href="/tasks">
              <Button variant="primary" size="md" className="w-full">
                → Browse today&apos;s tasks
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
