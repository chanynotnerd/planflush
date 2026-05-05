"use client";

import Link from "next/link";
import { FormEvent, use, useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  formatPlanningSpecItem,
  getPlanningSpecItemTitle,
} from "@/lib/ai/specFormatter";
import type {
  JsonObject,
  JsonValue,
  PlanningSpecContent,
  PlanningSpecItem,
} from "@/lib/ai/specSchema";
import styles from "./page.module.css";

type Project = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: number;
  projectId: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
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
  publishLogs?: {
    publishStatus: string;
    notionUrl: string | null;
    publishedAt: string | null;
    createdAt: string;
  }[];
};

type ProjectDetailResponse = Project & {
  latestSpec: Spec | null;
};

type ChatMessageResponse = {
  userMessage: Message;
  assistantMessage: Message;
};

type ChatMessageErrorResponse = {
  message?: string;
  userMessage?: Message;
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

const ROLE_LABELS: Record<Message["role"], string> = {
  user: "사용자",
  assistant: "어시스턴트",
  system: "시스템",
};

function localizeApiMessage(message?: string) {
  switch (message) {
    case "Project not found.":
      return "프로젝트를 찾을 수 없습니다.";
    case "Invalid project id.":
      return "잘못된 프로젝트 ID입니다.";
    case "Failed to fetch project.":
    case "Failed to fetch messages.":
      return "프로젝트 정보를 불러오지 못했습니다.";
    case "Invalid JSON body.":
      return "잘못된 요청 형식입니다.";
    case "Invalid message role.":
      return "잘못된 작성자 유형입니다.";
    case "Message content is required.":
      return "메시지 내용을 입력해 주십시오.";
    case "Failed to create message.":
      return "메시지를 저장하지 못했습니다.";
    case "At least one project message is required to generate a spec.":
      return "기획서를 생성하려면 프로젝트 대화가 최소 1개 필요합니다.";
    case "OPENAI_API_KEY is not configured.":
      return "OPENAI_API_KEY가 설정되어 있지 않습니다. .env에 값을 추가해 주세요.";
    case "Failed to generate assistant reply.":
      return "AI 답변을 생성하지 못했습니다. 사용자 메시지는 저장되었습니다.";
    case "AI returned invalid JSON.":
      return "AI가 올바른 JSON을 반환하지 않았습니다. 다시 시도해 주세요.";
    case "AI returned an invalid spec format.":
      return "AI가 기획서 형식에 맞지 않는 응답을 반환했습니다. 다시 시도해 주세요.";
    case "Failed to generate spec.":
      return "기획서 초안을 생성하지 못했습니다.";
    default:
      return message ?? "";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

function sanitizeMessageContent(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}[-*]\s+/gm, "- ");
}

function getSpecPreviewText(item: PlanningSpecItem) {
  return sanitizeMessageContent(getPlanningSpecItemTitle(item) || formatPlanningSpecItem(item));
}

function getSpecPreviewKey(item: PlanningSpecItem, index: number) {
  return `${index}-${getSpecPreviewText(item)}`;
}

function isSpecObject(item: PlanningSpecItem): item is JsonObject {
  return typeof item === "object" && item !== null && !Array.isArray(item);
}

function stringifyPreviewValue(value: JsonValue | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return sanitizeMessageContent(value.trim());
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(stringifyPreviewValue).filter(Boolean).join(", ");
  }

  return formatPlanningSpecItem(value);
}

function formatActionMeta(value: string) {
  const text = value.trim();
  const labels: Record<string, string> = {
    api: "API",
    data: "데이터",
    policy: "정책",
    design: "Design",
    ux: "UX",
    fe: "FE",
    be: "BE",
    db: "DB",
    qa: "QA",
    pm: "PM",
  };

  const slashParts = text.split("/").map((part) => part.trim());

  if (slashParts.length > 1 && slashParts.every(Boolean)) {
    return slashParts
      .map((part) => labels[part.toLowerCase()] ?? part)
      .join("/");
  }

  return labels[text.toLowerCase()] ?? text;
}

function getActionItemPreviewText(item: PlanningSpecItem) {
  if (!isSpecObject(item)) {
    return getSpecPreviewText(item);
  }

  const owner = stringifyPreviewValue(item.owner);
  const type = stringifyPreviewValue(item.type);
  const title =
    stringifyPreviewValue(item.title) ||
    stringifyPreviewValue(item.description) ||
    getSpecPreviewText(item);
  const meta = [owner, type].filter(Boolean).map(formatActionMeta).join(" / ");

  return sanitizeMessageContent(meta ? `[${meta}] ${title}` : title);
}

function getLatestPublishLog(spec: Spec | null) {
  return spec?.publishLogs?.[0] ?? null;
}

function getNotionPublishStatus(spec: Spec | null) {
  const latestPublishLog = getLatestPublishLog(spec);

  if (!latestPublishLog) {
    return "idle";
  }

  return latestPublishLog.publishStatus === "Success" ? "success" : "failed";
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [content, setContent] = useState("");
  const [generatedSpec, setGeneratedSpec] = useState<Spec | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
  const latestPublishLog = getLatestPublishLog(generatedSpec);
  const notionPublishStatus = getNotionPublishStatus(generatedSpec);
  const notionPublishedAt =
    latestPublishLog?.publishedAt ?? latestPublishLog?.createdAt ?? "";
  const notionUrl =
    notionPublishStatus === "success" ? latestPublishLog?.notionUrl : null;
  const notionStatusLabel =
    notionPublishStatus === "success"
      ? "Notion 배포 완료"
      : notionPublishStatus === "failed"
        ? "Notion 배포 실패"
        : "Notion 미배포";

  useEffect(() => {
    let cancelled = false;

    const loadProjectData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [projectResponse, messagesResponse] = await Promise.all([
          fetch(`/api/projects/${id}`, { cache: "no-store" }),
          fetch(`/api/projects/${id}/messages`, { cache: "no-store" }),
        ]);

        const projectData = (await projectResponse.json()) as
          | ProjectDetailResponse
          | { message?: string };
        const messagesData = (await messagesResponse.json()) as
          | Message[]
          | { message?: string };

        if (cancelled) {
          return;
        }

        if (!projectResponse.ok || !messagesResponse.ok) {
          const responseMessage =
            "message" in projectData && projectData.message
              ? localizeApiMessage(projectData.message)
              : "message" in messagesData && messagesData.message
                ? localizeApiMessage(messagesData.message)
                : "데이터를 불러오지 못했습니다.";

          setError(responseMessage);
          return;
        }

        const projectDetail = projectData as ProjectDetailResponse;

        setProject({
          id: projectDetail.id,
          name: projectDetail.name,
          description: projectDetail.description,
          createdAt: projectDetail.createdAt,
          updatedAt: projectDetail.updatedAt,
        });
        setGeneratedSpec(projectDetail.latestSpec ?? null);
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      } catch {
        if (!cancelled) {
          setError("프로젝트 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProjectData();

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setSubmitError("메시지 내용을 입력해 주십시오.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`/api/projects/${id}/chat-reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: trimmedContent,
        }),
      });

      const data = (await response.json()) as
        | Message
        | ChatMessageResponse
        | ChatMessageErrorResponse;

      if (!response.ok) {
        if ("userMessage" in data && data.userMessage) {
          setMessages((current) => [...current, data.userMessage as Message]);
          setContent("");
        }

        setSubmitError(
          "message" in data && data.message
            ? localizeApiMessage(data.message)
            : "메시지를 저장하지 못했습니다.",
        );
        return;
      }

      if ("userMessage" in data && "assistantMessage" in data) {
        setMessages((current) => [
          ...current,
          data.userMessage,
          data.assistantMessage,
        ]);
      } else if ("id" in data) {
        setMessages((current) => [...current, data]);
      }

      setContent("");
    } catch {
      setSubmitError("메시지를 저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGenerateSpecRequest() {
    if (generatedSpec) {
      setIsRegenerateConfirmOpen(true);
      return;
    }

    void handleGenerateSpec();
  }

  async function handleGenerateSpec() {
    setIsRegenerateConfirmOpen(false);
    setIsGeneratingSpec(true);
    setGenerateError("");

    try {
      const response = await fetch(`/api/projects/${id}/generate-spec`, {
        method: "POST",
      });

      const data = (await response.json()) as Spec | { message?: string };

      if (!response.ok || !("id" in data)) {
        setGenerateError(
          "message" in data && data.message
            ? localizeApiMessage(data.message)
            : "기획서 초안을 생성하지 못했습니다.",
        );
        showToast("기획서 생성에 실패했습니다.", "error");
        return;
      }

      setGeneratedSpec(data);
      showToast("기획서 생성 완료되었습니다.", "success");
    } catch {
      setGenerateError("기획서 초안을 생성하지 못했습니다.");
      showToast("기획서 생성에 실패했습니다.", "error");
    } finally {
      setIsGeneratingSpec(false);
    }
  }

  return (
    <div className="pf-page-shell">
      <Header fixed />

      <main className="pf-app-main">
        <div className={styles.page}>
          <div className={styles.backRow}>
            <Link href="/projects" className={styles.backLink}>
              ← 프로젝트 목록으로 돌아가기
            </Link>
          </div>

          {isLoading ? <p className="pf-status">프로젝트 정보를 불러오는 중입니다...</p> : null}
          {!isLoading && error ? <p className="pf-status pf-error">{error}</p> : null}

          {!isLoading && !error && project ? (
            <>
              <section className={`pf-card pf-card-pad ${styles.headerCard}`}>
                <div className={styles.headerMain}>
                  <div className={styles.headerText}>
                    <p className="pf-section-label">프로젝트 상세</p>
                    <h1 className={`pf-page-title ${styles.projectTitle}`}>
                      {project.name}
                    </h1>
                    <p className={`pf-page-copy ${styles.projectDescription}`}>
                      {project.description || "프로젝트 설명이 아직 없습니다."}
                    </p>
                  </div>

                  <div className={styles.headerActionArea}>
                    <button
                      className="pf-btn-primary"
                      type="button"
                      onClick={handleGenerateSpecRequest}
                      disabled={isGeneratingSpec}
                    >
                      {isGeneratingSpec
                        ? generatedSpec
                          ? "기획서 재생성 중..."
                          : "기획서 생성 중..."
                        : generatedSpec
                          ? "기획서 재생성"
                          : "기획서 초안 생성"}
                    </button>
                  </div>
                </div>

                {generateError ? (
                  <p className="pf-status pf-error">{generateError}</p>
                ) : null}

                <div className={styles.metaRow}>
                  <span className={styles.metaPill}>프로젝트 #{project.id}</span>
                  <span className={styles.metaPill}>
                    최근 수정 {formatDate(project.updatedAt)}
                  </span>
                  <span className={styles.metaPill}>대화 {messages.length}건</span>
                  {notionUrl ? (
                    <Link
                      href={notionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`${styles.metaPill} ${styles.metaPillLink} ${styles.metaPillSuccess}`}
                      title="배포된 Notion 페이지 열기"
                      aria-label="배포된 Notion 페이지 열기"
                    >
                      {notionStatusLabel} ↗
                    </Link>
                  ) : (
                    <span
                      className={`${styles.metaPill} ${
                        notionPublishStatus === "failed"
                          ? styles.metaPillFailed
                          : ""
                      }`}
                    >
                      {notionStatusLabel}
                    </span>
                  )}
                </div>
              </section>

              {generatedSpec ? (
                <section className={`pf-card pf-card-pad ${styles.specPreviewCard}`}>
                  <div className={styles.specPreviewHeader}>
                    <div>
                      <p className="pf-section-label">최신 기획서</p>
                      <h2 className={styles.specPreviewTitle}>{generatedSpec.title}</h2>
                    </div>
                    <div className={styles.specPreviewActions}>
                      <Link
                        href={`/specs/${generatedSpec.id}`}
                        className="pf-btn-outline"
                      >
                        기획서 편집
                      </Link>
                    </div>
                  </div>

                  <p className={styles.specPreviewSummary}>
                    {generatedSpec.contentJson.summary || "요약 정보가 아직 비어 있습니다."}
                  </p>

                  <div className={styles.specPreviewGrid}>
                    <div className={styles.specPreviewSection}>
                      <h3 className={styles.specPreviewSectionTitle}>
                        목표 {generatedSpec.contentJson.goal.length}개
                      </h3>
                      <ul className={styles.specPreviewList}>
                        {generatedSpec.contentJson.goal.map((item, index) => (
                          <li key={getSpecPreviewKey(item, index)}>
                            {getSpecPreviewText(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={styles.specPreviewSection}>
                      <h3 className={styles.specPreviewSectionTitle}>
                        요구사항 {generatedSpec.contentJson.requirements.length}개
                      </h3>
                      <ul className={styles.specPreviewList}>
                        {generatedSpec.contentJson.requirements.map((item, index) => (
                          <li key={getSpecPreviewKey(item, index)}>
                            {getSpecPreviewText(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={styles.specPreviewSection}>
                      <h3 className={styles.specPreviewSectionTitle}>
                        액션 아이템 {generatedSpec.contentJson.actionItems.length}개
                      </h3>
                      {generatedSpec.contentJson.actionItems.length > 0 ? (
                        <ul className={styles.specPreviewList}>
                          {generatedSpec.contentJson.actionItems
                            .slice(0, 5)
                            .map((item, index) => (
                              <li key={getSpecPreviewKey(item, index)}>
                                {getActionItemPreviewText(item)}
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="pf-status">
                          아직 정리된 액션 아이템이 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <section className={`pf-card pf-card-pad ${styles.specPreviewCard}`}>
                  <p className="pf-status">
                    아직 생성된 기획서가 없습니다. 기획서 초안 생성 버튼으로 초안을 만들어 주세요.
                  </p>
                </section>
              )}

              <section className={styles.contentGrid}>
                <div className={styles.mainColumn}>
                  <section className={`pf-card ${styles.timelineCard}`}>
                    <div className={styles.timelineHeader}>
                      <div>
                        <h2 className={styles.timelineTitle}>프로젝트 대화</h2>
                      </div>
                      <span className={styles.timelineSummary}>
                        AI와 기획 내용을 정리하세요.
                      </span>
                    </div>

                    <div className={styles.timelineWorkspace}>
                      <div className={styles.timelineBody}>
                        {messages.length === 0 ? (
                          <div className={styles.emptyState}>
                            <h3 className={styles.emptyTitle}>아직 대화가 없습니다.</h3>
                            <p className="pf-status">
                              아직 입력된 메시지가 없습니다. 프로젝트 내용을 입력해 주세요.
                            </p>
                          </div>
                        ) : (
                          <div className={styles.messageList}>
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`${styles.messageRow} ${
                                  message.role === "user"
                                    ? styles.messageRowUser
                                    : message.role === "assistant"
                                      ? styles.messageRowAssistant
                                      : styles.messageRowSystem
                                }`}
                              >
                                <article
                                  className={`${styles.messageCard} ${
                                    message.role === "user"
                                      ? styles.userMessage
                                      : message.role === "assistant"
                                        ? styles.assistantMessage
                                        : styles.systemMessage
                                  }`}
                                >
                                  <div className={styles.messageMeta}>
                                    <span className={styles.senderLabel}>
                                      {ROLE_LABELS[message.role]}
                                    </span>
                                    <span className={styles.timeLabel}>
                                      {formatDate(message.createdAt)}
                                    </span>
                                  </div>
                                  <p className={styles.messageContent}>
                                    {sanitizeMessageContent(message.content)}
                                  </p>
                                </article>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <form className={styles.composerForm} onSubmit={handleSubmit}>
                        <div className={styles.composerInputWrap}>
                          <textarea
                            id="message-content"
                            className={`pf-textarea ${styles.composerTextarea}`}
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder="회의 내용, 요구사항, 이슈, 결정사항을 입력하세요."
                            disabled={isSubmitting}
                          />
                          <button
                            className={styles.sendButton}
                            type="submit"
                            disabled={isSubmitting}
                            aria-label="메시지 전송"
                            title="메시지 전송"
                          >
                            <svg
                              className={styles.sendIcon}
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <path
                                d="M21 3 10 14"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="m21 3-7 18-4-7-7-4 18-7Z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className={styles.composerFooter}>
                          <p className={styles.composerHint}>
                            전송하면 AI가 요구사항을 정리하고 다음 질문을 제안합니다.
                          </p>
                          {isSubmitting ? (
                            <span className={styles.composerStatus}>
                              AI 답변 생성 중...
                            </span>
                          ) : null}
                        </div>

                        {submitError ? (
                          <p className="pf-status pf-error">{submitError}</p>
                        ) : null}
                      </form>
                    </div>
                  </section>
                </div>

                <aside className={styles.sideColumn}>
                  <section className={`pf-card pf-card-pad ${styles.sideCard}`}>
                    <p className="pf-section-label">프로젝트 정보</p>
                    <h2 className={styles.sideTitle}>현재 상태</h2>
                    <dl className={styles.infoList}>
                      <div className={styles.infoItem}>
                        <dt className={styles.infoLabel}>프로젝트</dt>
                        <dd className={styles.infoValue}>
                          {generatedSpec ? `v${generatedSpec.version}` : "기획서 없음"}
                        </dd>
                      </div>
                      <div className={styles.infoItem}>
                        <dt className={styles.infoLabel}>최근 수정</dt>
                        <dd className={styles.infoValue}>{formatDate(project.updatedAt)}</dd>
                      </div>
                      <div className={styles.infoItem}>
                        <dt className={styles.infoLabel}>대화 수</dt>
                        <dd className={styles.infoValue}>{messages.length}건</dd>
                      </div>
                      <div className={styles.infoItem}>
                        <dt className={styles.infoLabel}>Notion 배포</dt>
                        <dd className={styles.infoValue}>
                          {notionPublishStatus === "success" ? (
                            <span className={styles.notionStatusContent}>
                              <span className={styles.notionStatusSuccess}>
                                완료
                              </span>
                              {notionPublishedAt ? (
                                <span className={styles.notionStatusDate}>
                                  {formatDate(notionPublishedAt)}
                                </span>
                              ) : null}
                              {notionUrl ? (
                                <Link
                                  href={notionUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.notionStatusLink}
                                >
                                  Notion에서 열기 ↗
                                </Link>
                              ) : null}
                            </span>
                          ) : (
                            <span className={styles.notionStatusIdle}>미배포</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className={`pf-card pf-card-pad ${styles.sideCard}`}>
                    <p className="pf-section-label">작성 가이드</p>
                    <h2 className={styles.sideTitle}>회의 작성 팁</h2>
                    <ul className={styles.tipList}>
                      <li className={styles.tipItem}>
                        요구사항과 제외 범위를 함께 적으면 이후 정리가 쉬워집니다.
                      </li>
                      <li className={styles.tipItem}>
                        이슈의 원인과 결정사항을 한 메시지 안에 같이 남겨 주십시오.
                      </li>
                      <li className={styles.tipItem}>
                        실무 메모처럼 길게 적어도 읽기 쉬운 대화 흐름으로 저장됩니다.
                      </li>
                    </ul>
                  </section>
                </aside>
              </section>
            </>
          ) : null}
        </div>
      </main>

      <Footer />

      {isRegenerateConfirmOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={() => setIsRegenerateConfirmOpen(false)}
        >
          <section
            className={styles.confirmModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="regenerate-spec-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="regenerate-spec-title" className={styles.confirmTitle}>
              기획서를 재생성하시겠습니까?
            </h2>
            <p className={styles.confirmBody}>
              기존 기획서 초안이 새 내용으로 대체될 수 있습니다.
            </p>
            <div className={styles.confirmActions}>
              <button
                className="pf-btn-outline"
                type="button"
                onClick={() => setIsRegenerateConfirmOpen(false)}
              >
                취소
              </button>
              <button
                className="pf-btn-primary"
                type="button"
                onClick={() => void handleGenerateSpec()}
                disabled={isGeneratingSpec}
              >
                {isGeneratingSpec ? "기획서 재생성 중..." : "기획서 재생성"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

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
