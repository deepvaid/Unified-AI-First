import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createPinia } from 'pinia'
import { reactive, watchEffect } from 'vue'
import { createMemoryHistory, createRouter, type RouteLocationRaw, type RouteRecordNameGeneric, type Router } from 'vue-router'

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
import { useAppTheme } from '../src/composables/useAppTheme'

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

const routeStub = { template: '<div />' }

const storybookRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    // Every app route sits under an account, and components read `route.params.accountId`.
    { path: '/accounts/:accountId/:pathMatch(.*)*', name: 'StorybookRoute', component: routeStub },
    { path: '/:pathMatch(.*)*', name: 'StorybookFallback', component: routeStub },
  ],
})

/**
 * Components link to app routes by name (`:to="{ name: 'Settings' }"`). Storybook has none of
 * the app's routes and vue-router throws on an unknown name, which blanked every story that
 * rendered such a link. The first request for a name registers a stub route for it.
 */
const stubParams = new Map<RouteRecordNameGeneric, Set<string>>()

function ensureNamedRoute(to: RouteLocationRaw) {
  if (typeof to !== 'object' || !('name' in to) || to.name == null) return
  const known = stubParams.get(to.name) ?? new Set<string>()
  const wanted = Object.keys(to.params ?? {}).filter((key) => key !== 'accountId' && !known.has(key))
  if (storybookRouter.hasRoute(to.name) && !wanted.length) return
  // A name asked for again with a param it did not have before replaces its stub (same name).
  wanted.forEach((key) => known.add(key))
  stubParams.set(to.name, known)
  storybookRouter.addRoute({
    // `accountId` is required so a named link inherits the current account (2000290).
    path: `/accounts/:accountId/sb/${String(to.name)}${[...known].map((key) => `/:${key}?`).join('')}`,
    name: to.name,
    component: routeStub,
  })
}

const { resolve, push, replace } = storybookRouter
storybookRouter.resolve = ((to, from) => { ensureNamedRoute(to); return resolve(to, from) }) as Router['resolve']
storybookRouter.push = (to) => { ensureNamedRoute(to); return push(to) }
storybookRouter.replace = (to) => { ensureNamedRoute(to); return replace(to) }

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

/** The Theme and Accent toolbar values, shared by every mounted story. */
const toolbar = reactive({ theme: 'light' as ThemeMode, accent: 'cyan' as AccentKey })

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
    (story, context) => {
      // Storybook calls the decorator again when a toolbar global changes but does not remount
      // the story, so `setup()` below never re-runs. Reading the globals here, into reactive
      // state the mounted template is bound to, is what makes the Theme and Accent toolbars
      // change a story that is already open.
      toolbar.theme = normalizeTheme(String(context.globals.theme ?? 'light'))
      toolbar.accent = normalizeAccent(String(context.globals.accent ?? 'cyan'))
      syncDocumentTheme(toolbar.theme)
      syncDocumentAccent(toolbar.accent)
      // Chart widgets read Vuetify's global theme, not the nearest <v-app :theme>.
      vuetify.theme.change(toolbar.theme === 'dark' ? 'maropostDark' : 'maropostLight')

      return {
        components: { story },
        setup() {
          // Charts and the Da Vinci orb take their mode and accent from useAppTheme.
          const { mode, accent } = useAppTheme()
          watchEffect(() => {
            mode.value = toolbar.theme
            accent.value = toolbar.accent
          })
          return { toolbar, canvas: normalizeCanvas(context.parameters.canvas) }
        },
        template: `
          <div
            class="mp-storybook-root"
            :class="toolbar.theme === 'dark' ? 'mp-storybook-root--dark' : 'mp-storybook-root--light'"
            :data-theme="toolbar.theme"
            :data-accent="toolbar.accent === 'cyan' ? undefined : toolbar.accent"
            data-visual-root
          >
            <v-app :theme="toolbar.theme === 'dark' ? 'maropostDark' : 'maropostLight'">
              <div class="mp-story-canvas" :data-canvas="canvas">
                <div class="mp-story-canvas__content">
                  <story />
                </div>
              </div>
            </v-app>
          </div>
        `,
      }
    },
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
        tablet768: {
          name: 'Tablet 768',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet' as const,
        },
        desktop1280: {
          name: 'Desktop 1280',
          styles: { width: '1280px', height: '800px' },
          type: 'desktop' as const,
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
          'LiquidSky',
          'Foundations', [
            'Overview', 'Colors', 'Typography', 'Spacing', 'Radius & Shadows',
            'Icons', 'Buttons', 'Tooltips', 'QA Reference',
          ],
          'Atoms',
          'Molecules',
          'Patterns', ['Data Table', 'Form Fields', 'Layering', 'Module Landing Page', 'App Shell', 'Builder Shell', 'Wizard Shell', 'Settings'],
          'Product', ['Chatbot', 'Da Vinci', 'Dashboards', 'Maropay', 'Marketing', 'Merchandising', 'Onboarding', 'PLG', 'POS', ['Overview', 'Foundations', ['Colors', 'Type & Targets'], 'Components', 'Patterns'], 'Products', 'RBAC', 'Sales Channels', 'Service', 'Storefront', 'Trial Lab'],
          '*',
        ],
      },
    },
  },
}

export default preview
