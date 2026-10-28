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

interface RecordedTransaction {
  transactionId: string;
  idempotencyKey: string;
  submissionId: string;
  userId: string;
  pointsAwarded: number;
  rubricVersion: string;
  recordedAt: string;
}

class PointsBoundaryService {
  private processedTransactions: Map<string, RecordedTransaction> = new Map();
  private shouldSimulateFailure = false;

  /**
   * Dispatches an approved score across the transaction boundary to Person 3's service.
   * Enforces strict idempotency based on `idempotencyKey`.
   */
  public async dispatchApprovedPoints(
    payload: PointsTransactionPayload
  ): Promise<PointsBoundaryResult> {
    const { idempotencyKey, pointsAwarded, submissionId, userId, rubricVersion } = payload;

    // Simulate failure mode for testing error handling and rollback
    if (this.shouldSimulateFailure) {
      return {
        success: false,
        idempotencyKey,
        pointsAwarded,
        alreadyProcessed: false,
        error: "POINTS_SERVICE_UNAVAILABLE: Transaction boundary simulated failure.",
      };
    }

    // Idempotency check: prevent duplicate point disbursements
    const existing = this.processedTransactions.get(idempotencyKey);
    if (existing) {
      return {
        success: true,
        transactionId: existing.transactionId,
        idempotencyKey,
        pointsAwarded: existing.pointsAwarded,
        alreadyProcessed: true,
      };
    }

    // Generate unique transaction identifier for Person 3's ledger
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const record: RecordedTransaction = {
      transactionId,
      idempotencyKey,
      submissionId,
      userId,
      pointsAwarded,
      rubricVersion,
      recordedAt: new Date().toISOString(),
    };

    this.processedTransactions.set(idempotencyKey, record);

    return {
      success: true,
      transactionId,
      idempotencyKey,
      pointsAwarded,
      alreadyProcessed: false,
    };
  }

  /**
   * Retrieves a processed transaction by idempotency key.
   */
  public getTransaction(idempotencyKey: string): RecordedTransaction | undefined {
    return this.processedTransactions.get(idempotencyKey);
  }

  /**
   * Configure simulated failure mode for rollback testing.
   */
  public setSimulateFailure(fail: boolean): void {
    this.shouldSimulateFailure = fail;
  }

  /**
   * Resets transaction history (for test isolation).
   */
  public reset(): void {
    this.processedTransactions.clear();
    this.shouldSimulateFailure = false;
  }
}

export const pointsBoundary = new PointsBoundaryService();
