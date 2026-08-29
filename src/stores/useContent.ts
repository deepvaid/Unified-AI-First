import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Email content — the reusable email bodies a campaign later points at.
 * Rebuilt from UAT `/contents`; see docs/rebuild/email-content/.
 */

/** The four builders the source offers, and the slug each uses in its editor URL. */
export type ContentEditorType = 'Drag & Drop' | 'WYSIWYG' | 'HTML Code Editor' | 'Pull from URL'

export const EDITOR_SLUGS: Record<ContentEditorType, string> = {
  'Drag & Drop': 'drag_and_drop_beta',
  'WYSIWYG': 'wysiwyg',
  'HTML Code Editor': 'html',
  'Pull from URL': 'pull_from_url',
}

/** Templates are authored in a narrower set — the source's template chooser offers only two. */
export type TemplateEditorType = 'Drag & Drop' | 'WYSIWYG' | 'Drag & Drop (Legacy)'

export interface ContentItem {
  id: number
  name: string
  editorType: ContentEditorType
  createdAt: string
  updatedAt: string
  folderId: string | null
  archived: boolean
  /** How many live campaigns point at this body — the source never surfaces this. */
  usedByCampaigns: number
}

/** An account-authored template, shown on the gallery's MY TEMPLATES tab. */
export interface ContentTemplate {
  id: number
  name: string
  editorType: TemplateEditorType
  createdBy: string
  createdAt: string
  updatedAt: string
  folderId: string | null
}

/** A Maropost-supplied stock design, shown on the gallery's LIBRARY tab. */
export interface LibraryTemplate {
  id: string
  name: string
  /** Facet values; the source's facets combine with OR. */
  industry: string[]
  automated: string[]
  seasonal: string[]
  usage: string[]
  /** Drives the drawn thumbnail. */
  palette: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'
  layout: 'hero' | 'split' | 'grid' | 'minimal'
}

/** The layout step the Drag & Drop template builder inserts before its editor. */
export interface TemplateLayout {
  id: string
  name: string
  description: string
  /** Column counts per stacked row, used to draw the layout preview. */
  rows: number[]
}

export const CONTENT_FACETS = {
  industry: ['Retail', 'Fashion', 'Food & Beverage', 'Travel', 'Health', 'Technology'],
  automated: ['Welcome', 'Abandoned cart', 'Win-back', 'Post-purchase'],
  seasonal: ['Black Friday', 'Christmas', 'Easter', 'Summer', 'New Year'],
  usage: ['Newsletter', 'Promotion', 'Announcement', 'Transactional', 'Survey'],
} as const

export const TEMPLATE_LAYOUTS: TemplateLayout[] = [
  { id: 'single', name: 'Single column', description: 'One full-width column. The safest choice for mobile.', rows: [1, 1, 1] },
  { id: 'two-col', name: 'Two columns', description: 'A full-width header over a two-column body.', rows: [1, 2, 1] },
  { id: 'three-col', name: 'Three columns', description: 'Good for product grids and category links.', rows: [1, 3, 1] },
  { id: 'sidebar', name: 'Sidebar', description: 'A narrow column beside the main content.', rows: [1, 2, 2] },
  { id: 'hero', name: 'Hero', description: 'A large image or headline, then stacked content.', rows: [1, 1, 2, 1] },
  { id: 'blank', name: 'Blank', description: 'No rows to start with — build it up yourself.', rows: [] },
]

const LIBRARY: LibraryTemplate[] = [
  { id: 'lib-1', name: 'Spring arrivals', industry: ['Fashion', 'Retail'], automated: [], seasonal: ['Summer'], usage: ['Newsletter'], palette: 'success', layout: 'hero' },
  { id: 'lib-2', name: 'Black Friday countdown', industry: ['Retail'], automated: [], seasonal: ['Black Friday'], usage: ['Promotion'], palette: 'error', layout: 'hero' },
  { id: 'lib-3', name: 'Welcome aboard', industry: ['Technology'], automated: ['Welcome'], seasonal: [], usage: ['Announcement'], palette: 'primary', layout: 'minimal' },
  { id: 'lib-4', name: 'Cart left behind', industry: ['Retail'], automated: ['Abandoned cart'], seasonal: [], usage: ['Promotion'], palette: 'warning', layout: 'split' },
  { id: 'lib-5', name: 'Easter home decor sale', industry: ['Retail'], automated: [], seasonal: ['Easter'], usage: ['Promotion'], palette: 'info', layout: 'grid' },
  { id: 'lib-6', name: 'Monthly digest', industry: ['Technology'], automated: [], seasonal: [], usage: ['Newsletter'], palette: 'secondary', layout: 'minimal' },
  { id: 'lib-7', name: 'Order on its way', industry: ['Retail'], automated: ['Post-purchase'], seasonal: [], usage: ['Transactional'], palette: 'success', layout: 'minimal' },
  { id: 'lib-8', name: 'We miss you', industry: ['Fashion'], automated: ['Win-back'], seasonal: [], usage: ['Promotion'], palette: 'warning', layout: 'split' },
  { id: 'lib-9', name: 'Christmas gift guide', industry: ['Retail', 'Fashion'], automated: [], seasonal: ['Christmas'], usage: ['Promotion'], palette: 'error', layout: 'grid' },
  { id: 'lib-10', name: 'Table for two', industry: ['Food & Beverage'], automated: [], seasonal: [], usage: ['Promotion'], palette: 'warning', layout: 'hero' },
  { id: 'lib-11', name: 'Weekend escapes', industry: ['Travel'], automated: [], seasonal: ['Summer'], usage: ['Newsletter'], palette: 'info', layout: 'hero' },
  { id: 'lib-12', name: 'Wellness check-in', industry: ['Health'], automated: [], seasonal: ['New Year'], usage: ['Newsletter'], palette: 'success', layout: 'minimal' },
  { id: 'lib-13', name: 'New year, new range', industry: ['Fashion'], automated: [], seasonal: ['New Year'], usage: ['Announcement'], palette: 'primary', layout: 'split' },
  { id: 'lib-14', name: 'Tell us how we did', industry: ['Retail'], automated: ['Post-purchase'], seasonal: [], usage: ['Survey'], palette: 'secondary', layout: 'minimal' },
  { id: 'lib-15', name: 'Menu refresh', industry: ['Food & Beverage'], automated: [], seasonal: [], usage: ['Announcement'], palette: 'success', layout: 'grid' },
  { id: 'lib-16', name: 'Feature release notes', industry: ['Technology'], automated: [], seasonal: [], usage: ['Announcement'], palette: 'primary', layout: 'minimal' },
  { id: 'lib-17', name: 'Summer clearance', industry: ['Retail', 'Fashion'], automated: [], seasonal: ['Summer'], usage: ['Promotion'], palette: 'error', layout: 'grid' },
  { id: 'lib-18', name: 'Loyalty rewards', industry: ['Retail'], automated: ['Win-back'], seasonal: [], usage: ['Promotion'], palette: 'info', layout: 'split' },
]

const EDITOR_TYPES: ContentEditorType[] = ['Drag & Drop', 'WYSIWYG', 'HTML Code Editor', 'Pull from URL']
const CONTENT_FOLDERS = [null, 'cnt-templates', 'cnt-campaigns', 'cnt-holiday', 'cnt-automation', 'cnt-brendan', 'cnt-harpreet', 'cnt-sonakshi']
const NAME_PREFIX = ['Newsletter', 'Welcome email', 'Holiday promo', 'Order confirmation', 'Abandoned cart', 'Gift guide', 'Flash sale', 'Product launch', 'Win-back', 'Survey invite', 'Restock alert', 'Shipping update']
const NAME_SUFFIX = ['2026', 'v2', 'master', 'draft', 'storefront', 'AU', 'UK', 'mobile-first', 'final', 'test']

/**
 * The source's account holds 489 records; the volume is the point, because it is
 * what makes the missing search painful. Generated deterministically so the list
 * is stable across reloads.
 */
/**
 * Plain modular strides would lock the fields together — with 12 name prefixes and
 * 4 editor types, `i % 12` fully determines `i % 4`, so every "Product launch" ends
 * up being a "Pull from URL". Scrambling the index first decorrelates them while
 * keeping the data identical on every reload.
 */
function scramble(i: number, salt: number): number {
  const h = Math.imul(i + salt, 2654435761) >>> 0
  // The XOR yields a signed 32-bit int, so re-cast: a negative value would make
  // every `% length` below a negative index.
  return (h ^ (h >>> 13)) >>> 0
}

function seedContent(): ContentItem[] {
  const out: ContentItem[] = []
  for (let i = 0; i < 120; i += 1) {
    const prefix = NAME_PREFIX[scramble(i, 1) % NAME_PREFIX.length]
    const suffix = NAME_SUFFIX[scramble(i, 2) % NAME_SUFFIX.length]
    const created = new Date(Date.UTC(
      2025,
      scramble(i, 3) % 12,
      (scramble(i, 4) % 27) + 1,
      scramble(i, 5) % 24,
      scramble(i, 6) % 60,
    ))
    const updated = new Date(created.getTime() + ((scramble(i, 7) % 40) + 1) * 86_400_000)
    out.push({
      id: 200 + i,
      name: `${prefix} — ${suffix}`,
      editorType: EDITOR_TYPES[scramble(i, 8) % EDITOR_TYPES.length]!,
      createdAt: created.toISOString(),
      updatedAt: updated.toISOString(),
      folderId: CONTENT_FOLDERS[scramble(i, 9) % CONTENT_FOLDERS.length] ?? null,
      archived: scramble(i, 10) % 17 === 0,
      usedByCampaigns: scramble(i, 11) % 6 === 0 ? (scramble(i, 12) % 4) + 1 : 0,
    })
  }
  return out.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

function seedTemplates(): ContentTemplate[] {
  const owners = ['Deepak Vaidya', 'Harpreet Singh', 'Manny Ortega', 'Yash Patel']
  const types: TemplateEditorType[] = ['Drag & Drop', 'WYSIWYG', 'Drag & Drop (Legacy)']
  const folders = [null, 'ctpl-brand', 'ctpl-seasonal', 'ctpl-yash']
  const names = [
    'Brand header + footer', 'Plain text announcement', 'Two-column product row',
    'Seasonal hero banner', 'Transactional receipt', 'Weekly digest shell',
    'Promotional countdown', 'Minimal newsletter', 'Three-up product grid',
    'Survey invitation', 'Event invitation', 'Back-in-stock alert',
  ]
  return names.map((name, i) => {
    const created = new Date(Date.UTC(2025, (i * 3) % 12, ((i * 5) % 27) + 1))
    return {
      id: 400 + i,
      name,
      editorType: types[i % types.length]!,
      createdBy: owners[i % owners.length]!,
      createdAt: created.toISOString(),
      updatedAt: new Date(created.getTime() + ((i % 30) + 1) * 86_400_000).toISOString(),
      folderId: folders[i % folders.length] ?? null,
    }
  })
}

export const useContentStore = defineStore('content', () => {
  const items = ref<ContentItem[]>(seedContent())
  const templates = ref<ContentTemplate[]>(seedTemplates())
  const library = ref<LibraryTemplate[]>(LIBRARY)

  const activeItems = computed(() => items.value.filter(i => !i.archived))
  const archivedItems = computed(() => items.value.filter(i => i.archived))

  function getItem(id: number): ContentItem | undefined {
    return items.value.find(i => i.id === id)
  }

  function editorSlugFor(item: ContentItem): string {
    return EDITOR_SLUGS[item.editorType]
  }

  function nextId(): number {
    return Math.max(0, ...items.value.map(i => i.id)) + 1
  }

  function createContent(name: string, editorType: ContentEditorType, folderId: string | null = null): ContentItem {
    const now = new Date().toISOString()
    const item: ContentItem = {
      id: nextId(), name, editorType, createdAt: now, updatedAt: now,
      folderId, archived: false, usedByCampaigns: 0,
    }
    items.value.unshift(item)
    return item
  }

  function moveToFolder(ids: number[], folderId: string | null) {
    for (const item of items.value) if (ids.includes(item.id)) item.folderId = folderId
  }

  function cloneContent(id: number): ContentItem | undefined {
    const item = getItem(id)
    if (!item) return undefined
    const now = new Date().toISOString()
    const copy: ContentItem = {
      ...item, id: nextId(), name: `${item.name} (Copy)`,
      createdAt: now, updatedAt: now, archived: false, usedByCampaigns: 0,
    }
    items.value.unshift(copy)
    return copy
  }

  function setArchived(ids: number[], archived: boolean) {
    for (const item of items.value) if (ids.includes(item.id)) item.archived = archived
  }

  function removeContent(ids: number[]) {
    items.value = items.value.filter(i => !ids.includes(i.id))
  }

  /** Nulls folderId on items whose folder was deleted. */
  function reassignFolder(folderId: string) {
    for (const item of items.value) if (item.folderId === folderId) item.folderId = null
    for (const tpl of templates.value) if (tpl.folderId === folderId) tpl.folderId = null
  }

  function removeTemplate(ids: number[]) {
    templates.value = templates.value.filter(t => !ids.includes(t.id))
  }

  return {
    items, templates, library, activeItems, archivedItems,
    getItem, editorSlugFor, createContent, moveToFolder, cloneContent,
    setArchived, removeContent, reassignFolder, removeTemplate,
  }
})
