# Engineering Handoff (P5 — program close)

<!-- Artifact of the Docs & Handoff agent (design-system program, Phase 5). -->

## Running it

- `npm run storybook` — dev Storybook on :6006 (Vuetify + Pinia + Router pre-registered,
  light/dark toolbar, axe a11y panel via `@storybook/addon-a11y`).
- `npm run build-storybook` — static build to `dist-storybook/` (CI gate together with
  `npm run type-check`).
- App preview for smokes: `npm run dev`, account `2000290` has seeded data.
- Tokens: edit `src/design-tokens/tokens.json`, then `npm run tokens:build` (or `tokens:watch`).

## Where things live

| Artifact | Purpose |
|---|---|
| `docs/design-system/program-prompt.md` | Program charter: scope, safety rails, state matrices, a11y baseline |
| `docs/design-system/library-tracker.md` | State file — component table, phase checklist, progress log |
| `docs/design-system/audit.md` | P1 token/theme audit (drift, hardcoded values, config gaps) |
| `docs/design-system/inventory.md` | P1 component inventory (props/emits/slots, consumers, store coupling) |
| `docs/design-system/cleanup-report.md` | P2 verdicts: 5 extractions, 10 deletions with grep proof, 2 keeps |
| `docs/design-system/a11y-checklist.md` | P4 fixes (13 commits), baseline status, **deferred backlog** |
| `docs/design-system/storybook-structure.md` | Sidebar taxonomy, counts, tiering, story conventions |
| `docs/design-system/vuetify-mapping.md` | Mp* → Vuetify map, inherited defaults, "never use raw X" list |
| `docs/design-system/token-sync-plan.md` | Remaining token work, priority-ordered |

Library state: **65 components, 0 story gaps** (64 component story files; JourneyAddStepMenu is
an internal helper, n/a) + 5 tokens-driven Foundations pages. CLAUDE.md carries the quick
component table; Storybook autodocs are the full reference.

## Definition of done — new or changed component

1. **Tokens only** — no hardcoded color/spacing/radius/font-size; lucide kebab icons, no `mdi-*`.
2. **Story** co-located, CSF3 + autodocs, titled per storybook-structure.md; covers the state
   matrix for its component type; controls wired (P0 additionally: full docs block + argTypes
   descriptions + A11y section).
3. **A11y baseline** — visible focus ring, aria-label on icon-only controls, contrast via theme
   tokens, Escape-close for overlays, headings/labels associated; check the axe panel.
4. **Gates** — `npm run type-check` + `npm run build-storybook` green; preview smoke of one
   consuming view for extractions/renames (chase all usages — 80+ views consume this library).
5. One commit per component/concern, `[type]: description` format.

A11y backlog (owner: next a11y slice): see the *Deferred / backlog* table in a11y-checklist.md —
MpEmptyState live-region guidance, voice components reduced-motion, P1 axe sweep, cloud-tint
contrast audit.

## Commit trail (P0–P5, `8437dc6..HEAD`, 43 commits)

| Phase | Commits | What landed |
|---|---|---|
| P0 scaffold | `8437dc6` | Program prompt + tracker |
| P1 recon | `5c04166` | audit.md + inventory.md (69 comps, 31 stories, 38 gaps) |
| P2 cleanup | `d230167`…`cf57ffd` (16) + `ffe9fec` | 5 extractions (MpOptionCard, MpStatusToggle, MpWizardSteps, MpConfirmDialog, MpRowActionsMenu) + JourneyAddStepMenu dedup; 10 unused deleted with proof; report |
| P3 stories | `4eca456`, `bc0fb09`, `7cfcee5`, `9d7e802`, `5e11497` | Batches A–D2: dashboards, copilot+voice, settings/marketing/merch, P0 doc upgrades ×2 → 0 gaps |
| P4 a11y | `46a4f6d`…`9e9a06e` (13) + `5cfa0ac`, `24dcd22` | Keyboard/aria/labelling fixes, addon-a11y, checklist |
| P5 docs | `b9b66a8` + this commit + CLAUDE.md refresh + tracker close-out | Tokens-driven foundations, four handoff artifacts, CLAUDE.md table, tracker closed |
