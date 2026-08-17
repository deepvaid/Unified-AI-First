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

/**
 * Mirrors useAppTheme's applyMode (data-theme on <html>), plus stamps the
 * Vuetify theme class on <body>. In the real app, <body> sits inside the
 * v-app root so it inherits --v-theme-background from Vuetify's global
 * theme class; in Storybook the story tree is wrapped in a nested
 * <v-theme-provider> instead, which scopes those CSS variables to its own
 * subtree and never reaches its <body> ancestor. Without this, global.scss's
 * `body { background: rgb(var(--v-theme-background)) }` falls back to the
 * default (light) theme regardless of the selected Storybook theme.
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

        syncDocumentTheme(theme)
        syncDocumentAccent(accent)

        return {
          theme,
          accent,
          vuetifyTheme,
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
          <v-app>
            <v-theme-provider :theme="vuetifyTheme">
              <div class="pa-6 mp-story-canvas">
                <story />
              </div>
            </v-theme-provider>
          </v-app>
        </div>
      `,
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
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
      storySort: {
        order: [
          'Introduction',
          'Foundations', ['Colors', 'Typography', 'Spacing', 'Radius & Shadows', 'Icons', 'Buttons', 'Tooltips'],
          'Layout', 'Navigation', 'Forms', 'Data Display', 'Feedback', 'Overlays',
          'Patterns', 'AI', 'Copilot', 'Dashboards', 'Marketing', 'Merchandising',
          'PLG', 'RBAC', 'Sales Channels', 'Settings', '*',
        ],
      },
    },
  },
}

export default preview

if (typeof document !== 'undefined' && !document.getElementById('mp-storybook-preview-style')) {
  const style = document.createElement('style')
  style.id = 'mp-storybook-preview-style'
  style.textContent = `
    .mp-storybook-root,
    .mp-storybook-root .v-application,
    .mp-storybook-root .v-application__wrap {
      min-height: 100vh;
      width: 100%;
    }

    .mp-storybook-root .v-application {
      background: transparent;
    }

    .mp-storybook-root .mp-story-canvas {
      background: var(--surface-canvas, rgb(var(--v-theme-background)));
      min-height: calc(100vh - 48px);
    }
  `
  document.head.appendChild(style)
}
