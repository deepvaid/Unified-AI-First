# 03 — Accessibility audit (static)

**Scope:** component semantics, keyboard behaviour, and light-mode edge contrast — the areas the dark-mode program (`docs/dark-mode/06-independent-audit.md`, `07-final-verification.md`) did not cover. That program is closed out (all Blocker/High/Medium resolved; open lows are AUD-L01..L05, tracked there, not repeated here).

**Method:** static code review + token/CSS math (WCAG relative-luminance contrast formula, computed by hand from `src/design-tokens/tokens.json` and generated CSS/Vuetify defaults). No browser was driven for this audit — another agent owns live verification. Anything whose real answer depends on rendered DOM/AT behaviour is in the **Needs live validation** table at the end, not asserted as a finding.

**Read-only:** no source files were modified to produce this report.

---

## What already passes (not re-reported as findings)

| Area | Evidence | Verdict |
|---|---|---|
| MpFormDrawer focus trap/restore/Escape | `src/components/MpFormDrawer.vue:27-65` — custom Tab-cycle trap, `lastFocused` restore, Escape → `requestClose()`, `role="dialog"` + `aria-modal` + `aria-labelledby` | Pass |
| DvHistoryDrawer (custom panel, not `v-navigation-drawer`) | `src/components/copilot/DvHistoryDrawer.vue:46-89` — same trap/restore/Escape pattern, correctly scoped off in `rail` mode (`aria-hidden` binding at :122) | Pass |
| MpConfirmDialog / MpMoveToFolderDialog / DashboardFormDialog / DvExpandDialog focus trap | All are `v-dialog`; Vuetify's `VOverlay` wires `useFocusTrap` (`node_modules/vuetify/lib/components/VOverlay/VOverlay.js:12`) and `role="dialog"`/`aria-modal="true"` (`VDialog.js:84,91`) for free | Pass (trap/restore); see A11Y-005 for a labelling gap |
| MpRowActionsMenu | `src/components/MpRowActionsMenu.vue:2-23` — required `ariaLabel` prop on the trigger | Pass |
| MpWizardSteps | `src/components/MpWizardSteps.vue:26-38` — `role="list"`/`listitem`, `aria-current="step"`, sr-only "(completed)" | Pass |
| MpOptionCard | `src/components/MpOptionCard.vue:20-33` — `role="button"`, `tabindex="0"`, `aria-pressed`, Enter/Space re-dispatch click | Pass |
| MpFilterTabs / table sort headers | `v-tabs`/`v-tab` and `v-data-table` `sortable` columns use Vuetify's built-in `aria-selected`/`aria-sort` — no custom override found | Pass |
| MpStatusChip | `src/components/MpStatusChip.vue:149-153` — status is always a visible text label, color is supplementary, not sole means (1.4.1) | Pass |
| AppBar universal search ("⌘K") combobox | `src/components/layout/AppBar.vue:302-333,350-417` — `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`/`option`/`aria-selected`, Arrow/Enter/Escape handlers | Pass (implementation matches ARIA APG combobox pattern) |
| AppBar "Quick create" menu | `:453` region — `aria-haspopup="menu"`, `aria-expanded` on trigger | Pass |
| AppSidebar rail-mode flyouts | `src/components/layout/AppSidebar.vue:761-777` — `v-menu open-on-hover`; Vuetify's `useActivator` composable defaults `openOnFocus` to `true` whenever `openOnHover` is set and `openOnFocus` isn't explicitly overridden (`node_modules/vuetify/lib/components/VOverlay/useActivator.js:36`) — no override present, so focus also opens the flyout | Pass (see live-validation note — reasoned from source defaults, not rendered) |
| AppSidebar expanded-mode flyout | `:496-516` `onParentClick` — click-triggered (not hover-only), keyboard-operable via the underlying `v-list-item` | Pass |
| Reduced motion | `src/styles/global.scss:723-736` — a universal `@media (prefers-reduced-motion: reduce)` rule zeroes `animation-duration`/`transition-duration`/`scroll-behavior` on `*`; loaded through the shared manifest (`src/styles/app-styles.ts:9`) so it reaches the whole app + Storybook. Orbit voice components (`DvOrbCanvas.vue`, `DvOrbitOrb.vue`, etc.) additionally guard their rAF-driven canvas work with their own `prefers-reduced-motion` checks, and `JourneyFlowColumn.vue` does the same | Pass |
| Snackbars (`v-snackbar`) | Vuetify sets `role="status"` + `aria-live="polite"` on every `v-snackbar` by default (`node_modules/vuetify/lib/components/VSnackbar/VSnackbar.js:204-205`) — all 15 `v-snackbar` usages across Commerce/Settings views inherit this for free | Pass |

---

## Findings

### A11Y-001 — Outlined form fields fail non-text contrast at rest (light mode)

| Field | Detail |
|---|---|
| **Severity** | High |
| **Evidence** | Vuetify default: `node_modules/vuetify/lib/components/VField/VField.css:354-356` → `.v-field__outline { --v-field-border-opacity: 0.38; }` (resting state). No project override exists — `src/plugins/vuetify.ts` has no `border-opacity`/theme-variable override; `src/styles/global.scss:271-280` only touches `.v-btn--variant-outlined` and adds a transition to `.v-field`, not its border opacity. Token: `color.light.textPrimary = #1a1814` (used as Vuetify's `on-surface`) composited at 0.38 alpha over `surface #ffffff` → computed **2.40:1**; over `background #f4f6fa` → **2.37:1** (WCAG relative-luminance formula, hand-computed). |
| **Component** | Every `variant="outlined"` field app-wide (the documented default per `CLAUDE.md` "Form Pattern") — e.g. `MpManageFoldersDrawer.vue:88`, `MpMoveToFolderDialog.vue:104`, `DashboardFormDialog.vue:104`, all Settings pages, all Commerce create/edit forms. |
| **Expected** | WCAG 1.4.3 SC 1.4.11 Non-text Contrast — a UI component's visual boundary needs ≥3:1 contrast against adjacent color(s) when that boundary is the only way to perceive its extent (text inputs are the canonical example in the SC's own guidance). |
| **Actual** | Resting/unfocused outline computes ~2.4:1 against both card and canvas surfaces — below the 3:1 floor. Hover (`--v-high-emphasis-opacity`, ~0.87) and focus (`opacity: 1` + usually primary color) are compliant; only the default resting state fails. |
| **Required correction** | Raise the resting field-outline contrast via tokens/global CSS — e.g. bind `--v-field-border-opacity` (or the field's border color) to `--border-strong`/`--border-default` at a higher fixed alpha in `mp-theme-aliases.css`/`global.scss`, re-deriving so the composited color reaches ≥3:1 against both `#ffffff` and `#f4f6fa`. No new component required. |
| **Validation** | Recompute contrast of the resolved (computed-style) border color against `--surface-primary` and `--surface-canvas`; confirm ≥3:1 in the resting state. |
| **Resolution (2026-08-28, P5.5-12)** | **FIXED.** The 2026-08-27 entry recorded this as accepted risk: the compliant `color-mix(…)` override had been reverted platform-wide for a Flowbite-style restyle, leaving every outlined field's resting border at `--border-strong` (`#d4d4d4` light / `#4D535B` dark, ~1.4–1.5:1). That trade has now been reversed at the token level on the design owner's instruction. `color.light.outline` `#d4d4d4` → **`#8a8a8a`** and `color.dark.borderStrong` `#4D535B` → **`#7C848F`**, chosen as the *lightest* values clearing 3:1 on the backgrounds fields actually sit on — light: 3.45:1 on `surface`, 3.19:1 on `background`; dark: 4.22:1 on `surface`, 3.17:1 on `surfaceOverlay` (drawers and dialogs, the strictest real case, which the original finding did not measure). The mitigation argument in the old entry (focus/error render a 2px border) was rejected on review: 1.4.11 governs whether the field can be *found* at rest, and focus affordances only help once it already has been. Blast radius is small and was verified — `outline`/`borderStrong` drives only the outlined-field border, `.dv-composer__pill:hover` and the journey flow arrowhead; decorative card and divider edges use `outlineVariant` / `border` / `borderSubtle` and are untouched, so the "fewer borders" aesthetic bar is preserved. Now enforced by `npm run contrast:check` (tokens.json → `$contrastPairs`, level `controlBoundary`), so it cannot silently regress again. **A11Y-002 is unaffected and remains open** — see its own row. |

### A11Y-002 — MpDataTableToolbar search field pushes the same border to ~1.4:1

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | `src/components/MpDataTableToolbar.vue:257-259`: `.mp-toolbar-search :deep(.v-field:not(.v-field--focused) .v-field__outline) { --v-field-border-opacity: 0.16; }`. Computed: `#1a1814` at 0.16 alpha over `#ffffff` → **1.40:1**. This toolbar is the mandated pattern for every data-table page per `CLAUDE.md` (`Data Table Pattern`), so the search field appears on SalesOrders, DraftOrders, Fulfillments, Coupons, PurchasableGiftCards, etc. |
| **Component** | `MpDataTableToolbar` (shared component) |
| **Expected** | Same as A11Y-001 — ≥3:1 for an input's essential boundary. |
| **Actual** | ~1.40:1 — worse than the already-failing Vuetify default because the component deliberately lowers it further for a "ghost" look. |
| **Required correction** | Remove/soften this override once A11Y-001's base fix lands, or — if the ghost look is intentional — convey the field's boundary through a background-fill contrast instead of the border, so no boundary-contrast requirement is left unmet. |
| **Validation** | Contrast of resolved border vs. `--surface-primary` ≥3:1, or a verified alternate boundary cue. |
| **Resolution (2026-08-27)** | **Superseded — accepted risk, not corrected.** The implementation has since moved on twice: the `--v-field-border-opacity: 0.16` ghost outline cited above is gone, and the field now draws its own 1px border. That border was briefly raised to the A11Y-001 compliant `color-mix(…)` (~3.5:1), which left it visually mismatched against the Filter and column-toggle buttons sitting beside it in the same row — those are `.v-btn--variant-outlined`, pinned to `--mp-border-subtle` by `global.scss`. It is now pinned to the **same** `--mp-border-subtle` property (`#e2e8f0` light / `#33373D` dark, ~1.2:1 on white), so the toolbar row reads as one control family. **Consistency was chosen over the 3:1 floor deliberately.** Mitigations: the field keeps a compliant 2px focus ring plus an accent focus border, a `prepend-inner` search icon, and a persistent placeholder — so its boundary is not the only affordance. Revisiting this means darkening outlined *buttons* app-wide, not this field alone (see `docs/ui-improvement-roadmap.md` → "interactive border token"). A11Y-001 is **unaffected** and still governs every other outlined field. |
| **Status after P5.5-12 (2026-08-28)** | **Still open, and now the ONLY outlined-control family under the 3:1 floor.** A11Y-001 was fixed by raising `--border-strong`, but this field deliberately draws its own 1px `--mp-border-subtle` border (`MpDataTableToolbar.vue`) and hides Vuetify's outline, so it did not move — verified in Storybook: the toolbar search and the Filter / column-toggle buttons beside it both compute `#e2e8f0`. **The row therefore stays internally consistent**, which is what the original decision optimised for, and raising this one line alone would re-create the exact mismatch that caused the earlier revert. The real question is now the `.v-btn--variant-outlined` border in `global.scss:274`: an outlined button's border is its only affordance as a button, so 1.4.11 arguably applies to it too, and moving it would let this field follow. That is a deliberate app-wide visual change (every outlined button darkens) and is left as a design decision — it was NOT bundled into P5.5-12. See `docs/ui-improvement-roadmap.md` → "interactive border token". |

### A11Y-003 — `--text-secondary` (onSurfaceVariant) fails AA body-text contrast on 2 of 3 surface tiers

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | `tokens.json`: `color.light.onSurfaceVariant = #737373`; `color.light.surfaceVariant = #ececec` (described in-token as "table headers, hover tints"); `color.light.background = #f4f6fa`. Alias wiring: `src/styles/mp-theme-aliases.css` → `--text-secondary: var(--mp-color-light-onSurfaceVariant);`. Computed (WCAG formula): onSurfaceVariant on `surfaceVariant` = **4.01:1**; on `background` = **4.38:1**; on `surface` (#ffffff) = 4.74:1 (passes). |
| **Component** | Anything rendering normal-size text/labels in `--text-secondary` (or Vuetify's `on-surface-variant`/`text-medium-emphasis`-adjacent usages) over `surfaceVariant` or `background` — e.g. table header cells, hover-tinted rows, canvas-level captions. |
| **Expected** | WCAG 1.4.3 Contrast (Minimum) — normal text ≥4.5:1. |
| **Actual** | 4.01:1 and 4.38:1 — both fail; only the white-card case (4.74:1) passes. This is the light-mode counterpart of AUD-M01 from the dark audit (which only checked dark `textDisabled`) — the light `text-secondary` token was never re-derived per-surface. |
| **Required correction** | Darken `color.light.onSurfaceVariant` (e.g., toward `#5f5f5f`, which clears 4.5:1 on `#ececec`) and re-check all three tiers, or restrict `--text-secondary` to white-card contexts only and introduce/re-use a separate, darker token for table-header/canvas contexts. |
| **Validation** | Recompute contrast on all three surface tiers after retune; ≥4.5:1 wherever the token renders normal body/label text (large-scale or icon-only uses may accept the 3:1 UI floor instead). |

### A11Y-004 — Icon-only toolbar buttons without an accessible name

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | `src/components/copilot/DvChartCard.vue:29-31`: `<v-btn icon size="28" variant="text"><v-icon size="16">save</v-icon></v-btn>` (and `download`, `maximize-2`) — no `aria-label`, no visible text, no `v-tooltip` wrapper. |
| **Component** | `DvChartCard` (Da Vinci analysis-results chart preview) |
| **Expected** | WCAG 4.1.2 Name, Role, Value — every control needs a programmatic accessible name; the codebase's own pattern for icon-only buttons elsewhere (`MpRowActionsMenu`, `MpFormDrawer`'s close button, `MpDataTableToolbar`'s filter/column buttons, `DvExpandDialog`'s close button) always supplies `aria-label`. |
| **Actual** | These three buttons announce as unlabeled "button" to a screen reader; users can't distinguish Save from Download from Maximize without sight. |
| **Required correction** | Add `aria-label="Save"` / `"Download"` / `"Enlarge"` to the three buttons. |
| **Validation** | Accessible-name check (axe / VoiceOver) — each button announces a distinct, meaningful name. |

### A11Y-005 — DashboardFormDialog / DvExpandDialog: dialog has no accessible name

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | `src/components/dashboards/DashboardFormDialog.vue:88` — `<v-dialog v-model="model" max-width="560" persistent scrollable>`; title markup at `:90-99` (`v-card-title`) carries no `id`. `src/components/copilot/DvExpandDialog.vue:38` — `<v-dialog v-model="localOpen" ...>`; custom `<header>`/title `div` at `:43` (`dv-expand__title`) carries no `id` either. Neither `v-dialog` sets `aria-labelledby`. Compare the correct pattern already used by siblings: `MpConfirmDialog.vue:26-36` and `MpMoveToFolderDialog.vue:49,53,55` both generate a `useId()` title id and pass `:aria-labelledby="titleId"`. Confirmed Vuetify itself never fills this gap: `node_modules/vuetify/lib/components/VDialog/VDialog.js` sets `role="dialog"`/`aria-modal="true"` (lines 84, 91) but no `aria-label`/`aria-labelledby`. |
| **Component** | `DashboardFormDialog`, `DvExpandDialog` |
| **Expected** | ARIA APG Dialog (Modal) pattern / WCAG 4.1.2 — a dialog needs an accessible name, typically via `aria-labelledby` referencing its visible title. |
| **Actual** | Both dialogs are announced as unnamed dialogs; users must explore the whole dialog's content to learn what it's for. |
| **Required correction** | Add a `useId()` title id to each dialog's heading element and wire `:aria-labelledby` on the `v-dialog`, matching the existing `MpConfirmDialog`/`MpMoveToFolderDialog` pattern. |
| **Validation** | Accessible-name computation (axe) reports the visible title as the dialog's name. |

### A11Y-006 — MpMoveToFolderDialog: selected folder not exposed to assistive tech

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | `src/components/MpMoveToFolderDialog.vue:59-90` — `<v-list density="compact" ... aria-label="Choose a folder">` with each `v-list-item` bound `:active="selectedId === folder.id"`; the parent `v-list` has no `v-model:selected`/`select-strategy`. Vuetify source: `VList.js:303` sets the list's `role` to `"listbox"` **only** when the list is selectable, otherwise `"list"`; `VListItem.js:118-120,247-248` always emits an `aria-selected` value regardless of the parent's role. Per WAI-ARIA, `aria-selected` is only a valid state on `option`/`row`/`tab`/`gridcell`/`treeitem` roles — not on the default `listitem` role this list renders, so the attribute is emitted on an unsupported role. |
| **Component** | `MpMoveToFolderDialog` |
| **Expected** | WCAG 4.1.2 — the current selection state must be programmatically determinable by AT. |
| **Actual** | Visual selection (checkmark icon + `:active` background) has no reliably-announced AT equivalent, because `aria-selected` sits on an ARIA-invalid host role. |
| **Required correction** | Wire the parent `v-list` with a selection model (`v-model:selected` or `select-strategy="single-independent"`) so Vuetify emits `role="listbox"`/`role="option"`, making the already-present `aria-selected` valid. Pure prop wiring — no new component. |
| **Validation** | Inspect the rendered role chain (`listbox`/`option`); confirm a screen reader announces "selected" on the active row. |

### A11Y-007 — DvHistoryDrawer: active conversation not exposed to AT

| Field | Detail |
|---|---|
| **Severity** | Low |
| **Evidence** | `src/components/copilot/DvHistoryDrawer.vue:160-169` — custom `role="button"` rows with `:class="{ 'is-active': item.id === activeId }"`; no `aria-current`/`aria-selected` attribute anywhere on the row. |
| **Component** | `DvHistoryDrawer` (overlay and rail modes) |
| **Expected** | WCAG 4.1.2 / 1.3.1 — the active item in a set should be programmatically exposed, not conveyed by background/icon color alone. |
| **Actual** | `.is-active` is CSS-only (background tint + accent icon color); nothing in the DOM tells AT which conversation is current. |
| **Required correction** | Add `:aria-current="item.id === activeId ? 'true' : undefined"` to each row (valid on `role="button"` elements). |
| **Validation** | Screen reader announces "current" on the active row. |

### A11Y-008 — MpFloatingBulkBar's live region is mounted/unmounted, not persistent

| Field | Detail |
|---|---|
| **Severity** | Low |
| **Evidence** | `src/components/MpFloatingBulkBar.vue:9-13` — `<div v-if="count > 0" ... role="status" aria-label="Bulk actions">`. |
| **Component** | `MpFloatingBulkBar` |
| **Expected** | Per ARIA Authoring Practices, a live region (`role="status"`) reliably announces updates when it is already present in the DOM and its *content* changes — a region that is itself freshly inserted is not guaranteed the same treatment across browser/AT combinations. |
| **Actual** | The whole node — including the `role="status"` — is inserted fresh on the 0→1 selection transition, which risks the first announcement being silently dropped by some AT. |
| **Required correction** | Keep the wrapper element always mounted and toggle visibility (e.g. `v-show`, or move the `v-if` to inner content only) so the live-region container persists across selection-count transitions. |
| **Validation** | Needs live AT testing — see table below. |

### A11Y-009 — DvToastStack auto-dismiss has no pause/extend control

| Field | Detail |
|---|---|
| **Severity** | Low |
| **Evidence** | `src/composables/useDaVinciToasts.ts:21,53,57` — fixed `DEFAULT_DURATION = 4200`ms, `setTimeout(() => dismissToast(id), toast.durationMs)`, no pause-on-hover/focus, no extend affordance. `src/components/copilot/DvToastStack.vue:24-31` renders an actionable button inside the timed toast. |
| **Component** | `DvToastStack` / `useDaVinciToasts` |
| **Expected** | WCAG 2.2.1 Timing Adjustable — for non-essential timed content, users need a way to turn off, adjust, or extend (≥10×) the time limit; this applies because the toast carries an actionable button that disappears with it. |
| **Actual** | Toast (and its action) vanishes unconditionally after 4.2s; no pause-on-hover/focus, no extension. |
| **Required correction** | Pause the dismiss timer on `:hover`/`:focus-within` and resume on leave/blur — behavioral change only, no new component. This is also a hard requirement to design into the planned shared toast API (see Section 3 notes below). |
| **Validation** | Confirm timer halts while hovered/focused and resumes correctly after. |

### A11Y-010 — Sub-24px touch targets in real editing workflows

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | Vuetify math: `node_modules/vuetify/lib/components/VBtn/VBtn.css:27-29` (`.v-btn--size-x-small{--v-btn-height:20px}`) combined with `:193-195` (`.v-btn--icon.v-btn--density-comfortable{width/height: calc(var(--v-btn-height)+0px)}`) ⇒ a **20×20px** rendered hit target whenever `size="x-small"` is paired with `density="comfortable"`. Occurrences: `src/components/layout/AppSidebar.vue:653` (installed-apps toggle), `src/views/SalesChannels/StoreThemeBuilder.vue:774,797,805,814,823,863,872,881` (section expand/hide/reorder-up/reorder-down/delete controls), `src/views/SalesChannels/StoreThemeCode.vue:223,289`. |
| **Component** | `AppSidebar`, `StoreThemeBuilder`, `StoreThemeCode` |
| **Expected** | WCAG 2.5.8 Target Size (Minimum) — pointer targets should be ≥24×24 CSS px unless an exception (inline text, essential, or equivalent-control) applies; none clearly applies to these standalone icon action buttons. |
| **Actual** | 20×20px targets on the Store Theme Builder's dense per-section action row (expand, hide/show, move up, move down, delete) and the sidebar's app-toggle — a real, frequently-used editing workflow, not a decorative surface. |
| **Required correction** | Drop `density="comfortable"` (falls back to default density ⇒ 32×32px) or switch to `size="small"` + `density="comfortable"` (28×28px) — verify the section row still fits at the larger size. |
| **Validation** | Measure rendered bounding box ≥24×24px, or confirm the 2.5.8 spacing exception (≥24px center-to-center to the next target) if size truly can't change. |

---

## Section 3 — Live regions / shared toast API requirements

Current state: `v-snackbar` gets `role="status"`/`aria-live="polite"` for free from Vuetify (15 usages, all compliant by default). `DvToastStack` layers its own `aria-live="polite"` container plus per-toast `role="status"` (redundant but harmless) and is otherwise compliant on the "how does it announce" axis — its gap is purely the timing control in A11Y-009.

When the shared toast API is built, it must guarantee, regardless of implementation (whether it wraps `v-snackbar`, replaces `DvToastStack`, or is something new):

1. **Live-region container is persistent in the DOM** — don't mount/unmount the `role="status"`/`aria-live` element itself per toast (see A11Y-008's same failure mode); mount one stable region and swap its text content, or use Vuetify's own `VSnackbarQueue` which manages this.
2. **`role="status"` + `aria-live="polite"`** for ordinary confirmations; reserve `role="alert"`/`aria-live="assertive"` only for errors that need to interrupt.
3. **Type is never color-only** — success/error/warning must be distinguishable by icon + text, not fill color alone (1.4.1).
4. **Timed dismissal is pausable/extendable** whenever a toast carries an action (2.2.1) — pause on hover/focus, resume on leave/blur, per A11Y-009.
5. **Keyboard reachability** — if a toast has an action button, it must be reachable via Tab before it times out, or the pause behavior above must give the user that chance.
6. **Respect `prefers-reduced-motion`** — the existing global rule (`global.scss:723-736`) already zeroes entrance/exit transition durations for any new markup automatically, provided the new component's animations are CSS transitions/keyframes (not just JS-driven).

---

## Needs live validation

| Item | Why it can't be settled statically |
|---|---|
| A11Y-001 / A11Y-002 contrast numbers | Computed by hand from Vuetify's source opacity defaults and `tokens.json` hex values, not from a rendered DOM. Confirm with a real color picker / axe run against actual computed styles at rest, hover, and focus. |
| A11Y-003 real-world usage | Token math shows the failure exists, but a full inventory of where `--text-secondary`/`on-surface-variant` actually renders as normal-size text (vs. large/UI-only) needs a rendered-page sweep to prioritize which surfaces need the retuned token most urgently. |
| AppSidebar rail-mode keyboard flyout | Reasoned from Vuetify's `openOnFocus` default in source; needs a real Tab-through in the rendered rail nav to confirm the flyout actually opens on focus and that Escape/blur closes it cleanly. |
| AppBar combobox screen-reader behavior | Implementation matches the ARIA APG combobox pattern in source, but needs a VoiceOver/NVDA pass to confirm `aria-activedescendant` announcements read as expected while typing/arrowing. |
| A11Y-006 (MpMoveToFolderDialog) | Needs both a before/after AT check — confirm current silence, then confirm the `select-strategy` fix actually produces "selected" announcements. |
| A11Y-007 (DvHistoryDrawer) | Confirm AT announces `aria-current` once added; also confirm it doesn't double-announce given the row's `role="button"`. |
| A11Y-008 (MpFloatingBulkBar) | Needs a real screen-reader test of the 0→1 selection transition, before and after making the container persistent. |
| A11Y-009 (DvToastStack) | Confirm pause-on-hover/focus behavior once implemented; also worth checking whether any current consumer relies on guaranteed toast auto-dismissal timing before changing it. |
| A11Y-010 touch targets | Confirm rendered pixel dimensions (browser zoom/DPI can shift Vuetify's `rem`-based sizing) and check whether the 2.5.8 spacing exception is already satisfied by row layout before deciding between the two fix options. |
| Vuetify field focus-state color | Assumed compliant (opacity 1 + primary color) from partial CSS reading; worth a quick rendered confirmation alongside the A11Y-001 fix verification. |
