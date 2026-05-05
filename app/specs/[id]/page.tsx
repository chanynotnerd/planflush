"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { formatPlanningSpecItem } from "@/lib/ai/specFormatter";
import type {
  JsonObject,
  JsonValue,
  PlanningSpecContent,
  PlanningSpecItem,
} from "@/lib/ai/specSchema";
import styles from "./page.module.css";

type Spec = {
  id: number;
  projectId: number;
  title: string;
  contentJson: PlanningSpecContent;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    name: string;
  };
  publishLogs?: {
    notionUrl: string | null;
  }[];
};

type FlushResponse = {
  message: string;
  notionPageId?: string;
  notionPageUrl?: string;
};

type ToastState = {
  message: string;
  type: "success" | "error";
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type StringSpecKey = "title" | "summary" | "background";

type ArraySpecKey = Exclude<keyof PlanningSpecContent, StringSpecKey>;

type SpecSectionKey = keyof PlanningSpecContent;

type SpecCategoryKey =
  | "overview"
  | "problemDefinition"
  | "requirements"
  | "design"
  | "execution";

const OPEN_QUESTIONS_PREVIEW_LIMIT = 5;

const STRING_SECTIONS: { key: StringSpecKey; label: string; multiline: boolean }[] = [
  { key: "title", label: "제목", multiline: false },
  { key: "summary", label: "요약", multiline: true },
  { key: "background", label: "배경", multiline: true },
];

const ARRAY_SECTIONS: { key: ArraySpecKey; label: string }[] = [
  { key: "problem", label: "문제" },
  { key: "goal", label: "목표" },
  { key: "asIs", label: "AS-IS" },
  { key: "toBe", label: "TO-BE" },
  { key: "requirements", label: "요구사항" },
  { key: "userFlow", label: "사용자 흐름" },
  { key: "screenSpecification", label: "화면 명세" },
  { key: "policiesAndEdgeCases", label: "정책 및 예외 케이스" },
  { key: "dataAndApi", label: "데이터 및 API" },
  { key: "confirmedFacts", label: "확정 사실" },
  { key: "assumptions", label: "가정" },
  { key: "acceptanceCriteria", label: "인수 조건" },
  { key: "openQuestions", label: "미확정 사항" },
  { key: "actionItems", label: "액션 아이템" },
];

const SPEC_CATEGORIES: {
  key: SpecCategoryKey;
  label: string;
  description: string;
  sections: SpecSectionKey[];
}[] = [
  {
    key: "overview",
    label: "개요",
    description: "기획서의 제목, 요약, 배경을 정리합니다.",
    sections: ["title", "summary", "background"],
  },
  {
    key: "problemDefinition",
    label: "문제 정의",
    description: "현재 문제, 목표, AS-IS, TO-BE를 정리합니다.",
    sections: ["problem", "goal", "asIs", "toBe"],
  },
  {
    key: "requirements",
    label: "요구사항",
    description: "기능 요구사항, 사용자 흐름, 화면 명세를 정리합니다.",
    sections: ["requirements", "userFlow", "screenSpecification"],
  },
  {
    key: "design",
    label: "설계",
    description: "정책, 예외 케이스, 데이터/API 기준을 정리합니다.",
    sections: ["policiesAndEdgeCases", "dataAndApi"],
  },
  {
    key: "execution",
    label: "실행 관리",
    description: "액션 아이템과 미해결 사항을 정리합니다.",
    sections: ["actionItems", "openQuestions"],
  },
];

const CHIP_FIELD_KEYS = [
  "priority",
  "owner",
  "type",
  "method",
  "endpoint",
  "screen",
  "step",
  "actor",
];
const FIELD_LABELS: Record<string, string> = {
  title: "제목",
  description: "설명",
  priority: "우선순위",
  owner: "담당",
  type: "유형",
  method: "Method",
  endpoint: "Endpoint",
  screen: "화면",
  step: "단계",
  actor: "주체",
  action: "동작",
  condition: "조건",
  result: "결과",
  question: "질문",
  reason: "이유",
  impact: "영향",
  acceptanceCriteria: "인수 조건",
  notes: "메모",
};

const READABLE_FIELD_LABELS: Record<string, string> = {
  id: "ID",
  title: "제목",
  description: "설명",
  priority: "우선순위",
  owner: "담당",
  type: "유형",
  method: "Method",
  endpoint: "Endpoint",
  screen: "화면",
  step: "단계",
  actor: "사용자/주체",
  action: "동작",
  condition: "조건",
  result: "결과",
  question: "질문",
  reason: "이유",
  impact: "영향",
  asIs: "AS-IS",
  toBe: "TO-BE",
  dependsOn: "선행 작업",
  verification: "검증 기준",
  expectedBehavior: "기대 동작",
  validation: "검증",
  validationRules: "검증 규칙",
  errorCases: "오류 케이스",
  requestFields: "요청 필드",
  responseFields: "응답 필드",
  dataFields: "데이터 필드",
  acceptanceCriteria: "인수 조건",
  notes: "참고",
  policy: "정책",
  components: "컴포넌트",
  behavior: "동작",
  emptyState: "빈 상태",
  loadingState: "로딩 상태",
  errorState: "오류 상태",
  edgeCases: "예외 케이스",
  name: "이름",
};

const ENUM_VALUE_LABELS: Record<string, string> = {
  api: "API",
  data: "데이터",
  screen: "화면",
  policy: "정책",
  requirement: "요구사항",
  qa: "QA",
  fe: "FE",
  be: "BE",
  db: "DB",
  pm: "PM",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const HTTP_METHOD_LABELS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
]);

const ENUM_DISPLAY_FIELD_KEYS = new Set([
  "type",
  "owner",
  "priority",
  "method",
]);

const EMPTY_SPEC_CONTENT: PlanningSpecContent = {
  title: "",
  summary: "",
  background: "",
  problem: [],
  goal: [],
  asIs: [],
  toBe: [],
  requirements: [],
  userFlow: [],
  screenSpecification: [],
  policiesAndEdgeCases: [],
  dataAndApi: [],
  confirmedFacts: [],
  assumptions: [],
  acceptanceCriteria: [],
  openQuestions: [],
  actionItems: [],
};

function localizeApiMessage(message?: string) {
  switch (message) {
    case "Invalid spec id.":
      return "잘못된 기획서 ID입니다.";
    case "Spec not found.":
      return "기획서를 찾을 수 없습니다.";
    case "Invalid JSON body.":
      return "잘못된 요청 형식입니다.";
    case "Spec contentJson is required.":
      return "저장할 기획서 내용이 필요합니다.";
    case "Invalid spec contentJson.":
      return "기획서 JSON 형식이 올바르지 않습니다.";
    case "Spec contentJson appears to contain mojibake text.":
      return "깨진 한글로 보이는 내용이 있어 저장하지 않았습니다. 브라우저에서 다시 수정해 주십시오.";
    case "Failed to fetch spec.":
      return "기획서를 불러오지 못했습니다.";
    case "Failed to update spec.":
      return "기획서 저장에 실패했습니다.";
    case "NOTION_API_KEY is not configured.":
      return "NOTION_API_KEY가 설정되어 있지 않습니다.";
    case "NOTION_DATABASE_ID is not configured.":
      return "NOTION_DATABASE_ID가 설정되어 있지 않습니다.";
    case "Failed to publish spec to Notion.":
    case "Notion 배포에 실패했습니다.":
      return "Notion 배포에 실패했습니다.";
    case "Spec published to Notion.":
    case "Notion 배포가 완료되었습니다.":
      return "Notion 배포가 완료되었습니다.";
    default:
      return message ?? "";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

function arrayToTextarea(value: PlanningSpecItem[]) {
  return value
    .map((item) => formatPlanningSpecItem(item))
    .filter(Boolean)
    .join("\n\n");
}

function textareaToArray(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return [];
  }

  const separator = /\n\s*\n/.test(normalized) ? /\n\s*\n/ : /\r?\n/;

  return normalized
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

type ArrayDrafts = Record<ArraySpecKey, string>;

function createArrayDrafts(content: PlanningSpecContent): ArrayDrafts {
  return Object.fromEntries(
    ARRAY_SECTIONS.map(({ key }) => [key, arrayToTextarea(content[key])]),
  ) as ArrayDrafts;
}

function buildSpecContent(
  draft: PlanningSpecContent,
  arrayDrafts: ArrayDrafts,
): PlanningSpecContent {
  return {
    ...draft,
    ...Object.fromEntries(
      ARRAY_SECTIONS.map(({ key }) => [key, textareaToArray(arrayDrafts[key])]),
    ),
  } as PlanningSpecContent;
}

function isSpecContentEmpty(
  content: PlanningSpecContent,
  arrayDrafts: ArrayDrafts,
) {
  return (
    !content.title &&
    !content.summary &&
    !content.background &&
    ARRAY_SECTIONS.every(({ key }) => arrayDrafts[key].trim().length === 0)
  );
}

function getSectionId(key: SpecSectionKey) {
  return `section-${key}`;
}

function getStringSection(key: SpecSectionKey) {
  return STRING_SECTIONS.find((section) => section.key === key);
}

function getArraySection(key: SpecSectionKey) {
  return ARRAY_SECTIONS.find((section) => section.key === key);
}

function isSpecObject(value: PlanningSpecItem): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getFieldLabel(key: string) {
  return (
    READABLE_FIELD_LABELS[key] ??
    FIELD_LABELS[key] ??
    key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (value) => value.toUpperCase())
  );
}

function formatJsonValue(value: JsonValue): string {
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
    return value.map(formatJsonValue).filter(Boolean).join(", ");
  }

  return Object.entries(value)
    .map(([key, item]) => {
      const text = formatJsonValue(item);
      return text ? `${getFieldLabel(key)}: ${text}` : "";
    })
    .filter(Boolean)
    .join(" / ");
}

function formatSingleEnumLikeValue(key: string, value: string) {
  const text = value.trim();
  const normalized = text.toLowerCase();

  if (key === "method" && HTTP_METHOD_LABELS.has(normalized)) {
    return normalized.toUpperCase();
  }

  return ENUM_VALUE_LABELS[normalized] ?? text;
}

function formatEnumLikeValue(key: string, value: string) {
  const text = value.trim();

  if (!ENUM_DISPLAY_FIELD_KEYS.has(key)) {
    return formatSingleEnumLikeValue(key, text);
  }

  const slashParts = text.split("/").map((part) => part.trim());

  if (slashParts.length > 1 && slashParts.every(Boolean)) {
    return slashParts
      .map((part) => formatSingleEnumLikeValue(key, part))
      .join(" / ");
  }

  return formatSingleEnumLikeValue(key, text);
}

function formatDisplayValue(key: string, value: JsonValue): string {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? formatEnumLikeValue(key, item)
          : formatJsonValue(item),
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "string") {
    return formatEnumLikeValue(key, value);
  }

  return formatJsonValue(value);
}

function getObjectTitle(item: JsonObject) {
  const preferred = [
    item.title,
    item.question,
    item.description,
    item.action,
    item.screen,
    item.endpoint,
  ];

  for (const value of preferred) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "세부 항목";
}

function getFlowStepTitle(item: JsonObject, index: number) {
  const preferred = [item.title, item.action, item.description, item.result];

  for (const value of preferred) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return `${index + 1}단계`;
}

function getQuestionTitle(item: JsonObject) {
  const preferred = [item.question, item.title, item.description];

  for (const value of preferred) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "확인 필요 사항";
}

function getObjectChipEntries(item: JsonObject) {
  return CHIP_FIELD_KEYS.flatMap((key) => {
    const value = item[key];
    const text = value === undefined ? "" : formatDisplayValue(key, value);

    return text ? [{ key, label: getFieldLabel(key), text }] : [];
  });
}

function getObjectDetailEntries(item: JsonObject) {
  return Object.entries(item)
    .filter(([key]) => key !== "title" && !CHIP_FIELD_KEYS.includes(key))
    .map(([key, value]) => ({
      key,
      label: getFieldLabel(key),
      text: formatDisplayValue(key, value),
    }))
    .filter((entry) => entry.text);
}

function renderPlanningSpecItem(
  item: PlanningSpecItem,
  index: number,
  sectionKey: ArraySpecKey,
) {
  if (sectionKey === "userFlow") {
    if (!isSpecObject(item)) {
      return (
        <li className={styles.flowItem} key={`${index}-${item}`}>
          <span className={styles.flowStepNumber}>{index + 1}</span>
          <p className={styles.flowStepText}>{item}</p>
        </li>
      );
    }

    const chips = getObjectChipEntries(item);
    const details = getObjectDetailEntries(item);

    return (
      <li className={styles.flowItem} key={`${index}-${getFlowStepTitle(item, index)}`}>
        <span className={styles.flowStepNumber}>{index + 1}</span>
        <div className={styles.flowStepContent}>
          <h3 className={styles.objectItemTitle}>{getFlowStepTitle(item, index)}</h3>
          {chips.length > 0 ? (
            <div className={styles.chipRow}>
              {chips.map((chip) => (
                <span className={styles.itemChip} key={chip.key}>
                  {chip.label}: {chip.text}
                </span>
              ))}
            </div>
          ) : null}
          {details.length > 0 ? (
            <dl className={styles.fieldList}>
              {details.map((entry) => (
                <div className={styles.fieldRow} key={entry.key}>
                  <dt className={styles.fieldLabel}>{entry.label}</dt>
                  <dd className={styles.fieldValue}>{entry.text}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </li>
    );
  }

  if (sectionKey === "openQuestions") {
    if (!isSpecObject(item)) {
      return (
        <li className={styles.questionItem} key={`${index}-${item}`}>
          <span className={styles.questionBadge}>Q</span>
          <p className={styles.questionText}>{item}</p>
        </li>
      );
    }

    const chips = getObjectChipEntries(item);
    const details = getObjectDetailEntries(item);

    return (
      <li className={styles.questionItem} key={`${index}-${getQuestionTitle(item)}`}>
        <span className={styles.questionBadge}>Q</span>
        <div className={styles.questionContent}>
          <h3 className={styles.objectItemTitle}>{getQuestionTitle(item)}</h3>
          {chips.length > 0 ? (
            <div className={styles.chipRow}>
              {chips.map((chip) => (
                <span className={styles.itemChip} key={chip.key}>
                  {chip.label}: {chip.text}
                </span>
              ))}
            </div>
          ) : null}
          {details.length > 0 ? (
            <dl className={styles.fieldList}>
              {details.map((entry) => (
                <div className={styles.fieldRow} key={entry.key}>
                  <dt className={styles.fieldLabel}>{entry.label}</dt>
                  <dd className={styles.fieldValue}>{entry.text}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </li>
    );
  }

  if (!isSpecObject(item)) {
    return (
      <li className={styles.bulletItem} key={`${index}-${item}`}>
        {item}
      </li>
    );
  }

  const title = getObjectTitle(item);
  const chips = getObjectChipEntries(item);
  const details = getObjectDetailEntries(item);

  return (
    <li className={styles.objectItem} key={`${index}-${title}`}>
      <div className={styles.objectItemHeader}>
        <h3 className={styles.objectItemTitle}>{title}</h3>
        {chips.length > 0 ? (
          <div className={styles.chipRow}>
            {chips.map((chip) => (
              <span className={styles.itemChip} key={chip.key}>
                {chip.label}: {chip.text}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {details.length > 0 ? (
        <dl className={styles.fieldList}>
          {details.map((entry) => (
            <div className={styles.fieldRow} key={entry.key}>
              <dt className={styles.fieldLabel}>{entry.label}</dt>
              <dd className={styles.fieldValue}>{entry.text}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  );
}

function getVisibleSectionItems({
  items,
  isExpanded,
  sectionKey,
}: {
  items: PlanningSpecItem[];
  isExpanded: boolean;
  sectionKey: ArraySpecKey;
}) {
  if (sectionKey !== "openQuestions" || isExpanded) {
    return items;
  }

  return items.slice(0, OPEN_QUESTIONS_PREVIEW_LIMIT);
}

function ChevronIcon({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <svg
      className={styles.chevronIcon}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d={isCollapsed ? "m6 9 6 6 6-6" : "m18 15-6-6-6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SpecEditPage({ params }: PageProps) {
  const { id } = use(params);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [draft, setDraft] = useState<PlanningSpecContent>(EMPTY_SPEC_CONTENT);
  const [arrayDrafts, setArrayDrafts] = useState<ArrayDrafts>(() =>
    createArrayDrafts(EMPTY_SPEC_CONTENT),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishMessage, setPublishMessage] = useState("");
  const [notionPageUrl, setNotionPageUrl] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<SpecSectionKey>>(
    () => new Set(),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isOpenQuestionsExpanded, setIsOpenQuestionsExpanded] = useState(false);
  const [selectedCategoryKey, setSelectedCategoryKey] =
    useState<SpecCategoryKey>("overview");

  const selectedCategory =
    SPEC_CATEGORIES.find((category) => category.key === selectedCategoryKey) ??
    SPEC_CATEGORIES[0];

  const isEmpty = useMemo(
    () => isSpecContentEmpty(draft, arrayDrafts),
    [arrayDrafts, draft],
  );
  const latestNotionPageUrl = notionPageUrl || spec?.publishLogs?.[0]?.notionUrl || "";
  const hasPublishedToNotion = Boolean(
    latestNotionPageUrl || spec?.status === "Published",
  );
  const publishButtonLabel = isPublishing
    ? hasPublishedToNotion
      ? "재배포 중..."
      : "배포 중..."
    : hasPublishedToNotion
      ? "재배포"
      : "Notion으로 배포";
  const publishStatusLabel = publishError
    ? "Notion 배포 실패"
    : publishMessage || latestNotionPageUrl || spec?.status === "Published"
      ? "Notion 배포 완료"
      : "미배포";

  useEffect(() => {
    let cancelled = false;

    const loadSpec = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/specs/${id}`, { cache: "no-store" });
        const data = (await response.json()) as Spec | { message?: string };

        if (cancelled) {
          return;
        }

        if (!response.ok || !("id" in data)) {
          setError(
            "message" in data && data.message
              ? localizeApiMessage(data.message)
              : "기획서를 불러오지 못했습니다.",
          );
          return;
        }

        setSpec(data);
        setDraft(data.contentJson);
        setArrayDrafts(createArrayDrafts(data.contentJson));
        setNotionPageUrl(data.publishLogs?.[0]?.notionUrl ?? "");
      } catch {
        if (!cancelled) {
          setError("기획서를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSpec();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  function showToast(message: string, type: ToastState["type"]) {
    setToast({ message, type });
  }

  function updateStringSection(key: StringSpecKey, value: string) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
    setSavedMessage("");
    setPublishMessage("");
    setNotionPageUrl("");
  }

  function updateArraySection(key: ArraySpecKey, value: string) {
    setArrayDrafts((current) => ({
      ...current,
      [key]: value,
    }));
    setSavedMessage("");
    setPublishMessage("");
    setNotionPageUrl("");
  }

  function toggleSection(key: SpecSectionKey) {
    setCollapsedSections((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function handleCancelEdit() {
    if (spec) {
      setDraft(spec.contentJson);
      setArrayDrafts(createArrayDrafts(spec.contentJson));
    }

    setSaveError("");
    setSavedMessage("");
    setIsEditing(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError("");
    setSavedMessage("");

    const contentJson = buildSpecContent(draft, arrayDrafts);

    try {
      const response = await fetch(`/api/specs/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          contentJson,
        }),
      });

      const data = (await response.json()) as Spec | { message?: string };

      if (!response.ok || !("id" in data)) {
        setSaveError(
          "message" in data && data.message
            ? localizeApiMessage(data.message)
            : "기획서 저장에 실패했습니다.",
        );
        showToast("기획서 저장에 실패했습니다.", "error");
        return;
      }

      setSpec((current) => ({
        ...data,
        publishLogs: data.publishLogs ?? current?.publishLogs,
      }));
      setDraft(data.contentJson);
      setArrayDrafts(createArrayDrafts(data.contentJson));
      setIsEditing(false);
      showToast("기획서 저장 완료되었습니다.", "success");
      setSavedMessage("기획서가 저장되었습니다.");
    } catch {
      setSaveError("기획서 저장에 실패했습니다.");
      showToast("기획서 저장에 실패했습니다.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFlushToNotion() {
    setIsPublishing(true);
    setPublishError("");
    setPublishMessage("");
    setNotionPageUrl("");

    try {
      const response = await fetch(`/api/specs/${id}/flush`, {
        method: "POST",
      });

      const data = (await response.json()) as FlushResponse;

      if (!response.ok) {
        setPublishError(localizeApiMessage(data.message));
        showToast("Notion 배포에 실패했습니다.", "error");
        return;
      }

      setSpec((current) =>
        current
          ? {
              ...current,
              status: "Published",
            }
          : current,
      );
      setPublishMessage(localizeApiMessage(data.message) || "Notion 배포가 완료되었습니다.");
      setNotionPageUrl(data.notionPageUrl ?? "");
      showToast("Notion 배포 완료되었습니다.", "success");
    } catch {
      setPublishError("Notion 배포에 실패했습니다.");
      showToast("Notion 배포에 실패했습니다.", "error");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="pf-page-shell">
      <Header fixed />

      <main className={`pf-app-main ${styles.specMain}`}>
        <div className={styles.page}>
          <div className={styles.backRow}>
            <Link href={spec ? `/projects/${spec.projectId}` : "/projects"} className={styles.backLink}>
              ← 프로젝트로 돌아가기
            </Link>
          </div>

          {isLoading ? <p className="pf-status">기획서를 불러오는 중입니다...</p> : null}
          {!isLoading && error ? <p className="pf-status pf-error">{error}</p> : null}

          {!isLoading && !error && spec ? (
            <form
              className={styles.editorForm}
              onSubmit={(event) => event.preventDefault()}
            >
              <section className={`pf-card pf-card-pad ${styles.headerCard}`}>
                <div className={styles.headerMain}>
                  <div>
                    <p className="pf-section-label">기획서 편집</p>
                    <h1 className={`pf-page-title ${styles.pageTitle}`}>
                      {draft.title || "제목 없는 기획서"}
                    </h1>
                    <p className={`pf-page-copy ${styles.headerDescription}`}>
                      {spec.project?.name
                        ? `${spec.project.name} 프로젝트의 v${spec.version} 기획서입니다.`
                        : `프로젝트 #${spec.projectId}의 v${spec.version} 기획서입니다.`}
                    </p>
                  </div>

                  <div className={styles.headerActions}>
                    <div className={styles.actionButtonRow}>
                      <Link
                        href={`/projects/${spec.projectId}/publish-logs?specId=${spec.id}`}
                        className={`pf-btn-outline ${styles.publishLogLink}`}
                      >
                        배포 이력
                      </Link>
                      <button
                        className="pf-btn-primary"
                        type="button"
                        onClick={() => void handleFlushToNotion()}
                        disabled={isPublishing || isSaving}
                      >
                        {publishButtonLabel}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaPill}>기획서 #{spec.id}</span>
                  <span className={styles.metaPill}>버전 v{spec.version}</span>
                  <span className={styles.metaPill}>
                    최근 수정 {formatDate(spec.updatedAt)}
                  </span>
                  {latestNotionPageUrl && !publishError ? (
                    <Link
                      className={`${styles.metaPill} ${styles.publishMetaPillSuccess} ${styles.publishMetaPillLink}`}
                      href={latestNotionPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="배포된 Notion 페이지 열기"
                      aria-label="배포된 Notion 페이지 열기"
                    >
                      {publishStatusLabel}
                      <span aria-hidden="true" className={styles.externalMark}>
                        ↗
                      </span>
                    </Link>
                  ) : (
                    <span
                      className={`${styles.metaPill} ${
                        publishError
                          ? styles.publishMetaPillError
                          : styles.publishMetaPillIdle
                      }`}
                    >
                      {publishStatusLabel}
                    </span>
                  )}
                </div>

                {savedMessage ? <p className={styles.successMessage}>{savedMessage}</p> : null}
                {saveError ? <p className="pf-status pf-error">{saveError}</p> : null}
                {publishError ? <p className={styles.inlineError}>{publishError}</p> : null}
              </section>

              {isEmpty ? (
                <section className={`pf-card pf-card-pad ${styles.emptyCard}`}>
                  <h2 className={styles.emptyTitle}>기획서 내용이 비어 있습니다.</h2>
                  <p className="pf-status">
                    각 섹션에 내용을 입력한 뒤 기획서 저장 버튼을 눌러 주십시오.
                  </p>
                </section>
              ) : null}

              <div className={styles.editorWorkspace}>
                <aside className={`pf-card pf-card-pad ${styles.tocCard}`} aria-label="기획서 섹션 목차">
                  <div className={styles.tocHeader}>
                    <p className={styles.tocTitle}>섹션</p>
                  </div>

                  <nav className={styles.tocList} aria-label="기획서 대분류">
                    {SPEC_CATEGORIES.map((category) => (
                      <button
                        className={`${styles.tocButton} ${
                          category.key === selectedCategory.key
                            ? styles.tocButtonActive
                            : ""
                        }`}
                        type="button"
                        aria-current={
                          category.key === selectedCategory.key ? "page" : undefined
                        }
                        key={category.key}
                        onClick={() => setSelectedCategoryKey(category.key)}
                      >
                        {category.label}
                      </button>
                    ))}
                  </nav>
                </aside>

                <section className={styles.editorPanel}>
                  <div className={`pf-card pf-card-pad ${styles.categoryHeader}`}>
                    <div>
                      <h2 className={styles.categoryTitle}>{selectedCategory.label}</h2>
                      <p className={styles.categoryDescription}>
                        {selectedCategory.description}
                      </p>
                    </div>
                    <div className={styles.categoryActions}>
                      {isEditing ? (
                        <>
                          <button
                            className={`pf-btn-outline ${styles.categoryActionButton}`}
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            취소
                          </button>
                          <button
                            className="pf-btn-primary"
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={isSaving || isPublishing}
                          >
                            {isSaving ? "저장 중..." : "저장"}
                          </button>
                        </>
                      ) : (
                        <button
                          className={`pf-btn-outline ${styles.categoryActionButton}`}
                          type="button"
                          onClick={() => setIsEditing(true)}
                        >
                          수정
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.sectionGrid}>
                    {selectedCategory.sections.map((sectionKey) => {
                      const section = getStringSection(sectionKey);

                      if (!section) {
                        return null;
                      }

                      const isCollapsed = collapsedSections.has(section.key);

                      return (
                        <div
                          className={`pf-card pf-card-pad ${styles.sectionCard}`}
                          id={getSectionId(section.key)}
                          key={section.key}
                        >
                          <div className={styles.sectionHeader}>
                            <label className={styles.sectionLabel} htmlFor={section.key}>
                              {section.label}
                            </label>
                            <button
                              className={styles.sectionToggle}
                              type="button"
                              aria-expanded={!isCollapsed}
                              aria-label={`${section.label} 섹션 ${
                                isCollapsed ? "펼치기" : "접기"
                              }`}
                              aria-controls={`${section.key}-body`}
                              onClick={() => toggleSection(section.key)}
                            >
                              <ChevronIcon isCollapsed={isCollapsed} />
                            </button>
                          </div>

                          <div
                            className={styles.sectionBody}
                            id={`${section.key}-body`}
                            hidden={isCollapsed}
                          >
                            {isEditing ? (
                              section.multiline ? (
                                <textarea
                                  id={section.key}
                                  className={`pf-textarea ${styles.sectionTextarea}`}
                                  value={draft[section.key]}
                                  onChange={(event) =>
                                    updateStringSection(section.key, event.target.value)
                                  }
                                />
                              ) : (
                                <input
                                  id={section.key}
                                  className="pf-input"
                                  value={draft[section.key]}
                                  onChange={(event) =>
                                    updateStringSection(section.key, event.target.value)
                                  }
                                />
                              )
                            ) : (
                              <p className={styles.documentText}>
                                {draft[section.key] || "내용이 없습니다."}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {selectedCategory.sections.map((sectionKey) => {
                      const section = getArraySection(sectionKey);

                      if (!section) {
                        return null;
                      }

                      const isCollapsed = collapsedSections.has(section.key);
                      const sectionItems = draft[section.key];
                      const visibleItems = getVisibleSectionItems({
                        items: sectionItems,
                        isExpanded: isOpenQuestionsExpanded,
                        sectionKey: section.key,
                      });
                      const hiddenOpenQuestionsCount =
                        section.key === "openQuestions"
                          ? sectionItems.length - visibleItems.length
                          : 0;

                      return (
                        <div
                          className={`pf-card pf-card-pad ${styles.sectionCard}`}
                          id={getSectionId(section.key)}
                          key={section.key}
                        >
                          <div className={styles.sectionHeader}>
                            <label className={styles.sectionLabel} htmlFor={section.key}>
                              {section.label}
                            </label>
                            <button
                              className={styles.sectionToggle}
                              type="button"
                              aria-expanded={!isCollapsed}
                              aria-label={`${section.label} 섹션 ${
                                isCollapsed ? "펼치기" : "접기"
                              }`}
                              aria-controls={`${section.key}-body`}
                              onClick={() => toggleSection(section.key)}
                            >
                              <ChevronIcon isCollapsed={isCollapsed} />
                            </button>
                          </div>

                          <div
                            className={styles.sectionBody}
                            id={`${section.key}-body`}
                            hidden={isCollapsed}
                          >
                            {isEditing ? (
                            <textarea
                              id={section.key}
                              className={`pf-textarea ${styles.sectionTextarea}`}
                              value={arrayDrafts[section.key]}
                              onChange={(event) =>
                                updateArraySection(section.key, event.target.value)
                              }
                              placeholder="한 줄에 하나씩 입력해 주십시오."
                            />
                            ) : sectionItems.length > 0 ? (
                              <>
                                <ul className={styles.itemList}>
                                  {visibleItems.map((item, index) =>
                                    renderPlanningSpecItem(item, index, section.key),
                                  )}
                                </ul>
                                {hiddenOpenQuestionsCount > 0 ? (
                                  <button
                                    className={styles.showMoreButton}
                                    type="button"
                                    onClick={() => setIsOpenQuestionsExpanded(true)}
                                  >
                                    더보기 {hiddenOpenQuestionsCount}개
                                  </button>
                                ) : section.key === "openQuestions" &&
                                  isOpenQuestionsExpanded &&
                                  sectionItems.length > OPEN_QUESTIONS_PREVIEW_LIMIT ? (
                                  <button
                                    className={styles.showMoreButton}
                                    type="button"
                                    onClick={() => setIsOpenQuestionsExpanded(false)}
                                  >
                                    접기
                                  </button>
                                ) : null}
                              </>
                            ) : (
                              <p className={styles.emptySection}>내용이 없습니다.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {false && isEditing ? (
              <div className={styles.stickySaveBar}>
                <p className={styles.saveHint}>
                  목록형 섹션은 Enter로 줄을 나누면 별도 항목으로 저장됩니다.
                </p>
                <button
                  className={styles.saveButton}
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving || isPublishing}
                >
                  {isSaving ? "저장 중..." : "기획서 저장"}
                </button>
              </div>
              ) : null}
            </form>
          ) : null}
        </div>
      </main>

      <Footer />

      {toast ? (
        <div
          className={`${styles.toast} ${
            toast.type === "success" ? styles.toastSuccess : styles.toastError
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
