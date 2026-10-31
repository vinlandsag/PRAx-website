"use client";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Notice, SegmentedControl, Skeleton } from "@/components/ui";
import { apiRequest } from "@/lib/api/client";
import type { SessionUser } from "@/lib/auth/types";

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" label="Loading sign in" />}>
      <LoginForm />
    </Suspense>
  );
}
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest<{ user: SessionUser }>(
        mode === "signin" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "signin" ? { email, password } : { email, password, name, inviteCode }
          ),
        }
      );
      if (!result.user?.id) throw new Error("Sign-in could not be confirmed. Please try again.");
      const callback = params.get("callbackUrl");
      const safeCallback =
        callback?.startsWith("/") &&
        !callback.startsWith("//") &&
        !/[\\\x00-\x20]/.test(callback) &&
        !callback.startsWith("/login");
      router.push(
        result.user.status === "PENDING_APPROVAL"
          ? "/onboarding"
          : safeCallback && callback
            ? callback
            : result.user.role === "ADMIN"
              ? "/admin"
              : "/dashboard"
      );
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="flex min-h-screen flex-col bg-background md:flex-row">
      <div className="flex flex-col justify-between bg-sidebar p-8 text-white md:w-1/2 lg:p-16">
        <span className="text-xl font-extrabold tracking-wider">PRAX</span>
        <div className="max-w-md py-12">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-sidebar-text">
            A place for people who build
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Build.
            <br />
            Learn.
            <br />
            Grow together.
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-sidebar-text">
            An invite-only community where real work becomes real progress.
          </p>
        </div>
        <p className="text-xs text-sidebar-text">Purpose-driven. Verified work.</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md rounded-panel border border-border bg-surface p-6 shadow-card sm:p-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-primary">
            Welcome to PRAX
          </p>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Sign in to your workspace" : "Join with an invitation"}
          </h2>
          <div className="my-6">
            <SegmentedControl
              label="Account access"
              value={mode}
              onChange={(value) => {
                setMode(value);
                setError("");
              }}
              options={[
                { value: "signin", label: "Sign in" },
                { value: "invite", label: "Invite code" },
              ]}
            />
          </div>
          {error && (
            <div className="mb-4 break-words">
              <Notice tone="danger">{error}</Notice>
            </div>
          )}
          <form className="space-y-4" onSubmit={submit}>
            {mode === "invite" && (
              <>
                <Input
                  label="Full name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
                <Input
                  label="Invite code"
                  autoComplete="off"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  disabled={loading}
                />
              </>
            )}
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              label={mode === "signin" ? "Password" : "Create password"}
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" isLoading={loading} className="w-full">
              {mode === "signin" ? "Sign in" : "Request access"}
            </Button>
          </form>
          <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-text-muted">
            Only approved members can enter PRAX. Contact your workspace administrator if you need
            an invitation.
          </p>
        </div>
      </div>
    </main>
  );
}
