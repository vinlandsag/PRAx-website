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
