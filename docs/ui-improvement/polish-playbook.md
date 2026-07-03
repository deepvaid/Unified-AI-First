# UI Polish Playbook

The method for bringing every page to a clean, modern SaaS bar. Tool-agnostic: Claude Code runs it via `.claude/skills/polish-module/SKILL.md`; Cursor (or a human) can follow it directly. State lives in [page-tracker.md](page-tracker.md); the goal and Definition of Done originate in [../ui-improvement-roadmap.md](../ui-improvement-roadmap.md).

## Goal

Every page meets a "modern, clean, accessible SaaS" bar — consistent shell, one clear primary action, designed empty/loading/error states, WCAG 2.2 AA contrast & names, responsive at 375/768/1280, token-driven styling (no new hardcoded hex/px, no new `!important`).

## 1. Quality references (in order of authority)

1. **`src/design-tokens/tokens.json`** (+ `src/design-tokens/generated/`) — the ONLY color/spacing/radius authority. Docs quote conflicting hex values (`#1A56DB` vs `#0073AB`); tokens win, always.
2. **`docs/ui-skills/design-system-rules.md`** — cross-cutting rules.
3. **`docs/design-system.md`** — component APIs and patterns.
4. **`docs/ui-improvement-roadmap.md`** — Definition of Done (lines 140–147), established decisions (don't relitigate: bespoke headers on DashboardView/SalesChannelDetail/wizards are CORRECT; decorative hairlines exempt from 3:1; JourneyBuilder has no empty state by design).
5. **The 11+ `Mp*` components** in `src/components/` — compose, don't invent.
6. *Optional:* Mobbin reference for the page type — **only if Mobbin MCP tools are available in your session** (check first; never block on it). Seed IDs: roadmap "Mobbin reference index" (lines 122–132). Mirror reference *structure*, never add new functionality.

## 2. Per-page checklist (standard profile)

From the roadmap DoD + established constraints:

- [ ] `MpPageHeader` (+ breadcrumbs if nested); **exactly one** visually-primary CTA (`color="primary" variant="flat"`); bespoke headers OK for builders/detail identity pages if the one-primary-CTA contract holds.
- [ ] Data views have all three states: loading (`MpTableSkeleton` + `useInitialLoad`), empty (`MpEmptyState`, search-aware), error (`MpErrorState`, `role="alert"`) where reachable.
- [ ] Tables responsive via `useResponsiveTableHeaders` (`hideBelow: 'sm'|'md'|'lg'` column priority); no horizontal scroll or lost actions at 375px; sensible reflow at 768px.
- [ ] Every control keyboard-operable with visible focus; icon-only buttons have `aria-label`; inputs labeled; images have `alt` (or `alt=""` decorative); no `<div @click>` controls.
- [ ] Text contrast ≥4.5:1 (≥3:1 large); interactive UI ≥3:1 — check new pairs with the roadmap's contrast script (line 52). Decorative dividers exempt.
- [ ] No new hardcoded hex/px, no new `!important`; theme tokens / Vuetify utilities only. (Allowlisted intentional hex: `Retail/PosPreview` device mock, DaVinci orb/voice canvases, chart series colors.)
- [ ] Cards `flat border rounded="lg"`; Lucide icons kebab-case (no `mdi-*`); tabular-nums already global on tables/KPIs — don't undo.
- [ ] Status columns use `MpStatusChip` with the correct `type`; bulk selection uses `MpFloatingBulkBar`; toolbars use `MpDataTableToolbar`; forms ≤2 steps use `MpFormDrawer`, multi-step uses full-page stepper ending in a success confirmation.

## 3. Builder profile (fullPage/flush routes)

Applies to: CreateCampaign, JourneyBuilder, FormBuilder, DaVinciCopilot, DaVinciExperience, RetailPosPreview.

**Apply:** a11y (labels, keyboard, focus, Escape), token-driven color, console cleanliness, no new hex/`!important` (minus allowlist), contrast.
**Don't apply:** `MpPageHeader`, table/skeleton/empty-state rules, breadcrumbs. Builders keep their purpose-built chrome; enforce only the one-primary-CTA contract within it.

## 4. Per-page procedure

**Module preamble (once per module):**
1. `git status` must be clean — stop if not.
2. Start the dev server (Claude Code: `preview_start` "Main App"; otherwise `npm run dev`).
3. Load the dashboard once; capture console noise and diff against the tracker's recorded baseline. First ever run: record the baseline into the tracker Defaults.
4. Check whether Mobbin tools are available; note yes/no for the module.

**Per page (first `pending` row, top to bottom):**
1. **Navigate** to the row's first URL. Redirected to `/commerce-cloud`? Subscription gate — the default account should pass; if still blocked, mark `blocked` + note, next page.
2. **Before-capture:** screenshot at 1280×800 and 375×812; a11y snapshot; console errors (diff vs baseline).
3. **Static audit:** read the view file + its imported non-`Mp` children; walk the §2 (or §3) checklist; write a findings list (finding → checklist item → planned fix).
4. **Already compliant** (zero findings, clean console)? Mark `done` "already compliant" — **no commit** — next page.
5. **Fix:** smallest change set that clears the findings. Reuse `Mp*` + composables + tokens only. No new features, fields, or scope. If a fix belongs in a shared `Mp*` component, make it there and add a tracker note: "touched shared <X> — spot-check prior pages at gate."
6. **Verify:** hard-reload (beats stale HMR after shared edits); zero NEW console errors; after-screenshots at both widths; compare before/after; run type-check (cadence in §6). Spot-check alias URLs for multi-route views.
7. **Commit** `[fix]: polish <PageName> UI` — page files only, bulleted body. Update the tracker row (status/commit/notes) **on disk without committing it** (committed once at the module gate).

**Failure branches:**

| Situation | Action |
|---|---|
| Page broken *before* any edit | `blocked` + console/log excerpt in Notes; no fix attempt beyond trivial; next page |
| Broken *by* my edit | `git checkout -- <files>`; one retry with a smaller change set; second failure → commit nothing, `skipped` + note |
| Type-check failure that predates the change (confirm via `git stash` + rerun) | Note it, proceed |
| Visual result questionable | Revert. `skipped` + note beats a regression |

## 5. Module gate (hard stop)

1. `npm run type-check` && `npm run build` — must be green (the ~500 kB chunk warning is pre-existing; ignore).
2. If shared components were touched: reload every previously-`done` page in this module; check console + render.
3. Set `[module-status: done]`, commit the tracker: `[chore]: UI polish tracker — <Module> complete`.
4. **STOP. Do not start the next module.** Emit a review summary: per-page table (status / commit / one-line change), shared-component touches, blocked/skipped items with reasons, after-screenshots of the 2–3 most-changed pages.
5. Human reviews (dev server still running), then re-invokes the loop for the next module. The tracker is the only state — a killed session resumes mid-module cleanly.

## 6. Verification cadence

- **Type-check: per page.** `vue-tsc -b` is incremental (`.tsbuildinfo`) — warm runs should take seconds. *Pilot rule:* if warm runs exceed ~60s, downgrade to per-page = Vite overlay + zero new console errors, per-module = type-check at the gate (fix forward in one `[fix]: type errors from <module> polish` commit).
- **Build: module gate only.**
- **Branch: `master`** (repo practice; per-page commits give rollback granularity).
