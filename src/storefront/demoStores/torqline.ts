// The Torqline Auto Parts (demo) store as a blueprint: an auto parts store in US
// dollars, with vehicle fitment, part numbers, specifications and no subscriptions.
// Its data is in src/storefront/torqlineDemo.ts, built from the install context, so on
// its home channel it has ids 4001-4021 and installed in another store it has that
// store's ids, channel and domain, and every link follows them.

import {
  TORQLINE_ADMIN, TORQLINE_BLOG_SEO, TORQLINE_CHANNEL, TORQLINE_CHATBOT, TORQLINE_CHROME, TORQLINE_CONVERSATIONS,
  TORQLINE_PHOTO_DIR, TORQLINE_SEEDED_AT, TORQLINE_THEME_STYLES, torqlineCampaigns, torqlineCollections, torqlineContent,
  torqlineMenus, torqlineMerchandising, torqlineProducts, torqlineThemeTemplates,
} from '../torqlineDemo.ts'
import { checkoutProfile } from '../checkoutProfile.ts'
import type { DemoStoreBlueprint } from './types.ts'

const SLOT = 4

export const TORQLINE_BLUEPRINT: DemoStoreBlueprint = {
  id: 'torqline',
  slot: SLOT,
  seedVersion: 1,
  homeChannel: {
    ...TORQLINE_CHANNEL,
    webStore: { ...TORQLINE_CHANNEL.webStore!, blueprint: { original: 'torqline', slot: SLOT } },
  },
  admin: {
    ...TORQLINE_ADMIN,
    // TORQLINE_CUSTOMERS_LIST_ID (useCdpEntities) and TORQLINE_CAMPAIGN_CONTENT_ID (useContent).
    audienceListId: 904,
    announcementContentId: 9003,
    timezone: 'America/New_York',
  },
  photoDir: TORQLINE_PHOTO_DIR,
  capabilities: { subscriptions: false, variantPicker: true, sizeGuide: false, vehicleFitment: true },
  card: {
    name: 'Torqline',
    version: '1.0',
    kind: 'Auto parts',
    description: 'A bold, practical theme for auto parts: charcoal and safety yellow, condensed uppercase headings, a vehicle finder, fit badges on every part, part-number search, and filters for category, brand and price.',
    thumbnail: `${TORQLINE_PHOTO_DIR}/theme.jpg`,
  },
  packShot: { shape: 'box' },
  build(ctx) {
    const currency = TORQLINE_CHANNEL.webStore!.currency!
    return {
      theme: {
        id: `theme-${ctx.prefix}`,
        name: 'Torqline',
        version: '1.0',
        publishedAt: TORQLINE_SEEDED_AT,
        styles: { ...TORQLINE_THEME_STYLES },
        templates: torqlineThemeTemplates(ctx),
      },
      // No locale: prices read "$54.99", and receipts keep US dates.
      market: { currency },
      products: torqlineProducts(ctx),
      collections: torqlineCollections(ctx),
      chrome: TORQLINE_CHROME,
      menus: torqlineMenus(ctx),
      content: torqlineContent(ctx),
      blogSeo: TORQLINE_BLOG_SEO,
      campaigns: torqlineCampaigns(ctx),
      merchandising: torqlineMerchandising(ctx),
      chatbot: { config: TORQLINE_CHATBOT, assistantProfile: 'auto-parts' },
      plans: [],
      sizeCharts: [],
      // Delivery only: the store has no shop to collect from. The order keeps the address
      // typed at checkout, so the shopper's order page and the admin order show it.
      checkout: { ...checkoutProfile(currency), keepsAddress: true, pickup: false },
    }
  },
  history() {
    return { subscriptions: [], conversations: TORQLINE_CONVERSATIONS }
  },
}
