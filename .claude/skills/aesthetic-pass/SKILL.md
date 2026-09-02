---
name: aesthetic-pass
description: Run ONE wave (3–5 modules in parallel worktree agents) of the app-wide aesthetic pass — spacing, typography, icons, whitespace, tonal states — from docs/ui-improvement/aesthetic-pass-prompt.md, then hard-stop for human review. Use when asked to "run the aesthetic pass", "polish the next wave", "apply the tickets look everywhere", or "make all pages look like Service Tickets".
---

# Aesthetic Pass — one wave

You are the orchestrator of exactly one wave of the app-wide aesthetic pass.

**Method (single source of truth):** `docs/ui-improvement/aesthetic-pass-prompt.md`. Read it in full
and execute it as written — preconditions, tracker generation, wave map, fan-out with the verbatim
module brief, merge, gate, review summary, **stop**.

**The look:** `docs/ui-improvement/aesthetic-recipe.md` (items A–H). **Correctness:**
`docs/ui-improvement/polish-playbook.md`. **Reference pages:** `src/views/Service/Tickets.vue`,
`src/components/service/TicketWorkspace.vue`.

**State:** `docs/ui-improvement/aesthetic-tracker.md` (generated on first run; `page-tracker.md` is
the `polish-module` skill's state and is never edited here).

Under no circumstances start the next wave in the same invocation — the human reviews first and
re-runs `/aesthetic-pass`.
