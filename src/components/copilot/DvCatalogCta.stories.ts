import type { Meta, StoryObj } from '@storybook/vue3'
import DvCatalogCta from './DvCatalogCta.vue'
import { grid } from '@/stories/storyTemplate'

const meta = {
  title: 'Product/Da Vinci/DvCatalogCta',
  component: DvCatalogCta,
  tags: ['autodocs'],
  args: {
    label: 'Create with Da Vinci',
    variant: 'tonal',
    size: 'md',
    iconOnly: false,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text', description: '“Create with Da Vinci” on the Products index, “Edit with Da Vinci” on the edit page, “Generate with Da Vinci” on a field.' },
    variant: { control: 'inline-radio', options: ['tonal', 'link', 'outlined', 'text'], description: '`tonal` in a page header — the Da Vinci soft tint, the same surface as the drawer’s catalog context bar. `link` in a field’s label row (24px hit area). `outlined` / `text` are neutral fallbacks.' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'], description: 'Maps onto the button ramp (not used by `link`).' },
    iconOnly: { control: 'boolean', description: 'The mark only, on the control-height baseline — header CTAs on phones. The label stays the accessible name and the tooltip.' },
    disabled: { control: 'boolean', description: 'A role that can’t create or edit products. The CTA stays visible; the reason shows on hover.' },
    disabledReason: { control: 'text', description: 'Tooltip copy while disabled.' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
The one entry point into Catalog Co-Pilot from the Products module (PRD: Da Vinci Catalog Management).
Emits \`click\`; the host fires the CTA analytics and opens the drawer in the right context.

## Rules
- The host hides it when the feature flag is off or the plan is Build — never this component.
- A view-only role gets \`disabled\`, not a hidden button: the PRD keeps the capability visible.
- Tonal stays below the page's one filled primary action. On phones, pass \`iconOnly\` so the header keeps its rows.
- A field CTA sits in the field's label row (\`variant="link"\`, absolutely positioned by the host), never on a row of its own.
`,
      },
    },
  },
} satisfies Meta<typeof DvCatalogCta>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: grid({ DvCatalogCta }, [
    { label: 'Tonal — Products index', args: { variant: 'tonal', label: 'Create with Da Vinci' } },
    { label: 'Tonal — product edit header', args: { variant: 'tonal', label: 'Edit with Da Vinci' } },
    { label: 'Link — a field’s label row', args: { variant: 'link', label: 'Generate with Da Vinci' } },
    { label: 'Outlined — neutral fallback', args: { variant: 'outlined' } },
  ]),
}

export const Sizes: Story = {
  render: grid({ DvCatalogCta }, [
    { label: 'sm', args: { size: 'sm' } },
    { label: 'md', args: { size: 'md' } },
    { label: 'lg', args: { size: 'lg' } },
  ]),
}

export const States: Story = {
  render: grid({ DvCatalogCta }, [
    { label: 'Enabled', args: {} },
    { label: 'Icon only — phones (hover for the label)', args: { iconOnly: true } },
    { label: 'Disabled — view-only role (hover or focus for the reason)', args: { disabled: true } },
    { label: 'Disabled — icon only', args: { disabled: true, iconOnly: true } },
    { label: 'Disabled — link', args: { disabled: true, variant: 'link', label: 'Generate with Da Vinci' } },
  ]),
}
