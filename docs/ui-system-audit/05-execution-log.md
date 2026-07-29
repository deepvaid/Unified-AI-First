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
