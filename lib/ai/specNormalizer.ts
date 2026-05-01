import {
  ARRAY_SPEC_KEYS,
  isPlanningSpecContent,
  PlanningSpecContent,
  PLANNING_SPEC_KEYS,
  STRING_SPEC_KEYS,
} from "@/lib/ai/specSchema";

export class InvalidSpecFormatError extends Error {
  constructor() {
    super("AI returned an invalid spec format.");
    this.name = "InvalidSpecFormatError";
  }
}

const ALLOWED_SPEC_KEYS = new Set<string>(PLANNING_SPEC_KEYS);

function normalizeString(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw new InvalidSpecFormatError();
  }

  return value.trim();
}

function normalizeStringArray(value: unknown) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new InvalidSpecFormatError();
  }

  return value.map((item) => item.trim()).filter(Boolean);
}

export function normalizePlanningSpec(value: unknown): PlanningSpecContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidSpecFormatError();
  }

  const source = value as Record<string, unknown>;

  if (Object.keys(source).some((key) => !ALLOWED_SPEC_KEYS.has(key))) {
    throw new InvalidSpecFormatError();
  }

  const normalized: Partial<PlanningSpecContent> = {};

  for (const key of STRING_SPEC_KEYS) {
    normalized[key] = normalizeString(source[key]);
  }

  for (const key of ARRAY_SPEC_KEYS) {
    normalized[key] = normalizeStringArray(source[key]);
  }

  if (!isPlanningSpecContent(normalized)) {
    throw new InvalidSpecFormatError();
  }

  return normalized;
}
