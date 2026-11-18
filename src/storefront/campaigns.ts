// A store's campaigns: what one is, when it runs, and what its offer does to a cart.
//
// A campaign is a name and a date window for one store (store editor › Campaigns).
// It may carry an offer: a message the storefront shows while it runs, and a code
// that takes a percentage off. With no targets the code covers the whole order;
// with collections, only the products in them. Pure, so Node can test it.

import { money, parseDecimal } from '../maropay/money.ts'
import type { Money } from '../maropay/money.ts'

export interface CampaignOffer {
  /** Shown in the store's announcement bar while the campaign runs. Empty: no message. */
  message: string
  /** What the shopper types. Empty: the campaign has no discount. */
  code: string
  /** Percent off, 1 to 90. */
  discountPct: number
}

export interface StoreCampaign {
  id: string
  channelId: string
  name: string
  /**
   * The collections it covers; empty means the whole store. A store with products of
   * its own names its collections ("Sleep"); the others use the shared link catalogue's ids.
   */
  targets: string[]
  /** ISO date (yyyy-mm-dd). */
  startDate: string
  /** 24h time (HH:mm). */
  startTime: string
  endDate: string
  endTime: string
  updatedAt: string
  offer?: CampaignOffer
  /** Orders placed with the code, and what they came to in the currency's smallest unit. */
  orders?: number
  revenue?: number
  /** The Marketing email campaign that announced it, once one was started. */
  emailCampaignId?: number
}

export type CampaignScheduleStatus = 'Scheduled' | 'Active' | 'Ended'

export function campaignStatus(campaign: Pick<StoreCampaign, 'startDate' | 'startTime' | 'endDate' | 'endTime'>, now = new Date()): CampaignScheduleStatus {
  const start = new Date(`${campaign.startDate}T${campaign.startTime || '00:00'}`)
  const end = new Date(`${campaign.endDate}T${campaign.endTime || '23:59'}`)
  if (now < start) return 'Scheduled'
  if (now > end) return 'Ended'
  return 'Active'
}

const normalise = (code: string): string => code.trim().toUpperCase()

/** The running campaign whose message the store shows: the one that started last. */
export function activeCampaign(campaigns: StoreCampaign[], channelId: string, now = new Date()): StoreCampaign | undefined {
  return campaigns
    .filter((c) => c.channelId === channelId && c.offer?.message.trim() && campaignStatus(c, now) === 'Active')
    .sort((a, b) => `${b.startDate}T${b.startTime}`.localeCompare(`${a.startDate}T${a.startTime}`))[0]
}

/** Whether the store has a code a shopper could use now: the cart and checkout only ask for one then. */
export function takesCodes(campaigns: StoreCampaign[], channelId: string, now = new Date()): boolean {
  return campaigns.some((c) => c.channelId === channelId && !!c.offer?.code.trim() && campaignStatus(c, now) === 'Active')
}

/** The store's campaign with this code, whatever its dates. Codes are not case sensitive. */
export function findByCode(campaigns: StoreCampaign[], channelId: string, code: string): StoreCampaign | undefined {
  const wanted = normalise(code)
  if (!wanted) return undefined
  return campaigns.find((c) => c.channelId === channelId && normalise(c.offer?.code ?? '') === wanted)
}

/** Why a code can't be used, in the shopper's words, or null when it can. */
export function codeProblem(campaigns: StoreCampaign[], channelId: string, code: string, now = new Date()): string | null {
  if (!code.trim()) return 'Enter a discount code.'
  const campaign = findByCode(campaigns, channelId, code)
  if (!campaign) return 'That code is not valid for this store.'
  const status = campaignStatus(campaign, now)
  if (status === 'Scheduled') return 'That code is not active yet.'
  if (status === 'Ended') return 'That code has ended.'
  return null
}

/** A cart or order line, as far as a discount needs to know it. */
export interface DiscountableLine {
  /** One unit, or one delivery of a plan, as a decimal string. */
  price: string
  qty: number
  /** The collections its product is in. */
  collections: string[]
}

export interface Discount {
  code: string
  discountPct: number
  /** What comes off the order. */
  amount: Money
  /** Which lines the code covers, in the order they were given. */
  covers: boolean[]
}

/**
 * What a campaign's code takes off a set of lines. Each covered line loses the
 * percentage of its own total, rounded to the smallest unit, so the lines add up
 * to the discount. A campaign with no code, or that covers none of the lines,
 * takes nothing off.
 */
export function discountFor(lines: DiscountableLine[], campaign: StoreCampaign | undefined, currency: string): Discount | null {
  const offer = campaign?.offer
  if (!campaign || !offer?.code.trim() || !(offer.discountPct > 0)) return null
  const covers = lines.map((line) => !campaign.targets.length || line.collections.some((name) => campaign.targets.includes(name)))
  const off = lines.reduce((total, line, index) => {
    if (!covers[index]) return total
    const lineTotal = (parseDecimal(line.price, currency)?.amount ?? 0) * line.qty
    return total + Math.round((lineTotal * offer.discountPct) / 100)
  }, 0)
  if (!off) return null
  return { code: normalise(offer.code), discountPct: offer.discountPct, amount: money(off, currency), covers }
}

export type OfferField = 'code' | 'discountPct'

/** What is wrong with an offer as the merchant typed it. An offer with neither a message nor a code is no offer, and fine. */
export function offerErrors(offer: CampaignOffer, others: Pick<StoreCampaign, 'offer'>[]): Partial<Record<OfferField, string>> {
  const errors: Partial<Record<OfferField, string>> = {}
  const code = offer.code.trim()
  if (code && !/^[A-Za-z0-9]{3,20}$/.test(code)) errors.code = 'Use 3 to 20 letters and numbers, with no spaces.'
  else if (code && others.some((c) => normalise(c.offer?.code ?? '') === normalise(code))) errors.code = 'Another campaign of this store already uses that code.'
  if (code && !(Number.isInteger(offer.discountPct) && offer.discountPct >= 1 && offer.discountPct <= 90)) errors.discountPct = 'Enter a whole number from 1 to 90.'
  return errors
}
