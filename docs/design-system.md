# Maropost Design System Reference

> Living documentation of all design tokens, components, patterns, and guidelines.

**Dark mode:** see [`docs/dark-mode/06-theme-architecture.md`](dark-mode/06-theme-architecture.md) for the semantic alias layer, accent bridge, surface hierarchy, deprecated aliases, and fixed-look exceptions. Storybook **Theme** + **Accent** toolbars mirror the app runtime.

---

## Design Tokens

All tokens are defined in `src/design-tokens/tokens.json` and auto-generated into SCSS, CSS, and TypeScript via `npm run tokens:build`. **Never hand-edit** `src/design-tokens/generated/*`.

Generated outputs also include derived `--mp-rgb-*` custom properties for every hex color (used by scrims, alpha mixes, and Vuetify bridges).

### Deprecated aliases (one release)

New code must use semantic names from `mp-theme-aliases.css`:

| Deprecated | Use instead |
|---|---|
| `--surface-0/1/2` | `--surface-canvas/primary/secondary` |
| `--ink`, `--muted` | `--text-primary`, `--text-muted` |
| `--hairline` | `--border-subtle` |
| `--accent`, `--accent-fg`, `--accent-ink`, `--accent-soft` | `--accent-default`, `--accent-on`, `--accent-active`, `--accent-subtle-bg` |

Legacy SCSS injection from `src/styles/tokens.scss` was removed in WP-14 — Vite and Storybook inject `src/design-tokens/generated/_variables.scss` instead.

### Color Palette (Light Theme)

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#1A56DB` | Buttons, links, active states, primary actions |
| `secondary` | `#7E3AF2` | Marketing/journey accents, secondary highlights |
| `success` | `#0E9F6E` | Positive status (Completed, Paid, Shipped) |
| `warning` | `#D97706` | Attention needed (Requires Action, Pending) |
| `error` | `#E02424` | Destructive actions, negative status (Cancelled, Failed) |
| `info` | `#1A56DB` | Informational states (Processing, In Progress) |
| `background` | `#F9FAFB` | Page canvas |
| `surface` | `#FFFFFF` | Cards, drawers, modals |
| `border` | `#E5E7EB` | Card borders, dividers |
| `borderSubtle` | (rgba) | Utility borders (`.border-b` / `.border-t`) |
| `borderTableRow` | (rgba) | `v-data-table` row separators |
| `borderTableHeader` | (rgba) | Table header bottom edge |
| `borderTableFooterDivider` | (rgba) | Line above pagination |
| `borderDividerMuted` | (rgba) | Card & overlay dividers |
| `textPrimary` | `#111928` | Headings, body text |
| `textMuted` | `#6B7280` | Descriptions, secondary text |

### Naming convention

**Primitives are named by their value; roles are named by their job.** `var(--mp-space-12)` is
12px, full stop — no index-to-pixel translation, no "is `md` 12 or 16?". Where the system has
already made a decision, a role token carries it: `var(--mp-component-card-radius)`.

### Spacing Scale — `space.*`

`4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80` on the 4px grid, plus **2px half-steps below 16px**
(`2, 6, 10, 14`). The sub-grid is a recorded decision (DESIGN_AUDIT.md P1-5), not drift: it is
where dense chrome — chip insets, icon gaps, control padding — actually lives.

| Token | Value | Common Usage |
|-------|-------|-------------|
| `space-2` | 2px | Hairline gaps inside dense controls |
| `space-4` | 4px | Tight gaps (icon + text) |
| `space-6` | 6px | Chip insets, compact icon gaps |
| `space-8` | 8px | Small padding, compact lists |
| `space-10` | 10px | Dense control padding |
| `space-12` | 12px | Input padding, chip spacing |
| `space-14` | 14px | Button inline padding |
| `space-16` | 16px | Card padding (compact), section gaps |
| `space-24` | 24px | Page padding, card padding (default) |
| `space-32` | 32px | Section separation |
| `space-48` | 48px | Large section gaps |

### Border Radius — `radius.*`

One scale. It reads concentrically: an outer surface at 16, anything nested inside it at 12,
controls at 10, chips and menu items at 8.

| Token | Value | Usage |
|-------|-------|-------|
| `radius-4` | 4px | Micro-marks, swatches, small badges |
| `radius-8` | 8px | Chips, menu items |
| `radius-10` | 10px | Inputs, dense controls, compact cards |
| `radius-12` | 12px | Menus/popovers, anything nested in a card |
| `radius-16` | 16px | Cards, dialogs, drawers — the default surface |
| `radius-20` | 20px | Large / hero panels |
| `radius-full` | 9999px | Buttons, avatars, pills |

Role aliases into the scale: `component-button-radius` (full), `component-chip-radius` (8),
`component-input-radius` (10), `component-menu-radius` (12), `component-card-radius` (16),
`component-dialog-radius` (16). `component-control-height` (40px) is shared by buttons and fields.

### Typography — `fontSize.*` / `text.*` / `display.*`

- **Font:** Inter, system-ui, -apple-system, sans-serif
- **UI ramp:** `10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 40, 48`. **Body is 14px** — the
  single canonical body size (DESIGN_AUDIT.md P1-2). No fractional sizes exist in the system.
- **Named roles** (`text.*`) — `pageTitle`, `pageSubtitle`, `kpiValue`, `kpiValueHero`,
  `sectionTitle`, `body`, `caption`, `eyebrow`, `metaLabel`, `metaValue`. Every one resolves to a
  stop on the UI ramp. Prefer these over raw sizes.
- **Display** (`display.sm/md/lg/xl` = 32/44/60/80) is a deliberately separate hero ramp for
  marketing and page heroes — never product chrome.
- **Line heights:** tight=1.2 (headings), normal=1.5 (body), loose=1.75 (relaxed)

### Shadows

Use sparingly — flat bordered cards preferred.

| Token | Value | When to use |
|-------|-------|------------|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | Subtle hover lift |
| `shadow-md` | `0 4px 16px rgba(0,0,0,0.08)` | Floating elements (bulk bar, toasts) |
| `shadow-lg` | `0 8px 32px rgba(0,0,0,0.1)` | Modals, popovers |

---

## Components

### MpPageHeader
**Category:** Layout
**File:** `src/components/MpPageHeader.vue`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Page heading |
| `subtitle` | `string` | — | Description below title |
| `breadcrumbs` | `{ title, to?, disabled? }[]` | — | Breadcrumb trail |

**Slots:** `#actions` (right-aligned action buttons), `#tabs` (below header)

---

### MpKpiCard
**Category:** Data Display
**File:** `src/components/MpKpiCard.vue`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Metric name |
| `value` | `string \| number` | required | Large display value |
| `icon` | `string` | — | MDI icon name |
| `color` | `string` | — | Vuetify color name |
| `trend` | `string` | — | Trend text (e.g., "+12.5%") |
| `trendPositive` | `boolean` | — | Green up / red down |
| `subStat` | `string` | — | Small text below trend |

---

### MpStatusChip
**Category:** Data Display
**File:** `src/components/MpStatusChip.vue`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `string` | required | Status text |
| `type` | `'order' \| 'fulfillment' \| 'payment' \| 'campaign' \| 'contact' \| 'ticket' \| 'coupon' \| 'general'` | `'general'` | Domain context for color mapping |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Chip size — heights come from `component.chip.height.*` (20 / 24 / 32). Use `sm` in data tables. |
| `variant` | `'flat' \| 'tonal' \| 'outlined'` | `'tonal'` | Visual style |
| `showIcon` | `boolean` | `false` | Show status-specific icon |

**Color mappings are automatic.** Pass the right `type` and `status` string, and the component handles color + icon.

---

### MpDataTableToolbar
**Category:** Data Display
**File:** `src/components/MpDataTableToolbar.vue`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `searchPlaceholder` | `string` | — | Placeholder for search field |
| `quickFilter` | `{ key, label, icon?, options }` | — | Promotes one filter to a checkbox pill left of search |

**Models:** `v-model:search` (string), `v-model:quickFilterValue` (string[])
**Slots:** `#title`, `#actions` (buttons), `#filter-content` (filter drawer fields)

---

### MpEmptyState
**Category:** Feedback
**File:** `src/components/MpEmptyState.vue`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string` | — | MDI icon |
| `title` | `string` | required | Heading text |
| `description` | `string` | — | Body text |
| `actionLabel` | `string` | — | CTA button text |
| `actionIcon` | `string` | — | CTA button icon |

**Emits:** `@action` (when CTA clicked)

---

### MpFilterTabs
**Category:** Navigation
**File:** `src/components/MpFilterTabs.vue`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `{ label, key, count? }[]` | required | Tab definitions |

**Model:** `v-model` (active tab key string)

---

### MpFloatingBulkBar
**Category:** Feedback
**File:** `src/components/MpFloatingBulkBar.vue`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `count` | `number` | required | Selected item count |

**Emits:** `@clear` (deselect all)
**Slots:** Default (action buttons like Fulfill, Export, Delete)

---

### MpFormDrawer
**Category:** Overlays
**File:** `src/components/MpFormDrawer.vue`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Drawer header |
| `subtitle` | `string` | — | Below title |
| `width` | `number` | `480` | Drawer width in px |

**Model:** `v-model` (boolean open/close)
**Slots:** Default (form content), `#footer` (action buttons)

---

### MpSectionHeader
**Category:** Layout
**File:** `src/components/MpSectionHeader.vue`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Section heading |

**Slots:** `#actions` (right-aligned)

---

## Vuetify Global Defaults

These live in `maropostDefaults` (`src/plugins/maropostTheme.ts`), which `src/plugins/vuetify.ts`
installs. Verified against the source 2026-08-28 — the previous version of this table was wrong on
five rows.

| Component | Defaults |
|-----------|----------|
| `VBtn` | `variant="flat"`; radius, weight, size, `min-height` (`component.control.height`) and padding come from an inline style built from tokens — **not** a `rounded` prop |
| `VCard` | `variant="flat"`, `rounded="lg"`. `border` is **not** defaulted — the containment recipe (`v-card variant="flat" border rounded="lg"` per logical section) requires writing `border` on each card |
| `VTextField` | Outlined variant, comfortable density, auto hide-details, `persistent-placeholder` (locks the label into its floated state — the mechanism behind the static top label). **Visual chrome (border, radius, fill, states, label) is owned by `src/styles/settings-form.scss`, not by these defaults** — see its "Global Outlined Field Baseline" header comment: a **static top label** (Stripe/Polaris pattern; 13px/500 `text.label`, calm on focus and error), transparent fill, 1px `--border-strong` at rest, 2px primary/error border on focus/error with no glow ring, and a size ramp from the `density` prop (compact → sm 32 · comfortable → md 40, the default · default → lg 48). |
| `VSelect` / `VAutocomplete` / `VCombobox` / `VTextarea` / `VNumberInput` | Same as VTextField |
| `VFileInput` | Same, except `active: true` stands in for `persistent-placeholder` (VFileInput has no such prop) |
| `VChip` | `rounded="pill"`, `size="small"`. Inside a field, `settings-form.scss` pins the height to `component.chip.height.md` so a select with chips matches one without (P6-13) |
| `VDataTable` | Fixed header, hover, comfortable density, 15 items/page |
| `VNavigationDrawer` | No elevation |
| `VAppBar` | No elevation |
| `VDialog` | **No defaults, deliberately** — `rounded="xl"` would compute to 24px against the 16px `component.dialog.radius`, and `global.scss` already forces the token with `!important`. Compose `MpDialog`; never a raw `v-dialog` |
| `VDivider` | `opacity: 0.72` |
| `VList` | `elevation: 0`, **`border: true`, `rounded="lg"`** — a bare `v-list` paints as a bordered card. Inside a drawer/dialog/card body that's a nested box: opt out with `:border="false" rounded="0"` (the polish pass does this in MpFormDrawer bodies) |
| `VCheckbox` / `VRadio` / `VRadioGroup` / `VSwitch` / `VSlider` / `VNumberInput` | Comfortable density, `hide-details="auto"`, primary colour — added in Phase 6, so a selection control and a text field share one rhythm |
| `VBtnToggle` | Comfortable density, outlined, divided, primary — one convention where there were three |
| `VChipGroup` | Outlined, primary |
| `VMenu` | `offset: 4` |
| `VTooltip` | `location="top"`, 150ms open delay |

---

## Design Patterns

### Data Table Page
Every list page: MpPageHeader → MpFilterTabs → v-card(MpDataTableToolbar + v-data-table + MpEmptyState) → MpFloatingBulkBar

### Form Drawer
For create/edit: MpFormDrawer with form fields + footer slot (Cancel + Save). The body relies on
the shell's 16px gap — no margins on body children. Anatomy is owned by the shell: h2 title +
labelled close, body-only scroll, sticky footer, focus trap, Escape, focus restore.

### Form grouping (the trio)
`MpFormSection` + `MpFormGrid` (+ `MpFormField` for composite controls only — never around a
plain Vuetify input):

```html
<MpFormSection title="Shipping address" description="Where the order ships.">
  <MpFormGrid :cols="2">
    <v-text-field label="Address line 1" class="mp-form-grid__full" />
    <v-text-field label="City" />
    <v-text-field label="Postal code" />
  </MpFormGrid>
</MpFormSection>
```

Grouped mode (slot content present) renders `<section role="group" aria-labelledby>` so the
fields are programmatically associated with the heading; heading-only mode (no slot) stays a
plain heading for interleaved grids. Rhythm is the container's job: `field.groupGap` (16) within
a group, `field.sectionGap` (24) between groups — a field never sets its own margin. Two columns
only for short related pairs; long inputs get `mp-form-grid__full`.

### Action menu
One pattern, `MpRowActionsMenu`: kebab trigger (accessible name from `ariaLabel` + `itemLabel`,
40px hit target, `aria-haspopup`), `role="menu"` panel opening `bottom end`. Items are
`MpMenuItem` (`title`, `icon?`, `danger?` — `role="menuitem"` baked in) with verb-first titles
and optional leading icons — no descriptions. Destructive actions last, behind
`<v-divider class="my-1" />`, with `danger`. Labeled-button dropdowns keep their trigger but
share the compact panel chrome; pickers/palettes are not menus.

```html
<MpRowActionsMenu ariaLabel="Order actions" :itemLabel="item.order">
  <MpMenuItem title="View order" icon="eye" @click="view(item)" />
  <v-divider class="my-1" />
  <MpMenuItem title="Cancel order" icon="ban" danger @click="confirmCancel(item)" />
</MpRowActionsMenu>
```

### Dashboard Section
MpSectionHeader → content (chart, table, or card grid) inside v-card.

### Status Display
Always use MpStatusChip with the correct `type` prop. Never create custom chips for statuses.

### Empty States
Every table/list MUST have MpEmptyState shown when items.length === 0.

### Destructive Actions
Always confirm with v-dialog: "Are you sure?" + red "Delete" button + "Cancel" button.
