// The Vitaheal (demo) store as a blueprint. Its data stays in src/storefront/vitahealDemo.ts
// (every VITAHEAL_* export keeps working); this wraps it. On its home channel the build is
// exactly that seed (tests/storefront/demoStoresVitaheal.test.ts checks it against a copy
// taken before the registry existed). Installed on another store, the same seed is copied
// with that store's ids, channel, domain and string-id prefix, and every product link and
// search pin follows the new product ids.

import {
  VITAHEAL_ADMIN, VITAHEAL_BLOG_SEO, VITAHEAL_CHANNEL, VITAHEAL_CHATBOT, VITAHEAL_CHROME, VITAHEAL_COLLECTIONS,
  VITAHEAL_CONTENT, VITAHEAL_CONVERSATIONS, VITAHEAL_MENUS, VITAHEAL_MERCHANDISING, VITAHEAL_PHOTO_DIR, VITAHEAL_PLANS,
  VITAHEAL_THEME_STYLES, VITAHEAL_THEME_TEMPLATES, vitahealCampaigns, vitahealProducts, vitahealSubscriptions,
} from '../vitahealDemo.ts'
import { checkoutProfile } from '../checkoutProfile.ts'
import type { ThemeSection } from '../themeSections.ts'
import type { DemoStoreBlueprint, InstallContext, StoreSnapshot } from './types.ts'

const SLOT = 2
/**
 * The library version. 2.0 since the second feedback round (2026-11-25): the Lumos look on
 * the sections drawing.
 */
const VERSION = '2.0'
/**
 * 2 since the eight products added after the second review (2026-11-25): a browser that saved
 * the store at seed 1 is seeded again on its next start (useDemoStores reseedStale), so it sells
 * all sixteen. That reseed puts back the products, plans, store campaigns, search rules, chatbot
 * settings and the theme the store started with (a copy of it stays, as a draft); orders,
 * subscribers, chats, announcement emails, the chatbot's on/off, the Merchandise Cloud
 * connection and the cart stay. The store then records seed 2 (tests/storefront/vitahealReseed.test.ts).
 *
 * 3 since the store moved to US dollars (2026-11-25): the same reseed reaches a browser at seed 1
 * or 2. Both held the store in kronor, so that reseed also puts back the store's history as a
 * restore does and empties the cart (MARKET_CHANGED_AT). Orders stay as they were placed.
 */
const SEED_VERSION = 3
/** The seed from which the store sells in US dollars; seeds 1 and 2 sold in kronor. */
const MARKET_CHANGED_AT = 3
const HOME_DOMAIN = VITAHEAL_CHANNEL.webStore!.domain
/** When the seed was written: the theme's publish date and the collections' last update. */
const SEEDED_AT = '2026-11-16T09:00:00Z'

/** The store as seeded on its own channel. */
function homeSnapshot(ctx: InstallContext): StoreSnapshot {
  // No locale: prices read "$39.99", and receipts keep US dates.
  const market = { currency: VITAHEAL_CHANNEL.webStore!.currency! }
  return {
    theme: {
      id: `theme-${ctx.prefix}`,
      name: 'Vitaheal',
      version: VERSION,
      publishedAt: SEEDED_AT,
      styles: { ...VITAHEAL_THEME_STYLES },
      templates: VITAHEAL_THEME_TEMPLATES,
    },
    market,
    products: vitahealProducts(),
    collections: VITAHEAL_COLLECTIONS.map((c, i) => ({ id: ctx.ids.collection(i + 1), title: c.title, productCount: c.productCount, updatedAt: SEEDED_AT, description: c.description })),
    chrome: VITAHEAL_CHROME,
    menus: VITAHEAL_MENUS,
    content: VITAHEAL_CONTENT,
    blogSeo: VITAHEAL_BLOG_SEO,
    campaigns: vitahealCampaigns(ctx.today),
    merchandising: VITAHEAL_MERCHANDISING,
    chatbot: { config: VITAHEAL_CHATBOT, assistantProfile: 'wellness' },
    plans: VITAHEAL_PLANS,
    sizeCharts: [],
    // The order keeps the address typed at checkout, so the shopper's order page and the admin order show it.
    checkout: { ...checkoutProfile(market.currency), keepsAddress: true },
  }
}

/** Every string in a plain value, rewritten by `fix`. */
function mapStrings<T>(value: T, fix: (text: string) => string): T {
  if (typeof value === 'string') return fix(value) as T
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, fix)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapStrings(item, fix)])) as T
  }
  return value
}

/** The home seed, copied into another store. */
function rehome(home: StoreSnapshot, ctx: InstallContext): StoreSnapshot {
  // Product n keeps its place in the id block: 2001 is product 1 wherever it is installed.
  const productIds = new Map(home.products.map((p) => [p.id, ctx.ids.product(p.id - SLOT * 1000)]))
  const productId = (id: number): number => {
    const mapped = productIds.get(id)
    if (mapped === undefined) throw new Error(`Vitaheal blueprint: product ${id} is referenced but not seeded`)
    return mapped
  }
  /** 'vitaheal-home-banner', 'menu-vitaheal-main', 'camp-vitaheal-winter' → the install's prefix. */
  const reprefix = (id: string): string => id.replace(/(^|-)vitaheal(?=-)/, `$1${ctx.prefix}`)
  /** Product links and the home store's address, wherever they appear. */
  const relink = (text: string): string => text
    .replace(/\/products\/([a-z0-9-]+?)-(\d+)\b/g, (_, handle: string, id: string) => `/products/${handle}-${productId(Number(id))}`)
    .split(`https://${HOME_DOMAIN}`).join(`https://${ctx.domain}`)
  const reid = (section: ThemeSection): ThemeSection => ({
    ...section,
    id: reprefix(section.id),
    ...(section.blocks ? { blocks: section.blocks.map((block) => ({ ...block, id: reprefix(block.id) })) } : {}),
  })
  const merch = <T extends { id: string; channelId: string }>(row: T): T => ({ ...row, id: row.id.replace(/^vh-/, `${ctx.prefix}-`), channelId: ctx.channelId })

  const copy: StoreSnapshot = {
    ...home,
    theme: {
      ...home.theme,
      templates: {
        home: home.theme.templates.home.map(reid),
        product: home.theme.templates.product.map(reid),
        collection: home.theme.templates.collection.map(reid),
        cart: home.theme.templates.cart.map(reid),
      },
    },
    products: home.products.map((p) => {
      const id = productId(p.id)
      return {
        ...p,
        id,
        channelIds: [ctx.channelId],
        salesChannelNames: [ctx.channelName],
        detail: p.detail && {
          ...p.detail,
          salesChannels: [ctx.channelName],
          variantsList: p.detail.variantsList.map((v, i) => ({ ...v, id: ctx.ids.variant(id, i + 1) })),
        },
      }
    }),
    menus: home.menus.map((menu) => ({
      ...menu,
      id: reprefix(menu.id),
      channelId: ctx.channelId,
      items: menu.items.map((item) => ({ ...item, id: reprefix(item.id) })),
    })),
    content: home.content.map((entry) => ({ ...entry, id: reprefix(entry.id), channelId: ctx.channelId })),
    campaigns: home.campaigns.map((campaign) => ({ ...campaign, id: reprefix(campaign.id), channelId: ctx.channelId })),
    merchandising: {
      synonyms: home.merchandising.synonyms.map(merch),
      redirects: home.merchandising.redirects.map(merch),
      searchPins: home.merchandising.searchPins.map((pin) => ({ ...merch(pin), pinnedProductIds: pin.pinnedProductIds.map((id) => String(productId(Number(id)))) })),
      engines: home.merchandising.engines.map(merch),
    },
    plans: home.plans.map((plan) => ({
      ...plan,
      id: `plan-${ctx.prefix}-${plan.id.replace(/^plan-/, '')}`,
      channelId: ctx.channelId,
      productIds: plan.productIds.map(productId),
    })),
  }
  return mapStrings(copy, relink)
}

export const VITAHEAL_BLUEPRINT: DemoStoreBlueprint = {
  id: 'vitaheal',
  slot: SLOT,
  seedVersion: SEED_VERSION,
  marketChangedAt: MARKET_CHANGED_AT,
  homeChannel: {
    ...VITAHEAL_CHANNEL,
    webStore: { ...VITAHEAL_CHANNEL.webStore!, blueprint: { original: 'vitaheal', slot: SLOT } },
  },
  legacyHomeIds: { variantFactor: 10, collectionBase: 22 },
  admin: {
    ...VITAHEAL_ADMIN,
    // VITAHEAL_CUSTOMERS_LIST_ID (useCdpEntities) and VITAHEAL_CAMPAIGN_CONTENT_ID (useContent).
    audienceListId: 901,
    announcementContentId: 9001,
    timezone: 'America/New_York',
  },
  photoDir: VITAHEAL_PHOTO_DIR,
  // The sections product page lets the shopper pick a format or flavour (it opens on the cheapest).
  capabilities: { subscriptions: true, variantPicker: true, sizeGuide: false, vehicleFitment: false },
  card: {
    name: 'Vitaheal',
    version: VERSION,
    kind: 'Health and wellness',
    description: 'A supplements store on subscription, in US dollars: Inter, uppercase headings, boxed product cards and a mega menu by goal.',
    thumbnail: `${VITAHEAL_PHOTO_DIR}/theme.jpg`,
  },
  build(ctx) {
    const home = homeSnapshot(ctx)
    return ctx.home ? home : rehome(home, ctx)
  },
  history(ctx) {
    return { subscriptions: vitahealSubscriptions(ctx.today), conversations: VITAHEAL_CONVERSATIONS }
  },
}
