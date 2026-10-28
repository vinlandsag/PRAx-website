"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface Message {
  id: string;
  sender: string;
  avatarColor: "purple" | "orange" | "blue" | "teal" | "green";
  time: string;
  isOp?: boolean;
  content: string;
  link?: string;
  attachment?: string;
  reactions?: { emoji: string; count: number }[];
}

export default function ChatPage() {
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "Alex Ventura",
      avatarColor: "purple",
      time: "10:24 AM",
      isOp: true,
      content: "Just shipped the landing page challenge! So much fun building this. 🚀",
      link: "https://github.com/av/landing-demo",
      reactions: [
        { emoji: "♥", count: 12 },
        { emoji: "👏", count: 6 },
        { emoji: "👍", count: 3 },
      ],
    },
    {
      id: "2",
      sender: "Meera Shah",
      avatarColor: "orange",
      time: "10:28 AM",
      content: "The spacing looks amazing. Love the responsive detail.",
    },
    {
      id: "3",
      sender: "Rohan Das",
      avatarColor: "blue",
      time: "10:31 AM",
      content: "Anyone here working on the API task? Happy to swap feedback.",
    },
    {
      id: "4",
      sender: "Tara Bose",
      avatarColor: "purple",
      time: "10:46 AM",
      content: "Sharing the UI exploration I mentioned yesterday 👇",
      attachment: "Portfolio UI explorations · 3 images",
      reactions: [
        { emoji: "🔥", count: 6 },
        { emoji: "♥", count: 2 },
      ],
    },
    {
      id: "5",
      sender: "Dev Mehta",
      avatarColor: "teal",
      time: "11:02 AM",
      content: "Keep going! Seeing everyone build is inspiring.",
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "Arjun Varma",
        avatarColor: "purple",
        time: "Just now",
        content: messageText.trim(),
      },
    ]);
    setMessageText("");
  };

  return (
    <AppShell breadcrumbs={["PRAX", "Community chat"]}>
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Community chat</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Share what you built. Get useful feedback. Keep each other going.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Chat Stream (8 cols) */}
        <Card className="lg:col-span-8 overflow-hidden flex flex-col h-[750px]">
          {/* Channel Header */}
          <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between bg-surface">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">#</span>
                <h2 className="text-sm font-bold text-text">general</h2>
              </div>
              <span className="text-[11px] text-text-muted">
                One global channel · 63 builders active today
              </span>
            </div>
            <button
              onClick={() => setRulesModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
            >
              COMMUNITY RULES
            </button>
          </div>

          {/* Pinned announcement banner */}
          <div className="px-5 py-2.5 bg-lavender/40 border-b border-lavender-border flex items-center gap-2 text-xs text-lavender-text font-medium">
            <span>📌</span>
            <span>Pinned by admin: Share your work, give useful feedback, stay kind.</span>
          </div>

          {/* Message Feed */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3.5 group">
                <Avatar
                  name={msg.sender}
                  size="sm"
                  colorScheme={msg.avatarColor}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text">{msg.sender}</span>
                    <span className="text-[10px] text-text-muted">{msg.time}</span>
                    {msg.isOp && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                        OP
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {msg.content}
                  </p>
                  {msg.link && (
                    <a
                      href={msg.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>🔗</span>
                      <span>{msg.link}</span>
                    </a>
                  )}
                  {msg.attachment && (
                    <div className="mt-1 p-3 rounded-xl bg-background border border-border inline-flex items-center gap-2 text-xs text-text-secondary w-fit">
                      <span>🖼️</span>
                      <span>{msg.attachment}</span>
                    </div>
                  )}
                  {msg.reactions && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {msg.reactions.map((r, i) => (
                        <button
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-surface border border-border hover:border-primary text-xs font-medium text-text flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{r.emoji}</span>
                          <span className="text-[11px] font-mono">{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-border-subtle bg-surface flex items-center gap-2 sm:gap-3"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              maxLength={500}
              placeholder="Message #general..."
              className="flex-1 bg-background border border-border text-xs sm:text-sm rounded-xl px-4 py-2.5 text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:border-primary"
            />
            <span className="text-[11px] text-text-faint font-mono hidden sm:inline">
              {messageText.length}/500
            </span>
            <Button type="submit" variant="primary" size="md" rightIcon={<span>→</span>}>
              Send
            </Button>
          </form>
        </Card>

        {/* Right Column: Online Builders & Info (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Online Builders Card */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text">Online builders</h3>
              <span className="text-xs font-semibold text-emerald-600">13 online</span>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { name: "Meera Shah", color: "orange" as const },
                { name: "Alex Ventura", color: "purple" as const },
                { name: "Rohan Das", color: "blue" as const },
                { name: "Tara Bose", color: "purple" as const },
                { name: "Dev Mehta", color: "teal" as const },
              ].map((builder) => (
                <div key={builder.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={builder.name} size="sm" colorScheme={builder.color} isOnline />
                    <span className="text-xs font-semibold text-text">{builder.name}</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
          </Card>

          {/* Shared Room Notice */}
          <div className="p-4 rounded-2xl bg-surface border border-border flex items-start gap-3">
            <span className="text-lg">🔒</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text">
                A shared room for verified builders
              </span>
              <span className="text-xs text-text-muted mt-0.5 leading-relaxed">
                Chat is for connection and feedback. It never earns points.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Screen 14: Community Rules Modal */}
      <Modal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        badge="BEFORE YOU JOIN"
        title="A good community is built together."
        subtitle="A few simple ground rules keep PRAX welcoming and useful for everyone."
        maxWidth="md"
      >
        <div className="flex flex-col gap-3.5 my-2">
          {[
            { num: "1", text: "Share work and give constructive feedback." },
            { num: "2", text: "Respect people. Disagree with ideas, not identities." },
            { num: "3", text: "No promotions, spam, or private-message solicitation." },
            { num: "4", text: "Report problems. Moderators can remove or mute." },
          ].map((rule) => (
            <div
              key={rule.num}
              className="flex items-start gap-3 text-xs text-text-secondary leading-relaxed"
            >
              <span className="h-5 w-5 rounded-md bg-border-subtle font-bold text-text flex items-center justify-center shrink-0 text-[11px]">
                {rule.num}
              </span>
              <span>{rule.text}</span>
            </div>
          ))}
        </div>

        <div className="pt-5 mt-5 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptedRules}
              onChange={(e) => setAcceptedRules(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span>I understand the community rules</span>
          </label>
          <Button
            variant="primary"
            size="md"
            disabled={!acceptedRules}
            onClick={() => setRulesModalOpen(false)}
            rightIcon={<span>→</span>}
          >
            Enter community
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
