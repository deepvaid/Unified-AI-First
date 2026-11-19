import { inject } from 'vue'
import type { ComputedRef, InjectionKey } from 'vue'
import { formatMoney } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import type { CheckoutProfile } from '@/storefront/checkoutProfile'
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
