// The Lumos Home (demo) store as a blueprint: a furniture and home store in US
// dollars, with fabric and finish swatches, sizes for rugs, beds and tables, specs and
// a warranty on every piece, and no subscriptions or size charts. Its data is in
// src/storefront/lumosDemo.ts, built from the install context, so on its home channel
// it has ids 5001-5020 and installed in another store it has that store's ids,
// channel and domain, and every link follows them.

import {
  LUMOS_ADMIN, LUMOS_BLOG_SEO, LUMOS_CHANNEL, LUMOS_CHATBOT, LUMOS_CHROME, LUMOS_CONVERSATIONS,
  LUMOS_PHOTO_DIR, LUMOS_SEEDED_AT, LUMOS_THEME_STYLES, lumosCampaigns, lumosCollections, lumosContent,
  lumosMenus, lumosMerchandising, lumosProducts, lumosThemeTemplates,
} from '../lumosDemo.ts'
import { checkoutProfile } from '../checkoutProfile.ts'
import type { DemoStoreBlueprint } from './types.ts'

const SLOT = 5
/** The library version, as UAT numbers the Lumos theme. */
const VERSION = '1.1.9'

export const LUMOS_BLUEPRINT: DemoStoreBlueprint = {
  id: 'lumos',
  slot: SLOT,
  seedVersion: 1,
  homeChannel: {
    ...LUMOS_CHANNEL,
    webStore: { ...LUMOS_CHANNEL.webStore!, blueprint: { original: 'lumos', slot: SLOT } },
  },
  admin: {
    ...LUMOS_ADMIN,
    // LUMOS_CUSTOMERS_LIST_ID (useCdpEntities) and LUMOS_CAMPAIGN_CONTENT_ID (useContent).
    audienceListId: 905,
    announcementContentId: 9004,
    timezone: 'America/Los_Angeles',
  },
  photoDir: LUMOS_PHOTO_DIR,
  capabilities: { subscriptions: false, variantPicker: true, sizeGuide: false, vehicleFitment: false },
  card: {
    name: 'Lumos',
    version: VERSION,
    kind: 'Furniture and home',
    description: 'A bright, modern theme for furniture and home: Inter type, one indigo accent, a hero with stats, a room carousel, a brand strip, boxed product cards with a wishlist heart, and filters for category, color, brand and price.',
    thumbnail: `${LUMOS_PHOTO_DIR}/theme.jpg`,
  },
  packShot: { shape: 'furniture' },
  build(ctx) {
    const currency = LUMOS_CHANNEL.webStore!.currency!
    return {
      theme: {
        id: `theme-${ctx.prefix}`,
        name: 'Lumos',
        version: VERSION,
        publishedAt: LUMOS_SEEDED_AT,
        styles: { ...LUMOS_THEME_STYLES },
        templates: lumosThemeTemplates(ctx),
      },
      // No locale: prices read "$1,299.00", and receipts keep US dates.
      market: { currency },
      products: lumosProducts(ctx),
      collections: lumosCollections(ctx),
      chrome: LUMOS_CHROME,
      menus: lumosMenus(ctx),
      content: lumosContent(ctx),
      blogSeo: LUMOS_BLOG_SEO,
      campaigns: lumosCampaigns(ctx),
      merchandising: lumosMerchandising(ctx),
      chatbot: { config: LUMOS_CHATBOT, assistantProfile: 'home' },
      plans: [],
      sizeCharts: [],
      // Delivery only: the store has no shop to collect from. The order keeps the address
      // typed at checkout, so the shopper's order page and the admin order show it.
      checkout: { ...checkoutProfile(currency), keepsAddress: true, pickup: false },
    }
  },
  history() {
    return { subscriptions: [], conversations: LUMOS_CONVERSATIONS }
  },
}
