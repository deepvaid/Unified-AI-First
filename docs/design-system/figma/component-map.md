# Marobase — Figma ⇄ code component map

File: **Marobase Design System** — https://www.figma.com/design/RJJ0qDChSdh0FwH2UG0t7t (run `marobase-2026-09`).
Code Connect is unavailable on the Pro plan, so this table plus the variables' WEB code syntax are the contract.
Rows are added as each set is built; node ids come from `build-state.json`.

Prop vocabulary shared by both sides: `size sm|md|lg` · `emphasis default|prominent` · `variant` = structure ·
`density default|compact` · `tone` (surface: neutral|error · feedback: info|success|warning|error) ·
`state default|hover|focus|disabled (+ error / selected / active)`.

## Foundations (built)

| Figma | Node | Code |
|---|---|---|
| Variables — Primitives / Color / Nav Skin / Dimensions / Typography (267) | collections `2:2`–`2:6` | `src/design-tokens/tokens.json` → `generated/variables.css`; alias layer `src/styles/mp-theme-aliases.css`; skins `sidebar-{gray,white,dark}.css`. Full map: `variable-map.md` |
| Text styles (17) | `S:…` in ledger | `text.*`, `display.*`, `component.button.typography`, Vuetify `text-body-2` / `text-caption`; `settings-form.scss` static labels |
| Effect styles (8) | `S:…` in ledger | `shadow.*` → `--elevation-raised / -overlay / -modal`, `--mp-shadow-buttonInset`, `--dv-orbit-mic-shadow` |
| Paint styles (3 gradients) | `S:…` in ledger | `--dv-grad`, `--dv-hero-grad`, `--dv-action-gradient` (`dv-tokens.css`) |
| Cover · Getting Started · Color · Typography · Spacing & Radius · Elevation, Motion & Layering · Layout & Breakpoints | frames `14:2` `15:2` `16:2`/`17:2` `18:2` `20:2` `21:2` `26:2` | documentation of the above; every swatch/bar/tile is variable- or style-bound |
| `Icon/<name>` ×210 | grid `23:7` (components `23:10`… `25:404`) | `<v-icon>name</v-icon>` via `src/plugins/lucideIcons.ts` (lucide-vue-next). 12 names resolve through Lucide renames: `bar-chart-2→chart-column`, `bar-chart-3→chart-column-big`, `file-plus-2→file-plus`, `file-question→file-question-mark`, `filter→funnel`, `filter-x→funnel-x`, `more-vertical→ellipsis-vertical`, `pie-chart→chart-pie`, `play-circle→circle-play`, `playlist-check→list-checks`, `scatter-chart→chart-scatter`, `shield-question→shield-question-mark`, `wand-2→wand-sparkles` |

## Atoms (planned — rows filled as built)

| Figma set | Variant axes | Code |
|---|---|---|
| Button | Style Primary·Secondary·Outline·Ghost·Danger × Size sm·md × State default·hover·disabled (+ focus boolean, leading/trailing icon booleans, INSTANCE_SWAP icon) | `v-btn` flat / tonal / outlined / text / flat error with `maropostDefaults`; proposed `MpButton` |
| Icon Button | Style ×4 × Size sm·md × State ×3 | `v-btn icon` |
| Field | Type text·select × Size sm·md·lg × State default·focus·error·disabled·readonly; booleans label, hint, prefix/suffix icon, success | `v-text-field` / `v-select` (`density`), `.mp-field-readonly`, `.mp-field-success` |
| Textarea · Checkbox · Radio · Switch | state axes | `v-textarea`, `v-checkbox`, `v-radio`, `v-switch` |
| Chip · Status Chip · Source Cloud Chip · Badge · Avatar | see plan §4 | `v-chip`, `MpStatusChip`, `MpSourceCloudChip`, `v-badge`, `v-avatar` |
| Menu Item · Nav Item · Tab · Segment · Step | see plan §4 | `MpMenuItem`, `AppSidebar` rows / `MpSectionRail` items, `MpFilterTabs` item, `MpSegmentedControl` item, `MpWizardSteps` item |
| Tooltip · Divider · Spinner · Progress Linear · Skeleton · Illustration · Kbd | — | `v-tooltip`, `v-divider`, `v-progress-*`, `MpTableSkeleton`, `MpIllustration` (8 names), `.appbar-search kbd` |

## Molecules · Patterns · AI kit · Product — see the approved plan §4–§7; rows are appended here with node ids as each set lands.
