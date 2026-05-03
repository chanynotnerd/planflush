import type {
  BlockObjectRequest,
  RichTextItemRequest,
} from "@notionhq/client/build/src/api-endpoints";
import type { PlanningSpecContent } from "@/lib/ai/specSchema";

type ArraySpecKey = Exclude<
  keyof PlanningSpecContent,
  "title" | "summary" | "background"
>;

type RenderState = {
  renderedKeys: Set<keyof PlanningSpecContent>;
  renderedTexts: Set<string>;
};

const NOTION_RICH_TEXT_LIMIT = 2000;
const NOISE_TEXTS = new Set(["테스트", "테스트.", "되나", "되나?", "되나? 테스트."]);

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
  return NOISE_TEXTS.has(value);
}

function richText(value: string): RichTextItemRequest[] {
  return splitText(value).map((content) => ({
    type: "text",
    text: {
      content,
    },
  }));
}

function heading1(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "heading_1",
    heading_1: {
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

function getStringValue(value: string, state: RenderState) {
  const text = value.trim();
  const normalized = normalizeText(text);

  if (!text || isNoiseText(normalized) || state.renderedTexts.has(normalized)) {
    return null;
  }

  state.renderedTexts.add(normalized);
  return text;
}

function getArrayValues(values: string[], state: RenderState) {
  const items: string[] = [];

  for (const value of values) {
    const text = value.trim();
    const normalized = normalizeText(text);

    if (!text || isNoiseText(normalized) || state.renderedTexts.has(normalized)) {
      continue;
    }

    state.renderedTexts.add(normalized);
    items.push(text);
  }

  return items;
}

function getSectionValues(
  spec: PlanningSpecContent,
  key: ArraySpecKey,
  state: RenderState,
) {
  if (state.renderedKeys.has(key)) {
    return [];
  }

  state.renderedKeys.add(key);
  return getArrayValues(spec[key], state);
}

function addStringSubsection(
  blocks: BlockObjectRequest[],
  label: string,
  key: "summary" | "background",
  value: string,
  state: RenderState,
) {
  if (state.renderedKeys.has(key)) {
    return;
  }

  state.renderedKeys.add(key);

  const text = getStringValue(value, state);

  if (!text) {
    return;
  }

  blocks.push(heading2(label), paragraph(text));
}

function addListSubsection(
  blocks: BlockObjectRequest[],
  label: string,
  spec: PlanningSpecContent,
  key: ArraySpecKey,
  state: RenderState,
  listType: "bullet" | "numbered" | "todo" = "bullet",
) {
  const items = getSectionValues(spec, key, state);

  if (items.length === 0) {
    return;
  }

  const itemBlocks = items.map((item) => {
    if (listType === "numbered") {
      return numbered(item);
    }

    if (listType === "todo") {
      return toDo(item);
    }

    return bullet(item);
  });

  blocks.push(heading2(label), ...itemBlocks);
}

function buildMajorSection(
  title: string,
  build: (sectionBlocks: BlockObjectRequest[]) => void,
) {
  const sectionBlocks: BlockObjectRequest[] = [];

  build(sectionBlocks);

  if (sectionBlocks.length === 0) {
    return [];
  }

  return [divider(), heading1(title), ...sectionBlocks];
}

export function buildSpecNotionBlocks(
  spec: PlanningSpecContent,
): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];
  const state: RenderState = {
    renderedKeys: new Set<keyof PlanningSpecContent>(),
    renderedTexts: new Set<string>(),
  };

  const overviewBlocks = buildMajorSection("문서 개요", (sectionBlocks) => {
    addStringSubsection(sectionBlocks, "요약", "summary", spec.summary, state);
    addStringSubsection(sectionBlocks, "배경", "background", spec.background, state);
  });

  blocks.push(...overviewBlocks);

  blocks.push(
    ...buildMajorSection("1. 문제 정의 및 목표", (sectionBlocks) => {
      addListSubsection(sectionBlocks, "문제 정의", spec, "problem", state);
      addListSubsection(sectionBlocks, "목표", spec, "goal", state);
      addListSubsection(sectionBlocks, "AS-IS", spec, "asIs", state);
      addListSubsection(sectionBlocks, "TO-BE", spec, "toBe", state);
    }),
  );

  blocks.push(
    ...buildMajorSection("2. 요구사항", (sectionBlocks) => {
      addListSubsection(sectionBlocks, "요구사항", spec, "requirements", state);
    }),
  );

  blocks.push(
    ...buildMajorSection("3. 사용자 흐름", (sectionBlocks) => {
      addListSubsection(
        sectionBlocks,
        "사용자 흐름",
        spec,
        "userFlow",
        state,
        "numbered",
      );
    }),
  );

  blocks.push(
    ...buildMajorSection("4. 화면 및 정책 설계", (sectionBlocks) => {
      addListSubsection(sectionBlocks, "화면 설계", spec, "screenSpecification", state);
      addListSubsection(
        sectionBlocks,
        "정책 및 예외 케이스",
        spec,
        "policiesAndEdgeCases",
        state,
      );
    }),
  );

  blocks.push(
    ...buildMajorSection("5. 데이터 및 API", (sectionBlocks) => {
      addListSubsection(sectionBlocks, "데이터 및 API", spec, "dataAndApi", state);
    }),
  );

  blocks.push(
    ...buildMajorSection("6. 검증 기준", (sectionBlocks) => {
      addListSubsection(
        sectionBlocks,
        "인수 기준",
        spec,
        "acceptanceCriteria",
        state,
      );
    }),
  );

  blocks.push(
    ...buildMajorSection("7. 확정/가정/미확정 사항", (sectionBlocks) => {
      addListSubsection(sectionBlocks, "확정된 내용", spec, "confirmedFacts", state);
      addListSubsection(sectionBlocks, "가정사항", spec, "assumptions", state);
      addListSubsection(sectionBlocks, "미확정 질문", spec, "openQuestions", state);
    }),
  );

  blocks.push(
    ...buildMajorSection("8. 액션 아이템", (sectionBlocks) => {
      addListSubsection(
        sectionBlocks,
        "액션 아이템",
        spec,
        "actionItems",
        state,
        "todo",
      );
    }),
  );

  const renderedBlocks =
    blocks[0]?.type === "divider" ? blocks.slice(1) : blocks;

  return renderedBlocks.length > 0
    ? renderedBlocks
    : [paragraph("기획서 본문 내용이 없습니다.")];
}

export function toNotionRichText(value: string): RichTextItemRequest[] {
  const text = value.trim();

  if (!text) {
    return [];
  }

  return richText(text);
}
