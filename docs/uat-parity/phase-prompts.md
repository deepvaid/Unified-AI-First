# UAT Parity — Phase Prompts

Copy-paste one prompt into a **fresh session**. Each is self-contained: it names the tools, the state file, the rules doc, and its STOP condition — so no other context is needed. Run them in order; repeat Prompt 1 and Prompt 4 once per module.

Prerequisite: the user has filled `<UAT_URL>` in `docs/uat-parity/parity-tracker.md` Defaults and is logged into UAT in a controlled browser session (Chrome/claude-in-chrome, Playwright, or equivalent navigate / snapshot / screenshot tooling).

---

## Prompt 0 — Setup check + seed module list (run once)

```
Read docs/uat-parity/parity-playbook.md and docs/uat-parity/parity-tracker.md.

Setup checks:
1. Confirm the tracker exists and `<UAT_URL>` in Defaults is a real URL. If it is still `<UAT_URL>`, STOP and ask the user to fill it.
2. Confirm the controlled browser is connected and logged into UAT: navigate to the UAT base URL and screenshot to verify a logged-in state.

Seed Part A:
3. Crawl ONLY the top-level navigation of UAT (do not open pages). List every top-level nav module.
4. For each module, add an empty `## A<NN> — <Module>   [crawl-status: pending]` section to Part A, using the table format in the tracker's Part A header comment. If Part A is already seeded, reconcile it rather than duplicating sections.
5. Add a Progress log line noting the module list was seeded.

Guardrails: do not open module pages yet; do not paste HTML; never write the UAT URL / cookies / credentials anywhere except the existing Defaults block. Never list/export cookies, local storage, session storage, storage state, request bodies, credentials, or tokens.

STOP after Part A has one `pending` section per module. Ask the user to confirm the module list before any crawling.
```

---

## Prompt 1 — Crawl the next module (repeat per module)

```
Read docs/uat-parity/parity-playbook.md (section 2 Crawl rules + section 5 token rules) and docs/uat-parity/parity-tracker.md.

Work the FIRST Part A section whose marker is `[crawl-status: pending]`. Using the controlled browser tools (navigate / snapshot / screenshot):
- Record every nav item in that module as a row: title, UAT path (no host/creds), type (page/wizard/detail/tab).
- Open primary CTAs (Create/Edit/Add) ONE level deep to capture wizards/drawers.
- Open one representative detail view; record each settings sub-tab as a `tab` row.
- Do not open sensitive settings cards such as API Keys, JSON Web Token, SFTP Access, or SFTP Import and Export unless this session is explicitly scoped for them with redaction rules.
- Screenshot each distinct page to maropost-screenshots/uat/<module>/<slug>.png and reference the path in the row.
- Write rows into Part A as you go; set the section to `[crawl-status: crawled]` when done.

Guardrails: ONE module only. Never paste page HTML/transcripts into the tracker. Never write the UAT URL/cookies/credentials anywhere except the existing Defaults block. Never list/export cookies, local storage, session storage, storage state, request bodies, credentials, or tokens. Delegate wide crawls to a subagent that returns a compact row table, not a transcript.

STOP at the module boundary. Do not start the next module.
```

---

## Prompt 2 — Gap analysis (run once, after all modules crawled)

```
Read docs/uat-parity/parity-playbook.md (section 3 Gap rules) and docs/uat-parity/parity-tracker.md Part A. Also read the route names/paths in src/router/index.ts. Do NOT open UAT.

For every Part A row, add a Part B row:
- Match by FEATURE INTENT, not URL string.
- Verdict: exists (represented, even if UX differs — frozen, never redesign) | partial (a sub-flow/detail/tab is missing) | missing.
- A UAT feature already covered by a shared prototype view (one view, several routes) counts as exists.
- Record the matched prototype route name (or —) and a short note.
- For ambiguous matches, launch an Explore subagent to confirm intent from the view file; it returns a one-line verdict, not the file.
- Set Build status `pending` for missing/partial; leave exists rows without a build.

Guardrails: additive audit only — change nothing in src/. Reference files by path, don't inline them.

STOP after Part B is complete. Ask the user to review the gap matrix.
```

---

## Prompt 3 — Prioritize the build queue (run once, human-in-loop)

```
Read docs/uat-parity/parity-tracker.md Part B.

Propose a build order for the modules that contain missing/partial rows — highest user value / most-referenced flows first, and group gated-commerce modules together. Output a short ordered list of modules with a one-line rationale each. Do not edit code.

STOP and ask the user to approve or reorder before any building.
```

---

## Prompt 4 — Build the next module (repeat per module)

```
Read docs/uat-parity/parity-playbook.md (section 4 Build rules + section 6 Definition of done) and docs/uat-parity/parity-tracker.md Part B.

`git status` must be clean — stop if not. Start the dev server (preview_start "Main App", or npm run dev).

Build every `pending` missing/partial row for the NEXT module in the approved order:
- New view in src/views/<Module>/, new route appended in src/router/index.ts, new nav item in buildNavGroups() in AppSidebar.vue, typed mock data added to the matching store in src/stores/.
- Reuse Mp* components + design tokens. New pages may be redesigned (modern UX) but must use the design system.
- NEVER edit an existing view's template/styles — only additive route/nav/store touches to existing files.
- Per page: verify the route resolves with no 404, include an MpEmptyState, run npm run type-check, screenshot in preview, commit `[feat]: add <Page> (UAT parity — <module>)`, and update the Part B row on disk (status/commit/note).

Guardrails: additive only; one commit per page; do not redesign existing pages; reference files by path.

STOP at the module boundary for human review. Do not start the next module.
```

---

## Prompt 5 — Final parity sweep (run once)

```
Read docs/uat-parity/parity-tracker.md Part B. Start the dev server.

Click through every Part B row in the prototype preview (exists rows + newly built pages). Confirm: no 404s, every nav entry resolves, each built page renders with data + an empty state.

Append a short "Parity report" section to the bottom of the tracker: counts of exists / built / skipped, any remaining blocked rows, and a one-line overall status.

Guardrails: verification only — no redesigns; fix only 404s / broken routes you introduced (one commit if needed).

STOP. The parity effort is complete.
```
