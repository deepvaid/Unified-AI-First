import type { Meta, StoryObj } from '@storybook/vue3'

const meta = {
  title: 'Introduction',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'This Storybook documents the **Maropost design system** — the `Mp*` component library that powers the Vue 3 + Vuetify prototype app used for UX exploration and stakeholder review.',
          '',
          '## Sidebar map',
          '',
          '- **Foundations** — design tokens: colors, typography, spacing, radius & shadows, icons.',
          '- **Component groups** — Layout, Navigation, Forms, Data Display, Feedback, Overlays, Patterns.',
          '- **Feature areas** — AI, Copilot, Dashboards, Marketing, Merchandising, RBAC, Sales Channels, Settings.',
          '',
          '## Token pipeline',
          '',
          'All design values live in `src/design-tokens/tokens.json`. Run `npm run tokens:build` to regenerate the SCSS, CSS, and TypeScript outputs.',
          '',
          '## Key conventions',
          '',
          '- Icons are **Lucide** only (kebab-case names, e.g. `chevron-down`) — no `mdi-*` strings in new code.',
          '- Cards are always `flat border rounded="lg"` — no elevation shadows.',
          '- Forms open in `MpFormDrawer`; confirmations use `MpConfirmDialog` — never a raw `v-dialog`.',
          '- Status columns always use `MpStatusChip` with the correct `type` prop.',
          '- Every table or list has an `MpEmptyState` for its zero-items case.',
          '',
          'Full component API reference: `CLAUDE.md` and `docs/design-system/`.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Readme: Story = {
  render: () => ({
    template:
      '<p class="text-body-1">Use the sidebar: <strong>Foundations</strong> for design tokens, the component groups (<strong>Layout</strong> through <strong>Patterns</strong>) for the Mp* library, and the feature areas (<strong>AI</strong> through <strong>Settings</strong>) for composed product surfaces.</p>',
  }),
}
