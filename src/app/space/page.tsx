"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Todo {
  id: string;
  title: string;
  subtext: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
}

export default function PersonalSpacePage() {
  const [activeTab, setActiveTab] = useState("todos");
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: "1",
      title: "Profile the feed query",
      subtext: "Linked to: Optimise SQL task · Today",
      priority: "High",
      completed: false,
    },
    {
      id: "2",
      title: "Sketch onboarding flow v2",
      subtext: "Personal project · Today",
      priority: "Medium",
      completed: false,
    },
    {
      id: "3",
      title: "Prepare portfolio update",
      subtext: "Portfolio · Tomorrow",
      priority: "Medium",
      completed: false,
    },
    {
      id: "4",
      title: "Read chapter 4",
      subtext: "Learning · Completed",
      priority: "Low",
      completed: true,
    },
  ]);
  const [newTodoText, setNewTodoText] = useState("");

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    setTodos((prev) => [
      {
        id: Date.now().toString(),
        title: newTodoText.trim(),
        subtext: "Personal project · Today",
        priority: "Medium",
        completed: false,
      },
      ...prev,
    ]);
    setNewTodoText("");
  };

  const getPriorityBadge = (p: Todo["priority"]) => {
    switch (p) {
      case "High":
        return (
          <Badge variant="danger" size="sm">
            High
          </Badge>
        );
      case "Medium":
        return (
          <Badge variant="info" size="sm">
            Medium
          </Badge>
        );
      case "Low":
        return (
          <Badge variant="lavender" size="sm">
            Low
          </Badge>
        );
    }
  };

  return (
    <AppShell breadcrumbs={["PRAX", "Personal Space"]}>
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Personal Space
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Plan privately. Build on your terms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-border-subtle text-text-muted text-xs font-medium border border-border">
            <span>🔒</span>
            <span>Private to you</span>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<span>+</span>}
            onClick={() => document.getElementById("new-todo-input")?.focus()}
          >
            New to-do
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "todos", label: "To-dos" },
            { id: "notes", label: "Notes", count: 6 },
            { id: "goals", label: "Goals", count: 3 },
          ]}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): To-dos Card */}
        <Card className="lg:col-span-8 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-text">Your to-dos</h2>
            <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
              <span>Today · 4</span>
              <span>·</span>
              <span>Upcoming · 6</span>
              <span>·</span>
              <span>Done · 12</span>
            </div>
          </div>

          {/* Quick Add Input */}
          <form onSubmit={handleAddTodo} className="relative mb-6">
            <input
              id="new-todo-input"
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="+ Add a to-do… ↵"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:border-primary"
            />
          </form>

          {/* To-do List */}
          <div className="flex flex-col divide-y divide-border-subtle">
            {todos.map((todo) => (
              <div key={todo.id} className="py-3.5 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0 ${
                      todo.completed
                        ? "bg-primary border-primary text-white"
                        : "border-border hover:border-primary bg-surface"
                    }`}
                  >
                    {todo.completed && "✓"}
                  </button>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        todo.completed ? "line-through text-text-muted" : "text-text"
                      }`}
                    >
                      {todo.title}
                    </span>
                    <span className="text-[11px] text-text-muted truncate">{todo.subtext}</span>
                  </div>
                </div>
                {getPriorityBadge(todo.priority)}
              </div>
            ))}
          </div>

          <div className="pt-6 mt-6 border-t border-border-subtle text-xs text-text-muted">
            Private by default · Completing to-dos does not affect PRAX points or streak.
          </div>
        </Card>

        {/* Right Column (4 cols): Goals & Quick Notes */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Your Goals Card */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text">Your goals</h3>
              <span className="text-xs text-primary font-semibold cursor-pointer hover:underline">
                Open all →
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { title: "Ship three side projects", pct: 66 },
                { title: "Master PostgreSQL internals", pct: 40 },
                { title: "Write every week", pct: 25 },
              ].map((goal, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text">{goal.title}</span>
                    <span className="font-mono text-text-muted">{goal.pct}%</span>
                  </div>
                  <div className="w-full bg-border-subtle h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${goal.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Notes Card */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text">Quick notes</h3>
              <span className="text-xs text-primary font-semibold cursor-pointer hover:underline">
                New note +
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-background border border-border flex flex-col gap-1.5">
              <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">
                IDEA / PRODUCT
              </span>
              <span className="text-xs font-bold text-text">Pricing page inspiration</span>
              <p className="text-xs text-text-secondary leading-relaxed">
                Try a split hero with spacious typography, tasteful motion, and a clear primary
                action.
              </p>
              <span className="text-[11px] text-primary font-medium mt-1 cursor-pointer hover:underline inline-flex items-center gap-1">
                <span>Research links & inspiration</span>
                <span>↗</span>
              </span>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
