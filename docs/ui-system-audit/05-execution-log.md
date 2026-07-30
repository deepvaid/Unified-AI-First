# 05 — Execution Log (UI System Consolidation, Phase 3)

Append-only. One section per WP, in execution order.

---

## WP-F1 — Light-mode token corrections

**Status:** Done

**Work completed:**
1. **A11Y-003** — darkened `color.light.onSurfaceVariant` from `#737373` to `#5C6066` (the plan's suggested cool-neutral family).
2. **Light overlay tokens** — added `color.light.surfaceOverlay = #FFFFFF` and `color.light.scrim = rgba(26, 24, 20, 0.32)`, matching exactly what `mp-theme-aliases.css` previously synthesized (`var(--mp-color-light-surfaceBright)` → `#ffffff`; `rgba(var(--mp-rgb-color-light-textPrimary), 0.32)` → `textPrimary #1a1814` = `rgb(26,24,20)`). Rewired the light branch of `--surface-overlay`/`--scrim-overlay` in `mp-theme-aliases.css` to reference the new explicit tokens instead of synthesizing them. Pure refactor — no visual change (verified below).
3. **AUD-L05** — the dark-mode program's cool-neutral palette correction (commit `139516d`, already on this branch's ancestry) moved dark `surfaceBright`/`surfaceOverlay` from `#39352C` to `#32373E` without revisiting the danger-text token, leaving `color.dark.error` (`#EF8176`) at 4.61:1 on the new overlay tier (below the plan's 5.06:1 target, still ≥4.5 AA — this is the audit's exact Low finding). Lightened `color.dark.error` one step to `#F18E84` (HLS lightness +0.03, same hue/saturation) to clear the plan ratio.

**Files changed:**
- `src/design-tokens/tokens.json` (3 leaves: `color.light.onSurfaceVariant`, new `color.light.surfaceOverlay`, new `color.light.scrim`, `color.dark.error`)
- `src/design-tokens/generated/{variables.css,_variables.scss,tokens.ts}` (regenerated via `npm run tokens:build`, 515 tokens)
- `src/styles/mp-theme-aliases.css` (light-branch `--surface-overlay`/`--scrim-overlay` now reference the new explicit tokens)

**Computed contrast numbers:**
| Pair | Ratio | Target | Result |
|---|---|---|---|
| `#5C6066` on `surfaceVariant #ececec` | 5.354:1 | ≥4.5:1 | Pass |
| `#5C6066` on `background #f4f6fa` | 5.846:1 | ≥4.5:1 | Pass |
| `#5C6066` on `surface #ffffff` | 6.325:1 | ≥4.5:1 | Pass |
| (prior) `#737373` on `surfaceVariant` | 4.014:1 | — | was failing |
| (prior) `#737373` on `background` | 4.383:1 | — | was failing |
| dark `error #F18E84` on `surfaceOverlay #32373E` | 5.105:1 | ≥5.06:1 (plan) / ≥4.5:1 (AA) | Pass |
| (prior) dark `error #EF8176` on `surfaceOverlay #32373E` | 4.608:1 | — | AA pass, plan-ratio fail (AUD-L05) |
| dark `error #F18E84` on `surface #1F2226` | 6.8:1 | — | Pass |
| dark `error #F18E84` on `surfaceVariant #272B30` | 6.065:1 | — | Pass |

**Token diff scope check:** `git diff -- src/design-tokens/tokens.json` touches exactly the 4 leaves listed above; `git diff --stat` on `generated/` shows only the expected knock-on lines (no other light or dark value moved). Confirmed via manual diff read.

**Tests run:**
- `npm run tokens:build` — pass, 515 tokens generated.
- `npm run type-check` — fails with the same 13 pre-existing `src/views/Reel/ReelFlyView.vue` TS2532/TS2345 errors documented as a baseline exception in `docs/dark-mode/06-independent-audit.md`. Confirmed via `git show master:src/views/Reel/ReelFlyView.vue` diffed against the working tree — byte-identical, so this file is untouched by this WP and the failure predates the branch.
- `npm run build` — same baseline `vue-tsc` failure (build script runs `vue-tsc -b && vite build`).
- `npx vite build` — pass (used as the build-gate proxy per the same baseline-exception precedent), `✓ built in 11.09s`.
- Dev-server visual pass (`preview_start "Main App"`, port 5173→60344 autoport):
  - Light dashboard (`/accounts/2000290/dashboard`): renders normally; `getComputedStyle` confirms `--mp-color-light-onSurfaceVariant: #5C6066`, `--text-secondary: #5C6066`, `--surface-overlay: #FFFFFF`, `--scrim-overlay: rgba(26, 24, 20, 0.32)`.
  - Dark dashboard: renders unaffected (KPI values differ only because mock data is randomized per load, not a token regression); `--mp-color-dark-error: #F18E84` confirmed live.
  - Light contacts table (`/accounts/2000290/contacts`): renders normally, no perceptible shift beyond secondary-text darkening.
  - Console: zero errors in either theme.

**Deviations from plan:** None. `npm run type-check`/`npm run build` gate substituted with `npx vite build` only due to the pre-existing, branch-unrelated `ReelFlyView.vue` baseline failure (precedented in the dark-mode program's own execution/verification logs).

**Known issues:** None introduced. Baseline `ReelFlyView.vue` type errors remain open (pre-existing, out of this program's scope per the dark-mode audit's own recommendation to track it separately).

---

## WP-F2 — Field boundary contrast (A11Y-001 High, A11Y-002)

**Status:** Done

**Investigation finding (deviation from the plan's literal file/mechanism, acceptance criteria still met):** The plan's implementation sketch ("set `--v-field-border-opacity` … or bind the outline color to `var(--border-strong)`") assumes Vuetify's stock currentColor+opacity mechanism is still live. It is not: `src/styles/settings-form.scss` ("Global Outlined Field Baseline", loaded app-wide via `app-styles.ts`) already hardcodes the resting outline to `border-color: var(--hairline) !important` at forced `--v-field-border-opacity: 1`. `--hairline` resolves to `--border-subtle` (`#e2e8f0` light / dark equivalent), which computes to **~1.2:1 even at full opacity** — so neither of the plan's two suggested mechanisms (raising a now-irrelevant opacity variable, or binding to `--border-strong` = light `#d4d4d4` = **1.48:1 on white**) can reach 3:1 without a token value change, which WP-F2 is not scoped to make (no `tokens.json` in its file list; D5 reserves light-leaf changes to WP-F1). Resolution: added a higher-specificity override still inside `global.scss` (the plan's named file) that recolors only the **resting** state (`:not(.v-field--focused):not(:hover):not(.v-field--error)`) to a translucent mix of the existing `--text-secondary` token, which clears 3:1 on both tiers without introducing any new token leaf. `settings-form.scss` itself documents that "components may add scoped specificity overrides" — this follows that sanctioned pattern rather than editing that file. Hover/focus/error selectors were left untouched, per the plan's explicit "Hover/focus states unchanged."

**Work completed:**
1. **A11Y-001** — added a higher-specificity `global.scss` rule (after the existing `.v-field` transition block) that sets the resting outlined-field border to `color-mix(in srgb, var(--text-secondary) 75%, transparent)` for `.v-field--variant-outlined:not(.v-field--focused):not(:hover):not(.v-field--error) .v-field__outline__{start,end}` and both `.v-field__outline__notch::{before,after}`. `--text-secondary` resolves per-theme via `mp-theme-aliases.css` (light → `onSurfaceVariant` `#5C6066` post-WP-F1; dark → `textSecondary` `#C2C7CD`), so the fix inherits correctly into dark without any dark-specific code.
2. **MpDataTableToolbar ghost search** — removed the local `--v-field-border-opacity: 0.16` override (which would otherwise still render sub-3:1 once combined with the new global rule); the resting state now gets `background: var(--surface-secondary)` instead, so the field's extent reads via fill. The pre-existing unconditional `background: transparent` rule on `.v-field` continues to govern the focused state (higher-specificity `:not(.v-field--focused)` rule only matches at rest), so focus still shows the transparent field + primary ring, unchanged.
3. **Dark mode verification** — computed both the outlined-field fix and the toolbar fill against dark surfaces; confirmed via `getComputedStyle` in the running app and numerically (below). No dark-specific code was needed — both changes route through theme-aware semantic vars (`--text-secondary`, `--surface-secondary`).

**Files changed:**
- `src/styles/global.scss` (new rule after the `.v-field` transition block, ~line 282)
- `src/components/MpDataTableToolbar.vue` (ghost-search resting-state rule swapped from border-opacity to background-fill)

**Computed contrast numbers:**
| Pair | Ratio | Target | Result |
|---|---|---|---|
| (prior) resting border `--hairline #e2e8f0` @ opacity 1 on white | 1.233:1 | — | failing (A11Y-001) |
| (prior) resting border `--hairline` on canvas `#f4f6fa` | 1.139:1 | — | failing |
| (rejected alt.) `--border-strong` (light `#d4d4d4`) opaque on white | 1.482:1 | ≥3:1 | still fails — why the plan's 2nd suggested mechanism was not usable as literally stated |
| new resting border: `color-mix(text-secondary 75%, transparent)` on white | 3.561:1 | ≥3:1 | Pass |
| new resting border on canvas `#f4f6fa` | 3.386:1 | ≥3:1 | Pass |
| dark equivalent (`text-secondary #C2C7CD` @ 75%) on dark `surface #1F2226` | 5.305:1 | ≥3:1, no regression | Pass (prior dark hairline-based border was ~1.33:1 — also improved, not just non-regressed) |
| dark equivalent on dark `background #17191C` | 5.699:1 | ≥3:1 | Pass |
| dark equivalent on dark `surfaceVariant #272B30` | 4.900:1 | ≥3:1 | Pass |

**Tests run:**
- `npm run type-check` / `npm run build` — same pre-existing baseline `ReelFlyView.vue` failures only (unrelated, see WP-F1 entry); `npx vite build` — pass, `✓ built in ~11s`.
- Dev-server visual pass, both themes:
  - Settings → Account Defaults (`/accounts/2000290/settings/account-defaults`): every outlined field (Account Name, Account ID, Industry, Language, Timezone, Currency, Date Format, Website URL) shows a clearly visible resting border in light and dark; `getComputedStyle` confirmed `border-color: color(srgb 0.36 0.376 0.4 / 0.75)` (= `--text-secondary` `#5C6066` at 0.75 alpha) on real rendered fields, opacity `1` (not double-faded).
  - Contacts (`/accounts/2000290/contacts`) toolbar search: resting fill confirmed via `getComputedStyle` → `rgb(236, 236, 236)` (light `--surface-secondary` = `surfaceVariant`), visibly bounded via fill in both themes; no border artifact.
  - Console: zero errors in either theme, either screen.

**Deviations from plan:** Implementation mechanism changed from the plan's literal suggestion (Vuetify opacity var / `--border-strong` bind) to a higher-specificity `color-mix(--text-secondary)` override, for the reasons computed and logged above. The acceptance criteria (resting border ≥3:1 light, toolbar bounded via fill, no dark regression, every settings form field shows the stronger border) are met; the *file* target (`global.scss`) and the *scope* (resting state only, hover/focus/error untouched) match the plan exactly — only the specific property/selector mechanism differs from the plan's initial guess, which is what the "compute and verify" protocol is for.

**Known issues:** None introduced.

---

## WP-F3 — Overlay defaults + z-index hygiene + selected checkmark

**Status:** Done

**Work completed:**

1. **`maropostDefaults` additions** (`src/plugins/maropostTheme.ts`):
   - **VDialog radius — verified, not added.** Vuetify's `rounded="xl"` compiles to `border-radius: 24px !important` (`node_modules/vuetify/lib/styles/main.css` `.rounded-xl`), but `component.dialog.radius.default` is `16px` and `global.scss`'s existing `.v-dialog > .v-overlay__content > .v-card/.v-sheet` rule already forces `border-radius: var(--mp-component-dialog-radius-default) !important` (16px). The two values do not match, and the plan's own instruction ("if so, keep dialogs on the existing global.scss radius rule … do not change dialog radius visually") applies. No `VDialog` entry was added — documented inline in `maropostTheme.ts` instead of adding a default that isn't true.
   - Added `VMenu: { offset: 4 }`, `VTooltip: { location: 'top', openDelay: 150, closeDelay: 0 }`, `VSnackbar: { timeout: 2500, location: 'bottom center' }` exactly as specified.
2. **Menu chrome tokenization** (`global.scss`, popover-surfaces block):
   - List padding `4px` → `var(--mp-spacing-1)` (exact value match, no visual change).
   - Item radius `8px` → **`var(--mp-borderRadius-chip)`, not `var(--mp-borderRadius-md)` as the plan suggested** — verified `--mp-borderRadius-md` generates `12px` (`src/design-tokens/generated/variables.css:19`), which would visually enlarge the radius from 8px to 12px. `--mp-borderRadius-chip` generates `8px` exactly, preserving the current look. Logged here per the same "verify before applying" discipline as the VDialog check.
   - Removed `!important` from the popover surface's `border` and `box-shadow` (kept it on `border-radius`, which must beat Vuetify's `!important` `.rounded-lg` utility class from `VCard`'s `rounded: 'lg'` default). Verified in the running app (light + dark, Settings Industry select) that the border and shadow still render correctly without `!important` — the existing selector (`.v-menu > .v-overlay__content > .v-card` etc., 3 class levels) already out-specifies Vuetify's own variant/elevation rules.
3. **UX-008 selected checkmark** — added `.v-overlay .v-list-item--active[aria-selected='true']::after` with a masked inline-SVG Lucide-check data URI, `background-color: rgb(var(--v-theme-primary))`, 16×16px, right-aligned at `right: 12px`, vertically centered. Verified scoping two ways: (a) code inspection — the Settings left-nav active item and AppSidebar nav items are plain `<a>` tags with `aria-current="page"` and custom classes (`settings-sidebar__item--active`), not `.v-list-item` at all, and are never rendered inside `.v-overlay`; (b) live DOM check in the running app confirmed the Settings "Account Defaults" active nav link has `ariaSelected: null` and lives outside any `.v-overlay`. Confirmed via `getComputedStyle(el, '::after')` on the open Industry `v-select` that the checkmark renders on the correct (selected "E-Commerce") option in both themes, picking up theme-correct primary color (light `rgb(0,115,171)` / dark `rgb(44,196,255)` = `#2CC4FF`, the untouched D7 cyan accent) automatically via `rgb(var(--v-theme-primary))`.
4. **Z-index hygiene** — inspected intent for each of the 3 named literals (28 others are pre-classified "justified" per the plan and untouched):
   - `App.vue:238` (`.skip-link`, was `1000`) — an app-level floating a11y element that sits, and always sat, numerically **under** the sidebar flyout tier (`--mp-zIndex-navSidebarFlyout` 1005 / `TogglePill` 1010). Mapped to `var(--mp-zIndex-bulkActionBar)` (100) — the nearest documented token below that tier — with a comment explaining the relative-order intent is unchanged from the old literal.
   - `DaVinciExperience.vue` `.dvx__debug` (was `9999`, a `?debug=1`-only diagnostic HUD) — must stay visible above modals while debugging their state, so it needed the "must sit above modals" branch: mapped to `var(--mp-zIndex-toast)` (10000, "above all overlays") with a comment.
   - `DvHistoryDrawer.vue:225` (`z-index: 40`) — confirmed it's a local stacking context only (`position: absolute` slide-in panel inside the copilot drawer's own bounding box, unrelated to the app-wide overlay ladder); added a one-line comment documenting that, no token/value change, per the plan.

**Files changed:**
- `src/plugins/maropostTheme.ts`
- `src/styles/global.scss`
- `src/App.vue`
- `src/views/DaVinci/DaVinciExperience.vue`
- `src/components/copilot/DvHistoryDrawer.vue`

**Tests run:**
- `npm run type-check` / `npm run build` — same pre-existing baseline `ReelFlyView.vue` failures only; `npx vite build` — pass, `✓ built in ~11s`.
- Dev-server visual pass, both themes, Settings → Account Defaults:
  - Industry `v-select` menu opens with visible gap (offset), tokenized rounded chrome, border+shadow intact without `!important`.
  - Selected option ("E-Commerce") shows the trailing checkmark in both themes (`getComputedStyle` confirmed `width: 16px`, correct theme-primary `background-color`, `position: absolute`, `right: 12px`).
  - Settings left-nav / AppSidebar active items confirmed to carry **no** checkmark (verified they are not `.v-list-item` / not inside `.v-overlay` / no `aria-selected`).
  - Console: zero errors in either theme.

**Deviations from plan (both are "compute and verify" outcomes, not new decisions):**
1. `VDialog: { rounded: 'xl' }` not added — verified `rounded="xl"` (24px) ≠ `component.dialog.radius.default` (16px); adding it would either do nothing (global.scss's `!important` wins) or invite future drift from an inaccurate default. Plan explicitly allowed this branch.
2. Item radius tokenized to `var(--mp-borderRadius-chip)` (8px) instead of the plan's suggested `var(--mp-borderRadius-md)`, because `--mp-borderRadius-md` is actually 12px and would have changed the visual size. `--mp-borderRadius-chip` is the exact existing 8px value.

**Known issues:** None introduced.

---

## WP-F4 — Chart foundation (UX-003 High + LiveView outlier + AUD-L03)

**Status:** Done

**Work completed:**
1. **UX-003** — added `tickAmount: 6` and `labels: { hideOverlappingLabels: true, rotate: 0 }` to the shared `xaxis` base in `applyChartTheme()` (`src/plugins/chartPalette.ts`), keeping the existing `style: labelStyle`. Did not switch to `type: 'datetime'` (categories remain plain strings from mock data, per the plan).
2. **LiveView.vue "outlier" — investigated, found already resolved, no code change made.** The plan's finding (from `docs/ui-system-audit/01-repository-discovery.md`: "Hard-coded `#ffffff` for text color") does not match the file's current state. Exhaustive grep of `src/views/Analytics/LiveView.vue` for hex codes (`#[0-9a-fA-F]{3,6}`), the literal string "white" (case-insensitive), and `rgb(255,255,255)`-style literals all returned zero matches. Every chart color reference in the file already routes through `chrome.axisLabel`, `chrome.legendLabel`, `activePalette[n]`, or `useChartTheme()`. Git history shows `d7bd9b3` ("mode-aware chart palettes, tooltip chrome, legend fixes (WP-09)") on the prior dark-mode branch already themed this file before the ui-system-audit's repository-discovery doc's snapshot; the plan inherited a stale finding. Verified rendered LiveView in both themes (light + dark) via the dev server — KPI sparklines, activity area chart, donut, and map all render correctly with no white-on-white or black-on-black text in dark mode.
3. **AUD-L03** — grepped for production consumers before removing: `grep -rn "chartPalette\b" src` showed only the deprecated definition itself (`chartPalette.ts:349`) and unrelated identifiers that merely contain the substring (`applyChartPalette`, `useChartTheme`, `CHART_PALETTES`, `CHART_PALETTE_OVERRIDE`, `CHART_THEMES`, the `ChartPalette`/`ChartTheme` types, `chartLegendOptions`, and one code comment). Zero real imports of the bare `chartPalette` export. Deleted `export const chartPalette: string[] = CHART_THEMES.blue.light.series` and its `@deprecated` comment.

**Files changed:**
- `src/plugins/chartPalette.ts` (xaxis base additions; deprecated `chartPalette` export removed)
- `src/views/Analytics/LiveView.vue` — **no changes** (item 2's premise did not hold; see above)

**Tests run:**
- `npm run type-check` / `npm run build` — same pre-existing baseline `ReelFlyView.vue` failures only; `npx vite build` — pass, `✓ built in ~11s`.
- `grep -rn "chartPalette\b" src` (post-removal) — only the new/existing API surface remains, matching the acceptance criterion exactly.
- Dev-server visual pass:
  - Dashboard → Add widget → "Revenue over time" preview: `document.querySelectorAll('.apexcharts-xaxis-texts-g text')` scoped to the preview's own canvas (width ≈472px, i.e. the ~480px target) showed 8 distinct non-empty date labels (`07-21, 07-25, 07-26, 07-27, 07-28, 07-28, 07-29, 07-29`) out of 30 tick slots — legible, ≤8, no overlap, matching the acceptance criterion.
  - Dashboard "Revenue by channel" chart: palette/series colors unchanged (only axis tick/label behavior was touched).
  - Live View (`/accounts/:id/analytics/live_view`): renders correctly in both light and dark, console clean.

**Deviations from plan:** Item 2 (LiveView hardcoded `#ffffff`) required no code change — investigation showed the underlying issue was already fixed prior to this branch (see above). Logged as a finding rather than silently skipped, per the "compute and verify" protocol; not a blocker since the acceptance criterion ("LiveView renders correctly in both themes") is still met.

**Known issues:** None introduced.

---

## WP-F5 — Dark-mode low closure (AUD-L01) + compat alias retirement

**Status:** Done

**Grep-pattern verification before the sweep (per the task's specific caution):** a naive `--ink\b` grep over-matches — `\b` only requires a word→non-word transition, so `--ink-panel-bg`, `--ink-panel-fg`, `--ink-panel-muted-fg`, `--ink-panel-accent`, `--ink-panel-border` (a legitimate, actively-used token family for the confident-editorial ink-panel surface, unrelated to the deprecated `--ink` alias) all matched too (28 of 189 raw hits). Corrected to a negative-lookahead pattern, `--ink(?!-)\b` (via `grep -P` / Python `re`), which excludes `--ink-panel-*` and a comment-only "`--ink-derived`" phrase in `AppBar.vue` (never a real token) while still catching every genuine `var(--ink)` reference. `--surface-1`, `--surface-2`, `--hairline` had no such collisions (verified no `--surface-10`-style or `--mp-border-hairline`-style false matches exist).

**Work completed:**
1. Confirmed via `grep -rnE -- "^\s*--(surface-1|surface-2|hairline|ink)\s*:" src/` that the only *definitions* of these four names are the two theme blocks in `src/styles/mp-theme-aliases.css` — no component locally redefines them, so a global rename is safe.
2. Mechanically renamed every consumption site (`--surface-1` → `--surface-primary`, `--surface-2` → `--surface-secondary`, `--hairline` → `--border-subtle`, `--ink` → `--text-primary`, using the corrected pattern) across `src/` (excluding `src/design-tokens/generated/`) with a value-preserving Python script — 75 + 45 + 120 + 157 = 397 replacements across 54 files. Prose comments mentioning the old names (e.g. "`--hairline` is tuned for white cards…") were updated too, since they document the same concept under its new name.
3. **D6 correction:** the bulk pass initially touched `src/views/Retail/PosPreview.vue` (a declared showcase/fixed-look exception). Reverted that file, then reconsidered: `PosPreview.vue` has no local redefinition of these 4 names and depends entirely on the global aliases being retired in step 4 below — leaving it un-renamed would not preserve its look, it would silently break it once the aliases are deleted (`var(--surface-1)` etc. would resolve to nothing). Re-applied the same value-preserving rename to `PosPreview.vue` alone (4× `--surface-1`, 2× `--hairline`, 10× `--ink`) as the only way to keep D6's "untouched appearance" guarantee intact under the alias deletion — this is a byte-for-byte-equivalent substitution (same resolved values), not a visual/design change, so it doesn't reopen the D6 exception. Verified rendered `/commerce/2000290/retail/pos-preview` before and after: identical.
4. Deleted the four alias definitions (`--surface-1`, `--surface-2`, `--ink`, `--hairline`) from both theme blocks in `mp-theme-aliases.css`, leaving the other compat aliases in that same block (`--surface-0`, `--muted`, `--accent`, `--accent-fg`, `--accent-ink`, `--accent-soft`) untouched — those are out of this WP's named scope.

**Files changed:** `src/styles/mp-theme-aliases.css` + 54 consumer files (`.vue`/`.scss`/`.css`/`.ts` under `src/components`, `src/views`, `src/styles`, `src/stories`) — full list is every file touched in this commit.

**Grep-zero acceptance (final state):**
```
grep -rn -- "--surface-1\b" src/ | grep -v generated   →  (none)
grep -rn -- "--surface-2\b" src/ | grep -v generated   →  (none)
grep -rn -- "--hairline\b" src/ | grep -v generated    →  (none)
grep -rnP -- "--ink(?!-)\b" src/ | grep -v generated   →  (none)
```
(the only remaining hits anywhere are inside this log and one explanatory code comment in `mp-theme-aliases.css` documenting the retirement, both prose not CSS).

**Tests run:**
- `npm run type-check` / `npm run build` — same pre-existing baseline `ReelFlyView.vue` failures only; `npx vite build` — pass, `✓ built in ~11s`.
- Dev-server visual pass, light + dark:
  - Settings → Account Defaults: unchanged from the WP-F2/F3 baseline screenshots (left nav, form fields, borders).
  - Section-rail page (`StoreThemeBuilder`, `/accounts/2000290/sales_channels/retest-sales-notification/theme`): rail + canvas render identically in both themes.
  - `/commerce/2000290/retail/pos-preview` (the D6 exception file touched per item 3 above): renders identically to its pre-rename appearance.
  - Console: zero errors on any of the three screens, either theme.

**Deviations from plan:** One necessary addition beyond the plan's literal file scope: `PosPreview.vue` (a D6 "out of scope" file) received the same value-preserving rename as everything else, because leaving it on the soon-to-be-deleted aliases would have broken its rendering rather than preserved it. No visual change resulted (verified before/after); this is treated as required plumbing to honor D6's "untouched appearance" intent, not a new design decision on that surface.

**Known issues:** None introduced. `--surface-0`, `--muted`, `--accent`, `--accent-fg`, `--accent-ink`, `--accent-soft` remain as compat aliases in `mp-theme-aliases.css` — out of WP-F5's named scope, not evaluated here.

---

## WP-C1 — Shared toast system (D2 exception)

**Status:** Done (foundation only — call-site migration across modules is separate follow-up work, not part of this WP)

**Work completed:**
1. **`src/composables/useToast.ts`** (new) — singleton composable: module-level `toasts` ref shared by every `useToast()` caller. `show(message, opts?)` plus `success`/`error`/`info` sugar wrapping it with a type preset. Each toast gets a unique id (`crypto.randomUUID()`, with an incrementing-counter fallback for environments without it). Defaults: success/info auto-dismiss at 4500ms; error persists (`durationMs: null`) unless the caller passes an explicit `durationMs`. `pause(id)`/`resume(id)` stop and restart the underlying `setTimeout`, tracking elapsed/remaining time so a resumed toast only waits out what was left, not the full duration again. `dismiss(id)` marks the toast `leaving: true` (for the CSS exit animation) then removes it from the array after `LEAVE_MS` (200ms, matching the host component's exit-keyframe duration).
2. **`src/components/MpToastStack.vue`** (new) — the single host, `Teleport to="body"`, fixed bottom-right, `width: 320px`, `z-index: var(--mp-zIndex-toast)` (existing token, no new value invented). Cards are `<v-card flat border rounded="lg">` matching every other Maropost card. Icon per type via the existing Lucide bridge: `check` (success), `triangle-alert` (error), `info` (info). Optional bold title, message, at most one action (rendered as a `variant="text"` primary button, `px-0` so it reads as a text link), and an always-present `icon="x"` close button (`aria-label="Dismiss notification"`). Hover (`@mouseenter`/`@mouseleave`) and focus (`@focusin`/`@focusout`) on each toast's wrapper call `pause`/`resume`, satisfying the "pause on `:hover`/`:focus-within`" requirement (real timer control needs JS; the visual motion itself stays pure CSS). Entrance/exit are CSS `@keyframes` (200ms) driven by the `is-leaving` class the composable sets — no JS-driven animation, so the app's global `prefers-reduced-motion` rule (`global.scss:780-793`) zeroes them automatically; no redundant local reduced-motion check was added.
3. **A11y (`03-accessibility-audit.md` Section 3, all 6 items):** the `aria-live="polite"` container (`.mp-toast-stack`) is unconditionally rendered in the template — never `v-if`'d — so only the individual toast cards (children) mount/unmount, never the live region itself (item 1). Each card is `role="status"` (success/info) or `role="alert"` (error — a nested `role="alert"` still gets its own implicit assertive announcement regardless of the ancestor's `aria-live="polite"`) (item 2). Type is always icon + text, never color-only (item 3). Timer pause/resume on hover/focus covers items 4–5. Reduced-motion is inherited globally (item 6).
4. Mounted `<MpToastStack />` once in `src/App.vue`, as a sibling to the copilot drawer inside `<v-app>` (it Teleports itself to `<body>`, so placement in the template only matters for lifecycle, not DOM position).
5. Added `src/components/MpToastStack.stories.ts` (autodocs, `Feedback/MpToastStack`) covering: `Success`, `PersistentError`, `Info`, `WithTitle`, `WithAction`, `LongMessage`, `MultipleStacked`, `DarkModeStacked`, and an `Interactive` story that drives the real `useToast()` API from buttons (for demonstrating true auto-dismiss/pause timing rather than the pinned-duration docs stories). Follows `DvToastStack.stories.ts`'s established idiom for singleton-backed stories: `layout: 'fullscreen'` + `docs.story.inline: false` (own iframe per story, since the stack teleports and positions fixed), and each story resets `toast.toasts.value = []` in `setup()` before seeding its fixture toast(s) so stories don't bleed into each other. Static/reference stories pin `durationMs` to a large value so the docs page stays stable while reviewed (mirroring `DvToastStack`'s `durationMs: 3_600_000` convention); `PersistentError` needs no override since errors already persist by default.
6. Did **not** modify `DvToastStack.vue` or `useDaVinciToasts.ts` (used read-only, for stack/animation-mechanics prior art only) — that pair stays separate from this WP per the task's explicit instruction, superseding the implementation plan's suggestion to add an explanatory doc-comment to `DvToastStack.vue` itself. `MpToastStack.vue` instead carries its own comment explaining the split.

**Files changed:**
- `src/composables/useToast.ts` (new)
- `src/components/MpToastStack.vue` (new)
- `src/components/MpToastStack.stories.ts` (new)
- `src/App.vue` (mount `MpToastStack` once)

**Tests run:**
- `npm run type-check` / `npm run build` — same pre-existing baseline `ReelFlyView.vue` failures only (confirmed via `git diff master -- src/views/Reel/ReelFlyView.vue` → no diff, file untouched); `npx vite build` — pass, `✓ built in ~8s`.
- Storybook (`localhost:6006`, light + dark via the toolbar theme toggle):
  - `MultipleStacked` — 3 toasts (info/success/error) render stacked bottom-right, newest (error) at the bottom, older pushed up; verified via DOM inspection: `aria-live="polite"` on the persistent container, `role` per card = `["status","status","alert"]`, 3 dismiss buttons with `aria-label="Dismiss notification"`.
  - `WithAction` — Storybook's Accessibility addon (axe-core): **0 violations, 15 passes, 1 inconclusive** (a manual-review item, not a failure).
  - `LongMessage` — message wraps across multiple lines inside the fixed-width card; card does not widen.
  - `PersistentError` — waited 6s (> the 4500ms default) — error toast still present, confirming it does not auto-dismiss.
  - `DarkModeStacked` — card background (`rgb(31,34,38)`) visibly distinct from the canvas (`rgb(23,25,28)`) with a `rgba(255,255,255,0.12)` border — same flat-bordered-card treatment used elsewhere in dark mode (e.g. `MpKpiCard`), not a new pattern.
  - `Interactive` — functional pause/resume test via real timers (not just code review): clicked "Push success" (default 4500ms), dispatched a real `mouseenter` on the toast ~30ms later, confirmed the toast was **still present after 14.7s elapsed** (far past the un-paused deadline); then dispatched `mouseleave` and confirmed the toast **auto-dismissed** shortly after (well within the next check ~14.9s later, consistent with the ~4.47ms remaining timer resuming and completing, plus the 200ms leave animation).

**Deviations from plan:** The plan text (`04-implementation-plan.md` WP-C1) suggested adding "a short 'why Da Vinci toasts stay separate for now' note in the component doc comment" to `DvToastStack.vue`. The task's direct instructions for this WP explicitly listed `DvToastStack.vue`/`useDaVinciToasts.ts` as read-only prior-art references and said not to modify either file. Followed the direct instruction (no changes to either file); `MpToastStack.vue` documents the split in its own header comment instead. Migration of the 179 existing `v-snackbar` call sites to `toast.*()` is explicitly out of scope for this WP (separate, later batched work per module, per the plan's migration section) — no view/component call sites were touched.

**Known issues:** None introduced. The shared `toasts` ref is returned directly (not wrapped in a read-only `computed`) from `useToast()`, matching `useDaVinciToasts`'s existing convention — this is what makes the Storybook singleton-reset idiom (`toast.toasts.value = []`) work without inventing a new `clear()` API only for stories, but it does mean a consumer could in principle mutate the array directly instead of going through `show`/`success`/`error`/`info`; no such usage exists yet since there are no call sites migrated in this WP.

---
