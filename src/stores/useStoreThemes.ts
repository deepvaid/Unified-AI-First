import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createBlock,
  createSection,
  defaultThemeStyles,
  getBlockDef,
  getSectionDef,
  type StoreTheme,
  type TemplateType,
  type ThemeBlock,
  type ThemeSection,
  type ThemeStyles,
} from './themeBuilderData'
import { SEEDED_DEMO_CHANNELS, demoChannelRecord, demoSnapshotOf, replaceStoreRows, useSalesChannelsStore } from './useSalesChannels'
import { canApplyTheme } from '@/storefront/demoStores'
import type { StoreSnapshot } from '@/storefront/demoStores'
import type { InstallChannel } from '@/storefront/demoStores/install'

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
// Beta Sales Channel is a Draft starter. A demo store (Vitaheal) gets the theme of
// the blueprint it runs (src/storefront/demoStores/), after these.

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
          {
            ...createSection('hero', {}, 'atlas-home-hero'),
            blocks: [
              createBlock('heading', { text: 'Fall 26 Drop 02' }, 'atlas-hero-heading'),
              createBlock('paragraph', {}, 'atlas-hero-paragraph'),
            ],
          },
          createSection('featured-products', {}, 'atlas-home-featured'),
          {
            ...createSection('image-banner', {}, 'atlas-home-banner'),
            blocks: [createBlock('heading', { text: 'The Winter Edit' }, 'atlas-banner-heading')],
          },
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
    // Neelam-Store (UAT store #9, docs/rebuild/neelam-store/CRAWL-SUMMARY.md): Aurora is the current theme and
    // its home page is as crawled; Lumos is installed but its content hasn't been seen. The other Aurora
    // templates are empty until the builder can be crawled.
    {
      id: 'theme-neelam-aurora',
      channelId: 'neelam-store',
      name: 'Aurora',
      status: 'Published',
      publishedAt: '2026-08-26T04:18:00',
      updatedAt: '2026-08-26T04:18:00',
      createdBy: 'Maropost',
      availableVersion: '1.7.9',
      styles: AURORA_STYLES,
      templates: {
        home: [
          createSection('header', { menuStyle: 'Centered' }, 'neelam-home-header'),
          {
            ...createSection('image-banner', { headline: 'Keep the world adventurous forever', height: 'Medium' }, 'neelam-home-banner'),
            blocks: [createBlock('button', { label: 'See More', link: '' }, 'neelam-banner-button')],
          },
          {
            ...createSection('collection-grid', { title: 'Featured Collections', columns: 3 }, 'neelam-home-collections'),
            blocks: [
              createBlock('collection', { label: '4WD Camping & Adventure', link: '/collections/all' }, 'neelam-collection-camping'),
              createBlock('collection', { label: 'Auto Parts & Service', link: '/collections/all' }, 'neelam-collection-parts'),
              createBlock('collection', { label: 'Outdoor Equipment', link: '/collections/all' }, 'neelam-collection-outdoor'),
              createBlock('collection', { label: 'Power Tools & Accessories', link: '/collections/all' }, 'neelam-collection-tools'),
            ],
          },
          createSection('footer', { showSocial: false, columns: 3 }, 'neelam-home-footer'),
        ],
        product: [],
        collection: [],
        cart: [],
      },
    },
    {
      id: 'theme-neelam-lumos',
      channelId: 'neelam-store',
      name: 'Lumos',
      status: 'Draft',
      updatedAt: '2026-09-15T01:23:00',
      createdBy: 'Maropost',
      availableVersion: '1.4.0',
      styles: defaultThemeStyles(),
      templates: { home: [], product: [], collection: [], cart: [] },
    },
  ]
}

/** Aurora's Default colour scheme, system font stack and 6px buttons, as crawled from Neelam-Store. */
const AURORA_STYLES: ThemeStyles = {
  brandColor: '#373842',
  accentColor: '#121011',
  background: '#FFFFFF',
  textColor: '#121011',
  headingFont: 'system-ui',
  bodyFont: 'system-ui',
  cornerRadius: 6,
  buttonStyle: 'solid',
  saleBadgeColor: '#121011',
  customBadgeColor: '#373842',
  soldOutBadgeColor: '#121011',
}

/** A demo store's theme, as its snapshot has it: published on the store. */
function snapshotTheme(channelId: string, snapshot: StoreSnapshot): StoreTheme {
  const { id, name, publishedAt, styles, templates } = snapshot.theme
  return { id, channelId, name, status: 'Published', publishedAt, updatedAt: publishedAt, styles, templates }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStoreThemesStore = defineStore('storeThemes', () => {
  const themes = ref<StoreTheme[]>(seedThemes())

  /** The id of the theme each demo store was seeded with: what reseedDemo replaces. */
  const seededThemeIds = new Map<string, string>()

  // Last published (or seeded) snapshot per theme id — what discardDraft
  // restores. Non-reactive on purpose; only read inside actions.
  const baselines = new Map<string, StoreTheme>(
    themes.value.map((theme) => [theme.id, cloneTheme(theme)]),
  )

  /** The stores whose theme is seeded (attachStore): each only once. */
  const attached = new Set<string>()

  /**
   * Puts the theme of the blueprint a store runs now on it, published, after the
   * other themes (none for a store that started blank). Themes are not kept in the browser.
   */
  function attachStore(channel: InstallChannel): void {
    if (attached.has(channel.id)) return
    attached.add(channel.id)
    const snapshot = demoSnapshotOf(channel)
    if (!snapshot) return
    const theme = snapshotTheme(channel.id, snapshot)
    themes.value = replaceStoreRows(themes.value, (t) => t.channelId === channel.id && t.id === theme.id, [theme])
    baselines.set(theme.id, cloneTheme(theme))
    seededThemeIds.set(channel.id, theme.id)
  }
  // The demo stores' themes, after the others.
  for (const channel of SEEDED_DEMO_CHANNELS) attachStore(channel)

  /** Takes a theme off the storefront. Its baseline goes too, so discarding its edits later never publishes it again. */
  function demote(theme: StoreTheme) {
    theme.status = 'Draft'
    const baseline = baselines.get(theme.id)
    if (baseline) baseline.status = 'Draft'
  }

  function getTheme(themeId: string) {
    return themes.value.find((theme) => theme.id === themeId)
  }

  /** Every theme installed on the channel. */
  function themesForChannel(channelId: string) {
    return themes.value.filter((theme) => theme.channelId === channelId)
  }

  /** The channel's current theme: the published one, else the first installed. */
  function themeForChannel(channelId: string) {
    const installed = themesForChannel(channelId)
    return installed.find((theme) => theme.status === 'Published') ?? installed[0]
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

  // New sections belong above a trailing footer, never after it. Returns the
  // index of the first footer (the natural "end of body"), else the list end.
  function contentInsertIndex(sections: ThemeSection[]): number {
    const footerIdx = sections.findIndex((entry) => entry.kind === 'footer')
    return footerIdx === -1 ? sections.length : footerIdx
  }

  function addSection(
    themeId: string,
    template: TemplateType,
    kind: string,
    index?: number,
    variantId?: string,
  ): ThemeSection | undefined {
    const theme = getTheme(themeId)
    if (!theme) return undefined
    const def = getSectionDef(kind)
    if (!def) return undefined
    const sections = theme.templates[template]
    if (def.unique && sections.some((entry) => entry.kind === kind)) return undefined
    // When a variant is chosen, seed the section with that variant's preset.
    const variant = variantId ? def.variants?.find((entry) => entry.id === variantId) : undefined
    const section = createSection(kind, variant ? { ...variant.preset } : {})
    sections.splice(index ?? contentInsertIndex(sections), 0, section)
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

  /**
   * Append several sections in one pass (Da Vinci generator). Each kind is created
   * with its matching overrides; `unique` kinds already present are skipped. Only
   * the sections actually created are returned, and `touch()` runs once.
   */
  function addSections(
    themeId: string,
    template: TemplateType,
    kinds: string[],
    overridesList: Record<string, string | number | boolean>[] = [],
    index?: number,
  ): ThemeSection[] {
    const theme = getTheme(themeId)
    if (!theme) return []
    const sections = theme.templates[template]
    const created: ThemeSection[] = []
    // Insert the batch, in order, at `index` — else above a trailing footer.
    let at = index ?? contentInsertIndex(sections)
    kinds.forEach((kind, i) => {
      const def = getSectionDef(kind)
      if (!def) return
      if (def.unique && sections.some((entry) => entry.kind === kind)) return
      const section = createSection(kind, overridesList[i] ?? {})
      sections.splice(at, 0, section)
      at += 1
      created.push(section)
    })
    if (created.length) touch(theme)
    return created
  }

  /** Remove all matching section ids from a template in one pass (undo a batch). */
  function removeSections(themeId: string, template: TemplateType, ids: string[]) {
    const theme = getTheme(themeId)
    if (!theme) return
    const idSet = new Set(ids)
    const sections = theme.templates[template]
    const before = sections.length
    theme.templates[template] = sections.filter((entry) => !idSet.has(entry.id))
    if (theme.templates[template].length !== before) touch(theme)
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

  // ── Block CRUD ────────────────────────────────────────────────────────────
  // Blocks live on a section's optional `blocks` array (block-accepting kinds).
  // Each mutation locates the section, guards, then touch()es the theme.

  function findSection(themeId: string, template: TemplateType, sectionId: string) {
    const theme = getTheme(themeId)
    const section = theme?.templates[template].find((entry) => entry.id === sectionId)
    return { theme, section }
  }

  function addBlock(
    themeId: string,
    template: TemplateType,
    sectionId: string,
    kind: string,
  ): ThemeBlock | undefined {
    const { theme, section } = findSection(themeId, template, sectionId)
    if (!theme || !section) return undefined
    // Defense in depth: only block-accepting section kinds hold blocks (the UI
    // already hides the affordance elsewhere, but guard the store too).
    if (!getSectionDef(section.kind)?.acceptsBlocks) return undefined
    if (!getBlockDef(kind)) return undefined
    const block = createBlock(kind)
    if (!section.blocks) section.blocks = []
    section.blocks.push(block)
    touch(theme)
    return block
  }

  function removeBlock(themeId: string, template: TemplateType, sectionId: string, blockId: string) {
    const { theme, section } = findSection(themeId, template, sectionId)
    if (!theme || !section?.blocks) return
    const index = section.blocks.findIndex((entry) => entry.id === blockId)
    if (index === -1) return
    section.blocks.splice(index, 1)
    touch(theme)
  }

  /** Move a block up (`offset` -1) or down (`offset` +1) within its section. */
  function moveBlock(
    themeId: string,
    template: TemplateType,
    sectionId: string,
    blockId: string,
    offset: number,
  ) {
    const { theme, section } = findSection(themeId, template, sectionId)
    if (!theme || !section?.blocks) return
    const from = section.blocks.findIndex((entry) => entry.id === blockId)
    const to = from + offset
    if (from === -1 || to < 0 || to >= section.blocks.length) return
    const [block] = section.blocks.splice(from, 1)
    if (!block) return
    section.blocks.splice(to, 0, block)
    touch(theme)
  }

  function updateBlock(
    themeId: string,
    template: TemplateType,
    sectionId: string,
    blockId: string,
    patch: { settings?: Record<string, string | number | boolean> },
  ) {
    const { theme, section } = findSection(themeId, template, sectionId)
    const block = section?.blocks?.find((entry) => entry.id === blockId)
    if (!theme || !block) return
    if (patch.settings) block.settings = { ...block.settings, ...patch.settings }
    touch(theme)
  }

  function publishTheme(themeId: string) {
    const theme = getTheme(themeId)
    if (!theme) return
    // A store has one current theme, so publishing one takes the previous one off the storefront.
    for (const other of themesForChannel(theme.channelId)) if (other.id !== theme.id && other.status === 'Published') demote(other)
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

  /**
   * Brings a store that can take a theme in as the app starts (a store made from a
   * theme; src/stores/useDemoStores.ts): it gets the theme it runs. Does nothing a
   * second time, or for a store that cannot take a theme.
   */
  function attachDemo(channelId: string) {
    const channel = demoChannelRecord(channelId)
    if (channel && canApplyTheme(channel)) attachStore(channel)
  }

  /**
   * Puts the theme of the blueprint the store runs now on it, published, in place of
   * the theme it was seeded with (contract: reseedDemo). The merchant's other themes
   * stay, as drafts. A store that started blank is left with only its own themes.
   */
  function reseedDemo(channelId: string) {
    const channel = demoChannelRecord(channelId)
    if (!canApplyTheme(channel)) return
    attached.add(channelId)
    const snapshot = demoSnapshotOf(channel)
    const next = snapshot ? snapshotTheme(channelId, snapshot) : undefined
    const previousId = seededThemeIds.get(channelId)
    const isSeeded = (theme: StoreTheme) => theme.channelId === channelId && (theme.id === previousId || theme.id === next?.id)

    for (const theme of themesForChannel(channelId)) {
      if (isSeeded(theme)) baselines.delete(theme.id)
      else if (next && theme.status === 'Published') demote(theme)
    }
    themes.value = replaceStoreRows(themes.value, isSeeded, next ? [next] : [])
    if (next) {
      baselines.set(next.id, cloneTheme(next))
      seededThemeIds.set(channelId, next.id)
    } else {
      seededThemeIds.delete(channelId)
    }
  }

  return {
    themes,
    getTheme,
    themesForChannel,
    themeForChannel,
    updateStyles,
    updateSection,
    addSection,
    removeSection,
    addSections,
    removeSections,
    moveSection,
    addBlock,
    removeBlock,
    moveBlock,
    updateBlock,
    publishTheme,
    discardDraft,
    attachDemo,
    reseedDemo,
  }
})
