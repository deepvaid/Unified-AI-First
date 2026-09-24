/**
 * Synthetic Commerce data mirroring the seed rules in useCommerce (web order i:
 * status cycles Processing/Completed/Cancelled/Refunded/On Hold, channel mix,
 * payment method cycle, `pay_${910000 + i * 731}` references).
 */
import type { ScenarioChannel, ScenarioContext, ScenarioOrderRef } from '../../src/maropay/scenarios.ts'
import type { AdapterEnv } from '../../src/services/maropay/mockAdapter.ts'
import { defaultFailures } from '../../src/services/maropay/mockAdapter.ts'
import type { MaropayActingRole } from '../../src/maropay/model.ts'

export const NOW = Date.parse('2026-09-23T15:00:00')
export const DAY = 86_400_000

const TOTALS = [1180, 1040, 1120, 890, 760, 820, 940, 680, 590, 520, 610, 700, 640, 560, 620, 730, 850, 960, 1040, 900, 810, 720]
const MIX = ['Online Store', 'Amazon', 'Online Store', 'Online Store', 'eBay', 'Online Store', 'Instagram Shop', 'Online Store', 'Amazon', 'Online Store', 'eBay', 'Online Store', 'Online Store', 'Amazon', 'Online Store', 'Instagram Shop', 'Online Store', 'eBay', 'Online Store', 'Amazon']
const METHODS = ['Visa •••• 4242', 'Mastercard •••• 8888', 'Amex •••• 1234', 'PayPal', 'Shop Pay', 'Apple Pay']
const STATUSES = ['Processing', 'Completed', 'Cancelled', 'Refunded', 'On Hold']

function dateKey(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function orders(now = NOW): ScenarioOrderRef[] {
  return TOTALS.map((total, i) => {
    const status = STATUSES[i % 5]!
    return {
      id: i + 1,
      orderNumber: `#${10000 + i}`,
      channelId: MIX[i % 20] === 'Online Store' ? 'retest-sales-notification' : null,
      total: total.toFixed(2),
      currency: 'USD',
      date: dateKey(now - i * DAY),
      paymentStatus: status === 'Refunded' ? 'Refunded' : status === 'Cancelled' ? 'Voided' : 'Paid',
      paymentMethod: METHODS[i % 6]!,
      paymentReference: `pay_${910000 + i * 731}`,
      customer: { name: `Customer ${i + 1}`, email: `customer${i + 1}@email.com` },
    }
  })
}

export const CHANNELS: ScenarioChannel[] = [
  { id: 'retest-sales-notification', name: 'Atlas Outfitters', type: 'web_store', provider: 'maropost_store_builder', status: 'connected', domain: 'atlas-outfitters.uat.maropost.store' },
  { id: 'beta-sales-channel', name: 'Beta Sales Channel', type: 'web_store', provider: 'maropost_store_builder', status: 'needs_setup', domain: 'beta-2000290.uat.maropost.store' },
  { id: 'max-test-store', name: 'Max Test Store', type: 'web_store', provider: 'maropost_store_builder', status: 'draft', domain: 'max-test.uat.maropost.store' },
  { id: 'shopify-fashion', name: 'Fashion Boutique', type: 'web_store', provider: 'shopify', status: 'connected', domain: 'fashion-boutique.myshopify.com' },
  { id: 'pos-store', name: 'POS Store', type: 'offline_store', provider: 'other', status: 'connected', domain: null },
]

export const ATLAS = 'retest-sales-notification'
export const BETA = 'beta-sales-channel'

export function context(accountId = '2000290', now = NOW): ScenarioContext {
  return { accountId, accountName: 'Scooter Village (All access)', now, channels: CHANNELS, orders: orders(now) }
}

export function env(now = NOW, role: MaropayActingRole = 'owner', assignedChannelIds: string[] | null = null): AdapterEnv {
  return { now, actor: { role, assignedChannelIds }, failures: defaultFailures() }
}

export function channelFacts(id: string) {
  const c = CHANNELS.find((ch) => ch.id === id)!
  return { name: c.name, type: c.type, provider: c.provider, status: c.status }
}
