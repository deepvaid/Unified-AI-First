import { ref } from 'vue'
import { defineStore } from 'pinia'

// Storefront pages & blog posts (store editor ▸ Pages / Blogs).
// Legacy parity notes (sandbox crawl 2026-07-10, docs/uat-parity/parity-tracker.md A06b):
// Pages and Blogs share one create form — Title* + rich-text body + SEO settings,
// with a right rail of Status (default Inactive) / Template (Default) / feature image.
// Blogs additionally have a list-level SEO Settings modal (title + meta description).

export type ContentKind = 'page' | 'blog'
export type ContentStatus = 'Active' | 'Inactive'

export interface ContentEntry {
  id: string
  channelId: string
  kind: ContentKind
  title: string
  /** Rich-text body as HTML (prototype mock — edited via the contenteditable surface). */
  body: string
  status: ContentStatus
  template: string
  seoTitle: string
  seoDescription: string
  /** Feature image filename, empty when none uploaded. */
  imageName: string
  publishedAt: string
  updatedAt: string
}

export interface BlogSeoSettings {
  title: string
  metaDescription: string
}

export const CONTENT_TEMPLATES = ['Default', 'Full width']

let contentIdCounter = 0

export function createContentDraft(channelId: string, kind: ContentKind): ContentEntry {
  contentIdCounter += 1
  return {
    id: `${kind}-${Date.now().toString(36)}-${contentIdCounter}`,
    channelId,
    kind,
    title: '',
    body: '',
    status: 'Inactive',
    template: 'Default',
    seoTitle: '',
    seoDescription: '',
    imageName: '',
    publishedAt: '',
    updatedAt: '',
  }
}

function seedEntries(): ContentEntry[] {
  return [
    {
      id: 'page-terms',
      channelId: 'retest-sales-notification',
      kind: 'page',
      title: 'Terms and conditions',
      body: '<h2>Terms and conditions</h2><p>These terms govern your use of the Atlas Outfitters storefront. By placing an order you agree to our shipping, returns, and warranty policies.</p><ul><li>Orders ship within 2 business days</li><li>Returns accepted within 30 days</li></ul>',
      status: 'Active',
      template: 'Default',
      seoTitle: 'Terms and conditions — Atlas Outfitters',
      seoDescription: 'Ordering, shipping, and returns terms for Atlas Outfitters.',
      imageName: '',
      publishedAt: 'May 8, 2026',
      updatedAt: 'May 8, 2026',
    },
    {
      id: 'page-privacy',
      channelId: 'retest-sales-notification',
      kind: 'page',
      title: 'Privacy policy',
      body: '<h2>Privacy policy</h2><p>We collect only the data needed to fulfil your order and improve your shopping experience. We never sell personal information.</p>',
      status: 'Active',
      template: 'Default',
      seoTitle: 'Privacy policy — Atlas Outfitters',
      seoDescription: 'How Atlas Outfitters collects, uses, and protects your data.',
      imageName: '',
      publishedAt: 'May 8, 2026',
      updatedAt: 'May 8, 2026',
    },
    {
      id: 'page-about',
      channelId: 'retest-sales-notification',
      kind: 'page',
      title: 'About us',
      body: '<h2>Built for the long way home</h2><p>Atlas Outfitters makes durable outdoor gear, cut for movement and backed for life.</p>',
      status: 'Active',
      template: 'Full width',
      seoTitle: 'About Atlas Outfitters',
      seoDescription: 'The story behind Atlas Outfitters.',
      imageName: 'team-photo.webp',
      publishedAt: 'May 12, 2026',
      updatedAt: 'Jun 20, 2026',
    },
    {
      id: 'blog-trail-guide',
      channelId: 'retest-sales-notification',
      kind: 'blog',
      title: 'Five trails to break in your new boots',
      body: '<p>From coastal loops to alpine passes, these five day hikes are the perfect proving ground for a fresh pair of boots.</p>',
      status: 'Active',
      template: 'Default',
      seoTitle: 'Five trails to break in your new boots',
      seoDescription: 'Day-hike recommendations from the Atlas Outfitters team.',
      imageName: 'trail-guide-hero.webp',
      publishedAt: 'Jun 28, 2026',
      updatedAt: 'Jul 1, 2026',
    },
    {
      id: 'blog-care-guide',
      channelId: 'retest-sales-notification',
      kind: 'blog',
      title: 'How to care for waxed canvas',
      body: '<p>Waxed canvas gets better with age — if you treat it right. Here is our simple three-step care routine.</p>',
      status: 'Inactive',
      template: 'Default',
      seoTitle: 'Waxed canvas care guide',
      seoDescription: 'Cleaning and re-waxing tips for waxed canvas gear.',
      imageName: '',
      publishedAt: '',
      updatedAt: 'Jul 6, 2026',
    },
  ]
}

export const useStoreContentStore = defineStore('storeContent', () => {
  const entries = ref<ContentEntry[]>(seedEntries())
  const blogSeoByChannel = ref<Record<string, BlogSeoSettings>>({
    'retest-sales-notification': { title: 'Atlas Outfitters Journal', metaDescription: 'Guides and stories from the Atlas Outfitters team.' },
  })

  function entriesForChannel(channelId: string, kind: ContentKind): ContentEntry[] {
    return entries.value.filter((entry) => entry.channelId === channelId && entry.kind === kind)
  }

  function getEntry(entryId: string): ContentEntry | undefined {
    return entries.value.find((entry) => entry.id === entryId)
  }

  /** Upsert by id (create + edit share it). Stamps updatedAt, and publishedAt on first activation. */
  function saveEntry(draft: ContentEntry): ContentEntry {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const saved: ContentEntry = {
      ...draft,
      updatedAt: today,
      publishedAt: draft.status === 'Active' && !draft.publishedAt ? today : draft.publishedAt,
    }
    const index = entries.value.findIndex((entry) => entry.id === draft.id)
    if (index === -1) entries.value.push(saved)
    else entries.value[index] = saved
    return saved
  }

  function setEntryStatus(entryId: string, status: ContentStatus): void {
    const entry = getEntry(entryId)
    if (!entry) return
    entry.status = status
    if (status === 'Active' && !entry.publishedAt) {
      entry.publishedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  function deleteEntry(entryId: string): void {
    entries.value = entries.value.filter((entry) => entry.id !== entryId)
  }

  function blogSeo(channelId: string): BlogSeoSettings {
    return blogSeoByChannel.value[channelId] ?? { title: '', metaDescription: '' }
  }

  function saveBlogSeo(channelId: string, settings: BlogSeoSettings): void {
    blogSeoByChannel.value[channelId] = { ...settings }
  }

  return { entries, entriesForChannel, getEntry, saveEntry, setEntryStatus, deleteEntry, blogSeo, saveBlogSeo }
})
