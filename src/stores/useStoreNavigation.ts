import { ref } from 'vue'
import { defineStore } from 'pinia'

// Storefront navigation menus (store editor ▸ Navigation).
// Legacy parity notes (sandbox crawl 2026-07-10, docs/uat-parity/parity-tracker.md A06b):
// menus are FLAT ordered lists of {title, link} rows — no nesting. Link targets are
// either a fixed storefront page, a picked resource (collection/product/page), or a
// pasted custom URL. Menus carry an Active/Inactive status (create defaults Inactive).

export type MenuLinkType =
  | 'homepage'
  | 'search'
  | 'collection-list'
  | 'blog'
  | 'collection'
  | 'product'
  | 'page'
  | 'url'

export interface MenuLinkTypeDef {
  value: MenuLinkType
  label: string
  icon: string
  /** true → a specific resource must be picked; false → the link is fixed (or a free URL for 'url'). */
  requiresResource: boolean
}

export const MENU_LINK_TYPES: MenuLinkTypeDef[] = [
  { value: 'homepage', label: 'Homepage', icon: 'home', requiresResource: false },
  { value: 'search', label: 'Search', icon: 'search', requiresResource: false },
  { value: 'collection-list', label: 'Collection list', icon: 'layout-grid', requiresResource: false },
  { value: 'blog', label: 'Blog', icon: 'rss', requiresResource: false },
  { value: 'collection', label: 'Collection', icon: 'shapes', requiresResource: true },
  { value: 'product', label: 'Product', icon: 'package', requiresResource: true },
  { value: 'page', label: 'Page', icon: 'file-text', requiresResource: true },
  { value: 'url', label: 'Custom URL', icon: 'link', requiresResource: false },
]

export interface LinkResource {
  id: string
  label: string
  url: string
}

export const LINK_RESOURCES: Partial<Record<MenuLinkType, LinkResource[]>> = {
  collection: [
    { id: 'col-new-arrivals', label: 'New Arrivals', url: '/collections/new-arrivals' },
    { id: 'col-best-sellers', label: 'Best Sellers', url: '/collections/best-sellers' },
    { id: 'col-summer', label: 'Summer Essentials', url: '/collections/summer-essentials' },
    { id: 'col-outerwear', label: 'Outerwear', url: '/collections/outerwear' },
    { id: 'col-accessories', label: 'Accessories', url: '/collections/accessories' },
    { id: 'col-sale', label: 'Sale', url: '/collections/sale' },
  ],
  product: [
    { id: 'prod-atlas-parka', label: 'Atlas Parka', url: '/products/atlas-parka' },
    { id: 'prod-trail-runner', label: 'Trail Runner Sneaker', url: '/products/trail-runner-sneaker' },
    { id: 'prod-canvas-tote', label: 'Canvas Tote', url: '/products/canvas-tote' },
    { id: 'prod-merino-beanie', label: 'Merino Beanie', url: '/products/merino-beanie' },
  ],
  page: [
    { id: 'page-terms', label: 'Terms and conditions', url: '/pages/terms-and-conditions' },
    { id: 'page-privacy', label: 'Privacy policy', url: '/pages/privacy-policy' },
    { id: 'page-about', label: 'About us', url: '/pages/about-us' },
    { id: 'page-shipping', label: 'Shipping & returns', url: '/pages/shipping-returns' },
  ],
}

const FIXED_LINK_URLS: Partial<Record<MenuLinkType, string>> = {
  homepage: '/',
  search: '/search',
  'collection-list': '/collections',
  blog: '/blog',
}

export type MenuStatus = 'Active' | 'Inactive'

export interface MenuItem {
  id: string
  title: string
  linkType: MenuLinkType
  /** Resource id for resource-backed types, the URL itself for 'url', empty for fixed links. */
  target: string
}

export interface StoreMenu {
  id: string
  channelId: string
  name: string
  /** Slug referenced by theme code/templates (e.g. 'main-menu'). Derived from the name. */
  handle: string
  status: MenuStatus
  updatedAt: string
  items: MenuItem[]
}

// ── Pure helpers (the editor runs these on its local draft) ──────────────────

let itemIdCounter = 0

export function createMenuItem(overrides: Partial<Omit<MenuItem, 'id'>> = {}, id?: string): MenuItem {
  itemIdCounter += 1
  return {
    id: id ?? `mi-${Date.now().toString(36)}-${itemIdCounter}`,
    title: '',
    linkType: 'homepage',
    target: '',
    ...overrides,
  }
}

export function createMenuDraft(channelId: string): StoreMenu {
  itemIdCounter += 1
  return {
    id: `menu-${Date.now().toString(36)}-${itemIdCounter}`,
    channelId,
    name: '',
    handle: '',
    status: 'Inactive',
    updatedAt: '',
    items: [createMenuItem()],
  }
}

export function moveItem(items: MenuItem[], id: string, offset: -1 | 1): void {
  const index = items.findIndex((item) => item.id === id)
  const next = index + offset
  if (index === -1 || next < 0 || next >= items.length) return
  const [item] = items.splice(index, 1)
  if (item) items.splice(next, 0, item)
}

export function removeItem(items: MenuItem[], id: string): void {
  const index = items.findIndex((item) => item.id === id)
  if (index !== -1) items.splice(index, 1)
}

export function slugifyHandle(name: string, taken: string[] = []): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'menu'
  let handle = base
  let n = 2
  while (taken.includes(handle)) {
    handle = `${base}-${n}`
    n += 1
  }
  return handle
}

export function resolveItemUrl(item: MenuItem): string {
  const fixed = FIXED_LINK_URLS[item.linkType]
  if (fixed) return fixed
  if (item.linkType === 'url') return item.target
  const resource = LINK_RESOURCES[item.linkType]?.find((r) => r.id === item.target)
  return resource?.url ?? ''
}

const FALLBACK_LINK_TYPE: MenuLinkTypeDef = { value: 'homepage', label: 'Homepage', icon: 'home', requiresResource: false }

export function linkTypeDef(type: MenuLinkType): MenuLinkTypeDef {
  return MENU_LINK_TYPES.find((def) => def.value === type) ?? FALLBACK_LINK_TYPE
}

/** Human caption for a row's link, e.g. "Collection · New Arrivals" or "https://…". */
export function itemLinkLabel(item: MenuItem): string {
  const def = linkTypeDef(item.linkType)
  if (item.linkType === 'url') return item.target || 'Custom URL'
  if (!def.requiresResource) return def.label
  const resource = LINK_RESOURCES[item.linkType]?.find((r) => r.id === item.target)
  return resource ? `${def.label} · ${resource.label}` : def.label
}

export function itemIsComplete(item: MenuItem): boolean {
  if (!item.title.trim()) return false
  const def = linkTypeDef(item.linkType)
  if (def.requiresResource || item.linkType === 'url') return item.target.trim().length > 0
  return true
}

// ── Seeds ─────────────────────────────────────────────────────────────────────
// Handles 'main-menu' / 'footer-menu' on the Atlas channel keep the string refs in
// src/stores/themeCodeData.ts coherent.

function seedMenus(): StoreMenu[] {
  return [
    {
      id: 'menu-atlas-main',
      channelId: 'retest-sales-notification',
      name: 'Main menu',
      handle: 'main-menu',
      status: 'Active',
      updatedAt: 'Jul 8, 2026',
      items: [
        createMenuItem({ title: 'Home', linkType: 'homepage' }, 'mi-atlas-home'),
        createMenuItem({ title: 'Shop all', linkType: 'collection-list' }, 'mi-atlas-shop'),
        createMenuItem({ title: 'New arrivals', linkType: 'collection', target: 'col-new-arrivals' }, 'mi-atlas-new'),
        createMenuItem({ title: 'Best sellers', linkType: 'collection', target: 'col-best-sellers' }, 'mi-atlas-best'),
        createMenuItem({ title: 'Blog', linkType: 'blog' }, 'mi-atlas-blog'),
        createMenuItem({ title: 'About', linkType: 'page', target: 'page-about' }, 'mi-atlas-about'),
      ],
    },
    {
      id: 'menu-atlas-footer',
      channelId: 'retest-sales-notification',
      name: 'Footer menu',
      handle: 'footer-menu',
      status: 'Active',
      updatedAt: 'Jul 2, 2026',
      items: [
        createMenuItem({ title: 'Search', linkType: 'search' }, 'mi-atlas-search'),
        createMenuItem({ title: 'Privacy policy', linkType: 'page', target: 'page-privacy' }, 'mi-atlas-privacy'),
        createMenuItem({ title: 'Terms and conditions', linkType: 'page', target: 'page-terms' }, 'mi-atlas-terms'),
        createMenuItem({ title: 'Shipping & returns', linkType: 'page', target: 'page-shipping' }, 'mi-atlas-shipping'),
        createMenuItem({ title: 'Contact', linkType: 'url', target: 'https://atlas-outfitters.com/contact' }, 'mi-atlas-contact'),
      ],
    },
    {
      id: 'menu-atlas-holiday',
      channelId: 'retest-sales-notification',
      name: 'Holiday menu',
      handle: 'holiday-menu',
      status: 'Inactive',
      updatedAt: 'Jun 24, 2026',
      items: [
        createMenuItem({ title: 'Gift guide', linkType: 'collection', target: 'col-sale' }, 'mi-atlas-gifts'),
        createMenuItem({ title: 'Sale', linkType: 'collection', target: 'col-sale' }, 'mi-atlas-sale'),
      ],
    },
    {
      id: 'menu-beta-main',
      channelId: 'beta-sales-channel',
      name: 'Main menu',
      handle: 'main-menu',
      status: 'Active',
      updatedAt: 'Jul 5, 2026',
      items: [
        createMenuItem({ title: 'Home', linkType: 'homepage' }, 'mi-beta-home'),
        createMenuItem({ title: 'Shop', linkType: 'collection-list' }, 'mi-beta-shop'),
      ],
    },
  ]
}

export const useStoreNavigationStore = defineStore('storeNavigation', () => {
  const menus = ref<StoreMenu[]>(seedMenus())

  function menusForChannel(channelId: string): StoreMenu[] {
    return menus.value.filter((menu) => menu.channelId === channelId)
  }

  function getMenu(menuId: string): StoreMenu | undefined {
    return menus.value.find((menu) => menu.id === menuId)
  }

  /** Upsert by id (create + edit share it). Deep-clones the draft in and stamps updatedAt. */
  function saveMenu(draft: StoreMenu): StoreMenu {
    const taken = menus.value.filter((m) => m.id !== draft.id && m.channelId === draft.channelId).map((m) => m.handle)
    const saved: StoreMenu = {
      ...draft,
      handle: draft.handle || slugifyHandle(draft.name, taken),
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: draft.items.map((item) => ({ ...item })),
    }
    const index = menus.value.findIndex((menu) => menu.id === draft.id)
    if (index === -1) menus.value.push(saved)
    else menus.value[index] = saved
    return saved
  }

  function setMenuStatus(menuId: string, status: MenuStatus): void {
    const menu = getMenu(menuId)
    if (menu) menu.status = status
  }

  function deleteMenu(menuId: string): void {
    menus.value = menus.value.filter((menu) => menu.id !== menuId)
  }

  return { menus, menusForChannel, getMenu, saveMenu, setMenuStatus, deleteMenu }
})
