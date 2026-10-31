CREATE INDEX "Submission_userId_status_idx"
ON "Submission"("userId", "status");

CREATE INDEX "PointTransaction_createdAt_userId_idx"
ON "PointTransaction"("createdAt", "userId");
