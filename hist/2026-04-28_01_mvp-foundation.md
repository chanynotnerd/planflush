# PlanFlush MVP Foundation 구현 히스토리

**날짜:** 2026-04-28  
**작업자:** Codex  
**프로젝트:** PlanFlush  
**진행률:** 2/6 완료, 33%

---

## 📋 상황 요약

PlanFlush MVP의 초기 기반 구현 상태를 정리한 문서입니다.

현재 저장소 기준으로 다음 범위가 구현되어 있습니다.

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/[id]`
- `GET /api/projects/[id]/messages`
- `POST /api/projects/[id]/messages`
- 프로젝트 목록/생성 UI
- 프로젝트 상세 채팅 UI
- Prisma 7 + MySQL 8.0 기본 스키마

기준 커밋:

- `705daff feat: implement PlanFlush MVP foundation`
- `7951f71 docs: update README description`
- `ce3fd6b Merge pull request #1 from chanynotnerd/docs/update-readme`

## 🎯 요구사항 및 문제 분석

MVP 1차 목표는 `Project create/list API`였습니다.

핵심 요구사항:

- 프로젝트를 생성할 수 있어야 함
- 프로젝트 목록을 최신 수정 순으로 볼 수 있어야 함
- 프로젝트별 메시지를 저장하고 다시 불러올 수 있어야 함
- 이후 AI spec 생성 단계로 확장 가능한 DB 구조가 필요함

추가 판단:

- Prisma 7 규칙에 맞게 `prisma.config.ts`에서 `DATABASE_URL`을 로드하도록 구성
- `schema.prisma`는 datasource URL 없이 provider만 유지
- `Spec`, `NotionPublishLog` 모델까지 먼저 잡아두어 이후 단계 확장 비용 감소

## 🛠️ 구현/작업 내용

### 구현 범위

- `Project` 생성/목록/상세 조회 API 구현
- `Message` 생성/목록 조회 API 구현
- 프로젝트 목록 페이지 구현
- 프로젝트 상세 페이지 구현
- Prisma Client 공용 인스턴스 구성
- 초기 마이그레이션 생성

### 변경 파일 요약

- `app/api/projects/route.ts`: +2 handlers, +1 payload type, +1 helper
- `app/api/projects/[id]/route.ts`: +1 handler, +1 route context type, +1 helper
- `app/api/projects/[id]/messages/route.ts`: +2 handlers, +2 helper functions, +1 payload type
- `app/projects/page.tsx`: +1 page component, +2 client actions
- `app/projects/[id]/page.tsx`: +1 page component, +1 submit action, +1 data load flow
- `lib/prisma.ts`: +1 Prisma singleton
- `prisma/schema.prisma`: +4 models
- `prisma.config.ts`: +1 Prisma 7 config
- `prisma/migrations/20260427124629_init/migration.sql`: +4 tables, +4 foreign keys

### 주요 파일 및 라인

- [app/api/projects/route.ts](/C:/chanynotnerd/planflush/app/api/projects/route.ts:12)
  `GET`, `POST`, `normalizeString`
- [app/api/projects/[id]/route.ts](/C:/chanynotnerd/planflush/app/api/projects/[id]/route.ts:19)
  `GET`, `parseProjectId`
- [app/api/projects/[id]/messages/route.ts](/C:/chanynotnerd/planflush/app/api/projects/[id]/messages/route.ts:43)
  `GET`, `POST`, `projectExists`, `parseProjectId`, `normalizeString`
- [app/projects/page.tsx](/C:/chanynotnerd/planflush/app/projects/page.tsx:29)
  `ProjectsPage`, `loadProjects`, `handleSubmit`
- [app/projects/[id]/page.tsx](/C:/chanynotnerd/planflush/app/projects/[id]/page.tsx:60)
  `ProjectDetailPage`, `handleSubmit`, `localizeApiMessage`
- [lib/prisma.ts](/C:/chanynotnerd/planflush/lib/prisma.ts:1)
  Prisma adapter/client singleton
- [prisma/schema.prisma](/C:/chanynotnerd/planflush/prisma/schema.prisma:9)
  `Project`, `Message`, `Spec`, `NotionPublishLog`
- [prisma.config.ts](/C:/chanynotnerd/planflush/prisma.config.ts:1)
  Prisma 7 datasource config
- [prisma/migrations/20260427124629_init/migration.sql](/C:/chanynotnerd/planflush/prisma/migrations/20260427124629_init/migration.sql:1)
  초기 DB 생성 SQL

### 구현 함수명 목록

- `GET`
- `POST`
- `normalizeString`
- `parseProjectId`
- `projectExists`
- `loadProjects`
- `handleSubmit`
- `localizeApiMessage`

### 주요 구조체, 모델, 타입

- `CreateProjectPayload`
  핵심 필드: `name`, `description`
- `CreateMessagePayload`
  핵심 필드: `role`, `content`
- `ProjectDetailRouteContext`
  핵심 필드: `params.id`
- `ProjectMessagesRouteContext`
  핵심 필드: `params.id`
- `Project`
  핵심 필드: `id`, `name`, `description`, `createdAt`, `updatedAt`
- `Message`
  핵심 필드: `id`, `projectId`, `role`, `content`, `createdAt`
- `Spec`
  핵심 필드: `id`, `projectId`, `title`, `contentJson`, `status`, `version`
- `NotionPublishLog`
  핵심 필드: `id`, `projectId`, `specId`, `publishStatus`, `notionPageId`, `notionUrl`

### 핵심 설계 결정

- API 구조:
  App Router Route Handler 패턴을 사용해 MVP 요구 경로와 1:1 대응
- 타입 선택:
  요청 body는 `unknown` 기반 payload type으로 받고 서버에서 trim/검증 수행
- ID 처리:
  `parseProjectId`로 양의 정수만 허용해 `400`과 `404`를 분리
- 메시지 정합성:
  `ALLOWED_MESSAGE_ROLES`로 role 입력을 제한
- 정렬 정책:
  프로젝트 목록은 `updatedAt desc`, 메시지 목록은 `createdAt asc`
- 확장성:
  아직 API 미구현이어도 `Spec`, `NotionPublishLog` 모델을 먼저 생성
- Prisma 구성:
  `prisma.config.ts`에서 `DATABASE_URL`을 읽고 `schema.prisma`는 provider만 유지

## ✅ 결과 및 검증

### 현재 확인 가능한 API 동작

- `GET /api/projects`
  최신 수정순 프로젝트 배열 반환
- `POST /api/projects`
  `name` 필수 검증, trim 처리, 생성 객체 반환
- `GET /api/projects/[id]`
  잘못된 ID는 `400`, 없는 프로젝트는 `404`
- `GET /api/projects/[id]/messages`
  프로젝트 존재 확인 후 메시지 목록 반환
- `POST /api/projects/[id]/messages`
  `role`, `content` 검증 후 메시지 생성, 프로젝트 `updatedAt` 동시 갱신

### 실제 응답으로 검증해야 하는 핵심 필드

- Project:
  `id`, `name`, `description`, `createdAt`, `updatedAt`
- Message:
  `id`, `projectId`, `role`, `content`, `createdAt`
- Error:
  `message`

### 재현 명령어

```powershell
cd C:\chanynotnerd\planflush
npx prisma validate
```

```powershell
cd C:\chanynotnerd\planflush
npx prisma generate
```

```powershell
cd C:\chanynotnerd\planflush
npm run dev
```

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/projects" -Method GET
```

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/projects" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"PlanFlush MVP","description":"First test project"}'
```

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/projects/1/messages" -Method GET
```

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/projects/1/messages" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"role":"user","content":"Need a planning doc workflow"}'
```

### 기대 결과

- 프로젝트 생성 후 `201`과 생성된 `Project` 객체 반환
- 이름 없이 생성 시 `400`과 `"Project name is required."`
- 존재하지 않는 프로젝트 상세/메시지 조회 시 `404`
- 메시지 저장 후 상세 페이지에서 새 메시지 즉시 반영

## 🚧 미구현 항목

- [ ] Generate Spec API
- [ ] OpenAI 연동
- [ ] Spec detail/update API
- [ ] 섹션 기반 Spec 편집 UI
- [ ] Flush to Notion API
- [ ] Notion publish log UI
- [ ] publish success/failure 저장 로직
- [ ] loading/error/empty state 추가 보강

## 🧠 학습/참고 키워드

- Prisma 7 `prisma.config.ts`
- MySQL + Prisma migration
- Next.js App Router Route Handlers
- Request body validation
- optimistic UI-lite append
- project/message relational modeling
