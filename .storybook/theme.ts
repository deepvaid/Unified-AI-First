import { create } from 'storybook/theming/create'

export default create({
  base: 'light',
  brandTitle: 'MaroBase Design System',
  brandUrl: 'https://maropost.com',
  brandTarget: '_self',

  // Colors — MaroBase cyan + neutral cool-grey
  colorPrimary: '#1ab7ea',
  colorSecondary: '#1a1814',

  // UI — neutral cool-grey surfaces
  appBg: '#f5f6f7',
  appContentBg: '#ffffff',
  appPreviewBg: '#ffffff',
  appBorderColor: '#e2e4e7',
  appBorderRadius: 12,

  // Text
  textColor: '#1a1814',
  textInverseColor: '#FFFFFF',
  textMutedColor: '#6b7280',

  // Toolbar
  barTextColor: '#6b7280',
  barSelectedColor: '#1ab7ea',
  barHoverColor: '#1ab7ea',
  barBg: '#ffffff',

  // Inputs
  inputBg: '#ffffff',
  inputBorder: '#e2e4e7',
  inputTextColor: '#1a1814',
  inputBorderRadius: 8,

  // Font
  fontBase: '"Inter", system-ui, -apple-system, sans-serif',
  fontCode: '"JetBrains Mono", "Fira Code", monospace',
})
