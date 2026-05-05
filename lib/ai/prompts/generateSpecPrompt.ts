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
    "Write like a service planner or PM preparing a development-ready handoff document for FE, BE, DB, API, and QA work.",
    "Use the full saved project conversation as the only source material, including both user and assistant messages.",
    "",
    "Output rules:",
    "- Return JSON only.",
    "- Match the provided JSON schema exactly.",
    "- Keep all required top-level keys: title, summary, background, problem, goal, asIs, toBe, requirements, userFlow, screenSpecification, policiesAndEdgeCases, dataAndApi, confirmedFacts, assumptions, acceptanceCriteria, openQuestions, actionItems.",
    "- String fields must be strings. Section fields must be arrays.",
    "- Section arrays may contain concise string items or useful object items for development handoff.",
    "- Do not invent requirements, APIs, DB fields, screens, policies, roles, permissions, Notion behavior, or business rules.",
    "- If information is unclear or missing, put it in openQuestions.",
    "- If something is clearly confirmed by the user, put it in confirmedFacts.",
    "- If something is inferred but not confirmed, put it in assumptions.",
    "- Do not treat assumptions as confirmed requirements.",
    "- Do not ask openQuestions about behavior already confirmed by the user.",
    "- If a field has no supported information, use an empty string or empty array.",
    "- Ignore casual test messages such as 테스트, 되나?, or 그냥 확인 unless they contain meaningful requirements.",
    "",
    "Planning quality rules:",
    "- Avoid vague summaries.",
    "- Write requirements as specific, testable system behaviors.",
    "- Main document sections must use concise Korean planning document tone, with endings such as 한다, 해야 한다, 처리한다, 표시한다, or 하지 않는다.",
    "- Do not preserve casual chat tone or polite conversational endings in generated spec sections.",
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
    "- openQuestions should contain only high-value unresolved decisions needed before development or QA.",
    "- Prefer 5 to 8 openQuestions. Fewer is fine when the conversation is already clear.",
    "- Remove duplicate, overlapping, or merely reworded openQuestions.",
    "- Do not create openQuestions for every possible implementation detail.",
    "- Move low-level implementation follow-ups to actionItems when they are concrete tasks, or to assumptions when they are reasonable but unconfirmed inferences.",
    "- Keep exact success message text, success message display type, password policy, input reset behavior, and page navigation behavior in openQuestions when they are not confirmed.",
    "- Keep each array item concise, concrete, and useful for implementation or QA.",
    "- actionItems must be concrete FE, BE, DB, API, or QA task units, not generic reminders.",
    "",
    "Recommended object item shapes when detail is available:",
    "- requirements: { id, title, description, priority, type, asIs, toBe, acceptanceCriteria, notes }",
    "- screenSpecification: { screen, area, description, components, behavior, validation, emptyState, loadingState, errorState, notes }",
    "- policiesAndEdgeCases: { title, policy, condition, expectedBehavior, edgeCases, notes }",
    "- dataAndApi: { type, name, method, endpoint, requestFields, responseFields, dataFields, validationRules, errorCases, notes }",
    "- acceptanceCriteria: { title, given, when, then, notes }",
    "- actionItems: { id, owner, title, description, type, dependsOn, verification }",
    "- Use strings for simple sections. Do not force object items when a string is clearer.",
    "",
    `Project name: ${projectName}`,
    `Project description: ${projectDescription || "None"}`,
    "",
    "Saved project messages:",
    buildSourceText(messages),
  ].join("\n");
}
