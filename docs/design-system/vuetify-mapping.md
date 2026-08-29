# Mp* → Vuetify Mapping (P5)

<!-- Artifact of the Docs & Handoff agent (design-system program, Phase 5). -->
<!-- Sources: audit.md §3, src/plugins/maropostTheme.ts (maropostDefaults), component templates. -->

## Global defaults every component inherits

`createVuetify({ defaults: maropostDefaults })` (`src/plugins/vuetify.ts` + `maropostTheme.ts`)
restyles the raw Vuetify primitives, so Mp* wrappers stay thin:

| Vuetify component | Inherited defaults |
|---|---|
| VBtn | `variant="flat"`, pill radius, button typography tokens, no text-transform, min-height 40px + padding-inline 14px (drift — see token-sync-plan.md) |
| VCard | `variant="flat"`, `rounded="lg"` (14px card token) |
| VTextField / VSelect / VAutocomplete / VCombobox / VTextarea | `variant="outlined"`, `density="comfortable"`, `hide-details="auto"`, primary color, `persistent-placeholder` (static top label mechanism), 10px `component.input.radius`; `density` maps to the field size ramp (compact → sm 32 · comfortable → md 40 · default → lg 48) |
| VAlert | `variant="tonal"`, `rounded="md"` |
| VChip | `rounded="pill"`, `size="small"` |
| VDataTable | `fixed-header`, `hover`, `density="comfortable"`, 15 rows/page |
| VNavigationDrawer / VAppBar | `elevation="0"` |
| VDialog | **None, deliberately.** `rounded="xl"` is 24px against a 16px `component.dialog.radius`, and `global.scss` forces the token anyway. Compose `MpDialog`. |
| VDivider | `opacity="0.72"` |
| VList | `elevation="0"`, `border`, `rounded="lg"` |

Icons resolve through the lucide bridge (`defaultSet: 'lucide'`, `src/plugins/lucideIcons.ts`).

## Component map (P0 set)

| Mp* component | Built on |
|---|---|
| MpPageHeader | `v-icon` + native headings (`component :is` h1/h2), custom breadcrumbs |
| MpSectionHeader | pure markup (heading role + action slot) |
| MpKpiCard | `v-card`, `v-icon` |
| MpStatusChip | `v-chip`, `v-icon` |
| MpSourceCloudChip | `v-icon` in a role="img" span (cloud accent CSS vars) |
| MpDataTableToolbar | `v-text-field`, `v-btn`, `v-badge`, `v-menu`, `v-card`, `v-checkbox`, `v-chip`, `v-divider`, `v-expand-transition`; composes MpFormDrawer for the filter drawer |
| MpFilterTabs | `v-tabs`, `v-tab`, `v-chip` (counts) |
| MpTableSkeleton | pure markup (CSS shimmer) |
| MpEmptyState / MpErrorState | `v-btn`, `v-icon` (error variant adds `role="alert"`) |
| MpFloatingBulkBar | `v-btn`, `v-chip`, `v-slide-y-transition` (status region) |
| MpDialog | `v-dialog`, `v-card`, `v-divider`, `v-btn`; owns the header/body/footer rhythm, the `headerMinHeight` floor, scroll-edge shadows, `flush` and `#footerStart`. **The one modal shell.** |
| MpFormDrawer | `v-navigation-drawer` (right, `component.drawer.width.*` sm/md/lg), `v-btn`, `v-divider`, focus trap; same header/body/footer contract as MpDialog |
| MpConfirmDialog | composes **MpDialog** at `size="sm"`; `v-btn`, `v-icon` |
| MpMoveToFolderDialog | `v-dialog`, `v-card`, `v-list`, `v-text-field`, `v-btn` (folder form dialog) |
| MpManageFoldersDrawer | composes MpFormDrawer + MpConfirmDialog; `v-list`, `v-select`, `v-text-field` |
| MpFormGrid / MpFormSection / MpFormField | no Vuetify primitive — the form layout, section-heading and composite-label layer added in Phase 6 |
| MpFolderSelect | `v-menu`, `v-list`, `v-btn`, `v-card` |
| MpOptionCard | `v-card`, `v-avatar`, `v-icon` (keyboard-operable role="button") |
| MpStatusToggle | `v-switch` + associated label |
| MpWizardSteps | `v-icon` + custom step chips (`aria-current="step"`) |
| MpRowActionsMenu | `v-menu`, `v-btn` (kebab, required `ariaLabel`), `v-list` slot |
| ModuleLandingPage | MpPageHeader; `v-row`/`v-col`, `v-btn`, `v-progress-linear` |
| MpDaVinciBot (tier P1) | `v-menu`, `v-list`, `v-btn`, `v-tooltip`, `v-divider`; hosts the Dv* copilot surfaces |
| layout/AppBar | `v-app-bar`, `v-text-field`, `v-menu`, `v-btn(-toggle)`, `v-avatar`, `v-badge`, `v-snackbar`, `v-tooltip` |
| layout/AppSidebar | `v-navigation-drawer` (248px/72px rail tokens), `v-list`, `v-menu`, `v-tooltip` |

## Never use raw X — use MpY

| Don't reach for | Use instead | Why |
|---|---|---|
| `v-dialog` for confirm prompts | **MpConfirmDialog** | Standard icon/danger treatment, Escape/backdrop close, a11y labelling wired |
| `v-dialog` for create/edit forms | **MpFormDrawer** | Forms live in the right-side drawer, never modals (house pattern) |
| `v-dialog` for anything else — a picker, a preview, a non-confirm modal | **MpDialog** | The row whose absence let 13 raw dialogs survive to Phase 6. There is no case for a raw `v-dialog` except `AppBar`'s mobile search, which is recorded in-file |
| `mb-*` on a form field | **MpFormGrid** | Spacing between fields belongs to the container; a margin lands on top of the shell's gap |
| a hand-rolled uppercase heading in a form | **MpFormSection** | Seven patterns across ~260 sites before Phase 6 |
| Inline `v-switch` + label in table cells | **MpStatusToggle** | Draft-disable logic + switch/label association built in |
| Hand-rolled selectable cards | **MpOptionCard** | Keyboard operability + selection ring; three wizards already converged on it |
| Per-view kebab `v-menu` in table rows | **MpRowActionsMenu** | Enforced accessible name; consistent trigger + list chrome |
| Custom step chips in wizards | **MpWizardSteps** | Passive 1-based indicator with `aria-current` (EngineEditor's clickable navigator is the documented exception) |
| Bare `v-chip` for workflow states | **MpStatusChip** | Central status→color maps per domain type |
| Ad-hoc "no results" / "failed" markup | **MpEmptyState / MpErrorState** | Consistent semantics: empty = nothing to show, error = something failed (`role="alert"`) |
