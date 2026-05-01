export type SourceMessage = {
  role: string;
  content: string;
  createdAt: Date;
};

export type PlanningSpecContent = {
  title: string;
  summary: string;
  background: string;
  problem: string[];
  goal: string[];
  asIs: string[];
  toBe: string[];
  requirements: string[];
  userFlow: string[];
  screenSpecification: string[];
  policiesAndEdgeCases: string[];
  dataAndApi: string[];
  confirmedFacts: string[];
  assumptions: string[];
  acceptanceCriteria: string[];
  openQuestions: string[];
  actionItems: string[];
};

export const STRING_SPEC_KEYS = ["title", "summary", "background"] as const;

export const ARRAY_SPEC_KEYS = [
  "problem",
  "goal",
  "asIs",
  "toBe",
  "requirements",
  "userFlow",
  "screenSpecification",
  "policiesAndEdgeCases",
  "dataAndApi",
  "confirmedFacts",
  "assumptions",
  "acceptanceCriteria",
  "openQuestions",
  "actionItems",
] as const;

export const PLANNING_SPEC_KEYS = [
  ...STRING_SPEC_KEYS,
  ...ARRAY_SPEC_KEYS,
] as const;

export const PLANNING_SPEC_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: PLANNING_SPEC_KEYS,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    background: { type: "string" },
    problem: { type: "array", items: { type: "string" } },
    goal: { type: "array", items: { type: "string" } },
    asIs: { type: "array", items: { type: "string" } },
    toBe: { type: "array", items: { type: "string" } },
    requirements: { type: "array", items: { type: "string" } },
    userFlow: { type: "array", items: { type: "string" } },
    screenSpecification: { type: "array", items: { type: "string" } },
    policiesAndEdgeCases: { type: "array", items: { type: "string" } },
    dataAndApi: { type: "array", items: { type: "string" } },
    confirmedFacts: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
    acceptanceCriteria: { type: "array", items: { type: "string" } },
    openQuestions: { type: "array", items: { type: "string" } },
    actionItems: { type: "array", items: { type: "string" } },
  },
} as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isPlanningSpecContent(value: unknown): value is PlanningSpecContent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const spec = value as Record<string, unknown>;

  return (
    STRING_SPEC_KEYS.every((key) => typeof spec[key] === "string") &&
    ARRAY_SPEC_KEYS.every((key) => isStringArray(spec[key]))
  );
}
