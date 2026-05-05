export type SourceMessage = {
  role: string;
  content: string;
  createdAt: Date;
};

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = {
  [key: string]: JsonValue;
};
export type PlanningSpecItem = string | JsonObject;

export type PlanningSpecContent = {
  title: string;
  summary: string;
  background: string;
  problem: PlanningSpecItem[];
  goal: PlanningSpecItem[];
  asIs: PlanningSpecItem[];
  toBe: PlanningSpecItem[];
  requirements: PlanningSpecItem[];
  userFlow: PlanningSpecItem[];
  screenSpecification: PlanningSpecItem[];
  policiesAndEdgeCases: PlanningSpecItem[];
  dataAndApi: PlanningSpecItem[];
  confirmedFacts: PlanningSpecItem[];
  assumptions: PlanningSpecItem[];
  acceptanceCriteria: PlanningSpecItem[];
  openQuestions: PlanningSpecItem[];
  actionItems: PlanningSpecItem[];
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

const SPEC_ITEM_SCHEMA = {
  anyOf: [
    { type: "string" },
    {
      type: "object",
      additionalProperties: true,
    },
  ],
} as const;

export const PLANNING_SPEC_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: PLANNING_SPEC_KEYS,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    background: { type: "string" },
    problem: { type: "array", items: SPEC_ITEM_SCHEMA },
    goal: { type: "array", items: SPEC_ITEM_SCHEMA },
    asIs: { type: "array", items: SPEC_ITEM_SCHEMA },
    toBe: { type: "array", items: SPEC_ITEM_SCHEMA },
    requirements: { type: "array", items: SPEC_ITEM_SCHEMA },
    userFlow: { type: "array", items: SPEC_ITEM_SCHEMA },
    screenSpecification: { type: "array", items: SPEC_ITEM_SCHEMA },
    policiesAndEdgeCases: { type: "array", items: SPEC_ITEM_SCHEMA },
    dataAndApi: { type: "array", items: SPEC_ITEM_SCHEMA },
    confirmedFacts: { type: "array", items: SPEC_ITEM_SCHEMA },
    assumptions: { type: "array", items: SPEC_ITEM_SCHEMA },
    acceptanceCriteria: { type: "array", items: SPEC_ITEM_SCHEMA },
    openQuestions: { type: "array", items: SPEC_ITEM_SCHEMA },
    actionItems: { type: "array", items: SPEC_ITEM_SCHEMA },
  },
} as const;

export function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (isJsonObject(value)) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

function isPlanningSpecItem(value: unknown): value is PlanningSpecItem {
  return typeof value === "string" || (isJsonObject(value) && isJsonValue(value));
}

function isPlanningSpecItemArray(value: unknown): value is PlanningSpecItem[] {
  return Array.isArray(value) && value.every(isPlanningSpecItem);
}

export function isPlanningSpecContent(value: unknown): value is PlanningSpecContent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const spec = value as Record<string, unknown>;

  return (
    STRING_SPEC_KEYS.every((key) => typeof spec[key] === "string") &&
    ARRAY_SPEC_KEYS.every((key) => isPlanningSpecItemArray(spec[key]))
  );
}
