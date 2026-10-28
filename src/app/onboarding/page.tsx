"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusNotice(null);
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user?.status === "APPROVED") {
          router.push("/dashboard");
          return;
        } else {
          setStatusNotice(
            "Your application is still under review by the PRAX team. We appreciate your patience!"
          );
        }
      } else {
        setStatusNotice("Your application is queued for admin review.");
      }
    } catch {
      setStatusNotice("Your application is queued for admin review.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-between items-center p-6 sm:p-10 select-none">
      {/* Brand Header */}
      <header className="w-full max-w-2xl flex items-center justify-start py-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-accent flex items-center justify-center font-bold text-white text-base shadow-xs">
            P
          </div>
          <span className="font-extrabold text-lg tracking-wider text-text">PRAX</span>
        </Link>
      </header>

      {/* Center Card */}
      <main className="w-full max-w-xl bg-surface border border-border rounded-3xl shadow-card p-8 sm:p-12 text-center my-auto flex flex-col items-center">
        {/* Application Received Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-bg text-warning-text border border-warning-border text-xs font-semibold uppercase tracking-wider mb-8">
          <span aria-hidden="true">🕒</span>
          <span>APPLICATION RECEIVED</span>
        </div>

        {/* Large Green Check Circle */}
        <div className="h-16 w-16 rounded-full bg-success-dot text-white flex items-center justify-center text-2xl shadow-sm mb-6">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          You&apos;re in the queue, Arjun.
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-2 max-w-md leading-relaxed">
          We received your request for{" "}
          <strong className="text-text font-medium">arjun@studio.dev</strong>.<br />
          We&apos;ll send an email as soon as an administrator reviews it.
        </p>

        {/* 3-Step Horizontal Stepper */}
        <div className="w-full grid grid-cols-3 gap-2 my-10 relative">
          {/* Step 1: Completed */}
          <div className="flex flex-col items-center text-center">
            <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xs font-bold mb-2">
              ✓
            </div>
            <span className="text-xs font-semibold text-text">Request sent</span>
            <span className="text-[11px] text-text-muted mt-0.5">Oct 9 · 09:40</span>
          </div>

          {/* Step 2: Active / In Progress */}
          <div className="flex flex-col items-center text-center">
            <div className="h-8 w-8 rounded-full bg-warning-bg text-warning-text border border-warning-border flex items-center justify-center text-xs font-bold mb-2">
              2
            </div>
            <span className="text-xs font-semibold text-text">Admin review</span>
            <span className="text-[11px] text-warning-text font-medium mt-0.5">In progress</span>
          </div>

          {/* Step 3: Locked */}
          <div className="flex flex-col items-center text-center opacity-60">
            <div className="h-8 w-8 rounded-full bg-border-subtle text-text-muted border border-border flex items-center justify-center text-xs font-bold mb-2">
              3
            </div>
            <span className="text-xs font-semibold text-text-muted">Welcome in</span>
            <span className="text-[11px] text-text-faint mt-0.5">Access unlocked</span>
          </div>
        </div>

        {statusNotice && (
          <div className="mb-6 p-3 rounded-xl bg-warning-bg border border-warning-border text-xs text-warning-text flex items-center gap-2">
            <span>ℹ️</span>
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            leftIcon={<span>🕒</span>}
            isLoading={checking}
            onClick={handleCheckStatus}
            className="w-full sm:w-auto cursor-pointer"
          >
            Check status
          </Button>
          <Link href="/login">
            <Button variant="secondary" size="md" className="w-full sm:w-auto">
              Sign out
            </Button>
          </Link>
        </div>

        {/* What happens next box */}
        <div className="w-full mt-10 p-4 rounded-xl bg-background border border-border text-left flex items-start gap-3">
          <span className="text-text-muted text-sm mt-0.5">🛡️</span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-text">What happens next?</span>
            <span className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Admin approval protects this small, focused builder community.
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-xs text-text-faint py-4">
        PRAX · Built around doing, not scrolling.
      </footer>
    </div>
  );
}
