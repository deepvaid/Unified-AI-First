import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createSection,
  defaultThemeStyles,
  getSectionDef,
  type StoreTheme,
  type TemplateType,
  type ThemeSection,
  type ThemeStyles,
} from './themeBuilderData'
import { useSalesChannelsStore } from './useSalesChannels'

function nowIso() {
  return new Date().toISOString()
}

/** JSON deep clone — theme data is plain strings/numbers/booleans throughout. */
function cloneTheme(theme: StoreTheme): StoreTheme {
  return JSON.parse(JSON.stringify(theme)) as StoreTheme
}

// ── Seeds ─────────────────────────────────────────────────────────────────────
// One theme per channel with webStore.storeBuilderEnabled (see useSalesChannels
// seeds): Atlas Outfitters ships Published with all four templates populated;
// Beta Sales Channel is a Draft starter.

function seedThemes(): StoreTheme[] {
  return [
    {
      id: 'theme-atlas',
      channelId: 'retest-sales-notification',
      name: 'Atlas Fall 26',
      status: 'Published',
      publishedAt: '2026-05-20T04:10:00Z',
      updatedAt: '2026-05-20T04:10:00Z',
      styles: defaultThemeStyles(),
      templates: {
        home: [
          createSection('announcement-bar', {}, 'atlas-home-announcement'),
          createSection('header', {}, 'atlas-home-header'),
          createSection('hero', {}, 'atlas-home-hero'),
          createSection('featured-products', {}, 'atlas-home-featured'),
          createSection('image-banner', {}, 'atlas-home-banner'),
          createSection('testimonials', {}, 'atlas-home-testimonials'),
          createSection('newsletter', { headline: 'Join the Atlas list' }, 'atlas-home-newsletter'),
          createSection('footer', {}, 'atlas-home-footer'),
        ],
        product: [
          createSection('header', {}, 'atlas-product-header'),
          createSection('product-detail', {}, 'atlas-product-detail'),
          createSection('featured-products', { title: 'You may also like' }, 'atlas-product-related'),
          createSection('footer', {}, 'atlas-product-footer'),
        ],
        collection: [
          createSection('header', {}, 'atlas-collection-header'),
          createSection('collection-grid', {}, 'atlas-collection-grid'),
          createSection('footer', {}, 'atlas-collection-footer'),
        ],
        cart: [
          createSection('header', {}, 'atlas-cart-header'),
          createSection('cart-summary', {}, 'atlas-cart-summary'),
          createSection('footer', {}, 'atlas-cart-footer'),
        ],
      },
    },
    {
      id: 'theme-beta',
      channelId: 'beta-sales-channel',
      name: 'Beta starter',
      status: 'Draft',
      updatedAt: '2026-05-25T03:10:00Z',
      styles: defaultThemeStyles(),
      templates: {
        home: [
          createSection('header', {}, 'beta-home-header'),
          createSection('hero', { headline: 'Welcome to Beta', subheadline: 'Your new storefront starts here.' }, 'beta-home-hero'),
          createSection('featured-products', {}, 'beta-home-featured'),
          createSection('newsletter', {}, 'beta-home-newsletter'),
          createSection('footer', {}, 'beta-home-footer'),
        ],
        product: [
          createSection('header', {}, 'beta-product-header'),
          createSection('product-detail', {}, 'beta-product-detail'),
          createSection('footer', {}, 'beta-product-footer'),
        ],
        collection: [
          createSection('header', {}, 'beta-collection-header'),
          createSection('collection-grid', {}, 'beta-collection-grid'),
          createSection('footer', {}, 'beta-collection-footer'),
        ],
        cart: [
          createSection('header', {}, 'beta-cart-header'),
          createSection('cart-summary', {}, 'beta-cart-summary'),
          createSection('footer', {}, 'beta-cart-footer'),
        ],
      },
    },
  ]
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStoreThemesStore = defineStore('storeThemes', () => {
  const themes = ref<StoreTheme[]>(seedThemes())

  // Last published (or seeded) snapshot per theme id — what discardDraft
  // restores. Non-reactive on purpose; only read inside actions.
  const baselines = new Map<string, StoreTheme>(
    themes.value.map((theme) => [theme.id, cloneTheme(theme)]),
  )

  function getTheme(themeId: string) {
    return themes.value.find((theme) => theme.id === themeId)
  }

  function themeForChannel(channelId: string) {
    return themes.value.find((theme) => theme.channelId === channelId)
  }

  function touch(theme: StoreTheme) {
    theme.updatedAt = nowIso()
  }

  function updateStyles(themeId: string, patch: Partial<ThemeStyles>) {
    const theme = getTheme(themeId)
    if (!theme) return
    theme.styles = { ...theme.styles, ...patch }
    touch(theme)
  }

  function updateSection(
    themeId: string,
    template: TemplateType,
    sectionId: string,
    patch: { label?: string; hidden?: boolean; settings?: Record<string, string | number | boolean> },
  ) {
    const theme = getTheme(themeId)
    const section = theme?.templates[template].find((entry) => entry.id === sectionId)
    if (!theme || !section) return
    if (patch.label !== undefined) section.label = patch.label
    if (patch.hidden !== undefined) section.hidden = patch.hidden
    if (patch.settings) section.settings = { ...section.settings, ...patch.settings }
    touch(theme)
  }

  function addSection(themeId: string, template: TemplateType, kind: string, index?: number): ThemeSection | undefined {
    const theme = getTheme(themeId)
    if (!theme) return undefined
    const def = getSectionDef(kind)
    if (!def) return undefined
    const sections = theme.templates[template]
    if (def.unique && sections.some((entry) => entry.kind === kind)) return undefined
    const section = createSection(kind)
    sections.splice(index ?? sections.length, 0, section)
    touch(theme)
    return section
  }

  function removeSection(themeId: string, template: TemplateType, sectionId: string) {
    const theme = getTheme(themeId)
    if (!theme) return
    const sections = theme.templates[template]
    const index = sections.findIndex((entry) => entry.id === sectionId)
    if (index === -1) return
    sections.splice(index, 1)
    touch(theme)
  }

  /** Move a section up (`offset` -1) or down (`offset` +1) within its template. */
  function moveSection(themeId: string, template: TemplateType, sectionId: string, offset: number) {
    const theme = getTheme(themeId)
    if (!theme) return
    const sections = theme.templates[template]
    const from = sections.findIndex((entry) => entry.id === sectionId)
    const to = from + offset
    if (from === -1 || to < 0 || to >= sections.length) return
    const [section] = sections.splice(from, 1)
    if (!section) return
    sections.splice(to, 0, section)
    touch(theme)
  }

  function publishTheme(themeId: string) {
    const theme = getTheme(themeId)
    if (!theme) return
    theme.status = 'Published'
    theme.publishedAt = nowIso()
    theme.updatedAt = theme.publishedAt
    baselines.set(theme.id, cloneTheme(theme))

    const salesChannels = useSalesChannelsStore()
    const channel = salesChannels.channels.find((entry) => entry.id === theme.channelId)
    if (channel?.webStore) {
      channel.webStore.published = true
      channel.updatedAt = theme.publishedAt
      channel.lastActivityAt = theme.publishedAt
    }
  }

  /** Revert draft edits to the last published (or seeded) snapshot. */
  function discardDraft(themeId: string) {
    const theme = getTheme(themeId)
    const baseline = baselines.get(themeId)
    if (!theme || !baseline) return
    const restored = cloneTheme(baseline)
    theme.name = restored.name
    theme.status = restored.status
    theme.publishedAt = restored.publishedAt
    theme.updatedAt = restored.updatedAt
    theme.styles = restored.styles
    theme.templates = restored.templates
  }

  return {
    themes,
    getTheme,
    themeForChannel,
    updateStyles,
    updateSection,
    addSection,
    removeSection,
    moveSection,
    publishTheme,
    discardDraft,
  }
})
