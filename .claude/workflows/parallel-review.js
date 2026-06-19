export const meta = {
  name: "parallel-review",
  description:
    "Review the diff against a base branch across three dimensions in parallel, then adversarially verify each finding before reporting it",
  whenToUse:
    "Before opening a PR — catches what a single linear read-through misses, and drops findings that don't survive a skeptic.",
  phases: [
    { title: "Review", detail: "one agent per dimension, run in parallel" },
    { title: "Verify", detail: "an independent skeptic per finding" },
  ],
};

// Dimension order mirrors the review priority in AGENTS.md / CLAUDE.md:
// correctness first, then security, then this project's own standards.
const DIMENSIONS = [
  {
    key: "correctness",
    prompt:
      "Run `git diff {{BASE}}...HEAD` and review it for correctness bugs only " +
      "— logic errors, off-by-one mistakes, unhandled edge cases, broken control " +
      "flow. Ignore style and naming. For each real bug, report the file, line, " +
      "and why it's wrong.",
  },
  {
    key: "security",
    prompt:
      "Run `git diff {{BASE}}...HEAD` and review it for security issues — " +
      "injection, unsafe eval, hardcoded secrets, unvalidated input crossing a " +
      "trust boundary, anything in the OWASP Top 10. For each real issue, report " +
      "the file, line, and the concrete exploit scenario.",
  },
  {
    key: "standards",
    prompt:
      "Read AGENTS.md and docs/REACT_GUIDELINES.md. Run `git diff {{BASE}}...HEAD` " +
      "and flag only real violations: barrel imports, state that should be " +
      "derived during render instead of synced via useEffect, or genuine " +
      "duplication/premature abstraction (not stylistic taste — this project " +
      "holds DRY/KISS/SOLID with judgment, not dogma). For each violation, report " +
      "the file, line, and which standard it breaks.",
  },
];

const FINDINGS_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          file: { type: "string" },
          line: { type: "number" },
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["file", "title", "description"],
      },
    },
  },
  required: ["findings"],
};

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    real: { type: "boolean" },
    reasoning: { type: "string" },
  },
  required: ["real", "reasoning"],
};

const base = (args && args.base) || "main";

const reviewed = await pipeline(
  DIMENSIONS,
  (dimension) =>
    agent(dimension.prompt.replace("{{BASE}}", base), {
      label: `review:${dimension.key}`,
      phase: "Review",
      schema: FINDINGS_SCHEMA,
    }),
  (review, dimension) =>
    parallel(
      (review.findings || []).map(
        (finding) => () =>
          agent(
            "Try to refute this code review finding — argue it is NOT a real " +
              "problem if you genuinely can. Default to real=false if you're not " +
              `confident it's genuine. Dimension: ${dimension.key}. Finding: ` +
              `"${finding.title}" in ${finding.file}` +
              `${finding.line ? `:${finding.line}` : ""} — ${finding.description}`,
            {
              label: `verify:${dimension.key}:${finding.file}:${finding.line ?? finding.title}`,
              phase: "Verify",
              schema: VERDICT_SCHEMA,
            },
          ).then((verdict) => ({
            ...finding,
            dimension: dimension.key,
            verdict,
          })),
      ),
    ),
);

const allFindings = reviewed.flat().filter(Boolean);
const confirmed = allFindings
  .filter((f) => f.verdict?.real)
  .map(({ verdict, ...finding }) => ({
    ...finding,
    reasoning: verdict.reasoning,
  }));

log(
  `${confirmed.length} of ${allFindings.length} raised findings survived adversarial verification`,
);

return { base, raised: allFindings.length, confirmed };
