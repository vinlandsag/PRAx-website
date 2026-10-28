"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AdminTask {
  id: string;
  title: string;
  category: string;
  points: number;
  status: "Active" | "Draft" | "Archived";
  deadline: string;
  submissionsCount: number;
}

const mockAdminTasks: AdminTask[] = [
  {
    id: "1",
    title: "Optimise one slow SQL query",
    category: "Backend",
    points: 35,
    status: "Active",
    deadline: "Oct 11",
    submissionsCount: 14,
  },
  {
    id: "2",
    title: "Build a habit-tracker REST API",
    category: "Backend",
    points: 60,
    status: "Active",
    deadline: "-",
    submissionsCount: 8,
  },
  {
    id: "3",
    title: "Design 6 micro-interactions",
    category: "Design",
    points: 30,
    status: "Active",
    deadline: "-",
    submissionsCount: 18,
  },
  {
    id: "4",
    title: "Ship a landing page in 3 hours",
    category: "Frontend",
    points: 40,
    status: "Active",
    deadline: "Oct 10",
    submissionsCount: 11,
  },
  {
    id: "5",
    title: "Record a two-minute product demo",
    category: "Demo",
    points: 25,
    status: "Draft",
    deadline: "-",
    submissionsCount: 0,
  },
  {
    id: "6",
    title: "Write a thoughtful product teardown",
    category: "Writing",
    points: 30,
    status: "Active",
    deadline: "-",
    submissionsCount: 9,
  },
];

export default function AdminTaskManagerPage() {
  const [search, setSearch] = useState("");

  const filtered = mockAdminTasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell breadcrumbs={["PRAX", "Task Manager"]} variant="admin">
      {/* Title & Action */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Task Manager</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Create, refine and publish meaningful work
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <span className="px-2.5 py-1 rounded-lg bg-surface border border-border">24 TOTAL</span>
            <span className="px-2.5 py-1 rounded-lg bg-surface border border-border text-emerald-700">
              14 ACTIVE
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface border border-border text-amber-700">
              6 DRAFTS
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface border border-border">
              4 ARCHIVED
            </span>
          </div>
          <Link href="/admin/tasks/new">
            <Button variant="primary" size="md" leftIcon={<span>+</span>}>
              Create task
            </Button>
          </Link>
        </div>
      </div>

      {/* Published & Draft Tasks Table */}
      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border-subtle">
          <h2 className="text-base font-bold text-text">Published and draft tasks</h2>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks"
              className="bg-background border border-border text-xs rounded-xl px-3 py-1.5 w-full sm:w-64 focus-visible:outline-none focus-visible:border-primary text-text placeholder:text-text-faint"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-border-subtle/50 text-text-muted font-bold tracking-wider uppercase text-[10px] border-b border-border-subtle">
              <tr>
                <th className="py-3 px-5 sm:px-6">TASK</th>
                <th className="py-3 px-4">POINTS</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">DEADLINE</th>
                <th className="py-3 px-4">SUBMISSIONS</th>
                <th className="py-3 px-5 sm:px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((task) => (
                <tr key={task.id} className="hover:bg-surface-hover/70 transition-colors">
                  <td className="py-4 px-5 sm:px-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-text text-sm">{task.title}</span>
                      <span className="text-[11px] text-text-muted mt-0.5">
                        PRAX task · {task.category}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono font-medium text-text">{task.points} pts</td>
                  <td className="py-4 px-4">
                    {task.status === "Active" ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="warning">Draft</Badge>
                    )}
                  </td>
                  <td className="py-4 px-4 text-text-secondary">{task.deadline}</td>
                  <td className="py-4 px-4 font-mono font-medium text-text">
                    {task.submissionsCount}
                  </td>
                  <td className="py-4 px-5 sm:px-6 text-right whitespace-nowrap">
                    <Link
                      href="/admin/tasks/new"
                      className="text-xs font-semibold text-text-muted hover:text-primary transition-colors mr-3"
                    >
                      Edit
                    </Link>
                    <span className="text-text-faint mr-3">·</span>
                    <button className="text-xs font-semibold text-text-muted hover:text-text cursor-pointer">
                      Duplicate
                    </button>
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
