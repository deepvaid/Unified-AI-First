import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ImageItem {
  id: number
  name: string
  size: string
  date: string
  folderId: string | null
}

export const useImagesStore = defineStore('images', () => {
  const items = ref<ImageItem[]>([
    { id: 1, name: 'hero_summer_sale.jpg', size: '412 KB', date: '2026-03-07', folderId: 'img-banners' },
    { id: 2, name: 'banner_free_shipping.png', size: '188 KB', date: '2026-03-05', folderId: 'img-banners' },
    { id: 3, name: 'banner_new_arrivals.jpg', size: '256 KB', date: '2026-03-02', folderId: 'img-banners' },
    { id: 4, name: 'sneaker_airmax_white.jpg', size: '340 KB', date: '2026-02-27', folderId: 'img-products' },
    { id: 5, name: 'headphones_sony_black.jpg', size: '298 KB', date: '2026-02-25', folderId: 'img-products' },
    { id: 6, name: 'vacuum_dyson_v15.jpg', size: '365 KB', date: '2026-02-21', folderId: 'img-products' },
    { id: 7, name: 'lifestyle_morning_run.jpg', size: '480 KB', date: '2026-02-18', folderId: 'img-lifestyle' },
    { id: 8, name: 'lifestyle_home_office.jpg', size: '452 KB', date: '2026-02-14', folderId: 'img-lifestyle' },
    { id: 9, name: 'logo_primary_dark.svg', size: '18 KB', date: '2026-01-30', folderId: 'img-logos' },
    { id: 10, name: 'logo_mark_light.svg', size: '12 KB', date: '2026-01-30', folderId: 'img-logos' },
    { id: 11, name: 'newsletter_header_march.png', size: '210 KB', date: '2026-03-01', folderId: null },
    { id: 12, name: 'promo_countdown_bg.jpg', size: '388 KB', date: '2026-02-08', folderId: null },
  ])

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

  return { items, moveToFolder, reassignFolder }
})
