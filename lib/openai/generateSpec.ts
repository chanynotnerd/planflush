type SourceMessage = {
  role: string;
  content: string;
  createdAt: Date;
};

export type PlanningSpecContent = {
  title: string;
  summary: string;
  background: string;
  problem: string[];
  goal: string[];
  asIs: string[];
  toBe: string[];
  requirements: string[];
  userFlow: string[];
  screenSpecification: string[];
  policiesAndEdgeCases: string[];
  dataAndApi: string[];
  openQuestions: string[];
  actionItems: string[];
};

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

const SPEC_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "background",
    "problem",
    "goal",
    "asIs",
    "toBe",
    "requirements",
    "userFlow",
    "screenSpecification",
    "policiesAndEdgeCases",
    "dataAndApi",
    "openQuestions",
    "actionItems",
  ],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    background: { type: "string" },
    problem: { type: "array", items: { type: "string" } },
    goal: { type: "array", items: { type: "string" } },
    asIs: { type: "array", items: { type: "string" } },
    toBe: { type: "array", items: { type: "string" } },
    requirements: { type: "array", items: { type: "string" } },
    userFlow: { type: "array", items: { type: "string" } },
    screenSpecification: { type: "array", items: { type: "string" } },
    policiesAndEdgeCases: { type: "array", items: { type: "string" } },
    dataAndApi: { type: "array", items: { type: "string" } },
    openQuestions: { type: "array", items: { type: "string" } },
    actionItems: { type: "array", items: { type: "string" } },
  },
} as const;

function buildSourceText(messages: SourceMessage[]) {
  return messages
    .map((message, index) => {
      const createdAt = message.createdAt.toISOString();

      return [
        `#${index + 1}`,
        `role: ${message.role}`,
        `createdAt: ${createdAt}`,
        "content:",
        message.content,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function buildPrompt(projectName: string, projectDescription: string | null, messages: SourceMessage[]) {
  return [
    "Generate a structured planning document JSON for PlanFlush.",
    "Use only the saved project messages as source material.",
    "If information is missing, put concise questions in openQuestions instead of inventing details.",
    "Keep all array items short, concrete, and useful for service planners, PMs, and operators.",
    "",
    `Project name: ${projectName}`,
    `Project description: ${projectDescription || "None"}`,
    "",
    "Saved project messages:",
    buildSourceText(messages),
  ].join("\n");
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isPlanningSpecContent(value: unknown): value is PlanningSpecContent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const spec = value as Record<string, unknown>;

  return (
    typeof spec.title === "string" &&
    typeof spec.summary === "string" &&
    typeof spec.background === "string" &&
    isStringArray(spec.problem) &&
    isStringArray(spec.goal) &&
    isStringArray(spec.asIs) &&
    isStringArray(spec.toBe) &&
    isStringArray(spec.requirements) &&
    isStringArray(spec.userFlow) &&
    isStringArray(spec.screenSpecification) &&
    isStringArray(spec.policiesAndEdgeCases) &&
    isStringArray(spec.dataAndApi) &&
    isStringArray(spec.openQuestions) &&
    isStringArray(spec.actionItems)
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
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You create practical planning documents. Return JSON only.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildPrompt(projectName, projectDescription, messages),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "planflush_planning_spec",
          strict: true,
          schema: SPEC_SCHEMA,
        },
      },
    }),
  });

  const responseBody = (await response.json()) as OpenAIResponseBody;

  if (!response.ok) {
    throw new Error(responseBody.error?.message || "OpenAI request failed.");
  }

  const outputText = getOutputText(responseBody);
  const parsed = JSON.parse(outputText) as unknown;

  if (!isPlanningSpecContent(parsed)) {
    throw new Error("OpenAI returned an invalid planning spec.");
  }

  return parsed;
}
