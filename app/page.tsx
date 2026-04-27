"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

const TABS = ["대화 입력", "AI 기획서 생성", "섹션 편집", "Notion 배포"];

const CHAT_DEMO = [
  {
    role: "user",
    text: "We need a project management tool that integrates with Slack and auto-assigns tasks based on workload.",
  },
  {
    role: "assistant",
    text: "Understood. Should the workload algorithm factor in task complexity or just quantity? And do you need a mobile-native experience?",
  },
  {
    role: "user",
    text: "Both complexity and quantity. Mobile PWA is fine for now. Priority is desktop PM dashboard.",
  },
];

const SPEC_PREVIEW = {
  title: "Slack 연동 PM 도구",
  summary:
    "Slack과 연동되고, 업무 복잡도와 작업량을 함께 고려해 자동으로 업무를 배정하는 데스크톱 중심 프로젝트 관리 플랫폼입니다.",
  sections: ["배경", "문제", "목표", "요구사항", "사용자 흐름", "화면 설계"],
};

const FEATURES = [
  {
    icon: "💬",
    title: "대화 기반 입력",
    desc: "아이디어, 요구사항, 제약사항을 자연스러운 대화로 바로 쌓을 수 있습니다. 처음부터 템플릿을 채울 필요가 없습니다.",
  },
  {
    icon: "⚡",
    title: "AI 기획서 생성",
    desc: "OpenAI가 대화 내용을 구조화된 개발용 기획 문서 초안으로 빠르게 정리합니다.",
  },
  {
    icon: "✏️",
    title: "섹션별 검토와 수정",
    desc: "생성된 기획서를 섹션 단위로 검토하고 필요한 부분만 다듬을 수 있습니다.",
  },
  {
    icon: "🚀",
    title: "Notion으로 배포",
    desc: "확정된 기획 문서를 한 번에 Notion 페이지로 배포하고 팀과 바로 공유할 수 있습니다.",
  },
];

const STEPS = [
  { num: "01", label: "프로젝트 생성", desc: "프로젝트 이름을 만들고 기본 맥락을 정리합니다." },
  { num: "02", label: "대화 저장", desc: "아이디어가 생길 때마다 메시지를 남기고 기록합니다." },
  { num: "03", label: "기획서 생성", desc: "AI가 대화를 읽고 구조화된 기획 문서 초안을 만듭니다." },
  { num: "04", label: "검토 및 확정", desc: "각 섹션을 다듬어 실제 개발에 쓸 수 있게 확정합니다." },
  { num: "05", label: "Notion 배포", desc: "한 번의 배포로 Notion 링크를 만들고 공유합니다." },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const typeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullText = "흩어진 대화 → 개발 가능한 기획서";

  useEffect(() => {
    let index = 0;

    const type = () => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index += 1;
        typeRef.current = setTimeout(type, 38);
      }
    };

    const delay = setTimeout(type, 800);

    return () => {
      clearTimeout(delay);

      if (typeRef.current) {
        clearTimeout(typeRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const blink = setInterval(() => setShowCursor((value) => !value), 530);

    return () => clearInterval(blink);
  }, []);

  return (
    <div className="pf-page-shell">
      <style>{`
        .tab-btn {
          padding: 0.5rem 1.1rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          border: 1.5px solid transparent;
        }

        .tab-btn.active {
          background: #1a1a1a;
          color: #f7f5f2;
          border-color: #1a1a1a;
        }

        .tab-btn.inactive {
          background: transparent;
          color: #888;
          border-color: #e0dbd4;
        }

        .tab-btn.inactive:hover {
          color: #444;
          border-color: #bbb;
        }

        .chat-bubble-user {
          background: #1a1a1a;
          color: #f7f5f2;
          padding: 0.7rem 1rem;
          border-radius: 16px 16px 4px 16px;
          font-size: 0.82rem;
          line-height: 1.55;
          max-width: 78%;
          align-self: flex-end;
        }

        .chat-bubble-ai {
          background: #fff;
          color: #333;
          padding: 0.7rem 1rem;
          border-radius: 16px 16px 16px 4px;
          font-size: 0.82rem;
          line-height: 1.55;
          max-width: 78%;
          align-self: flex-start;
          border: 1px solid #e8e4de;
        }

        .feature-card {
          padding: 2rem;
          border-radius: 20px;
          background: #fff;
          border: 1px solid #e8e4de;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
        }

        .marquee-track {
          display: flex;
          gap: 2rem;
          animation: marquee 28s linear infinite;
          white-space: nowrap;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .hero-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,180,120,0.18) 0%, transparent 70%);
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .spec-tag {
          display: inline-block;
          background: #f0ede8;
          color: #666;
          font-size: 0.72rem;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-weight: 500;
        }

        .notion-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #fff;
          border: 1px solid #e8e4de;
          padding: 0.4rem 0.9rem;
          border-radius: 999px;
          font-size: 0.78rem;
          color: #555;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.4rem !important;
          }

          .features-grid {
            grid-template-columns: 1fr !important;
          }

          .steps-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      <Header fixed />

      <section
        style={{
          paddingTop: "120px",
          paddingBottom: "80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="hero-glow" />

        <div className="pf-mini-pill" style={{ marginBottom: "2rem" }}>
          <span style={{ color: "#c85a2a" }}>●</span> AI 기반 기획 자동화
        </div>

        <h1
          className="hero-title"
          style={{
            fontFamily: "var(--font-brand-serif)",
            fontSize: "3.8rem",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "1.5rem",
            maxWidth: "700px",
            margin: "0 auto 1.5rem",
          }}
        >
          흩어진 메모를 넘어.
          <br />
          <span style={{ color: "#c85a2a" }}>대화가</span> 기획서가 됩니다.
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: "#666",
            lineHeight: 1.7,
            maxWidth: "480px",
            margin: "0 auto 0.75rem",
          }}
        >
          프로젝트 대화부터 Notion에 배포할 수 있는 기획 문서까지.
          <br />
          PlanFlush는 흩어진 대화와 개발 가능한 기획서 사이를 자동으로 정리합니다.
        </p>

        <p
          style={{
            fontFamily: "var(--font-brand-serif)",
            fontSize: "1.1rem",
            color: "#333",
            marginBottom: "2.5rem",
            fontWeight: 700,
          }}
        >
          &quot;{typedText}
          <span style={{ opacity: showCursor ? 1 : 0 }}>|</span>&quot;
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/projects" className="pf-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}>
            프로젝트 시작하기 →
          </Link>
          <a href="#demo" className="pf-btn-outline" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}>
            데모 보기
          </a>
        </div>
      </section>

      <section id="demo" style={{ padding: "0 1.5rem 80px", maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8e4de",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #f0ede8",
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {TABS.map((tab, index) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === index ? "active" : "inactive"}`}
                onClick={() => setActiveTab(index)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ padding: "1.5rem", minHeight: "320px" }}>
            {activeTab === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ fontSize: "0.72rem", color: "#aaa", fontWeight: 500, marginBottom: "0.25rem" }}>
                  프로젝트: PM 도구 연동 · 메시지 3개
                </div>
                {CHAT_DEMO.map((message, index) => (
                  <div
                    key={index}
                    className={message.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}
                  >
                    {message.text}
                  </div>
                ))}
                <div
                  style={{
                    marginTop: "0.5rem",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <input
                    placeholder="추가 내용을 입력하세요..."
                    style={{
                      flex: 1,
                      border: "1px solid #e8e4de",
                      borderRadius: "999px",
                      padding: "0.55rem 1rem",
                      fontSize: "0.82rem",
                      fontFamily: "inherit",
                      background: "#faf9f7",
                      outline: "none",
                      color: "#333",
                    }}
                    readOnly
                  />
                  <button className="pf-btn-primary" style={{ padding: "0.55rem 1.2rem", fontSize: "0.82rem" }} type="button">
                    저장
                  </button>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div>
                <div style={{ fontSize: "0.72rem", color: "#aaa", fontWeight: 500, marginBottom: "1rem" }}>
                  AI가 메시지 3개를 읽고 기획서를 생성하는 중입니다...
                </div>
                <div className="pf-card" style={{ background: "#faf9f7", padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span style={{ fontFamily: "var(--font-brand-serif)", fontSize: "1rem", fontWeight: 700 }}>
                      {SPEC_PREVIEW.title}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#c85a2a", fontWeight: 700 }}>초안</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#666", lineHeight: 1.6, marginBottom: "1rem" }}>
                    {SPEC_PREVIEW.summary}
                  </p>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {SPEC_PREVIEW.sections.map((section) => (
                      <span key={section} className="spec-tag">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                  <button className="pf-btn-primary" style={{ fontSize: "0.82rem" }} type="button">
                    초안 저장 →
                  </button>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div>
                <div style={{ fontSize: "0.72rem", color: "#aaa", fontWeight: 500, marginBottom: "1rem" }}>
                  편집 중: 요구사항 섹션
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {["배경", "문제", "목표"].map((section, index) => (
                    <div
                      key={section}
                      style={{
                        padding: "0.85rem 1rem",
                        border: `1px solid ${index === 2 ? "#c85a2a" : "#e8e4de"}`,
                        borderRadius: "12px",
                        background: index === 2 ? "#fff8f5" : "#faf9f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: "0.82rem", fontWeight: 500, color: index === 2 ? "#c85a2a" : "#555" }}>
                        {section}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: index === 2 ? "#c85a2a" : "#bbb" }}>
                        {index === 2 ? "● 편집 중" : "✓ 저장됨"}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button className="pf-btn-outline" style={{ fontSize: "0.82rem" }} type="button">
                    취소
                  </button>
                  <button className="pf-btn-primary" style={{ fontSize: "0.82rem" }} type="button">
                    섹션 저장
                  </button>
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div style={{ textAlign: "center", paddingTop: "1.5rem" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "#f0ede8",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    margin: "0 auto 1rem",
                  }}
                >
                  📄
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-brand-serif)",
                    fontSize: "1.1rem",
                    fontWeight: 650,
                    marginBottom: "0.5rem",
                  }}
                >
                  {SPEC_PREVIEW.title}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1.5rem" }}>
                  섹션 6개 확정 · 배포 준비 완료
                </p>
                <button className="pf-btn-accent" type="button">
                  🚀 Notion 배포
                </button>
                <div style={{ marginTop: "1.5rem" }}>
                  <div className="notion-badge" style={{ margin: "0 auto", display: "inline-flex" }}>
                    <span>✓</span> notion.so/planflush/pm-tool-integration
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div
        style={{
          overflow: "hidden",
          padding: "1.5rem 0",
          borderTop: "1px solid #e8e4de",
          borderBottom: "1px solid #e8e4de",
          background: "#f0ede8",
          marginBottom: "80px",
        }}
      >
        <div style={{ display: "flex", overflow: "hidden" }}>
          <div className="marquee-track">
            {[
              "대화 기반 기획",
              "AI 기획서 생성",
              "섹션 편집",
              "Notion 배포",
              "구조화된 문서",
              "OpenAI 기반",
              "프로젝트 관리",
              "대화 기반 기획",
              "AI 기획서 생성",
              "섹션 편집",
              "Notion 배포",
              "구조화된 문서",
              "OpenAI 기반",
              "프로젝트 관리",
            ].map((text, index) => (
              <span
                key={index}
                style={{
                  fontSize: "0.82rem",
                  color: "#999",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "2rem",
                }}
              >
                {text}
                <span style={{ color: "#c85a2a", fontSize: "0.6rem" }}>◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <section id="features" style={{ padding: "0 2rem 80px", maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p className="pf-section-label">핵심 흐름</p>
          <h2
            style={{
              fontFamily: "var(--font-brand-serif)",
              fontSize: "2.4rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            기획자에게 필요한 것만.
            <br />
            <span style={{ color: "#888" }}>복잡한 기능은 줄였습니다.</span>
          </h2>
        </div>
        <div
          className="features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
          }}
        >
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div style={{ fontSize: "1.8rem", marginBottom: "0.75rem" }}>{feature.icon}</div>
              <h3
                style={{
                  fontFamily: "var(--font-brand-serif)",
                  fontSize: "1.1rem",
                  fontWeight: 650,
                  marginBottom: "0.5rem",
                }}
              >
                {feature.title}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#777", lineHeight: 1.65 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        style={{
          padding: "60px 2rem",
          background: "#1a1a1a",
          color: "#f7f5f2",
        }}
      >
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ marginBottom: "3rem" }}>
            <p className="pf-section-label">진행 방식</p>
            <h2
              style={{
                fontFamily: "var(--font-brand-serif)",
                fontSize: "2.4rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              아이디어에서
              <br />
              <span style={{ color: "#c85a2a" }}>Notion 페이지까지 5단계.</span>
            </h2>
          </div>
          <div
            className="steps-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "1rem",
            }}
          >
            {STEPS.map((step, index) => (
              <div key={step.num} style={{ position: "relative" }}>
                {index < STEPS.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "1.25rem",
                      right: "-0.5rem",
                      color: "#444",
                      fontSize: "0.7rem",
                      zIndex: 1,
                    }}
                  >
                    →
                  </div>
                )}
                <div
                  style={{
                    background: "#232323",
                    border: "1px solid #333",
                    borderRadius: "16px",
                    padding: "1.25rem",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#c85a2a",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {step.num}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-brand-serif)",
                      fontSize: "0.95rem",
                      fontWeight: 650,
                      marginBottom: "0.4rem",
                    }}
                  >
                    {step.label}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "80px 2rem",
          textAlign: "center",
          background: "#f7f5f2",
        }}
      >
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-brand-serif)",
              fontSize: "2.8rem",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              marginBottom: "1rem",
            }}
          >
            첫 기획서를
            <br />
            <span style={{ color: "#c85a2a" }}>만들어볼까요?</span>
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.65, marginBottom: "2rem" }}>
            프로젝트를 만들고 대화를 저장하면, 다음 단계에서 개발 가능한 기획 문서로 정리할 수 있습니다.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/projects" className="pf-btn-accent">
              첫 프로젝트 만들기
            </Link>
          </div>
          <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#bbb" }}>
            MVP에서는 로그인 없이 로컬에서 사용할 수 있습니다.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
