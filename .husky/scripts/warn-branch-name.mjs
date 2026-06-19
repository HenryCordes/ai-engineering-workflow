#!/usr/bin/env node
import { execSync } from "node:child_process";

const PROTECTED_BRANCHES = new Set(["main", "staging", "production"]);
const BRANCH_PATTERN = /^[a-zA-Z0-9_.-]+\/[A-Z][A-Z0-9]*-\d+-[a-z0-9-]+$/;

// post-checkout passes: $1 prev HEAD, $2 new HEAD, $3 "1" for a branch
// checkout or "0" for a file checkout. Only warn on branch checkouts.
const isBranchCheckout = process.argv[4] === "1";
if (!isBranchCheckout) {
  process.exit(0);
}

const branch = execSync("git rev-parse --abbrev-ref HEAD", {
  encoding: "utf8",
}).trim();

if (!PROTECTED_BRANCHES.has(branch) && !BRANCH_PATTERN.test(branch)) {
  console.warn(
    `\npost-checkout: branch "${branch}" doesn't match {username}/{TICKET}-{description}.\n` +
      `You can keep working, but commits here are blocked until the name conforms.\n` +
      `See docs/GIT_HOOKS.md.\n`,
  );
}
