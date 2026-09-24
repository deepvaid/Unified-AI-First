import type { MpSectionRailGroup } from '@/components/MpSectionRail.vue'

/**
 * Maropay workspace sections. Money comes first — the day-to-day work — then
 * the linked stores (each opens its own Payments page in the store editor),
 * then setup and settings.
 */
export interface MaropayMenuContext {
  openTasks: number
  openDisputes: number
  stores: Array<{ channelId: string; name: string }>
}

export function maropayMenu(accountId: string, ctx: MaropayMenuContext): MpSectionRailGroup[] {
  const params = { accountId }
  const groups: MpSectionRailGroup[] = [
    {
      items: [
        { slug: 'overview', label: 'Overview', icon: 'layout-dashboard', to: { name: 'MaropayOverview', params }, match: ['MaropayOverview'] },
      ],
    },
    {
      title: 'Money',
      items: [
        { slug: 'transactions', label: 'Transactions', icon: 'receipt', to: { name: 'MaropayTransactions', params }, match: ['MaropayTransactions', 'MaropayPaymentDetail'] },
        { slug: 'payouts', label: 'Payouts', icon: 'landmark', to: { name: 'MaropayPayouts', params }, match: ['MaropayPayouts', 'MaropayPayoutDetail'] },
        { slug: 'disputes', label: 'Disputes', icon: 'shield-alert', to: { name: 'MaropayDisputes', params }, match: ['MaropayDisputes', 'MaropayDisputeDetail'], count: ctx.openDisputes || undefined },
      ],
    },
  ]
  if (ctx.stores.length) {
    groups.push({
      title: 'Stores',
      items: ctx.stores.map((store) => ({
        slug: `store-${store.channelId}`,
        label: store.name,
        icon: 'globe',
        to: { name: 'StorePayments', params: { accountId, channelId: store.channelId } },
      })),
    })
  }
  groups.push({
    title: 'Setup',
    items: [
      { slug: 'setup', label: 'Setup & verification', icon: 'list-checks', to: { name: 'MaropaySetup', params }, match: ['MaropaySetup'], count: ctx.openTasks || undefined },
      { slug: 'checkout-preview', label: 'Checkout preview', icon: 'monitor-smartphone', to: { name: 'MaropayCheckoutPreview', params }, match: ['MaropayCheckoutPreview'] },
      { slug: 'settings', label: 'Settings', icon: 'settings', to: { name: 'MaropaySettings', params }, match: ['MaropaySettings'] },
    ],
  })
  return groups
}
