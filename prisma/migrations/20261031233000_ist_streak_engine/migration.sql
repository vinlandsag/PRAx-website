CREATE TABLE "StreakDay" (
    "userId" TEXT NOT NULL,
    "activityDate" DATE NOT NULL,
    "lastApprovedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreakDay_pkey" PRIMARY KEY ("userId", "activityDate"),
    CONSTRAINT "StreakDay_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "StreakDay_activityDate_userId_idx" ON "StreakDay"("activityDate", "userId");
ALTER TABLE "StreakDay" ENABLE ROW LEVEL SECURITY;

-- Refresh one user's day markers and aggregates under a transaction-scoped lock.
-- Activity dates are derived from approved submissions, never from client input.
CREATE OR REPLACE FUNCTION public.refresh_streak_user(p_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_status "UserStatus";
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id, 0));

  SELECT "status" INTO v_user_status FROM "User" WHERE "id" = p_user_id;
  IF NOT FOUND OR v_user_status <> 'APPROVED' THEN
    RETURN;
  END IF;

  INSERT INTO "StreakDay" ("userId", "activityDate", "lastApprovedAt")
  SELECT s."userId", (s."reviewedAt" AT TIME ZONE 'Asia/Kolkata')::date, MAX(s."reviewedAt")
  FROM "Submission" s
  WHERE s."userId" = p_user_id
    AND s."status" = 'APPROVED'
    AND s."reviewedAt" IS NOT NULL
    AND s."reviewedAt" <= CURRENT_TIMESTAMP
  GROUP BY s."userId", (s."reviewedAt" AT TIME ZONE 'Asia/Kolkata')::date
  ON CONFLICT ("userId", "activityDate") DO UPDATE
    SET "lastApprovedAt" = GREATEST("StreakDay"."lastApprovedAt", EXCLUDED."lastApprovedAt");

  WITH day_groups AS (
    SELECT "activityDate",
      "activityDate" - ROW_NUMBER() OVER (ORDER BY "activityDate")::integer AS run_key
    FROM "StreakDay"
    WHERE "userId" = p_user_id
  ), runs AS (
    SELECT run_key, COUNT(*)::integer AS days, MAX("activityDate") AS run_end
    FROM day_groups
    GROUP BY run_key
  ), totals AS (
    SELECT COALESCE(MAX(days), 0)::integer AS longest,
      COALESCE(MAX(days) FILTER (
        WHERE run_end >= ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date - 1)
      ), 0)::integer AS current
    FROM runs
  ), last_approval AS (
    SELECT MAX("lastApprovedAt") AS last_approved_at
    FROM "StreakDay"
    WHERE "userId" = p_user_id
  )
  INSERT INTO "Streak" ("userId", "current", "longest", "lastApprovedAt", "updatedAt")
  SELECT p_user_id, totals.current, totals.longest, last_approval.last_approved_at, CURRENT_TIMESTAMP
  FROM totals CROSS JOIN last_approval
  ON CONFLICT ("userId") DO UPDATE SET
    "current" = EXCLUDED."current",
    "longest" = EXCLUDED."longest",
    "lastApprovedAt" = EXCLUDED."lastApprovedAt",
    "updatedAt" = CURRENT_TIMESTAMP;
END;
$$;

-- Used inside the same transaction that changes a submission to APPROVED and writes its points log.
CREATE OR REPLACE FUNCTION public.record_approved_submission_streak(p_submission_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id TEXT;
BEGIN
  SELECT s."userId" INTO v_user_id
  FROM "Submission" s
  JOIN "User" u ON u."id" = s."userId"
  WHERE s."id" = p_submission_id
    AND s."status" = 'APPROVED'
    AND s."reviewedAt" IS NOT NULL
    AND s."reviewedAt" <= CURRENT_TIMESTAMP
    AND u."status" = 'APPROVED';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  PERFORM public.refresh_streak_user(v_user_id);
  RETURN TRUE;
END;
$$;

-- Supabase Cron calls this once a day to catch up and reset stale active streaks.
CREATE OR REPLACE FUNCTION public.refresh_all_streaks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id TEXT;
  v_count INTEGER := 0;
BEGIN
  FOR v_user_id IN
    SELECT DISTINCT u."id"
    FROM "User" u
    LEFT JOIN "Submission" s ON s."userId" = u."id" AND s."status" = 'APPROVED'
      AND s."reviewedAt" IS NOT NULL AND s."reviewedAt" <= CURRENT_TIMESTAMP
    LEFT JOIN "StreakDay" d ON d."userId" = u."id"
    WHERE u."status" = 'APPROVED' AND (s."id" IS NOT NULL OR d."userId" IS NOT NULL)
    ORDER BY u."id"
  LOOP
    PERFORM public.refresh_streak_user(v_user_id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_streak_user(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_approved_submission_streak(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_all_streaks() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_streak_user(TEXT) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.record_approved_submission_streak(TEXT) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.refresh_all_streaks() TO service_role, postgres;
