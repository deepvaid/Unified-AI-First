# Accessibility Checklist (2026-07-06)

<!-- Artifact of the A11y QA agent (design-system program, Phase 4). Fixes verified via
     type-check + build-storybook; MpOptionCard keyboard path verified live in the wizard. -->

## Baseline (from program-prompt.md)

Visible focus ring · aria-labels on icon-only controls · contrast via theme tokens ·
Escape-close for overlays · headings/labels programmatically associated.

## Fixes landed (P0 components, one commit each)

| Component | Fix | Commit |
|-----------|-----|--------|
| MpOptionCard | Keyboard-operable selection card: role="button", tabindex="0", Enter/Space → click, :focus-visible ring, valid aria-pressed; @click/@dblclick usage in the 3 wizards preserved (verified live) | `46a4f6d` |
| MpSectionHeader / MpEmptyState / MpErrorState / ModuleLandingPage | Heading semantics for div-based titles (least-invasive role/aria-level approach, visuals unchanged) | `9a2a889` |
| MpFilterTabs | aria-controls wiring via `controlsId` prop | `115d39b` |
| MpStatusToggle | Status label programmatically associated with the switch | `7dfaef8` |
| MpSourceCloudChip | role="img" so the aria-label is announced | `92c284d` |
| MpFloatingBulkBar | Status region semantics (selection count announced) | `6a92bfd` |
| MpConfirmDialog / MpMoveToFolderDialog / MpManageFoldersDrawer | Dialog labelling (aria-labelledby/described) | `b6ae38f` |
| MpFormDrawer | Focus trap skips hidden elements | `d43f831` |
| MpFolderSelect | Activator announces current selection | `6b63a7a` |
| MpWizardSteps | Completed steps announced | `daf1768` |
| MpDataTableToolbar | Badge counts included in button accessible names | `9414087` |
| AppSidebar | Named nav landmark | `96f6668` |
| DvHistoryDrawer | Labelled search input + `window.confirm` replaced with MpConfirmDialog (design-system dogfooding) | `9e9a06e` |

## Tooling

`@storybook/addon-a11y@^9.1.20` installed and registered in `.storybook/main.ts`
(`5cfa0ac`) — per-story axe panel now available in dev Storybook; `build-storybook` +
`type-check` verified green with the addon active.

## Baseline status — P0 set

All P0 components (top-level Mp* + layout) now meet the baseline for: focus-visible on
interactive elements, aria on icon-only controls, tokens-only contrast, Escape-close on
overlays (Vuetify-provided), and associated headings/labels — except the deferred items
below. Per-component detail lives in each story's **A11y** docs section
(Provides / Consumer must / Gaps).

## Deferred / backlog

| Item | Tier | Reason |
|------|------|--------|
| MpEmptyState live region (aria-live on async result states) | P0 | Correct usage is context-dependent — announcing every empty state is noisy; consumers should add `aria-live` at the results-container level. Documented in the story's A11y section. |
| MpStatusToggle disabled Draft switch unfocusable | P0 | Vuetify disabled semantics; a focusable-disabled pattern would fight the framework. The visible "Draft" text conveys state. |
| Voice components (DvOrbit*) reduced-motion support | P1 | Animation-heavy surfaces need a `prefers-reduced-motion` pass — scoped for a future slice. |
| P1 feature components (copilot cards, dashboards, settings) full audit | P1 | Story A11y notes exist where written; a systematic axe sweep via the new addon is the follow-up. |
| Contrast audit of `--cloud-*` source colors | P1 | Decorative chip tints; verify AA when used behind text. |

## How to re-audit

1. `npm run storybook` → a11y panel (axe) per story — check violations tab.
2. Keyboard walk: Tab/Enter/Space/Escape through each interactive story.
3. `npm run build-storybook` as the CI gate.
