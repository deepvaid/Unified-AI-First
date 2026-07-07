---
name: uat-parity
description: Run one gated slice of the UAT feature-parity effort — crawl the next pending UAT module into the tracker, or build the next pending module's missing pages — then hard-stop for human review. Use when asked to "crawl the next UAT module", "continue UAT parity", "build the next parity module", or "run the parity loop".
---

# UAT Parity — one loop iteration

You are executing ONE slice of the UAT parity loop, then stopping.

**Method (single source of truth):** `docs/uat-parity/parity-playbook.md`. Read it in full before starting. This file only adds orchestration; where they differ, the playbook wins.

**State:** `docs/uat-parity/parity-tracker.md`. Read it. Part A = UAT inventory; Part B = gap matrix. This is the only memory between sessions.

The full copy-paste prompts live in `docs/uat-parity/phase-prompts.md` — this skill is a thin wrapper over Prompt 1 (crawl) and Prompt 4 (build).

## `/uat-parity crawl` — crawl the next module

Runs Prompt 1 for the FIRST Part A section with `[crawl-status: pending]`.

1. Confirm `<UAT_URL>` is filled and a controlled browser session is logged into UAT; else STOP and tell the user.
2. Crawl that one module per playbook section 2: record title/path/type per nav item, open CTAs one level deep, screenshot each page to `maropost-screenshots/uat/<module>/<slug>.png`.
3. Write rows into Part A; set the section to `[crawl-status: crawled]`.

Tool bindings: navigate / snapshot / screenshot via claude-in-chrome, Playwright, or equivalent controlled browser tooling. Never use cookie/localstorage/storage-state/request-body export commands during a crawl.

## `/uat-parity build` — build the next module

Runs Prompt 4 for the next module with `pending` missing/partial rows.

1. `git status` must be clean. Start the dev server (`preview_start` "Main App").
2. Per playbook section 4 (additive only) + section 6 (Definition of done): new view + appended route + nav item + typed store mock; reuse `Mp*`; verify no 404, type-check, screenshot; commit `[feat]: add <Page> (UAT parity — <module>)` per page; update the Part B row.

Tool bindings: `preview_eval` navigate · `preview_resize` + `preview_screenshot` · `npm run type-check` (Bash).

## Rules that are MUSTs

- ONE slice per invocation. Never redesign or edit an existing view's template/styles — additive route/nav/store touches only.
- Update the tracker on disk after every page/module (crash-safe resume).
- Never write the UAT URL / cookies / credentials anywhere except the tracker Defaults block.
- Do not open sensitive settings cards (API Keys, JSON Web Token, SFTP access/import/export) unless the user has explicitly scoped that pass and redaction rules are stated.

## Hard stop

Stop at the slice boundary (module crawled, or module built + committed per page). **Under no circumstances start the next module in the same invocation** — the human reviews first and re-invokes `/uat-parity`.
