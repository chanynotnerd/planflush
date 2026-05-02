import type {
  BlockObjectRequest,
  CreatePageResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { createNotionClient } from "@/lib/notion/client";
import {
  buildSpecNotionBlocks,
  toNotionRichText,
} from "@/lib/notion/blocks";
import type { PlanningSpecContent } from "@/lib/ai/specSchema";

const NOTION_CHILDREN_LIMIT = 100;

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

export async function publishSpecToNotion({
  apiKey,
  databaseId,
  parentPageId,
  projectName,
  specTitle,
  specVersion,
  specContent,
}: PublishSpecToNotionInput): Promise<PublishedNotionPage> {
  const notion = createNotionClient(apiKey);
  const blockChunks = chunkBlocks(buildSpecNotionBlocks(specContent));
  const [initialChildren = []] = blockChunks;
  const documentTitle = specTitle || specContent.title || "Untitled Spec";

  const documentPage = await notion.pages.create({
    parent: {
      page_id: parentPageId,
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
