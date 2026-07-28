# Maropost Design System — AI Agent Context

> This file is the single entry point for Codex CLI, Cursor, and any AI coding assistant working on this project. Read this first.

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
├── AGENTS.md                  ← YOU ARE HERE
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
│   ├── components/            ← 11 reusable Mp* components + stories
│   │   ├── MpPageHeader.vue   ← Page title, breadcrumbs, action slot
│   │   ├── MpKpiCard.vue      ← KPI metric card with trend
│   │   ├── MpStatusChip.vue   ← Polymorphic status badge (order/fulfillment/payment/campaign/ticket)
│   │   ├── MpDataTableToolbar.vue ← Search + filter + action toolbar
│   │   ├── MpEmptyState.vue   ← Empty state with icon + CTA
│   │   ├── MpFilterTabs.vue   ← Tab-based filtering with counts
│   │   ├── MpFloatingBulkBar.vue ← Floating bulk action bar
│   │   ├── MpFormDrawer.vue   ← Right-side form drawer (480px)
│   │   ├── MpSectionHeader.vue ← Section heading with action slot
│   │   ├── layout/AppBar.vue  ← Top bar (search, notifications, user menu)
│   │   └── layout/AppSidebar.vue ← Left nav (260px, collapsible rail)
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

### MpPageHeader
**Props:** `title` (string), `subtitle?` (string), `breadcrumbs?` ({ title, to?, disabled? }[])
**Slots:** `#actions`, `#tabs`
**Usage:** Every page's top section. Always include breadcrumbs for nested pages.

### MpKpiCard
**Props:** `label`, `value` (string|number), `icon?`, `color?`, `trend?`, `trendPositive?` (boolean), `subStat?`
**Usage:** Dashboard metric cards. Always in a 4-column row.

### MpStatusChip
**Props:** `status` (string), `type` ('order'|'fulfillment'|'payment'|'campaign'|'contact'|'ticket'|'coupon'|'general'), `size?`, `variant?`, `showIcon?`
**Usage:** Status columns in data tables. Color mapping is automatic based on type+status.

### MpDataTableToolbar
**Props:** `searchPlaceholder?`  **Model:** `v-model:search`
**Slots:** `#filters`, `#actions`
**Usage:** Always placed above `v-data-table`. Search is instant (debounced 300ms).

### MpEmptyState
**Props:** `icon?`, `title`, `description?`, `actionLabel?`, `actionIcon?`
**Emits:** `@action`
**Usage:** Every table/list MUST have an empty state.

### MpFilterTabs
**Props:** `tabs` ({ label, key, count? }[])  **Model:** `v-model` (active key)
**Usage:** Tab-based filtering above data tables (e.g., All / Completed / Processing).

### MpFloatingBulkBar
**Props:** `count` (number)  **Emits:** `@clear`
**Slots:** Default (action buttons)
**Usage:** Shows when rows are selected in a data table. Auto-hides when count = 0.

### MpFormDrawer
**Props:** `title`, `subtitle?`, `width?` (default 480)  **Model:** `v-model` (boolean)
**Slots:** Default (form content), `#footer`
**Usage:** Right-side drawer for create/edit forms. Never use `v-dialog` for forms.

### MpSectionHeader
**Props:** `title`  **Slots:** `#actions`
**Usage:** Section headings inside cards on dashboards.

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

---

## Recent Changes (last session — for continuity)

### Icons — `src/plugins/lucideIcons.ts`
Vuetify internally uses `mdi-*` string aliases for expand chevrons, checkboxes, etc.
A `MDI_TO_LUCIDE` map was added to route these to Lucide SVGs (avoids the MDI CSS class-doubling bug).
**Do not** remove the map or revert to the old MDI CSS fallback — chevrons in `v-list-group` will break.

### Sidebar — `src/components/layout/AppSidebar.vue`
Rail (collapsed) brand mark: a `<div class="rail-brand-box">M</div>` — white "M" on dark box (32×32px, border-radius 8px).
Do **not** replace with an SVG or img tag.

### AppBar — `src/components/layout/AppBar.vue`
- User avatar uses `https://i.pravatar.cc/128?img=12` (deterministic male portrait) — pill size 26px, dropdown card size 56px

### Contact avatars — `src/stores/useContacts.ts`
Each seeded Contact has `avatarUrl: \`https://i.pravatar.cc/96?u=contact-${id}\``
`AllContacts.vue` table rows and `ContactDetail.vue` header both render these via `v-avatar > v-img` with an initial-letter fallback div.
