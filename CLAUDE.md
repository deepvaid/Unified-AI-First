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
│   ├── components/            ← 65 components, all with stories (see Component Inventory)
│   │   ├── Mp*.vue / ModuleLandingPage.vue ← 23 top-level design-system components
│   │   ├── layout/            ← AppBar (top bar) + AppSidebar (left nav, collapsible rail)
│   │   ├── copilot/           ← 13 Dv* Da Vinci surfaces + voice/ (7 orbit voice components)
│   │   ├── dashboards/        ← 7 dashboard containers + widgets/ (5) + wizard/ (2)
│   │   ├── marketing/         ← Journey flow column, mini preview, add-step menu
│   │   ├── merchandising/     ← MerchProductCard
│   │   └── settings/          ← SettingsSidebar, SettingsSection, SettingsPlaceholder
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
│       └── tokens.scss        ← Legacy SCSS tokens (being replaced by design-tokens/)
├── vercel.json                ← One-click deploy config
└── package.json
```

---

## Component Inventory

23 top-level components (post design-system program, 2026-07). **Full reference:**
`docs/design-system/` (structure, Vuetify mapping, token plan, handoff) + Storybook autodocs (`npm run storybook`).

### Layout & structure

- **MpPageHeader** — `title`, `subtitle?`, `backTo?`, `level?`, `density?` · slots `#actions`, `#tabs`. Every page's top section; `backTo` renders the back link on detail pages.
- **MpSectionHeader** — `title`, `headingLevel?` · slot `#actions`. Section headings inside dashboard cards.
- **ModuleLandingPage** — `title`, `childPages`, `primaryActions?`, `quickActions?`, `recentActivity?`, `setupCard?`, `daVinciCard?`. Prop-driven module landing (Marketing/Content).

### Data display

- **MpKpiCard** — `label`, `value`, `icon?`, `color?`, `trend?`, `trendPositive?`, `subStat?`, `period?` · slot `#sparkline`. Dashboard metric cards, 4-column row.
- **MpStatusChip** — `status`, `type?` ('order'|'fulfillment'|'payment'|'campaign'|'contact'|'ticket'|'coupon'|'general'), `size?`, `variant?`, `showIcon?`. Workflow states in tables; color maps are automatic per type.
- **MpSourceCloudChip** — `dataSource`, `size?`, `iconOnly?`. Identifies a widget/KPI's source cloud.
- **MpDataTableToolbar** — `searchPlaceholder?`, `activeFilters?`, `totalCount?`, `headers?` · model `v-model:search` · slots `#title`, `#actions`, `#filter-content` (filter drawer). Always above `v-data-table`; search debounced 300ms.
- **MpFolderSelect** — `folders`, `counts?`, `totalCount?`, `label?` · emits `manage`. Folder filter menu above foldered lists.

### Feedback

- **MpEmptyState** — `title`, `icon?`, `description?`, `actionLabel?`, `actionIcon?`, `headingLevel?` · emits `action`. Every table/list MUST have one (empty = nothing to show).
- **MpErrorState** — same shape, recovery defaults (`role="alert"`). Error = something failed; don't merge with empty states.
- **MpFloatingBulkBar** — `count`, `total?` · emits `clear` · default slot (actions). Shows on row selection; auto-hides at 0.
- **MpTableSkeleton** — `rows?`, `columns?`, `showHeader?`. Loading placeholder inside table cards.

### Forms & selection

- **MpFormDrawer** — `title`, `subtitle?`, `width?` (480) · model `v-model` · slots default, `#footer`. Right-side drawer for create/edit forms. Never `v-dialog` for forms.
- **MpOptionCard** — `selected`, `title`, `description?`, `icon?` · slots default, `#media`. Keyboard-operable selectable card for wizard galleries.
- **MpStatusToggle** — `status` ('Active'|'Paused'|'Draft') · emits `toggle`. Status switch + label cell; disabled on Draft.
- **MpManageFoldersDrawer** — `scope`, `counts?` · emits `deleted`. Folder CRUD drawer (composes MpFormDrawer).
- **MpMoveToFolderDialog** — `scope`, `currentFolderId`, `itemLabel?` · emits `move`. Move-to-folder form dialog.

### Navigation

- **MpFilterTabs** — `tabs` ({ label, key, count? }[]), `ariaLabel?`, `controlsId?` · model `v-model` (active key). Tab filtering above data tables.
- **MpSectionRail** — `ariaLabel` (required), `groups` ({ title?, items: { slug, label, icon?, to, match?, count?, external? }[] }[]), `title?`, `backTo?`/`backLabel?`, `identity?` ({ name, caption?, icon? }), `switcherOptions?`/`switcherLabel?`, `searchable?`/`searchPlaceholder?` · slot `#footer` · emits `switch`. In-content 260px section rail for shell layouts (store editor, Settings-style workspaces); active = `route.name` ∈ item.match. The global AppSidebar auto-minimizes while a rail shell is on screen (route meta `railShell`/`storeEditor`).
- **MpWizardSteps** — `steps` (string[]), `current` (1-based). Passive wizard step indicator with `aria-current`.

### Overlays

- **MpConfirmDialog** — model `v-model`, `title`, `message`, `confirmLabel?`, `danger?` · emits `confirm`. All confirm prompts (destructive → `danger`). Never raw `v-dialog`.
- **MpRowActionsMenu** — `ariaLabel` (required) · default slot (`v-list-item`s). Kebab row-actions menu for list views.

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

### Styling Rules
- **Never hardcode** colors, spacing, radius, or shadows — use Vuetify utilities or design tokens
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
v-btn @click="drawer = true"  → opens MpFormDrawer
  └── Form fields in v-row/v-col grid
  └── #footer slot: Cancel + Save buttons
```

### Status Chip Usage
Always use `MpStatusChip` for status columns. Pass the correct `type` prop:
- Orders table: `type="order"` for order status, `type="fulfillment"` for fulfillment, `type="payment"` for payment
- Campaigns table: `type="campaign"`
- Tickets: `type="ticket"`

---

## Design Tokens

All design values live in `src/design-tokens/tokens.json`. Run `npm run tokens:build` to regenerate outputs.

**Key values:**
- Spacing: 4px base → 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64
- Colors: Light theme primary `#1A56DB`, secondary `#7E3AF2`, background `#F9FAFB`
- Border radius: sm=4, md=8, lg=12, xl=16
- Shadows: sm (1px), md (4px), lg (8px) — use sparingly, prefer border
- Layout: sidebar 260px, appbar 56px, drawer 480px, content max 1280px

---

## NPM Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run storybook` | Start Storybook on :6006 |
| `npm run build-storybook` | Build Storybook to dist-storybook/ |
| `npm run tokens:build` | Generate SCSS/CSS/TS from tokens.json |
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
