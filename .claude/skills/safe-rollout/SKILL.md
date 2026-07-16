---
name: safe-rollout
description: Use when shipping a risky or wide-reaching change (data migration, shared-component change, behaviour swap) that needs to go out gradually with a rollback path. Produces a phased rollout plan behind a flag.
---

# Safe Rollout

## Overview

For changes that could break many call sites or users, ship behind a flag and
roll out in phases with a clear rollback at every step. Never flip a risky change
on for everyone in one commit.

## Workflow

1. **Assess blast radius** — list every caller / surface the change touches. If it
   needs strong cross-entity consistency, keep it in one unit rather than spreading
   it.
2. **Gate behind a flag** — default OFF. Old path stays byte-identical when the flag
   is off (document this in a backwards-compatibility note).
3. **Phase the rollout:**
   - Internal / staging only.
   - Small percentage of production.
   - Ramp up while watching metrics.
   - 100%, then remove the flag and dead path in a follow-up.
4. **Define rollback** before enabling: flipping the flag off must fully restore the
   old behaviour, with no data left in a bad state.
5. **Watch** — name the metrics/logs that tell you it's working (error rate,
   latency, the specific user outcome).

## Do not

- Enable a risky change globally in one step.
- Ship without a documented, tested rollback.
- Leave a flag and dead code path lingering after 100% — clean it up.
