import { inject } from 'vue'
import type { ComputedRef, InjectionKey } from 'vue'
import { formatMoney } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import type { CheckoutProfile } from '@/storefront/checkoutProfile'
import type { FitState, FitmentProduct, Vehicle } from '@/storefront/fitment'
import type { SizeChart, SizedProduct } from '@/storefront/sizeCharts'
import type { StorefrontOffer } from '@/maropay/storefront'
import type { StoreTheme } from '@/stores/themeBuilderData'
import type { SalesChannel } from '@/stores/useSalesChannels'
import type { StorefrontChrome } from '@/stores/useStorefront'

/** What StorefrontLayout shares with the storefront pages it frames. */
export interface StorefrontContext {
  channel: ComputedRef<SalesChannel>
  /** The store's current (published) theme. */
  theme: ComputedRef<StoreTheme | undefined>
  chrome: ComputedRef<StorefrontChrome>
  /** A storefront href ("/page/about-us", "example.com/contact_us") → the prototype path that serves it. */
  link: (href: string) => string
  /** The store's own currency when it has one, else the account's Maropay settlement currency. */
  currency: ComputedRef<string>
  /** A price as this store's shoppers read it: "$94.19", or "399 kr" for a store with a locale. */
  formatMoney: (amount: Money) => string
  /** An amount to the last cent, written the store's way: "585,90 kr" where `formatMoney` shows "586 kr". For what is charged. */
  formatExact: (amount: Money) => string
  /** The store writes amounts its own way ("399 kr"), so the currency code beside a total would say it twice. */
  ownMoneyFormat: ComputedRef<boolean>
  /** Where the store delivers and who its checkout is filled in with. */
  checkout: ComputedRef<CheckoutProfile>
  /** A store shown to prospects: its shopper pages say "demo" in plain words where a prototype note would be. */
  demo: ComputedRef<boolean>
  /** The store has a search of its own: it is connected to Merchandise Cloud and sells its own products. */
  searchable: ComputedRef<boolean>
  /** The message of the store's running campaign, for its announcement bar; empty when none runs. */
  campaignMessage: ComputedRef<string>
  /** How the store takes payment for an amount: the merchant's methods, express buttons and instalments. */
  offerFor: (amount: Money) => StorefrontOffer
  /**
   * The theme asks for the richer drawing (`styles.drawing === 'sections'`: Northfold and
   * Torqline): header and footer settings, page templates, filters, quick add, the
   * variant picker. False for every other theme, which keeps the classic drawing.
   */
  sectionsDrawing: ComputedRef<boolean>
  /** The store's size charts (Products › Size charts). */
  sizeCharts: ComputedRef<SizeChart[]>
  /** The chart a product's size guide shows, while it links one that exists. */
  sizeChartFor: (product: SizedProduct) => SizeChart | undefined
  /** Says something to screen readers politely: a result count, "Added to your cart" (./storefrontAnnouncer.ts). */
  announce: (text: string) => void
  /** The store sells parts with vehicle fitment (Torqline): its pages offer the vehicle selector and fit badges. */
  sellsParts: ComputedRef<boolean>
  /** The shopper's vehicle on this store (one, no garage; kept for the browser tab), or null. */
  vehicle: ComputedRef<Vehicle | null>
  /** Chooses the shopper's vehicle; null forgets it. */
  setVehicle: (vehicle: Vehicle | null) => void
  /** How a part stands against the shopper's vehicle (src/storefront/fitment.ts). */
  fitOf: (product: FitmentProduct) => FitState
  /** Opens the vehicle selector (the drawer StorefrontLayout mounts), from the header chip, a list's "Change" or the chat. */
  chooseVehicle: () => void
}

export const STOREFRONT: InjectionKey<StorefrontContext> = Symbol('storefront')

/**
 * An amount as it is charged, for the parts the checkout shares with the admin's
 * "What shoppers see" preview: the store's own writing inside a storefront,
 * Maropay's "$94.19" outside one.
 */
export function useExactMoney(): (amount: Money) => string {
  return inject(STOREFRONT, null)?.formatExact ?? formatMoney
}

/** Whether these parts are drawn inside a store shown to prospects. */
export function useDemoStore(): boolean {
  return inject(STOREFRONT, null)?.demo.value ?? false
}

/** A URL with a scheme (https:, mailto:) — it leaves the storefront. */
export function isExternalHref(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href)
}
