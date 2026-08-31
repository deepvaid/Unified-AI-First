# Maropost Design System — AI Agent Context

> This file is the single entry point for Claude CLI, Cursor, and any AI coding assistant working on this project. Read this first.

## What This Project Is

A **Vue 3 + Vuetify 3 playground** that mirrors the real Maropost SaaS platform (commerce + marketing for merchants, similar to Shopify + Mailchimp). It's used for:

- Rapid UX prototyping with AI coding tools ("vibe coding")
- Design system development and documentation via Storybook
- Stakeholder review via Vercel preview deployments

This is NOT a production app — it uses mock data and has no backend API.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Vue 3 (Composition API, `<script setup>`) | 3.5 |
| UI Library | Vuetify 3 (Material Design 3) | 3.12 |
| Build | Vite | 7.x |
| Language | TypeScript (strict) | 5.9 |
| State | Pinia | 3.x |
| Routing | Vue Router | 5.x |
| Icons | Lucide (`lucide-vue-next`) | 1.x |
| Docs | Storybook 9 (`@storybook/vue3-vite`) | 9.1.x |
| Tokens | Custom build script (zero-dep) | — |

---

## File Structure

```
├── CLAUDE.md                  ← YOU ARE HERE
├── CLAUDE_CODE_PROMPT.md      ← Full product spec (live app observations, data shapes, UX rules)
├── .cursorrules               ← Cursor IDE rules
├── .storybook/                ← Storybook config (main.ts, preview.ts, theme.ts)
├── docs/
│   ├── design-system.md       ← Component API reference + patterns
│   ├── development.md         ← Local dev workflow
│   ├── deployment.md          ← Vercel setup
│   ├── figma-integration.md   ← Token sync with Figma
│   └── personas/              ← 4 merchant personas
├── maropost-screenshots/      ← 50+ screenshots of the real app
├── src/
│   ├── components/            ← 112 components, all with stories (see Component Inventory)
│   │   ├── Mp*.vue / ModuleLandingPage.vue ← 30 top-level design-system components
│   │   ├── layout/            ← AppBar (top bar) + AppSidebar (left nav, collapsible rail)
│   │   ├── copilot/           ← 14 Dv* Da Vinci surfaces + voice/ (7 orbit voice components)
│   │   ├── dashboards/        ← 7 dashboard containers + widgets/ (5) + wizard/ (2)
│   │   ├── marketing/         ← Journey flow column, mini preview, add-step menu
│   │   ├── merchandising/     ← MerchProductCard
│   │   └── settings/          ← SettingsSection, SettingsPlaceholder, settingsMenu (rail = MpSectionRail)
│   ├── design-tokens/
│   │   ├── tokens.json        ← SOURCE OF TRUTH for all design values
│   │   ├── build.mjs          ← Generates SCSS/CSS/TS from tokens.json
│   │   └── generated/         ← Auto-generated (do not edit)
│   │       ├── _variables.scss
│   │       ├── variables.css
│   │       └── tokens.ts
│   ├── views/                 ← 80+ page views across 10 modules
│   │   ├── Analytics/         ← 13 report views
│   │   ├── Commerce/          ← SalesOrders, DraftOrders, Fulfillments, Coupons, StoreSetup
│   │   ├── Contacts/          ← AllContacts, Lists, Segments, Fields, Tags, SQL, etc.
│   │   ├── DaVinci/           ← AI dashboard + studio
│   │   ├── Integrations/
│   │   ├── Marketing/         ← Campaigns, Journeys, JourneyBuilder, Forms, Content, etc.
│   │   ├── Products/          ← ProductsList, Inventory, Recommendations, TaxCategories
│   │   ├── Service/           ← Tickets
│   │   └── Settings/          ← Settings, Billing, Users, Profile
│   ├── stores/                ← 6 Pinia stores with mock data
│   ├── plugins/vuetify.ts     ← Vuetify theme (light + dark) + global defaults
│   ├── router/index.ts        ← All routes (90+)
│   └── styles/
│       ├── global.scss        ← Global overrides, utilities, hover effects
│       └── app-styles.ts      ← Shared stylesheet manifest (app + Storybook)
├── vercel.json                ← One-click deploy config
└── package.json
```

---

## Component Inventory

35 top-level components (counts refreshed 2026-08-31). **Full reference:**
`docs/design-system/` (structure, Vuetify mapping, token plan, handoff) + Storybook autodocs (`npm run storybook`).

### Layout & structure

- **MpPageHeader** — `title`, `subtitle?`, `backTo?`, `level?`, `density?`, `eyebrow?`, `emphasis?` ('default'|'prominent') · slots `#actions`, `#tabs`. Every page's top section; `backTo` renders the back link on detail pages; `emphasis="prominent"` is the two-tone display masthead used on module landing pages.
- **MpSectionHeader** — `title`, `headingLevel?` · slot `#actions`. Section headings inside dashboard cards.
- **ModuleLandingPage** — `title`, `childPages`, `primaryActions?`, `quickActions?`, `recentActivity?`, `setupCard?`, `daVinciCard?`. Prop-driven module landing (Marketing/Content).

### Data display

- **MpKpiCard** — `label`, `value`, `icon?`, `color?`, `trend?`, `trendPositive?`, `subStat?`, `period?` · slot `#sparkline`. Dashboard metric cards, 4-column row.
- **MpStatusChip** — `status`, `type?` ('order'|'fulfillment'|'payment'|'campaign'|'contact'|'ticket'|'coupon'|'general'), `size?` ('sm'|'md'|'lg'), `variant?` ('tonal'|'flat'|'outlined'), `showIcon?`. Workflow states in tables; color maps are automatic per type. Use `size="sm"` in data tables.
- **MpSourceCloudChip** — `dataSource`, `size?` ('sm'|'md'|'lg'), `iconOnly?`. Identifies a widget/KPI's source cloud.
- **MpListRow** — `title?`, `eyebrow?`, `meta?`, `variant?` ('plain'|'divided'|'boxed'), `emphasis?`, `density?`, `to?`/`href?`/`clickable?` · slots `#lead`, default, `#trailing`. The one list-row geometry — activity feeds, checklists, suggestion menus. Resolves its own tag from whichever target prop is set. Never hand-roll a repeating row.
- **MpDataTableToolbar** — `searchPlaceholder?`, `activeFilters?`, `totalCount?`, `headers?`, `quickFilter?` ({ key, label, icon?, multiple?, options }) · models `v-model:search`, `v-model:quickFilterValue` · slots `#title`, `#actions`, `#filter-content` (filter drawer). Always above `v-data-table`. `quickFilter` promotes one high-traffic filter to a checkbox pill at the **head of the control row, before the Filter button** — the long tail stays in the drawer, and the consumer still owns filtering, its `activeFilters` entry and clearing the model. `multiple: false` makes it an exclusive mode toggle (list panel, no Clear, closes on pick, model holds exactly one value). The Filter button badges `activeFilters` minus the promoted key; when the promoted filter was the table's only one, drop `#filter-content` and the Filter button goes with it. Every control in the row is `component.control.height` (40) — give a new one the token, not a number.
- **MpFolderSelect** — `folders`, `counts?`, `totalCount?`, `label?` · emits `manage`. Folder filter menu above foldered lists.

### Feedback

- **MpAlert** — `tone?` ('info'|'success'|'warning'|'error'), `title?`, `live?` ('off'|'polite'|'assertive', auto by tone), `dismissible?`, `icon?` (string|false) · emits `dismiss` · slots default (body), `#actions`. **The one in-page feedback block** — rounded, borderless soft fill on the semantic container pairs, enforced role/aria-live. **Never a raw `v-alert` in new code.** Transient = `useToast`; frame-wide = `MpBanner`; whole-surface failure = `MpErrorState`.
- **MpBanner** — `tone?` (same 4), `message?` (or default slot), `icon?` (string|false), `dismissible?`, `dismissLabel?` · emits `dismiss` · slot `#actions`. **The full-width edge strip** (square, bottom hairline, `component.banner.minHeight` 44) — mounts at the top of `<v-main>` or a page region. PlgTrialBanner composes it. Alert = in-page block · banner = edge strip; don't swap.
- **MpChatBubble** — `side?` ('start'|'end'), `tone?` ('neutral'|'accent'|'solid'), `author?`, `time?`, `loading?` · slots `#avatar`, default (pre-wrap body), `#footer`. **The one transcript message** on `component.bubble.*`; side and tone are independent axes (the Tickets thread left-aligns both roles, tint carries the role). Re-skin via the `--mp-bubble-*` custom-prop seam, never `:deep`. Merchant-chrome simulations (chatbot widget preview, SMS phone mock) and the flagship Da Vinci bot stay bespoke.
- **MpEmptyState** — `title`, `icon?`, `description?`, `actionLabel?`, `actionIcon?`, `headingLevel?`, `variant?` ('stack'|'launcher'), `emphasis?` ('default'|'prominent'), `illustration?`, `tone?` ('neutral'|'error') · emits `action`. Every table/list MUST have one (empty = nothing to show).
- **MpErrorState** — composes `MpEmptyState` with `role="alert"`, the error tone and retry defaults. Error = something failed; don't merge with empty states.
- **MpFloatingBulkBar** — `count`, `total?` · emits `clear` · default slot (actions). Shows on row selection; auto-hides at 0.
- **MpTableSkeleton** — `rows?`, `columns?`, `showHeader?`. Loading placeholder inside table cards.
- **MpComingSoonTiles** — `icon`, `title`, `description?`, `tiles` ({ icon, title, desc }[]), `smCols?`, `mdCols?`, `headingLevel?`. "Planned, not built yet" panel. Coming-soon = the surface doesn't exist yet; don't use it where `MpEmptyState` belongs.

### Forms & selection

- **MpFormDrawer** — `title`, `subtitle?`, `size?` ('sm'|'md'|'lg' → 440/480/640), `guarded?` · model `v-model` · emits `close` · slots default, `#footer`, `#footerStart`. Right-side drawer for create/edit forms. Never `v-dialog` for forms. Shares MpDialog's header/body/footer contract exactly.
- **MpFormGrid** — `cols?` (1|2) · slot default. **The one form layout container.** Its gap *is* the field rhythm (`component.field.groupGap`); child classes `mp-form-grid__full` (span both columns) and `mp-form-grid__trailing` (field + trailing icon button in its own fixed `control.height` track, so the input's right edge still lands on the form's right edge). A field never sets its own margin.
- **MpFormSection** — `title`, `description?`, `required?`, `headingLevel?` (3). **The one in-form section heading** ("GENERAL", "EXPIRATION DATE"). Owns the space above and below itself via `component.field.sectionGap`. Replaced seven hand-rolled patterns.
- **MpFormField** — `label`, `required?`, `hint?`, `error?` · slot default exposes `{ labelId, descriptionId }`. Label + hint/error + aria for **composite** controls only (chip groups, radio groups, tile pickers). **Never wrap a Vuetify input** — those own their own label via the `label` prop, which renders as an identical static top label.
- **MpOptionCard** — `selected?`, `title`, `description?`, `icon?`, `to?`/`href?`, `headingLevel?` · slots default, `#title-append`, `#media`. The chooser-gallery card in two modes (resolve-your-own-tag): pass `selected` for a keyboard-operable toggle (wizard select-then-commit galleries); pass `to`/`href` for a real link (click-to-go choosers) — never `:selected="false"` to fake a plain card.
- **MpSegmentedControl** — `modelValue` (v-model, `string | null`), `items` ({ value, label?, icon?, disabled?, tooltip? }[]), `size?` ('sm'|'md', md = `control.height`), `mandatory?` (default true), `ariaLabel` (required). **The one segmented toggle** — padded track + pill segments on `component.segmented.*`. An `icon` makes a segment icon-only (square) and its `label` becomes the `aria-label`. **Never a raw `v-btn-toggle` for a new switcher** — the global normalization only keeps legacy sites presentable.
- **MpStatusToggle** — `status` ('Active'|'Paused'|'Draft') · emits `toggle`. Status switch + label cell; disabled on Draft.
- **MpManageFoldersDrawer** — `scope`, `counts?` · emits `deleted`. Folder CRUD drawer (composes MpFormDrawer).
- **MpMoveToFolderDialog** — `scope`, `currentFolderId`, `itemLabel?` · emits `move`. Move-to-folder form dialog.

### Navigation

- **MpFilterTabs** — `tabs` ({ label, key, count? }[]), `ariaLabel?`, `controlsId?` · model `v-model` (active key). Tab filtering above data tables.
- **MpSectionRail** — **the one in-content rail** (Settings, Retail, Merchandising and the store editor all compose it; a bespoke `SettingsSidebar` was deleted in Phase 4). `ariaLabel` (required), `groups` ({ title?, items: { slug, label, icon?, to, match?, count?, external? }[] }[]), `title?`, `backTo?`/`backLabel?`, `identity?` ({ name, caption?, icon? }), `switcherOptions?`/`switcherLabel?`, `searchable?`/`searchPlaceholder?` · slot `#footer` · emits `switch`. In-content 260px section rail for shell layouts (store editor, Settings-style workspaces); active = `route.name` ∈ item.match. The global AppSidebar auto-minimizes while a rail shell is on screen (route meta `railShell`/`storeEditor`).
- **MpWizardSteps** — `steps` (string[]), `current` (1-based). Passive wizard step indicator with `aria-current`.

### Overlays

- **MpDialog** — `title`, `subtitle?`, `eyebrow?`, `icon?`, `tone?` ('neutral'|'error'), `size?` ('sm'|'md'|'lg'), `fullscreen?`, `persistent?`, `flush?`, `guarded?` · model `v-model` · emits `close` · slots default, `#lead`, `#headerActions`, `#footer`, `#footerStart`. **The one modal shell.** Header / body / footer all on `component.dialog.padding`; the body is a flex column on `component.dialog.gap`, so form fields are spaced by the shell. This is what "never raw `v-dialog`" means — compose this. The header has a `headerMinHeight` floor so the band does not jump when the subtitle is absent, and it is a grid so the close button sits on the *title's* optical centre. `flush` is the supported way to drop the body inset — never `:deep(.mp-dialog__body)`.
- **MpConfirmDialog** — model `v-model`, `title`, `message`, `confirmLabel?`, `danger?`, `consequences?` · emits `confirm`. Composes `MpDialog` at `size="sm"`. All confirm prompts (destructive → `danger`).
- **MpRowActionsMenu** — `ariaLabel` (required), `itemLabel?` · default slot (`MpMenuItem`s). Kebab row-actions menu for list views: `role="menu"` panel opening `bottom end`, 40px trigger hit-area, click-swallowing trigger.
- **MpMenuItem** — `title`, `icon?`, `danger?`. The one action-menu item (`v-list-item` with `role="menuitem"` baked in; attrs/slots pass through). Destructive = `danger`, last, behind `<v-divider class="my-1" />`. Never a raw `v-list-item` in an action menu.
- **MpNotificationsMenu** — no props, store-driven (`useNotifications`): bell trigger whose unread badge **wraps** the button (the app's v-badge convention, capped 99+), `aria-haspopup="dialog"` panel of notification rows mirroring the real UAT centre — **one generic icon** (the real feed has no classification; never invent severity here), absolute timestamps, a download action on report/export rows, See all (→ the `/accounts/:id/notifications` page) + Mark-all-read, `MpEmptyState` when caught up. The row is the shared `notifications/NotificationRow` (panel + page). One per app frame; attrs fall through to the bell (`class="appbar-action-btn"`). Transient confirmations stay `useToast`'s job.

### AI

- **MpDaVinciBot** — `initialChatMode?`, `initialMessages?`, `subtitle?`, `headerless?` · emits `close`, `expand`. Da Vinci copilot surface hosting the `copilot/` Dv* components.

---

## Coding Conventions

### Component Creation
1. Create `src/components/MpComponentName.vue` with `<script setup lang="ts">`
2. Type all props with `defineProps<T>()` and defaults with `withDefaults()`
3. Type all emits with `defineEmits<T>()`
4. Use scoped styles: `<style scoped>`
5. Write a co-located story: `MpComponentName.stories.ts`

### Prop vocabulary (settled in Phase 2, P2-1 / P2-7 — do not invent a third)

- **`size`** — always `'sm' | 'md' | 'lg'`, default `'md'`. Never Vuetify's
  `x-small|small|default` in a public API; map to it internally if the component wraps a
  Vuetify control.
- **`emphasis`** — always `'default' | 'prominent'`. This is the *only* visual-weight prop.
  Reach for it before inventing `display`, `expressive`, `hero`, `primary/secondary`.
- **`variant`** — reserved for genuinely different **structures**, with values named after the
  structure (`MpEmptyState` is `'stack' | 'launcher'`, `MpListRow` is
  `'plain' | 'divided' | 'boxed'`). If the only difference is weight, it is `emphasis`, not
  a variant.
- **`density`** — `'default' | 'compact'` for vertical rhythm.
- **`tone`** — two vocabularies, **deliberately not reconciled** (2026-08-31): surface-state
  tone `'neutral' | 'error'` on `MpDialog`/`MpEmptyState` (is this surface in an error state)
  vs feedback-severity tone `'info' | 'success' | 'warning' | 'error'` on `MpAlert`/`MpBanner`.
  They answer different questions — don't "unify" them.

### Composition

Molecules compose atoms; they do not re-implement them. Before writing button, card, chip or
list-row CSS in a molecule, use `v-btn`, `v-card`, `MpStatusChip` or **`MpListRow`**. Empty and
error surfaces compose `MpEmptyState` (`MpErrorState` is a thin wrapper over it, adding
`role="alert"` and the error tone).

Complex components compose those in turn. **Never a raw `v-dialog`** — compose `MpDialog`
(centred modals) or `MpFormDrawer` (create/edit forms); they share one `component.dialog.*`
rhythm so a modal and a drawer cannot drift apart. **Never a hand-rolled rail** — compose
`MpSectionRail`. **Never a hand-rolled repeating row** — compose `MpListRow`.

### Styling Rules
- **Never hardcode** colors, spacing, radius, or shadows — use Vuetify utilities or design tokens
- **One mechanism per layer**: Vuetify utilities in *templates* (`pa-4`, `ga-3`, `text-medium-emphasis`);
  `var(--mp-*)` tokens in *CSS*. Never a raw px literal in either. Don't mix the two for the same
  property on the same element
- **Always** use `<style scoped>` (never global styles in components)
- **Prefer** Vuetify utility classes (`d-flex`, `pa-4`, `gap-3`, `text-medium-emphasis`)
- **Cards**: Always `flat border rounded="lg"` (no elevation shadows)
- **Buttons**: `text-transform: none` (already set in Vuetify defaults)
- **Font**: Inter (already configured globally)
- **Global stylesheets**: add to `src/styles/app-styles.ts` (the shared manifest), never directly to `src/main.ts` or `.storybook/preview.ts` — this keeps Storybook rendering identical to the app. See `.claude/rules/global-styles.md`

### Icon Usage
Icons are rendered via `lucide-vue-next` through a custom Vuetify icon set (`src/plugins/lucideIcons.ts`).

Use Lucide icon names in kebab-case wherever Vuetify accepts an icon string:
```html
<v-icon>settings</v-icon>
<v-btn prepend-icon="plus">Create</v-btn>
<v-text-field prepend-inner-icon="search" />
```

The name maps to the PascalCase Lucide export: `settings` → `Settings`, `chevron-down` → `ChevronDown`.
Browse icons at [lucide.dev/icons](https://lucide.dev/icons).

**Do not** use `mdi-*` strings for new code — they are only kept as a temporary fallback in the icon bridge.

### Data Table Pattern
Every data table page follows this structure:
```
MpPageHeader (with breadcrumbs + action button)
  └── MpFilterTabs (All / Status1 / Status2)
  └── v-card flat border
        └── MpDataTableToolbar (search + filters + actions)
        └── v-data-table (with custom cell templates)
        └── MpEmptyState (when items.length === 0)
  └── MpFloatingBulkBar (when selections > 0)
```

### Form Pattern
```
v-btn @click="drawer = true"  → opens MpFormDrawer (or MpDialog for a short centred form)
  └── MpFormSection  title="General"
  └── MpFormGrid :cols="2"
        ├── bare Vuetify fields — no margins, no variant/density, `label` prop (renders as a static top label)
        ├── .mp-form-grid__full      → a field that spans both columns
        ├── .mp-form-grid__trailing  → a field + its delete button
        └── MpFormField              → a chip group / radio group / tile picker
  └── #footerStart slot: Back or Clear all   (optional)
  └── #footer slot: secondary then primary, right-aligned
```

**Spacing between fields is never a field's job.** The container owns it: the shell body and
`MpFormGrid` both gap on `component.field.groupGap` (16), `MpFormSection` adds `sectionGap` (24)
around a heading. An `mb-4` on a field inside a shell body lands *on top of* the shell's gap and
renders 32 — 275 of those were deleted in Phase 6.

**One label strategy, zero exceptions.** Vuetify's `label` prop names every input; the global
baseline (settings-form.scss) renders it as a **static top label** — 13px/500 `text.label` in
`--text-secondary`, `labelGap` (6) above the box, calm on focus *and* error (the 2px border and
the message carry the state). Placeholders are example values only, always visible while the
field is empty, and never repeat the label. The required mark is one pattern — a trailing ` *`
in the label text, or `required` on `MpFormField` / `MpFormSection` — and never lives inside a
placeholder. A control with no label of its own gets `MpFormField`, which renders the identical
label and wires `aria-labelledby` / `aria-describedby`; a Vuetify input is never wrapped,
because it already does both. Chrome (toolbar searches, table-cell editors, chat composers) uses
`placeholder` + `aria-label` instead — no label means no headroom, so it stays flush in a 40px
control row.

**Readonly and success are opt-in classes** (no Vuetify root class exists for either):
`class="mp-field-readonly"` beside the `readonly` prop (secondary fill, subtle hairline, value
stays primary — distinct from disabled), and `class="mp-field-success"` for validated-good
fields (2px success border + green message; pair with `append-inner-icon="circle-check"`;
error always wins). A `counter="N"` is always paired with a max-length rule — the counter only
reddens when a rule invalidates the field. Prefix/suffix affixes render muted; there is
deliberately no boxed-addon segment style.

**Field sizes are the `density` prop.** One ramp, `component.field.height`:
`density="compact"` → sm 32 · the default (`comfortable`) → md 40, equal to `control.height` so
a field and a button align · `density="default"` → lg 48. Forms use md; sm is for genuinely
dense chrome, lg for spacious marketing-style surfaces.

**Don't restate the theme defaults.** `variant="outlined"`, `density="comfortable"`,
`color="primary"` and `persistent-placeholder` are defaults on every field *and* (minus variant)
on the selection controls. `hide-details` defaults to `"auto"`, which reserves no height when
there is no message — setting it bare permanently suppresses validation, so keep it only for a
dense toolbar filter and say so in a comment. Textarea height comes from `rows` (3 normal,
5 long-form), never CSS.

### Status Chip Usage
Always use `MpStatusChip` for status columns. Pass the correct `type` prop:
- Orders table: `type="order"` for order status, `type="fulfillment"` for fulfillment, `type="payment"` for payment
- Campaigns table: `type="campaign"`
- Tickets: `type="ticket"`

---

## Design Tokens

All design values live in `src/design-tokens/tokens.json`. Run `npm run tokens:build` to regenerate outputs.

**Naming convention:** primitives are named by their **value**, roles by their **job**.
`var(--mp-space-12)` is 12px; `var(--mp-component-card-radius)` is whatever a card should be.
Reach for a role token when the system has already made the decision, a primitive otherwise.

**Key values** (regenerated from tokens.json, 2026-08-28):
- Spacing `space.*` → 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64, 80
  (4px grid from 16px up; 2px half-steps below it)
- Radius `radius.*` → 4, 8, 10, 12, 16, 20, `full` (9999px). **The four corner families are one
  deliberate concentric system** (P2-6, confirmed not a drift): 16 outer surfaces · 12 nested ·
  10 controls/inputs · 8 chips and menu items · 4 micro-marks · `full` for buttons and pills.
  Prefer the role alias (`--mp-component-card-radius`) over the primitive where one exists
- Font size `fontSize.*` → 10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 40, 48.
  **Body is 14px.** Hero sizes live in `display.*`; named roles in `text.*`
- Roles `component.*` → `control.height` 40px · `button.radius` full ·
  `chip.radius` 8 · `input.radius` 10 · `menu.radius` 12 · `card.radius` 16 · `dialog.radius` 16
- **Menus** `component.menu.*` → `radius` 12 · `minWidth` 180 · `itemHeight` 36 · `itemPaddingBlock` 6.
  **Menus are deliberately denser than in-page rows** (36 vs `listItem.minHeight` 40 — transient
  chrome, not content; decided 2026-08-31). The global popover rule applies it to every v-menu
  overlay including select/autocomplete option lists; heights are floors, two-line rows grow.
  Don't "unify" this back to 40 — the split is the design
- **Segmented** `component.segmented.*` → `height` sm 32 / md 40 (= `control.height`) ·
  `itemHeight` sm 24 / md 32 · `padding` 4 · `radius` full. Consumed by `MpSegmentedControl` only
- **Banners** `component.banner.minHeight` → 44 (between `control.height` 40 and the 48 table
  row floor). Consumed by `MpBanner`
- **Chat bubbles** `component.bubble.*` → `maxWidth` 88% · `paddingBlock` 10 · `paddingInline` 14 ·
  `radius` 12 · `tailRadius` 4 · `gap` 6. Consumed by `MpChatBubble`
- **Card insets** `component.card.*` → `padding` 20 (the standard) · `paddingCompact` 12 ·
  `paddingSpacious` 32 · `gap` 16 · `gapCompact` 8. **Use these, not a `pa-*` utility, on a
  card root.** A card needing a fourth value is a design bug, not a token gap
- **List rows** `component.listItem.*` → `minHeight` = `control.height` (40) · `paddingBlock` 8 ·
  `paddingInline` 12 · `gap` 12. A row, a button and a form field share one baseline
- **Form groups** `component.field.*` → `labelGap` 6 · `groupGap` 16 · `hintGap` 4 ·
  `sectionGap` 24 · `height.{sm,md,lg}` 32/40/48 (mapped from the `density` prop; md =
  `control.height`) · `labelHeight` 18 (the static top label's line box — a labelled field
  reserves `labelHeight + labelGap` of headroom). `groupGap` is what `MpFormGrid` gaps on;
  `sectionGap` is the air `MpFormSection` puts around a heading
- **States** `component.state.*` → `padding` 32 · `paddingProminent` 48 · `gap` 8 ·
  `minHeight` 240 · `minHeightProminent` 320 · `measure` 420 · `measureWide` 480 · `iconDisc` 80
- **Chips** `component.chip.height.{sm,md,lg}` → 20 / 24 / 32 · `paddingInline` 8
- **Tables** `component.table.*` → `rowMinHeight` 48 · `headerMinHeight` = `control.height` (40) ·
  `cellPaddingBlock` 14 · `cellPaddingInline` 16 · `cellPaddingInlineCompact` 8 ·
  `headerPaddingBlock` 8. The two heights are **floors, not caps** — a row holding a real control
  grows past them
- **Dialogs** `component.dialog.*` → `radius` 16 · `padding` 20 (all three bands) ·
  `paddingCompact` 16 (below `layout.breakpointCompact`) · `gap` 16 (body field rhythm) ·
  `headerGap` 8 · `footerGap` 8 · `headerMinHeight` 88 · `width.{sm,md,lg}` 440 / 640 / 880.
  Shared by `MpDialog` **and** `MpFormDrawer`; `headerMinHeight` is a **floor, not a cap** — an
  eyebrow header grows past it
- **Drawers** `component.drawer.width.{sm,md,lg}` → 440 / 480 / 640, default md. Everything else
  about a drawer is `component.dialog.*`; only the width ramp differs. `layout.drawerWidth` is a
  legacy alias for the md stop
- **Toolbars** `component.toolbar.*` → `minHeight` 64 · `searchWidth` 300 · `searchMinWidth` 240
- **Nav** `component.nav.*` → `itemRadius` 8 · `groupGap` 16 · `activeBarInset` 6. Item height,
  padding and gap come from `component.listItem.*` — there is no second nav sizing scale
- **Widget actions** `component.widget.*` → `actionSize` 32 · `actionGap` 2 · `actionInset` 12.
  Widget *insets* come from `component.card.*`; this group is only the floating action overlay
- Colors: light theme primary `#0073AB`, secondary `#1a1814`, background `#f4f6fa` (dark theme
  under `color.dark.*`). **Every surface token has a declared foreground — see below**
- Shadows: sm (1px), md (4px), lg (8px) — use sparingly, prefer border
- Layout: sidebar 248px, rail 72px, section rail 260px, appbar 60px, drawer 480px, content max 1280px

### Colour pairing (non-negotiable)

**Naming convention: `on<Surface>`.** Material-style, matching the `onPrimary` /
`onSurfaceVariant` / `on*Container` names already in the file. Do not invent a second vocabulary
(`text-on-*`, `*-fg`, `*-ink` for new pairs).

**If an element sets a background, it sets a colour.** Never let text, an icon or a border on a
painted surface inherit its colour from an ancestor — that is exactly how dark text lands on a dark
surface when a theme flips. The pairs:

| Surface | Foreground |
|---|---|
| `--surface-*` (the whole ladder) | `--on-surface` · `--on-surface-muted` |
| `--ink-panel-bg` | `--ink-panel-fg` · `--ink-panel-muted-fg` · `--ink-panel-accent` |
| `--accent-default` / `--accent-container` | `--accent-on` / `--accent-on-container` |
| `--pos` / `--neg` / `--warn` | `--on-pos` / `--on-neg` / `--on-warn` |
| `--pos-soft` / `--neg-soft` / `--warn-soft` | `--pos-ink` / `--neg-ink` / `--warn-ink` |
| Vuetify `primary` / `success` / `error` / `warning` | `on-primary` / `on-success` / … |

`MpFloatingBulkBar` is the reference implementation; `sidebar-dark.css` is the reference for a
skin. **Never fix contrast by nudging a colour inside a component** — fix the token pair, then apply
it. If a pair cannot reach its ratio without changing brand colour, flag it rather than guessing.

**Verify with `npm run contrast:check`** (`scripts/check-contrast.mjs`). It reads the
`$contrastPairs` manifest in `tokens.json` and computes WCAG 2.1 ratios: 4.5:1 for text, 3:1 for
icons/large text/UI. Adding a surface token means adding its pair to that manifest. Levels
`decorative` and `disabled` are measured but never fail; `controlBoundary` (interactive-component
boundaries such as form-field borders) is enforced at 3:1. Chart series ramps and brand gradients are deliberately out of scope — see the Phase 5.5
changelog in `DESIGN_AUDIT.md`.

---

## NPM Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run storybook` | Start Storybook on :6006 |
| `npm run build-storybook` | Build Storybook to dist-storybook/ |
| `npm run tokens:build` | Generate SCSS/CSS/TS from tokens.json |
| `npm run contrast:check` | WCAG 2.1 ratios for every declared surface/foreground token pair |
| `npm run tokens:watch` | Watch tokens.json and regenerate on save |
| `npm run type-check` | Run vue-tsc type checking |
| `npm run preview` | Preview production build locally |

---

## Git Conventions

**Branch naming:** `feature/`, `fix/`, `docs/`, `refactor/`
**Commit format:** `[type]: description`
**Types:** `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`

Example: `[feat]: add MpDateRangePicker component with story`

---

## Key References

- `CLAUDE_CODE_PROMPT.md` — Full product spec with live app data shapes, UX pain points, anti-patterns
- `maropost-screenshots/` — 50+ screenshots of every real app section
- `docs/personas/` — Merchant personas for UX decisions
- `docs/design-system.md` — Living component + token reference

---

# Marobase Design System — Working Rules

## What this is

Marobase is Maropost's design system, compliant with Liquid Sky. It currently has ZERO consumers. There are no backwards-compatibility constraints. Optimize for the ideal API and cleanest output, not for preserving existing code.

## Non-negotiable rules

- All spacing, sizing, radius, and color values MUST use design tokens. Never introduce a new hardcoded px/rem value. If a token is missing, add it to the token file first, then use it.
- Aesthetic bar: minimal and calm. Fewer borders, more whitespace, one accent color, consistent radius from the token scale. When in doubt between two paddings, pick the more generous one.
- Every component's stories follow the same template: Default, all variants in one grid story, all sizes in one grid story, states (hover / focus / disabled / error where relevant).
- Story hierarchy: **Foundations / Atoms / Molecules / Patterns**, plus **Product** — see below.
  Nothing else may become a top-level bucket.
- Delete dead code, unused variants, and commented-out blocks rather than preserving them.
- Log every rename or breaking change in the session changelog.

## Story hierarchy

Five top-level buckets, and only these five. The tier a component belongs to is decided by one rule:

> **Atom** — a single control or mark: no internal regions, no `Mp*` dependency.
> **Molecule** — has internal regions (header/body/footer, trigger+panel) **or** composes another `Mp*`.
> **Pattern** — a reusable multi-component composition or app shell.
> **Product** — a surface specific to one Maropost feature area.

**Why Product exists (Phase 5 decision, 2026-08-28).** The four design-system tiers were the
original rule, but 77 of 123 stories are feature surfaces — Da Vinci, Dashboards, Marketing,
Merchandising, PLG, RBAC, Sales Channels — that are *not* reusable patterns. Filing them under
`Patterns/` would have buried the 10 that are. `Product/` keeps the design-system tiers honest and
signals "reference, not API" to anyone reading the sidebar. Logged in the Phase 5 changelog in
`DESIGN_AUDIT.md`.

`Foundations/Overview` and `Introduction` are MDX pages (`src/stories/**/*.mdx`); everything else is
CSF. The order is set once in `.storybook/preview.ts` → `storySort`.

**No per-story dark clones.** The toolbar **Theme** global flips every story; a `DarkMode` twin of a
story is duplicated sidebar noise. The only exceptions are stories where the dark *palette itself* is
the subject (`Foundations/Colors`) or where dark is a different axis entirely (the `data-sidebar`
skins).

**Shared story helpers** live in `src/stories/`: `storyTemplate.ts` (the Variants/Sizes/States grid
renderer), `fixtures.ts` (realistic data), `decorators.ts` (the `measure` scale, `surfaceFrame`,
`railFrame`, `sidebarSkin`). Reach for these before writing another inline wrapper `<div style="…">`.

## Token discipline

- Use Glob and Grep before opening files. Never read `node_modules`, `dist`, `build`, or lockfiles.
- `DESIGN_AUDIT.md` at repo root is the source of truth for findings. Read it at the start of every fix session. Check off items as done.
