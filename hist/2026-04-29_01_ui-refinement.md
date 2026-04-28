# UI 정리 및 디자인 가이드 반영 히스토리

**날짜:** 2026-04-29  
**작업자:** Codex  
**프로젝트:** PlanFlush  
**진행률:** 2/6 완료, 33%

---

## 📋 상황 요약

오늘 작업은 MVP Phase 2 범위를 유지한 상태에서 UI/UX 품질을 정리하는 데 집중했습니다.

- `references/design/awesome-design-md/design-md/linear.app` 디자인 레퍼런스 추가
- `AGENTS.md`에 UI design reference 가이드 반영
- `/`, `/projects`, `/projects/[id]` 화면 정리
- 페이지별 CSS Module 적용
- Phase 3 `AI Spec Generation`은 아직 구현하지 않음

작업 흐름상 UI 관련 브랜치 작업을 정리하고 병합한 뒤, 다음 단계 시작점을 `feat/generate-spec-api`로 잡는 방향까지 확인했습니다.

## 🎯 요구사항 및 문제 분석

PlanFlush는 단순 CRUD 화면보다, 대화 기반 기획 워크스페이스로 보여야 했습니다.

오늘 기준 핵심 판단:

- MVP 범위를 넘는 AI spec 기능은 미리 구현하지 않음
- DB 스키마, Prisma 스키마, API 계약은 건드리지 않음
- Linear 계열 SaaS 레이아웃 감각을 참고하되 PlanFlush의 대화 중심 구조에 맞게 조정
- 랜딩과 프로젝트 화면 모두 "실무형 기획 도구" 톤으로 통일

## 🛠️ 구현/작업 내용

### 변경 파일 요약

- `AGENTS.md`: +1 UI design reference section
- `app/page.tsx`: +1 landing page composition, +1 demo preview flow
- `app/page.module.css`: +1 hero layout, +1 feature/step/CTA styling set
- `app/projects/page.tsx`: +1 dashboard/list/create workspace layout
- `app/projects/page.module.css`: +1 project dashboard styling set
- `app/projects/[id]/page.tsx`: +1 conversation workspace layout, +1 detail sidebar
- `app/projects/[id]/page.module.css`: +1 timeline/composer/detail styling set

### 주요 파일 및 라인

- `references/design/awesome-design-md/design-md/linear.app`
  UI/UX 레퍼런스 경로
- [AGENTS.md](/C:/chanynotnerd/planflush/AGENTS.md:387)
  UI Design Reference 가이드
- [app/page.tsx](/C:/chanynotnerd/planflush/app/page.tsx:107)
  `LandingPage`
- [app/page.tsx](/C:/chanynotnerd/planflush/app/page.tsx:146)
  hero, demo preview, feature cards, 5-step flow, CTA 섹션
- [app/page.module.css](/C:/chanynotnerd/planflush/app/page.module.css:40)
  hero headline 및 spacing
- [app/page.module.css](/C:/chanynotnerd/planflush/app/page.module.css:96)
  demo preview 프레임
- [app/page.module.css](/C:/chanynotnerd/planflush/app/page.module.css:465)
  feature cards
- [app/page.module.css](/C:/chanynotnerd/planflush/app/page.module.css:534)
  5-step flow
- [app/page.module.css](/C:/chanynotnerd/planflush/app/page.module.css:635)
  CTA 섹션
- [app/projects/page.tsx](/C:/chanynotnerd/planflush/app/projects/page.tsx:34)
  `ProjectsPage`
- [app/projects/page.tsx](/C:/chanynotnerd/planflush/app/projects/page.tsx:127)
  `/projects` dashboard UI
- [app/projects/page.module.css](/C:/chanynotnerd/planflush/app/projects/page.module.css:25)
  dashboard 카드 스타일
- [app/projects/page.module.css](/C:/chanynotnerd/planflush/app/projects/page.module.css:177)
  프로젝트 목록 카드 스타일
- [app/projects/[id]/page.tsx](/C:/chanynotnerd/planflush/app/projects/[id]/page.tsx:63)
  `ProjectDetailPage`
- [app/projects/[id]/page.tsx](/C:/chanynotnerd/planflush/app/projects/[id]/page.tsx:191)
  conversation header/timeline/composer/sidebar
- [app/projects/[id]/page.module.css](/C:/chanynotnerd/planflush/app/projects/[id]/page.module.css:83)
  conversation timeline card
- [app/projects/[id]/page.module.css](/C:/chanynotnerd/planflush/app/projects/[id]/page.module.css:226)
  composer 영역
- [app/projects/[id]/page.module.css](/C:/chanynotnerd/planflush/app/projects/[id]/page.module.css:299)
  sidebar 정보 카드

### 구현 함수명 목록

- `LandingPage`
- `ProjectsPage`
- `ProjectDetailPage`
- `loadProjects`
- `handleSubmit`
- `localizeApiMessage`
- `formatDate`

### 핵심 설계 결정

- 디자인 레퍼런스 적용 이유:
  `linear.app`를 그대로 복제하지 않고, 프로젝트 컨텍스트 압축 + 대화 타임라인 중심 구조만 차용했습니다.
- 페이지별 CSS Module 적용 이유:
  랜딩, 프로젝트 목록, 프로젝트 상세의 스타일 책임을 분리해 MVP 단계 유지보수를 쉽게 했습니다.
- 범위 통제 이유:
  AGENTS.md 기준 Phase 2까지만 다루고, Phase 3 `Generate Spec` 구현은 의도적으로 보류했습니다.
- UI 우선 정리 이유:
  API/DB를 더 늘리기 전에 제품 톤과 사용자 흐름을 먼저 안정화하는 편이 다음 단계 검증에 유리했습니다.

## ✅ 결과 및 검증

오늘 작업 결과:

- 랜딩 페이지 hero, demo preview, feature cards, 5-step flow, CTA 구성이 정리됨
- hero headline spacing이 조정됨
- `/projects`가 대시보드형 프로젝트 진입 화면으로 정리됨
- `/projects/[id]`가 대화 타임라인 중심 프로젝트 작업 화면으로 정리됨
- CSS Module 기반 페이지별 스타일 분리가 적용됨
- UI 작업은 main 기준으로 정리 가능한 상태까지 병합/브랜치 정리가 수행됨
- Docker MySQL 정지 상태와 작업 정리 상태를 확인하는 흐름이 포함됨

현재 확인 메모:

- `docker ps -a --filter "name=planflush-mysql"` 결과상 컨테이너는 실행 중이 아닙니다.
- 이번 문서 작성 시점의 워킹트리는 히스토리 문서 추가 파일 때문에 완전 clean 상태는 아닙니다.

다음 계획:

- AGENTS.md Phase 3 시작
- 작업 브랜치: `feat/generate-spec-api`
- 목표: `Generate Spec API` 구현 시작

## 🚧 미구현 항목

- [ ] `POST /api/projects/[id]/generate-spec`
- [ ] OpenAI API 연동
- [ ] `Spec` 저장 로직
- [ ] 생성된 초안 미리보기 UI
- [ ] Spec 편집 화면 고도화
- [ ] Flush to Notion 구현

## 🧠 학습/참고 키워드

- Linear-inspired SaaS layout
- conversation-first workspace UI
- page-scoped CSS Modules
- Phase-based MVP scope control
- landing hero spacing refinement
