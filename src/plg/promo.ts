/**
 * PLG promotions — pure TS so node:test can import it (see tests/plg/).
 *
 * A promotion is two Chargebee coupons, one per billing cycle. Chargebee
 * discounts the price of the cycle the customer is buying, so the annual
 * coupon is the top-up on the standing annual discount, not the headline
 * figure: 20% annual × 12.5% coupon = 30% off the monthly list price.
 */

export type PromoCycle = 'monthly' | 'annual'

export interface PromoCoupon {
  code: string
  cycle: PromoCycle
  /** Fraction off the plan fee, at this cycle's price. */
  percentOff: number
  /** How many invoices the discount covers. */
  invoices: number
  /** The name Chargebee shows at checkout and on the invoice (50-char limit). */
  description: string
}

export interface Promo {
  name: string
  /** The saving against the monthly list price, as the customer hears it. */
  headlinePercent: number
  /** First moment the codes stop working, local time. */
  endsBefore: string
  endsLabel: string
  /** The only clouds the codes are set up for in Chargebee. */
  eligibleClouds: readonly string[]
  /** Tiers the codes never apply to. Add-ons are never discounted either. */
  excludedTiers: readonly string[]
  coupons: Record<PromoCycle, PromoCoupon>
}

/** A plan in the cart, as far as a promotion cares. */
export interface PromoPlan {
  cloud: string
  tier: string
}

export interface PromoLine extends PromoPlan {
  price: number
}

export const BLACK_FRIDAY_PROMO: Promo = {
  name: 'Black Friday offer',
  headlinePercent: 30,
  endsBefore: '2027-01-01T00:00:00',
  endsLabel: '31 Dec 2026',
  eligibleClouds: ['marketing', 'commerce', 'service'],
  excludedTiers: ['build'],
  coupons: {
    monthly: {
      code: 'BF26MONTH3',
      cycle: 'monthly',
      percentOff: 0.3,
      invoices: 3,
      description: 'Black Friday: 30% off first 3 invoices',
    },
    annual: {
      code: 'BF26ANNUAL',
      cycle: 'annual',
      percentOff: 0.125,
      invoices: 1,
      description: 'Black Friday: 30% off first year',
    },
  },
}

export function activePromo(now: Date = new Date()): Promo | null {
  return now < new Date(BLACK_FRIDAY_PROMO.endsBefore) ? BLACK_FRIDAY_PROMO : null
}

/** A plan qualifies when its cloud is one the codes cover and its tier is not excluded. */
export function isEligible(promo: Promo, plan: PromoPlan): boolean {
  return promo.eligibleClouds.includes(plan.cloud) && !promo.excludedTiers.includes(plan.tier)
}

/** What the coupon takes off one invoice: eligible plan lines only, to the cent. */
export function promoSaving(promo: Promo, lines: PromoLine[], cycle: PromoCycle): number {
  const { percentOff } = promo.coupons[cycle]
  const saving = lines
    .filter(line => isEligible(promo, line))
    .reduce((sum, line) => sum + line.price * percentOff, 0)
  return Math.round(saving * 100) / 100
}

/**
 * The coupon a typed code resolves to, or null. A code only works on its own
 * billing cycle and needs at least one eligible plan in the cart.
 */
export function validateCoupon(promo: Promo, code: string, cycle: PromoCycle, plans: PromoPlan[]): PromoCoupon | null {
  const coupon = promo.coupons[cycle]
  if (code.trim().toUpperCase() !== coupon.code) return null
  return plans.some(plan => isEligible(promo, plan)) ? coupon : null
}
