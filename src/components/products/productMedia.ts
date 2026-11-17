import { packShot } from '@/storefront/packShot'

// A product's pictures as the product forms handle them. Nothing is uploaded: a
// picked file is shrunk in the browser and kept as a data URL on the product.

export const MAX_PRODUCT_IMAGES = 4
export const PRODUCT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** The longest side a kept picture has. Enough for a product page, small enough to keep a few in the browser. */
const MAX_SIDE = 720

/** Shrinks a picked picture to at most 720px and returns it as a JPEG data URL. Rejects when the file is not a readable picture. */
export async function prepareProductImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot resize pictures')
  // A JPEG has no transparency: without this a cut-out PNG would sit on black.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}

/** The backdrop of a drawn pack shot: a cool off-white that sits beside the store's photos. */
const PACK_BACKDROP = '#f2f4f7'

/**
 * The two pictures a store product gets when it is saved without any: a pack
 * drawn from its name in the store's colours, front and tilted, so the
 * storefront never shows an empty tile.
 */
export function placeholderImages(name: string, styles: { brandColor: string; customBadgeColor: string }): string[] {
  const pack = { name, shape: 'can' as const, ink: styles.brandColor, surface: PACK_BACKDROP, accent: styles.customBadgeColor }
  return [packShot(pack), packShot({ ...pack, view: 'angle' })]
}

/** True for a drawn pack shot, so a form does not show it as a picture someone added. */
export function isPlaceholderImage(url: string): boolean {
  return url.startsWith('data:image/svg+xml')
}
