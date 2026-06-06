#!/usr/bin/env bash
# SessionStart hook: primes the agent with just enough context, cheaply.
# Keep it fast — it runs at the start of every session.
set -euo pipefail

echo "## Session context"
echo "- Branch: $(git branch --show-current 2>/dev/null || echo 'n/a')"
echo "- Read AGENTS.md before non-trivial work; load the docs it indexes on demand."
echo "- Workflow: brainstorm -> spec -> implementation plan -> implement."
echo "- Never commit to main; never commit without explicit authorization."
