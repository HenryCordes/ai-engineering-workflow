#!/usr/bin/env node
/**
 * Context budget check.
 *
 * The repo's claim is that the always-loaded agent context stays small because
 * every word in it is paid for in every session. This script makes that claim
 * falsifiable: CI fails when the always-on files outgrow their budget, forcing
 * a deliberate decision (move content to an on-demand doc or skill) instead of
 * silent bloat.
 *
 * Budgets are generous headroom over current size, not aspirations — raise one
 * only with a reason in the commit message.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

/** word-count budgets for always-loaded files */
const FILE_BUDGETS = {
  "CLAUDE.md": 120,
  "AGENTS.md": 400,
};

/** character budget per skill `description` (always in context once skills are indexed) */
const SKILL_DESCRIPTION_BUDGET = 400;

const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error(`✗ ${msg}`);
};
const ok = (msg) => console.log(`✓ ${msg}`);

for (const [file, budget] of Object.entries(FILE_BUDGETS)) {
  const words = wordCount(readFileSync(join(ROOT, file), "utf8"));
  if (words > budget) {
    fail(
      `${file}: ${words} words > budget ${budget}. Move content to an on-demand doc or skill.`,
    );
  } else {
    ok(`${file}: ${words}/${budget} words`);
  }
}

const skillsDir = join(ROOT, ".claude/skills");
for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const path = join(skillsDir, entry.name, "SKILL.md");
  const source = readFileSync(path, "utf8");

  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
  const description = frontmatter?.[1].match(
    /^description:\s*(.+(?:\n(?![a-z-]+:).+)*)/m,
  )?.[1];
  if (!description) {
    fail(`${entry.name}/SKILL.md: missing frontmatter description`);
    continue;
  }
  const chars = description.replace(/\s+/g, " ").trim().length;
  if (chars > SKILL_DESCRIPTION_BUDGET) {
    fail(
      `${entry.name}/SKILL.md: description is ${chars} chars > budget ${SKILL_DESCRIPTION_BUDGET}. ` +
        "Descriptions are always in context — move detail into the skill body.",
    );
  } else {
    ok(
      `${entry.name}/SKILL.md description: ${chars}/${SKILL_DESCRIPTION_BUDGET} chars`,
    );
  }
}

if (failed) process.exit(1);
console.log("Context budget: within limits.");
