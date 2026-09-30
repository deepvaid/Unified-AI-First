import { reactive } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import ThemeInspectorPanel from './ThemeInspectorPanel.vue'
import ThemeSettingsInspector from './ThemeSettingsInspector.vue'
import { THEME_SETTINGS_ITEMS, seedSettings, type ThemeEditorSettings, type ThemeSettingsItemId } from '@/stores/themeEditorData'

const meta = {
  title: 'Product/Sales Channels/Theme editor/ThemeSettingsInspector',
  component: ThemeSettingsInspector,
  tags: ['autodocs'],
  parameters: {
    canvas: 'full',
    docs: {
      description: {
        component: `
### Overview
The inspector body for a **Theme Settings** page (store builder re-skin), rendered inside
\`ThemeInspectorPanel\`. Logo, Social Media, Buttons, Product Card and Furniture surfaces are plain
forms on \`MpFormGrid\`; Theme Colors and Typography are the admin's scheme lists — the default
scheme, "New scheme", then "Current themes" as \`ThemeSchemeCard\`s — with an inline edit form.
Every edit goes through the \`change\` emit so the store stays the owner of the settings.

**Use when:** the rail's palette item is active and a settings page is selected.
        `,
      },
    },
  },
  argTypes: {
    item: { control: 'select', options: THEME_SETTINGS_ITEMS.map((entry) => entry.id) },
    settings: { control: false },
    onChange: { table: { category: 'events' }, description: 'A mutator to apply to the settings.' },
  },
} satisfies Meta<typeof ThemeSettingsInspector>

export default meta
type Story = StoryObj<typeof meta>

function panelStory(item: ThemeSettingsItemId): Story {
  return {
    render: () => ({
      components: { ThemeInspectorPanel, ThemeSettingsInspector },
      setup() {
        const settings = reactive(seedSettings())
        const label = THEME_SETTINGS_ITEMS.find((entry) => entry.id === item)?.label ?? item
        const apply = (mutate: (s: ThemeEditorSettings) => void) => mutate(settings)
        return { settings, label, item, apply }
      },
      template: `
        <div style="display: flex; justify-content: flex-end; height: 640px; border: 1px solid var(--border-subtle); border-radius: var(--mp-component-card-radius); overflow: hidden;">
          <ThemeInspectorPanel :title="label">
            <ThemeSettingsInspector :item="item" :settings="settings" @change="apply" />
          </ThemeInspectorPanel>
        </div>
      `,
    }),
  }
}

/** Logo — image, link, store name, description, language. */
export const Default: Story = panelStory('logo')

/** Theme Colors — the default scheme, New scheme, and the current themes. */
export const ThemeColors: Story = panelStory('theme-colors')

/** Typography — the same scheme pattern with type samples. */
export const Typography: Story = panelStory('typography')

/** Buttons — radius, style, case, with a live preview pair. */
export const Buttons: Story = panelStory('buttons')

/** Social Media, Product Card and Furniture surfaces are plain forms. */
export const SocialMedia: Story = panelStory('social-media')
