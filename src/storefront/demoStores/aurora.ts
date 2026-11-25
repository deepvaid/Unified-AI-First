// The Aurora Outdoor (demo) store as a blueprint: an outdoor clothing and footwear
// store for women and men in US dollars, with sizes and colours, size charts for
// clothes, boots, socks and hats, and no subscriptions. Its data is in
// src/storefront/auroraDemo.ts, built from the install context, so on its home channel
// it has ids 6001-6020 and installed in another store it has that store's ids,
// channel and domain, and every link follows them.

import {
  AURORA_ADMIN, AURORA_BLOG_SEO, AURORA_CHANNEL, AURORA_CHATBOT, AURORA_CHROME, AURORA_CONVERSATIONS,
  AURORA_PHOTO_DIR, AURORA_SEEDED_AT, AURORA_THEME_STYLES, auroraCampaigns, auroraCollections, auroraContent,
  auroraMenus, auroraMerchandising, auroraProducts, auroraSizeCharts, auroraThemeTemplates,
} from '../auroraDemo.ts'
import { checkoutProfile } from '../checkoutProfile.ts'
import type { DemoStoreBlueprint } from './types.ts'

const SLOT = 6
/** The library version, as UAT numbers the Aurora theme. */
const VERSION = '1.8.9'

export const AURORA_BLUEPRINT: DemoStoreBlueprint = {
  id: 'aurora',
  slot: SLOT,
  seedVersion: 1,
  homeChannel: {
    ...AURORA_CHANNEL,
    webStore: { ...AURORA_CHANNEL.webStore!, blueprint: { original: 'aurora', slot: SLOT } },
  },
  admin: {
    ...AURORA_ADMIN,
    // AURORA_CUSTOMERS_LIST_ID (useCdpEntities) and AURORA_CAMPAIGN_CONTENT_ID (useContent).
    audienceListId: 906,
    announcementContentId: 9005,
    timezone: 'America/Denver',
  },
  photoDir: AURORA_PHOTO_DIR,
  capabilities: { subscriptions: false, variantPicker: true, sizeGuide: true, vehicleFitment: false },
  card: {
    name: 'Aurora',
    version: VERSION,
    kind: 'Outdoor clothing and gear',
    description: 'A calm, monochrome theme for outdoor clothing and gear: serif headings, charcoal buttons, a full-width hero, a collection slider, framed product cards, color swatches, size buttons, a size guide, and filters for size, color, category and price.',
    thumbnail: `${AURORA_PHOTO_DIR}/theme.jpg`,
  },
  packShot: { shape: 'garment' },
  build(ctx) {
    const currency = AURORA_CHANNEL.webStore!.currency!
    return {
      theme: {
        id: `theme-${ctx.prefix}`,
        name: 'Aurora',
        version: VERSION,
        publishedAt: AURORA_SEEDED_AT,
        styles: { ...AURORA_THEME_STYLES },
        templates: auroraThemeTemplates(ctx),
      },
      // No locale: prices read "$249.00", and receipts keep US dates.
      market: { currency },
      products: auroraProducts(ctx),
      collections: auroraCollections(ctx),
      chrome: AURORA_CHROME,
      menus: auroraMenus(ctx),
      content: auroraContent(ctx),
      blogSeo: AURORA_BLOG_SEO,
      campaigns: auroraCampaigns(ctx),
      merchandising: auroraMerchandising(ctx),
      chatbot: { config: AURORA_CHATBOT, assistantProfile: 'apparel' },
      plans: [],
      sizeCharts: auroraSizeCharts(ctx),
      // Delivery only: the store has no shop to collect from. The order keeps the address
      // typed at checkout, so the shopper's order page and the admin order show it.
      checkout: { ...checkoutProfile(currency), keepsAddress: true, pickup: false },
    }
  },
  history() {
    return { subscriptions: [], conversations: AURORA_CONVERSATIONS }
  },
}
