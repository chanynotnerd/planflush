"use client";

import Link from "next/link";
import { FormEvent, use, useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

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

const ROLE_OPTIONS: Message["role"][] = ["user", "assistant", "system"];

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

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [role, setRole] = useState<Message["role"]>("user");
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
          role,
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
        <div style={{ marginBottom: "1.25rem" }}>
          <Link href="/projects" className="pf-nav-link">
            ← 프로젝트 목록으로 돌아가기
          </Link>
        </div>

        {isLoading ? <p className="pf-status">불러오는 중입니다...</p> : null}
        {!isLoading && error ? (
          <p className="pf-status pf-error">{error}</p>
        ) : null}

        {!isLoading && !error && project ? (
          <section
            className="pf-app-grid"
            style={{
              gridTemplateColumns: "minmax(0, 0.92fr) minmax(320px, 0.68fr)",
            }}
          >
            <div className="pf-card pf-card-pad">
              <p className="pf-section-label">프로젝트 대화</p>
              <h1
                className="pf-page-title"
                style={{
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                }}
              >
                {project.name}
              </h1>
              <p className="pf-page-copy" style={{ marginTop: "1rem" }}>
                {project.description || "프로젝트 설명이 아직 없습니다."}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginTop: "1.5rem",
                  marginBottom: "1rem",
                }}
              >
                <p className="pf-project-meta">프로젝트 ID #{project.id}</p>
                <p className="pf-project-meta">
                  최근 수정 {new Date(project.updatedAt).toLocaleString()}
                </p>
              </div>

              {messages.length === 0 ? (
                <p className="pf-status">
                  아직 저장된 메시지가 없습니다.
                  <br />
                  아래 입력창에서 프로젝트 관련 대화를 남겨보세요.
                </p>
              ) : (
                <div className="pf-message-list">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`pf-message-row ${message.role}`}
                    >
                      <div className={`pf-message-bubble ${message.role}`}>
                        <span className="pf-message-role">
                          {ROLE_LABELS[message.role]}
                        </span>
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pf-card pf-card-pad">
              <p className="pf-section-label">메시지 저장</p>
              <form className="pf-form-stack" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="message-role" className="pf-label">
                    작성자 유형
                  </label>
                  <select
                    id="message-role"
                    className="pf-select"
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as Message["role"])
                    }
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {ROLE_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message-content" className="pf-label">
                    내용
                  </label>
                  <textarea
                    id="message-content"
                    className="pf-textarea"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="프로젝트 요구사항, 이슈, 결정사항 등을 입력하세요."
                  />
                </div>

                {submitError ? (
                  <p className="pf-status pf-error">{submitError}</p>
                ) : null}

                <button
                  className="pf-btn-accent"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "저장 중..." : "메시지 저장"}
                </button>
              </form>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
