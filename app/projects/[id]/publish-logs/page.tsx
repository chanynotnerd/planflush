"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import styles from "./page.module.css";

type Project = {
  id: number;
  name: string;
  description: string | null;
};

type PublishLog = {
  id: number;
  projectId: number;
  specId: number;
  notionPageId: string | null;
  notionUrl: string | null;
  publishStatus: string;
  errorMessage: string | null;
  publishedAt: string | null;
  createdAt: string;
  spec: {
    id: number;
    title: string;
    version: number;
  };
};

type PublishLogsResponse = {
  project: Project;
  publishLogs: PublishLog[];
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    specId?: string | string[];
  }>;
};

function localizeApiMessage(message?: string) {
  switch (message) {
    case "Invalid project id.":
      return "잘못된 프로젝트 ID입니다.";
    case "Project not found.":
      return "프로젝트를 찾을 수 없습니다.";
    case "Failed to fetch publish logs.":
      return "배포 이력을 불러오지 못했습니다.";
    default:
      return message ?? "";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR");
}

function getStatusLabel(status: string) {
  return status === "Success" ? "배포 성공" : "배포 실패";
}

function getPublishDate(log: PublishLog) {
  return log.publishedAt ?? log.createdAt;
}

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isPositiveIntegerString(value: string | undefined) {
  if (!value) {
    return false;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0;
}

export default function ProjectPublishLogsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = use(params);
  const { specId } = use(searchParams);
  const specIdParam = getSingleSearchParam(specId);
  const hasSpecBackTarget = isPositiveIntegerString(specIdParam);
  const primaryBackHref = hasSpecBackTarget ? `/specs/${specIdParam}` : `/projects/${id}`;
  const primaryBackLabel = hasSpecBackTarget
    ? "기획서 상세로 돌아가기"
    : "프로젝트 상세로 돌아가기";
  const [project, setProject] = useState<Project | null>(null);
  const [publishLogs, setPublishLogs] = useState<PublishLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadPublishLogs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/projects/${id}/publish-logs`, {
          cache: "no-store",
        });
        const data = (await response.json()) as
          | PublishLogsResponse
          | { message?: string };

        if (cancelled) {
          return;
        }

        if (!response.ok || !("publishLogs" in data)) {
          setError(
            "message" in data && data.message
              ? localizeApiMessage(data.message)
              : "배포 이력을 불러오지 못했습니다.",
          );
          return;
        }

        setProject(data.project);
        setPublishLogs(data.publishLogs);
      } catch {
        if (!cancelled) {
          setError("배포 이력을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPublishLogs();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="pf-page-shell">
      <Header fixed />

      <main className="pf-app-main">
        <div className={styles.page}>
          <div className={styles.backRow}>
            <Link href={primaryBackHref} className={styles.backLink}>
              ← {primaryBackLabel}
            </Link>
          </div>

          <section className={`pf-card pf-card-pad ${styles.headerCard}`}>
            <p className={styles.breadcrumbLabel}>Notion 배포 이력</p>
            <h1 className={`pf-page-title ${styles.pageTitle}`}>
              {project ? project.name : "프로젝트 배포 이력"}
            </h1>
            <p className={`pf-page-copy ${styles.headerCopy}`}>
              Flush to Notion 실행 결과를 최신순으로 확인합니다.
            </p>
          </section>

          {isLoading ? (
            <section className={`pf-card pf-card-pad ${styles.stateCard}`}>
              <p className="pf-status">배포 이력을 불러오는 중입니다...</p>
            </section>
          ) : null}

          {!isLoading && error ? (
            <section className={`pf-card pf-card-pad ${styles.stateCard}`}>
              <p className="pf-status pf-error">{error}</p>
            </section>
          ) : null}

          {!isLoading && !error && publishLogs.length === 0 ? (
            <section className={`pf-card pf-card-pad ${styles.stateCard}`}>
              <h2 className={styles.emptyTitle}>아직 배포 이력이 없습니다.</h2>
              <p className="pf-status">
                기획서 편집 화면에서 Flush to Notion을 실행하면 이곳에 결과가 표시됩니다.
              </p>
            </section>
          ) : null}

          {!isLoading && !error && publishLogs.length > 0 ? (
            <section className={styles.logList} aria-label="Notion 배포 이력">
              {publishLogs.map((log) => {
                const isSuccess = log.publishStatus === "Success";
                const publishDate = getPublishDate(log);

                return (
                  <article className={`pf-card ${styles.logCard}`} key={log.id}>
                    <h2 className={styles.logTitle}>{log.spec.title}</h2>

                    <dl className={styles.metaList}>
                      <div className={styles.metaRow}>
                        <dt>배포 시각</dt>
                        <dd>
                          <time dateTime={publishDate}>{formatDate(publishDate)}</time>
                        </dd>
                      </div>
                      <div className={styles.metaRow}>
                        <dt>버전 번호</dt>
                        <dd>v{log.spec.version}</dd>
                      </div>
                      <div className={styles.metaRow}>
                        <dt>배포 상태</dt>
                        <dd>
                          <span
                            className={`${styles.statusText} ${
                              isSuccess
                                ? styles.statusTextSuccess
                                : styles.statusTextFailed
                            }`}
                          >
                            {getStatusLabel(log.publishStatus)}
                          </span>
                        </dd>
                      </div>
                    </dl>

                    {isSuccess && log.notionUrl ? (
                      <Link
                        href={log.notionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.notionLink}
                      >
                        Notion 페이지 열기 ↗
                      </Link>
                    ) : null}

                    {!isSuccess && log.errorMessage ? (
                      <div className={styles.errorBox}>
                        <p className={styles.errorLabel}>실패 사유</p>
                        <p className={styles.errorMessage}>{log.errorMessage}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </section>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
