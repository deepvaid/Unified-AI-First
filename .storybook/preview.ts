import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

// Vuetify — full import to ensure all component styles are available in stories
import '@mdi/font/css/materialdesignicons.css' // fallback for any residual mdi-* strings
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { lucideIconSet } from '../src/plugins/lucideIcons'

// Global styles
import '../src/styles/app-styles'
// Storybook-only canvas chrome (see the file header for why it lives here)
import './preview.css'

import { maropostDark, maropostDefaults, maropostLight } from '../src/plugins/maropostTheme'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'lucide',
    sets: {
      lucide: lucideIconSet,
    },
  },
  theme: {
    defaultTheme: 'maropostLight',
    themes: { maropostLight, maropostDark },
  },
  defaults: maropostDefaults,
})

const storybookRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      name: 'StorybookRoute',
      component: { template: '<div />' },
    },
  ],
})

void storybookRouter.push('/accounts/2000290/dashboard')

type ThemeMode = 'light' | 'dark'
type AccentKey = 'cyan' | 'blue' | 'gray' | 'purple'
/** Story canvas policy — `padded` for everything, `full` for shells/overlays. */
type CanvasMode = 'padded' | 'full'

// ── Register plugins globally for all stories ──────────────────────────────
setup((app) => {
  app.use(vuetify)
  app.use(createPinia())
  app.use(storybookRouter)
})

function normalizeTheme(theme: string): ThemeMode {
  return theme === 'maropostDark' || theme === 'dark' ? 'dark' : 'light'
}

function normalizeAccent(accent: string): AccentKey {
  if (accent === 'blue' || accent === 'gray' || accent === 'purple') return accent
  return 'cyan'
}

function normalizeCanvas(canvas: unknown): CanvasMode {
  return canvas === 'full' ? 'full' : 'padded'
}

/**
 * Mirrors useAppTheme's applyMode (data-theme on <html>), plus stamps the
 * Vuetify theme class on <body>, which global.scss's
 * `body { background: rgb(var(--v-theme-background)) }` reads.
 *
 * P5.5: the decorator used to nest a <v-theme-provider> inside <v-app>, so the
 * theme class landed on an inner div while <v-app> itself stayed on the default
 * (light) theme. global.scss sets `.v-application { color: rgb(var(--v-theme-on-background)) }`,
 * which therefore resolved to light ink and INHERITED down into the dark canvas —
 * every story text node that didn't set its own color rendered dark-on-dark.
 * <v-app :theme> puts the theme class on .v-application itself, which fixes that
 * and also lets `.v-application.v-theme--maropostDark`-qualified selectors
 * (mp-theme-aliases.css, source-cloud-colors.css) match the way they do in the app.
 */
function syncDocumentTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
  document.body.classList.toggle('v-theme--maropostDark', theme === 'dark')
  document.body.classList.toggle('v-theme--maropostLight', theme !== 'dark')
}

/** Mirrors useAppTheme accent bridge — cyan has no data-accent attribute. */
function syncDocumentAccent(accent: AccentKey) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  if (accent === 'cyan') {
    delete root.dataset.accent
  } else {
    root.dataset.accent = accent
  }
}

// ── Storybook preview config ───────────────────────────────────────────────
const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Visual theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    accent: {
      description: 'Brand accent preset (maps to accent-presets.css)',
      toolbar: {
        title: 'Accent',
        icon: 'circlehollow',
        items: [
          { value: 'cyan', title: 'Cyan (default)' },
          { value: 'blue', title: 'Blue' },
          { value: 'gray', title: 'Gray' },
          { value: 'purple', title: 'Purple' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    accent: 'cyan',
  },
  decorators: [
    (story, context) => ({
      components: { story },
      setup() {
        const theme = normalizeTheme(String(context.globals.theme ?? 'light'))
        const accent = normalizeAccent(String(context.globals.accent ?? 'cyan'))
        const vuetifyTheme = theme === 'dark' ? 'maropostDark' : 'maropostLight'
        const canvas = normalizeCanvas(context.parameters.canvas)

        syncDocumentTheme(theme)
        syncDocumentAccent(accent)

        return {
          theme,
          accent,
          vuetifyTheme,
          canvas,
        }
      },
      template: `
        <div
          class="mp-storybook-root"
          :class="theme === 'dark' ? 'mp-storybook-root--dark' : 'mp-storybook-root--light'"
          :data-theme="theme"
          :data-accent="accent === 'cyan' ? undefined : accent"
          data-visual-root
        >
          <v-app :theme="vuetifyTheme">
            <div class="mp-story-canvas" :data-canvas="canvas">
              <div class="mp-story-canvas__content">
                <story />
              </div>
            </div>
          </v-app>
        </div>
      `,
    }),
  ],
  parameters: {
    // The decorator owns padding and background (.storybook/preview.css), so
    // Storybook's own chrome stays out of the way. Per-story escape hatch:
    // `parameters: { canvas: 'full' }` for shells and overlays.
    layout: 'fullscreen',
    canvas: 'padded',
    backgrounds: { disable: true },
    // P5.5 — @storybook/addon-a11y. The addon was installed and registered in
    // main.ts but never configured, so no rules ran. `test: 'todo'` surfaces
    // violations in the a11y panel per story without failing anything: the repo
    // has no test runner, so 'error' would have nothing to run in. Contrast is
    // the rule this phase exists for, so it is named explicitly rather than left
    // to the default set.
    a11y: {
      test: 'todo',
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          // Story canvases are fragments, not documents — these three always
          // fire on a Storybook iframe and would bury the real findings.
          { id: 'region', enabled: false },
          { id: 'landmark-one-main', enabled: false },
          { id: 'page-has-heading-one', enabled: false },
        ],
      },
    },
    // Shared viewport presets — select per story via
    // `globals: { viewport: { value: 'mobile375', isRotated: false } }`.
    viewport: {
      options: {
        mobile375: {
          name: 'Mobile 375',
          styles: { width: '375px', height: '812px' },
          type: 'mobile' as const,
        },
      },
    },
    options: {
      // Five buckets: the four Marobase design-system tiers, plus Product for
      // app-specific surfaces. See CLAUDE.md -> Story hierarchy and the Phase 5
      // changelog in DESIGN_AUDIT.md for why Product exists.
      storySort: {
        order: [
          'Introduction',
          'Foundations', [
            'Overview', 'Colors', 'Typography', 'Spacing', 'Radius & Shadows',
            'Icons', 'Buttons', 'Tooltips',
          ],
          'Atoms',
          'Molecules',
          'Patterns', ['Data Table', 'Form Fields', 'Layering', 'Module Landing Page', 'App Shell', 'Builder Shell', 'Settings'],
          'Product', ['Da Vinci', 'Dashboards', 'Marketing', 'Merchandising', 'PLG', 'RBAC', 'Sales Channels'],
          '*',
        ],
      },
    },
  },
}

export default preview
