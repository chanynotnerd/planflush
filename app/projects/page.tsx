"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

type Project = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

function localizeApiMessage(message?: string) {
  switch (message) {
    case "Project name is required.":
      return "프로젝트 이름을 입력해 주십시오.";
    case "Failed to fetch projects.":
      return "프로젝트 목록을 불러오지 못했습니다.";
    case "Failed to create project.":
      return "프로젝트를 생성하지 못했습니다.";
    default:
      return message ?? "";
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        cache: "no-store",
      });

      const data = (await response.json()) as Project[] | { message?: string };

      if (!response.ok) {
        setError(localizeApiMessage("message" in data ? data.message : undefined) || "프로젝트 목록을 불러오지 못했습니다.");
        return;
      }

      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setError("프로젝트 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setSubmitError("프로젝트 이름을 입력해 주십시오.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription,
        }),
      });

      const data = (await response.json()) as Project | { message?: string };

      if (!response.ok || !("id" in data)) {
        setSubmitError(
          "message" in data && data.message
            ? localizeApiMessage(data.message)
            : "프로젝트를 생성하지 못했습니다.",
        );
        return;
      }

      setProjects((current) => [data, ...current]);
      setName("");
      setDescription("");
    } catch {
      setSubmitError("프로젝트를 생성하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="pf-page-shell">
      <Header fixed />

      <main className="pf-app-main">
        <section
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
          }}
        >
          <div className="pf-card pf-card-pad">
            <p className="pf-section-label">프로젝트 대시보드</p>
            <h1
              className="pf-page-title"
              style={{
                fontSize: "clamp(2.3rem, 3.6vw, 2.85rem)",
                lineHeight: 1.16,
                fontWeight: 600,
              }}
            >
              대화를 쌓고,
              <br />
              기획서로 바꿀 준비를 합니다.
            </h1>
            <p className="pf-page-copy" style={{ marginTop: "1rem", maxWidth: "46rem" }}>
              프로젝트를 만들고, 각 프로젝트별 대화를 저장할 수 있습니다. 저장된 대화는 다음 단계에서 AI 기획서 생성의 원본 자료로 사용됩니다.
            </p>
          </div>

          <div className="pf-card pf-card-pad">
            <p className="pf-section-label">프로젝트 생성</p>
            <form className="pf-form-stack" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="project-name" className="pf-label">
                  프로젝트명
                </label>
                <input
                  id="project-name"
                  className="pf-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="PlanFlush MVP"
                />
              </div>

              <div>
                <label htmlFor="project-description" className="pf-label">
                  설명
                </label>
                <textarea
                  id="project-description"
                  className="pf-textarea"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="첫 프로젝트 설명을 입력해 주십시오."
                />
              </div>

              {submitError ? <p className="pf-status pf-error">{submitError}</p> : null}

              <button className="pf-btn-accent" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "생성 중..." : "프로젝트 생성"}
              </button>
            </form>
          </div>
        </section>

        <section style={{ marginTop: "1.5rem" }} className="pf-card pf-card-pad">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.25rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p className="pf-section-label" style={{ marginBottom: "0.35rem" }}>
                프로젝트 목록
              </p>
              <p className="pf-page-copy">최근 활동 순으로 프로젝트를 확인할 수 있습니다.</p>
            </div>

            <button className="pf-btn-outline" type="button" onClick={() => void loadProjects()}>
              새로고침
            </button>
          </div>

          {isLoading ? <p className="pf-status">프로젝트 목록을 불러오는 중입니다...</p> : null}
          {!isLoading && error ? <p className="pf-status pf-error">{error}</p> : null}
          {!isLoading && !error && projects.length === 0 ? (
            <p className="pf-status">아직 프로젝트가 없습니다. 첫 프로젝트를 생성해 주십시오.</p>
          ) : null}

          {!isLoading && !error && projects.length > 0 ? (
            <div className="pf-project-list">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="pf-project-link">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      alignItems: "flex-start",
                      marginBottom: "0.6rem",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-brand-serif)",
                        fontWeight: 400,
                        fontSize: "1.2rem",
                      }}
                    >
                      {project.name}
                    </h2>
                    <span className="pf-project-meta">#{project.id}</span>
                  </div>
                  <p className="pf-page-copy">
                    {project.description || "프로젝트 설명이 아직 없습니다."}
                  </p>
                  <p className="pf-project-meta" style={{ marginTop: "0.85rem" }}>
                    최근 수정 {new Date(project.updatedAt).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  );
}
