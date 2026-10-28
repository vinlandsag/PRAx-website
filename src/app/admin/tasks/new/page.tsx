"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function TaskEditorPage() {
  const [title, setTitle] = useState("Optimise one slow SQL query, show the diff");
  const [description, setDescription] = useState(
    "Find a query that is slower than 500ms. Profile it, fix it, and prove the difference with clear data."
  );
  const [category, setCategory] = useState("Backend");
  const [maxPoints, setMaxPoints] = useState("35");
  const [deadline, setDeadline] = useState("Oct 11 · 18:00");
  const [status, setStatus] = useState("Active");
  const [criteria, setCriteria] = useState([
    "Show measured runtime over 500ms",
    "Include the EXPLAIN output",
    "Link the code diff / PR",
    "Explain the percentage improvement",
  ]);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <AppShell breadcrumbs={["PRAX", "Task Editor"]} variant="admin">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Task Editor</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Design clear challenges with a transparent rubric
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Task Editor Form */}
        <Card className="lg:col-span-7 p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
            <h2 className="text-base font-bold text-text">Create a platform task</h2>
            <span className="text-xs text-text-muted font-medium">
              {savedNotice ? "✓ Saved just now" : "Draft saved just now"}
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="flex flex-col gap-4"
          >
            <Input
              label="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-surface border border-border text-xs sm:text-sm rounded-xl p-3 focus-visible:outline-none focus-visible:border-primary text-text"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-surface border border-border text-xs sm:text-sm rounded-xl px-3 py-2.5 text-text focus-visible:outline-none focus-visible:border-primary"
                >
                  <option>Backend</option>
                  <option>Frontend</option>
                  <option>UI/UX Design</option>
                  <option>Writing</option>
                  <option>Developer tools</option>
                </select>
              </div>

              <Input
                label="Maximum points"
                type="number"
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-surface border border-border text-xs sm:text-sm rounded-xl px-3 py-2.5 text-text focus-visible:outline-none focus-visible:border-primary"
                >
                  <option>Active</option>
                  <option>Draft</option>
                  <option>Archived</option>
                </select>
              </div>
            </div>

            {/* Rules & Acceptance Criteria */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-text block mb-2">
                Rules &amp; acceptance criteria
              </label>
              <div className="flex flex-col gap-2">
                {criteria.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-background border border-border text-xs text-text-secondary"
                  >
                    <span className="text-emerald-600 font-bold">✓</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...criteria];
                        updated[idx] = e.target.value;
                        setCriteria(updated);
                      }}
                      className="bg-transparent border-none p-0 w-full text-xs text-text focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-border-subtle mt-2">
              <Button type="submit" variant="primary" size="md">
                ✓ Save &amp; activate
              </Button>
              <Button type="button" variant="secondary" size="md" onClick={handleSave}>
                Save draft
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Column (5 cols): Live Member Preview */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
              <h2 className="text-sm font-bold text-text">Live member preview</h2>
              <span className="text-xs text-text-muted">What builders will see</span>
            </div>

            {/* Live Rendered Card */}
            <div className="border border-border rounded-2xl p-6 bg-surface shadow-xs flex flex-col gap-4">
              <div className="w-full h-24 rounded-xl bg-code-bg text-white p-3 font-mono text-xs flex flex-col justify-center border border-sidebar-hover">
                <span className="text-emerald-400">&gt; npm run build</span>
                <span className="text-zinc-300">✓ all tests passed</span>
                <span className="text-primary font-bold">&gt; _</span>
              </div>

              <div>
                <Badge variant="lavender" size="sm" className="mb-2">
                  OPEN
                </Badge>
                <h3 className="text-base font-bold text-text mb-1">{title || "Task Title"}</h3>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                  {description || "Task description preview..."}
                </p>
              </div>

              <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-text">{category}</span>
                  <span>·</span>
                  <span className="text-primary font-bold font-mono">◆ {maxPoints} pts max</span>
                </div>
                <Button variant="primary" size="sm">
                  View task →
                </Button>
              </div>
            </div>
          </Card>

          {/* Historical integrity reminder from PDF */}
          <div className="p-4 rounded-2xl bg-surface border border-border flex items-start gap-2.5 text-xs text-text-muted">
            <span className="text-primary text-sm mt-0.5">✦</span>
            <span>Changes to a published task should not alter historic approvals.</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
