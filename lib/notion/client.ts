import { Client } from "@notionhq/client";

export function createNotionClient(apiKey: string) {
  return new Client({
    auth: apiKey,
  });
}
