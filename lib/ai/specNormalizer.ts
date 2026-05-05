import {
  ARRAY_SPEC_KEYS,
  isJsonObject,
  isPlanningSpecContent,
  JsonObject,
  JsonValue,
  PlanningSpecContent,
  PlanningSpecItem,
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

function normalizeJsonValue(value: unknown): JsonValue | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => normalizeJsonValue(item))
      .filter((item): item is JsonValue => item !== undefined);

    return items;
  }

  if (isJsonObject(value)) {
    const normalized: JsonObject = {};

    for (const [key, item] of Object.entries(value)) {
      const normalizedKey = key.trim();

      if (!normalizedKey) {
        continue;
      }

      const normalizedValue = normalizeJsonValue(item);

      if (normalizedValue !== undefined) {
        normalized[normalizedKey] = normalizedValue;
      }
    }

    return normalized;
  }

  return undefined;
}

function isEmptyJsonObject(value: JsonObject) {
  return Object.keys(value).length === 0;
}

function normalizePlanningSpecItem(value: unknown): PlanningSpecItem | null {
  if (typeof value === "string") {
    const text = value.trim();
    return text ? text : null;
  }

  if (isJsonObject(value)) {
    const normalized = normalizeJsonValue(value);

    if (!isJsonObject(normalized) || isEmptyJsonObject(normalized)) {
      return null;
    }

    return normalized;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function normalizeSpecItemArray(value: unknown) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new InvalidSpecFormatError();
  }

  return value
    .map((item) => normalizePlanningSpecItem(item))
    .filter((item): item is PlanningSpecItem => item !== null);
}

function getQuestionText(item: PlanningSpecItem) {
  if (typeof item === "string") {
    return item;
  }

  const preferred = [item.question, item.title, item.description, item.notes];

  for (const value of preferred) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return JSON.stringify(item);
}

function normalizeQuestionFingerprint(item: PlanningSpecItem) {
  return getQuestionText(item)
    .toLowerCase()
    .replace(/[?!.,:;'"`()[\]{}~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeOpenQuestions(items: PlanningSpecItem[]) {
  const seen = new Set<string>();
  const deduped: PlanningSpecItem[] = [];

  for (const item of items) {
    const fingerprint = normalizeQuestionFingerprint(item);

    if (!fingerprint || seen.has(fingerprint)) {
      continue;
    }

    seen.add(fingerprint);
    deduped.push(item);
  }

  return deduped;
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
    const items = normalizeSpecItemArray(source[key]);
    normalized[key] = key === "openQuestions" ? dedupeOpenQuestions(items) : items;
  }

  if (!isPlanningSpecContent(normalized)) {
    throw new InvalidSpecFormatError();
  }

  return normalized;
}
