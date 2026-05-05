import type {
  BlockObjectRequest,
  RichTextItemRequest,
} from "@notionhq/client/build/src/api-endpoints";
import type {
  JsonObject,
  JsonValue,
  PlanningSpecContent,
  PlanningSpecItem,
} from "@/lib/ai/specSchema";

const NOTION_RICH_TEXT_LIMIT = 2000;
const NOISE_TEXTS = new Set(["테스트", "테스트.", "되나", "되나?", "되나? 테스트."]);

const FIELD_LABELS: Record<string, string> = {
  id: "ID",
  title: "제목",
  description: "설명",
  priority: "우선순위",
  type: "유형",
  owner: "담당",
  asIs: "AS-IS",
  toBe: "TO-BE",
  acceptanceCriteria: "인수 조건",
  notes: "참고",
  components: "구성 요소",
  behavior: "동작",
  validation: "검증",
  emptyState: "빈 상태",
  loadingState: "로딩 상태",
  errorState: "오류 상태",
  policy: "정책",
  condition: "조건",
  expectedBehavior: "기대 동작",
  edgeCases: "예외 케이스",
  requestFields: "요청 필드",
  responseFields: "응답 필드",
  dataFields: "데이터 필드",
  validationRules: "검증 규칙",
  errorCases: "오류 케이스",
  dependsOn: "선행 작업",
  verification: "검증 기준",
  reason: "이유",
  impact: "영향",
  given: "GIVEN",
  when: "WHEN",
  then: "THEN",
  method: "Method",
  endpoint: "Endpoint",
  screen: "화면",
  area: "영역",
  actor: "사용자/주체",
  action: "동작",
  result: "결과",
  step: "단계",
};

const ENUM_VALUE_LABELS: Record<string, string> = {
  api: "API",
  data: "데이터",
  screen: "화면",
  policy: "정책",
  requirement: "요구사항",
  qa: "QA",
  fe: "FE",
  be: "BE",
  db: "DB",
  pm: "PM",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const HTTP_METHOD_LABELS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
]);

const ENUM_DISPLAY_FIELD_KEYS = new Set([
  "type",
  "owner",
  "priority",
  "method",
]);

function splitText(value: string) {
  const chunks: string[] = [];

  for (let index = 0; index < value.length; index += NOTION_RICH_TEXT_LIMIT) {
    chunks.push(value.slice(index, index + NOTION_RICH_TEXT_LIMIT));
  }

  return chunks.length > 0 ? chunks : [""];
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isNoiseText(value: string) {
  return NOISE_TEXTS.has(normalizeText(value));
}

function richText(value: string, bold = false): RichTextItemRequest[] {
  return splitText(value).map((content) => ({
    type: "text",
    text: {
      content,
    },
    annotations: bold
      ? {
          bold: true,
        }
      : undefined,
  }));
}

function paragraph(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: richText(text),
    },
  };
}

function heading2(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "heading_2",
    heading_2: {
      rich_text: richText(text),
    },
  };
}

function heading3(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "heading_3",
    heading_3: {
      rich_text: richText(text),
    },
  };
}

function bullet(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: richText(text),
    },
  };
}

function numbered(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "numbered_list_item",
    numbered_list_item: {
      rich_text: richText(text),
    },
  };
}

function toDo(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "to_do",
    to_do: {
      rich_text: richText(text),
      checked: false,
    },
  };
}

function divider(): BlockObjectRequest {
  return {
    object: "block",
    type: "divider",
    divider: {},
  };
}

function isObjectItem(item: PlanningSpecItem): item is JsonObject {
  return typeof item === "object" && item !== null && !Array.isArray(item);
}

function formatSingleEnumLikeValue(key: string, value: string) {
  const text = value.trim();
  const normalized = text.toLowerCase();

  if (key === "method" && HTTP_METHOD_LABELS.has(normalized)) {
    return normalized.toUpperCase();
  }

  return ENUM_VALUE_LABELS[normalized] ?? text;
}

function formatEnumLikeValue(key: string, value: string) {
  const text = value.trim();

  if (!ENUM_DISPLAY_FIELD_KEYS.has(key)) {
    return formatSingleEnumLikeValue(key, text);
  }

  const slashParts = text.split("/").map((part) => part.trim());

  if (slashParts.length > 1 && slashParts.every(Boolean)) {
    return slashParts
      .map((part) => formatSingleEnumLikeValue(key, part))
      .join(" / ");
  }

  return formatSingleEnumLikeValue(key, text);
}

function stringifyValue(value: JsonValue | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(stringifyValue).filter(Boolean).join(", ");
  }

  return Object.entries(value)
    .map(([key, item]) => {
      const text = stringifyValue(item);
      return text ? `${FIELD_LABELS[key] ?? key}: ${text}` : "";
    })
    .filter(Boolean)
    .join(" / ");
}

function stringifyFieldValue(key: string, value: JsonValue | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return formatEnumLikeValue(key, value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? formatEnumLikeValue(key, item)
          : stringifyValue(item),
      )
      .filter(Boolean)
      .join(", ");
  }

  return stringifyValue(value);
}

function getFirstText(item: JsonObject, keys: string[]) {
  for (const key of keys) {
    const text = stringifyValue(item[key]);

    if (text) {
      return text;
    }
  }

  return "";
}

function getItemTitle(item: JsonObject, fallback: string) {
  return getFirstText(item, [
    "title",
    "screen",
    "name",
    "endpoint",
    "question",
    "description",
    "policy",
  ]) || fallback;
}

function addTextBlock(
  blocks: BlockObjectRequest[],
  createBlock: (text: string) => BlockObjectRequest,
  text: string,
) {
  const normalized = text.trim();

  if (!normalized || isNoiseText(normalized)) {
    return;
  }

  blocks.push(createBlock(normalized));
}

function addLabeledBullet(
  blocks: BlockObjectRequest[],
  item: JsonObject,
  key: string,
  label = FIELD_LABELS[key] ?? key,
) {
  const text = stringifyFieldValue(key, item[key]);

  if (text) {
    blocks.push(bullet(`${label}: ${text}`));
  }
}

function addStringItems(
  blocks: BlockObjectRequest[],
  items: PlanningSpecItem[],
  createBlock: (text: string) => BlockObjectRequest = bullet,
) {
  for (const item of items) {
    if (typeof item === "string") {
      addTextBlock(blocks, createBlock, item);
    } else {
      addTextBlock(blocks, createBlock, stringifyValue(item));
    }
  }
}

function buildSection(
  title: string,
  build: (sectionBlocks: BlockObjectRequest[]) => void,
) {
  const sectionBlocks: BlockObjectRequest[] = [];

  build(sectionBlocks);

  if (sectionBlocks.length === 0) {
    return [];
  }

  return [divider(), heading2(title), ...sectionBlocks];
}

function renderRequirements(items: PlanningSpecItem[]) {
  const blocks: BlockObjectRequest[] = [];

  for (const [index, item] of items.entries()) {
    if (!isObjectItem(item)) {
      addTextBlock(blocks, bullet, item);
      continue;
    }

    blocks.push(heading3(getItemTitle(item, `요구사항 ${index + 1}`)));

    const metadata = [
      stringifyValue(item.id) ? `ID: ${stringifyValue(item.id)}` : "",
      stringifyFieldValue("priority", item.priority)
        ? `우선순위: ${stringifyFieldValue("priority", item.priority)}`
        : "",
      stringifyFieldValue("type", item.type)
        ? `유형: ${stringifyFieldValue("type", item.type)}`
        : "",
      stringifyFieldValue("owner", item.owner)
        ? `담당: ${stringifyFieldValue("owner", item.owner)}`
        : "",
    ].filter(Boolean);

    if (metadata.length > 0) {
      blocks.push(paragraph(metadata.join(" · ")));
    }

    addTextBlock(blocks, paragraph, stringifyValue(item.description));
    addLabeledBullet(blocks, item, "asIs", "AS-IS");
    addLabeledBullet(blocks, item, "toBe", "TO-BE");
    addLabeledBullet(blocks, item, "acceptanceCriteria", "인수 조건");
    addLabeledBullet(blocks, item, "notes", "참고");
  }

  return blocks;
}

function renderUserFlow(items: PlanningSpecItem[]) {
  const blocks: BlockObjectRequest[] = [];

  for (const [index, item] of items.entries()) {
    if (!isObjectItem(item)) {
      addTextBlock(blocks, numbered, item);
      continue;
    }

    const title = getFirstText(item, ["step", "title", "action", "description"]);
    const actor = stringifyFieldValue("actor", item.actor);
    const action = stringifyFieldValue("action", item.action);
    const result = stringifyFieldValue("result", item.result);
    const condition = stringifyValue(item.condition);
    const notes = stringifyValue(item.notes);
    const line = [
      title || `${index + 1}단계`,
      actor ? `주체: ${actor}` : "",
      action ? `동작: ${action}` : "",
      result ? `결과: ${result}` : "",
      condition ? `조건: ${condition}` : "",
      notes ? `참고: ${notes}` : "",
    ].filter(Boolean);

    blocks.push(numbered(line.join(" · ")));
  }

  return blocks;
}

function renderScreenSpecification(items: PlanningSpecItem[]) {
  const blocks: BlockObjectRequest[] = [];

  for (const [index, item] of items.entries()) {
    if (!isObjectItem(item)) {
      addTextBlock(blocks, bullet, item);
      continue;
    }

    const screen = stringifyValue(item.screen);
    const area = stringifyValue(item.area);
    blocks.push(heading3([screen || `화면 ${index + 1}`, area].filter(Boolean).join(" / ")));
    addLabeledBullet(blocks, item, "description", "목적");
    addLabeledBullet(blocks, item, "components", "구성 요소");
    addLabeledBullet(blocks, item, "behavior", "동작");
    addLabeledBullet(blocks, item, "validation", "검증");
    addLabeledBullet(blocks, item, "errorState", "오류 상태");
    addLabeledBullet(blocks, item, "emptyState", "빈 상태");
    addLabeledBullet(blocks, item, "loadingState", "로딩 상태");
    addLabeledBullet(blocks, item, "notes", "참고");
  }

  return blocks;
}

function renderPolicies(items: PlanningSpecItem[]) {
  const blocks: BlockObjectRequest[] = [];

  for (const [index, item] of items.entries()) {
    if (!isObjectItem(item)) {
      addTextBlock(blocks, bullet, item);
      continue;
    }

    blocks.push(heading3(getItemTitle(item, `정책 ${index + 1}`)));
    addLabeledBullet(blocks, item, "policy", "정책");
    addLabeledBullet(blocks, item, "condition", "조건");
    addLabeledBullet(blocks, item, "expectedBehavior", "기대 동작");
    addLabeledBullet(blocks, item, "edgeCases", "예외 케이스");
    addLabeledBullet(blocks, item, "notes", "참고");
  }

  return blocks;
}

function renderDataAndApi(items: PlanningSpecItem[]) {
  const blocks: BlockObjectRequest[] = [];

  for (const [index, item] of items.entries()) {
    if (!isObjectItem(item)) {
      addTextBlock(blocks, bullet, item);
      continue;
    }

    blocks.push(heading3(getItemTitle(item, `데이터/API ${index + 1}`)));

    const method = stringifyFieldValue("method", item.method);
    const endpoint = stringifyValue(item.endpoint);

    if (method || endpoint) {
      blocks.push(paragraph([method, endpoint].filter(Boolean).join(" ")));
    }

    addLabeledBullet(blocks, item, "requestFields", "요청 필드");
    addLabeledBullet(blocks, item, "responseFields", "응답 필드");
    addLabeledBullet(blocks, item, "dataFields", "데이터 필드");
    addLabeledBullet(blocks, item, "validationRules", "검증 규칙");
    addLabeledBullet(blocks, item, "errorCases", "오류 케이스");
    addLabeledBullet(blocks, item, "notes", "참고");
  }

  return blocks;
}

function renderAcceptanceCriteria(items: PlanningSpecItem[]) {
  const blocks: BlockObjectRequest[] = [];

  for (const [index, item] of items.entries()) {
    if (!isObjectItem(item)) {
      addTextBlock(blocks, bullet, item);
      continue;
    }

    blocks.push(heading3(getItemTitle(item, `인수 조건 ${index + 1}`)));
    addLabeledBullet(blocks, item, "given", "GIVEN");
    addLabeledBullet(blocks, item, "when", "WHEN");
    addLabeledBullet(blocks, item, "then", "THEN");
    addLabeledBullet(blocks, item, "notes", "참고");
  }

  return blocks;
}

function renderOpenQuestions(items: PlanningSpecItem[]) {
  const blocks: BlockObjectRequest[] = [];

  for (const [index, item] of items.entries()) {
    if (!isObjectItem(item)) {
      addTextBlock(blocks, bullet, `Q${index + 1}. ${item}`);
      continue;
    }

    const question = getFirstText(item, ["question", "title", "description"]) || `질문 ${index + 1}`;
    const owner = stringifyFieldValue("owner", item.owner);
    const reason = stringifyValue(item.reason);
    const impact = stringifyValue(item.impact);
    const notes = stringifyValue(item.notes);
    const details = [
      owner ? `담당: ${owner}` : "",
      reason ? `이유: ${reason}` : "",
      impact ? `영향: ${impact}` : "",
      notes ? `참고: ${notes}` : "",
    ].filter(Boolean);

    blocks.push(
      bullet(
        details.length > 0
          ? `Q${index + 1}. ${question} (${details.join(" · ")})`
          : `Q${index + 1}. ${question}`,
      ),
    );
  }

  return blocks;
}

function renderActionItems(items: PlanningSpecItem[]) {
  const blocks: BlockObjectRequest[] = [];

  for (const [index, item] of items.entries()) {
    if (!isObjectItem(item)) {
      addTextBlock(blocks, toDo, item);
      continue;
    }

    const owner = stringifyFieldValue("owner", item.owner);
    const type = stringifyFieldValue("type", item.type);
    const title = getItemTitle(item, `액션 아이템 ${index + 1}`);
    const prefix = [owner, type].filter(Boolean).join(" / ");

    blocks.push(toDo(prefix ? `[${prefix}] ${title}` : title));
    addLabeledBullet(blocks, item, "description", "설명");
    addLabeledBullet(blocks, item, "dependsOn", "선행 작업");
    addLabeledBullet(blocks, item, "verification", "검증 기준");
    addLabeledBullet(blocks, item, "notes", "참고");
  }

  return blocks;
}

export function buildSpecNotionBlocks(
  spec: PlanningSpecContent,
): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  blocks.push(
    ...buildSection("문서 개요", (sectionBlocks) => {
      addTextBlock(sectionBlocks, paragraph, spec.summary);
      addTextBlock(sectionBlocks, paragraph, spec.background);
    }),
  );

  blocks.push(
    ...buildSection("1. 문제 정의 및 목표", (sectionBlocks) => {
      sectionBlocks.push(...renderGenericSubsection("문제 정의", spec.problem));
      sectionBlocks.push(...renderGenericSubsection("목표", spec.goal));
      sectionBlocks.push(...renderGenericSubsection("AS-IS", spec.asIs));
      sectionBlocks.push(...renderGenericSubsection("TO-BE", spec.toBe));
    }),
  );

  blocks.push(...buildSection("2. 요구사항", (sectionBlocks) => {
    sectionBlocks.push(...renderRequirements(spec.requirements));
  }));

  blocks.push(...buildSection("3. 사용자 흐름", (sectionBlocks) => {
    sectionBlocks.push(...renderUserFlow(spec.userFlow));
  }));

  blocks.push(
    ...buildSection("4. 화면 및 정책 설계", (sectionBlocks) => {
      const screenBlocks = renderScreenSpecification(spec.screenSpecification);
      const policyBlocks = renderPolicies(spec.policiesAndEdgeCases);

      if (screenBlocks.length > 0) {
        sectionBlocks.push(heading3("화면 명세"), ...screenBlocks);
      }

      if (policyBlocks.length > 0) {
        sectionBlocks.push(heading3("정책 및 예외 케이스"), ...policyBlocks);
      }
    }),
  );

  blocks.push(...buildSection("5. 데이터 및 API", (sectionBlocks) => {
    sectionBlocks.push(...renderDataAndApi(spec.dataAndApi));
  }));

  blocks.push(...buildSection("6. 검증 기준", (sectionBlocks) => {
    sectionBlocks.push(...renderAcceptanceCriteria(spec.acceptanceCriteria));
  }));

  blocks.push(
    ...buildSection("7. 확정/가정/미확정 사항", (sectionBlocks) => {
      sectionBlocks.push(...renderGenericSubsection("확정 사실", spec.confirmedFacts));
      sectionBlocks.push(...renderGenericSubsection("가정", spec.assumptions));
      const questionBlocks = renderOpenQuestions(spec.openQuestions);

      if (questionBlocks.length > 0) {
        sectionBlocks.push(heading3("미확정 질문"), ...questionBlocks);
      }
    }),
  );

  blocks.push(...buildSection("8. 액션 아이템", (sectionBlocks) => {
    sectionBlocks.push(...renderActionItems(spec.actionItems));
  }));

  const renderedBlocks =
    blocks[0]?.type === "divider" ? blocks.slice(1) : blocks;

  return renderedBlocks.length > 0
    ? renderedBlocks
    : [paragraph("기획서 본문 내용이 없습니다.")];
}

function renderGenericSubsection(label: string, items: PlanningSpecItem[]) {
  const blocks: BlockObjectRequest[] = [];

  if (items.length === 0) {
    return blocks;
  }

  blocks.push(heading3(label));
  addStringItems(blocks, items);

  return blocks;
}

export function toNotionRichText(value: string): RichTextItemRequest[] {
  const text = value.trim();

  if (!text) {
    return [];
  }

  return richText(text);
}
