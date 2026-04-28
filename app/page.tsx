"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import styles from "./page.module.css";

const TABS = ["대화 입력", "AI 기획서 생성", "섹션 편집", "Notion 배포"];

const CHAT_DEMO = [
  {
    role: "user",
    label: "사용자",
    time: "10:20",
    text: "신규 프로젝트 기획안을 정리해야 해요. 우선 요구사항과 주요 기능부터 정리하고 싶어요.",
  },
  {
    role: "assistant",
    label: "AI",
    time: "10:21",
    text: "좋아요. 먼저 프로젝트 목적, 주요 사용자, 핵심 기능을 기준으로 정리해볼게요. 우선 어떤 서비스를 만들 예정인가요?",
  },
  {
    role: "user",
    label: "사용자",
    time: "10:22",
    text: "팀 협업용 업무관리 도구이고, 초반에는 프로젝트 등록, 대화 기록, AI 기획서 초안 생성 기능이 필요해요.",
  },
];

const SPEC_PREVIEW = {
  title: "업무관리 도구 MVP 기획서",
  summary:
    "프로젝트 등록, 대화 기록, AI 기획서 초안 생성을 초기 범위로 두고 핵심 기능과 사용자 흐름을 구조화한 초안입니다.",
  sections: ["배경", "문제", "목표", "요구사항", "사용자 흐름", "화면 설계"],
};

const FEATURES = [
  {
    icon: "💬",
    title: "자연어 대화 입력",
    desc: "아이디어, 요구사항, 제약사항을 대화 흐름 안에서 편하게 쌓고 프로젝트 맥락을 유지합니다.",
  },
  {
    icon: "⚡",
    title: "AI 기획서 생성",
    desc: "누적된 대화를 구조화된 기획 문서 초안으로 연결할 준비를 빠르게 마칠 수 있습니다.",
  },
  {
    icon: "✏️",
    title: "섹션별 편집",
    desc: "자동 생성된 문서를 섹션 단위로 검토하고 필요한 부분만 쉽게 수정할 수 있습니다.",
  },
  {
    icon: "📝",
    title: "Notion으로 내보내기",
    desc: "완성된 기획서를 Notion 페이지로 배포하거나 팀과 바로 공유할 수 있습니다.",
  },
];

const STEPS = [
  {
    num: "01",
    label: "프로젝트 생성",
    desc: "프로젝트를 만들고 대화를 시작할 기본 공간을 준비합니다.",
  },
  {
    num: "02",
    label: "대화 진행",
    desc: "아이디어와 요구사항을 자연스럽게 주고받으며 핵심 맥락을 기록합니다.",
  },
  {
    num: "03",
    label: "AI 기획서 생성",
    desc: "누적된 대화를 바탕으로 구조화된 기획 문서 초안을 만드는 단계입니다.",
  },
  {
    num: "04",
    label: "검토 및 편집",
    desc: "섹션별로 내용을 검토하고 필요한 부분을 실제 개발 방향에 맞게 다듬습니다.",
  },
  {
    num: "05",
    label: "Notion 배포",
    desc: "완성된 문서를 Notion 페이지에 연결해 팀과 공유할 수 있도록 마무리합니다.",
  },
];

const MARQUEE_ITEMS = [
  "대화 기반 기획",
  "프로젝트 대화 기록",
  "AI 초안 준비",
  "섹션별 편집",
  "Notion 배포 흐름",
  "구조화된 기획 문서",
  "실무형 워크스페이스",
  "대화 기반 기획",
  "프로젝트 대화 기록",
  "AI 초안 준비",
  "섹션별 편집",
  "Notion 배포 흐름",
  "구조화된 기획 문서",
  "실무형 워크스페이스",
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const typeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullText = "말하던 대화가 개발 가능한 기획 흐름으로 이어집니다.";

  useEffect(() => {
    let index = 0;

    const type = () => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index += 1;
        typeRef.current = setTimeout(type, 36);
      }
    };

    const delay = setTimeout(type, 700);

    return () => {
      clearTimeout(delay);

      if (typeRef.current) {
        clearTimeout(typeRef.current);
      }
    };
  }, [fullText]);

  useEffect(() => {
    const blink = setInterval(() => setShowCursor((value) => !value), 520);

    return () => clearInterval(blink);
  }, []);

  return (
    <div className="pf-page-shell">
      <Header fixed />

      <section className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <div className={styles.heroInner}>
          <div className={`pf-mini-pill ${styles.heroPill}`}>
            <span className={styles.heroPillDot} />
            AI 기반 기획 자동화
          </div>

          <h1 className={styles.heroTitle}>
            흩어진 메모를 넘어,
            <br />
            <span className={styles.heroAccent}>대화가</span> 기획서가 됩니다.
          </h1>

          <p className={styles.heroCopy}>
            프로젝트 대화부터 Notion에 바로 쓸 수 있는 기획 문서까지.
            <br />
            PlanFlush는 흩어진 대화와 개발 가능한 기획서 사이를 자연스럽게 정리합니다.
          </p>

          <p className={styles.heroQuote}>
            &quot;{typedText}
            <span className={showCursor ? styles.cursorVisible : styles.cursorHidden}>|</span>&quot;
          </p>

          <div className={styles.heroActions}>
            <Link href="/projects" className={`pf-btn-primary ${styles.heroButtonPrimary}`}>
              프로젝트 시작하기
            </Link>
            <a href="#demo" className={`pf-btn-outline ${styles.heroButtonSecondary}`}>
              데모 보기
            </a>
          </div>
        </div>
      </section>

      <section id="demo" className={styles.demoSection}>
        <div className={styles.demoFrame}>
          <div className={styles.demoTabs}>
            {TABS.map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={`${styles.demoTab} ${activeTab === index ? styles.demoTabActive : ""}`}
                onClick={() => setActiveTab(index)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={styles.demoPanel}>
            {activeTab === 0 && (
              <div className={styles.demoConversation}>
                <div className={styles.demoMeta}>
                  프로젝트: PlanFlush 데모 · 저장된 대화 3건
                </div>

                <div className={styles.demoMessageList}>
                  {CHAT_DEMO.map((message, index) => {
                    const isUser = message.role === "user";

                    return (
                      <div
                        key={`${message.role}-${index}`}
                        className={`${styles.demoMessageRow} ${isUser ? styles.demoMessageRowUser : styles.demoMessageRowAssistant}`}
                      >
                        <div
                          className={`${styles.demoMessageCard} ${isUser ? styles.demoMessageCardUser : styles.demoMessageCardAssistant}`}
                        >
                          <div className={styles.demoMessageMeta}>
                            <span className={styles.demoMessageLabel}>{message.label}</span>
                            <span className={styles.demoMessageTime}>{message.time}</span>
                          </div>
                          <p className={styles.demoMessageText}>{message.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.demoComposer}>
                  <textarea
                    className={styles.demoTextarea}
                    placeholder="회의 내용, 요구사항, 이슈, 결정사항을 입력하세요."
                    readOnly
                  />
                  <button type="button" className={styles.demoSendButton} aria-label="메시지 전송">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.sendIcon}>
                      <path
                        d="M20 4 4 11.2l6.2 2.2L12.4 20 20 4Z"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M10.2 13.4 20 4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className={styles.previewBlock}>
                <div className={styles.previewMeta}>
                  AI가 대화를 읽고 기획서 초안을 구조화하는 화면입니다.
                </div>

                <div className={styles.specCard}>
                  <div className={styles.specHeader}>
                    <span className={styles.specTitle}>{SPEC_PREVIEW.title}</span>
                    <span className={styles.specBadge}>초안</span>
                  </div>
                  <p className={styles.specSummary}>{SPEC_PREVIEW.summary}</p>
                  <div className={styles.specTags}>
                    {SPEC_PREVIEW.sections.map((section) => (
                      <span key={section} className={styles.specTag}>
                        {section}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.previewActions}>
                  <button className="pf-btn-primary" type="button">
                    기획서 초안 확인
                  </button>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className={styles.previewBlock}>
                <div className={styles.previewMeta}>
                  생성된 초안을 섹션 단위로 검토하고 수정하는 화면입니다.
                </div>

                <div className={styles.sectionList}>
                  {[
                    ["배경", "검토 완료"],
                    ["문제", "검토 완료"],
                    ["목표", "편집 중"],
                  ].map(([section, state], index) => (
                    <div
                      key={section}
                      className={`${styles.sectionItem} ${index === 2 ? styles.sectionItemActive : ""}`}
                    >
                      <span className={styles.sectionName}>{section}</span>
                      <span className={styles.sectionState}>{state}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.previewActions}>
                  <button className="pf-btn-outline" type="button">
                    취소
                  </button>
                  <button className="pf-btn-primary" type="button">
                    섹션 저장
                  </button>
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className={styles.publishPreview}>
                <div className={styles.publishIcon}>N</div>
                <h3 className={styles.publishTitle}>{SPEC_PREVIEW.title}</h3>
                <p className={styles.publishCopy}>
                  섹션 6개 검토 완료 후 Notion 배포 단계로 이어지는 화면입니다.
                </p>
                <button className="pf-btn-accent" type="button">
                  Notion 배포
                </button>
                <div className={styles.notionBadge}>
                  <span className={styles.notionDot} />
                  notion.so/planflush/workspace-planning-doc
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className={styles.marqueeSection}>
        <div className={styles.marqueeViewport}>
          <div className={styles.marqueeTrack}>
            {MARQUEE_ITEMS.map((text, index) => (
              <span key={`${text}-${index}`} className={styles.marqueeItem}>
                {text}
                <span className={styles.marqueeDot}>•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeading}>
          <p className="pf-section-label">핵심 기능</p>
          <h2 className={styles.sectionTitle}>
            기획자에게 필요한 것만.
            <br />
            <span className={styles.sectionTitleMuted}>복잡한 기능은 줄였습니다.</span>
          </h2>
        </div>

        <div className={styles.featuresGrid}>
          {FEATURES.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className={styles.stepsSection}>
        <div className={styles.stepsInner}>
          <div className={styles.stepsHeading}>
            <p className="pf-section-label">진행 방식</p>
            <h2 className={styles.stepsTitle}>
              아이디어에서
              <br />
              <span className={styles.stepsAccent}>Notion 페이지까지 5단계.</span>
            </h2>
          </div>

          <div className={styles.stepsGrid}>
            {STEPS.map((step, index) => (
              <div key={step.num} className={styles.stepWrap}>
                {index < STEPS.length - 1 ? (
                  <div className={styles.stepConnector} aria-hidden="true">
                    <span className={styles.connectorLine} />
                    <span className={styles.connectorArrow}>→</span>
                  </div>
                ) : null}

                <div className={styles.stepCard}>
                  <div className={styles.stepNum}>{step.num}</div>
                  <div className={styles.stepLabel}>{step.label}</div>
                  <div className={styles.stepDesc}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>
            첫 기획서를
            <br />
            <span className={styles.ctaAccent}>만들어볼까요?</span>
          </h2>
          <p className={styles.ctaCopy}>
            프로젝트를 만들고 대화를 시작하면, 다음 단계에서 개발 가능한 기획 문서로 자연스럽게 이어갈 수 있습니다.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/projects" className="pf-btn-accent">
              첫 프로젝트 만들기
            </Link>
          </div>
          <p className={styles.ctaHint}>
            MVP에서는 로그인 없이 로컬 환경에서 바로 사용할 수 있습니다.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
