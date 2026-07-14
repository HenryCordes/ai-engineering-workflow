export const meta = {
  name: "generate-tests",
  description:
    "Find src/ modules without a colocated test and write one per file in parallel, each verified green before it's reported",
  whenToUse:
    "After scaffolding or landing new modules — backfills the test guardrail across many files at once instead of one at a time.",
  phases: [
    { title: "Discover", detail: "one agent lists untested modules" },
    { title: "Generate", detail: "one write-test agent per file, in parallel" },
  ],
};

// Default to the whole source tree; callers can narrow with `--glob`.
const glob = (args && args.glob) || "src/**/*.ts";

const DISCOVER_SCHEMA = {
  type: "object",
  properties: {
    files: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["files"],
};

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    file: { type: "string" },
    testFile: { type: "string" },
    passing: { type: "boolean" },
    summary: { type: "string" },
  },
  required: ["file", "passing", "summary"],
};

const discovery = await agent(
  `List every implementation module matching \`${glob}\` that has NO colocated ` +
    `\`*.test.ts\` sibling. Exclude files that are themselves tests (\`*.test.ts\`), ` +
    `type-only files (\`types.ts\`), and barrel files (\`index.ts\`). Return the source ` +
    `file paths only.`,
  {
    label: "discover:untested",
    phase: "Discover",
    schema: DISCOVER_SCHEMA,
  },
);

const targets = discovery.files || [];
log(`${targets.length} untested module(s) found`);

const results = await parallel(
  targets.map(
    (file) => () =>
      agent(
        `Write a Vitest test for \`${file}\` following the write-test subagent's ` +
          `workflow: match the nearest existing \`*.test.ts\` patterns, cover the real ` +
          `branches and edge cases, and run \`pnpm test -- --run\` on the new file to ` +
          `confirm it passes. Report the test path, whether it passes, and what it covers.`,
        {
          label: `generate:${file}`,
          phase: "Generate",
          schema: RESULT_SCHEMA,
        },
      ),
  ),
);

const written = results.filter(Boolean);
const passing = written.filter((r) => r.passing);
log(`${passing.length} of ${written.length} generated test file(s) passing`);

return {
  glob,
  untested: targets.length,
  written: written.length,
  results: written,
};
