"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [name, setName] = useState("Arjun Varma");
  const [handle, setHandle] = useState("@arjunbuilds");
  const [reviewNotifs, setReviewNotifs] = useState(true);
  const [streakReminder, setStreakReminder] = useState(true);
  const [allChatNotifs, setAllChatNotifs] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell breadcrumbs={["PRAX", "Settings"]}>
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Settings</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">Your account, your preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Category Pills (3 cols) */}
        <div className="lg:col-span-3 flex lg:flex-col gap-1.5 overflow-x-auto pb-2">
          {[
            { id: "account", label: "Account", icon: "👤" },
            { id: "appearance", label: "Appearance", icon: "☀️" },
            { id: "notifications", label: "Notifications", icon: "🔔" },
            { id: "privacy", label: "Privacy", icon: "🔒" },
            { id: "security", label: "Security", icon: "🛡️" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === item.id
                  ? "bg-lavender text-primary shadow-2xs"
                  : "text-text-muted hover:text-text hover:bg-surface"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right Side: Settings Cards (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* Card 1: Account */}
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between pb-6 border-b border-border-subtle mb-6">
              <div>
                <h2 className="text-base font-bold text-text">Account</h2>
                <span className="text-xs text-text-muted">Your PRAX identity</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Avatar name="Arjun Varma" size="lg" colorScheme="purple" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Arjun Varma</span>
                  <span className="text-xs text-text-muted">arjun@studio.dev</span>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                Change photo
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
            </div>
          </Card>

          {/* Card 2: Preferences */}
          <Card className="p-6 sm:p-8">
            <div className="pb-4 border-b border-border-subtle mb-4">
              <h2 className="text-base font-bold text-text">Preferences</h2>
              <span className="text-xs text-text-muted">Fine-tune your workspace</span>
            </div>

            <div className="flex flex-col divide-y divide-border-subtle">
              {/* Toggle 1 */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-semibold text-text">
                    Submission review notifications
                  </span>
                  <span className="text-xs text-text-muted mt-0.5">
                    Get an alert when an admin reviews your work.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewNotifs(!reviewNotifs)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative shrink-0 ${
                    reviewNotifs ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-xs transition-transform transform ${
                      reviewNotifs ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-semibold text-text">
                    Streak reminder
                  </span>
                  <span className="text-xs text-text-muted mt-0.5">
                    A gentle nudge if today has no submission.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStreakReminder(!streakReminder)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative shrink-0 ${
                    streakReminder ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-xs transition-transform transform ${
                      streakReminder ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-semibold text-text">
                    All chat messages
                  </span>
                  <span className="text-xs text-text-muted mt-0.5">
                    Notify for every new public chat message.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAllChatNotifs(!allChatNotifs)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative shrink-0 ${
                    allChatNotifs ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-xs transition-transform transform ${
                      allChatNotifs ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Card 3: Appearance & Privacy */}
          <Card className="p-6 sm:p-8">
            <h2 className="text-base font-bold text-text mb-4">Appearance &amp; privacy</h2>

            {/* Segmented Light/Dark mode */}
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex bg-border-subtle p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setThemeMode("light")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    themeMode === "light"
                      ? "bg-surface text-text shadow-xs"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <span>☀️</span>
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode("dark")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    themeMode === "dark"
                      ? "bg-surface text-text shadow-xs"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <span>◐</span>
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Public profile toggle */}
            <div className="py-4 border-t border-border-subtle flex items-center justify-between gap-4 mb-6">
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-semibold text-text">
                  Show portfolio on public profile
                </span>
                <span className="text-xs text-text-muted mt-0.5">
                  Other approved members can see your project links.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPortfolio(!showPortfolio)}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative shrink-0 ${
                  showPortfolio ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow-xs transition-transform transform ${
                    showPortfolio ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <Button variant="primary" size="md" leftIcon={<span>✓</span>} onClick={handleSave}>
              {saved ? "Changes saved ✓" : "Save changes"}
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
