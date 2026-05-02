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

      <main className="pf-app-main">
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

              <section className={styles.sectionGrid}>
                {STRING_SECTIONS.map((section) => (
                  <div className={`pf-card pf-card-pad ${styles.sectionCard}`} key={section.key}>
                    <label className={styles.sectionLabel} htmlFor={section.key}>
                      {section.label}
                    </label>
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
                ))}

                {ARRAY_SECTIONS.map((section) => (
                  <div className={`pf-card pf-card-pad ${styles.sectionCard}`} key={section.key}>
                    <label className={styles.sectionLabel} htmlFor={section.key}>
                      {section.label}
                    </label>
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
                ))}
              </section>

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
