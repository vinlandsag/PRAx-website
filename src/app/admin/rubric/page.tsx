"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type { Rubric, RubricCriterion } from "@/lib/rubric/types";

export default function AdminPointsRulesPage() {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<RubricCriterion[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Fetch active rubric from server
  useEffect(() => {
    let cancelled = false;
    async function loadRubric() {
      try {
        const res = await fetch("/api/rubric");
        if (!res.ok) {
          throw new Error(`Failed to load rubric (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (!cancelled && data.rubric) {
          setRubric(data.rubric);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load rubric.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadRubric();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenEdit = () => {
    if (!rubric) return;
    setEditingCriteria(rubric.criteria.map((c) => ({ ...c })));
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCriterionChange = (
    index: number,
    field: keyof RubricCriterion,
    value: string | number
  ) => {
    setEditingCriteria((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddCriterion = () => {
    const nextNum = String(editingCriteria.length + 1).padStart(2, "0");
    const newId = `crit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setEditingCriteria((prev) => [
      ...prev,
      {
        id: newId,
        num: nextNum,
        title: "New Criterion",
        description: "Criterion description and verification standard.",
        maxPoints: 5,
      },
    ]);
  };

  const handleRemoveCriterion = (index: number) => {
    if (editingCriteria.length <= 1) {
      setSaveError("Rubric must contain at least one criterion.");
      return;
    }
    setEditingCriteria((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveRubric = async () => {
    setSaveLoading(true);
    setSaveError(null);

    // Client-side quick check
    for (const c of editingCriteria) {
      if (!c.title.trim()) {
        setSaveError("Every criterion must have a title.");
        setSaveLoading(false);
        return;
      }
      if (!c.description.trim()) {
        setSaveError("Every criterion must have a description.");
        setSaveLoading(false);
        return;
      }
      if (typeof c.maxPoints !== "number" || c.maxPoints <= 0 || !Number.isInteger(c.maxPoints)) {
        setSaveError("Maximum points must be a positive integer.");
        setSaveLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/rubric", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria: editingCriteria }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to update rubric.");
      }

      const data = await res.json();
      setRubric(data.rubric);
      setIsEditing(false);
      setSuccessNotice(
        `Rubric updated to ${data.rubric.version}! (${data.rubric.totalMaxPoints} total max pts)`
      );
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error saving rubric.");
    } finally {
      setSaveLoading(false);
    }
  };

  const currentCriteria = rubric?.criteria || [];
  const currentTotal = rubric?.totalMaxPoints || 0;
  const editingTotal = editingCriteria.reduce((sum, c) => sum + (Number(c.maxPoints) || 0), 0);

  return (
    <AppShell breadcrumbs={["PRAX", "Points Rules"]} variant="admin">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Points Rules</h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">Clear standards build trust</p>
        </div>
        {rubric && (
          <Badge variant="lavender" size="sm" className="w-fit">
            Version {rubric.version}
          </Badge>
        )}
      </div>

      {/* Success notification */}
      {successNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>✓ {successNotice}</span>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <Card className="lg:col-span-7 p-8 h-96 animate-pulse bg-surface" />
          <Card className="lg:col-span-5 p-8 h-96 animate-pulse bg-surface" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-sm font-bold text-text">Failed to Load Scoring Rubric</h3>
          <p className="text-xs text-text-muted">{error}</p>
        </Card>
      )}

      {/* Main Rubric View */}
      {!loading && !error && rubric && (
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
              <Button variant="secondary" size="sm" onClick={handleOpenEdit}>
                Edit rubric
              </Button>
            </div>

            <div className="flex flex-col divide-y divide-border-subtle">
              {currentCriteria.map((item) => (
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
                    0 - {item.maxPoints} pts
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-bold text-text">
              <span className="text-text-muted">Total Max Evaluation Score:</span>
              <span className="font-mono text-sm text-primary">{currentTotal} pts</span>
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
                {currentCriteria.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between">
                    <span className="text-text-secondary">{item.title}</span>
                    <span className="font-mono font-bold text-text">0 - {item.maxPoints}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs pt-1 font-bold">
                <span className="text-text">Standard Task Base</span>
                <span className="font-mono text-primary">{currentTotal} pts max</span>
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
                Rules apply to future reviews. Previously approved point awards stay unchanged in
                the ledger.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rubric Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Scoring Rubric">
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-text-muted">
            Configure the evaluation criteria and maximum points. Saving creates a new rubric
            version applied to future submission reviews.
          </p>

          {saveError && (
            <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-danger text-xs font-medium">
              ⚠️ {saveError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {editingCriteria.map((c, index) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-background border border-border flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded bg-lavender/60">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <input
                      type="text"
                      value={c.title}
                      onChange={(e) => handleCriterionChange(index, "title", e.target.value)}
                      placeholder="Criterion title"
                      className="text-xs font-bold text-text bg-surface border border-border rounded-lg px-2.5 py-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] text-text-muted">Max pts:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={c.maxPoints}
                      onChange={(e) =>
                        handleCriterionChange(index, "maxPoints", parseInt(e.target.value, 10) || 0)
                      }
                      className="w-16 text-xs font-mono font-bold text-text bg-surface border border-border rounded-lg px-2 py-1.5 text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                    />
                    {editingCriteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(index)}
                        className="text-xs text-danger hover:text-danger-hover px-1.5 py-1 cursor-pointer"
                        title="Remove criterion"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={c.description}
                  onChange={(e) => handleCriterionChange(index, "description", e.target.value)}
                  placeholder="Verification description..."
                  rows={2}
                  className="w-full text-xs text-text-secondary bg-surface border border-border rounded-lg p-2 resize-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={handleAddCriterion} type="button">
              + Add Criterion
            </Button>
            <div className="text-xs font-bold text-text">
              Total Score: <span className="text-primary font-mono">{editingTotal} pts</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveRubric}
              isLoading={saveLoading}
              type="button"
            >
              Save New Rubric
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
