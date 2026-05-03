"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import styles from "./page.module.css";

type Project = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  successfulPublishCount: number;
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

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const sortedProjects = [...projects].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
  const latestProject = sortedProjects[0] ?? null;
  const latestProjectName = latestProject ? latestProject.name : "아직 없음";
  const totalSuccessfulPublishCount = projects.reduce(
    (sum, project) => sum + project.successfulPublishCount,
    0,
  );

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
        setError(
          localizeApiMessage("message" in data ? data.message : undefined) ||
            "프로젝트 목록을 불러오지 못했습니다.",
        );
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
        <div className={styles.page}>
          <section className={styles.topGrid}>
            <article className={`pf-card pf-card-pad ${styles.dashboardCard}`}>
              <div className={styles.cardHeader}>
                <div>
                  <p className="pf-section-label">프로젝트 대시보드</p>
                  <h1 className={`pf-page-title ${styles.dashboardTitle}`}>
                    <span className={styles.dashboardLine}>대화를 쌓고,</span>
                    <span className={styles.dashboardLine}>
                      기획서로 바꿀 준비를 합니다.
                    </span>
                  </h1>
                </div>
              </div>

              <p className={`pf-page-copy ${styles.dashboardCopy}`}>
                <span className={styles.dashboardCopyLine}>
                  프로젝트별 대화와 실무 메모를 한곳에 모아두고,
                </span>
                <span className={styles.dashboardCopyLine}>
                  흩어진 요구사항과 결정사항을 기획 흐름에 맞게 정리해
                </span>
                <span className={styles.dashboardCopyLine}>
                  AI 기획서 초안으로 이어질 수 있는 기준 자료로 활용합니다.
                </span>
              </p>

              <div className={styles.metricGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" className={styles.metricSvg}>
                      <path
                        d="M4.5 7.5a2 2 0 0 1 2-2h3l1.2 1.5h6.8a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className={styles.metricLabel}>저장된 프로젝트</p>
                    <strong className={styles.metricValue}>
                      {projects.length}개
                    </strong>
                  </div>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" className={styles.metricSvg}>
                      <path
                        d="M7 12h10M7 16h6M8.5 5.5h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className={styles.metricLabel}>최근 활동</p>
                    <strong className={styles.metricValue}>
                      {latestProjectName}
                    </strong>
                  </div>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" className={styles.metricSvg}>
                      <path
                        d="M8 6.5h8M8 11.5h8M8 16.5h5M6.5 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className={styles.metricLabel}>Notion 배포 완료</p>
                    <strong className={styles.metricValue}>
                      {totalSuccessfulPublishCount}건
                    </strong>
                  </div>
                </div>
              </div>
            </article>

            <aside className={`pf-card pf-card-pad ${styles.createCard}`}>
              <div className={styles.cardHeader}>
                <div>
                  <p className="pf-section-label">프로젝트 생성</p>
                  <h2 className={styles.createTitle}>새 프로젝트 만들기</h2>
                </div>
              </div>

              <form className={styles.createForm} onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="project-name" className="pf-label">
                    프로젝트명
                  </label>
                  <input
                    id="project-name"
                    className="pf-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="프로젝트명을 입력해 주세요."
                  />
                </div>

                <div>
                  <label htmlFor="project-description" className="pf-label">
                    설명
                  </label>
                  <textarea
                    id="project-description"
                    className={`pf-textarea ${styles.createTextarea}`}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="프로젝트에 대한 간단한 설명을 입력해 주세요."
                  />
                </div>

                {submitError ? (
                  <p className="pf-status pf-error">{submitError}</p>
                ) : null}

                <button
                  className={`pf-btn-accent ${styles.submitButton}`}
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "생성 중..." : "프로젝트 생성"}
                </button>
              </form>
            </aside>
          </section>

          <section className={`pf-card pf-card-pad ${styles.listSection}`}>
            <div className={styles.listHeader}>
              <div>
                <p className="pf-section-label">프로젝트 목록</p>
                <h2 className={styles.listTitle}>최근 활동 프로젝트</h2>
                <p className={`pf-page-copy ${styles.listCopy}`}>
                  대화가 누적된 프로젝트를 최근 수정 기준으로 정리합니다.
                </p>
              </div>

              <button
                className="pf-btn-outline"
                type="button"
                onClick={() => void loadProjects()}
              >
                새로고침
              </button>
            </div>

            {isLoading ? (
              <p className="pf-status">프로젝트 목록을 불러오는 중입니다...</p>
            ) : null}
            {!isLoading && error ? (
              <p className="pf-status pf-error">{error}</p>
            ) : null}
            {!isLoading && !error && projects.length === 0 ? (
              <div className={styles.emptyPanel}>
                <p className="pf-status">
                  아직 프로젝트가 없습니다. 첫 프로젝트를 생성해 주십시오.
                </p>
              </div>
            ) : null}

            {!isLoading && !error && projects.length > 0 ? (
              <div className={styles.projectList}>
                {sortedProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={styles.projectItem}
                  >
                    <div className={styles.projectMain}>
                      <div className={styles.projectTitleRow}>
                        <h3 className={styles.projectName}>{project.name}</h3>
                      </div>
                      <p
                        className={`pf-page-copy ${styles.projectDescription}`}
                      >
                        {project.description ||
                          "프로젝트 설명이 아직 없습니다."}
                      </p>
                      <p className={styles.projectMeta}>
                        최근 수정 {formatDate(project.updatedAt)}
                      </p>
                      {project.successfulPublishCount > 0 ? (
                        <span className={styles.publishBadge}>
                          Notion 배포 완료 {project.successfulPublishCount}건
                        </span>
                      ) : (
                        <span
                          className={`${styles.publishBadge} ${styles.publishBadgeNeutral}`}
                        >
                          Notion 미배포
                        </span>
                      )}
                    </div>
                    <span className={styles.projectArrow}>›</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
