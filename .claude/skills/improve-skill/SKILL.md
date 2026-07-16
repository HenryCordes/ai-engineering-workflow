---
name: improve-skill
description: Use when something went wrong in a session that a skill or rule should have prevented — a correction from the user, a broken build, a convention violation, a repeated mistake. Captures the failure as a permanent fix to the responsible skill, doc, or rule.
---

# Improve Skill

## Overview

The hardening loop. Context files (skills, docs, `AGENTS.md`) are treated like code: when
they fail, they get a fix, not a workaround. Every correction the user has to make twice is
a bug in the harness, and this skill patches the harness. Over time skills converge on
bulletproof, and the always-loaded context stays small because knowledge accretes in the
right on-demand file instead of in an ever-growing CLAUDE.md.

## When invoked

Mid-session, right after the failure — while the exact wording of what went wrong is still
in context. Typical triggers: the user corrects the same thing again, a hook or CI rejects
work, a skill produced output that violated a repo convention, a doc turned out to be wrong
or stale.

## Workflow

1. **Name the failure precisely.** One sentence: what was expected, what happened instead.
   If it can't be stated in one sentence, it isn't understood yet.
2. **Find the owner.** Which file *should* have prevented this?
   - A task went wrong → the skill for that task.
   - A convention was violated → the doc that states it (or should state it).
   - It must never happen regardless of task → `AGENTS.md` (always-loaded, so the bar is
     high) or better, a deterministic guardrail (git hook, lint rule, CI check).
   - No owner exists → propose the smallest new home; a new skill needs a recurring task,
     not a one-off.
3. **Write the smallest rule that would have prevented it.** One or two lines in the
   owner's body. Prefer tightening an existing step over adding a new section. Never grow a
   skill's `description` for this — descriptions are always in context and stay one line.
4. **Log it.** Append to the owner skill's `## Lessons` section (create it on first
   lesson): `- YYYY-MM-DD — <failure> → <rule added>`. This keeps the audit trail of *why*
   each rule exists.
5. **Confirm with the user** before writing — show the exact edit. If the same lesson is
   being added a second time, the rule is wrong or unclear; rewrite it instead of
   restating it.

## Do not

- Patch the symptom in the session but skip the harness fix — that's how the same failure
  returns next week.
- Add generic advice a model already knows; rules must be project-specific and falsifiable.
- Grow `AGENTS.md` when an on-demand skill or doc can own the rule.
- Turn a one-off mishap into a rule; twice is a pattern, once is noise (log nothing).
