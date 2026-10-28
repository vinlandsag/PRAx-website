"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  pointsMax: number;
  deadline: string;
  status: "Open" | "Pending" | "Approved" | "Rejected";
  statusNote?: string;
  thumbnailType: "code" | "terminal" | "bars" | "doc";
}

const mockTasks: TaskItem[] = [
  {
    id: "1",
    title: "Optimise one slow SQL query",
    description: "Profile a slow query, ship an improvement, and show your before/after data.",
    category: "Backend",
    pointsMax: 35,
    deadline: "Due in 2d",
    status: "Open",
    thumbnailType: "code",
  },
  {
    id: "2",
    title: "Ship a landing page in 3 hours",
    description: "Create a polished responsive page for a fictional product.",
    category: "Frontend",
    pointsMax: 40,
    deadline: "Due tomorrow",
    status: "Open",
    thumbnailType: "doc",
  },
  {
    id: "3",
    title: "Build a REST API for habits",
    description: "Build secure endpoints with authentication and tests.",
    category: "Backend",
    pointsMax: 60,
    deadline: "Completed",
    status: "Approved",
    statusNote: "+55 earned",
    thumbnailType: "terminal",
  },
  {
    id: "4",
    title: "Redesign a product onboarding",
    description: "Improve first-time user experience with clear flows.",
    category: "UI/UX Design",
    pointsMax: 50,
    deadline: "Under review",
    status: "Pending",
    thumbnailType: "bars",
  },
  {
    id: "5",
    title: "Write a thoughtful product teardown",
    description: "Study a tool you love and share sharp insights.",
    category: "Writing",
    pointsMax: 30,
    deadline: "No deadline",
    status: "Open",
    thumbnailType: "doc",
  },
  {
    id: "6",
    title: "Open-source a useful CLI tool",
    description: "Make a tiny developer tool that solves a real pain.",
    category: "Developer tools",
    pointsMax: 70,
    deadline: "Resubmit",
    status: "Rejected",
    thumbnailType: "terminal",
  },
];

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const filteredTasks = mockTasks.filter((t) => {
    if (activeTab === "open" && t.status !== "Open") return false;
    if (activeTab === "submitted" && t.status !== "Pending") return false;
    if (activeTab === "approved" && t.status !== "Approved") return false;
    if (activeTab === "rejected" && t.status !== "Rejected") return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: TaskItem["status"]) => {
    switch (status) {
      case "Approved":
        return <Badge variant="success">Approved</Badge>;
      case "Pending":
        return <Badge variant="warning">Pending</Badge>;
      case "Rejected":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="lavender">Open</Badge>;
    }
  };

  const renderThumbnail = (type: TaskItem["thumbnailType"]) => {
    switch (type) {
      case "terminal":
        return (
          <div className="w-16 h-16 rounded-xl bg-code-bg text-[9px] font-mono text-white p-2 flex flex-col justify-between shrink-0 shadow-xs border border-sidebar-hover">
            <span className="text-emerald-400">&gt; npm run</span>
            <span className="text-zinc-300">✓ passed</span>
            <span className="text-primary font-bold">&gt; _</span>
          </div>
        );
      case "code":
        return (
          <div className="w-16 h-16 rounded-xl bg-lavender text-primary flex items-center justify-center font-mono font-bold text-lg shrink-0 border border-lavender-border">
            &lt;/&gt;
          </div>
        );
      case "bars":
        return (
          <div className="w-16 h-16 rounded-xl bg-purple-50 flex items-center justify-center gap-1 p-2.5 shrink-0 border border-purple-100">
            <div className="w-2.5 h-10 rounded bg-primary/40" />
            <div className="w-2.5 h-7 rounded bg-primary/60" />
            <div className="w-2.5 h-9 rounded bg-primary" />
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 rounded-xl bg-border-subtle p-2 flex flex-col justify-center gap-1 shrink-0 border border-border">
            <div className="h-1.5 w-3/4 bg-text-muted/40 rounded-full" />
            <div className="h-1.5 w-full bg-text-muted/30 rounded-full" />
            <div className="h-1.5 w-1/2 bg-text-muted/20 rounded-full" />
          </div>
        );
    }
  };

  return (
    <AppShell breadcrumbs={["PRAX", "Tasks"]}>
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Tasks</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Pick a challenge, ship proof, and grow your craft
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <svg
            className="w-4 h-4 text-text-faint absolute left-3.5 top-3 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, categories or skills"
            className="w-full bg-surface border border-border pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select className="bg-surface border border-border text-xs rounded-xl px-3 py-2 text-text font-medium cursor-pointer focus-visible:outline-none">
            <option>Category: All</option>
            <option>Backend</option>
            <option>Frontend</option>
            <option>UI/UX Design</option>
            <option>Writing</option>
          </select>
          <select className="bg-surface border border-border text-xs rounded-xl px-3 py-2 text-text font-medium cursor-pointer focus-visible:outline-none">
            <option>Newest</option>
            <option>Highest points</option>
            <option>Closing soon</option>
          </select>
        </div>
      </div>

      {/* Pill Filter Tabs */}
      <div className="mb-6">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "all", label: "All", count: 24 },
            { id: "open", label: "Open", count: 14 },
            { id: "submitted", label: "Submitted", count: 2 },
            { id: "approved", label: "Approved", count: 6 },
            { id: "rejected", label: "Rejected", count: 2 },
          ]}
        />
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTasks.map((task) => (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <Card hoverEffect className="p-5 sm:p-6 flex flex-col justify-between h-full group">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  {renderThumbnail(task.thumbnailType)}
                  {getStatusBadge(task.status)}
                </div>

                <h3 className="text-base font-bold text-text group-hover:text-primary transition-colors tracking-tight mb-1.5">
                  {task.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                  {task.description}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-border-subtle flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-text-muted font-medium">
                  <span>{task.category}</span>
                  <span>·</span>
                  <span className="text-primary font-semibold">◆ {task.pointsMax} pts max</span>
                </div>
                <span className="text-text-muted text-[11px] font-medium">
                  {task.statusNote || task.deadline}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
