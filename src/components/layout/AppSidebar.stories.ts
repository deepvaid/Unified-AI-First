import type { Meta, StoryObj } from '@storybook/vue3'
import { onUnmounted, ref, watch } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppBar from './AppBar.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useMobileNav } from '@/composables/useMobileNav'
import { ORDERS, ORDER_HEADERS } from '@/stories/fixtures'
import { appShell, overlayDocs, surfaceFrame } from '@/stories/decorators'
import { liquidskyDocs } from '@/stories/storyTemplate'

/**
 * The shell chrome lives on `<html>`: `data-sidebar` (the nav skin, which App.vue takes from
 * the account), `data-shell` and `data-frame` (the shell variant). `appShell` stamps the app's
 * defaults (gray, studio, on) for every story and reads `parameters.sidebarSkin` for the other
 * skins. All three are one value per document, so a story on a non-default skin renders in its
 * own docs frame.
 */

interface SidebarArgs {
  modelValue: boolean
  rail: boolean
  temporary?: boolean
}

/** A cropped piece of the shell: the height a sidebar specimen needs to show its whole nav. */
const specimen = surfaceFrame({ height: '600px' })

/**
 * The content area exactly as App.vue nests it: `v-main` > `.mp-content-frame` >
 * `.mp-main-shell`. In the studio shell `v-main` is the gutter and the frame is the rounded
 * surface the page sits on.
 */
function shellMain(body: string) {
  return `
    <v-main class="bg-background">
      <div class="mp-content-frame">
        <v-container fluid class="mp-main-shell">${body}</v-container>
      </div>
    </v-main>
  `
}

/**
 * The sidebar in its own layout, bound to the story's args. The component also emits both
 * models (its collapse toggle), so the args seed local state and Controls keep driving it.
 */
function sidebarStory(note: string) {
  return (args: SidebarArgs) => ({
    components: { AppSidebar },
    setup() {
      const open = ref(args.modelValue)
      const rail = ref(args.rail)
      watch(() => args.modelValue, (value) => { open.value = value })
      watch(() => args.rail, (value) => { rail.value = value })
      return { args, open, rail }
    },
    template: `
      <v-layout full-height>
        <AppSidebar v-model="open" v-model:rail="rail" :temporary="args.temporary" />
        ${shellMain(`<p class="text-body-1">${note}</p>`)}
      </v-layout>
    `,
  })
}

const meta = {
  title: 'Patterns/App Shell/AppSidebar',
  component: AppSidebar,
  tags: ['autodocs', 'liquidsky'],
  decorators: [appShell],
  parameters: {
    sidebarSkin: 'gray',
    docs: {
      description: {
        component: liquidskyDocs('patterns-app-shell-appsidebar') + `
### Overview
\`AppSidebar\` is the primary left-hand navigation of the Maropost platform. It supports two
modes: expanded (\`layout.sidebarWidth\`, 248px: labels and expandable module groups) and rail
(\`layout.sidebarRailWidth\`, 72px: icons with hover flyout menus). A \`temporary\` prop switches
it to an overlay drawer with scrim for small viewports (App.vue flips it below the md
breakpoint); that drawer opens and closes through \`useMobileNav\`, which the app bar's
hamburger toggles.

**Chrome:** the panel is painted by a skin (\`<html data-sidebar="gray|white|dark">\`) that
shares the \`--mp-nav-surface\` bind with \`AppBar\`, so the two navs never drift. The skin only
differentiates **light** mode — in the app's dark theme all three resolve to the same charcoal
treatment sourced from the \`dark\` token ramp (\`sidebar-dark.css\`). In the studio shell (the
app default) the panel has no right border and \`v-main\` paints the same surface, so the
rounded content frame is the only edge.

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
- **Widths:** \`layout.sidebarWidth\` (248px) expanded and \`layout.sidebarRailWidth\` (72px) as
  a rail. The drawer reads the generated TS tokens, because \`v-navigation-drawer\` takes
  numbers for \`width\`/\`rail-width\`, not custom properties.
- **Rows:** \`component.listItem.*\`, the same 40px floor as \`MpSectionRail\`, \`MpListRow\` and
  the app bar's menu rows.
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
    modelValue: { control: 'boolean', description: 'v-model — whether the permanent drawer is shown. A `temporary` drawer ignores it and follows `useMobileNav` instead.' },
    rail: { control: 'boolean', description: 'v-model:rail — collapse to the icon-only rail (`layout.sidebarRailWidth`, 72px) with hover flyouts.' },
    temporary: { control: 'boolean', description: 'Overlay drawer with scrim instead of a permanent column — used below the md breakpoint. Opened and closed through `useMobileNav`.' },
  },
  args: {
    modelValue: true,
    rail: false,
    temporary: false,
  },
} satisfies Meta<typeof AppSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Expanded: Story = {
  decorators: [specimen],
  render: sidebarStory('The sidebar is <strong>expanded</strong>: <code>layout.sidebarWidth</code> (248px). Turn on <code>rail</code> in Controls, or use the toggle in its header, to collapse it.'),
}

export const CollapsedRail: Story = {
  args: { rail: true },
  decorators: [specimen],
  render: sidebarStory('The sidebar is a <strong>rail</strong>: icons only, <code>layout.sidebarRailWidth</code> (72px). Hovering a module icon opens its flyout menu.'),
}

/** The white skin: white nav chrome, and the content frame carries the gray. Light mode only. */
export const SkinWhite: Story = {
  parameters: { sidebarSkin: 'white', ...overlayDocs('680px') },
  globals: { theme: 'light' },
  decorators: [specimen],
  render: sidebarStory('The <strong>white</strong> skin — white nav chrome, gray content frame.'),
}

/**
 * The dark skin on a light app theme: dark nav chrome beside light content. Its values come
 * from the `dark` token ramp by name, so they hold even though the surrounding theme is light.
 */
export const SkinDark: Story = {
  parameters: { sidebarSkin: 'dark', ...overlayDocs('680px') },
  globals: { theme: 'light' },
  decorators: [specimen],
  render: sidebarStory('The <strong>dark</strong> skin on a light app theme.'),
}

/**
 * The mobile configuration: `temporary` turns the sidebar into an overlay drawer with a scrim
 * (canvas only — the docs page doesn't resize). A temporary drawer is not driven by `v-model`:
 * it follows `useMobileNav`, the flag the app bar's hamburger toggles. Dismiss it via the scrim
 * and re-open it with the button.
 */
export const MobileTemporary: Story = {
  args: { temporary: true },
  parameters: { canvas: 'full', ...overlayDocs() },
  globals: {
    viewport: { value: 'mobile375', isRotated: false },
  },
  render: (args) => ({
    components: { AppSidebar },
    setup() {
      const mobileNav = useMobileNav()
      mobileNav.open()
      onUnmounted(mobileNav.close)
      return { args, mobileNav }
    },
    template: `
      <v-layout class="h-screen">
        <AppSidebar v-bind="args" />
        ${shellMain(`
          <v-btn variant="outlined" prepend-icon="panel-left" @click="mobileNav.open()">Open sidebar</v-btn>
          <p class="text-body-2 text-medium-emphasis mt-4">
            Temporary mode overlays the content with a scrim instead of reserving a column.
          </p>
        `)}
      </v-layout>
    `,
  }),
}

// ── Template: Variants · States ──────────────────────────────────────────────

/**
 * The sidebar's two structures: expanded (labels visible) and rail (icons only, with a flyout
 * on hover). Structure is the `rail` prop, and it is also the only sizing the sidebar has —
 * there is no `size` prop, the two widths are `layout.sidebarWidth` (248px) and
 * `layout.sidebarRailWidth` (72px). The skin is a setting of the whole document, not a prop,
 * so it cannot share this canvas: see **Skin White** and **Skin Dark**.
 */
export const Variants: Story = {
  decorators: [specimen],
  render: () => ({
    components: { AppSidebar },
    template: `
      <div class="d-flex ga-6 pa-6 h-100">
        <div class="d-flex flex-column">
          <div class="text-caption text-medium-emphasis mb-2">expanded · layout.sidebarWidth (248px)</div>
          <v-layout class="flex-grow-1" style="width: var(--mp-layout-sidebarWidth)">
            <AppSidebar :model-value="true" :rail="false" />
          </v-layout>
        </div>
        <div class="d-flex flex-column">
          <div class="text-caption text-medium-emphasis mb-2">rail · layout.sidebarRailWidth (72px)</div>
          <v-layout class="flex-grow-1" style="width: var(--mp-layout-sidebarRailWidth)">
            <AppSidebar :model-value="true" :rail="true" />
          </v-layout>
        </div>
      </div>
    `,
  }),
}

/**
 * Row states: resting, hover, active (`active-nav-item` — tinted surface plus a semibold
 * label), a parent row with its hover chevron, and a badge. Hover and tab through the rows
 * to see the affordances; the focus ring is a box-shadow so it reads on every skin.
 */
export const States: Story = {
  decorators: [specimen],
  render: sidebarStory('Hover a parent row to reveal its chevron, click to open the flyout, and tab through the list to see the focus ring. The active row is whichever matches the current route.'),
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The full shell as App.vue lays it out: sidebar, app bar, and a real page
 * inside the content frame. Every control in the app bar, every nav row in the sidebar and
 * every control in the table toolbar resolve to one 40px baseline. The app opens with the
 * sidebar collapsed to its rail; it is expanded here.
 */
export const InContextAppShell: Story = {
  parameters: { canvas: 'full', ...overlayDocs('720px') },
  render: () => ({
    components: { AppSidebar, AppBar, MpPageHeader, MpDataTableToolbar, MpStatusChip },
    setup() {
      const open = ref(true)
      const rail = ref(false)
      return { open, rail, rows: ORDERS.slice(0, 5), headers: ORDER_HEADERS.filter(h => h.key !== 'actions') }
    },
    template: `
      <v-layout class="h-screen">
        <AppSidebar v-model="open" v-model:rail="rail" />
        <AppBar />
        ${shellMain(`
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
        `)}
      </v-layout>
    `,
  }),
}
