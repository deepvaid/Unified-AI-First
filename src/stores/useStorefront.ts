import { ref } from 'vue'
import { defineStore } from 'pinia'
import { demoSnapshotOf } from './useSalesChannels'
import type { SalesChannel } from './useSalesChannels'
import { browserStorage } from './demoKeep'
import { canApplyTheme } from '@/storefront/demoStores'
import { currentBlueprintId } from '@/storefront/demoStores/install'

// The shopper-facing storefront's chrome — header, menus and footer — as the store
// renders it. Neelam-Store's comes from the UAT crawl (docs/rebuild/neelam-store/
// CRAWL-SUMMARY.md), links and all, including the ones that go nowhere on UAT
// ("example.com/contact_us", "/service"): those land on the storefront's 404 page
// here too. It models what the storefront renders; the admin's Navigation menus
// behind it are still to be crawled. A store that can take a theme (the demo
// stores, src/storefront/demoStores/) renders the chrome of the theme it runs now.

export interface StorefrontLink {
  label: string
  /** Store-relative ("/page/about-us"), relative without a slash (resolved like a browser would), or absolute. */
  href: string
}

/**
 * The panel a header link opens instead of going straight to its page (a mega
 * menu): columns of links under a heading, and a picture tile beside them.
 */
export interface StorefrontMegaMenu {
  columns: { heading: string; links: StorefrontLink[] }[]
  /** `image` is a path under /public; it is decoration, the words beside it carry the meaning. */
  feature?: { image: string; heading: string; text: string; link: StorefrontLink }
}

/** A link of the header's menu. With `menu` it opens that panel, and `href` is the panel's "see everything" link. */
export interface StorefrontNavLink extends StorefrontLink {
  menu?: StorefrontMegaMenu
}

export interface StorefrontFooterColumn {
  heading: StorefrontLink
  items: StorefrontLink[]
}

export interface StorefrontNewsletter {
  heading: string
  placeholder: string
  /** The consent line, with its links. */
  consent: Array<string | StorefrontLink>
  button: string
  busy: string
  /** Shown once the shopper has signed up. Absent: the form just clears. */
  success?: string
}

/** The header's tools beside the cart. */
export type StorefrontHeaderTool = 'search' | 'account' | 'wishlist'

export interface StorefrontChrome {
  /** Stands in for the logo image: its wordmark, with an icon for the artwork. */
  wordmark: string
  wordmarkIcon: string | null
  /** Which tools the header shows. A store leaves out the ones it has no page for, so none leads to a 404. */
  headerTools: StorefrontHeaderTool[]
  /** Where the account tool leads. Absent: the real store's own sign-in path, which this prototype does not serve. */
  accountHref?: string
  social: Array<StorefrontLink & { icon: string }>
  searchPlaceholder: string
  nav: StorefrontNavLink[]
  mobileNav: StorefrontNavLink[]
  footerColumns: StorefrontFooterColumn[]
  newsletter: StorefrontNewsletter | null
  copyright: string
  /** Show the theme's announcement bar above the header on every page, not in the home page's flow. */
  announcementAboveHeader?: boolean
  // Part 5 (Lumos), read by the sections drawing only.
  /** Search in the header as an icon (default), a visible field, or a rounded pill field (Aurora). */
  headerSearch?: 'icon' | 'field' | 'pill'
  /** One line under the wordmark in the footer's first column. */
  tagline?: string
  /** The newsletter as a footer column of its own, not under the wordmark. */
  newsletterColumn?: boolean
  /** Links in the footer's bottom row, beside the copyright (legal pages). */
  bottomLinks?: StorefrontLink[]
}

/** What StorefrontPreview takes of a store's chrome beyond its wordmark and menu (previewChromeFor). */
export interface PreviewChrome {
  headerSearch?: StorefrontChrome['headerSearch']
  headerTools?: StorefrontHeaderTool[]
  searchPlaceholder?: string
  socialIcons?: string[]
  footer?: {
    columns: { heading: string; links: string[] }[]
    newsletter?: { heading: string; button: string; consent?: string }
    copyright?: string
  }
}

/**
 * A store's chrome as StorefrontPreview takes it beyond its wordmark and menu: the header's
 * search and tools (a search field and a wishlist heart, Lumos; a pill search and social icons,
 * Aurora), and the footer's columns, newsletter and copyright.
 */
export function previewChrome(chrome: StorefrontChrome): PreviewChrome {
  const label = (part: string | { label: string }) => (typeof part === 'string' ? part : part.label)
  return {
    headerSearch: chrome.headerSearch,
    headerTools: chrome.headerTools,
    searchPlaceholder: chrome.searchPlaceholder,
    // A link named "X" gets X's mark, as the storefront's header draws it.
    socialIcons: chrome.social.map((link) => (link.label.trim().toLowerCase() === 'x' ? 'x' : link.icon)),
    footer: {
      columns: chrome.footerColumns.map((column) => ({ heading: column.heading.label, links: column.items.map((item) => item.label) })),
      newsletter: chrome.newsletter
        ? { heading: chrome.newsletter.heading, button: chrome.newsletter.button, consent: chrome.newsletter.consent.map(label).join('') }
        : undefined,
      copyright: chrome.copyright,
    },
  }
}

const NEELAM_STORE: StorefrontChrome = {
  wordmark: 'AUTO CAR',
  wordmarkIcon: 'car',
  headerTools: ['search', 'account', 'wishlist'],
  social: [
    { label: 'Facebook', href: '/facebookUrl', icon: 'facebook' },
    { label: 'Instagram', href: '/instaUrl', icon: 'instagram' },
    { label: 'Twitter', href: '/twitterUrl', icon: 'twitter' },
  ],
  searchPlaceholder: 'Search...',
  nav: [{ label: 'Contact Us', href: 'example.com/contact_us' }],
  mobileNav: [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/' },
    { label: 'About', href: '/' },
    { label: 'Contact', href: '/' },
    { label: 'Cart', href: '/cart' },
  ],
  footerColumns: [
    {
      heading: { label: 'Legal', href: '/service' },
      items: [
        { label: 'Privacy Policy', href: '/policies/privacy-policy' },
        { label: 'Refund Policy', href: '/policies/refund-policy' },
      ],
    },
    {
      heading: { label: 'About Us', href: '/page/about-us' },
      items: [
        { label: 'Products', href: '/products' },
        { label: 'Brands', href: '/brands' },
        { label: 'Blog', href: '/blogs' },
      ],
    },
    {
      heading: { label: 'Information', href: '/info' },
      items: [
        { label: 'About', href: '/page/about-us' },
        { label: 'FAQs', href: '/page/faqs' },
      ],
    },
  ],
  newsletter: {
    heading: 'Stay in touch',
    placeholder: 'Email Address',
    consent: [
      'I have read & agree to ',
      { label: 'Terms & Conditions', href: '/policies/terms-of-service' },
      ' & ',
      { label: 'Privacy Policy', href: '/policies/privacy-policy' },
      '.',
    ],
    button: 'Subscribe',
    busy: 'Subscribing...',
  },
  copyright: 'Copyright © 2026 Maropost',
}

const CHROME_BY_CHANNEL: Record<string, StorefrontChrome> = {
  'neelam-store': NEELAM_STORE,
}

export const useStorefrontStore = defineStore('storefront', () => {
  // A demo store's chrome comes from the snapshot of the theme it runs now, built
  // once per store and theme. reseedDemo drops it and bumps `reseeds`, so the
  // screens showing it read it again.
  const demoChrome = new Map<string, StorefrontChrome | null>()
  const reseeds = ref(0)

  /** The chrome of the theme a store runs now; null for a store that cannot take one, or started blank. */
  function demoChromeFor(channel: SalesChannel | undefined): StorefrontChrome | null {
    void reseeds.value // read, so a reseed renders the screens showing the chrome again
    if (!channel || !canApplyTheme(channel)) return null
    const key = `${channel.id} ${currentBlueprintId(channel, browserStorage())}`
    if (!demoChrome.has(key)) demoChrome.set(key, demoSnapshotOf(channel)?.chrome ?? null)
    return demoChrome.get(key)!
  }

  /** Nothing to bring in for a store as the app starts (contract: attachDemo): its chrome is read from the theme it runs when first shown. */
  function attachDemo(_channelId: string): void {}

  /** The store's chrome follows the theme it runs now (contract: reseedDemo). Nothing is kept in the browser. */
  function reseedDemo(channelId: string): void {
    for (const key of [...demoChrome.keys()]) if (key.startsWith(`${channelId} `)) demoChrome.delete(key)
    reseeds.value += 1
  }

  /** The storefront chrome for a web store; stores whose storefront hasn't been crawled get a bare one. */
  function chromeFor(channel: SalesChannel): StorefrontChrome {
    return demoChromeFor(channel) ?? CHROME_BY_CHANNEL[channel.id] ?? {
      wordmark: channel.name,
      wordmarkIcon: null,
      headerTools: ['search', 'account', 'wishlist'],
      social: [],
      searchPlaceholder: 'Search...',
      nav: [],
      mobileNav: [],
      footerColumns: [],
      newsletter: null,
      copyright: '',
    }
  }

  /** Header props for the builder's preview — only for demo stores and stores whose storefront was crawled; others keep its sample header. */
  function previewHeaderFor(channel: SalesChannel | undefined): { brand?: string; menu?: string[] } {
    const crawled = demoChromeFor(channel) ?? (channel ? CHROME_BY_CHANNEL[channel.id] : undefined)
    return crawled ? { brand: crawled.wordmark, menu: crawled.nav.map((item) => item.label) } : {}
  }

  /**
   * The rest of the store's chrome for the admin's drawing of it (previewChrome), as the builder,
   * the theme library and the store page all pass it. Empty where previewHeaderFor is: those
   * stores keep the sample chrome.
   */
  function previewChromeFor(channel: SalesChannel | undefined): PreviewChrome {
    if (!channel || !previewHeaderFor(channel).brand) return {}
    return previewChrome(chromeFor(channel))
  }

  return { chromeFor, previewHeaderFor, previewChromeFor, attachDemo, reseedDemo }
})
