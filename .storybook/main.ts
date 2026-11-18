import type { StorybookConfig } from '@storybook/vue3-vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Storybook loads the project's vite.config.ts, so the Vuetify plugin, the `@` alias and the
// SCSS token prelude all come from there. Registering them again here ran the plugin twice.

/** Every `vuetify/components/*` entry the Vuetify plugin can inject an import for. */
function vuetifyComponentEntries(): string[] {
  const file = fileURLToPath(new URL('../node_modules/vuetify/dist/json/importMap.json', import.meta.url))
  const map = JSON.parse(readFileSync(file, 'utf8')) as { components: Record<string, { from: string }> }
  return [...new Set(Object.values(map.components).map((component) => `vuetify/${component.from}`))]
}

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/vue3-vite',
  viteFinal: async (config) => {
    // The Vuetify plugin adds its component imports while a file is transformed, after Vite has
    // scanned for dependencies. Left alone, the dev server finds them one story at a time and
    // reloads the page for each. Listing them up front bundles them once.
    config.optimizeDeps = config.optimizeDeps || {}
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include ?? []),
      ...vuetifyComponentEntries(),
      'vuetify/directives',
    ]
    // Build output is not source: a `build-storybook` beside a running dev server reloaded it.
    config.server = config.server || {}
    config.server.watch = {
      ...config.server.watch,
      ignored: ['**/dist/**', '**/dist-storybook/**', '**/output/**'],
    }
    return config
  },
  tags: ['autodocs'],
  docs: {
    defaultName: 'Docs',
  },
}

export default config
