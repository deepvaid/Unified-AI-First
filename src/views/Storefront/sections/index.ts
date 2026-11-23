import type { Component } from 'vue'
import AnnouncementBar from './AnnouncementBar.vue'
import CollectionGrid from './CollectionGrid.vue'
import FeaturedProducts from './FeaturedProducts.vue'
import IconRow from './IconRow.vue'
import ImageBanner from './ImageBanner.vue'
import ImageWithText from './ImageWithText.vue'
import Newsletter from './Newsletter.vue'
import RichText from './RichText.vue'
import VehicleFinder from './VehicleFinder.vue'

// The home page's sections on the sections drawing (Northfold, Torqline): one
// component per section kind, each taking the section as its `section` prop.
// StorefrontHome draws the home template through it; a kind with no component here
// (testimonials, say) draws nothing. The header and footer are StorefrontHeader's
// and StorefrontFooter's. Adding a kind: write its component, list it here, and add
// it to the catalogue in src/storefront/themeSections.ts so the builder offers it.

export const SECTION_COMPONENTS: Readonly<Record<string, Component>> = {
  'announcement-bar': AnnouncementBar,
  // An `image-banner` with button blocks, and the older `hero` with one button: one banner.
  'image-banner': ImageBanner,
  hero: ImageBanner,
  'collection-grid': CollectionGrid,
  'image-with-text': ImageWithText,
  'featured-products': FeaturedProducts,
  'rich-text': RichText,
  'icon-row': IconRow,
  newsletter: Newsletter,
  // An auto-parts store's hero: a photo with the Year → Make → Model selects.
  'vehicle-finder': VehicleFinder,
}

/** Kinds that open a page with a photograph and its headline: the first one names the page (its h1). */
export const BANNER_KINDS: readonly string[] = ['image-banner', 'hero', 'vehicle-finder']

export function sectionComponent(kind: string): Component | undefined {
  return SECTION_COMPONENTS[kind]
}
