import type { Meta, StoryObj } from '@storybook/vue3'
import type { Router } from 'vue-router'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import AppBar from './AppBar.vue'
import AppSidebar from './AppSidebar.vue'

/**
 * The nav skin lives on `<html data-sidebar>` and paints both navs through the shared
 * `--mp-nav-surface` bind. Applied to every story from the `sidebarSkin` parameter so a skin
 * never leaks into the next story; the light/dark app theme comes from the `theme` global.
 */
type SidebarSkin = 'gray' | 'white' | 'dark'

/**
 * Story-side workaround (batch C convention): the Storybook preview router only has a
 * catch-all route, but AppBar resolves named routes eagerly (`:to="settingsRoute"`) and from
 * its menus. Register a stub per route name so router-link resolution succeeds.
 */
const APPBAR_ROUTE_NAMES = [
  'Settings', 'Billing', 'SettingsGeneral', 'AppStore',
  'Dashboard', 'DashboardsList', 'SalesOrders', 'EmailCampaigns',
  'AllContacts', 'DaVinciDashboard', 'DaVinciExperience',
  'Segments', 'Journeys', 'ContactLists',
]

function ensureAppBarRoutes(router: Router) {
  for (const name of APPBAR_ROUTE_NAMES) {
    if (!router.hasRoute(name)) {
      router.addRoute({
        path: `/accounts/:accountId/sb-appbar/${name.toLowerCase()}`,
        name,
        component: { template: '<div />' },
      })
    }
  }
}

function appBarStory() {
  return () => ({
    components: { AppBar },
    setup() {
      ensureAppBarRoutes(useRouter())
    },
    template: `
      <v-layout>
        <AppBar />
        <v-main class="pa-6">
          <p class="text-body-1">Main content area below the app bar.</p>
        </v-main>
      </v-layout>
    `,
  })
}

/** Bar + sidebar together, so the seam between the two nav surfaces is visible. */
function navSeamStory() {
  return () => ({
    components: { AppBar, AppSidebar },
    setup() {
      ensureAppBarRoutes(useRouter())
      const open = ref(true)
      const rail = ref(false)
      return { open, rail }
    },
    template: `
      <v-layout style="min-height: 520px;">
        <AppSidebar v-model="open" v-model:rail="rail" />
        <AppBar />
        <v-main class="pa-6">
          <p class="text-body-1">
            The head nav and side nav share one surface — the seam between them should read as
            a single continuous plane, broken only by a hairline.
          </p>
        </v-main>
      </v-layout>
    `,
  })
}

const meta = {
  title: 'Layout/AppBar',
  component: AppBar,
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
\`AppBar\` is the main top navigation bar of the Maropost platform (56px). It provides the
universal AI search menu, the quick-create menu (with single-key shortcuts while open), the
notification bell, Galaxy and Settings shortcuts, the Da Vinci assistant menu, and the user
profile menu (account switcher, theme toggle, sign-out). It takes **no props** — everything is
wired to global state.

**Chrome:** the bar shares the \`--mp-nav-surface\` bind with \`AppSidebar\` (\`shell-variants.css\`)
so head nav and side nav can never drift. The skin (\`<html data-sidebar>\`) only differentiates
light mode — in dark mode both navs resolve to the same charcoal surface from the \`dark\` token
ramp. The Seam stories below show the two together.

**Store coupling:** \`useAccounts\` (active account + switcher list), \`useCopilot\` (opens the
Da Vinci assistant), \`useUserProfile\` (avatar), and \`useAppTheme\` (light/dark mode). The
Storybook preview registers Pinia with the stores' seeded defaults (account 2000290), and these
stories add stub routes for the named routes the bar links to.

**Use when:** composing the app shell — exactly once, inside \`v-layout\`, alongside
\`AppSidebar\` and \`v-main\` (see \`App.vue\`).

**Don't use when:** a page needs its own header or actions — that's \`MpPageHeader\`. Full-page
surfaces (login, builders) omit the bar entirely.

### Usage
\`\`\`html
<v-layout>
  <AppSidebar v-model="drawer" :rail="rail" />
  <AppBar />
  <v-main id="main-content" role="main">
    <router-view />
  </v-main>
</v-layout>
\`\`\`

### 🟢 Do's
- **Do** always render it inside a \`v-layout\` wrapper so it integrates with the sidebar and main content.
- **Do** use it as a singleton — only one AppBar should exist per page.

### 🔴 Don'ts
- **Don't** add page-level actions to the AppBar — those belong in \`MpPageHeader\`.
- **Don't** override its height; it follows the design token \`appbar: 56px\`.

### 💡 Best Practices
- The AppBar is fixed to the top; page content accounts for its height via \`v-main\`.
- The quick-create menu binds single-key shortcuts (D/W/E/S/A/L) only while it is open, and
  ignores keystrokes typed into inputs.

### A11y
- **Provides:** every icon-only control carries an \`aria-label\` — search ("Universal AI
  search"), quick create, notifications (with unread count in the label), Galaxy, Settings,
  AI Assistant, user menu, and the theme toggle buttons; menus are Vuetify \`v-menu\`s (Escape
  closes, focus returns to the trigger); the account filter field has an \`aria-label\`; the
  theme switcher row is a \`role="group"\` with a label.
- **Consumer must:** provide the skip link and \`v-main\` landmark at the shell level (App.vue
  does), since the bar itself is chrome.
- **Gaps:** the notification badge count is visual + label-only (no live region when it
  changes); the profile menu items are custom \`button.um-item\`s rather than list semantics —
  arrow-key navigation inside the menu doesn't work (Tab only); the search menu's result list
  isn't a combobox/listbox pattern, so results aren't announced as suggestions (noted for the
  Phase 4 a11y pass).
        `,
      },
    },
  },
} satisfies Meta<typeof AppBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: appBarStory(),
}

export const ProfileMenuOpen: Story = {
  name: 'Profile Menu (Open)',
  render: appBarStory(),
  play: async ({ canvasElement }) => {
    // Auto-open the profile dropdown for Storybook preview
    await new Promise(resolve => setTimeout(resolve, 500))
    const trigger = canvasElement.querySelector('.user-menu-trigger') as HTMLElement
    if (trigger) trigger.click()
  },
}

/** The quick-create menu opened — grouped create targets with single-key shortcuts (D/W/E/S/A/L). */
export const CreateMenuOpen: Story = {
  name: 'Create Menu (Open)',
  render: appBarStory(),
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    const trigger = canvasElement.querySelector('[aria-label="Quick create"]') as HTMLElement
    if (trigger) trigger.click()
  },
}

/** The universal AI search menu opened — grouped destinations plus the "Ask Da Vinci" escape hatch. */
export const SearchOpen: Story = {
  name: 'Search (Open)',
  render: appBarStory(),
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    const trigger = canvasElement.querySelector('[aria-label="Universal AI search"]') as HTMLElement
    if (trigger) trigger.click()
  },
}

/** Search open with a non-"All" type tab selected, narrowing results to one searchSources
 *  category without retyping (WP-C3). Tabs are `role="group"`-labeled, real `<button>`s
 *  (keyboard-reachable), and the combobox's own `aria-activedescendant` wiring is unaffected
 *  by which tab is active. */
export const SearchOpenWithTypeTabs: Story = {
  name: 'Search (Type Tabs)',
  render: appBarStory(),
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    const trigger = canvasElement.querySelector('[aria-label="Universal AI search"]') as HTMLElement
    if (trigger) trigger.click()
    await new Promise(resolve => setTimeout(resolve, 300))
    const tabs = document.querySelectorAll('.cmd-palette__tab')
    const nonAllTab = Array.from(tabs).find(t => t.textContent?.trim() !== 'All') as HTMLElement | undefined
    nonAllTab?.click()
  },
}

/** The bar at a 375px viewport (canvas only — the docs page doesn't resize). */
export const Mobile375: Story = {
  render: appBarStory(),
  globals: {
    viewport: { value: 'mobile375', isRotated: false },
  },
}

/** Gray skin — bar and sidebar share one continuous nav surface (light mode). */
export const SeamGray: Story = {
  render: navSeamStory(),
  parameters: { sidebarSkin: 'gray' },
  globals: { theme: 'light' },
}

/** White skin — white nav chrome beside a gray canvas (light mode). */
export const SeamWhite: Story = {
  render: navSeamStory(),
  parameters: { sidebarSkin: 'white' },
  globals: { theme: 'light' },
}

/** Dark skin on a light app theme — charcoal nav cluster (light mode). */
export const SeamDarkSkin: Story = {
  render: navSeamStory(),
  parameters: { sidebarSkin: 'dark' },
  globals: { theme: 'light' },
}

/** Dark mode — skin axis collapses; bar and sidebar share charcoal chrome. */
export const SeamDarkMode: Story = {
  render: navSeamStory(),
  globals: { theme: 'dark' },
}
