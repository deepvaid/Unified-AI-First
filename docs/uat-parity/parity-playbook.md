# UAT Parity Playbook

The method for auditing the live UAT product and closing feature gaps in the prototype — additively, across many short sessions, without context blowup. Tool-agnostic: Claude Code runs it via `.claude/skills/uat-parity/SKILL.md`; Cursor (or a human) can follow it directly. State lives in [parity-tracker.md](parity-tracker.md); kickoff prompts are in [phase-prompts.md](phase-prompts.md).

## Goal

Inventory every page and key flow in the live UAT environment (Part A of the tracker), diff it against the prototype's ~90 views (Part B), and build everything missing or partial — WITHOUT removing or redesigning any existing prototype page. New pages follow the prototype's design system (modern UX), not the legacy UAT UX.

Browser tooling: the **crawl** phase uses a controlled browser session the user has logged into (claude-in-chrome, Playwright, or equivalent navigate / snapshot / screenshot tooling). Never export cookies, local storage, storage state, request bodies, credentials, or tokens. **Build/verify** phases use the local dev server (Claude Code: `preview_*`; otherwise `npm run dev` + a browser). A human can perform any phase by following these rules directly.

## 1. Quality references (in order of authority)

For BUILDING new pages (not for judging UAT):
1. `CLAUDE.md` / `AGENTS.md` — component inventory, page / table / form patterns, conventions.
2. `src/design-tokens/tokens.json` (+ `src/design-tokens/generated/`) — the only color/spacing/radius authority; never hardcode hex/px.
3. The `Mp*` components in `src/components/` — compose, don't invent.
4. Existing sibling views in the target `src/views/<Module>/` — copy their structure, store usage, and layout.
5. `.cursorrules` — the page-view pattern and the do/don't styling list.

For AUDITING UAT: the live product is the reference for WHAT features exist — never for how they should look. Capture intent (what the page does), not pixels.

## 2. Crawl rules (Part A)

- One module per crawl pass. Stop at the module boundary.
- For each nav item: record the human title, the path (after the base URL — no host, no query credentials), and the page type (`page` / `wizard` / `detail` / `tab`).
- Open the primary CTAs one level deep only: Create / Edit / Add buttons → capture the wizard or drawer they open (record as a `wizard` row). Do not recurse further.
- Detail views: open one representative row's detail page; record as a `detail` row. Don't enumerate every record.
- Settings / tabbed pages: record each distinct sub-tab as a `tab` row.
- Sensitive settings cards (API Keys, JSON Web Token, SFTP access/import/export, and similar credential-bearing pages) must not be opened unless the session is explicitly scoped for them and redaction rules are stated first.
- Screenshot each distinct page to `maropost-screenshots/uat/<module>/<slug>.png`; reference by path in the row.
- Write findings into Part A immediately (crash-safe). Set the module's marker to `[crawl-status: crawled]` at the end.
- NEVER paste page HTML, DOM dumps, or transcripts into the tracker — titles, paths, types, screenshot paths only.
- Preserve recurring UAT shell console noise in the tracker as audit context only; do not treat it as a prototype regression.

## 3. Gap rules (Part B)

- Input: Part A + the route names/paths in `src/router/index.ts` only. Do NOT open UAT during gap analysis.
- Match by FEATURE INTENT, not URL string — prototype paths differ from legacy UAT paths (e.g. UAT contact lists ≈ prototype `ContactLists` at `/accounts/:accountId/lists`).
- Verdict:
  - `exists` — the feature is represented in the prototype, even if the UX differs. FROZEN: never redesign it.
  - `partial` — the feature exists but a whole sub-flow, detail page, or sub-tab is absent (e.g. list exists, detail missing).
  - `missing` — no representation at all.
- Note shared views: one prototype view can serve several routes (e.g. `Coupons.vue` → coupons / promotions / gift-card routes). A UAT feature already covered by a shared view is `exists`.
- For ambiguous matches, use an Explore subagent to confirm intent from the view file — it returns a one-line verdict, not the file.
- Record the matched prototype route name (or `—`) and a short note. Leave Build status `pending` for missing/partial; `exists` rows need no build.

## 4. Build rules (additive only)

- New view file in the matching `src/views/<Module>/` (PascalCase, `<script setup lang="ts">`, scoped styles).
- New route appended to `src/router/index.ts` in the correct module block; reuse the `/accounts/:accountId/...` pattern, or the gated `/commerce/:accountId/...` pattern with `meta: commerceGate` as the sibling routes do.
- New nav entry added to `buildNavGroups()` in `src/components/layout/AppSidebar.vue`, in the matching group / sub-group.
- Extend the matching Pinia store in `src/stores/` with typed mock data, following existing seeded patterns; add a new store only if no module store fits.
- Follow CLAUDE.md patterns: `MpPageHeader` (+ breadcrumbs), `MpDataTableToolbar` + `v-data-table`, `MpStatusChip` for status, `MpEmptyState` for empty, `MpFilterTabs`, `MpFloatingBulkBar`, `MpFormDrawer` for forms (never `v-dialog`).
- New pages MAY be freely redesigned (modern, clean UX — not a legacy clone) but MUST reuse `Mp*` components and design tokens.
- NEVER edit an existing view's template or styles. The ONLY permitted touch to existing files is adding a route record (`router/index.ts`), a nav item (`AppSidebar.vue`), or an additive store field — each targeting a new page.
- Co-locate a `.stories.ts` only if the page introduces a new reusable `Mp*` component (per `.cursorrules`). Page views themselves don't require stories.

## 5. Token-efficiency contract (the "no leakage" rules)

1. One phase-slice per session; end at the gate — don't roll into the next module.
2. The tracker is the only memory between sessions. Every fact learned gets written to it before the session ends.
3. Screenshots are saved to disk and referenced by path; never re-read them into context unless actively building that specific page.
4. Crawling and diffing are delegated to subagents that return compact structured tables, not transcripts.
5. Prompts reference file paths (`read docs/uat-parity/parity-tracker.md`) instead of inlining content.
6. The UAT URL lives only in the tracker Defaults block; session cookies / credentials / tokens are never written anywhere.
7. Never run browser commands that list/export cookies, local storage, session storage, storage state, or request bodies during a crawl.

## 6. Definition of done (per built page)

- Route resolves in the prototype preview — no 404, no blank screen.
- Typed mock data lives in a Pinia store (no inline literals in the view where a store fits).
- Empty state present (`MpEmptyState`) for any list/table.
- `npm run type-check` passes.
- Preview screenshot captured and visually verified at 1280 wide (spot-check 375).
- One commit per page: `[feat]: add <Page> (UAT parity — <module>)`.
- The Part B row is updated on disk (Build status → `done`, commit hash, one-line note).

## 7. Failure branches & phase gates

Failure branches:

| Situation | Action |
|---|---|
| UAT page won't load / needs a permission the user lacks | mark the Part A row `blocked` + note; move on |
| Ambiguous exists/missing call | Explore subagent for intent; if still unclear, mark `partial` + note and let the human decide at the prioritize gate |
| Type-check fails after a new page | fix forward; if the failure predates the change (confirm via `git stash` + rerun), note it and proceed |
| A build change would require editing an existing view's template/styles | STOP — out of contract; note it in the Part B row and mark `skipped` |
| A page broke by my edit | `git checkout -- <files>`; one retry with a smaller change; second failure → commit nothing, `skipped` + note |

Phase gates (hard stops for human review):

- After Prompt 0 — module list confirmed by the user.
- After each Prompt 1 — module `crawled`; STOP.
- After Prompt 2 — gap matrix reviewed by the user.
- After Prompt 3 — build order approved.
- After each Prompt 4 — module built + committed per page; STOP for review.
- After Prompt 5 — parity report appended; done.
