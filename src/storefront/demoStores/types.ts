// The shape of a demo store: what a blueprint is, what it builds, and what an
// install of it needs to know. Types only, so every pure module and every Pinia
// store can import it. index.ts lists the blueprints; install.ts holds the id
// blocks and what a store runs now.

import type { Product } from '../../stores/useCommerce.ts'
import type { SalesChannel } from '../../stores/useSalesChannels.ts'
import type { StorefrontChrome } from '../../stores/useStorefront.ts'
import type { StoreMenu } from '../../stores/useStoreNavigation.ts'
import type { BlogSeoSettings, ContentEntry } from '../../stores/useStoreContent.ts'
import type { ChatbotConfig, ChatbotConversation } from '../../stores/useChatbot.ts'
import type { PageRedirect, RecommendationEngine, SearchPin, Synonym } from '../../stores/useMerchandising.ts'
import type { SubscriptionPlan } from '../../subscriptions/plans.ts'
import type { SubscriptionContract } from '../../subscriptions/contracts.ts'
import type { StoreCampaign } from '../campaigns.ts'
import type { CheckoutProfile } from '../checkoutProfile.ts'
import type { PackShape } from '../packShot.ts'
import type { TemplateType, ThemeSection, ThemeStyles } from '../themeSections.ts'

/** The demo stores, each also a theme in the library. A new one is added here and to DEMO_STORES. */
export type DemoStoreId = 'vitaheal' | 'northfold' | 'torqline'

/**
 * Set on a web store that can take a theme from the library: the three demo
 * stores and every Store Builder store made through Create sales channel. A store
 * without it (Neelam, Atlas, Fashion Boutique, Beta, Max Test, POS) never can.
 */
export interface StoreBlueprintRef {
  /** The blueprint the store started from; null for a store that started blank. */
  original: DemoStoreId | null
  /** The store's own number in the id blocks (src/storefront/demoStores/install.ts). Unique per store: 2-9 a demo store's own channel, 10-99 a store made with Create sales channel. */
  slot: number
}

/** The chatbot knowledge a store's assistant answers with (src/chatbot/assistantProfiles.ts). */
export type AssistantProfileId = 'wellness' | 'apparel' | 'auto-parts'

/** What a store sells and shows, for docs, tests and the theme card. Features switch on from the data itself. */
export interface StoreCapabilities {
  /** Sells on subscription plans, and its account page lists subscriptions. */
  subscriptions: boolean
  /** Products have options a shopper picks (size and colour) on the product page. */
  variantPicker: boolean
  /** Products link a size chart. */
  sizeGuide: boolean
  /** Products carry vehicle fitment, and the store has a vehicle selector. */
  vehicleFitment: boolean
}

/**
 * Everything an install of a blueprint into one store needs to know. Ids and
 * string ids come from here, so two installs never share one.
 */
export interface InstallContext {
  channelId: string
  channelName: string
  /** The store's domain, without a scheme: "2000290-12.uat.maropost.store". */
  domain: string
  /** "YYYY-MM-DD": the day dated seeds (campaigns, subscribers) count from. */
  today: string
  /** True when the blueprint is installed on its own home channel (its ids are the seeded ones). */
  home: boolean
  /** Prefix for string ids (sections, menus, pages, campaigns, rules, plans): the blueprint id at home, `<channelId>--<blueprintId>` elsewhere. */
  prefix: string
  ids: {
    /** The nth product (1-based, n <= 899). */
    product(n: number): number
    /** The nth variant (1-based, n <= 99) of a product made by `product()`. */
    variant(productId: number, n: number): number
    /** The nth collection (1-based, n <= 99). */
    collection(n: number): number
  }
}

/** A collection as the admin lists it. On the storefront a collection is its name on the products. */
export interface SnapshotCollection {
  id: number
  title: string
  productCount: number
  /** ISO date-time the seed was written. */
  updatedAt: string
  /** What the collection page says under its title (Products › Collections › Description). Absent: nothing. */
  description?: string
}

/** A size chart (Products › Size charts). A product links one by `detail.sizeChartId`. */
export interface SizeChart {
  id: string
  channelId: string
  /** "Tops", "Bottoms". */
  name: string
  /** The unit the values are written in; the storefront converts. */
  unit: 'in' | 'cm'
  /** Measurement names, in column order: "Chest", "Waist". */
  columns: string[]
  /** One row per size, a value per column ("34-36"). */
  rows: { size: string; values: string[] }[]
  fitNote: string
  howToMeasure: string
}

/** How a store's checkout works: where it delivers and who it is filled in with, and what it offers. */
export interface SnapshotCheckout extends CheckoutProfile {
  /** Whether the checkout offers Click & collect. Absent: it does (every store has until now). */
  pickup?: boolean
}

/** Everything Apply clones into a store. Plain data: snapshotFor() hands each caller its own copy. */
export interface StoreSnapshot {
  theme: {
    /** The theme record's id: `theme-<prefix>`. */
    id: string
    name: string
    /** The library version ("1.0"). */
    version: string
    /** The seed's publish date; the record's updatedAt is the same. */
    publishedAt: string
    styles: ThemeStyles
    templates: Record<TemplateType, ThemeSection[]>
  }
  /** The store's prices are written in this currency, so Apply sets the store's market to it. */
  market: { currency: string; locale?: string }
  /** `status` is left to useCommerce, which derives it from the stock. */
  products: Omit<Product, 'status'>[]
  collections: SnapshotCollection[]
  chrome: StorefrontChrome
  menus: StoreMenu[]
  content: ContentEntry[]
  blogSeo: BlogSeoSettings
  campaigns: StoreCampaign[]
  merchandising: {
    synonyms: Synonym[]
    redirects: PageRedirect[]
    searchPins: SearchPin[]
    engines: RecommendationEngine[]
  }
  chatbot: {
    /** What differs from a new chatbot's settings. */
    config: Partial<ChatbotConfig>
    assistantProfile: AssistantProfileId
  }
  /** Empty for a store without subscriptions. */
  plans: SubscriptionPlan[]
  sizeCharts: SizeChart[]
  checkout: SnapshotCheckout
}

/** What happened in a store before the demo: seeded on its home channel only, never cloned. */
export interface StoreHistory {
  subscriptions: SubscriptionContract[]
  conversations: Omit<ChatbotConversation, 'id' | 'chatbotId'>[]
}

/** What the store's own admin page says about it. Stays with the home channel; never cloned. */
export interface AdminFacts {
  /** Revenue of the last 30 days, in the store's currency: "1.9M kr". */
  revenue: string
  /** The theme name the admin shows while the store runs its own theme: "Vitaheal 1.0". */
  themeName: string
  business: readonly { readonly label: string; readonly value: string }[]
  /** The CDP list a store campaign is announced to (Marketing), when the store has one. */
  audienceListId?: number
  /** The email content a store campaign is announced with. */
  announcementContentId?: number
  /** IANA time zone the store's emails are scheduled in. */
  timezone: string
}

/** How the theme shows in the library. */
export interface ThemeCard {
  name: string
  version: string
  /** What kind of store it is: "Health and wellness". */
  kind: string
  description: string
  /** A picture of the storefront, served from public/. */
  thumbnail: string
}

export interface DemoStoreBlueprint {
  id: DemoStoreId
  /** Its home channel's slot (the home channel carries it in webStore.blueprint), and its digit in installed ids. 2-9. */
  slot: number
  /** Bumped when the seed changes, so a browser that saved data from the old one starts again. */
  seedVersion: number
  /** The seeded sales channel, with `webStore.blueprint` set. */
  homeChannel: SalesChannel
  admin: AdminFacts
  /** Where its photos are, as the browser asks for them: "/storefront/vitaheal". */
  photoDir: string
  capabilities: StoreCapabilities
  card: ThemeCard
  /** The drawing a product saved without photos gets in this store. Absent: a can (Vitaheal's supplements). */
  packShot?: { shape: PackShape }
  /** Vitaheal only: the ids it was seeded with before the id blocks existed, kept on its home channel. */
  legacyHomeIds?: { variantFactor: number; collectionBase: number }
  build(ctx: InstallContext): StoreSnapshot
  history?(ctx: InstallContext): StoreHistory
}
