"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface SubmissionItem {
  id: string;
  taskTitle: string;
  submittedAt: string;
  status: "Approved" | "Awaiting review" | "Rejected";
  points: string;
  feedback: string;
  actionText: string;
  actionHref: string;
}

const mockSubmissions: SubmissionItem[] = [
  {
    id: "sub-1",
    taskTitle: "Redesign onboarding for a fintech app",
    submittedAt: "Oct 9 · 07:12",
    status: "Awaiting review",
    points: "-",
    feedback: "Awaiting admin feedback",
    actionText: "Edit / withdraw →",
    actionHref: "/tasks/4",
  },
  {
    id: "sub-2",
    taskTitle: "Add auth to a side project",
    submittedAt: "Oct 8 · 18:40",
    status: "Awaiting review",
    points: "-",
    feedback: "Review pending",
    actionText: "Edit / withdraw →",
    actionHref: "/tasks/1",
  },
  {
    id: "sub-3",
    taskTitle: "Open-source a small CLI utility",
    submittedAt: "Oct 7 · 22:05",
    status: "Rejected",
    points: "0 / 70",
    feedback: "README needs install steps.",
    actionText: "Resubmit →",
    actionHref: "/tasks/6",
  },
  {
    id: "sub-4",
    taskTitle: "Build a REST API for a habit tracker",
    submittedAt: "Oct 6 · 11:30",
    status: "Approved",
    points: "55 / 60",
    feedback: "Clean routes. Add rate limiting.",
    actionText: "View →",
    actionHref: "/tasks/3",
  },
  {
    id: "sub-5",
    taskTitle: "Design 6 micro-interactions",
    submittedAt: "Oct 5 · 09:02",
    status: "Approved",
    points: "30 / 30",
    feedback: "Polished and delightful.",
    actionText: "View →",
    actionHref: "/tasks/1",
  },
  {
    id: "sub-6",
    taskTitle: "Write a product teardown",
    submittedAt: "Oct 3 · 20:15",
    status: "Approved",
    points: "24 / 30",
    feedback: "Sharp insights; tighten the middle.",
    actionText: "View →",
    actionHref: "/tasks/5",
  },
];

export default function SubmissionsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockSubmissions.filter((s) =>
    s.taskTitle.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: SubmissionItem["status"]) => {
    switch (status) {
      case "Approved":
        return <Badge variant="success">Approved</Badge>;
      case "Awaiting review":
        return <Badge variant="warning">Awaiting review</Badge>;
      case "Rejected":
        return <Badge variant="danger">Rejected</Badge>;
    }
  };

  return (
    <AppShell breadcrumbs={["PRAX", "My submissions"]}>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">My submissions</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Every proof you sent, and what came back
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Submitted"
          value="11"
          subtext="All time"
          icon={<span className="text-primary text-sm">📋</span>}
          iconBg="bg-lavender"
        />
        <StatCard
          label="Approved"
          value="8"
          subtext="Verified work"
          icon={<span className="text-emerald-600 text-sm">✓</span>}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Awaiting review"
          value="2"
          subtext="Feedback pending"
          icon={<span className="text-amber-600 text-sm">🕒</span>}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Rejected"
          value="1"
          subtext="Can resubmit"
          icon={<span className="text-red-500 text-sm">✕</span>}
          iconBg="bg-red-50"
        />
      </div>

      {/* Submissions Table Card */}
      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border-subtle">
          <h2 className="text-base font-bold text-text">Submission history</h2>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or filter…"
              className="bg-background border border-border text-xs rounded-xl px-3 py-1.5 w-full sm:w-64 focus-visible:outline-none focus-visible:border-primary text-text placeholder:text-text-faint"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-border-subtle/50 text-text-muted font-bold tracking-wider uppercase text-[10px] border-b border-border-subtle">
              <tr>
                <th className="py-3 px-5 sm:px-6">TASK</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">POINTS</th>
                <th className="py-3 px-4">REVIEWER FEEDBACK</th>
                <th className="py-3 px-5 sm:px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-surface-hover/70 transition-colors">
                  <td className="py-4 px-5 sm:px-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-text text-sm">{item.taskTitle}</span>
                      <span className="text-[11px] text-text-muted mt-0.5">{item.submittedAt}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                  <td className="py-4 px-4 font-mono font-medium text-text whitespace-nowrap">
                    {item.points}
                  </td>
                  <td className="py-4 px-4 text-text-secondary max-w-xs truncate">
                    {item.feedback}
                  </td>
                  <td className="py-4 px-5 sm:px-6 text-right whitespace-nowrap">
                    <Link
                      href={item.actionHref}
                      className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                    >
                      {item.actionText}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
