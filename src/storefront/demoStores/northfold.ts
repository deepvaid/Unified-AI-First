// The Northfold (demo) store as a blueprint: a women's and men's clothing store in US
// dollars, with sizes and colours, size charts and no subscriptions. Its data is in
// src/storefront/northfoldDemo.ts, built from the install context, so on its home
// channel it has ids 3001-3020 and installed in another store it has that store's
// ids, channel and domain, and every link follows them.

import {
  NORTHFOLD_ADMIN, NORTHFOLD_BLOG_SEO, NORTHFOLD_CHANNEL, NORTHFOLD_CHATBOT, NORTHFOLD_CHROME, NORTHFOLD_CONVERSATIONS,
  NORTHFOLD_PHOTO_DIR, NORTHFOLD_SEEDED_AT, NORTHFOLD_THEME_STYLES, northfoldCampaigns, northfoldCollections, northfoldContent,
  northfoldMenus, northfoldMerchandising, northfoldProducts, northfoldSizeCharts, northfoldThemeTemplates,
} from '../northfoldDemo.ts'
import { checkoutProfile } from '../checkoutProfile.ts'
import type { DemoStoreBlueprint } from './types.ts'

const SLOT = 3

export const NORTHFOLD_BLUEPRINT: DemoStoreBlueprint = {
  id: 'northfold',
  slot: SLOT,
  seedVersion: 1,
  homeChannel: {
    ...NORTHFOLD_CHANNEL,
    webStore: { ...NORTHFOLD_CHANNEL.webStore!, blueprint: { original: 'northfold', slot: SLOT } },
  },
  admin: {
    ...NORTHFOLD_ADMIN,
    // NORTHFOLD_CUSTOMERS_LIST_ID (useCdpEntities) and NORTHFOLD_CAMPAIGN_CONTENT_ID (useContent).
    audienceListId: 903,
    announcementContentId: 9002,
    timezone: 'America/New_York',
  },
  photoDir: NORTHFOLD_PHOTO_DIR,
  capabilities: { subscriptions: false, variantPicker: true, sizeGuide: true, vehicleFitment: false },
  card: {
    name: 'Northfold',
    version: '1.0',
    kind: 'Clothing',
    description: 'A calm, editorial theme for clothing: serif headings, square corners and black buttons, with color swatches, size buttons, a size guide and filters for size, color and price.',
    thumbnail: `${NORTHFOLD_PHOTO_DIR}/theme.jpg`,
  },
  packShot: { shape: 'garment' },
  build(ctx) {
    const currency = NORTHFOLD_CHANNEL.webStore!.currency!
    return {
      theme: {
        id: `theme-${ctx.prefix}`,
        name: 'Northfold',
        version: '1.0',
        publishedAt: NORTHFOLD_SEEDED_AT,
        styles: { ...NORTHFOLD_THEME_STYLES },
        templates: northfoldThemeTemplates(ctx),
      },
      // No locale: prices read "$98.00", and receipts keep US dates.
      market: { currency },
      products: northfoldProducts(ctx),
      collections: northfoldCollections(ctx),
      chrome: NORTHFOLD_CHROME,
      menus: northfoldMenus(ctx),
      content: northfoldContent(ctx),
      blogSeo: NORTHFOLD_BLOG_SEO,
      campaigns: northfoldCampaigns(ctx),
      merchandising: northfoldMerchandising(ctx),
      chatbot: { config: NORTHFOLD_CHATBOT, assistantProfile: 'apparel' },
      plans: [],
      sizeCharts: northfoldSizeCharts(ctx),
      // Delivery only: the store has no shop to collect from. The order keeps the address
      // typed at checkout, so the shopper's order page and the admin order show it.
      checkout: { ...checkoutProfile(currency), keepsAddress: true, pickup: false },
    }
  },
  history() {
    return { subscriptions: [], conversations: NORTHFOLD_CONVERSATIONS }
  },
}
