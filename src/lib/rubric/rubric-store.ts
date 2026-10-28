/**
 * src/lib/rubric/rubric-store.ts
 *
 * In-memory thread-safe store for the PRAX Scoring Rubric.
 * Implements editable scoring criteria and versioning according to MVP_SPEC.md §10 (P1)
 * and API_CONTRACTS.md (IC-06).
 */

export interface RubricCriterion {
  id: string;
  num: string;
  title: string;
  description: string;
  maxPoints: number;
}

export interface Rubric {
  id: string;
  version: string;
  criteria: RubricCriterion[];
  totalMaxPoints: number;
  updatedAt: string;
  updatedById?: string;
}

export interface RubricVersionRecord {
  version: string;
  criteria: RubricCriterion[];
  totalMaxPoints: number;
  updatedAt: string;
  updatedById: string;
}

// Initial canonical rubric matching reference UI and PDF
const initialCriteria: RubricCriterion[] = [
  {
    id: "crit_proof",
    num: "01",
    title: "Clear proof",
    description: "A reviewer should verify the evidence in less than a minute.",
    maxPoints: 10,
  },
  {
    id: "crit_quality",
    num: "02",
    title: "Quality of work",
    description: "Correctness, polish, and matching the task checklist.",
    maxPoints: 15,
  },
  {
    id: "crit_explanation",
    num: "03",
    title: "Explanation",
    description: "Simple reasoning, documented choices and reproducible results.",
    maxPoints: 10,
  },
  {
    id: "crit_extra",
    num: "04",
    title: "Going the extra mile",
    description: "Small optional bonus for exceptional effort.",
    maxPoints: 5,
  },
];

class RubricStore {
  private activeRubric: Rubric;
  private history: RubricVersionRecord[] = [];
  private versionCounter = 1;

  constructor() {
    this.activeRubric = {
      id: "rubric_prax_default",
      version: "v1",
      criteria: initialCriteria.map((c) => ({ ...c })),
      totalMaxPoints: initialCriteria.reduce((sum, c) => sum + c.maxPoints, 0),
      updatedAt: new Date().toISOString(),
      updatedById: "system",
    };
    this.history.push({
      version: "v1",
      criteria: initialCriteria.map((c) => ({ ...c })),
      totalMaxPoints: this.activeRubric.totalMaxPoints,
      updatedAt: this.activeRubric.updatedAt,
      updatedById: "system",
    });
  }

  /**
   * Returns a copy of the active rubric.
   */
  public getActiveRubric(): Rubric {
    return {
      ...this.activeRubric,
      criteria: this.activeRubric.criteria.map((c) => ({ ...c })),
    };
  }

  /**
   * Returns full version history of the rubric.
   */
  public getVersionHistory(): RubricVersionRecord[] {
    return this.history.map((h) => ({
      ...h,
      criteria: h.criteria.map((c) => ({ ...c })),
    }));
  }

  /**
   * Validates criteria payload according to strict server rules.
   */
  public validateCriteria(criteria: unknown): { valid: boolean; error?: string } {
    if (!Array.isArray(criteria)) {
      return { valid: false, error: "Criteria must be an array." };
    }
    if (criteria.length === 0) {
      return { valid: false, error: "Rubric must contain at least one criterion." };
    }

    const seenIds = new Set<string>();
    for (let i = 0; i < criteria.length; i++) {
      const c = criteria[i];
      if (!c || typeof c !== "object") {
        return { valid: false, error: `Criterion at index ${i} is invalid.` };
      }

      const { id, title, description, maxPoints } = c as Partial<RubricCriterion>;

      if (!id || typeof id !== "string" || id.trim().length === 0) {
        return { valid: false, error: `Criterion at index ${i} is missing a valid id.` };
      }
      if (seenIds.has(id)) {
        return { valid: false, error: `Duplicate criterion id '${id}'.` };
      }
      seenIds.add(id);

      if (!title || typeof title !== "string" || title.trim().length < 2) {
        return {
          valid: false,
          error: `Criterion '${id}' must have a title of at least 2 characters.`,
        };
      }

      if (!description || typeof description !== "string" || description.trim().length < 5) {
        return {
          valid: false,
          error: `Criterion '${id}' must have a description of at least 5 characters.`,
        };
      }

      if (
        typeof maxPoints !== "number" ||
        !Number.isInteger(maxPoints) ||
        maxPoints <= 0 ||
        maxPoints > 1000
      ) {
        return {
          valid: false,
          error: `Criterion '${id}' maxPoints must be an integer between 1 and 1000.`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Updates rubric criteria, increments version, and stores immutable version record.
   */
  public updateRubric(criteria: RubricCriterion[], updatedById: string): Rubric {
    this.versionCounter += 1;
    const newVersion = `v${this.versionCounter}`;
    const totalMaxPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0);
    const now = new Date().toISOString();

    // Re-index numbering: 01, 02, 03...
    const formattedCriteria = criteria.map((c, idx) => ({
      ...c,
      num: String(idx + 1).padStart(2, "0"),
      title: c.title.trim(),
      description: c.description.trim(),
    }));

    this.activeRubric = {
      id: "rubric_prax_default",
      version: newVersion,
      criteria: formattedCriteria,
      totalMaxPoints,
      updatedAt: now,
      updatedById,
    };

    this.history.push({
      version: newVersion,
      criteria: formattedCriteria.map((c) => ({ ...c })),
      totalMaxPoints,
      updatedAt: now,
      updatedById,
    });

    return this.getActiveRubric();
  }

  /**
   * Resets rubric store to initial state (for testing).
   */
  public reset(): void {
    this.versionCounter = 1;
    this.activeRubric = {
      id: "rubric_prax_default",
      version: "v1",
      criteria: initialCriteria.map((c) => ({ ...c })),
      totalMaxPoints: initialCriteria.reduce((sum, c) => sum + c.maxPoints, 0),
      updatedAt: new Date().toISOString(),
      updatedById: "system",
    };
    this.history = [
      {
        version: "v1",
        criteria: initialCriteria.map((c) => ({ ...c })),
        totalMaxPoints: this.activeRubric.totalMaxPoints,
        updatedAt: this.activeRubric.updatedAt,
        updatedById: "system",
      },
    ];
  }
}

export const rubricStore = new RubricStore();
