import type { Meta, StoryObj } from '@storybook/vue3'
import AppSidebar from './AppSidebar.vue'
import AppBar from './AppBar.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { ORDERS, ORDER_HEADERS } from '@/stories/fixtures'
import { ref } from 'vue'
import { sidebarSkin } from '@/stories/decorators'

/**
 * The skin axis lives on `<html data-sidebar>` (App.vue sets it from the account).
 * Applied to every story from the `sidebarSkin` parameter so a skin never leaks
 * into the next story; the light/dark app theme comes from the `theme` global.
 */

const meta = {
  title: 'Patterns/App Shell/AppSidebar',
  component: AppSidebar,
  tags: ['autodocs'],
  decorators: [sidebarSkin],
  parameters: {
    canvas: 'full',
    sidebarSkin: 'gray',
    docs: {
      description: {
        component: `
### Overview
\`AppSidebar\` is the primary left-hand navigation of the Maropost platform. It supports two
modes: expanded (240px, labels + expandable module groups) and rail (64px, icons with hover
flyout menus). A \`temporary\` prop switches it to an overlay drawer with scrim for small
viewports (App.vue flips it below the md breakpoint).

**Chrome:** the panel is painted by a skin (\`<html data-sidebar="gray|white|dark">\`) that
shares the \`--mp-nav-surface\` bind with \`AppBar\`, so the two navs never drift. The skin only
differentiates **light** mode — in the app's dark theme all three resolve to the same charcoal
treatment sourced from the \`dark\` token ramp (\`sidebar-dark.css\`).

**Store coupling:** \`useAccounts\` — the account id resolved from the route (or the active
account) builds every nav path, and subscription keys gate locked modules (Crown badge). The
Storybook preview registers Pinia with seeded defaults and a catch-all route, which is all the
sidebar needs (it navigates by path, not by route name).

**Use when:** composing the app shell — exactly once, inside \`v-layout\`, before \`AppBar\`
and \`v-main\` (see \`App.vue\`).

**Don't use when:** a module needs local sub-navigation (Settings, Retail and
Merchandising all use \`MpSectionRail\`), or the surface is full-page (builders
hide the shell entirely).

### Usage
\`\`\`html
<AppSidebar
  v-model="drawer"
  :rail="sidebarRail"
  :temporary="isMobile"
  @update:rail="rail = $event"
/>
\`\`\`

### 🟢 Do's
- **Do** use rail mode on smaller desktop viewports and \`temporary\` on mobile.
- **Do** wrap it in a \`v-layout\` alongside \`AppBar\` and \`v-main\` for proper page structure.
- **Do** keep administrative surfaces in the app bar/user menu when they are utilities rather
  than primary navigation.

### 🔴 Don'ts
- **Don't** add Settings back into the sidebar; use the app bar/user menu entry instead.
- **Don't** put page-specific actions in the sidebar. Navigation only.
- **Don't** render more than one sidebar per page.

### 💡 Best Practices
- **Widths:** 240px expanded, 64px rail (fixed via \`width\`/\`rail-width\` on the underlying
  \`v-navigation-drawer\`).
- **Locked modules:** groups whose \`requires\` subscription the active account lacks render a
  Crown marker and route to an upsell instead of the module.

### A11y
- **Provides:** the underlying \`v-navigation-drawer\` renders as a \`<nav>\` landmark named
  "Main navigation" via \`aria-label\` *(named in the Phase 4 a11y pass)*; brand,
  collapse-toggle, and apps-toggle buttons all carry \`aria-label\`s; nav entries are
  router-linked \`v-list-item\`s with keyboard focus and Enter activation; the rail flyout panel
  has \`role="menu"\` with a group-specific \`aria-label\`, and cascade triggers expose
  \`aria-expanded\`.
- **Consumer must:** pair it with the shell's skip link and \`v-main\` landmark, and pass
  \`temporary\` on small viewports so the scrim/dismiss behavior is available.
- **Gaps:** rail-mode flyouts open on hover/click of the icon but are not reachable purely by
  keyboard in rail mode (hover-driven cascade — backlog, needs a focus-driven flyout rework);
  the active module is conveyed by color/weight without \`aria-current\` on group headers
  (backlog); locked (Crown) items don't announce that they are locked (backlog).
        `,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — sidebar visibility (relevant with temporary; the permanent drawer stays mounted).' },
    rail: { control: 'boolean', description: 'v-model:rail — collapse to the 64px icon-only rail with hover flyouts.' },
    temporary: { control: 'boolean', description: 'Overlay drawer with scrim instead of a permanent column — used below the md breakpoint.' },
  },
} satisfies Meta<typeof AppSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Expanded: Story = {
  args: {
    modelValue: true,
    rail: false,
  },
  render: () => ({
    components: { AppSidebar },
    setup() {
      const open = ref(true)
      const rail = ref(false)
      return { open, rail }
    },
    template: `
      <v-layout style="height: 600px;" class="bg-surface">
        <AppSidebar v-model="open" v-model:rail="rail" />
        <v-main class="pa-6">
          <p class="text-body-1">Sidebar is <strong>expanded</strong> (240px). Toggle the rail prop to collapse it.</p>
        </v-main>
      </v-layout>
    `,
  }),
}

export const CollapsedRail: Story = {
  args: {
    modelValue: true,
    rail: true,
  },
  render: () => ({
    components: { AppSidebar },
    setup() {
      const open = ref(true)
      const rail = ref(true)
      return { open, rail }
    },
    template: `
      <v-layout style="height: 600px;" class="bg-surface">
        <AppSidebar v-model="open" v-model:rail="rail" />
        <v-main class="pa-6">
          <p class="text-body-1">Sidebar is in <strong>rail mode</strong> (icon-only, 64px). Hovering a module icon opens its flyout menu.</p>
        </v-main>
      </v-layout>
    `,
  }),
}

/** The white skin: white chrome over the metal-gray content canvas. Light mode only. */
export const SkinWhite: Story = {
  args: { modelValue: true, rail: false },
  parameters: { sidebarSkin: 'white' },
  globals: { theme: 'light' },
  render: () => ({
    components: { AppSidebar },
    setup() {
      const open = ref(true)
      const rail = ref(false)
      return { open, rail }
    },
    template: `
      <v-layout style="height: 600px;" class="bg-surface">
        <AppSidebar v-model="open" v-model:rail="rail" />
        <v-main class="pa-6">
          <p class="text-body-1">The <strong>white</strong> skin — white nav chrome, gray canvas.</p>
        </v-main>
      </v-layout>
    `,
  }),
}

/**
 * The dark skin on a light app theme: dark nav chrome beside light content. Its values come
 * from the `dark` token ramp by name, so they hold even though the surrounding theme is light.
 */
export const SkinDark: Story = {
  args: { modelValue: true, rail: false },
  parameters: { sidebarSkin: 'dark' },
  globals: { theme: 'light' },
  render: () => ({
    components: { AppSidebar },
    setup() {
      const open = ref(true)
      const rail = ref(false)
      return { open, rail }
    },
    template: `
      <v-layout style="height: 600px;" class="bg-surface">
        <AppSidebar v-model="open" v-model:rail="rail" />
        <v-main class="pa-6">
          <p class="text-body-1">The <strong>dark</strong> skin on a light app theme.</p>
        </v-main>
      </v-layout>
    `,
  }),
}

/**
 * The mobile configuration: `temporary` turns the sidebar into an overlay drawer with a scrim
 * (canvas only — the docs page doesn't resize). Dismiss it via the scrim and re-open it with
 * the button.
 */
export const MobileTemporary: Story = {
  args: {
    modelValue: true,
    rail: false,
    temporary: true,
  },
  globals: {
    viewport: { value: 'mobile375', isRotated: false },
  },
  render: () => ({
    components: { AppSidebar },
    setup() {
      const open = ref(true)
      const rail = ref(false)
      return { open, rail }
    },
    template: `
      <v-layout style="min-height: 700px;" class="bg-surface">
        <AppSidebar v-model="open" v-model:rail="rail" temporary />
        <v-main class="pa-4">
          <v-btn variant="outlined" prepend-icon="panel-left" @click="open = true">Open sidebar</v-btn>
          <p class="text-body-2 text-medium-emphasis mt-4">
            Temporary mode overlays the content with a scrim instead of reserving a column.
          </p>
        </v-main>
      </v-layout>
    `,
  }),
}

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * The sidebar's two structures — expanded (labels visible) and rail (icons only, with a
 * flyout on hover) — beside the three skins the shell can wear. Structure is `rail`;
 * skin is a global app setting, not a prop.
 */
export const Variants: Story = {
  render: () => ({
    components: { AppSidebar },
    template: `
      <div class="d-flex ga-6 align-stretch" style="min-height: 560px">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">expanded — 248px (layout.sidebarWidth)</div>
          <AppSidebar :model-value="true" :rail="false" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">rail — 72px (layout.sidebarRailWidth)</div>
          <AppSidebar :model-value="true" :rail="true" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no `size` prop — the two widths are `rail`'s two states, and both now come from
 * `layout.sidebarWidth` / `layout.sidebarRailWidth`. Phase 4 (P4-7) closed a gap here:
 * `tokens.json` and CLAUDE.md both documented 248 / 72 while the component rendered 240 / 64,
 * so the tokens described a layout nothing used. The drawer reads the generated TS token now
 * (VNavigationDrawer takes numbers, not custom properties).
 *
 * Its rows are `component.listItem.*` — the same 40px floor as `MpSectionRail`, `MpListRow`
 * and the app bar's menu rows. Only the inline inset differs, deliberately: this drawer insets
 * its scroller by 8 and the section rail insets its own by 12, so 8 + 16 here and 12 + 12
 * there both put the label 24px from the panel edge.
 */
export const Sizes: Story = {
  render: () => ({
    components: { AppSidebar },
    template: `
      <div class="d-flex ga-6 align-stretch" style="min-height: 520px">
        <AppSidebar :model-value="true" :rail="false" />
        <AppSidebar :model-value="true" :rail="true" />
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * Row states: resting, hover, active (`active-nav-item` — tinted surface plus a semibold
 * label), a parent row with its hover chevron, and a badge. Hover and tab through the rows
 * to see the affordances; the focus ring is a box-shadow so it reads on every skin.
 */
export const States: Story = {
  render: () => ({
    components: { AppSidebar },
    template: `
      <div class="d-flex ga-6 align-stretch" style="min-height: 560px">
        <AppSidebar :model-value="true" :rail="false" />
        <div class="pt-6 text-body-2 text-medium-emphasis" style="max-width: 320px">
          Hover a parent row to reveal its chevron, click to open the flyout, and tab through
          the list to see the focus ring. The active row is whichever matches the current route.
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The full shell: sidebar + app bar + a real page. This is the composition
 * Phase 4's control-height work is visible in — every control in the app bar, every nav row
 * in the sidebar, and every control in the table toolbar resolve to one 40px baseline.
 */
export const InContextAppShell: Story = {
  render: () => ({
    components: { AppSidebar, AppBar, MpPageHeader, MpDataTableToolbar, MpStatusChip },
    setup: () => ({ rows: ORDERS.slice(0, 5), headers: ORDER_HEADERS.filter(h => h.key !== 'actions') }),
    template: `
      <div class="d-flex align-stretch" style="min-height: 640px; background: var(--surface-canvas)">
        <AppSidebar :model-value="true" :rail="false" />
        <div class="flex-grow-1 d-flex flex-column" style="min-width: 0">
          <AppBar />
          <div class="pa-6" style="min-width: 0">
            <MpPageHeader eyebrow="Commerce · Orders" title="Sales Orders" subtitle="82 orders total · $43,565.90 lifetime revenue" />
            <v-card flat border rounded="lg" class="mt-6">
              <MpDataTableToolbar title="Sales Orders" :total-count="rows.length" search-placeholder="Search orders…" />
              <v-data-table :headers="headers" :items="rows" item-value="id" hide-default-footer>
                <template #item.status="{ item }">
                  <MpStatusChip :status="item.status" type="order" size="sm" />
                </template>
                <template #item.fulfillment="{ item }">
                  <MpStatusChip :status="item.fulfillment" type="fulfillment" size="sm" />
                </template>
              </v-data-table>
            </v-card>
          </div>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}
