# Aesthetic Pass — orchestrator prompt

Paste everything below the line into a Claude Code session opened at the repo root (or run
`/aesthetic-pass`). One invocation runs **one wave** (3–5 modules in parallel) and stops.

---

You are the **orchestrator** of one wave of the app-wide aesthetic pass for this Vue 3 + Vuetify 3
design-system playground. Your job: fan the wave's modules out to parallel worktree agents, merge
their page commits, apply any shared fixes yourself, verify, record, and **stop for human review**.

Read in full before anything else:

1. `CLAUDE.md` (conventions, tokens, component inventory)
2. `docs/ui-improvement/aesthetic-recipe.md` (the look — items A–H)
3. `docs/ui-improvement/polish-playbook.md` (correctness checklist, failure branches, builder profile)
4. `docs/ui-improvement/page-tracker.md` (page inventory, account defaults, console baseline)

Reference implementation to open beside every page: `src/views/Service/Tickets.vue` and
`src/components/service/TicketWorkspace.vue` (commits `bd542c8`, `8d265b7`).

## 1. Preconditions (stop if any fails)

- `git status` is clean and you are on `master`.
- `npm run type-check` is green.
- Dev server up via `preview_start` with the launch config named **"Main App"** (never `npm run dev`
  in Bash). Load `/accounts/2000290/dashboard` once and diff console errors against the tracker's
  recorded baseline (zero errors; two known warnings).
- Account defaults come from `page-tracker.md` → "Defaults": accountId `2000290`, dashboardId
  `2000290-home`, journeyId `1`, channelId `pos-store`, locationId `loc-bondi`.

## 2. State

State lives in `docs/ui-improvement/aesthetic-tracker.md`. If it does not exist, generate it now:

- Same columns as `page-tracker.md` (`# | View file | URL(s) | Profile | Status | Commit | Notes`),
  one row per view copied from `page-tracker.md` (all 14 modules, all rows), every row `pending`.
- Group modules under wave headings exactly as in §3, each module keeping its
  `[module-status: pending]` marker. Keep `page-tracker.md` untouched — the `polish-module` skill
  parses it and must not break.
- Commit it alone: `[chore]: aesthetic tracker — generated from page-tracker`.

The **working wave** is the first wave that contains any module whose status is not `done`.
Within it, only modules not `done` are dispatched.

## 3. Wave map (fixed)

| Wave | Modules (agents) |
|---|---|
| W1 | 04 Products · 05 Commerce · 10 Service · 12 App Store + 14 Billing & Misc (one agent) |
| W2 | 01 Dashboard · 02 Analytics · 03 Contacts |
| W3 | 06 Merchandising · 07 Retail · 08 Sales Channels · 11 Da Vinci |
| W4 | 09 Marketing split into three agents — (a) campaigns + journeys, (b) forms + landing pages + lead ads, (c) content + reporting · 13 Settings |

Rows already `done` in `page-tracker.md` are still audited here: they passed the functional
checklist, not the aesthetic one.

## 4. Fan-out

For every module in the working wave, launch one `Agent` (`subagent_type: "general-purpose"`,
`isolation: "worktree"`, `run_in_background: true`), at most **4 running at once**. Give each the
**module brief** in §5 verbatim, with its module name and rows filled in.

Hard rules that every agent receives and you enforce at merge:

- **Page files only.** Agents edit files under `src/views/**` and feature components that belong to
  that page (e.g. `src/components/service/*`). They never edit `src/components/Mp*`,
  `src/components/layout/*`, `src/styles/*`, `src/design-tokens/*`, `src/plugins/*`,
  `src/router/*`, or any tracker. A fix that belongs in a shared component is written up as a
  **shared-fix proposal** (file, line, why, suggested change) in the agent's report.
- **One commit per page**: `[fix]: aesthetic pass — <PageName>`, page files only, bulleted body
  (finding → change). Already-compliant pages get no commit.
- **Preserve function.** Every field, action, state and route of the original survives; the agent
  diffs its functional inventory before each commit. The only permitted additions are the recipe's
  F1 list controls (search / sort / quick-filter tabs) on a list that lacks them.
- **Budget.** An agent stops at a page boundary after ~12 pages or ~90 minutes and reports what is left.

Do not do page work yourself while agents run; wait for their completion notifications.

## 5. Module brief (send verbatim, filling the placeholders)

```
You are polishing MODULE <NN — Name> of the app-wide aesthetic pass, alone, in your own git worktree.

Read first, in full: CLAUDE.md · docs/ui-improvement/aesthetic-recipe.md ·
docs/ui-improvement/polish-playbook.md (§2 checklist, §3 builder profile, §4 failure table).
Reference implementation: src/views/Service/Tickets.vue + src/components/service/TicketWorkspace.vue.

Your rows (view file · URL · profile), in order:
<paste the module's rows from docs/ui-improvement/aesthetic-tracker.md>

Per page, follow recipe §H exactly:
1. Navigate with mcp__Claude_Browser__navigate to the row's first URL (dev server is already running
   on http://localhost:5173). Capture BEFORE at three widths using mcp__Claude_Browser__resize_window
   (1440×900, 1024×768, preset "mobile") + mcp__Claude_Browser__computer {action:"screenshot"}; save
   nothing to the repo — screenshots go to your scratchpad. Take mcp__Claude_Browser__read_page
   (filter "interactive") and mcp__Claude_Browser__read_console_messages (onlyErrors) as evidence.
   Coordinate clicks under viewport emulation can land off-target: after a fresh screenshot use
   coordinates from THAT screenshot, or drive controls via mcp__Claude_Browser__javascript_tool
   (querySelector + .click(), input events for fields). Check dark theme once per page:
   localStorage.setItem('app-theme-mode','dark') then reload; set it back to 'light' after.
2. Static audit: read the view and its non-Mp* children; list findings as "(recipe item) where → fix".
   Standard profile = recipe A–G + playbook §2. Builder profile = recipe C, D, E, G + playbook §3.
   Zero findings → mark the row done ("already compliant"), no commit, next page.
3. Fix with the smallest change set. Tokens (var(--mp-*)) in CSS, Vuetify utilities in templates,
   Mp* components for structure. PAGE FILES ONLY: never edit src/components/Mp*, layout/*, styles/*,
   design-tokens/*, plugins/*, router/*, or any tracker. Shared-component fixes become a
   "shared-fix proposal" in your report (file:line, why, suggested change) — do not apply them.
   Keep every function, field and state; diff the functional inventory before committing.
4. Verify: npm run type-check; zero NEW console errors; AFTER captures at the three widths; at 375
   confirm document.documentElement.scrollWidth === innerWidth; keyboard-walk any control you added.
5. Commit in your worktree: "[fix]: aesthetic pass — <PageName>" — page files only, bulleted body.
   End every commit message with: Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
6. Failure branches: playbook §4 table (broken before edit → blocked; broken by edit → revert, one
   smaller retry, then skipped; questionable visual → revert and skip).

Stop after ~12 pages or ~90 minutes at a page boundary. Do not touch other modules.

Report back (this is the only thing the orchestrator sees):
- Worktree branch name.
- Table: view file · status (done / done-no-change / skipped / blocked) · commit · one-line change.
- Shared-fix proposals: file:line · why · suggested change (deduped).
- Paths of the 2–3 most-changed pages' before/after screenshots in your scratchpad.
- Anything blocked with the console or log excerpt.
```

## 6. Merge

When an agent completes:

1. `git merge --no-ff <its branch>` into `master`. Worktrees are per module, so conflicts only occur
   if two agents touched the same file — that is a rule violation; take the earlier merge, re-run the
   later agent's page on `master` yourself, and note it in the summary.
2. Update the module's rows in `aesthetic-tracker.md` from the report (on disk, uncommitted until the gate).

When all agents of the wave are merged:

3. Dedupe the shared-fix proposals across reports. Apply the ones that hold up (recipe + CLAUDE.md
   conventions; tokens before pixels; add a token if one is missing, then `npm run tokens:build`),
   one commit: `[fix]: shared — <what> (aesthetic wave N)`. Reject the rest with a one-line reason
   in the summary.
4. `npm run type-check` · `npm run build` (the ~500 kB chunk warning is pre-existing) · `npm run contrast:check`.

## 7. Gate and stop

1. Reload two pages per module at 1440×900 and 375×812; zero new console errors; if shared
   components changed, also reload the wave's most-changed pages.
2. Set `[module-status: done]` on the wave's modules; commit
   `[chore]: aesthetic tracker — wave N complete`.
3. Emit the **review summary**: per-module table (pages done / no-change / skipped / blocked, commits),
   shared fixes applied and rejected, blocked items with reasons, and the after-screenshots of the
   three most-changed pages in the wave (send them with `SendUserFile`).
4. **STOP.** Never start the next wave in the same invocation. The human reviews with the dev server
   still running and re-runs this prompt for the next wave. The tracker is the only state, so a
   killed session resumes cleanly.

## 8. Guardrails

- Never `git push`, never `--force`, never rewrite history; never delete worktrees you did not create
  (`.claude/worktrees/` may hold other sessions' work).
- `Retail/PosPreview`, DaVinci orb/voice canvases and chart palettes keep their allowlisted literals.
- Builder-profile routes (playbook §3) keep their chrome; agents apply only recipe C, D, E and G there.
- If a precondition fails mid-wave (type-check red on `master` before your merge, dev server down),
  finish merging nothing further, write the summary with the failure, and stop.
- Commit messages follow `[type]: description` and end with the Co-Authored-By line above.
