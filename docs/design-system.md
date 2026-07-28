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

### Spacing Scale

| Token | Value | Common Usage |
|-------|-------|-------------|
| `spacing-1` | 4px | Tight gaps (icon + text) |
| `spacing-2` | 8px | Small padding, compact lists |
| `spacing-3` | 12px | Input padding, chip spacing |
| `spacing-4` | 16px | Card padding (compact), section gaps |
| `spacing-6` | 24px | Page padding, card padding (default) |
| `spacing-8` | 32px | Section separation |
| `spacing-12` | 48px | Large section gaps |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `borderRadius-sm` | 4px | Chips, small badges |
| `borderRadius-md` | 8px | Buttons, inputs, chips |
| `borderRadius-lg` | 12px | Cards, dialogs |
| `borderRadius-xl` | 16px | Large cards, modals |
| `borderRadius-full` | 9999px | Avatars, pills |

### Typography

- **Font:** Inter, system-ui, -apple-system, sans-serif
- **Heading sizes:** 2xl=28px/700, xl=22px/600, lg=18px/600, body=14px/400, sm=12px/500, xs=11px/400
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
| `size` | `'x-small' \| 'small' \| 'default'` | `'small'` | Chip size |
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

**Model:** `v-model:search` (string)
**Slots:** `#filters` (dropdowns, date pickers), `#actions` (buttons)

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

These are set in `src/plugins/vuetify.ts` and apply everywhere:

| Component | Defaults |
|-----------|----------|
| `VBtn` | `rounded="lg"`, no uppercase, font-weight 500, Inter font |
| `VCard` | `rounded="xl"`, flat variant, bordered |
| `VTextField` | `rounded="lg"`, outlined variant, auto hide-details |
| `VSelect` | Same as VTextField |
| `VChip` | `rounded="md"` |
| `VDataTable` | Fixed header, hover, comfortable density, 15 items/page |
| `VNavigationDrawer` | No elevation |
| `VAppBar` | No elevation |
| `VDialog` | `rounded="xl"` |
| `VDivider` | Full opacity |

---

## Design Patterns

### Data Table Page
Every list page: MpPageHeader → MpFilterTabs → v-card(MpDataTableToolbar + v-data-table + MpEmptyState) → MpFloatingBulkBar

### Form Drawer
For create/edit: MpFormDrawer with form fields + footer slot (Cancel + Save).

### Dashboard Section
MpSectionHeader → content (chart, table, or card grid) inside v-card.

### Status Display
Always use MpStatusChip with the correct `type` prop. Never create custom chips for statuses.

### Empty States
Every table/list MUST have MpEmptyState shown when items.length === 0.

### Destructive Actions
Always confirm with v-dialog: "Are you sure?" + red "Delete" button + "Cancel" button.
