import type {
  ExtractedFields,
  ExtractResult,
  FieldSpec,
  LlmExtractOptions,
} from "./types";
import { ExtractError } from "./types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const fieldLine = (f: FieldSpec): string =>
  `- "${f.name}": ${f.type === "date" ? 'date as "YYYY-MM-DD" string' : f.type}${
    f.required ? " (required)" : " (optional — use null when absent)"
  }`;

/** Exported for tests; prompt content is part of the deterministic core. */
export const buildPrompt = (text: string, fields: FieldSpec[]): string =>
  [
    "Extract the following fields from the text below.",
    "Reply with ONLY a JSON object — no markdown fences, no explanation.",
    "Fields:",
    ...fields.map(fieldLine),
    "",
    "Text:",
    text,
  ].join("\n");

/** Exported for tests; embeds the failed reply and the exact errors so the model can repair. */
export const buildRepairPrompt = (
  text: string,
  fields: FieldSpec[],
  previousReply: string,
  problems: string,
): string =>
  [
    "Your previous reply could not be used.",
    `Previous reply:\n${previousReply}`,
    `Problems:\n${problems}`,
    "",
    buildPrompt(text, fields),
  ].join("\n");

/** Strip optional markdown fences and parse. Throws SyntaxError on invalid JSON. */
const parseReply = (reply: string): unknown => {
  const stripped = reply
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");
  return JSON.parse(stripped) as unknown;
};

/**
 * Validate a parsed reply against the field specs. Returns the typed fields
 * (unknown keys dropped, missing optionals as null) or throws an Error whose
 * message lists every problem — that message feeds the repair prompt.
 */
const validateFields = (
  parsed: unknown,
  specs: FieldSpec[],
): ExtractedFields => {
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("reply must be a JSON object");
  }
  const source = parsed as Record<string, unknown>;
  const problems: string[] = [];
  const fields: ExtractedFields = {};

  for (const spec of specs) {
    const value = source[spec.name];
    if (value === undefined || value === null) {
      if (spec.required) {
        problems.push(`"${spec.name}" is required but missing or null`);
      } else {
        fields[spec.name] = null;
      }
      continue;
    }
    if (spec.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        problems.push(
          `"${spec.name}" must be a finite number, got ${JSON.stringify(value)}`,
        );
        continue;
      }
      fields[spec.name] = value;
      continue;
    }
    if (typeof value !== "string") {
      problems.push(
        `"${spec.name}" must be a ${spec.type} string, got ${JSON.stringify(value)}`,
      );
      continue;
    }
    if (
      spec.type === "date" &&
      (!ISO_DATE_RE.test(value) || Number.isNaN(Date.parse(value)))
    ) {
      problems.push(
        `"${spec.name}" must be a valid "YYYY-MM-DD" date, got ${JSON.stringify(value)}`,
      );
      continue;
    }
    fields[spec.name] = value;
  }

  if (problems.length > 0) throw new Error(problems.join("; "));
  return fields;
};

/**
 * Extract typed fields from unstructured text via an injected LLM client.
 * Malformed or invalid model output is repaired with bounded retries; client
 * (transport) rejections propagate untouched.
 */
export async function llmExtract(
  text: string,
  fields: FieldSpec[],
  options: LlmExtractOptions,
): Promise<ExtractResult> {
  const { client, retries = 2 } = options;
  let prompt = buildPrompt(text, fields);
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    const reply = await client.complete(prompt); // rejection: caller's concern
    try {
      return {
        fields: validateFields(parseReply(reply), fields),
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;
      const problems = error instanceof Error ? error.message : String(error);
      prompt = buildRepairPrompt(text, fields, reply, problems);
    }
  }

  throw new ExtractError("model output still invalid after repairs", {
    attempts: retries + 1,
    cause: lastError,
  });
}
