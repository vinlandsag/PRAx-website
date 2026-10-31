"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Notice, Skeleton } from "@/components/ui";
import type { PublicMemberDetail } from "@/lib/workspace/types";

export default function MemberProfilePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" label="Loading member profile" />}>
      <MemberProfileRoute />
    </Suspense>
  );
}
function MemberProfileRoute() {
  const { id } = useParams<{ id: string }>();
  const from = useSearchParams().get("from");
  return (
    <MemberProfile key={id} id={id} returnTo={from === "leaderboard" ? "leaderboard" : "chat"} />
  );
}
function MemberProfile({ id, returnTo }: { id: string; returnTo: "chat" | "leaderboard" }) {
  const [detail, setDetail] = useState<PublicMemberDetail | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    fetch(`/api/workspace?memberId=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || "Could not load this profile.");
        return result as PublicMemberDetail;
      })
      .then((result) => {
        if (active) {
          setDetail(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Could not load this profile.");
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  return detail ? (
    <ProfileView
      isPublic
      {...detail.profile}
      returnTo={returnTo}
      totalPoints="—"
      weeklyRank="—"
      dayStreak="—"
      tasksApproved="—"
    />
  ) : (
    <AppShell breadcrumbs={["PRAX", "Member profile"]}>
      {error ? (
        <Notice tone="danger">
          {error}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
            <Link href={`/${returnTo}`} className="font-semibold text-primary">
              Back to {returnTo}
            </Link>
          </div>
        </Notice>
      ) : (
        <Skeleton className="h-64" label="Loading member profile" />
      )}
    </AppShell>
  );
}
