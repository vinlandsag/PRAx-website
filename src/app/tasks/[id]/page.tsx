"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { tasks } from "@/lib/workspace/catalog";
import { EmptyState, Skeleton } from "@/components/ui";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function TaskDetailPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" label="Loading task" />}>
      <TaskDetailContent />
    </Suspense>
  );
}
function TaskDetailContent() {
  const { id } = useParams<{ id: string }>();
  const task = tasks.find((t) => t.id === id);
  const [proofLink, setProofLink] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!task)
    return (
      <AppShell breadcrumbs={["PRAX", "Task not found"]}>
        <EmptyState title="Task not found" action={<Link href="/tasks">Back to tasks</Link>} />
      </AppShell>
    );
  return (
    <AppShell breadcrumbs={["PRAX", "Task detail"]}>
      {/* Category path */}
      <div className="mb-2 text-xs font-medium text-text-muted">
        <span>Tasks</span>
        <span className="mx-1.5">/</span>
        <span>{task.category}</span>
        <span className="mx-1.5">/</span>
        <span className="text-text font-semibold">{task.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-4">
        {/* Left Column (7 cols): Task Description, Checklist, Scoring Rubric */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="lavender">{task.status}</Badge>
              <span className="text-xs text-text-muted flex items-center gap-1">
                <span>🕒</span>
                <span>{task.deadline}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-3">
              {task.title}
            </h1>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
              {task.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-lavender text-lavender-text border border-lavender-border">
                {task.category}
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-border-subtle text-text-secondary border border-border">
                {task.pointsMax} points maximum
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-border-subtle text-text-secondary border border-border">
                Platform challenge
              </span>
            </div>

            {/* Acceptance Checklist */}
            <div className="pt-6 border-t border-border-subtle">
              <h2 className="text-sm font-bold text-text mb-3">Acceptance checklist</h2>
              <div className="flex flex-col gap-2.5 text-xs text-text-secondary">
                {(task.id === "1"
                  ? [
                      "Find a real query running slower than 500ms",
                      "Show the EXPLAIN plan before and after",
                      "Share the code diff in a public PR or gist",
                      "State the measurable performance improvement",
                    ]
                  : [
                      task.description,
                      "Share a working proof link",
                      "Explain your choices and results",
                    ]
                ).map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="h-4 w-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Scoring Rubric Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-text">How this task is scored</h2>
              <Link
                href="/admin/rubric"
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <span>Full points rules</span>
                <span>→</span>
              </Link>
            </div>
            <div className="flex flex-col divide-y divide-border-subtle text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-text-secondary font-medium">Clear evidence</span>
                <span className="font-mono font-bold text-text">0 - 10 pts</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-text-secondary font-medium">Quality of the fix</span>
                <span className="font-mono font-bold text-text">0 - 15 pts</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-text-secondary font-medium">Explanation</span>
                <span className="font-mono font-bold text-text">0 - 10 pts</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Submit Your Proof Card + Streak Reminder */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="p-6 sm:p-7">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-text">Submit your proof</h2>
              <Badge variant={submitted ? "success" : "warning"}>
                {submitted ? "SUBMITTED" : "DRAFT"}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mb-5">
              Good work deserves credit. Make your evidence easy to verify.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="flex flex-col gap-4"
            >
              <Input
                label="Proof link *"
                type="url"
                value={proofLink}
                onChange={(e) => setProofLink(e.target.value)}
                placeholder="https://github.com/..."
                leftIcon={<span>🔗</span>}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text">Note for reviewer</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="w-full bg-surface border border-border text-text text-xs sm:text-sm rounded-xl p-3 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  placeholder="Explain your choices..."
                />
              </div>

              {/* Screenshot Upload Placeholder */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text">Screenshot (optional)</label>
                <div className="border border-dashed border-border rounded-xl p-6 text-center bg-background hover:bg-surface-hover cursor-pointer transition-colors flex flex-col items-center justify-center">
                  <span className="text-primary text-xl font-light mb-1">+</span>
                  <span className="text-xs font-medium text-text">
                    Click to upload a screenshot
                  </span>
                  <span className="text-[10px] text-text-muted mt-0.5">
                    PNG or JPG · up to 5 MB
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                rightIcon={<span>→</span>}
              >
                {submitted ? "Proof submitted ✓" : "Submit for review"}
              </Button>

              <p className="text-[11px] text-text-muted text-center leading-tight">
                You can edit or withdraw until an admin reviews it
              </p>
            </form>
          </Card>

          {/* Make Today Count Streak Reminder */}
          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/70 flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text">Make today count</span>
              <span className="text-xs text-text-muted mt-0.5">
                Log in and submit one platform task to secure day 13 of your streak.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
