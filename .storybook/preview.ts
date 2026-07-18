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
import '../src/styles/mb-foundation.tokens.css'
import '../src/design-tokens/generated/variables.css'
import '../src/styles/mp-theme-aliases.css'
import '../src/styles/marobase-tokens.css'
import '../src/styles/dv-tokens.css'
import '../src/styles/global.scss'

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

// ── Register plugins globally for all stories ──────────────────────────────
setup((app) => {
  app.use(vuetify)
  app.use(createPinia())
  app.use(storybookRouter)
})

function normalizeTheme(theme: string) {
  return theme === 'maropostDark' || theme === 'dark' ? 'dark' : 'light'
}

function syncDocumentTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') {
    return
  }

  const isDark = theme === 'dark'
  const root = document.documentElement
  const body = document.body

  root.dataset.theme = theme
  root.classList.toggle('theme-dark', isDark)
  root.classList.toggle('theme-light', !isDark)
  root.classList.toggle('v-theme--dark', isDark)
  root.classList.toggle('v-theme--light', !isDark)

  if (body) {
    body.dataset.theme = theme
    body.classList.toggle('theme-dark', isDark)
    body.classList.toggle('theme-light', !isDark)
    body.classList.toggle('v-theme--dark', isDark)
    body.classList.toggle('v-theme--light', !isDark)
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
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (story, context) => ({
      components: { story },
      setup() {
        const theme = normalizeTheme(String(context.globals.theme ?? 'light'))
        const vuetifyTheme = theme === 'dark' ? 'maropostDark' : 'maropostLight'

        syncDocumentTheme(theme)

        return {
          theme,
          vuetifyTheme,
        }
      },
      template: `
        <div
          class="mp-storybook-root"
          :class="theme === 'dark' ? 'mp-storybook-root--dark' : 'mp-storybook-root--light'"
          :data-theme="theme"
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
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundations', ['Colors', 'Typography', 'Spacing', 'Radius & Shadows', 'Icons'],
          'Layout', 'Navigation', 'Forms', 'Data Display', 'Feedback', 'Overlays',
          'Patterns', 'AI', 'Copilot', 'Dashboards', 'Marketing', 'Merchandising',
          'RBAC', 'Sales Channels', 'Settings', '*',
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
  `
  document.head.appendChild(style)
}
