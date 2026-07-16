# CLAUDE.md — Project Context for Claude Code

All rules, conventions and standards live in [AGENTS.md](AGENTS.md) — read it first; it
indexes the docs to load on demand. This file stays minimal on purpose: skills, subagents
and workflows under [.claude/](.claude) announce themselves through their own descriptions,
and a `SessionStart` hook ([.claude/hooks/session-start.sh](.claude/hooks/session-start.sh))
primes branch + workflow context. When a session goes wrong in a way a skill should have
prevented, run the `improve-skill` skill — context files are code and failures get fixes.
