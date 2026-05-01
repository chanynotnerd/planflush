<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

## 1. Project Overview

This repository is for **PlanFlush**.

PlanFlush is a chat-based AI planning document automation system.

The user creates a project, discusses requirements with an AI assistant inside the project chat, saves the conversation, generates a structured planning document with AI, edits the generated spec section by section, and finally clicks **Flush to Notion** to publish the confirmed planning document to Notion.

PlanFlush is not a simple todo app, generic summarizer, or one-shot document generator.

It is a practical planning workflow tool for service planners, PMs, and operators who need to convert scattered conversations, questions, decisions, and implementation details into development-ready planning documents.

The core product concept is:

```text
Project conversation with AI
→ requirement clarification
→ planning agreement
→ draft planning document generation
→ user review/edit
→ Notion publishing
```

The AI assistant should help the user clarify requirements before the final planning document is generated.

---

## 2. MVP Flow

The MVP flow is:

```text
Project creation
→ project-based chat input
→ save user message
→ generate AI assistant reply
→ save assistant message
→ repeat project conversation until requirements are clear
→ user clicks "기획서 초안 생성"
→ generate structured planning spec with AI from the full conversation
→ save AI draft
→ edit spec sections
→ save edited spec
→ Flush to Notion
→ create Notion page
→ save publish logs
→ show Notion link
```

Important product distinction:

```text
AI Chat Reply
= AI helps the user clarify and organize requirements inside the project conversation.

Generate Spec / 기획서 초안 생성
= AI reads the full saved conversation and creates a structured planning document draft.

Flush to Notion
= User publishes the reviewed/confirmed planning document to Notion.
```

Do not merge these steps into one automatic flow.

AI output must not be published to Notion automatically.

---

## 3. Tech Stack

Use the current project stack.

- Next.js 16.2.4
- TypeScript
- App Router
- Tailwind CSS
- MySQL 8.0 via Docker
- Prisma 7
- OpenAI API
- Notion API

The project currently uses the default Next.js structure without a `src` directory.

---

## 4. Local Development Environment

The local project path is:

```text
C:\chanynotnerd\planflush
```

MySQL runs through Docker.

```text
Docker container name: planflush-mysql
MySQL host: localhost
MySQL external port: 3307
MySQL internal port: 3306
Database: planflush
```

Do not hardcode database credentials in application code.

Use `.env` and environment variables.

Expected environment variables:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3307/planflush"

OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.4-mini"

NOTION_API_KEY=""
NOTION_DATABASE_ID=""
```

Never commit `.env`.

---

## 5. Prisma Rules

This project uses **Prisma 7**.

Important Prisma 7 rules:

- `prisma.config.ts` is used.
- `DATABASE_URL` is loaded through `prisma.config.ts`.
- `schema.prisma` datasource should not contain `url = env("DATABASE_URL")`.
- Prisma schema should only define the provider and models.
- Run `npx prisma generate` after Prisma schema changes.
- Run migrations carefully and explain schema changes before applying them.
- Do not change existing model names casually because API and UI code may depend on them.

Expected Prisma config pattern:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

Expected datasource pattern in `schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
}
```

---

## 6. Current Core Data Models

The MVP uses these main models:

- `Project`
- `Message`
- `Spec`
- `NotionPublishLog`

Purpose of each model:

### Project

Stores project information.

Used for:

- Project list
- Project detail
- Grouping messages
- Grouping specs
- Grouping publish logs

### Message

Stores project-based chat messages.

Used for:

- Chat history
- AI assistant conversation context
- AI spec generation source material

Message roles may include:

- `user`
- `assistant`
- `system`

Expected Phase 3 usage:

- User messages are saved with role: `user`.
- AI assistant replies are saved with role: `assistant`.
- Generate Spec should use the full saved conversation, including both `user` and `assistant` messages.

### Spec

Stores generated planning documents.

Used for:

- AI draft
- User-edited spec
- Published spec
- Versioned spec content

The planning document body should be stored as JSON.

### NotionPublishLog

Stores Notion publishing history.

Used for:

- Publish success/failure result
- Notion page ID
- Notion page URL
- Error message
- Published timestamp

---

## 7. MVP Scope

Implement the MVP in this order.

### Phase 1: Project Foundation

- Project create API
- Project list API
- Project detail API
- Basic project list UI
- Basic project creation UI

### Phase 2: Chat

- Message create API
- Message list API
- Project chat UI
- Message persistence by project
- User messages are saved as `Message` rows with role: `user`

### Phase 3: AI-Assisted Planning and Spec Generation

Phase 3 has two parts.

#### Phase 3-A: AI Chat Reply

- User sends a project message
- Save the user message
- Send the latest project conversation context to OpenAI API from the server side
- Generate an AI assistant reply focused on planning clarification
- Save the AI assistant reply as a `Message` row with role: `assistant`
- Show the assistant reply in the project chat timeline
- Do not generate the final planning document in this step
- Do not publish anything to Notion in this step

#### Phase 3-B: Generate Spec

- User explicitly clicks `기획서 초안 생성`
- Read the full saved project conversation, including `user` and `assistant` messages
- Send the conversation to OpenAI API from the server side
- Receive structured JSON spec
- Normalize and validate the generated JSON before saving
- Save result to `Spec` as an AI draft
- Show generated draft preview
- Do not publish the draft to Notion automatically

### Phase 3.5: AI PM Tuning

Before Phase 4, stabilize AI output quality.

Phase 3.5 focuses on making PlanFlush AI behave like a planning PM assistant, not a generic chatbot.

Required work:

- Separate prompt files for AI Chat Reply and Generate Spec.
- Define AI behavior as a planning PM assistant.
- Normalize generated spec JSON.
- Validate generated spec JSON before saving.
- Add confirmed facts, assumptions, and acceptance criteria to generated specs if compatible with the current UI.
- Keep OpenAI calls server-side only.
- Do not change the DB schema unless required.
- Do not implement Phase 4 UI in this step.

Suggested helper files:

```text
lib/ai/prompts/chatReplyPrompt.ts
lib/ai/prompts/generateSpecPrompt.ts
lib/ai/specNormalizer.ts
lib/ai/specSchema.ts
```

Phase 3.5 must be completed before building the Phase 4 Spec Editing UI.

### Phase 4: Spec Editing

- Spec detail API
- Spec update API
- Section-based editing UI
- Save edited draft

### Phase 5: Flush to Notion

- Convert spec JSON into Notion blocks
- Create Notion page
- Save publish result
- Save Notion URL
- Handle failure logs

### Phase 6: Polish

- Publish log UI
- Error states
- Loading states
- Empty states
- Basic README
- Demo scenario

---

## 8. Out of Scope for MVP

Do not implement these unless explicitly requested.

- Login
- Multi-user account system
- Team permission management
- Slack integration
- Google Drive integration
- Text file upload
- PDF upload
- PDF upload analysis
- PDF to text extraction
- File Search
- RAG
- vLLM integration
- Existing Notion page update
- Rich text editor
- Real-time collaboration
- Calendar integration
- Complex dashboard
- Payment
- Production-grade auth

Keep the MVP focused.

Future file expansion order after MVP:

```text
txt upload
→ PDF to txt local extraction
→ PDF direct analysis / File Search / RAG review
```

---

## 9. Planning Document Template

AI-generated specs should follow this structure.

```json
{
  "title": "PlanFlush MVP Planning Document",
  "summary": "",
  "background": "",
  "problem": [],
  "goal": [],
  "asIs": [],
  "toBe": [],
  "requirements": [],
  "userFlow": [],
  "screenSpecification": [],
  "policiesAndEdgeCases": [],
  "dataAndApi": [],
  "confirmedFacts": [],
  "assumptions": [],
  "acceptanceCriteria": [],
  "openQuestions": [],
  "actionItems": []
}
```

Use this template consistently unless the user asks to change it.

Field purpose:

- `confirmedFacts`: Facts clearly stated or confirmed by the user.
- `assumptions`: Reasonable inferences that are not fully confirmed.
- `acceptanceCriteria`: Testable conditions for development and QA.
- `openQuestions`: Missing, unclear, or conflicting points that require user confirmation.

Do not invent missing information just to fill the template.

If a field has no available information:

- string fields should use `""`
- array fields should use `[]`

---

## 10. API Design Rules

Use Next.js App Router Route Handlers.

Preferred API structure:

```text
app/api/projects/route.ts
app/api/projects/[id]/route.ts
app/api/projects/[id]/messages/route.ts
app/api/projects/[id]/chat-reply/route.ts
app/api/projects/[id]/generate-spec/route.ts
app/api/specs/[id]/route.ts
app/api/specs/[id]/flush/route.ts
app/api/projects/[id]/publish-logs/route.ts
```

Phase 3 API distinction:

```text
POST /api/projects/[id]/messages
= Save a user message only, if used as a pure message persistence endpoint.

POST /api/projects/[id]/chat-reply
= Save the user message, call OpenAI, save the assistant reply, and return both messages.

POST /api/projects/[id]/generate-spec
= Generate a structured planning document draft from the full saved conversation.
```

API rules:

- Return JSON responses.
- Validate required fields.
- Return `400` for invalid input.
- Return `404` when a resource does not exist.
- Return `500` only for unexpected server errors.
- Keep response shapes simple and predictable.
- Do not expose internal stack traces to the client.
- Use clear error messages.
- Do not call OpenAI from client components.
- Do not call OpenAI on page load.
- Keep external API logic inside server route handlers or server-side helper functions.

Example error response:

```json
{
  "message": "Project name is required."
}
```

---

## 11. UI Rules

Use a simple, clean MVP UI.

Prioritize:

- Clarity
- Usability
- Fast implementation
- Easy testing
- Simple layout

Do not over-design early.

Suggested core screens:

```text
/
Project list

/projects/[id]
Project chat + latest spec preview

/specs/[id]
Spec edit screen

/projects/[id]/publish-logs
Publish history
```

UI expectations:

- Show loading states.
- Show empty states.
- Show error messages.
- Avoid silent failures.
- Keep buttons clearly named.
- Use practical labels such as:
  - Create Project
  - Send
  - AI 답변 생성 중...
  - 기획서 초안 생성
  - 기획서 저장
  - Flush to Notion
  - Open Notion

For PlanFlush user-facing product language:

```text
Generate Spec
→ 기획서 초안 생성

AI Draft
→ 기획서 초안

Spec
→ 기획서

Flush to Notion
→ Flush to Notion or Notion 배포
```

Internal API paths, model names, and code identifiers may remain in English.

User-facing labels should clearly separate:

```text
AI chat
→ draft generation
→ draft editing
→ Notion publishing
```

### UI Design Reference

For UI/UX redesign tasks, use this reference first:

- `references/design/awesome-design-md/design-md/linear.app`

Use it as inspiration for:

- Project detail pages
- Conversation / discussion timeline
- Issue-like work history
- Clean SaaS workspace layout

Do not read or apply all design references at once unless explicitly requested.

For PlanFlush, adapt the Linear-like structure to our product:

- Project context should be compact.
- Conversation timeline should be the main focus.
- Composer/input area should be clear and comfortable.
- The screen should feel like a professional planning workspace, not a casual messenger.

For design-only tasks:

- Do not change DB schema.
- Do not change Prisma schema.
- Do not change API contracts.
- Do not change core business logic.

---

## 12. Code Quality Rules

Always write clean, maintainable TypeScript.

General rules:

- Prefer small files.
- Prefer simple functions.
- Avoid unnecessary abstractions.
- Avoid premature optimization.
- Avoid overengineering.
- Use descriptive names.
- Keep MVP implementation understandable.
- Do not introduce large libraries unless necessary.
- Do not create complex architecture before the MVP works.

When writing code:

- Use async/await.
- Handle errors explicitly.
- Validate request body data.
- Avoid duplicated logic when simple helpers are enough.
- Keep database access inside API routes or helper modules.
- Keep external API logic isolated in service/helper files.
- Keep prompt-building logic isolated when practical.
- Keep OpenAI integration easy to extend later for txt/PDF sources, but do not implement those sources during MVP.

---

## 13. Security Rules

Never hardcode secrets.

Do not print secrets in logs.

Do not commit:

- `.env`
- API keys
- Notion tokens
- OpenAI keys
- Database passwords

Use environment variables:

```env
DATABASE_URL=""
OPENAI_API_KEY=""
OPENAI_MODEL=""
NOTION_API_KEY=""
NOTION_DATABASE_ID=""
```

When adding OpenAI or Notion integration, assume the user will manually put secrets into `.env`.

Additional `.env` handling rules:

- Do not create, edit, overwrite, or delete `.env` unless the user explicitly asks.
- Do not read or print existing `.env` values in the response.
- If environment variables are missing, explain which variable names are required and ask the user to add values manually.
- It is acceptable to create or update `.env.example` with placeholder values only.
- Never include real secrets, tokens, API keys, or database passwords in `.env.example`.

---

## 14. Notion Integration Rules

MVP Notion policy:

- Always create a new Notion page.
- Do not update existing Notion pages in MVP.
- Save Notion page ID and URL after successful publishing.
- Save error message after failed publishing.
- Do not automatically publish AI drafts.
- Only publish when the user explicitly clicks `Flush to Notion`.

Notion DB properties expected:

```text
Title
Project
Status
Version
Source
Created By AI
Published At
Summary
```

The Notion page body should contain the planning document sections as blocks.

---

## 15. OpenAI Integration Rules

OpenAI is used for two separate Phase 3 behaviors.

### 15.1 AI Chat Reply

AI Chat Reply helps the user clarify and organize requirements inside the project conversation.

Rules:

- Use saved project messages as conversation context.
- Save the user message first.
- Call OpenAI only after the user explicitly sends a message.
- Generate an assistant reply focused on planning clarification, requirement organization, missing questions, and next steps.
- Save the assistant reply as a `Message` row with role: `assistant`.
- Do not generate the final planning document in this step.
- Do not publish anything to Notion in this step.
- Do not invent details.
- If information is missing, ask concise follow-up questions.
- Keep replies practical for service planning, PM work, and development handoff.

The assistant should help organize:

- Background
- Problem
- Goal
- AS-IS
- TO-BE
- Requirements
- User flow
- Screen notes
- Policies and edge cases
- Data/API points
- Confirmed facts
- Assumptions
- Acceptance criteria
- Open questions
- Action items

### 15.2 Generate Spec

Generate Spec creates a structured planning document draft from the full saved project conversation.

Rules:

- Use project messages as source material.
- Include both `user` and `assistant` messages.
- Generate JSON matching the planning document template.
- Do not publish AI output automatically.
- Save AI output as a draft first.
- Let the user review and edit the draft.
- Keep prompts deterministic and structured.
- If data is insufficient, use `openQuestions` instead of inventing details.

Generated specs must be normalized and validated before saving.

Rules:

- Required template keys must always exist.
- Missing string fields should be normalized to `""`.
- Missing array fields should be normalized to `[]`.
- Invalid JSON must not be saved.
- JSON parse errors should return a clear error response.
- Do not expose internal stack traces.
- Do not silently save partial or malformed AI output.
- If source messages are insufficient, place missing items into `openQuestions`.
- If something is inferred but not confirmed, place it into `assumptions`.
- If something is clearly confirmed by the user, place it into `confirmedFacts`.

### 15.3 OpenAI Safety and Runtime Rules

- Do not call OpenAI automatically on page load.
- Do not call OpenAI from client components.
- Only call OpenAI from server route handlers or server-side helper functions.
- AI Chat Reply should only run when the user explicitly sends a message.
- Generate Spec should only run when the user explicitly clicks `기획서 초안 생성`.
- Do not retry OpenAI requests automatically.
- Do not hardcode API keys.
- Do not print secrets in logs.
- Use `process.env.OPENAI_API_KEY` for the API key.
- Use `process.env.OPENAI_MODEL` if available.
- If `OPENAI_MODEL` is missing, use the existing fallback model.

### 15.4 AI Planning PM Behavior Rules

PlanFlush AI must behave like a planning PM assistant, not a generic chatbot.

The AI should:

- Clarify requirements before generating a final planning document.
- Separate confirmed facts, assumptions, and open questions.
- Convert vague user messages into actionable planning items.
- Write requirements as specific, testable system behaviors.
- Identify missing UI, API, data, policy, permission, and edge case details.
- Avoid inventing APIs, DB fields, UI names, policies, or business rules.
- If information is unclear, place it in `openQuestions`.
- If something is inferred but not confirmed, place it in `assumptions`.
- If something is clearly confirmed by the user, place it in `confirmedFacts`.
- Do not repeat questions already answered in the conversation.
- Ask no more than 3 high-value follow-up questions per AI chat reply.

AI Chat Reply should usually follow this structure:

```text
Current understanding
Confirmed so far
Need to clarify
Next questions
```

Keep AI chat replies concise and useful for planning.

Requirement writing style:

Good:

```text
- The system should validate the current password before changing the password.
- The system should return `CURRENT_PASSWORD_MISMATCH` when the current password is incorrect.
- The system should not save the new password if `confirmPassword` does not match `newPassword`.
```

Bad:

```text
- Improve password change.
- Make password logic better.
- Handle errors properly.
```

Acceptance criteria should use GIVEN / WHEN / THEN format when possible.

Example:

```text
- GIVEN the user enters an incorrect current password
  WHEN the user requests password change
  THEN the system returns `CURRENT_PASSWORD_MISMATCH` and does not update the password
```

The AI should help organize planning information into:

- Background
- Problem
- Goal
- AS-IS
- TO-BE
- Requirements
- User flow
- Screen notes
- Policies and edge cases
- Data/API points
- Confirmed facts
- Assumptions
- Acceptance criteria
- Open questions
- Action items

The AI must not treat assumptions as confirmed requirements.

---

## 16. Working Style for Codex

Before editing files:

1. Inspect the current project structure.
2. Identify relevant files.
3. Explain the implementation plan briefly.
4. Then make changes.

After editing files:

1. List changed files.
2. Explain what changed.
3. Provide test commands.
4. Provide expected results.
5. Mention any assumptions or limitations.

Do not make broad unrelated changes.

Do not refactor unrelated files unless necessary.

Do not silently change dependencies.

If dependency installation is required, explain why.

---

## 17. Definition of Done

A task is considered done only when:

- Code is implemented.
- TypeScript errors are resolved.
- The feature can be tested locally.
- API behavior is explained.
- Edge cases are handled at a basic MVP level.
- The user knows exactly how to verify it.

For API work, include:

- Endpoint path
- Method
- Request body
- Success response
- Error response
- Test command

For UI work, include:

- Page path
- Main behavior
- Empty state
- Loading state
- Error state

For OpenAI work, include:

- Trigger condition
- Server route path
- Environment variables used
- Fallback behavior
- Failure behavior
- Confirmation that no secrets are exposed

---

## 18. Testing Commands

Use these commands when relevant.

```powershell
cd C:\chanynotnerd\planflush
npm run dev
```

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
npx prisma migrate dev
```

```powershell
cd C:\chanynotnerd\planflush
npx prisma studio
```

```powershell
docker ps
```

```powershell
cd C:\chanynotnerd\planflush
docker compose up -d
```

```powershell
docker logs planflush-mysql
```

For API testing on Windows PowerShell, prefer:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/projects" -Method GET
```

POST example:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/projects" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"PlanFlush MVP","description":"First test project"}'
```

AI Chat Reply API example:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/projects/1/chat-reply" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"content":"로그인 화면에서 비밀번호 변경 플로우를 기획하고 싶습니다."}'
```

Generate Spec API example:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/projects/1/generate-spec" `
  -Method POST
```

---

## 19. Quality Bar

The output should feel like it was made by a careful senior full-stack developer building a real MVP.

The goal is not just “make it work.”

The goal is:

- simple but solid
- easy to understand
- easy to test
- easy to extend
- safe with secrets
- consistent with the PlanFlush product concept
- suitable for portfolio/demo use

Prefer practical implementation over theoretical perfection.

Avoid unnecessary complexity.

Whenever there are multiple options, choose the option that helps the user continue development fastest while keeping the codebase clean.

---

## 20. Communication Style

When responding to the user:

- Be direct.
- Use Korean explanations unless the code/comment requires English.
- Explain development concepts in plain language.
- Provide copy-pasteable commands when possible.
- Point out risky actions before doing them.
- Do not assume the user already knows backend or database details.
- Keep the next action clear.

The user is building this project with Codex step by step, so every response should help the user move forward without confusion.

---

## 21. First Implementation Target

The first implementation target is:

```text
Project create/list API
```

Required endpoints:

```text
GET /api/projects
POST /api/projects
```

Expected behavior:

### GET /api/projects

- Return all projects.
- Sort by `updatedAt` descending.

### POST /api/projects

- Accept `name` and `description`.
- `name` is required.
- Trim input strings.
- Return `400` if `name` is missing.
- Create a `Project` row.
- Return created project.

After this works, continue with:

```text
Project detail
→ Message save/list
→ Chat UI
→ AI Chat Reply
→ Generate Spec
→ AI PM Tuning
→ Spec editing
→ Flush to Notion
```

---

## 22. Language and Reasoning Policy

When working on this project:

- Internal analysis and implementation reasoning may be done in English if it helps accuracy.
- All user-facing responses must be written in Korean using formal and polite language, 존댓말.
- Code, file names, API paths, commands, package names, database fields, and error messages may remain in English.
- When explaining code or development concepts, explain them in clear and simple Korean.
- Do not expose hidden chain-of-thought or private reasoning.
- Instead, provide concise Korean summaries of decisions, implementation plans, trade-offs, and next steps.
- Before editing files, explain the plan in Korean.
- After editing files, explain changed files, test commands, expected results, and limitations in Korean.
- If command output or error messages are in English, summarize what they mean in Korean.

---

## 23. Documentation and History Rules

### 작업 문서 정리

미래에 사용자가 "hist 문서 작성해줘" 또는 이와 유사한 요청을 하면, 먼저 필요한 사실관계를 정리한 뒤 정해진 hist 문서 작성 원칙과 간결화 원칙을 준수하여 새 Markdown 문서를 작성하고 저장하십시오.

이 요청을 수행할 때는 원칙적으로 다른 파일을 변경하지 마십시오.

### hist 문서 저장 규칙

모든 히스토리 문서는 `hist/` 디렉토리 하위에 저장합니다.

파일명 형식은 다음과 같습니다.

```text
YYYY-MM-DD_nn_주제.md
```

규칙:

- 날짜는 실제 작성 또는 완료 일자를 사용합니다.
- `nn`은 같은 날짜의 문서가 여러 개일 경우 `01`, `02`, `03`처럼 두 자리 번호로 증가시킵니다.
- 주제는 2~6단어 수준으로 간결하게 요약합니다.
- 예시:
  - `2026-04-27_01_project-api.md`
  - `2026-04-27_02_prisma-setup.md`

`hist/` 디렉토리가 없으면 새로 생성하십시오.

### hist 문서 본문 규칙

문서 본문은 반드시 `# 제목`으로 시작합니다.

제목 아래에는 날짜, 작업자, 프로젝트 등 핵심 메타 정보를 굵게 표시하여 나열합니다.

예시:

```md
# Project API 구현 히스토리

**날짜:** 2026-04-27  
**작업자:** Codex  
**프로젝트:** PlanFlush  
**진행률:** 1/5 완료, 20%
```

필요한 경우 `---` 구분선을 사용합니다.

본문 구조는 기존 hist 문서 패턴을 우선 따르십시오. 기존 문서가 없을 경우 아래 흐름을 기본 골격으로 사용하십시오.

```md
## 📋 상황 요약

## 🎯 요구사항 및 문제 분석

## 🛠️ 구현/작업 내용

## ✅ 결과 및 검증

## 🚧 미구현 항목

## 🧠 학습/참고 키워드
```

섹션 제목에는 `📋`, `🎯`, `🛠️`, `✅`, `🚧`, `🧠` 등 이모지를 적절히 사용하여 가독성을 높이십시오.

문서에는 사실 서술형을 사용하되, 명확하고 전문적인 어조를 유지하십시오.

숫자, 날짜, 파일 경로, 엔드포인트, 함수명, 모델명은 가능한 한 원본 그대로 기재하십시오.

요약이 필요한 경우에만 선택적으로 압축하십시오.

히스토리 작성 전 기존 문서들과 동일한 용어와 포맷을 재활용하여 일관성을 확보하고, 중복 서술이나 누락이 없는지 검토한 후 완료 보고를 하십시오.

---

### 토큰 절약을 위한 간결화 원칙

hist 문서는 상세하되 불필요하게 길어지지 않도록 작성합니다.

다음 원칙을 따르십시오.

- **코드 예시 최소화:** 전체 구현 코드는 제외하고 함수 시그니처, 엔드포인트, 핵심 파라미터만 작성합니다.
- **테스트 섹션 통합:** 각 API별 테스트를 길게 나누지 말고 전체 워크플로우 중심으로 통합합니다.
- **응답 JSON 생략:** 전체 응답 JSON을 길게 쓰지 말고 핵심 필드만 나열합니다.
- **커밋 메시지 간소화:** 실제 커밋한 경우에만 간략히 기록합니다.
- **변경 파일 요약:** 상세 설명 대신 `+N functions`, `+N handlers`, `+N models` 형식으로 요약합니다.
- **학습 내용 키워드화:** 상세 설명 대신 핵심 개념만 bullet point로 기록합니다.
- **미구현 항목 체크리스트화:** 설명 없이 `[ ]` 체크박스 목록으로 정리합니다.

---

### 필수 포함 사항

hist 문서에는 가능하면 아래 항목을 반드시 포함하십시오.

- 변경 파일 경로
- 변경 파일의 주요 라인 번호
- 구현한 함수명 목록
- 주요 구조체, 모델, 타입명 및 핵심 필드
- 핵심 설계 결정 사항
  - 타입 선택 이유
  - 패턴 적용 이유
  - API 구조 결정 이유
- 실제 API 응답으로 검증한 필드
- 구현 진행률
  - 예: `1/5 완료, 20%`

라인 번호는 가능한 한 실제 파일 기준으로 확인하여 작성하십시오.

정확한 라인 번호 확인이 어려운 경우에는 파일 경로와 함수명 중심으로 기록하고, 라인 번호는 생략 사유를 간단히 명시하십시오.

---

### 선택적 포함 사항

아래 항목은 필요한 경우에만 간결하게 포함하십시오.

- 테스트 코드
  - 전체 워크플로우 1개만 작성
- 학습 내용
  - 핵심 키워드만 작성
- 트러블슈팅
  - 실제 문제가 발생한 경우에만 작성
- 명령어
  - 재현성 확보가 필요한 경우에만 작성

---

### 상세 기록 허용 기준

다음 경우에는 코드, 명령어, 표를 최소한으로 포함할 수 있습니다.

- 구현이 복잡한 경우
- 외부 API 또는 외부 의존성이 포함된 경우
- 재현성이 중요한 경우
- 장애나 에러 원인 분석이 필요한 경우
- 추후 같은 작업을 반복할 가능성이 높은 경우

코드 블록에는 반드시 언어 힌트를 지정하십시오.

예시:

```ts
export async function GET() {}
```

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/projects" -Method GET
```

표는 핵심 항목만 유지하십시오.

---

### docs/ 디렉토리 규칙

`docs/` 디렉토리는 순수한 기술 설계 문서만 작성하는 공간입니다.

포함 가능:

- 시스템 구조 설계
- API 설계
- DB 설계
- 외부 연동 설계
- 배포 설계
- 기술 의사결정 문서

포함 금지:

- 작업 요청사항
- 전달 사항
- 작업 과정 기록
- 회의성 메모
- 임시 판단 기록
- 구현 히스토리

---

### hist/ 디렉토리 규칙

`hist/` 디렉토리는 작업 과정, 의사결정 과정, 변경 이력 등을 기록하는 공간입니다.

포함 가능:

- 작업 진행 이력
- 요구사항 분석
- 설계 방향 전환
- 트러블슈팅
- 외부 문서와의 비교 분석
- 구현 결과 요약
- 테스트 검증 결과
- 다음 작업 계획

파일명 형식은 반드시 다음을 따릅니다.

```text
YYYY-MM-DD_nn_주제.md
```

같은 날짜 문서가 여러 개면 `nn`은 `01`, `02`, `03`처럼 두 자리 번호 접두어를 증가시킵니다.

---

### 명령어 작성 규칙

명령어는 되도록이면 절대 경로를 사용하십시오.

좋은 예:

```powershell
cd C:\chanynotnerd\planflush
npm run dev
```

피해야 할 예:

```powershell
cd planflush
npm run dev
```

프로젝트 기준 경로는 다음과 같습니다.

```text
C:\chanynotnerd\planflush
```

---

### Language Rule for Documentation Work

Internal thinking and technical work may be done in English if it improves accuracy.

However, all user-facing responses must be written in Korean using formal and polite language, 존댓말.

Code, commands, API paths, file names, package names, database fields, and error messages may remain in English.

When explaining implementation details, summarize decisions, trade-offs, changed files, test results, and next steps in Korean.

---

## 24. Token Saving and Caveman Response Rules

This project uses a practical token-saving response style inspired by Caveman-style compression.

The goal is to reduce unnecessary output while keeping technical accuracy, Korean politeness, and clear next actions.

Do not use broken Korean.

Do not sound rude.

Do not sacrifice clarity.

### Core Principle

Think deeply. Respond compactly.

Internal technical work may be detailed.

User-facing output should be concise, dense, and directly useful.

### Output Language

- All user-facing explanations must be written in Korean using 존댓말.
- Code, commands, paths, package names, API endpoints, database fields, and error messages may remain in English.
- Do not expose hidden chain-of-thought or private reasoning.
- Summarize decisions, trade-offs, and next steps instead of revealing raw reasoning.

### Caveman-style Compression

Prefer short, direct, useful responses.

Avoid unnecessary filler.

Avoid long introductions.

Avoid repeated explanations.

Use this style:

```text
원인:
- ...

수정:
- ...

테스트:
- ...

다음:
- ...
```

or:

```text
완료:
- ...

변경 파일:
- ...

확인 방법:
- ...

주의:
- ...
```

### Avoid These Phrases

Avoid phrases like:

- "물론입니다"
- "좋은 질문입니다"
- "제가 도와드리겠습니다"
- "아래와 같이 정리해드리겠습니다"
- "이 부분은 매우 중요합니다"
- "요청하신 내용을 바탕으로"

Use them only when they are genuinely needed.

### Prefer These Phrases

Prefer direct phrases like:

- "다음 명령어를 실행하십시오."
- "이 파일을 수정하십시오."
- "원인은 A입니다."
- "해결은 B입니다."
- "테스트는 아래 순서로 진행하십시오."
- "현재 상태는 정상입니다."
- "이 작업은 아직 하지 마십시오."

### For Implementation Reports

When reporting completed implementation work, use this compact structure:

```text
완료:
- ...

변경 파일:
- ...

테스트:
- ...

예상 결과:
- ...

다음:
- ...
```

### For Error Analysis

When explaining errors, use this compact structure:

```text
원인:
- ...

해결:
- ...

명령어:
- ...

확인 기준:
- ...
```

### For Planning

When explaining a plan, use this compact structure:

```text
계획:
1. ...
2. ...
3. ...

변경 예정 파일:
- ...

실행 필요 명령어:
- ...
```

### For Long Tasks

For long tasks, do not explain everything at once.

Provide:

- current target
- immediate next step
- exact command or file path
- success criteria

Then stop.

### Do Not Omit Required Details

Do not omit:

- file paths
- function names
- API paths
- commands
- environment variable names
- error messages
- test steps
- expected results

Concise is good.

Vague is bad.

### Token Saving Priority

Save tokens in this order:

1. Remove filler.
2. Remove repeated explanations.
3. Compress status reports.
4. Summarize long outputs.
5. Keep commands and paths exact.
6. Keep test instructions complete.
7. Keep technical decisions traceable.

### Quality Rule

The response should feel like a careful senior developer giving short, precise guidance.

Not chatbot fluff.

Not broken caveman speech.

Not vague summaries.

Short, accurate, actionable Korean.

---

## 25. Final Working Instruction

For every task in this repository:

1. Read `AGENTS.md`.
2. Follow the MVP scope.
3. Keep changes small.
4. Do not hardcode secrets.
5. Do not modify unrelated files.
6. Use absolute paths in commands when possible.
7. Explain before editing.
8. Report after editing.
9. Respond to the user in Korean 존댓말.
10. Use concise Caveman-style compression without losing clarity.