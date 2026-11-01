"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Notice } from "@/components/ui";
import { ResourceState } from "@/components/ui/ResourceState";
import { useResource } from "@/lib/api/use-resource";
import { apiRequest } from "@/lib/api/client";
import type { SessionUser } from "@/lib/auth/types";
export default function OnboardingPage() {
  const router = useRouter();
  const api = useResource<{ user: SessionUser }>("/api/users/me");
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    let active = true;
    let checking = false;
    const checkApproval = async () => {
      if (checking) return;
      checking = true;
      try {
        const result = await apiRequest<{ user: SessionUser }>("/api/users/me");
        if (active && result.user.status === "APPROVED") {
          router.replace(result.user.role === "ADMIN" ? "/admin" : "/dashboard");
          router.refresh();
        }
      } catch {
        // Keep the waiting page visible; the member can use Check status to retry manually.
      } finally {
        checking = false;
      }
    };
    const timer = window.setInterval(() => void checkApproval(), 5_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [router]);
  const logout = async () => {
    setSigningOut(true);
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setSigningOut(false);
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg space-y-5 p-6 sm:p-10">
        <p className="text-sm font-extrabold tracking-wider">PRAX</p>
        <h1 className="text-2xl font-bold">Account access</h1>
        {error && <Notice tone="danger">{error}</Notice>}
        {!api.data ? (
          <ResourceState
            loading={api.loading}
            error={api.error}
            onRetry={() => void api.refresh()}
          />
        ) : (
          <>
            <p className="text-sm">{api.data.user.name}</p>
            <Notice>
              {api.data.user.status === "PENDING_APPROVAL"
                ? "Your application is awaiting administrator review."
                : "Account status: " + api.data.user.status.toLowerCase().replaceAll("_", " ")}
            </Notice>
            {api.data.user.status === "PENDING_APPROVAL" && (
              <p role="status" className="text-sm text-text-muted">
                This page checks for approval automatically. You can leave it open; workspace access
                will be available after an administrator approves your account.
              </p>
            )}
            {api.data.user.status === "APPROVED" ? (
              <Button
                onClick={() =>
                  router.push(api.data!.user.role === "ADMIN" ? "/admin" : "/dashboard")
                }
              >
                Open workspace
              </Button>
            ) : (
              <Button onClick={() => void api.refresh()}>Check status</Button>
            )}
          </>
        )}
        <Button variant="secondary" isLoading={signingOut} onClick={() => void logout()}>
          Sign out
        </Button>
      </Card>
    </main>
  );
}
