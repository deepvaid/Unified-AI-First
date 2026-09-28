import type { ComputedRef, InjectionKey } from 'vue'
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
}

export const STOREFRONT: InjectionKey<StorefrontContext> = Symbol('storefront')

/** A URL with a scheme (https:, mailto:) — it leaves the storefront. */
export function isExternalHref(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href)
}
