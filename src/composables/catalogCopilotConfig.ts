import type { CatalogFieldKey } from './useCatalogGenerator'

// Da Vinci Catalog Co-Pilot — domain types, billing constants and copy shared by
// the store, the copilot cards and the Products views. Pure (type-only imports),
// so cards and stories can use it without pulling in the router or Pinia.

/** create = new product from a brief · enrich = suggestions for a saved product · field = one field. */
export type CatalogMode = 'create' | 'enrich' | 'field'
export type CatalogField = 'description' | 'seo' | 'categories'
/** Where the drawer was opened from. CTA events use the first four (PRD `surface`). */
export type CatalogSurface = 'index' | 'create' | 'edit' | 'field' | 'chat'
export type CatalogCtaAction = 'create' | 'enrich' | 'description' | 'seo' | 'categories'
export type CatalogGateReason = 'no_commerce' | 'no_credits' | 'trial_exhausted' | 'kill_switch' | 'role'
/** What a gate card can offer: Plans, Billing (credit packs), the sales dialog, or the manual path. */
export type CatalogGateAction = 'upgrade' | 'buy-credits' | 'talk-to-sales' | 'add-manually'
export type CatalogWalletKind = 'trial' | 'pack' | 'none'
export type CatalogPackType = 'trial' | 'starter' | 'growth' | 'scale'

export interface CatalogWallet {
  kind: CatalogWalletKind
  /** Credits in the wallet (trial allowance or pack size). */
  limit: number
  used: number
  /** Trial wallet whose trial has ended — the allowance expired with it. */
  expired: boolean
}

/** A route to land on when a draft is applied. */
export interface CatalogTarget {
  name: string
  params: Record<string, string>
}

/** One completed AI Action costs 10 credits (PRD: same unit as other beta Co-Pilot actions). */
export const CREDITS_PER_ACTION = 10
/** Free Trial allowance: 50 credits = 5 AI Actions, catalog only. */
export const TRIAL_CREDITS = 50
/** The Starter Co-Pilot pack — 500 credits. */
export const STARTER_PACK_CREDITS = 500

export function remainingCredits(wallet: CatalogWallet): number {
  return Math.max(0, wallet.limit - wallet.used)
}

export function remainingActions(wallet: CatalogWallet): number {
  return Math.floor(remainingCredits(wallet) / CREDITS_PER_ACTION)
}

/** "4 of 5 trial actions left" · "490 credits left" · "No credits". */
export function walletLabel(wallet: CatalogWallet): string {
  if (wallet.kind === 'trial') {
    if (wallet.expired) return 'Trial ended'
    return `${remainingActions(wallet)} of ${Math.floor(wallet.limit / CREDITS_PER_ACTION)} trial actions left`
  }
  if (wallet.kind === 'pack') return `${remainingCredits(wallet).toLocaleString('en-US')} credits left`
  return 'No credits'
}

export const CATALOG_FIELD_LABELS: Record<CatalogFieldKey, string> = {
  title: 'Title',
  subtitle: 'Subtitle',
  sku: 'SKU',
  handle: 'URL handle',
  description: 'Description',
  brand: 'Brand',
  tag: 'Tag',
  categories: 'Categories',
  collection: 'Collection',
  options: 'Options',
  price: 'Price',
  seoTitle: 'SEO title',
  seoMetaDescription: 'Meta description',
}

/** What a field-level request works on — the context bar and the card heading. */
export const CATALOG_FIELD_TITLES: Record<CatalogField, string> = {
  description: 'Description',
  seo: 'SEO listing',
  categories: 'Categories',
}

export interface CatalogPreset {
  id: string
  label: string
  icon: string
  prompt: string
  /** What this starting point drafts — shown under the label. */
  hint: string
}

/** Starting points instead of a blank chat (PRD GTM: "presets instead of a blank chat"). */
export const CATALOG_PRESETS: Record<'create' | 'enrich' | CatalogField, CatalogPreset[]> = {
  create: [
    { id: 'trail-runner', label: 'Men’s trail running shoe', icon: 'footprints', hint: 'Sizes and SEO, no price', prompt: 'Create a men’s trail running shoe, Trail Runner Pro, with sizes and SEO' },
    { id: 'ceramic-mug', label: 'Ceramic coffee mug', icon: 'coffee', hint: '2 colours, $24', prompt: 'Add a ceramic coffee mug called Morning Ritual in white and sage, priced at $24' },
    { id: 'cotton-tee', label: 'Organic cotton tee', icon: 'shirt', hint: 'Sizes S–XL, 3 colours', prompt: 'New organic cotton tee named Everyday Crew, sizes S to XL, colours black, white and navy' },
    { id: 'soy-candle', label: 'Soy wax candle', icon: 'flame', hint: 'Brand and price', prompt: 'Draft a soy wax candle called Cedar & Smoke by Local Artisan, $32' },
  ],
  enrich: [
    { id: 'enrich-all', label: 'Improve the whole listing', icon: 'sparkles', hint: 'Description, categories, SEO and tags', prompt: 'Improve the description, categories, SEO and tags' },
    { id: 'enrich-description', label: 'Rewrite the description', icon: 'align-left', hint: 'Description only', prompt: 'Rewrite the description' },
    { id: 'enrich-seo', label: 'Write the SEO listing', icon: 'search', hint: 'Title and meta description', prompt: 'Write the SEO title and meta description' },
    { id: 'enrich-categories', label: 'Add categories', icon: 'folder-tree', hint: 'Keeps the ones it has', prompt: 'Suggest categories for this product' },
  ],
  description: [
    { id: 'description-default', label: 'Write a description', icon: 'align-left', hint: 'From the title and options', prompt: 'Write a product description' },
    { id: 'description-playful', label: 'Make it playful', icon: 'smile', hint: 'A lighter tone', prompt: 'Write a playful product description' },
  ],
  seo: [
    { id: 'seo-default', label: 'Write the SEO listing', icon: 'search', hint: 'Title and meta description', prompt: 'Write the SEO title and meta description' },
    { id: 'seo-short', label: 'Keep it short', icon: 'minimize-2', hint: 'Meta without the feature line', prompt: 'Write a short SEO title and meta description' },
  ],
  categories: [
    { id: 'categories-default', label: 'Suggest categories', icon: 'folder-tree', hint: 'From the title and description', prompt: 'Suggest categories for this product' },
  ],
}

export function isCatalogPreset(text: string): boolean {
  return Object.values(CATALOG_PRESETS).some((group) => group.some((p) => p.prompt === text))
}

/** Demo scenarios — `?catalog=<key>` or the AppBar user menu. `auto` reads the real plan and role. */
export type CatalogScenario =
  | 'auto' | 'trial' | 'trial_exhausted' | 'no_pack' | 'pack_exhausted' | 'kill_switch' | 'flag_off' | 'view_only'

export const CATALOG_SCENARIOS: { key: CatalogScenario; label: string }[] = [
  { key: 'auto', label: 'Live — from plan and role' },
  { key: 'trial', label: 'Free trial — 5 actions' },
  { key: 'trial_exhausted', label: 'Trial allowance used up' },
  { key: 'no_pack', label: 'Paid — no Co-Pilot credits' },
  { key: 'pack_exhausted', label: 'Credit pack used up' },
  { key: 'kill_switch', label: 'Kill switch on' },
  { key: 'flag_off', label: 'Feature flag off' },
  { key: 'view_only', label: 'View-only user' },
]

export function isCatalogScenario(value: unknown): value is CatalogScenario {
  return typeof value === 'string' && CATALOG_SCENARIOS.some((s) => s.key === value)
}
