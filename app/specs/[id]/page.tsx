"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import styles from "./page.module.css";

type PlanningSpecContent = {
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
      return "기획서를 저장하지 못했습니다.";
    default:
      return message ?? "";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

function getSpecStatusLabel(status: string) {
  switch (status) {
    case "AI Draft":
      return "기획서 초안";
    case "Draft":
    case "Edited Draft":
      return "수정 초안";
    case "Published":
      return "배포 완료";
  }

  return status;
}

function arrayToTextarea(value: string[]) {
  return value.join("\n");
}

function textareaToArray(value: string) {
  return value
    .split(/\r?\n/)
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
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<SpecSectionKey>>(
    () => new Set(),
  );
  const [selectedCategoryKey, setSelectedCategoryKey] =
    useState<SpecCategoryKey>("overview");

  const selectedCategory =
    SPEC_CATEGORIES.find((category) => category.key === selectedCategoryKey) ??
    SPEC_CATEGORIES[0];

  const isEmpty = useMemo(
    () => isSpecContentEmpty(draft, arrayDrafts),
    [arrayDrafts, draft],
  );

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

  function updateStringSection(key: StringSpecKey, value: string) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
    setSavedMessage("");
  }

  function updateArraySection(key: ArraySpecKey, value: string) {
    setArrayDrafts((current) => ({
      ...current,
      [key]: value,
    }));
    setSavedMessage("");
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
            : "기획서를 저장하지 못했습니다.",
        );
        return;
      }

      setSpec(data);
      setDraft(data.contentJson);
      setArrayDrafts(createArrayDrafts(data.contentJson));
      setSavedMessage("기획서가 저장되었습니다.");
    } catch {
      setSaveError("기획서를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
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
                    <span className={styles.statusBadge}>
                      v{spec.version} · {getSpecStatusLabel(spec.status)}
                    </span>
                    <button
                      className="pf-btn-primary"
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={isSaving}
                    >
                      {isSaving ? "저장 중..." : "기획서 저장"}
                    </button>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaPill}>기획서 #{spec.id}</span>
                  <span className={styles.metaPill}>버전 v{spec.version}</span>
                  <span className={styles.metaPill}>
                    최근 수정 {formatDate(spec.updatedAt)}
                  </span>
                </div>

                {savedMessage ? <p className={styles.successMessage}>{savedMessage}</p> : null}
                {saveError ? <p className="pf-status pf-error">{saveError}</p> : null}
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
                    <h2 className={styles.categoryTitle}>{selectedCategory.label}</h2>
                    <p className={styles.categoryDescription}>
                      {selectedCategory.description}
                    </p>
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

                          <div id={`${section.key}-body`} hidden={isCollapsed}>
                            {section.multiline ? (
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

                          <div id={`${section.key}-body`} hidden={isCollapsed}>
                            <textarea
                              id={section.key}
                              className={`pf-textarea ${styles.sectionTextarea}`}
                              value={arrayDrafts[section.key]}
                              onChange={(event) =>
                                updateArraySection(section.key, event.target.value)
                              }
                              placeholder="한 줄에 하나씩 입력해 주십시오."
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className={styles.stickySaveBar}>
                <p className={styles.saveHint}>
                  목록형 섹션은 Enter로 줄을 나누면 별도 항목으로 저장됩니다.
                </p>
                <button
                  className="pf-btn-primary"
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중..." : "기획서 저장"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
