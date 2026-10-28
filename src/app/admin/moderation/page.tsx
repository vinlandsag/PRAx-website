"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ReportedMessage {
  id: string;
  sender: string;
  senderHandle: string;
  avatarColor: "orange" | "blue" | "purple";
  time: string;
  reportCount: number;
  content: string;
  reason: string;
}

const initialReports: ReportedMessage[] = [
  {
    id: "1",
    sender: "Neil Joseph",
    senderHandle: "neil@dev.in",
    avatarColor: "orange",
    time: "08:47 today",
    reportCount: 3,
    content: "Check out my new course — DM me for a discount.",
    reason: "Reported for unsolicited promotion by 3 members.",
  },
  {
    id: "2",
    sender: "Dev Mehta",
    senderHandle: "dev@studio.co",
    avatarColor: "blue",
    time: "09:30 today",
    reportCount: 1,
    content: "This challenge is a joke. The admins have no clue.",
    reason: "Reported for non-constructive hostility.",
  },
  {
    id: "3",
    sender: "Tara Bose",
    senderHandle: "tara@build.dev",
    avatarColor: "purple",
    time: "10:12 today",
    reportCount: 1,
    content: "Repeated off-topic links and promotions.",
    reason: "Reported for spamming external portfolio links in #general.",
  },
];

export default function AdminChatModerationPage() {
  const [reports, setReports] = useState(initialReports);
  const [selectedId, setSelectedId] = useState("1");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selected = reports.find((r) => r.id === selectedId) || reports[0];

  const handleAction = (actionName: string) => {
    setActionNotice(`Action executed: ${actionName} on message by ${selected?.sender}.`);
    if (selected) {
      setReports((prev) => prev.filter((r) => r.id !== selected.id));
    }
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <AppShell breadcrumbs={["PRAX", "Chat Moderation"]} variant="admin">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Chat Moderation</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Keep the shared room respectful and useful
        </p>
      </div>

      {actionNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>✓ {actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Messages today"
          value="486"
          subtext="Across public chat"
          icon={<span className="text-purple-600 text-sm">💬</span>}
          iconBg="bg-purple-50"
        />
        <StatCard
          label="Active builders"
          value="63"
          subtext="Last 24 hours"
          icon={<span className="text-emerald-600 text-sm">👥</span>}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Open reports"
          value={reports.length.toString()}
          subtext="Awaiting moderation"
          icon={<span className="text-amber-600 text-sm">🛡️</span>}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Muted members"
          value="2"
          subtext="Temporary restrictions"
          icon={<span className="text-blue-600 text-sm">🔒</span>}
          iconBg="bg-blue-50"
        />
      </div>

      {/* Main Grid: Reported Messages + Review Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Reported Messages List */}
        <Card className="lg:col-span-7 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
            <h2 className="text-base font-bold text-text">Reported messages</h2>
            <Badge variant="warning">{reports.length} OPEN</Badge>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              All reported messages resolved!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map((msg) => {
                const isSelected = msg.id === selected?.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedId(msg.id)}
                    className={`p-4 rounded-xl transition-all cursor-pointer border flex flex-col gap-2 ${
                      isSelected
                        ? "bg-lavender/50 border-lavender-border shadow-2xs"
                        : "bg-surface border-border hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={msg.sender} size="sm" colorScheme={msg.avatarColor} />
                        <span className="text-xs font-bold text-text">{msg.sender}</span>
                        <span className="text-[10px] text-text-muted">{msg.time}</span>
                      </div>
                      <Badge variant="danger" size="sm">
                        {msg.reportCount} reports
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed pl-1">
                      {msg.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right Column (5 cols): Review Selected Report */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {selected && (
            <Card className="p-6 sm:p-7 flex flex-col gap-5">
              <h2 className="text-base font-bold text-text pb-3 border-b border-border-subtle">
                Review selected report
              </h2>

              <div className="flex items-center gap-3">
                <Avatar name={selected.sender} size="md" colorScheme={selected.avatarColor} />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">{selected.sender}</span>
                  <span className="text-xs text-text-muted">#general · {selected.time}</span>
                </div>
              </div>

              {/* Quote box */}
              <div className="p-4 rounded-xl bg-background border-l-4 border-primary text-xs italic text-text leading-relaxed">
                “{selected.content}”
              </div>

              <p className="text-xs text-text-muted">{selected.reason}</p>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
                <Button variant="primary" size="sm" onClick={() => handleAction("Deleted message")}>
                  Delete message
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAction("Muted 24 hours")}
                >
                  Mute 24 hours
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAction("Dismissed report")}>
                  Dismiss report
                </Button>
              </div>
            </Card>
          )}

          {/* Recent Moderation Log */}
          <Card className="p-5">
            <h3 className="text-xs font-bold text-text mb-3">Recent moderation</h3>
            <div className="flex flex-col gap-2.5 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Off-topic promotion removed · Yesterday</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-faint font-bold">🕒</span>
                <span>Temporary mute expired · Oct 7</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
