import type {
  BlockObjectRequest,
  BlockObjectResponse,
  CreatePageResponse,
  PartialBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { collectPaginatedAPI } from "@notionhq/client";
import { createNotionClient } from "@/lib/notion/client";
import {
  buildSpecNotionBlocks,
  toNotionRichText,
} from "@/lib/notion/blocks";
import type { PlanningSpecContent } from "@/lib/ai/specSchema";

const NOTION_CHILDREN_LIMIT = 100;
const PROJECT_INDEX_TITLE_PREFIX = "📁 ";

type PublishSpecToNotionInput = {
  apiKey: string;
  databaseId: string;
  parentPageId: string;
  projectName: string;
  specTitle: string;
  specVersion: number;
  specContent: PlanningSpecContent;
};

type PublishedNotionPage = {
  notionPageId: string;
  notionPageUrl: string;
};

function chunkBlocks(blocks: BlockObjectRequest[]) {
  const chunks: BlockObjectRequest[][] = [];

  for (let index = 0; index < blocks.length; index += NOTION_CHILDREN_LIMIT) {
    chunks.push(blocks.slice(index, index + NOTION_CHILDREN_LIMIT));
  }

  return chunks;
}

function getPageUrl(response: CreatePageResponse) {
  if ("url" in response && typeof response.url === "string") {
    return response.url;
  }

  return "";
}

function truncatePropertyText(value: string, maxLength = 1800) {
  const text = value.trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

function paragraph(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: toNotionRichText(text),
    },
  };
}

function heading2(text: string): BlockObjectRequest {
  return {
    object: "block",
    type: "heading_2",
    heading_2: {
      rich_text: toNotionRichText(text),
    },
  };
}

function getChildPageTitle(
  block: BlockObjectResponse | PartialBlockObjectResponse,
) {
  if (!("type" in block) || block.type !== "child_page") {
    return null;
  }

  return block.child_page.title;
}

function formatDocumentTimestamp(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`;
}

function getProjectIndexPageTitle(projectName: string) {
  const title = projectName.trim() || "Untitled Project";

  return `${PROJECT_INDEX_TITLE_PREFIX}${title}`;
}

async function findProjectPageId({
  notion,
  parentPageId,
  projectPageTitle,
}: {
  notion: ReturnType<typeof createNotionClient>;
  parentPageId: string;
  projectPageTitle: string;
}) {
  const children = await collectPaginatedAPI(notion.blocks.children.list, {
    block_id: parentPageId,
    page_size: 100,
  });

  const projectPage = children.find(
    (block) => getChildPageTitle(block) === projectPageTitle,
  );

  return projectPage?.id ?? null;
}

async function createProjectPage({
  notion,
  parentPageId,
  projectPageTitle,
}: {
  notion: ReturnType<typeof createNotionClient>;
  parentPageId: string;
  projectPageTitle: string;
}) {
  const projectPage = await notion.pages.create({
    parent: {
      page_id: parentPageId,
    },
    properties: {
      title: {
        title: toNotionRichText(projectPageTitle),
      },
    },
    children: [
      paragraph("이 프로젝트에서 Notion으로 배포한 기획서를 모아둔 페이지입니다."),
      heading2("배포된 기획서"),
    ],
  });

  return projectPage.id;
}

async function getProjectPageId({
  notion,
  parentPageId,
  projectPageTitle,
}: {
  notion: ReturnType<typeof createNotionClient>;
  parentPageId: string;
  projectPageTitle: string;
}) {
  const existingProjectPageId = await findProjectPageId({
    notion,
    parentPageId,
    projectPageTitle,
  });

  if (existingProjectPageId) {
    return existingProjectPageId;
  }

  return createProjectPage({
    notion,
    parentPageId,
    projectPageTitle,
  });
}

export async function publishSpecToNotion({
  apiKey,
  databaseId,
  parentPageId,
  projectName,
  specVersion,
  specContent,
}: PublishSpecToNotionInput): Promise<PublishedNotionPage> {
  const notion = createNotionClient(apiKey);
  const blockChunks = chunkBlocks(buildSpecNotionBlocks(specContent));
  const [initialChildren = []] = blockChunks;
  const projectPageTitle = getProjectIndexPageTitle(projectName);
  const documentTitle = `v${specVersion} - ${formatDocumentTimestamp(new Date())}`;
  const projectPageId = await getProjectPageId({
    notion,
    parentPageId,
    projectPageTitle,
  });

  const documentPage = await notion.pages.create({
    parent: {
      page_id: projectPageId,
    },
    properties: {
      title: {
        title: toNotionRichText(documentTitle),
      },
    },
    children: initialChildren,
  });

  const documentPageUrl = getPageUrl(documentPage);

  if (!documentPageUrl) {
    throw new Error("Standalone Notion document page URL was not returned.");
  }

  for (const children of blockChunks.slice(1)) {
    await notion.blocks.children.append({
      block_id: documentPage.id,
      children,
    });
  }

  await notion.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties: {
      Title: {
        title: toNotionRichText(documentTitle),
      },
      Project: {
        rich_text: toNotionRichText(projectName),
      },
      Status: {
        select: {
          name: "Published",
        },
      },
      Version: {
        number: specVersion,
      },
      Source: {
        select: {
          name: "PlanFlush",
        },
      },
      "Created By AI": {
        checkbox: true,
      },
      "Published At": {
        date: {
          start: new Date().toISOString(),
        },
      },
      Summary: {
        rich_text: toNotionRichText(truncatePropertyText(specContent.summary)),
      },
      "Notion Page URL": {
        url: documentPageUrl,
      },
    },
  });

  return {
    notionPageId: documentPage.id,
    notionPageUrl: documentPageUrl,
  };
}
