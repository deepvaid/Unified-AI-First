import { ref } from 'vue'
import { defineStore } from 'pinia'

// Storefront assets (store editor ▸ Assets).
// Legacy parity notes (sandbox crawl 2026-07-10, docs/uat-parity/parity-tracker.md A06b):
// an image grid with filename bars, a sort-by dropdown (Uploaded At), an Upload Assets
// button, and pagination. Per-asset row actions weren't exposed in the crawl, so none
// are invented here. No real files exist in the prototype — thumbnails are icon mocks.

export interface StoreAsset {
  id: string
  channelId: string
  name: string
  /** Size in KB (mock). */
  sizeKb: number
  /** ISO date (yyyy-mm-dd) used for sorting. */
  uploadedAt: string
}

export function assetExtension(asset: StoreAsset): string {
  const dot = asset.name.lastIndexOf('.')
  return dot === -1 ? '' : asset.name.slice(dot + 1).toLowerCase()
}

export function formatAssetSize(asset: StoreAsset): string {
  return asset.sizeKb >= 1024 ? `${(asset.sizeKb / 1024).toFixed(1)} MB` : `${asset.sizeKb} KB`
}

let assetIdCounter = 0

function seedAssets(): StoreAsset[] {
  const atlas: Array<[string, number, string]> = [
    ['banner.webp', 412, '2026-07-06'],
    ['brand-logo.webp', 38, '2026-07-06'],
    ['atlas-parka-hero.webp', 640, '2026-07-01'],
    ['trail-guide-hero.webp', 588, '2026-06-28'],
    ['team-photo.webp', 902, '2026-06-20'],
    ['summer-lookbook-01.webp', 733, '2026-06-12'],
    ['summer-lookbook-02.webp', 691, '2026-06-12'],
    ['canvas-tote-detail.png', 1210, '2026-06-05'],
    ['merino-beanie-flat.png', 480, '2026-05-30'],
    ['store-front-sydney.jpg', 1840, '2026-05-22'],
    ['size-guide.webp', 96, '2026-05-18'],
    ['favicon.png', 12, '2026-05-08'],
  ]
  return atlas.map(([name, sizeKb, uploadedAt], index) => ({
    id: `asset-atlas-${index + 1}`,
    channelId: 'retest-sales-notification',
    name,
    sizeKb,
    uploadedAt,
  }))
}

export const useStoreAssetsStore = defineStore('storeAssets', () => {
  const assets = ref<StoreAsset[]>(seedAssets())

  function assetsForChannel(channelId: string): StoreAsset[] {
    return assets.value.filter((asset) => asset.channelId === channelId)
  }

  /** Mock upload — registers picked filenames with a stamped upload date. */
  function addAssets(channelId: string, names: string[]): void {
    const today = new Date().toISOString().slice(0, 10)
    for (const name of names) {
      assetIdCounter += 1
      assets.value.unshift({
        id: `asset-${Date.now().toString(36)}-${assetIdCounter}`,
        channelId,
        name,
        sizeKb: 200 + ((name.length * 37) % 800),
        uploadedAt: today,
      })
    }
  }

  return { assets, assetsForChannel, addAssets }
})
