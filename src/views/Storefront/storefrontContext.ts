import type { ComputedRef, InjectionKey } from 'vue'
import type { Money } from '@/maropay/money'
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
  /** How the store takes payment for an amount: the merchant's methods, express buttons and instalments. */
  offerFor: (amount: Money) => StorefrontOffer
}

export const STOREFRONT: InjectionKey<StorefrontContext> = Symbol('storefront')

/** A URL with a scheme (https:, mailto:) — it leaves the storefront. */
export function isExternalHref(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href)
}
