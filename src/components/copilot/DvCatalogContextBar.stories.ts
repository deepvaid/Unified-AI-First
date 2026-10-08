import type { Meta, StoryObj } from '@storybook/vue3'
import DvCatalogContextBar from './DvCatalogContextBar.vue'
import { grid } from '@/stories/storyTemplate'
import { constrain } from '@/stories/decorators'

const PACK = { kind: 'pack', limit: 500, used: 10, expired: false } as const
const TRIAL = { kind: 'trial', limit: 50, used: 10, expired: false } as const

const meta = {
  title: 'Product/Da Vinci/DvCatalogContextBar',
  component: DvCatalogContextBar,
  tags: ['autodocs'],
  decorators: [constrain('compact')],
  args: {
    mode: 'create',
    wallet: PACK,
  },
  argTypes: {
    mode: { control: 'inline-radio', options: ['create', 'enrich', 'field'], description: 'What the drawer is working on.' },
    field: { control: 'inline-radio', options: ['description', 'seo'], description: 'Field mode only.' },
    productName: { control: 'text', description: 'The product being edited (enrich and field modes).' },
    wallet: { control: 'object', description: '`CatalogWallet` — trial allowance, Co-Pilot pack or none. Drives the allowance pill.' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
The strip under the Da Vinci header while the drawer is in catalog context: what Da Vinci is working on,
what's left in the allowance, and the way out (emits \`exit\`). It sits on the Da Vinci soft tint and uses
that surface's declared text pair. The allowance pill's tooltip carries the billing rule — credits move on
Apply, never on Publish or Discard.
`,
      },
    },
  },
} satisfies Meta<typeof DvCatalogContextBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: grid({ DvCatalogContextBar }, [
    { label: 'Create', args: { mode: 'create', wallet: PACK } },
    { label: 'Enrich', args: { mode: 'enrich', productName: 'Trail Runner Pro', wallet: PACK } },
    { label: 'Field — description', args: { mode: 'field', field: 'description', productName: 'Trail Runner Pro', wallet: PACK } },
    { label: 'Field — SEO', args: { mode: 'field', field: 'seo', productName: 'Allbirds Tree Runners - Wool White', wallet: PACK } },
  ], { columns: '1fr' }),
}

export const States: Story = {
  render: grid({ DvCatalogContextBar }, [
    { label: 'Trial — 4 of 5 left', args: { wallet: TRIAL } },
    { label: 'Trial — used up', args: { wallet: { ...TRIAL, used: 50 } } },
    { label: 'Trial — ended', args: { wallet: { ...TRIAL, used: 50, expired: true } } },
    { label: 'Co-Pilot pack', args: { wallet: PACK } },
    { label: 'No credits', args: { wallet: { kind: 'none', limit: 0, used: 0, expired: false } } },
  ], { columns: '1fr' }),
}
