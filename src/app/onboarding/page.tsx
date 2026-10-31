"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
