import { defineStore } from 'pinia'
import type { SalesChannel } from './useSalesChannels'

// The shopper-facing storefront's chrome — header, menus and footer — as the store
// renders it. Neelam-Store's comes from the UAT crawl (docs/rebuild/neelam-store/
// CRAWL-SUMMARY.md), links and all, including the ones that go nowhere on UAT
// ("example.com/contact_us", "/service"): those land on the storefront's 404 page
// here too. It models what the storefront renders; the admin's Navigation menus
// behind it are still to be crawled.

export interface StorefrontLink {
  label: string
  /** Store-relative ("/page/about-us"), relative without a slash (resolved like a browser would), or absolute. */
  href: string
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
}

export interface StorefrontChrome {
  /** Stands in for the logo image: its wordmark, with an icon for the artwork. */
  wordmark: string
  wordmarkIcon: string | null
  social: Array<StorefrontLink & { icon: string }>
  searchPlaceholder: string
  nav: StorefrontLink[]
  mobileNav: StorefrontLink[]
  footerColumns: StorefrontFooterColumn[]
  newsletter: StorefrontNewsletter | null
  copyright: string
}

const NEELAM_STORE: StorefrontChrome = {
  wordmark: 'AUTO CAR',
  wordmarkIcon: 'car',
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
  /** The storefront chrome for a web store; stores whose storefront hasn't been crawled get a bare one. */
  function chromeFor(channel: SalesChannel): StorefrontChrome {
    return CHROME_BY_CHANNEL[channel.id] ?? {
      wordmark: channel.name,
      wordmarkIcon: null,
      social: [],
      searchPlaceholder: 'Search...',
      nav: [],
      mobileNav: [],
      footerColumns: [],
      newsletter: null,
      copyright: '',
    }
  }

  /** Header props for the builder's preview — only for stores whose storefront was crawled; others keep its sample header. */
  function previewHeaderFor(channel: SalesChannel | undefined): { brand?: string; menu?: string[] } {
    const crawled = channel ? CHROME_BY_CHANNEL[channel.id] : undefined
    return crawled ? { brand: crawled.wordmark, menu: crawled.nav.map((item) => item.label) } : {}
  }

  return { chromeFor, previewHeaderFor }
})
