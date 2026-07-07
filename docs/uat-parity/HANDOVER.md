# UAT Parity — Handover

> Single entry point for a Claude session picking up the UAT feature-parity effort mid-flight. Read this first, then the playbook, then the tracker.

## Mission

Audit the live Maropost UAT product and additively close feature gaps in the Vue prototype. Inventory every UAT page/flow (Part A of the tracker), diff it against the prototype's ~90 views (Part B), then build everything missing or partial — WITHOUT removing or redesigning existing prototype pages. New pages follow the prototype's design system (modern UX), not the legacy UAT UX. This is a mock-data playground — no backend.

## Read order

1. **This file** — where the effort stands and what to do next.
2. `docs/uat-parity/parity-playbook.md` — the method (crawl / gap / build rules, token contract, Definition of Done).
3. `docs/uat-parity/parity-tracker.md` — the state (Part A inventory, Part B gap matrix, Progress log). The ONLY memory between sessions.
4. `docs/uat-parity/phase-prompts.md` — per-phase copy-paste prompts (0–5).

Convenience skill: `/uat-parity crawl` and `/uat-parity build` (`.claude/skills/uat-parity/SKILL.md`).

## You are here (2026-07-07)

- **Phase 0 (setup) — DONE.** UAT base URL filled in the tracker Defaults; 11 modules (A01–A11) seeded.
- **Phase 1 (crawl) — ~80%.** Crawled: A01 Dashboard, A02 Analytics, A03 CDP, A04 Products, A05 Marketing (deep — 33 rows + flow digest), A06 Commerce, A08 Service, A09 Da Vinci, A10 Apps. Still `[crawl-status: pending]`: **A07 Retail** and **A11 Settings** (API Keys / JWT / SFTP rows `blocked` for redaction; Journey Reports `blocked` by a UAT 500). A 2026-07-07 crawl attempt was blocked — live UAT redirected to Maropost Identity (logged out); needs a logged-in Chrome tab to finish.
- **Phase 2 (Part B gap matrix) — DONE (2026-07-07).** All 112 Part A rows matched to `src/router/index.ts` by feature intent and adversarially verified: **79 exists / 13 partial / 20 missing**; 9 verdicts corrected by the adversarial pass (⚑ in the tracker); built Marketing rows back-filled as `done`. A07 (1) + A11 (35) verdicts are PROVISIONAL — matched from titles only, re-confirm after the logged-in crawl. Build queue = 31 pending partial/missing rows.
- **Phase 3 (prioritize) — NOT STARTED. ← next slice.** Order the 31-row build queue by value; stop for user approval.
- **Phase 4 (build) — PARTIAL and out of sequence.** Marketing journeys, data journeys, and the email-campaign create flow are already built (commit hashes are in the tracker Progress log + Part B `done` rows). Note: `JourneyBuilder.vue` and the Journeys CTA were intentionally redesigned per explicit user instruction — an exception to additive-only, not a precedent. Build-phase style directive (2026-07-07): new pages clean/modern, shadcn-like flat cards + Material-style form fields, built with existing Vuetify + `Mp*` + tokens (no new UI dependency).
- **Phase 5 (sweep) — not started.**

## Remaining roadmap

Do ONE slice per session; stop at the gate.

1. **Finish the crawl** (Phase 1) — only the two pending modules:
   - **A07 Retail**: `/preview/retail` needs a deeper logged-in pass to enumerate sub-pages.
   - **A11 Settings**: walk the card groups (Connections, DNS Setup, Contacts, Campaigns, Store Setup, Others, Service, Channels). Keep API Keys / JSON Web Token / SFTP Access / SFTP Import-Export `blocked` unless a redacted pass is explicitly scoped.
   - URL-only rows are fine per the established convention; screenshot only complex flows to the gitignored `maropost-screenshots/uat/`.
2. **Build Part B** (Phase 2) — for every Part A row, add a gap row matched to `src/router/index.ts` by FEATURE INTENT (not URL string): exists / partial / missing. Back-fill the already-built Marketing rows as `done` with their commit hashes so the matrix reflects reality. Use an Explore subagent for ambiguous matches. Stop for user review.
3. **Prioritize** (Phase 3) — order the missing/partial queue by value; stop for user approval.
4. **Build** (Phase 4) — module by module, additive-only, one commit per page, module gate for review.
5. **Sweep** (Phase 5) — click every Part B row in preview, confirm no 404s, append a parity report to the tracker.

## Guardrails and decisions

- **Additive-only (default):** never edit an existing view's template/styles. The only permitted touches to existing files are appending a route in `src/router/index.ts`, a nav item in `buildNavGroups()` in `src/components/layout/AppSidebar.vue`, and additive store fields in `src/stores/`. `exists` rows in Part B are FROZEN.
- **Redesign exception:** the Marketing journey redesign happened by explicit user direction. Any further existing-page redesign requires a fresh explicit instruction — do not infer it.
- **Sensitive Settings:** API Keys, JSON Web Token, SFTP Access, and SFTP Import/Export stay `blocked` unless the user scopes a redacted pass.
- **Token-efficiency contract (playbook section 5):** one slice per session; the tracker is the only cross-session memory (write every fact before ending); screenshots referenced by path, never re-read into context unless building that page; delegate wide crawls/diffs to subagents that return compact tables, not transcripts; reference files by path; the UAT URL lives only in the tracker Defaults; never write cookies / credentials / tokens anywhere.
- **Access:** live UAT may redirect to Maropost Identity — crawl phases need a logged-in Chrome tab (claude-in-chrome). Build/verify use the local dev server (`npm run dev` → `http://localhost:5173`; Claude Code: `preview_start` "Main App").

## Definition of done (per built page) — playbook section 6

Route resolves (no 404) · typed mock data in a Pinia store · empty state (`MpEmptyState`) · `npm run type-check` passes · preview screenshot verified · one commit `[feat]: add <Page> (UAT parity — <module>)` · Part B row updated on disk.

## Kickoff prompt (paste into a fresh Claude session)

```
Read docs/uat-parity/HANDOVER.md, then docs/uat-parity/parity-playbook.md and docs/uat-parity/parity-tracker.md.
You are continuing an in-progress effort. Do the NEXT pending slice only, then STOP at the gate:
- If A07 Retail or A11 Settings is still [crawl-status: pending], finish that crawl (keep sensitive Settings cards blocked/redacted).
- Else if Part B is empty, build the gap matrix: match every Part A row to src/router/index.ts by feature intent (exists/partial/missing), and back-fill already-built Marketing rows as done with their commit hashes.
- Else build the next approved module additively (one commit per page) per playbook sections 4 and 6.
Guardrails: additive-only (never redesign existing pages unless I explicitly say so); the tracker is the only memory; never write UAT credentials/cookies anywhere. STOP at the slice boundary for review.
```

## Open risks / notes

- Part B is empty while some building already happened — the matrix must be reconciled with reality (back-fill the built rows) before it can be trusted as a build queue.
- Journey Reports (A02 / A05) is `blocked` by a UAT 500 — leave it until UAT recovers.
- Screenshots were not captured during the Marketing crawl (URL-only rows); `maropost-screenshots/uat/` is gitignored, so any captures stay local.
- Prototype route/nav specifics live in `src/router/index.ts` and `src/components/layout/AppSidebar.vue`; component and pattern rules are in `CLAUDE.md` / `AGENTS.md` and `.cursorrules`.
