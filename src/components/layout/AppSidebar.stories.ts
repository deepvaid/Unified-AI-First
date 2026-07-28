import type { Meta, StoryObj } from '@storybook/vue3'
import AppSidebar from './AppSidebar.vue'
import { ref } from 'vue'

/**
 * The skin axis lives on `<html data-sidebar>` (App.vue sets it from the account).
 * Applied to every story from the `sidebarSkin` parameter so a skin never leaks
 * into the next story; the light/dark app theme comes from the `theme` global.
 */
type SidebarSkin = 'gray' | 'white' | 'dark'

const mobile375 = {
  options: {
    mobile375: {
      name: 'Mobile 375',
      styles: { width: '375px', height: '812px' },
      type: 'mobile' as const,
    },
  },
}

const meta = {
  title: 'Layout/AppSidebar',
  component: AppSidebar,
  tags: ['autodocs'],
  decorators: [
    (story, context) => ({
      components: { story },
      setup() {
        const skin = (context.parameters.sidebarSkin ?? 'gray') as SidebarSkin
        document.documentElement.dataset.sidebar = skin
        return {}
      },
      template: '<story />',
    }),
  ],
  parameters: {
    layout: 'fullscreen',
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

**Don't use when:** a module needs local sub-navigation (Settings uses its own
\`SettingsSidebar\`), or the surface is full-page (builders hide the shell entirely).

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
 * Dark mode. The skin axis collapses here: gray, white, and dark all resolve to this one
 * charcoal treatment, matching `AppBar`. Switch the `sidebarSkin` parameter to confirm.
 */
export const DarkMode: Story = {
  args: { modelValue: true, rail: false },
  globals: { theme: 'dark' },
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
          <p class="text-body-1">Dark mode — the panel matches the app bar regardless of the selected skin.</p>
        </v-main>
      </v-layout>
    `,
  }),
}

/** Dark mode in rail state — hover a module icon to check the flyout's overlay tier. */
export const DarkModeRail: Story = {
  args: { modelValue: true, rail: true },
  globals: { theme: 'dark' },
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
          <p class="text-body-1">Dark rail — the flyout sits one surface tier above the panel.</p>
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
  parameters: {
    viewport: mobile375,
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
