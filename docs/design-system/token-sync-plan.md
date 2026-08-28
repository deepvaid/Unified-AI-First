# Token Sync Plan (P5)

> **Superseded in part, 2026-08-28.** Phase 1 of `DESIGN_AUDIT.md` closed §1 (the three drifting
> values — now `component.control.height`, `component.button.paddingInline`, `shadow.buttonInset`)
> and settled the §3 scale question (13px stop added; no fractional sizes; 14px body). Token names
> below are pre-Phase-1 — `spacing.6` is now `space.24`, `borderRadius.md` is `radius.12`,
> `typography.fontSize.*` is `fontSize.*`. §2 (scrollbar dark mode) and the §3 per-component
> migration are still open and belong to Phases 2–4.

<!-- Artifact of the Docs & Handoff agent (design-system program, Phase 5). -->
<!-- Source: audit.md (P1); offender counts re-measured at P5 close. -->

Pipeline (healthy): `tokens.json` → `build.mjs` → `generated/{tokens.ts, variables.css,
_variables.scss}` → `vuetify.ts` / `maropostTheme.ts` / `global.scss`. Rebuild with
`npm run tokens:build`. Everything below is *remaining* work, in priority order.

## 1. Drift — 3 values live outside tokens.json

| Where | Value | Fix |
|---|---|---|
| `src/plugins/maropostTheme.ts` (VBtn style) | `min-height: 40px` | Add `component.button.sizing.minHeight` to tokens.json; interpolate the generated const |
| `src/plugins/maropostTheme.ts` (VBtn style) | `padding-inline: 14px` | Add `component.button.sizing.paddingInline`; same treatment |
| `src/styles/global.scss:143` | `rgba(255, 255, 255, 0.16)` inset button shadow | Codify as a `shadow.buttonInset` token with light/dark variants (light-only today — breaks on dark surfaces) |

One commit: add tokens → `npm run tokens:build` → replace literals → visual diff of buttons in
Storybook light+dark.

## 2. Scrollbar dark-mode fix (highest-impact bug)

`global.scss` webkit scrollbar thumb uses raw `rgba(0, 0, 0, 0.15)` — near-invisible in dark
mode and risky in overlays. Fix: theme-scoped CSS variable (e.g. `--mp-scrollbar-thumb`) defined
per theme from neutral tokens; test in dark-mode drawers (MpFormDrawer long-content story).

## 3. Font-size literal migration — 29 components (was 33 at P1; 2 offenders deleted in P2)

Rule: components must use `typography.fontSize.*` / semantic styles — never `font-size: Npx`.
Off-scale values in use (10.5, 13, 13.5, 14.5, 15px) need a decision first: **round to existing
stops** (preferred) or add stops. Note `semantic.body` (13.5px) and `semantic.sectionTitle`
(14.5px) already exist as tokens — many literals can map straight onto semantic styles.

Priority order (px literals per file, re-measured 2026-07-06 — worst first):

1. `layout/AppBar.vue` (27) 2. `dashboards/widgets/DashboardKpiWidget.vue` (14)
3. `ModuleLandingPage.vue` (14) 4. `copilot/DvDraftPreview.vue` (13)
5. `MpDaVinciBot.vue` (8) 6. `copilot/DvHistoryDrawer.vue` (8)
7. `copilot/voice/DvOrbitVoiceSurface.vue` (8) 8. `layout/AppSidebar.vue` (8)
9. `dashboards/DashboardWidgetCard.vue` (7) 10. `dashboards/widgets/DashboardTableWidget.vue` (6)
…then the remaining 19 files (≤5 each; `grep -rl 'font-size:.*px' src/components --include='*.vue'`).

Batch by directory (one commit per batch), verify with the component's Storybook stories —
the P0 batches (AppBar, ModuleLandingPage, MpDaVinciBot, AppSidebar) first.

## 4. Deprecate `src/styles/tokens.scss`

Legacy SCSS vars, injected globally via `additionalData` in **both** `vite.config.ts` and
`.storybook/main.ts`; its shadow values conflict with tokens.json. Steps:

1. Inventory actual `$mp-*` usages in `.vue`/`.scss` (it's mixin-scope only per the audit).
2. Point both `additionalData` lines at `src/design-tokens/generated/_variables.scss`.
3. Migrate any stragglers to generated vars; delete `tokens.scss`.
4. Gates: type-check, `npm run build`, `build-storybook`, visual skim of one page per module.

## 5. Hex literals in components (~27 across 10 files, informational)

Mostly SVG gradients and copilot voice flourishes (DvOrbitMicBar, DvOrbitStatusPill). Not
blocking; fold into the voice components' reduced-motion pass (a11y backlog) — decide per case
between chart/aiAccent tokens and documented intentional one-offs.

## 6. Figma sync — future work (out of program scope)

`tokens.json` is the single source of truth; there is **no** automated Figma sync today
(`docs/figma-integration.md` describes the manual flow). Proposed ownership: design-systems
maintainer exports via a Tokens-Studio-compatible transform of `tokens.json` (build.mjs already
emits flat key/value pairs); review cadence = whenever tokens.json changes. Until then, treat
Figma values as downstream copies — never edit tokens to match Figma without a design review.
