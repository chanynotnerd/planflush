import type { JsonObject, JsonValue, PlanningSpecItem } from "@/lib/ai/specSchema";

const FIELD_LABELS: Record<string, string> = {
  id: "ID",
  title: "제목",
  description: "설명",
  priority: "우선순위",
  owner: "담당",
  type: "유형",
  method: "Method",
  endpoint: "Endpoint",
  screen: "화면",
  area: "영역",
  behavior: "동작",
  validation: "검증",
  emptyState: "빈 상태",
  loadingState: "로딩 상태",
  errorState: "오류 상태",
  asIs: "AS-IS",
  toBe: "TO-BE",
  policy: "정책",
  condition: "조건",
  expectedBehavior: "기대 동작",
  requestFields: "요청 필드",
  responseFields: "응답 필드",
  dataFields: "데이터 필드",
  validationRules: "검증 규칙",
  errorCases: "오류 케이스",
  components: "컴포넌트",
  edgeCases: "예외 케이스",
  acceptanceCriteria: "인수 조건",
  given: "GIVEN",
  when: "WHEN",
  then: "THEN",
  notes: "메모",
  dependsOn: "의존성",
  verification: "검증 방법",
};

const DISPLAY_FIELD_ORDER = [
  "id",
  "title",
  "description",
  "priority",
  "owner",
  "type",
  "method",
  "endpoint",
  "screen",
  "area",
  "asIs",
  "toBe",
  "policy",
  "condition",
  "expectedBehavior",
  "components",
  "behavior",
  "validation",
  "emptyState",
  "loadingState",
  "errorState",
  "requestFields",
  "responseFields",
  "dataFields",
  "validationRules",
  "errorCases",
  "edgeCases",
  "acceptanceCriteria",
  "given",
  "when",
  "then",
  "dependsOn",
  "verification",
  "notes",
];

function stringifyJsonValue(value: JsonValue): string {
  if (value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyJsonValue(item))
      .filter(Boolean)
      .join(", ");
  }

  return formatPlanningSpecObject(value).join(" / ");
}

function getOrderedEntries(value: JsonObject) {
  const knownKeys = DISPLAY_FIELD_ORDER.filter((key) => key in value);
  const extraKeys = Object.keys(value)
    .filter((key) => !knownKeys.includes(key))
    .sort();

  return [...knownKeys, ...extraKeys].map((key) => [key, value[key]] as const);
}

export function formatPlanningSpecObject(value: JsonObject): string[] {
  return getOrderedEntries(value)
    .map(([key, item]) => {
      const text = stringifyJsonValue(item);

      if (!text) {
        return "";
      }

      return `${FIELD_LABELS[key] ?? key}: ${text}`;
    })
    .filter(Boolean);
}

export function formatPlanningSpecItem(item: PlanningSpecItem): string {
  if (typeof item === "string") {
    return item;
  }

  return formatPlanningSpecObject(item).join("\n");
}

export function getPlanningSpecItemTitle(item: PlanningSpecItem): string {
  if (typeof item === "string") {
    return item;
  }

  const preferred = [
    item.title,
    item.description,
    item.screen,
    item.endpoint,
    item.name,
    item.policy,
  ];

  for (const value of preferred) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return formatPlanningSpecItem(item).split("\n")[0] ?? "";
}
