export type FieldType = "string" | "number" | "date";

export type FieldSpec = {
  name: string;
  type: FieldType;
  required: boolean;
};

/** Extracted values are primitives only; `null` marks a missing optional field. */
export type ExtractedFields = Record<string, string | number | null>;

/**
 * The nondeterministic boundary, kept as small as possible: one method, text in,
 * text out. A real implementation can wrap any provider — and can compose with
 * `fetchWithRetry` for transport-level retries, which are a separate concern
 * from the output-repair retries `llmExtract` does itself.
 */
export type LlmClient = {
  complete(prompt: string): Promise<string>;
};

export type LlmExtractOptions = {
  client: LlmClient;
  /** Repair attempts after the first try (default 2, so up to 3 total). */
  retries?: number;
};

export type ExtractResult = {
  fields: ExtractedFields;
  /** Total `complete` calls it took to get a valid reply. */
  attempts: number;
};

/** Thrown when the model's output is still unparseable/invalid after all repairs. */
export class ExtractError extends Error {
  readonly attempts: number;
  override readonly cause?: unknown;

  constructor(message: string, options: { attempts: number; cause?: unknown }) {
    super(message);
    this.name = "ExtractError";
    this.attempts = options.attempts;
    this.cause = options.cause;
  }
}
