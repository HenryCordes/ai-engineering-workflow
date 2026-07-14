---
description: Scaffold a new spec + implementation-plan pair from the house templates. Usage: /new-spec <kebab-case-slug>
---

# New Spec

Scaffold the two reviewable artifacts for a new feature — a design spec and its
implementation plan — pre-filled with this repo's section headings, so the spec-driven
workflow starts from a consistent shape instead of a blank page.

## Input

A short kebab-case feature slug (e.g. `retry-budget`, `flag-audit-log`). If the user didn't
provide one, ask for it — one word or two, no spaces.

## Steps

1. Compute today's date as `YYYY-MM-DD` (run `date +%F`).
2. Derive the two target paths:
   - `specs/<date>-<slug>-design.md`
   - `specs/implementation-plans/<date>-<slug>.md`
3. **If either file already exists, stop and report it** — never overwrite an existing spec
   or plan.
4. Create the design spec with these headings (leave a one-line prompt under each):
   `# Spec: <slug>` -> `## Problem` -> `## Inputs` -> `## Outputs` -> `## Errors / edge cases`
   -> `## Acceptance` -> `## Testing`.
5. Create the implementation plan with these headings:
   `# <slug> — Implementation Plan` -> a `**Goal:**` line -> `**Architecture:**` line ->
   `**Spec:**` link back to the design file -> the agentic-workers note (use
   `superpowers:executing-plans`, steps as `- [ ]`) -> `## File map` -> `## Backwards compatibility`
   (a table) -> `## Steps` -> `## Acceptance (from spec)`.
6. Report the two paths created and remind the user the next step is to fill in the Problem
   and Inputs, not to jump to code.

## Do not

- Overwrite an existing file.
- Fill in the actual design — scaffold the structure; the thinking is the user's (or the next
  brainstorming pass).
- Skip the plan — a spec without a plan is half the artifact.
