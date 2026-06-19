#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PROTECTED_BRANCHES = new Set(["main", "staging", "production"]);
const COMMIT_PATTERN =
  /^(feat|fix|refactor|test|docs|chore|perf|style|build|ci)\([A-Z][A-Z0-9]*-\d+\):\s.+/;
const BRANCH_PATTERN = /^[a-zA-Z0-9_.-]+\/[A-Z][A-Z0-9]*-\d+-[a-z0-9-]+$/;

const messageFile = process.argv[2];
const subject = readFileSync(messageFile, "utf8").split("\n")[0].trim();

if (/^(Merge |Revert )/.test(subject)) {
  process.exit(0);
}

if (!COMMIT_PATTERN.test(subject)) {
  console.error(
    `\ncommit-msg: "${subject}" doesn't match Conventional Commits + ticket scope.\n` +
      `Expected: type(TICKET-123): short description\n` +
      `Example:  feat(PROJ-123): add login redirect\n` +
      `See .claude/skills/commit.md.\n`,
  );
  process.exit(1);
}

const branch = execSync("git rev-parse --abbrev-ref HEAD", {
  encoding: "utf8",
}).trim();

if (!PROTECTED_BRANCHES.has(branch) && !BRANCH_PATTERN.test(branch)) {
  console.error(
    `\ncommit-msg: branch "${branch}" doesn't match {username}/{TICKET}-{description}.\n` +
      `Example: henry/PROJ-123-fix-login-redirect\n` +
      `See docs/GIT_HOOKS.md.\n`,
  );
  process.exit(1);
}
