/**
 * src/lib/points/points-boundary.ts
 *
 * Person 1 ↔ Person 3 Points Transaction Boundary.
 *
 * Contractual Agreement:
 * - Person 1's review flow dispatches the decision and score.
 * - The persistence boundary re-reads all authoritative records and atomically approves the
 *   submission and writes the immutable PointTransaction ledger entry.
 * - Person 1 DOES NOT create a second points ledger or directly modify user leaderboard totals.
 * - Person 1 calls this shared transaction boundary with an idempotency key to guarantee
 *   points are awarded exactly once.
 */

export interface PointsTransactionPayload {
  submissionId: string;
  pointsAwarded: number;
  rubricVersion: string;
  reviewedById: string;
  idempotencyKey: string;
}

export interface PointsBoundaryResult {
  success: boolean;
  transactionId?: string;
  idempotencyKey: string;
  pointsAwarded: number;
  alreadyProcessed: boolean;
  error?: string;
}
