import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Mock-persistent store for the secondary Marketing "Content" surfaces:
 * campaign tags, dynamic content, content feeds, footers, coupon banks,
 * preference pages, and Optimise-on-Open image groups. Each slice is a
 * small, independent CRUD set — kept together because these pages share
 * one design-system treatment and, in a few cases, reference each other
 * (footers reference preference pages).
 */

// ── Campaign Tags ──────────────────────────────────────────────────────────
export interface CampaignTag {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

// ── Dynamic Content ─────────────────────────────────────────────────────────
export interface DynamicContentRule {
  id: number
  segmentId: number | null
  segmentName: string
  /** Optional content feed merged into this rule's body. */
  contentFeedId: number | null
  content: string
}

export interface DynamicContentItem {
  id: number
  name: string
  /** Optional content feed merged into the original body. */
  contentFeedId: number | null
  originalContent: string
  rules: DynamicContentRule[]
  archived: boolean
  createdAt: string
  updatedAt: string
}

// ── Content Feeds ────────────────────────────────────────────────────────────
export type FeedType = 'Single' | 'Merge'

/** One key → URL pair of a merge feed. */
export interface ContentFeedSource {
  key: string
  url: string
}

export interface ContentFeed {
  id: number
  name: string
  feedType: FeedType
  /** Single feeds: the one endpoint. Merge feeds mirror their first source here. */
  url: string
  /** Merge feeds only: the key → URL pairs merged at send time. */
  sources: ContentFeedSource[]
  folderId: string | null
  updateDay: string
  updateHour: string
  createdAt: string
  updatedAt: string
}

// ── Footer Management ────────────────────────────────────────────────────────
export type FooterEditorType = 'Drag & Drop' | 'WYSIWYG'

export interface FooterPrefPages {
  oneClickUnsub: number | null
  reportSpam: number | null
  manageSubscription: number | null
  editProfile: number | null
}

export interface FooterItem {
  id: number
  name: string
  editorType: FooterEditorType
  isDefault: boolean
  prefPages: FooterPrefPages
  body: string
  createdAt: string
  updatedAt: string
}

// ── Coupon Banks ─────────────────────────────────────────────────────────────
export interface CouponBank {
  id: number
  name: string
  tag: string
  unused: number
  redeemed: number
  assigned: number
  alertThreshold: number | null
  alertRecipients: string
  codes: string[]
  createdAt: string
  updatedAt: string
}

// ── Preference Pages ─────────────────────────────────────────────────────────
export type PreferencePageType =
  | 'Manage Subscriptions'
  | 'One Click Unsubscribe'
  | 'Confirm Subscription'
  | 'Edit Profile'
  | 'Report Spam'

export type PreferenceEditorType = 'Drag & Drop' | 'WYSIWYG' | 'HTML'

export interface PreferencePage {
  id: number
  name: string
  pageType: PreferencePageType
  editorType: PreferenceEditorType
  redirectUrl: string
  createdAt: string
  updatedAt: string
}

// ── Optimise on Open (image groups) ─────────────────────────────────────────

/**
 * One image slot of an Optimize-on-Open group. The default image shows until
 * its expiration; optional timed slots follow; the expiry image has no
 * expiration of its own — it is what renders after everything else lapses.
 */
export interface ImageGroupSlot {
  id: number
  kind: 'default' | 'timed' | 'expiry'
  imageName: string
  imageUrl: string
  clickThroughUrl: string
  /** Required on default/timed slots; always null on the expiry slot. */
  expiresAtDate: string | null
  expiresAtTime: string | null
}

export interface ImageGroup {
  id: number
  name: string
  folderId: string | null
  slots: ImageGroupSlot[]
  createdAt: string
  updatedAt: string
}

function nextId<T extends { id: number }>(items: T[]): number {
  return Math.max(0, ...items.map(i => i.id)) + 1
}

export const useMarketingAssetsStore = defineStore('marketingAssets', () => {
  // ── Campaign Tags ──────────────────────────────────────────────────────
  const tags = ref<CampaignTag[]>([
    { id: 1, name: 'Newsletter', createdAt: '2025-11-02', updatedAt: '2026-01-15' },
    { id: 2, name: 'Promo_2026', createdAt: '2025-12-10', updatedAt: '2026-02-20' },
    { id: 3, name: 'Onboarding', createdAt: '2025-09-18', updatedAt: '2025-09-18' },
    { id: 4, name: 'Retention', createdAt: '2026-01-05', updatedAt: '2026-01-05' },
    { id: 5, name: 'VIP', createdAt: '2026-02-01', updatedAt: '2026-02-11' },
  ])

  function addTag(name: string): CampaignTag {
    const now = new Date().toISOString().slice(0, 10)
    const tag: CampaignTag = { id: nextId(tags.value), name, createdAt: now, updatedAt: now }
    tags.value.unshift(tag)
    return tag
  }

  function addTags(names: string[]): CampaignTag[] {
    return names.filter(n => n.trim() !== '').map(n => addTag(n.trim()))
  }

  function renameTag(id: number, name: string) {
    const tag = tags.value.find(t => t.id === id)
    if (!tag) return
    tag.name = name
    tag.updatedAt = new Date().toISOString().slice(0, 10)
  }

  function deleteTag(id: number) {
    tags.value = tags.value.filter(t => t.id !== id)
  }

  // ── Dynamic Content ─────────────────────────────────────────────────────
  const dynamicContents = ref<DynamicContentItem[]>([
    {
      id: 1,
      name: 'vip_header_greeting',
      contentFeedId: null,
      originalContent: 'Welcome back! Enjoy your regular member perks.',
      rules: [
        { id: 1, segmentId: 1, segmentName: 'VIP Customers', contentFeedId: null, content: 'Welcome back, VIP! Here are your exclusive perks.' },
      ],
      archived: false,
      createdAt: '2026-01-10',
      updatedAt: '2026-03-01',
    },
    {
      id: 2,
      name: 'product_recommendation_block',
      contentFeedId: 3,
      originalContent: 'Check out our best sellers this week.',
      rules: [
        { id: 1, segmentId: 2, segmentName: 'Recent Purchasers', contentFeedId: null, content: 'You might also like these related products.' },
        { id: 2, segmentId: 3, segmentName: 'Cart Abandoners', contentFeedId: null, content: 'Still thinking it over? Here is 10% off your cart.' },
      ],
      archived: false,
      createdAt: '2025-12-20',
      updatedAt: '2026-02-15',
    },
    {
      id: 3,
      name: 'abandoned_cart_items',
      contentFeedId: null,
      originalContent: 'You left something in your cart.',
      rules: [
        { id: 1, segmentId: 3, segmentName: 'Cart Abandoners', contentFeedId: null, content: 'Your cart is waiting — complete your order now.' },
      ],
      archived: false,
      createdAt: '2025-11-05',
      updatedAt: '2026-01-10',
    },
  ])

  function addDynamicContent(input: Omit<DynamicContentItem, 'id' | 'createdAt' | 'updatedAt'>): DynamicContentItem {
    const now = new Date().toISOString().slice(0, 10)
    const item: DynamicContentItem = { ...input, id: nextId(dynamicContents.value), createdAt: now, updatedAt: now }
    dynamicContents.value.unshift(item)
    return item
  }

  function updateDynamicContent(id: number, patch: Partial<Omit<DynamicContentItem, 'id' | 'createdAt'>>) {
    const item = dynamicContents.value.find(d => d.id === id)
    if (!item) return
    Object.assign(item, patch, { updatedAt: new Date().toISOString().slice(0, 10) })
  }

  function duplicateDynamicContent(id: number) {
    const item = dynamicContents.value.find(d => d.id === id)
    if (!item) return
    const now = new Date().toISOString().slice(0, 10)
    dynamicContents.value.unshift({
      ...item,
      id: nextId(dynamicContents.value),
      name: `${item.name}_copy`,
      rules: item.rules.map(r => ({ ...r })),
      createdAt: now,
      updatedAt: now,
    })
  }

  function setDynamicContentArchived(id: number, archived: boolean) {
    const item = dynamicContents.value.find(d => d.id === id)
    if (!item) return
    item.archived = archived
    item.updatedAt = new Date().toISOString().slice(0, 10)
  }

  function deleteDynamicContent(id: number) {
    dynamicContents.value = dynamicContents.value.filter(d => d.id !== id)
  }

  // ── Content Feeds ────────────────────────────────────────────────────────
  const feeds = ref<ContentFeed[]>([
    { id: 1, name: 'Latest Blog Posts', feedType: 'Single', url: 'https://blog.example.com/rss', sources: [], folderId: 'cfd-editorial', updateDay: 'Monday', updateHour: '06:00 AM', createdAt: '2025-10-01', updatedAt: '2026-02-20' },
    { id: 2, name: 'Daily Deals JSON', feedType: 'Single', url: 'https://api.example.com/deals', sources: [], folderId: 'cfd-commerce', updateDay: 'Everyday', updateHour: '12:00 AM', createdAt: '2025-11-14', updatedAt: '2026-03-01' },
    {
      id: 3, name: 'Merged Product + Blog Feed', feedType: 'Merge', url: 'https://api.example.com/products.json',
      sources: [
        { key: 'products', url: 'https://api.example.com/products.json' },
        { key: 'blog', url: 'https://blog.example.com/rss' },
      ],
      folderId: null, updateDay: 'Friday', updateHour: '06:00 PM', createdAt: '2026-01-08', updatedAt: '2026-01-20',
    },
  ])

  function addFeed(input: Omit<ContentFeed, 'id' | 'createdAt' | 'updatedAt'>): ContentFeed {
    const now = new Date().toISOString().slice(0, 10)
    const feed: ContentFeed = { ...input, id: nextId(feeds.value), createdAt: now, updatedAt: now }
    feeds.value.unshift(feed)
    return feed
  }

  function updateFeed(id: number, patch: Partial<Omit<ContentFeed, 'id' | 'createdAt'>>) {
    const feed = feeds.value.find(f => f.id === id)
    if (!feed) return
    Object.assign(feed, patch, { updatedAt: new Date().toISOString().slice(0, 10) })
  }

  function deleteFeed(id: number) {
    feeds.value = feeds.value.filter(f => f.id !== id)
  }

  // ── Footer Management ────────────────────────────────────────────────────
  const footers = ref<FooterItem[]>([
    {
      id: 1,
      name: 'Standard Compliance (CAN-SPAM)',
      editorType: 'WYSIWYG',
      isDefault: true,
      prefPages: { oneClickUnsub: 2, reportSpam: 5, manageSubscription: 1, editProfile: 4 },
      body: 'You are receiving this email because you subscribed.',
      createdAt: '2025-08-01',
      updatedAt: '2025-11-20',
    },
    {
      id: 2,
      name: 'EU Compliance (GDPR)',
      editorType: 'WYSIWYG',
      isDefault: false,
      prefPages: { oneClickUnsub: 2, reportSpam: 5, manageSubscription: 1, editProfile: 4 },
      body: 'Manage your preferences or unsubscribe at any time.',
      createdAt: '2025-09-12',
      updatedAt: '2026-01-15',
    },
    {
      id: 3,
      name: 'Transactional Footer Minimal',
      editorType: 'Drag & Drop',
      isDefault: false,
      prefPages: { oneClickUnsub: 2, reportSpam: null, manageSubscription: null, editProfile: null },
      body: '',
      createdAt: '2026-01-02',
      updatedAt: '2026-02-01',
    },
  ])

  function addFooter(input: Omit<FooterItem, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>): FooterItem {
    const now = new Date().toISOString().slice(0, 10)
    const footer: FooterItem = { ...input, id: nextId(footers.value), isDefault: false, createdAt: now, updatedAt: now }
    footers.value.unshift(footer)
    return footer
  }

  function updateFooter(id: number, patch: Partial<Omit<FooterItem, 'id' | 'createdAt' | 'isDefault'>>) {
    const footer = footers.value.find(f => f.id === id)
    if (!footer) return
    Object.assign(footer, patch, { updatedAt: new Date().toISOString().slice(0, 10) })
  }

  function duplicateFooter(id: number) {
    const footer = footers.value.find(f => f.id === id)
    if (!footer) return
    const now = new Date().toISOString().slice(0, 10)
    footers.value.unshift({
      ...footer,
      id: nextId(footers.value),
      name: `${footer.name} (Copy)`,
      isDefault: false,
      prefPages: { ...footer.prefPages },
      createdAt: now,
      updatedAt: now,
    })
  }

  function setDefaultFooter(id: number) {
    for (const f of footers.value) f.isDefault = f.id === id
  }

  function deleteFooter(id: number) {
    footers.value = footers.value.filter(f => f.id !== id)
  }

  // ── Coupon Banks ─────────────────────────────────────────────────────────
  const coupons = ref<CouponBank[]>([
    { id: 1, name: 'Spring Sale 20% Off', tag: 'spring_sale_20', unused: 15400, redeemed: 4200, assigned: 400, alertThreshold: 1000, alertRecipients: 'marketing@example.com', codes: [], createdAt: '2026-01-15', updatedAt: '2026-03-01' },
    { id: 2, name: 'VIP Free Shipping', tag: 'vip_free_shipping', unused: 450, redeemed: 40, assigned: 10, alertThreshold: 50, alertRecipients: 'vip@example.com', codes: [], createdAt: '2025-12-01', updatedAt: '2026-02-10' },
    { id: 3, name: 'Welcome 10% Off', tag: 'welcome_10', unused: 85200, redeemed: 14500, assigned: 300, alertThreshold: null, alertRecipients: '', codes: [], createdAt: '2025-06-10', updatedAt: '2026-02-25' },
  ])

  function addCoupon(input: { name: string; tag: string; alertThreshold: number | null; alertRecipients: string; codes: string[] }): CouponBank {
    const now = new Date().toISOString().slice(0, 10)
    const bank: CouponBank = {
      id: nextId(coupons.value),
      name: input.name,
      tag: input.tag,
      unused: input.codes.length,
      redeemed: 0,
      assigned: 0,
      alertThreshold: input.alertThreshold,
      alertRecipients: input.alertRecipients,
      codes: input.codes,
      createdAt: now,
      updatedAt: now,
    }
    coupons.value.unshift(bank)
    return bank
  }

  function updateCoupon(id: number, patch: Partial<Pick<CouponBank, 'name' | 'tag' | 'alertThreshold' | 'alertRecipients' | 'codes'>>) {
    const bank = coupons.value.find(c => c.id === id)
    if (!bank) return
    Object.assign(bank, patch)
    if (patch.codes) bank.unused = patch.codes.length
    bank.updatedAt = new Date().toISOString().slice(0, 10)
  }

  function deleteCoupon(id: number) {
    coupons.value = coupons.value.filter(c => c.id !== id)
  }

  // ── Preference Pages ─────────────────────────────────────────────────────
  const preferencePages = ref<PreferencePage[]>([
    { id: 1, name: 'Default Subscription Center', pageType: 'Manage Subscriptions', editorType: 'WYSIWYG', redirectUrl: 'https://example.com/thank-you', createdAt: '2025-07-01', updatedAt: '2025-11-01' },
    { id: 2, name: 'One-Click Unsubscribe', pageType: 'One Click Unsubscribe', editorType: 'HTML', redirectUrl: '', createdAt: '2025-07-01', updatedAt: '2025-10-15' },
    { id: 3, name: 'Confirm Your Subscription', pageType: 'Confirm Subscription', editorType: 'Drag & Drop', redirectUrl: '', createdAt: '2025-08-12', updatedAt: '2026-01-05' },
    { id: 4, name: 'Edit Your Profile', pageType: 'Edit Profile', editorType: 'WYSIWYG', redirectUrl: '', createdAt: '2025-09-20', updatedAt: '2026-02-01' },
    { id: 5, name: 'Report Spam Confirmation', pageType: 'Report Spam', editorType: 'HTML', redirectUrl: '', createdAt: '2025-10-05', updatedAt: '2025-12-18' },
    { id: 6, name: 'EU Subscription Center', pageType: 'Manage Subscriptions', editorType: 'Drag & Drop', redirectUrl: 'https://example.com/eu/thank-you', createdAt: '2026-01-20', updatedAt: '2026-02-28' },
  ])

  function addPreferencePage(input: Omit<PreferencePage, 'id' | 'createdAt' | 'updatedAt'>): PreferencePage {
    const now = new Date().toISOString().slice(0, 10)
    const page: PreferencePage = { ...input, id: nextId(preferencePages.value), createdAt: now, updatedAt: now }
    preferencePages.value.unshift(page)
    return page
  }

  function updatePreferencePage(id: number, patch: Partial<Omit<PreferencePage, 'id' | 'createdAt'>>) {
    const page = preferencePages.value.find(p => p.id === id)
    if (!page) return
    Object.assign(page, patch, { updatedAt: new Date().toISOString().slice(0, 10) })
  }

  function duplicatePreferencePage(id: number) {
    const page = preferencePages.value.find(p => p.id === id)
    if (!page) return
    const now = new Date().toISOString().slice(0, 10)
    preferencePages.value.unshift({ ...page, id: nextId(preferencePages.value), name: `${page.name} (Copy)`, createdAt: now, updatedAt: now })
  }

  function deletePreferencePage(id: number) {
    preferencePages.value = preferencePages.value.filter(p => p.id !== id)
  }

  // ── Optimise on Open (image groups) ─────────────────────────────────────
  const imageGroups = ref<ImageGroup[]>([
    {
      id: 1, name: 'Dynamic Weather Header', folderId: 'iog-seasonal', createdAt: '2025-11-01', updatedAt: '2026-03-01',
      slots: [
        { id: 1, kind: 'default', imageName: 'hero_summer_sale.jpg', imageUrl: 'https://picsum.photos/seed/mp-image-1/600/400', clickThroughUrl: 'https://shop.example.com/summer', expiresAtDate: '2026-09-27', expiresAtTime: '13:20' },
        { id: 2, kind: 'timed', imageName: 'banner_new_arrivals.jpg', imageUrl: 'https://picsum.photos/seed/mp-image-3/600/400', clickThroughUrl: 'https://shop.example.com/new', expiresAtDate: '2026-10-15', expiresAtTime: '09:00' },
        { id: 3, kind: 'expiry', imageName: 'banner_free_shipping.png', imageUrl: 'https://picsum.photos/seed/mp-image-2/600/400', clickThroughUrl: 'https://shop.example.com', expiresAtDate: null, expiresAtTime: null },
      ],
    },
    {
      id: 2, name: 'Live Inventory Banner', folderId: null, createdAt: '2025-12-15', updatedAt: '2026-02-15',
      slots: [
        { id: 1, kind: 'default', imageName: 'sneaker_airmax_white.jpg', imageUrl: 'https://picsum.photos/seed/mp-image-4/600/400', clickThroughUrl: 'https://shop.example.com/sneakers', expiresAtDate: '2026-11-01', expiresAtTime: '00:00' },
        { id: 2, kind: 'expiry', imageName: 'lifestyle_morning_run.jpg', imageUrl: 'https://picsum.photos/seed/mp-image-7/600/400', clickThroughUrl: 'https://shop.example.com', expiresAtDate: null, expiresAtTime: null },
      ],
    },
  ])

  function addImageGroup(input: Omit<ImageGroup, 'id' | 'createdAt' | 'updatedAt'>): ImageGroup {
    const now = new Date().toISOString().slice(0, 10)
    const group: ImageGroup = { ...input, id: nextId(imageGroups.value), createdAt: now, updatedAt: now }
    imageGroups.value.unshift(group)
    return group
  }

  function updateImageGroup(id: number, patch: Partial<Omit<ImageGroup, 'id' | 'createdAt'>>) {
    const group = imageGroups.value.find(g => g.id === id)
    if (!group) return
    Object.assign(group, patch, { updatedAt: new Date().toISOString().slice(0, 10) })
  }

  function deleteImageGroup(id: number) {
    imageGroups.value = imageGroups.value.filter(g => g.id !== id)
  }

  return {
    tags,
    addTag,
    addTags,
    renameTag,
    deleteTag,

    dynamicContents,
    addDynamicContent,
    updateDynamicContent,
    setDynamicContentArchived,
    duplicateDynamicContent,
    deleteDynamicContent,

    feeds,
    addFeed,
    updateFeed,
    deleteFeed,

    footers,
    addFooter,
    updateFooter,
    duplicateFooter,
    setDefaultFooter,
    deleteFooter,

    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,

    preferencePages,
    addPreferencePage,
    updatePreferencePage,
    duplicatePreferencePage,
    deletePreferencePage,

    imageGroups,
    addImageGroup,
    updateImageGroup,
    deleteImageGroup,
  }
})
