"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface RubricItem {
  id: string;
  num: string;
  title: string;
  description: string;
  ptsRange: string;
}

export default function AdminPointsRulesPage() {
  const [rubricItems] = useState<RubricItem[]>([
    {
      id: "1",
      num: "01",
      title: "Clear proof",
      description: "A reviewer should verify the evidence in less than a minute.",
      ptsRange: "0 - 10 pts",
    },
    {
      id: "2",
      num: "02",
      title: "Quality of work",
      description: "Correctness, polish, and matching the task checklist.",
      ptsRange: "0 - 15 pts",
    },
    {
      id: "3",
      num: "03",
      title: "Explanation",
      description: "Simple reasoning, documented choices and reproducible results.",
      ptsRange: "0 - 10 pts",
    },
    {
      id: "4",
      num: "04",
      title: "Going the extra mile",
      description: "Small optional bonus for exceptional effort.",
      ptsRange: "0 - 5 pts",
    },
  ]);

  return (
    <AppShell breadcrumbs={["PRAX", "Points Rules"]} variant="admin">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Points Rules</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">Clear standards build trust</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Published Scoring Rubric */}
        <Card className="lg:col-span-7 p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-6">
            <div>
              <h2 className="text-base font-bold text-text">Published scoring rubric</h2>
              <span className="text-xs text-text-muted mt-0.5 block">
                One transparent standard, visible to both administrators and members.
              </span>
            </div>
            <Button variant="secondary" size="sm">
              Edit rubric
            </Button>
          </div>

          <div className="flex flex-col divide-y divide-border-subtle">
            {rubricItems.map((item) => (
              <div key={item.id} className="py-4 sm:py-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="text-xs font-mono font-bold text-primary p-2 rounded-lg bg-lavender/60 shrink-0">
                    {item.num}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text">{item.title}</span>
                    <span className="text-xs text-text-secondary mt-1 leading-relaxed">
                      {item.description}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs sm:text-sm text-text shrink-0">
                  {item.ptsRange}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column (5 cols): Member-facing Preview & Policy */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Member-facing Explanation Card */}
          <Card className="p-6 sm:p-7">
            <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase block mb-1">
              HOW POINTS WORK
            </span>
            <h2 className="text-lg font-bold text-text mb-2">Earn points for verified work.</h2>
            <p className="text-xs text-text-muted leading-relaxed mb-6">
              Submit your task proof. Admins review your work and score against the published
              rubric.
            </p>

            <div className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle text-xs mb-4">
              <div className="py-2.5 flex justify-between">
                <span className="text-text-secondary">Clear proof</span>
                <span className="font-mono font-bold text-text">0 - 10</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-text-secondary">Quality of work</span>
                <span className="font-mono font-bold text-text">0 - 15</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-text-secondary">Explanation</span>
                <span className="font-mono font-bold text-text">0 - 10</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-text-secondary">Going the extra mile</span>
                <span className="font-mono font-bold text-text">0 - 5</span>
              </div>
            </div>
          </Card>

          {/* Fair Scoring By Design Card */}
          <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text">Fair scoring by design</span>
              <Badge variant="success" size="sm">
                APPROVAL REQUIRED
              </Badge>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Rules apply to future reviews. Previously approved point awards stay unchanged.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
