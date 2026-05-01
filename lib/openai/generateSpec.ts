import { buildGenerateSpecPrompt } from "@/lib/ai/prompts/generateSpecPrompt";
import {
  isPlanningSpecContent,
  PLANNING_SPEC_JSON_SCHEMA,
  PlanningSpecContent,
  SourceMessage,
} from "@/lib/ai/specSchema";
import {
  InvalidSpecFormatError,
  normalizePlanningSpec,
} from "@/lib/ai/specNormalizer";

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

export class InvalidJsonError extends Error {
  constructor() {
    super("AI returned invalid JSON.");
    this.name = "InvalidJsonError";
  }
}

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

export async function generatePlanningSpecFromMessages({
  apiKey,
  projectName,
  projectDescription,
  messages,
}: {
  apiKey: string;
  projectName: string;
  projectDescription: string | null;
  messages: SourceMessage[];
}): Promise<PlanningSpecContent> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      max_output_tokens: 4000,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Create practical planning documents for development handoff.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildGenerateSpecPrompt({
                projectName,
                projectDescription,
                messages,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "planflush_planning_spec",
          strict: true,
          schema: PLANNING_SPEC_JSON_SCHEMA,
        },
      },
    }),
  });

  const responseBody = (await response.json()) as OpenAIResponseBody;

  if (!response.ok) {
    throw new Error(responseBody.error?.message || "OpenAI request failed.");
  }

  const outputText = getOutputText(responseBody);
  let parsed: unknown;

  try {
    parsed = JSON.parse(outputText) as unknown;
  } catch {
    throw new InvalidJsonError();
  }

  const normalized = normalizePlanningSpec(parsed);

  if (!isPlanningSpecContent(normalized)) {
    throw new InvalidSpecFormatError();
  }

  return normalized;
}
