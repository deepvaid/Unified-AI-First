import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import AppBar from './AppBar.vue'
import AppSidebar from './AppSidebar.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import { appShell, overlayDocs } from '@/stories/decorators'
import { liquidskyDocs } from '@/stories/storyTemplate'

/**
 * The shell chrome lives on `<html>`: `data-sidebar` (the nav skin), `data-shell` and
 * `data-frame` (the shell variant). `appShell` stamps the app's defaults (gray, studio, on) for
 * every story and reads `parameters.sidebarSkin` for the other skins. All three are one value
 * per document, so a story on a non-default skin renders in its own docs frame.
 */

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

/** The bar in its own layout, which is what keeps `v-app-bar` out of the root `v-app` layout. */
function appBarStory(note = 'Main content area below the app bar.') {
  return () => ({
    components: { AppBar },
    template: `
      <v-layout>
        <AppBar />
        ${shellMain(`<p class="text-body-1">${note}</p>`)}
      </v-layout>
    `,
  })
}

/** Sidebar, bar and page together at viewport height, as App.vue lays them out. */
function shellStory(body: string, components: Record<string, unknown> = {}) {
  return () => ({
    components: { AppBar, AppSidebar, ...components },
    setup() {
      const open = ref(true)
      const rail = ref(false)
      return { open, rail }
    },
    template: `
      <v-layout class="h-screen">
        <AppSidebar v-model="open" v-model:rail="rail" />
        <AppBar />
        ${shellMain(body)}
      </v-layout>
    `,
  })
}

const SEAM_NOTE = `
  <p class="text-body-1">
    The head nav and side nav paint the same <code>--mp-nav-surface</code>, so the seam between
    them reads as one continuous plane.
  </p>
`

const meta = {
  title: 'Patterns/App Shell/AppBar',
  component: AppBar,
  tags: ['autodocs', 'liquidsky'],
  decorators: [appShell],
  parameters: {
    canvas: 'full',
    sidebarSkin: 'gray',
    docs: {
      description: {
        component: liquidskyDocs('patterns-app-shell-appbar') + `
### Overview
\`AppBar\` is the main top navigation bar of the Maropost platform, \`layout.appbarHeight\`
(56px) tall. It provides the universal AI search menu, the quick-create menu (with single-key
shortcuts while open), the
notification centre (\`MpNotificationsMenu\`), Galaxy and Settings shortcuts, the Da Vinci assistant menu, and the user
profile menu (account switcher, theme toggle, sign-out). It takes **no props** — everything is
wired to global state. Every control in the bar (search field, quick create, notifications,
Settings, the Da Vinci pill, the avatar) resolves to \`component.control.height\` (40px).

**Chrome:** the bar shares the \`--mp-nav-surface\` bind with \`AppSidebar\` (\`shell-variants.css\`)
so head nav and side nav can never drift. The skin (\`<html data-sidebar>\`) only differentiates
light mode — in dark mode both navs resolve to the same charcoal surface from the \`dark\` token
ramp. In the studio shell (the app default) the bar has no bottom border and \`v-main\` paints
the same surface, so the rounded content frame is the only edge. The Seam stories below show
bar and sidebar together on each skin.

**Store coupling:** \`useAccounts\` (active account + switcher list), \`useCopilot\` (opens the
Da Vinci assistant), \`useUserProfile\` (avatar), and \`useAppTheme\` (light/dark mode). The
Storybook preview registers Pinia with the stores' seeded defaults (account 2000290) and stubs
the named routes the bar links to.

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
- **Don't** override its height; it reads \`layout.appbarHeight\` (56px).

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

### API
\`AppBar\` takes **no props, emits, or slots**, which is why the Controls panel is empty. It is
app chrome that reads what it needs from the router and from \`useAccountsStore\`,
\`useCopilotStore\`, \`useUserProfile\`, \`useAppTheme\`, \`useMobileNav\`, \`useToast\`,
\`usePlgStore\` and \`useNotifications\` (behind the bell, via \`MpNotificationsMenu\`). Drive its
states in stories and demos by seeding those stores, not by passing config. The one story-level
knob is \`parameters.sidebarSkin\` (\`gray\` | \`white\` | \`dark\`), which the shared \`appShell\`
decorator stamps onto \`<html data-sidebar>\` beside the app's default \`data-shell="studio"\`.

### Skins and states
The bar has one structure; there are no variants to put side by side. Its skins are **Seam Gray**
(the app default), **Seam White** and **Seam Dark Skin**, each in its own frame because the skin
is one attribute per document. The narrow layout (a hamburger and a search button in place of the
field) follows the viewport: **Mobile 375**. Its states live in its overlays, each with its own
story: **Search (Open)**, **Search (Type Tabs)**, **Create Menu (Open)**, **Profile Menu (Open)**
and **Language Menu (Open)**. Every row in those panels is \`component.listItem.*\`, so a menu row
and a sidebar row are the same height.
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
  parameters: overlayDocs(),
  play: async ({ canvasElement }) => {
    // Auto-open the profile dropdown for Storybook preview
    await new Promise(resolve => setTimeout(resolve, 500))
    const trigger = canvasElement.querySelector('.user-menu-trigger') as HTMLElement
    if (trigger) trigger.click()
  },
}

/**
 * The user menu's Language panel: the quick switch for a user's own language. It is the same
 * setting as Settings › General › Preferred Language, so the two always agree. Languages are
 * listed under their own names. The prototype stores the choice; it does not translate its copy.
 */
export const LanguageMenuOpen: Story = {
  name: 'Language Menu (Open)',
  render: appBarStory(),
  parameters: overlayDocs(),
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    canvasElement.querySelector<HTMLElement>('.user-pill')?.click()
    await new Promise(resolve => setTimeout(resolve, 300))
    // The menu is teleported out of the canvas.
    document.querySelector<HTMLElement>('.um-language-trigger')?.click()
  },
}

/** The quick-create menu opened — grouped create targets with single-key shortcuts (D/W/E/S/A/L). */
export const CreateMenuOpen: Story = {
  name: 'Create Menu (Open)',
  render: appBarStory(),
  parameters: overlayDocs(),
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
  parameters: overlayDocs(),
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
  parameters: overlayDocs(),
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

/** Gray skin, the app default — bar and sidebar share one continuous nav surface (light mode). */
export const SeamGray: Story = {
  render: shellStory(SEAM_NOTE),
  parameters: { sidebarSkin: 'gray', ...overlayDocs() },
  globals: { theme: 'light' },
}

/** White skin — white nav chrome, and the content frame carries the gray (light mode). */
export const SeamWhite: Story = {
  render: shellStory(SEAM_NOTE),
  parameters: { sidebarSkin: 'white', ...overlayDocs() },
  globals: { theme: 'light' },
}

/** Dark skin on a light app theme — charcoal nav cluster (light mode). */
export const SeamDarkSkin: Story = {
  render: shellStory(SEAM_NOTE),
  parameters: { sidebarSkin: 'dark', ...overlayDocs() },
  globals: { theme: 'light' },
}

// ── Template: Variants · States ──────────────────────────────────────────────

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The bar over a real page, with the sidebar beside it and the page inside the
 * content frame — the only way to judge whether the control row reads as one band. The sidebar
 * header is `layout.appbarHeight` (56px) plus its 1px divider, so the brand row and the bar
 * line up. The app opens with the sidebar collapsed to its rail; it is expanded here.
 */
export const InContextAppShell: Story = {
  parameters: overlayDocs('720px'),
  render: shellStory(`
    <MpPageHeader title="Dashboard" subtitle="Northwind Supply Co. · last 30 days" />
    <v-row dense class="mt-6">
      <v-col cols="12" sm="6" lg="3">
        <MpKpiCard label="Revenue" value="$43,565.90" icon="dollar-sign" trend="+12.4%" trend-positive period="vs. prior 30 days" />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <MpKpiCard label="Orders" value="82" icon="shopping-cart" trend="+6" trend-positive period="vs. prior 30 days" />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <MpKpiCard label="Open rate" value="58.2%" icon="mail-open" trend="+2.1pt" trend-positive period="vs. prior 30 days" />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <MpKpiCard label="Tickets" value="14" icon="life-buoy" trend="-3" :trend-positive="false" period="vs. prior 30 days" />
      </v-col>
    </v-row>
  `, { MpPageHeader, MpKpiCard }),
}
