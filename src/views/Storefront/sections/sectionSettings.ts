import type { StoreTheme, TemplateType, ThemeBlock, ThemeSection } from '@/storefront/themeSections'

// Reading a theme section's settings on the storefront's sections drawing. Settings
// are flat strings, numbers and booleans; a value of the wrong type reads as missing.

type Settings = Record<string, string | number | boolean>

export function text(settings: Settings, key: string, fallback = ''): string {
  const value = settings[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

export function num(settings: Settings, key: string, fallback: number): number {
  const value = settings[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function flag(settings: Settings, key: string, fallback = false): boolean {
  const value = settings[key]
  return typeof value === 'boolean' ? value : fallback
}

export function blocksOf(section: ThemeSection, kind: string): ThemeBlock[] {
  return (section.blocks ?? []).filter((block) => block.kind === kind)
}

/** The template a storefront page is drawn from, by its route name. */
export function templateForRoute(name: unknown): TemplateType {
  if (name === 'StorefrontProduct') return 'product'
  if (name === 'StorefrontCollection' || name === 'StorefrontSearch') return 'collection'
  if (name === 'StorefrontCart') return 'cart'
  return 'home'
}

/**
 * The settings of the header or footer a page is drawn with: the section in the
 * page's own template, else the home page's (every template has both, but a
 * merchant may remove one). Empty when the theme has neither.
 */
export function chromeSettings(theme: StoreTheme | undefined, template: TemplateType, kind: 'header' | 'footer'): Settings {
  const find = (sections: ThemeSection[] | undefined) => sections?.find((section) => section.kind === kind)
  return (find(theme?.templates[template]) ?? find(theme?.templates.home))?.settings ?? {}
}
