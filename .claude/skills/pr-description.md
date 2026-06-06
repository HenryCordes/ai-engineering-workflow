---
name: pr-description
description: Produces a copy-paste PR description from the current diff, following the repo's pull request template. Use when the user asks for a PR description, PR body, or to fill the PR template after changes.
---

# PR Description

## When invoked

1. **Read** `.github/pull_request_template.md` — output must follow its structure
   and headings.
2. **Infer content** from the current branch, `git diff` / staged changes, and the
   conversation. If the ticket ID is unknown, use a placeholder (`PROJ-000`) and
   say so.
3. **Be substantive** — Summary, Changes, Testing and Related sections with real
   bullets, not placeholders.

## Output rules

- A single fenced markdown block containing the full PR body, ready to paste.
- Replace every `<!-- ... -->` placeholder with real content; remove the comments.
- Use `-` bullets; no empty sections — write concrete bullets or "N/A" with a one-
  line reason.
- Mention how it was tested (`pnpm lint:fix && pnpm typecheck`, tests run).
- **Screenshots:** if UI changed, state what to capture; if not, say so.

## Do not

- Invent ticket numbers — use a placeholder if missing.
- Omit the checklist at the bottom of the template.
