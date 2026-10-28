"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "invite">("signin");
  const [authMethod, setAuthMethod] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("member@prax.build");
  const [password, setPassword] = useState("MemberPass123!");
  const [inviteCode, setInviteCode] = useState("PRAX-ALPHA-2026");
  const [fullName, setFullName] = useState("Arjun Varma");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === "signin") {
        if (authMethod === "password") {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();
          if (!res.ok) {
            setErrorMessage(data?.error?.message || "Authentication failed.");
            setLoading(false);
            return;
          }

          if (data.user?.status === "PENDING_APPROVAL") {
            router.push("/onboarding");
          } else if (data.user?.role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        } else {
          // Magic link request
          const res = await fetch("/api/auth/magic-link/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const data = await res.json();
          if (!res.ok) {
            setErrorMessage(data?.error?.message || "Failed to request magic link.");
            setLoading(false);
            return;
          }

          setSuccessMessage(
            data.token
              ? `Sign-in link created! (Dev token: ${data.token})`
              : "A secure sign-in link has been sent to your email."
          );
          setLoading(false);
        }
      } else {
        // Invite registration
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: password || "MemberPass123!",
            name: fullName,
            inviteCode,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data?.error?.message || "Registration failed.");
          setLoading(false);
          return;
        }

        router.push("/onboarding");
      }
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      {/* Left Column: Brand Hero with Mountain Illustration */}
      <div className="w-full md:w-1/2 bg-[#121524] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden select-none">
        {/* Subtle background starfield & mountain silhouette */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="skyGlow" cx="65%" cy="30%" r="50%">
                <stop offset="0%" stopColor="#4338CA" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#121524" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="mountain1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3730A3" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="mountain2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2E2880" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#121524" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#skyGlow)" />
            {/* Moon circle */}
            <circle cx="65%" cy="28%" r="90" fill="#4F46E5" opacity="0.15" />
            <circle cx="65%" cy="28%" r="65" fill="#6366F1" opacity="0.25" />
            {/* Stars */}
            <circle cx="15%" cy="18%" r="1.5" fill="#FFFFFF" opacity="0.7" />
            <circle cx="28%" cy="12%" r="1" fill="#FFFFFF" opacity="0.5" />
            <circle cx="45%" cy="25%" r="1.5" fill="#FFFFFF" opacity="0.8" />
            <circle cx="82%" cy="14%" r="1.2" fill="#FFFFFF" opacity="0.6" />
            <circle cx="75%" cy="40%" r="1" fill="#FFFFFF" opacity="0.4" />
            {/* Mountains */}
            <polygon points="-50,850 350,520 700,850" fill="url(#mountain1)" />
            <polygon points="200,850 550,460 950,850" fill="url(#mountain2)" />
            <polygon points="500,850 780,420 1150,850" fill="#1C1E38" />
            {/* Silhouette climber on peak */}
            <path d="M 548 440 L 552 440 L 552 458 L 546 460 Z" fill="#0F111E" />
          </svg>
        </div>

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-primary text-xl">✦</span>
          <span className="font-extrabold text-xl tracking-wider text-white">PRAX</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-md my-auto py-12">
          <span className="text-[11px] font-bold tracking-widest text-[#9CA3AF] uppercase block mb-3">
            A PLACE FOR PEOPLE WHO BUILD
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Build.
            <br />
            Learn.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
              Grow together.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[#9CA3AF] leading-relaxed">
            An invite-only community where real work becomes real progress.
          </p>
        </div>

        {/* Hero footer tag */}
        <div className="relative z-10 flex items-center gap-3 text-xs text-[#6B7280]">
          <span>Invite-only</span>
          <span className="h-3 w-px bg-[#374151]" />
          <span>Purpose-driven</span>
          <span className="h-3 w-px bg-[#374151]" />
          <span>Verified work</span>
        </div>
      </div>

      {/* Right Column: Sign In Form Card */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-card p-8 sm:p-10">
          <div className="text-left mb-6">
            <span className="text-[11px] font-bold tracking-widest text-primary uppercase block mb-1">
              WELCOME BACK
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text">
              Your next chapter starts here.
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Sign in to keep building with your community.
            </p>
          </div>

          {/* Toggle pill: Email vs Invite Code */}
          <div className="grid grid-cols-2 bg-border-subtle p-1 rounded-xl border border-border mb-6">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-surface text-text shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setMode("invite")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === "invite"
                  ? "bg-surface text-text shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Invite code
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-danger-subtle border border-danger-border text-xs text-danger flex items-center gap-2 mb-4">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-success-subtle border border-success-border text-xs text-success flex items-center gap-2 mb-4">
              <span>✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signin" ? (
              <>
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.dev"
                  required
                />
                {authMethod === "password" ? (
                  <>
                    <Input
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      required
                    />
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setAuthMethod("magic")}
                        className="text-xs text-primary hover:underline cursor-pointer"
                      >
                        Sign in with magic link instead
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setAuthMethod("password")}
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      Sign in with password instead
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <Input
                  label="Invite code"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="PRAX-ALPHA-2026"
                  required
                />
                <Input
                  label="Full name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Arjun Varma"
                  required
                />
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.dev"
                  required
                />
                <Input
                  label="Create password (optional)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                />
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
              rightIcon={<span>→</span>}
            >
              {mode === "signin" && authMethod === "magic"
                ? "Send magic sign-in link"
                : "Continue to PRAX"}
            </Button>
          </form>

          {/* Access policy notice */}
          <div className="mt-6 pt-6 border-t border-border-subtle flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-background border border-border flex items-center gap-2.5 text-xs text-text-muted">
              <span>🔒</span>
              <span>Only approved members can enter PRAX.</span>
            </div>

            <div className="text-center">
              <Link
                href="/onboarding"
                className="text-xs font-medium text-text-muted hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <span>Need an invite? Contact the administrator</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
