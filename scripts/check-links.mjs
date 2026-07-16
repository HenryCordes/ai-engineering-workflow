#!/usr/bin/env node
/**
 * Relative-link check for markdown files.
 *
 * Context files are code: a doc index or skill that points at a moved file is
 * a broken import. This walks every tracked .md file, extracts relative link
 * targets, and fails CI when a target doesn't exist.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

const files = execSync("git ls-files '*.md'", { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const LINK_RE = /\]\(([^)\s]+)\)/g;
const broken = [];

for (const file of files) {
  const text = readFileSync(join(ROOT, file), "utf8");
  for (const [, target] of text.matchAll(LINK_RE)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = target.split("#")[0];
    if (!path) continue;
    if (!existsSync(join(ROOT, dirname(file), decodeURIComponent(path)))) {
      broken.push(`${file} -> ${target}`);
    }
  }
}

if (broken.length > 0) {
  console.error(`✗ ${broken.length} broken relative link(s):`);
  for (const link of broken) console.error(`  ${link}`);
  process.exit(1);
}
console.log(`✓ Links: ${files.length} markdown files checked, no broken relative links.`);
