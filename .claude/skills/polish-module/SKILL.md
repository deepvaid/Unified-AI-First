---
name: polish-module
description: Polish all pages in the next pending module of the UI polish tracker (docs/ui-improvement/page-tracker.md) — audit, fix, verify, one commit per page — then hard-stop for human review. Use when asked to "polish the next module", "continue UI polish", "run the polish loop", or "improve the app's pages".
---

# Polish Module — one loop iteration

You are executing ONE iteration of the UI polish loop: exactly one module from the tracker, then stop.

**Method (single source of truth):** `docs/ui-improvement/polish-playbook.md`. Read it in full before starting. This file only adds Claude-Code-specific orchestration; where they differ, the playbook wins.

**State:** `docs/ui-improvement/page-tracker.md`. Read it; the working module is the FIRST module whose `[module-status: ...]` is not `done`. The working page is always the first `pending` row in that module, top to bottom.

## Setup (once)

1. `git status` — must be clean; otherwise stop and tell the user.
2. Announce scope: "Module NN — <Name>, X pending pages."
3. `preview_start` with name "Main App" (if port 5173 is blocked by a stale process, surface it to the user — don't fight it).
4. Load `/accounts/2000290/dashboard`; run `preview_console_logs` and diff against the tracker's "Baseline console noise". If the baseline is `TBD`, record the current noise into the tracker Defaults now.
5. Mobbin check: `ToolSearch` for `mobbin`. If tools exist, use them per playbook §1.6; if not, proceed without — never block.

## Per-page loop

Follow playbook §4 exactly. Claude Code tool bindings:

| Playbook step | Tool |
|---|---|
| Navigate | `preview_eval`: `window.location.assign('<url>')` (SPA-safe) |
| Screenshot desktop | `preview_resize` width 1280 height 800 → `preview_screenshot` |
| Screenshot mobile | `preview_resize` width 375 height 812 → `preview_screenshot` |
| A11y snapshot | `preview_snapshot` |
| Console errors | `preview_console_logs` level "error" |
| Hard reload | `preview_eval`: `window.location.reload()` |
| Type-check | `npm run type-check` (Bash; time it — see playbook §6 pilot rule) |

Rules that are MUSTs:

- MUST read the view file (and non-Mp imported children) before editing — no blind fixes.
- MUST keep each fix to the smallest change set; no new features, fields, or scope.
- MUST commit per changed page: `[fix]: polish <PageName> UI`. Already-compliant pages get `done` in the tracker with NO commit.
- MUST update the tracker row on disk after every page (crash-safe resume) but NOT commit it until the module gate.
- MUST follow the playbook's failure branches — a `skipped`/`blocked` row with a note beats a regression or a rabbit hole.

## Module gate (hard stop)

Follow playbook §5: type-check + build green → shared-component re-checks → set `[module-status: done]` → commit tracker `[chore]: UI polish tracker — <Module> complete` → emit the review summary (per-page table, blocked/skipped reasons, after-screenshots of the 2–3 most-changed pages).

**Then STOP. Under no circumstances start the next module in the same invocation** — the human reviews first and re-runs `/polish-module` for the next one.
