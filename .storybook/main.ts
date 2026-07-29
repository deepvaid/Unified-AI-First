import type { StorybookConfig } from '@storybook/vue3-vite'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/vue3-vite',
  viteFinal: async (config) => {
    const srcDir = fileURLToPath(new URL('../src', import.meta.url))
    const generatedVarsScss = fileURLToPath(
      new URL('../src/design-tokens/generated/_variables.scss', import.meta.url),
    )

    config.plugins?.push(
      vuetify({ autoImport: true })
    )
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': srcDir,
    }
    config.css = config.css || {}
    config.css.preprocessorOptions = config.css.preprocessorOptions || {}
    config.css.preprocessorOptions.scss = {
      ...config.css.preprocessorOptions.scss,
      additionalData: `@use "${generatedVarsScss}" as *;\n`,
    }
    return config
  },
  tags: ['autodocs'],
  docs: {
    defaultName: 'Docs',
  },
}

export default config
