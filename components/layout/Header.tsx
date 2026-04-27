import Link from "next/link";

type HeaderProps = {
  fixed?: boolean;
};

export function Header({ fixed = false }: HeaderProps) {
  return (
    <nav className={`pf-header ${fixed ? "pf-header-fixed" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Link href="/" className="pf-brand-link">
          PlanFlush
        </Link>
        <span className="pf-badge">MVP</span>
      </div>

      <div className="pf-header-links">
        <Link href="/" className="pf-nav-link">
          홈
        </Link>
        <Link href="/projects" className="pf-nav-link">
          프로젝트
        </Link>
        <Link href="/#how-it-works" className="pf-nav-link">
          진행 방식
        </Link>
        <Link href="/projects" className="pf-btn-primary">
          시작하기
        </Link>
      </div>
    </nav>
  );
}
