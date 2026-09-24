import type { Meta, StoryObj } from '@storybook/vue3'
import MaropayRatesTable from './MaropayRatesTable.vue'
import { catalogFor } from '@/maropay/model'

const meta = {
  title: 'Product/Maropay/MaropayRatesTable',
  component: MaropayRatesTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The illustrative method catalogue — cards, wallets, buy now pay later and bank methods — with each
method's rate and availability for the account. Methods that need a review, or that the account's
currency can't present, never appear as simply "Available". The caption states that the rates are
illustrative until the business's applicable rates are shown with the terms.
        `,
      },
    },
  },
  args: { methods: catalogFor('USD') },
} satisfies Meta<typeof MaropayRatesTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Discovery hides methods the account can't use at all. */
export const HideUnavailable: Story = { args: { hideUnavailable: true } }

/** A EUR account: iDEAL and SEPA become available, US-only methods don't. */
export const EuroAccount: Story = { args: { methods: catalogFor('EUR') } }

/** In Settings, after the terms were accepted, the caption says which terms the rates come from. */
export const AfterTermsAccepted: Story = {
  args: { caption: 'Rates from the terms you accepted on Sep 1, 2026 (version 2026-09-illustrative). Illustrative in this prototype. No additional Maropay fee.' },
}
