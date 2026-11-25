// The Daybloom (demo) store as a blueprint: a supplements store in US dollars on the
// look of the Aurora theme (the classic drawing), with a mega menu, a plan sold by
// delivery options and a purchase options block on the product page. Its data is in
// src/storefront/daybloomDemo.ts, built from the install context, so on its home
// channel it has ids 7001-7010 and installed in another store it has that store's
// ids, channel and domain, and every link follows them.

import {
  DAYBLOOM_ADMIN, DAYBLOOM_BLOG_SEO, DAYBLOOM_CHANNEL, DAYBLOOM_CHATBOT, DAYBLOOM_CHROME, DAYBLOOM_CONVERSATIONS,
  DAYBLOOM_PHOTO_DIR, DAYBLOOM_SEEDED_AT, DAYBLOOM_THEME_STYLES, daybloomCampaigns, daybloomCollections, daybloomContent,
  daybloomMenus, daybloomMerchandising, daybloomPlans, daybloomProducts, daybloomSubscriptions, daybloomThemeTemplates,
} from '../daybloomDemo.ts'
import { checkoutProfile } from '../checkoutProfile.ts'
import type { DemoStoreBlueprint } from './types.ts'

const SLOT = 7

export const DAYBLOOM_BLUEPRINT: DemoStoreBlueprint = {
  id: 'daybloom',
  slot: SLOT,
  seedVersion: 1,
  homeChannel: {
    ...DAYBLOOM_CHANNEL,
    webStore: { ...DAYBLOOM_CHANNEL.webStore!, blueprint: { original: 'daybloom', slot: SLOT } },
  },
  admin: {
    ...DAYBLOOM_ADMIN,
    // DAYBLOOM_CUSTOMERS_LIST_ID (useCdpEntities) and DAYBLOOM_CAMPAIGN_CONTENT_ID (useContent).
    audienceListId: 907,
    announcementContentId: 9006,
    timezone: 'America/Chicago',
  },
  photoDir: DAYBLOOM_PHOTO_DIR,
  capabilities: { subscriptions: true, variantPicker: false, sizeGuide: false, vehicleFitment: false },
  card: {
    name: 'Daybloom',
    version: '1.0',
    kind: 'Health and supplements',
    description: 'The Aurora look for a supplements store in US dollars: a mega menu by goal and format, subscribe-and-save with a delivery every 1, 2 or 3 months, supplement facts on every product, and promises up front.',
    thumbnail: `${DAYBLOOM_PHOTO_DIR}/theme.jpg`,
  },
  build(ctx) {
    const currency = DAYBLOOM_CHANNEL.webStore!.currency!
    return {
      theme: {
        id: `theme-${ctx.prefix}`,
        name: 'Daybloom',
        version: '1.0',
        publishedAt: DAYBLOOM_SEEDED_AT,
        styles: { ...DAYBLOOM_THEME_STYLES },
        templates: daybloomThemeTemplates(ctx),
      },
      // No locale: prices read "$29.00", and receipts keep US dates.
      market: { currency },
      products: daybloomProducts(ctx),
      collections: daybloomCollections(ctx),
      chrome: DAYBLOOM_CHROME,
      menus: daybloomMenus(ctx),
      content: daybloomContent(ctx),
      blogSeo: DAYBLOOM_BLOG_SEO,
      campaigns: daybloomCampaigns(ctx),
      merchandising: daybloomMerchandising(ctx),
      chatbot: { config: DAYBLOOM_CHATBOT, assistantProfile: 'supplements' },
      plans: daybloomPlans(ctx),
      sizeCharts: [],
      // Delivery only: the store has no shop to collect from. The order keeps the address
      // typed at checkout, so the shopper's order page and the admin order show it.
      checkout: { ...checkoutProfile(currency), keepsAddress: true, pickup: false },
    }
  },
  history(ctx) {
    return { subscriptions: daybloomSubscriptions(ctx), conversations: DAYBLOOM_CONVERSATIONS }
  },
}
