/**
 * src/lib/points/points-boundary.ts
 *
 * Person 1 ↔ Person 3 Points Transaction Boundary.
 *
 * Contractual Agreement:
 * - Person 1 (Head Lead & System Architect) validates review criteria, computes the score
 *   against the task maximum (0 <= points <= maxPoints), and dispatches the approved score.
 * - Person 3 (Backend & Data Lead) owns secure transactional point calculation, immutable ledger
 *   persistence (PointTransaction), and streak calculation.
 * - Person 1 DOES NOT create a second points ledger or directly modify user leaderboard totals.
 * - Person 1 calls this shared transaction boundary with an idempotency key to guarantee
 *   points are awarded exactly once.
 */

export interface PointsTransactionPayload {
  submissionId: string;
  userId: string;
  pointsAwarded: number;
  maxPoints: number;
  rubricVersion: string;
  reviewedById: string;
  taskTitle: string;
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
