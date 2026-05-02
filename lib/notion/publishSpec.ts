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

export async function publishSpecToNotion({
  apiKey,
  databaseId,
  projectName,
  specTitle,
  specVersion,
  specContent,
}: PublishSpecToNotionInput): Promise<PublishedNotionPage> {
  const notion = createNotionClient(apiKey);
  const blockChunks = chunkBlocks(buildSpecNotionBlocks(specContent));
  const [initialChildren = []] = blockChunks;

  const page = await notion.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties: {
      Title: {
        title: toNotionRichText(specTitle || specContent.title || "Untitled Spec"),
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
        rich_text: toNotionRichText(specContent.summary),
      },
    },
    children: initialChildren,
  });

  for (const children of blockChunks.slice(1)) {
    await notion.blocks.children.append({
      block_id: page.id,
      children,
    });
  }

  return {
    notionPageId: page.id,
    notionPageUrl: getPageUrl(page),
  };
}
