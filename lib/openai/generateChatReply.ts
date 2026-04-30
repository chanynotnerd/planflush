type SourceMessage = {
  role: string;
  content: string;
  createdAt: Date;
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

function buildConversationText(messages: SourceMessage[]) {
  return messages
    .map((message, index) => {
      return [
        `#${index + 1}`,
        `role: ${message.role}`,
        `createdAt: ${message.createdAt.toISOString()}`,
        "content:",
        message.content,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function buildPrompt({
  projectName,
  projectDescription,
  messages,
}: {
  projectName: string;
  projectDescription: string | null;
  messages: SourceMessage[];
}) {
  return [
    "You are PlanFlush's service planning assistant.",
    "Reply inside the project chat. This is not the final planning document step.",
    "Your job is to help the user clarify requirements through concise conversation before they explicitly click Generate Spec.",
    "",
    "Chat reply rules:",
    "- Reply in Korean by default.",
    "- Keep the default reply around 5 to 8 lines.",
    "- Ask at most 3 follow-up questions.",
    "- Do not repeat the full conversation summary every time.",
    "- Do not generate a full planning document during chat.",
    "- Do not use long section-heavy responses unless the user explicitly asks for a detailed summary.",
    "- When the user provides information, briefly acknowledge it and ask only the next missing questions.",
    "- If enough information seems available, include this sentence: 이 정도면 기획서 초안 생성이 가능합니다.",
    "- Do not invent missing details. Ask questions instead of filling gaps.",
    "- Keep the tone practical, concise, and natural for a service planning assistant.",
    "- Avoid Markdown-heavy formatting. Plain numbered questions are enough.",
    "",
    "Preferred structure:",
    "반영했습니다.",
    "One short sentence summarizing what you understood.",
    "",
    "다음으로 확인할 것:",
    "1. One concise question",
    "2. One concise question",
    "3. One concise question",
    "",
    `Project name: ${projectName}`,
    `Project description: ${projectDescription || "None"}`,
    "",
    "Current saved conversation:",
    buildConversationText(messages),
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
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are a service planning assistant. Reply in Korean unless the user asks otherwise.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildPrompt({ projectName, projectDescription, messages }),
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
