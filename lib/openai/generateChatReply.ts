import { buildChatReplyPrompt } from "@/lib/ai/prompts/chatReplyPrompt";
import { SourceMessage } from "@/lib/ai/specSchema";

type OpenAIResponseContentPart = {
  type?: string;
  text?: string;
};

type OpenAIResponseOutputItem = {
  content?: OpenAIResponseContentPart[];
};

type OpenAIResponseBody = {
  output_text?: string;
  output?: OpenAIResponseOutputItem[];
  error?: {
    message?: string;
  };
};

function getOutputText(responseBody: OpenAIResponseBody) {
  if (typeof responseBody.output_text === "string") {
    return responseBody.output_text;
  }

  return (
    responseBody.output
      ?.flatMap((item) => item.content ?? [])
      .map((part) => part.text)
      .filter((text): text is string => Boolean(text))
      .join("") ?? ""
  );
}

export async function generateProjectChatReply({
  apiKey,
  projectName,
  projectDescription,
  messages,
}: {
  apiKey: string;
  projectName: string;
  projectDescription: string | null;
  messages: SourceMessage[];
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      max_output_tokens: 800,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Reply in Korean unless the user asks otherwise.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildChatReplyPrompt({
                projectName,
                projectDescription,
                messages,
              }),
            },
          ],
        },
      ],
    }),
  });

  const responseBody = (await response.json()) as OpenAIResponseBody;

  if (!response.ok) {
    throw new Error(responseBody.error?.message || "OpenAI request failed.");
  }

  const reply = getOutputText(responseBody).trim();

  if (!reply) {
    throw new Error("OpenAI returned an empty assistant reply.");
  }

  return reply;
}
