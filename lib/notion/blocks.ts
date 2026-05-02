import type {
  BlockObjectRequest,
  RichTextItemRequest,
} from "@notionhq/client/build/src/api-endpoints";
import type { PlanningSpecContent } from "@/lib/ai/specSchema";

type ArraySpecKey = Exclude<
  keyof PlanningSpecContent,
  "title" | "summary" | "background"
>;

const NOTION_RICH_TEXT_LIMIT = 2000;

const SECTION_LABELS: { key: ArraySpecKey; label: string }[] = [
  { key: "problem", label: "문제 정의" },
  { key: "goal", label: "목표" },
  { key: "asIs", label: "AS-IS" },
  { key: "toBe", label: "TO-BE" },
  { key: "requirements", label: "요구사항" },
  { key: "userFlow", label: "사용자 흐름" },
  { key: "screenSpecification", label: "화면 설계" },
  { key: "policiesAndEdgeCases", label: "정책 및 예외 케이스" },
  { key: "dataAndApi", label: "데이터 및 API" },
  { key: "confirmedFacts", label: "확정된 내용" },
  { key: "assumptions", label: "가정사항" },
  { key: "acceptanceCriteria", label: "인수 기준" },
  { key: "openQuestions", label: "미확정 질문" },
  { key: "actionItems", label: "액션 아이템" },
];

function splitText(value: string) {
  const chunks: string[] = [];

  for (let index = 0; index < value.length; index += NOTION_RICH_TEXT_LIMIT) {
    chunks.push(value.slice(index, index + NOTION_RICH_TEXT_LIMIT));
  }

  return chunks.length > 0 ? chunks : [""];
}

function richText(value: string): RichTextItemRequest[] {
  return splitText(value).map((content) => ({
    type: "text",
    text: {
      content,
    },
  }));
}

function heading(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "heading_2",
    heading_2: {
      rich_text: richText(text),
    },
  };
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

function bullet(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: richText(text),
    },
  };
}

function addStringSection(
  blocks: BlockObjectRequest[],
  label: string,
  value: string,
) {
  if (!value.trim()) {
    return;
  }

  blocks.push(heading(label), paragraph(value.trim()));
}

function addArraySection(
  blocks: BlockObjectRequest[],
  label: string,
  values: string[],
) {
  const items = values.map((item) => item.trim()).filter(Boolean);

  if (items.length === 0) {
    return;
  }

  blocks.push(heading(label), ...items.map((item) => bullet(item)));
}

export function buildSpecNotionBlocks(
  spec: PlanningSpecContent,
): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];
  const renderedSections = new Set<keyof PlanningSpecContent>();

  addStringSection(blocks, "요약", spec.summary);
  renderedSections.add("summary");

  addStringSection(blocks, "배경", spec.background);
  renderedSections.add("background");

  for (const section of SECTION_LABELS) {
    if (renderedSections.has(section.key)) {
      continue;
    }

    addArraySection(blocks, section.label, spec[section.key]);
    renderedSections.add(section.key);
  }

  return blocks.length > 0
    ? blocks
    : [paragraph("기획서 본문 내용이 없습니다.")];
}

export function toNotionRichText(value: string): RichTextItemRequest[] {
  const text = value.trim();

  if (!text) {
    return [];
  }

  return richText(text);
}
