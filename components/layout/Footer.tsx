import Link from "next/link";

export function Footer() {
  return (
    <footer className="pf-footer">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link href="/" className="pf-brand-link" style={{ fontSize: "1rem" }}>
          PlanFlush
        </Link>
        <span style={{ fontSize: "0.75rem", color: "#aaa" }}>
          대화에서 Notion 기획서까지, 5단계로 정리합니다.
        </span>
      </div>
      <span style={{ fontSize: "0.78rem", color: "#bbb" }}>© 2026 PlanFlush</span>
    </footer>
  );
}
