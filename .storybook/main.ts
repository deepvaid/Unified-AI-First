import type { StorybookConfig } from '@storybook/vue3-vite'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../packages/marobase-ui/src/**/*.stories.@(ts|tsx)',
    '../packages/marobase-ui/src/**/*.mdx',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-themes',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/vue3-vite',
  viteFinal: async (config) => {
    const srcDir = fileURLToPath(new URL('../src', import.meta.url))
    const marobaseUiDir = fileURLToPath(new URL('../packages/marobase-ui/src', import.meta.url))

    config.plugins?.push(
      vuetify({ autoImport: true })
    )
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': srcDir,
      '@marobase/ui': marobaseUiDir,
    }
    config.css = config.css || {}
    config.css.preprocessorOptions = config.css.preprocessorOptions || {}
    config.css.preprocessorOptions.scss = {
      ...config.css.preprocessorOptions.scss,
      additionalData: `@use "${srcDir}/styles/tokens" as *;\n`,
    }
    return config
  },
  tags: ['autodocs'],
  docs: {
    defaultName: 'Docs',
  },
}

export default config
