"use client";

import Link from "next/link";
import { FormEvent, use, useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
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
      return "데이터를 불러오지 못했습니다.";
    case "Invalid JSON body.":
      return "잘못된 요청 형식입니다.";
    case "Invalid message role.":
      return "잘못된 작성자 유형입니다.";
    case "Message content is required.":
      return "메시지 내용을 입력해 주십시오.";
    case "Failed to create message.":
      return "메시지를 저장하지 못했습니다.";
    default:
      return message ?? "";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [content, setContent] = useState("");

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
          | Project
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

        setProject(projectData as Project);
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
      const response = await fetch(`/api/projects/${id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "user",
          content: trimmedContent,
        }),
      });

      const data = (await response.json()) as Message | { message?: string };

      if (!response.ok || !("id" in data)) {
        setSubmitError(
          "message" in data && data.message
            ? localizeApiMessage(data.message)
            : "메시지를 저장하지 못했습니다.",
        );
        return;
      }

      setMessages((current) => [...current, data]);
      setContent("");
    } catch {
      setSubmitError("메시지를 저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
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

          {isLoading ? <p className="pf-status">불러오는 중입니다...</p> : null}
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
                    <button className="pf-btn-outline" type="button" disabled>
                      기획서 초안 생성
                    </button>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaPill}>Project #{project.id}</span>
                  <span className={styles.metaPill}>
                    최근 수정 {formatDate(project.updatedAt)}
                  </span>
                  <span className={styles.metaPill}>대화 {messages.length}건</span>
                </div>
              </section>

              <section className={styles.contentGrid}>
                <div className={styles.mainColumn}>
                  <section className={`pf-card ${styles.timelineCard}`}>
                    <div className={styles.timelineHeader}>
                      <div>
                        <h2 className={styles.timelineTitle}>프로젝트 대화</h2>
                      </div>
                      <span className={styles.timelineSummary}>
                        요구사항, 이슈, 결정사항을 시간순으로 정리합니다.
                      </span>
                    </div>

                    <div className={styles.timelineWorkspace}>
                      <div className={styles.timelineBody}>
                        {messages.length === 0 ? (
                          <div className={styles.emptyState}>
                            <h3 className={styles.emptyTitle}>아직 대화가 없습니다.</h3>
                            <p className="pf-status">
                              아래 입력창에서 첫 대화를 남기면 이 화면이 프로젝트
                              논의 타임라인으로 채워집니다.
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
                                  <p className={styles.messageContent}>{message.content}</p>
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
                          />
                          <button
                            className={styles.sendButton}
                            type="submit"
                            disabled={isSubmitting}
                            aria-label="메시지 전송"
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
                            입력한 내용은 사용자 대화로 저장됩니다.
                          </p>
                          <span className={styles.composerStatus}>
                            {isSubmitting ? "저장 중..." : "버튼으로 전송"}
                          </span>
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
                        <dt className={styles.infoLabel}>프로젝트 ID</dt>
                        <dd className={styles.infoValue}>#{project.id}</dd>
                      </div>
                      <div className={styles.infoItem}>
                        <dt className={styles.infoLabel}>최근 수정</dt>
                        <dd className={styles.infoValue}>{formatDate(project.updatedAt)}</dd>
                      </div>
                      <div className={styles.infoItem}>
                        <dt className={styles.infoLabel}>저장된 대화</dt>
                        <dd className={styles.infoValue}>{messages.length}건</dd>
                      </div>
                    </dl>
                  </section>

                  <section className={`pf-card pf-card-pad ${styles.sideCard}`}>
                    <p className="pf-section-label">작성 가이드</p>
                    <h2 className={styles.sideTitle}>논의 작성 팁</h2>
                    <ul className={styles.tipList}>
                      <li className={styles.tipItem}>
                        요구사항과 제외 범위를 함께 적으면 이후 정리가 쉬워집니다.
                      </li>
                      <li className={styles.tipItem}>
                        이슈의 원인과 결정사항을 한 메시지 안에 같이 남겨 주십시오.
                      </li>
                      <li className={styles.tipItem}>
                        실무 메모처럼 길게 적어도 읽기 쉬운 타임라인 형태로 유지됩니다.
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
    </div>
  );
}
