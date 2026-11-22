/**
 * Placeholder product artwork for the POS mock. Each SKU (or customer, or
 * location) hashes to one soft gradient, so the same thing always looks the
 * same in the grid, the cart and the sheets. Stand-ins for product photos, not
 * UI colour — like chart series ramps, they sit outside the token palette.
 */
const ART_GRADIENTS = [
  ['#fee2e2', '#fecaca'], // soft rose
  ['#fef3c7', '#fde68a'], // soft amber
  ['#dbeafe', '#bfdbfe'], // soft blue
  ['#dcfce7', '#bbf7d0'], // soft green
  ['#ede9fe', '#ddd6fe'], // soft violet
  ['#cffafe', '#a5f3fc'], // soft cyan
  ['#fce7f3', '#fbcfe8'], // soft pink
  ['#fed7aa', '#fdba74'], // soft orange
] as const

export function posArt(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i)
  const [from, to] = ART_GRADIENTS[Math.abs(hash) % ART_GRADIENTS.length]!
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`
}

export function posInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

/** The tones every POS status mark uses. Each pairs a *Ink with its *Soft fill. */
export type PosTone = 'neutral' | 'success' | 'warn' | 'danger' | 'accent' | 'ink'

/** What a stock count looks like on the register — word, tone and icon, never colour alone. */
export interface PosStock {
  label: string
  tone: PosTone
  icon: string
}

export const POS_LOW_STOCK = 8

/**
 * `full` labels every count (detail panels, location lists); `tile` stays quiet
 * until stock is short, so a healthy grid carries no badges at all.
 */
export function posStock(qty: number, form: 'full' | 'tile' = 'full'): PosStock | null {
  if (qty <= 0) return { label: 'Out of stock', tone: 'danger', icon: 'package-x' }
  if (qty < POS_LOW_STOCK) {
    return { label: form === 'tile' ? `Low · ${qty} left` : `Low stock · ${qty}`, tone: 'warn', icon: 'triangle-alert' }
  }
  return form === 'full' ? { label: 'In stock', tone: 'success', icon: 'package-check' } : null
}
