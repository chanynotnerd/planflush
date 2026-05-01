import { SourceMessage } from "@/lib/ai/specSchema";

function buildSourceText(messages: SourceMessage[]) {
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

export function buildGenerateSpecPrompt({
  projectName,
  projectDescription,
  messages,
}: {
  projectName: string;
  projectDescription: string | null;
  messages: SourceMessage[];
}) {
  return [
    "Generate a structured planning document JSON for PlanFlush.",
    "Write like a service planner or PM preparing a development handoff document.",
    "Use only the full saved project conversation as source material, including both user and assistant messages.",
    "",
    "Output rules:",
    "- Return JSON only.",
    "- Match the provided JSON schema exactly.",
    "- Do not invent missing APIs, DB fields, UI names, policies, permissions, or business rules.",
    "- If information is unclear or missing, put it in openQuestions.",
    "- If something is clearly confirmed by the user, put it in confirmedFacts.",
    "- If something is inferred but not confirmed, put it in assumptions.",
    "- Do not treat assumptions as confirmed requirements.",
    "- Do not ask openQuestions about behavior already confirmed by the user.",
    "- Keep string fields as strings and list fields as arrays of strings.",
    "- If a field has no supported information, use an empty string or empty array.",
    "",
    "Planning quality rules:",
    "- Avoid vague summaries.",
    "- Write requirements as specific, testable system behaviors.",
    "- Map confirmed user statements into requirements, not only into summary, goal, or confirmedFacts.",
    "- If a confirmed statement describes system behavior, validation, error handling, success handling, user scope, or state handling, include it as a concrete requirement.",
    "- Requirements should preserve confirmed error codes, states, actors, and blocking conditions exactly when they appear in the conversation.",
    "- Requirements must include confirmed success message display behavior when the conversation confirms it.",
    "- Requirements must include confirmed login/session state behavior, such as maintaining login state after a successful password change.",
    "- Requirements must include confirmed actor scope, such as a normal user changing their own password rather than an admin changing another user's password.",
    "- For password-change specs, confirmed mismatch blocking rules and confirmed error codes such as CURRENT_PASSWORD_MISMATCH or PASSWORD_CONFIRM_MISMATCH must appear in requirements.",
    "- Include policies and edge cases only when supported by the conversation.",
    "- Include data/API candidates only when mentioned or strongly implied.",
    "- Populate acceptanceCriteria when confirmed behavior exists.",
    "- Write acceptanceCriteria in GIVEN / WHEN / THEN format when possible.",
    "- Keep openQuestions only for genuinely missing or unclear items, such as unconfirmed policy, message text, placement, permission, or edge-case details.",
    "- Keep exact success message text, success message display type, password policy, input reset behavior, and page navigation behavior in openQuestions when they are not confirmed.",
    "- Keep each array item concise, concrete, and useful for implementation or QA.",
    "",
    `Project name: ${projectName}`,
    `Project description: ${projectDescription || "None"}`,
    "",
    "Saved project messages:",
    buildSourceText(messages),
  ].join("\n");
}
