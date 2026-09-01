import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ImageItem {
  id: number
  name: string
  size: string
  /** Created date (ISO day). */
  date: string
  updatedAt: string
  /** CDN URL of the asset (mock). */
  url: string
  folderId: string | null
}

/** Mock CDN base, mirroring production's uploads bucket shape. */
const CDN_BASE = 'https://cdn.maropost.example/uploads/account_2000290'

function mockUrl(id: number): string {
  return `https://picsum.photos/seed/mp-image-${id}/600/400`
}

export const useImagesStore = defineStore('images', () => {
  const items = ref<ImageItem[]>([
    { id: 1, name: 'hero_summer_sale.jpg', size: '412 KB', date: '2026-03-07', updatedAt: '2026-03-07', url: mockUrl(1), folderId: 'img-banners' },
    { id: 2, name: 'banner_free_shipping.png', size: '188 KB', date: '2026-03-05', updatedAt: '2026-03-05', url: mockUrl(2), folderId: 'img-banners' },
    { id: 3, name: 'banner_new_arrivals.jpg', size: '256 KB', date: '2026-03-02', updatedAt: '2026-03-04', url: mockUrl(3), folderId: 'img-banners' },
    { id: 4, name: 'sneaker_airmax_white.jpg', size: '340 KB', date: '2026-02-27', updatedAt: '2026-02-27', url: mockUrl(4), folderId: 'img-products' },
    { id: 5, name: 'headphones_sony_black.jpg', size: '298 KB', date: '2026-02-25', updatedAt: '2026-02-25', url: mockUrl(5), folderId: 'img-products' },
    { id: 6, name: 'vacuum_dyson_v15.jpg', size: '365 KB', date: '2026-02-21', updatedAt: '2026-02-22', url: mockUrl(6), folderId: 'img-products' },
    { id: 7, name: 'lifestyle_morning_run.jpg', size: '480 KB', date: '2026-02-18', updatedAt: '2026-02-18', url: mockUrl(7), folderId: 'img-lifestyle' },
    { id: 8, name: 'lifestyle_home_office.jpg', size: '452 KB', date: '2026-02-14', updatedAt: '2026-02-14', url: mockUrl(8), folderId: 'img-lifestyle' },
    { id: 9, name: 'logo_primary_dark.svg', size: '18 KB', date: '2026-01-30', updatedAt: '2026-01-30', url: mockUrl(9), folderId: 'img-logos' },
    { id: 10, name: 'logo_mark_light.svg', size: '12 KB', date: '2026-01-30', updatedAt: '2026-01-30', url: mockUrl(10), folderId: 'img-logos' },
    { id: 11, name: 'newsletter_header_march.png', size: '210 KB', date: '2026-03-01', updatedAt: '2026-03-01', url: mockUrl(11), folderId: null },
    { id: 12, name: 'promo_countdown_bg.jpg', size: '388 KB', date: '2026-02-08', updatedAt: '2026-02-08', url: mockUrl(12), folderId: null },
  ])

  /** The CDN link the copy-link action puts on the clipboard. */
  function cdnLink(item: ImageItem): string {
    return `${CDN_BASE}/${item.id}/${item.name}`
  }

  function nextId(): number {
    return Math.max(0, ...items.value.map(i => i.id)) + 1
  }

  /** Registers uploaded files (names only — the sandbox stores no binaries). */
  function addImages(names: string[], folderId: string | null = null): ImageItem[] {
    const now = new Date().toISOString().slice(0, 10)
    const added = names.map((name, i) => {
      const id = nextId() + i
      return { id, name, size: `${120 + ((id * 37) % 400)} KB`, date: now, updatedAt: now, url: mockUrl(id), folderId }
    })
    items.value.unshift(...added)
    return added
  }

  function renameImage(id: number, name: string) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    item.name = name
    item.updatedAt = new Date().toISOString().slice(0, 10)
  }

  function deleteImages(ids: number[]) {
    items.value = items.value.filter(i => !ids.includes(i.id))
  }

  function moveToFolder(id: number, folderId: string | null) {
    const item = items.value.find(i => i.id === id)
    if (item) item.folderId = folderId
  }

  /** Nulls folderId on items whose folder was deleted. */
  function reassignFolder(folderId: string) {
    for (const item of items.value) {
      if (item.folderId === folderId) item.folderId = null
    }
  }

  return { items, cdnLink, addImages, renameImage, deleteImages, moveToFolder, reassignFolder }
})
