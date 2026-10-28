/**
 * Turns an uploaded logo into what a thermal receipt printer prints: no wider
 * than the printable area (576 dots on 80 mm paper, 384 on 58 mm), one bit per
 * pixel, Floyd–Steinberg dithered so greys survive as dot patterns.
 *
 * Browser-only (canvas). The result is a small PNG data URL saved on the
 * template, so the designer previews exactly what the paper will show.
 */
import type { PaperWidth } from './receiptModel'

export const LOGO_MAX_BYTES = 1024 * 1024
const LOGO_TYPES = ['image/png', 'image/jpeg']
/** Printable width in dots at 203 dpi (Epson TM-m30III, Star mC-Print3). */
export const LOGO_MAX_DOTS: Record<PaperWidth, number> = { 80: 576, 58: 384 }
/** Taller than this and the logo pushes the sale off the first screen of paper. */
const LOGO_MAX_HEIGHT = 240

export type LogoResult =
  | { ok: true; dataUrl: string; width: number; height: number }
  | { ok: false; reason: string }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** In place: RGBA → black or white, error spread to the neighbours not yet visited. */
function ditherToOneBit(image: ImageData) {
  const { width, height, data } = image
  const grey = new Float32Array(width * height)
  for (let i = 0; i < grey.length; i++) {
    const a = data[i * 4 + 3]! / 255
    // Transparent areas print as paper
    const lum = 0.299 * data[i * 4]! + 0.587 * data[i * 4 + 1]! + 0.114 * data[i * 4 + 2]!
    grey[i] = lum * a + 255 * (1 - a)
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const old = grey[i]!
      const next = old < 128 ? 0 : 255
      const err = old - next
      grey[i] = next
      if (x + 1 < width) grey[i + 1]! += (err * 7) / 16
      if (y + 1 < height) {
        if (x > 0) grey[i + width - 1]! += (err * 3) / 16
        grey[i + width]! += (err * 5) / 16
        if (x + 1 < width) grey[i + width + 1]! += err / 16
      }
    }
  }
  for (let i = 0; i < grey.length; i++) {
    const v = grey[i]! < 128 ? 0 : 255
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v
    data[i * 4 + 3] = 255
  }
}

export async function prepareLogo(file: File, paper: PaperWidth): Promise<LogoResult> {
  if (!LOGO_TYPES.includes(file.type)) return { ok: false, reason: 'Use a PNG or JPG image' }
  if (file.size > LOGO_MAX_BYTES) return { ok: false, reason: 'Keep the image under 1 MB' }
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, LOGO_MAX_DOTS[paper] / img.naturalWidth, LOGO_MAX_HEIGHT / img.naturalHeight)
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return { ok: false, reason: "This browser can't prepare images" }
    ctx.drawImage(img, 0, 0, width, height)
    const pixels = ctx.getImageData(0, 0, width, height)
    ditherToOneBit(pixels)
    ctx.putImageData(pixels, 0, 0)
    return { ok: true, dataUrl: canvas.toDataURL('image/png'), width, height }
  } catch {
    return { ok: false, reason: "That image couldn't be read — try another PNG or JPG" }
  } finally {
    URL.revokeObjectURL(url)
  }
}
