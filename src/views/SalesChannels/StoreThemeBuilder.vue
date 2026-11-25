<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpBuilderShell from '@/components/MpBuilderShell.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import StorefrontPreview from '@/components/saleschannels/StorefrontPreview.vue'
import { useStorefrontPreviewProps } from '@/components/saleschannels/storefrontPreview'
import AddSectionDialog from '@/components/saleschannels/AddSectionDialog.vue'
import ThemeDaVinciPanel, { type ThemeChatMessage, type ThemeGenerating } from '@/components/saleschannels/ThemeDaVinciPanel.vue'
import { GENERATION_STAGES, GENERATION_STAGE_MS, generateSections } from '@/composables/useThemeGenerator'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import { useCopilotStore } from '@/stores/useCopilot'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useCommerceStore } from '@/stores/useCommerce'
import { useSizeChartsStore } from '@/stores/useSizeCharts'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { collectionsOf, storefrontProducts } from '@/views/Storefront/storefrontCatalog'
import {
  blockHasRoom,
  blocksFor,
  fieldShown,
  fieldsFor,
  getBlockDef,
  getSectionDef,
  sectionsFor,
  selectValue,
  storeFacts,
  storefrontThemeVars,
  themeFonts,
  TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABELS,
  type TemplateType,
  type ThemeBlock,
  type ThemeSection,
  type ThemeSectionDef,
  type ThemeSectionField,
  type ThemeStyles,
} from '@/stores/themeBuilderData'
import {
  mp_color_blue_500,
  mp_color_light_aiAccent_primary,
  mp_color_light_error,
  mp_color_light_primary,
  mp_color_light_success,
  mp_color_light_textPrimary,
  mp_color_light_warning,
  mp_color_neutral_0,
} from '@/design-tokens/generated/tokens'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)
const channelId = computed(() => route.params.channelId as string)

const salesChannelsStore = useSalesChannelsStore()
const themesStore = useStoreThemesStore()
const toast = useToast()

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
// The theme the Themes page opened (?theme=), else the store's current theme.
const theme = computed(() => {
  const requested = typeof route.query.theme === 'string' ? themesStore.getTheme(route.query.theme) : undefined
  return requested?.channelId === channelId.value ? requested : themesStore.themeForChannel(channelId.value)
})
/**
 * The store as the canvas draws it: its header, card, own products and the purchase
 * options of a product on a plan (the store page and the Themes page pass the same).
 */
const previewProps = useStorefrontPreviewProps(channel, theme)

/**
 * How the storefront draws this theme. A theme on the sections drawing (Northfold,
 * Torqline) is offered the kinds, blocks and settings only that drawing draws (an
 * icon row, collapsible rows, a header's colour scheme); a classic theme is offered
 * exactly what it always was (src/storefront/themeSections.ts).
 */
const drawing = computed(() => theme.value?.styles.drawing)
/** What the store sells: a parts store is offered the vehicle finder and fit banner, a store with sizes the size guide. */
const sizeChartsStore = useSizeChartsStore()
const subscriptionsStore = useSubscriptionsStore()
const facts = computed(() => {
  const products = storefrontProducts(useCommerceStore().products, channelId.value)
  return {
    ...storeFacts(products, sizeChartsStore.chartsForChannel(channelId.value)),
    // A store with subscription plans is offered the product page's purchase options block.
    subscriptions: subscriptionsStore.plans.some((plan) => plan.channelId === channelId.value),
    // A store whose products carry a table of facts is offered a row that shows it.
    facts: products.some((product) => !!product.detail?.specs?.length),
  }
})
/** The kinds the open template can take (a logo strip is the home page's). */
const addableSections = computed(() => sectionsFor(drawing.value, facts.value, activeTemplate.value))

const backRoute = computed(() =>
  channel.value
    ? { name: 'StoreThemes', params: { accountId: accountId.value, channelId: channelId.value } }
    : { name: 'SalesChannels', params: { accountId: accountId.value } },
)

// ── Active template + sections ────────────────────────────────────────────────
const activeTemplate = ref<TemplateType>('home')
const templateTypeItems = TEMPLATE_TYPES.map((t) => ({ title: TEMPLATE_TYPE_LABELS[t], value: t }))
const activeSections = computed<ThemeSection[]>(() => theme.value?.templates[activeTemplate.value] ?? [])

// Discriminated selection: a section, or a block within a section. `null` = nothing.
type Selection =
  | { type: 'section'; id: string }
  | { type: 'block'; sectionId: string; id: string }
  | null
const selected = ref<Selection>(null)

// The section the tree/canvas highlights: the selected section, or a selected
// block's parent section.
const selectedSectionId = computed(() =>
  selected.value?.type === 'section'
    ? selected.value.id
    : selected.value?.type === 'block'
      ? selected.value.sectionId
      : null,
)

function selectSection(id: string) {
  selected.value = { type: 'section', id }
  // Selecting/editing a generated section clears its transient "New" cue.
  newSectionIds.value.delete(id)
}

function selectBlock(sectionId: string, blockId: string) {
  selected.value = { type: 'block', sectionId, id: blockId }
  newBlockIds.value.delete(blockId)
}

// Switching templates drops the selection — it belongs to the old template —
// and clears any pending "New" cues (they're a transient, per-template review aid).
watch(activeTemplate, () => {
  selected.value = null
  generationToken += 1
  generating.value = null
  newSectionIds.value.clear()
  newBlockIds.value.clear()
})

// ── Device frames ─────────────────────────────────────────────────────────────
type Device = 'desktop' | 'tablet' | 'mobile'
const device = ref<Device>('desktop')
const deviceOptions: { value: Device; icon: string; label: string }[] = [
  { value: 'desktop', icon: 'monitor', label: 'Desktop preview' },
  { value: 'tablet', icon: 'tablet', label: 'Tablet preview' },
  { value: 'mobile', icon: 'smartphone', label: 'Mobile preview' },
]

// Frame widths clamp to the stage (PosPreview pattern); CSS transitions the change.
const DEVICE_WIDTHS: Record<Device, number> = { desktop: 1080, tablet: 820, mobile: 420 }
const stageStyle = computed(() => ({ width: `min(${DEVICE_WIDTHS[device.value]}px, 100%)` }))

// Draft has unpublished changes: never published, or edited since last publish.
const isDirty = computed(() => {
  const t = theme.value
  if (!t) return false
  return !t.publishedAt || t.updatedAt !== t.publishedAt
})

const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave theme builder?',
  message: 'You have unpublished draft changes. Leaving now will keep them as a draft, but you may want to publish or discard first.',
  confirmLabel: 'Leave anyway',
})

function sectionIcon(kind: string) {
  return getSectionDef(kind)?.icon ?? 'square'
}

// ── Section list actions ──────────────────────────────────────────────────────
function toggleHidden(section: ThemeSection) {
  if (!theme.value) return
  themesStore.updateSection(theme.value.id, activeTemplate.value, section.id, { hidden: !section.hidden })
}

function moveSection(section: ThemeSection, offset: number) {
  if (!theme.value) return
  themesStore.moveSection(theme.value.id, activeTemplate.value, section.id, offset)
}

const removeDialog = ref(false)
const removeTargetId = ref<string | null>(null)
const removeTarget = computed(() => activeSections.value.find((s) => s.id === removeTargetId.value))

function askRemove(section: ThemeSection) {
  removeTargetId.value = section.id
  removeDialog.value = true
}

function confirmRemove() {
  if (theme.value && removeTargetId.value) {
    // Drop the selection if it was on this section, or on one of its blocks.
    if (selectedSectionId.value === removeTargetId.value) selected.value = null
    newSectionIds.value.delete(removeTargetId.value)
    themesStore.removeSection(theme.value.id, activeTemplate.value, removeTargetId.value)
  }
  removeTargetId.value = null
}

// ── Blocks within sections (layer tree) ───────────────────────────────────────
// A section shows a block sub-tree when its kind accepts blocks, or it already
// has some. Expand state lives here (default collapsed).
function sectionAcceptsBlocks(section: ThemeSection): boolean {
  return blocksFor(section.kind, drawing.value, facts.value).length > 0 || Boolean(section.blocks?.length)
}

/** The blocks Add block offers a section now: what its kind takes on this store, less a one-only block it already has. */
function addableBlocks(section: ThemeSection) {
  return blocksFor(section.kind, drawing.value, facts.value).filter((def) => !def.unique || !section.blocks?.some((block) => block.kind === def.kind))
}

const expandedSectionIds = ref<Set<string>>(new Set())
function toggleExpanded(sectionId: string) {
  const next = new Set(expandedSectionIds.value)
  if (next.has(sectionId)) next.delete(sectionId)
  else next.add(sectionId)
  expandedSectionIds.value = next
}

function blockIcon(kind: string) {
  return getBlockDef(kind)?.icon ?? 'square'
}

/** Tree label for a block: its def title, or a snippet of its primary setting (a feature's or a row's title first, a logo's brand). */
function blockLabel(block: ThemeBlock): string {
  const def = getBlockDef(block.kind)
  const snippet = String(block.settings.title || block.settings.text || block.settings.body || block.settings.label || block.settings.name || '').trim()
  if (snippet) return snippet.length > 28 ? `${snippet.slice(0, 28)}…` : snippet
  return def?.title ?? block.kind
}

function moveBlock(sectionId: string, blockId: string, offset: number) {
  if (!theme.value) return
  themesStore.moveBlock(theme.value.id, activeTemplate.value, sectionId, blockId, offset)
}

/** Add a block, keep the section expanded, then select + flag it "New". */
function addBlockToSection(sectionId: string, kind: string) {
  if (!theme.value) return
  const block = themesStore.addBlock(theme.value.id, activeTemplate.value, sectionId, kind)
  if (!block) return
  const next = new Set(expandedSectionIds.value)
  next.add(sectionId)
  expandedSectionIds.value = next
  newBlockIds.value.add(block.id)
  selected.value = { type: 'block', sectionId, id: block.id }
}

// Block removal confirm (mirrors the section confirm).
const blockRemoveDialog = ref(false)
const blockRemoveTarget = ref<{ sectionId: string; blockId: string } | null>(null)
const blockRemoveLabel = computed(() => {
  const t = blockRemoveTarget.value
  if (!t) return 'This block'
  const section = activeSections.value.find((s) => s.id === t.sectionId)
  const block = section?.blocks?.find((b) => b.id === t.blockId)
  return block ? blockLabel(block) : 'This block'
})

function askRemoveBlock(sectionId: string, blockId: string) {
  blockRemoveTarget.value = { sectionId, blockId }
  blockRemoveDialog.value = true
}

function confirmRemoveBlock() {
  const t = blockRemoveTarget.value
  if (theme.value && t) {
    if (selected.value?.type === 'block' && selected.value.id === t.blockId) selected.value = null
    newBlockIds.value.delete(t.blockId)
    themesStore.removeBlock(theme.value.id, activeTemplate.value, t.sectionId, t.blockId)
  }
  blockRemoveTarget.value = null
}

// ── Add-section picker (two-pane dialog) ──────────────────────────────────────
const addDialog = ref(false)

function isKindDisabled(def: ThemeSectionDef) {
  return Boolean(def.unique) && activeSections.value.some((s) => s.kind === def.kind)
}

/** No-variant kind: add immediately (dialog closes on the child's click). */
function addSection(def: ThemeSectionDef) {
  if (!theme.value) return
  const section = themesStore.addSection(theme.value.id, activeTemplate.value, def.kind)
  if (section) selectSection(section.id)
  addDialog.value = false
}

/** Variant-bearing kind: add with the chosen variant's preset merged in. */
function addSectionVariant(def: ThemeSectionDef, variantId: string) {
  if (!theme.value) return
  const section = themesStore.addSection(theme.value.id, activeTemplate.value, def.kind, undefined, variantId)
  if (section) selectSection(section.id)
  addDialog.value = false
}

// ── Settings panel: section OR block (schema-driven, live edits) ─────────────
// selectedSection = the selected section, or the parent of a selected block.
const selectedSection = computed(() =>
  activeSections.value.find((s) => s.id === selectedSectionId.value),
)
const selectedSectionDef = computed(() =>
  selectedSection.value ? getSectionDef(selectedSection.value.kind) : undefined,
)
const selectedBlock = computed(() =>
  selected.value?.type === 'block'
    ? selectedSection.value?.blocks?.find((b) => b.id === selected.value!.id)
    : undefined,
)
const selectedBlockDef = computed(() =>
  selectedBlock.value ? getBlockDef(selectedBlock.value.kind) : undefined,
)

function closePanel() {
  selected.value = null
}

function renameSection(label: string) {
  if (!theme.value || selected.value?.type !== 'section' || !label.trim()) return
  themesStore.updateSection(theme.value.id, activeTemplate.value, selected.value.id, { label: label.trim() })
}

// ── Section-setting helpers (read/write the selected section) ────────────────
function setSetting(key: string, value: string | number | boolean) {
  if (!theme.value || !selectedSection.value) return
  themesStore.updateSection(theme.value.id, activeTemplate.value, selectedSection.value.id, {
    settings: { [key]: value },
  })
}

function settingText(key: string): string {
  return String(selectedSection.value?.settings[key] ?? '')
}

function settingNum(key: string, fallback: number): number {
  const value = selectedSection.value?.settings[key]
  return typeof value === 'number' ? value : fallback
}

// ── Block-setting helpers (mirror the section ones, via updateBlock) ─────────
function setBlockSetting(key: string, value: string | number | boolean) {
  if (!theme.value || selected.value?.type !== 'block') return
  themesStore.updateBlock(theme.value.id, activeTemplate.value, selected.value.sectionId, selected.value.id, {
    settings: { [key]: value },
  })
}

function blockSettingText(key: string): string {
  return String(selectedBlock.value?.settings[key] ?? '')
}

function blockSettingNum(key: string, fallback: number): number {
  const value = selectedBlock.value?.settings[key]
  return typeof value === 'number' ? value : fallback
}

// ── Unified panel accessors ──────────────────────────────────────────────────
// One schema field-loop drives both section and block settings — these dispatch
// to the section or block helpers based on the current selection type.
const isBlockSelected = computed(() => selected.value?.type === 'block')
const panelFields = computed(() => fieldsFor(
  isBlockSelected.value ? (selectedBlockDef.value?.fields ?? []) : (selectedSectionDef.value?.fields ?? []),
  drawing.value,
  activeTemplate.value,
  facts.value,
).filter((field) => fieldShown(field, panelSettings.value)))

/** A select's choices, under the names the builder gives them ("truck" reads "Delivery truck"). */
function selectItems(field: ThemeSectionField) {
  return (field.options ?? []).map((value) => ({ title: field.optionLabels?.[value] ?? value, value }))
}

/** A collection setting's choices: every product, or one of the store's collections (by its handle). */
const collectionItems = computed(() => [
  { title: 'All products', value: 'all' },
  ...collectionsOf(useCommerceStore().products, channelId.value).map((c) => ({ title: c.name, value: c.handle })),
])
const panelSettings = computed(() => (isBlockSelected.value ? selectedBlock.value?.settings : selectedSection.value?.settings) ?? {})

function panelSet(key: string, value: string | number | boolean) {
  if (isBlockSelected.value) setBlockSetting(key, value)
  else setSetting(key, value)
}
function panelText(key: string): string {
  return isBlockSelected.value ? blockSettingText(key) : settingText(key)
}
function panelNum(key: string, fallback: number): number {
  return isBlockSelected.value ? blockSettingNum(key, fallback) : settingNum(key, fallback)
}

// Escape closes the settings panel (JourneyBuilder precedent).
function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && selected.value) selected.value = null
}
onMounted(() => window.addEventListener('keydown', onEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape))

// ── Left panel mode: the Sections/Styles tabs, or the Da Vinci generator ──────
// 'davinci' fully replaces the tab strip while active (legacy parity).
const leftMode = ref<'panel' | 'davinci'>('panel')

function openDaVinci() {
  leftMode.value = 'davinci'
  addDialog.value = false
}

// ── Theme styles panel ────────────────────────────────────────────────────────
type LeftTab = 'sections' | 'styles'
const leftTab = ref<LeftTab>('sections')

// The styles tab and the section/block settings panel both edit state — keep
// them from fighting over the right rail by clearing the selection on switch.
watch(leftTab, (t) => {
  if (t === 'styles') selected.value = null
})

// Vertical icon rail (Layers / Theme styles) roving-focus keyboard support.
function onModeRailKeydown(e: KeyboardEvent) {
  if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
  e.preventDefault()
  const rail = (e.currentTarget as HTMLElement).closest('.tb-mode-rail')
  if (!rail) return
  const btns = Array.from(rail.querySelectorAll<HTMLButtonElement>('.tb-mode-rail__btn'))
  const modes: LeftTab[] = ['sections', 'styles']
  const cur = btns.indexOf(e.currentTarget as HTMLButtonElement)
  let next = cur
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (cur + 1) % btns.length
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (cur - 1 + btns.length) % btns.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = btns.length - 1
  const mode = modes[next]
  if (mode) leftTab.value = mode
  btns[next]?.focus()
}

/** Preset swatches from the token palette (shared by style rows + color fields). */
const swatchPalette = [
  { label: 'Maropost blue', value: mp_color_light_primary },
  { label: 'Sky', value: mp_color_blue_500 },
  { label: 'Cobalt', value: mp_color_light_aiAccent_primary },
  { label: 'Green', value: mp_color_light_success },
  { label: 'Amber', value: mp_color_light_warning },
  { label: 'Red', value: mp_color_light_error },
  { label: 'Ink', value: mp_color_light_textPrimary },
  { label: 'White', value: mp_color_neutral_0 },
]

type ColorKey = 'brandColor' | 'accentColor' | 'background' | 'textColor' | 'tintColor' | 'saleBadgeColor' | 'customBadgeColor' | 'soldOutBadgeColor'
type ColorRow = { key: ColorKey; label: string; hint?: string }

/** The theme's colours; a theme on the sections drawing also has its tint (Lumos's tinted bands). */
const styleColorRows = computed<ColorRow[]>(() => [
  { key: 'brandColor', label: 'Brand color' },
  { key: 'accentColor', label: 'Accent color' },
  { key: 'background', label: 'Background' },
  { key: 'textColor', label: 'Text color' },
  ...(drawing.value === 'sections' ? [{ key: 'tintColor' as const, label: 'Tint color', hint: 'Behind sections set to a tinted band' }] : []),
])

const badgeColorRows: ColorRow[] = [
  { key: 'saleBadgeColor', label: 'Sale badge' },
  { key: 'customBadgeColor', label: 'Custom badge' },
  { key: 'soldOutBadgeColor', label: 'Sold out badge' },
]

const buttonStyleOptions: { value: ThemeStyles['buttonStyle']; title: string; description: string; icon: string }[] = [
  { value: 'solid', title: 'Solid', description: 'Filled buttons in your brand color.', icon: 'square' },
  { value: 'outline', title: 'Outline', description: 'Bordered buttons, transparent fill.', icon: 'square-dashed' },
  { value: 'pill', title: 'Pill', description: 'Fully rounded, filled buttons.', icon: 'rectangle-horizontal' },
]

const buttonCaseItems = [{ value: 'As typed', label: 'As typed' }, { value: 'Uppercase', label: 'Uppercase' }]
const cardShadowItems = [{ value: 'None', label: 'None' }, { value: 'Soft', label: 'Soft' }]

function setStyle(patch: Partial<ThemeStyles>) {
  if (!theme.value) return
  themesStore.updateStyles(theme.value.id, patch)
}

// ── Colours: a preset swatch or any hex ──────────────────────────────────────
/** One colour however it was typed ("#FFFFFF" is the preset "#ffffff"). */
function sameColor(a: string | undefined, b: string | undefined): boolean {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()
}

/** "495da7", "#495DA7" or "#49d" as "#495da7"; null when it is not a hex colour. */
function normalizeHex(text: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text.trim())
  if (!m) return null
  const digits = m[1]!.toLowerCase()
  return `#${digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits}`
}

/** A colour as the storefront draws it: a tint the theme leaves out is its quiet surface colour. */
function colorOf(key: ColorKey): string {
  const styles = theme.value?.styles
  if (!styles) return ''
  if (key === 'tintColor') return styles.tintColor || storefrontThemeVars(styles)['--sf-surface'] || ''
  return styles[key] ?? ''
}

/**
 * Set a colour. On the sections drawing the buttons follow a new brand colour when the
 * theme had set them to the old one (Lumos's indigo), so Brand color reaches them; a
 * hover shade made for the old colour goes, and the storefront darkens the new one.
 */
function setColor(key: ColorKey, value: string) {
  const styles = theme.value?.styles
  if (!styles) return
  const patch: Partial<ThemeStyles> = { [key]: value }
  if (key === 'brandColor' && styles.drawing === 'sections' && sameColor(styles.buttonColor, styles.brandColor)) {
    patch.buttonColor = value
    if (sameColor(styles.buttonBorderColor, styles.brandColor)) patch.buttonBorderColor = value
    if (styles.buttonHoverColor) patch.buttonHoverColor = undefined
  }
  setStyle(patch)
}

// What is typed in a colour's hex field, while it is not yet the colour saved.
const hexDrafts = ref<Partial<Record<ColorKey, string>>>({})

function hexText(key: ColorKey): string {
  return hexDrafts.value[key] ?? colorOf(key)
}

function hexError(key: ColorKey): string[] {
  const draft = hexDrafts.value[key]
  return draft !== undefined && !normalizeHex(draft) ? ['Use a hex color, like #495DA7'] : []
}

function onHexInput(key: ColorKey, typed: string | null) {
  hexDrafts.value = { ...hexDrafts.value, [key]: typed ?? '' }
  const hex = normalizeHex(typed ?? '')
  if (hex && !sameColor(hex, colorOf(key))) setColor(key, hex)
}

function clearHexDraft(key: ColorKey) {
  const { [key]: _typed, ...rest } = hexDrafts.value
  hexDrafts.value = rest
}

function pickSwatch(key: ColorKey, value: string) {
  clearHexDraft(key)
  setColor(key, value)
}

// ── Swatch radiogroup keyboard support (roving tabindex) ─────────────────────
// Both swatch loops (styles tab + inspector color field) render swatchPalette
// in the same order, so array-index alignment resolves the next value without
// extra DOM data attributes.
function swatchTabindex(swatch: { value: string }, currentValue: string): number {
  const checkedIndex = swatchPalette.findIndex((s) => sameColor(s.value, currentValue))
  const targetIndex = checkedIndex === -1 ? 0 : checkedIndex
  return sameColor(swatchPalette[targetIndex]?.value, swatch.value) ? 0 : -1
}

function onSwatchKeydown(e: KeyboardEvent, setValue: (value: string) => void) {
  const key = e.key
  if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(key)) return
  e.preventDefault()
  const target = e.currentTarget as HTMLButtonElement | null
  const row = target?.closest('.tb-swatch-row')
  const buttons = Array.from(row?.querySelectorAll<HTMLButtonElement>('button[role="radio"]') ?? [])
  const currentIndex = target ? buttons.indexOf(target) : -1
  if (currentIndex === -1 || buttons.length === 0) return

  let nextIndex = currentIndex
  if (key === 'ArrowRight' || key === 'ArrowDown') nextIndex = (currentIndex + 1) % buttons.length
  else if (key === 'ArrowLeft' || key === 'ArrowUp') nextIndex = (currentIndex - 1 + buttons.length) % buttons.length
  else if (key === 'Home') nextIndex = 0
  else if (key === 'End') nextIndex = buttons.length - 1

  const nextSwatch = swatchPalette[nextIndex]
  if (!nextSwatch) return
  setValue(nextSwatch.value)
  buttons[nextIndex]?.focus()
}

// ── Ask Da Vinci ──────────────────────────────────────────────────────────────
const copilot = useCopilotStore()
function askDaVinci() {
  copilot.openWithPrompt(`Review my storefront theme "${theme.value?.name ?? ''}" and suggest improvements to layout and colors.`)
}

// ── Da Vinci generator (parent owns state + store writes) ─────────────────────
const chatMessages = ref<ThemeChatMessage[]>([])
// Transient "New" cue for sections Da Vinci just added — cleared on select,
// undo, or template switch. Not persisted (it's a review affordance).
const newSectionIds = ref<Set<string>>(new Set())
// Same review cue for freshly-added blocks — cleared on select or template switch.
const newBlockIds = ref<Set<string>>(new Set())

let chatIdCounter = 0
function chatId(prefix: string) {
  chatIdCounter += 1
  return `${prefix}-${chatIdCounter}`
}

// The conversation is per-template: each turn is stamped with the template it
// ran on, and the panel only shows the active template's turns. That keeps an
// Undo card from acting on a template the user has since switched away from.
const visibleMessages = computed(() =>
  chatMessages.value.filter((m) => !m.template || m.template === activeTemplate.value),
)

// A generation in flight. The generator is synchronous, but the panel and the
// canvas walk the three stages the live builder shows, so a reviewer sees what
// a merchant sees; a template or store switch mid-run cancels it (the token).
const generating = ref<ThemeGenerating | null>(null)
let generationToken = 0
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Generated sections land at the top of the content: under the announcement bar and header. */
function topInsertIndex(sections: ThemeSection[]): number {
  let i = 0
  while (i < sections.length && ['announcement-bar', 'header'].includes(sections[i]!.kind)) i += 1
  return i
}

async function onGenerate(prompt: string) {
  if (!theme.value || generating.value) return
  const template = activeTemplate.value
  const token = ++generationToken
  chatMessages.value.push({ id: chatId('u'), role: 'user', text: prompt, template, at: new Date().toISOString() })

  generating.value = { prompt, stage: 0 }
  for (let stage = 1; stage < GENERATION_STAGES.length; stage += 1) {
    await wait(GENERATION_STAGE_MS)
    if (token !== generationToken) return
    generating.value = { prompt, stage }
  }
  await wait(GENERATION_STAGE_MS)
  if (token !== generationToken) return
  generating.value = null

  const result = generateSections(prompt, {
    template,
    existingKinds: activeSections.value.map((s) => s.kind),
  })

  if (!result.matched || result.kinds.length === 0) {
    chatMessages.value.push({ id: chatId('d'), role: 'davinci', text: result.reply, template, at: new Date().toISOString() })
    return
  }

  const created = themesStore.addSections(
    theme.value.id,
    template,
    result.kinds,
    result.overrides,
    topInsertIndex(theme.value.templates[template]),
  )
  if (created.length === 0) {
    // Everything requested already exists (unique kinds) — reply, no store write.
    chatMessages.value.push({
      id: chatId('d'),
      role: 'davinci',
      text: 'Those sections are already on this template.',
      template,
      at: new Date().toISOString(),
    })
    return
  }

  const addedIds = created.map((s) => s.id)
  chatMessages.value.push({
    id: chatId('d'),
    role: 'davinci',
    text: result.reply,
    template,
    at: new Date().toISOString(),
    addedIds,
    addedTitles: created.map((s) => s.label),
  })

  addedIds.forEach((id) => newSectionIds.value.add(id))
  // Select the first added section without clearing its "New" cue (review aid).
  selected.value = { type: 'section', id: created[0]!.id }
  toast.success(created.length === 1 ? 'Section generated successfully' : `${created.length} sections generated successfully`)
}

/** Clear this template's conversation and start again. */
function onClearChat() {
  chatMessages.value = chatMessages.value.filter((m) => m.template && m.template !== activeTemplate.value)
}

function onUndo(ids: string[]) {
  if (!theme.value) return
  const idSet = new Set(ids)
  // Remove from the template the turn ran on (not necessarily the active one).
  const turn = chatMessages.value.find((m) => m.addedIds && m.addedIds.some((id) => idSet.has(id)))
  const template = turn?.template ?? activeTemplate.value
  themesStore.removeSections(theme.value.id, template, ids)
  ids.forEach((id) => newSectionIds.value.delete(id))
  if (selectedSectionId.value && idSet.has(selectedSectionId.value)) selected.value = null
  // Drop the ids off that turn's result card so Undo can't double-fire.
  if (turn) {
    turn.addedIds = undefined
    turn.text = 'Removed.'
  }
}

// Switching channel reuses this component instance (param-only route change) —
// reset the per-theme conversation + review state so one store's draft chat
// never leaks into another's panel.
watch(channelId, () => {
  chatMessages.value = []
  generationToken += 1
  generating.value = null
  newSectionIds.value.clear()
  newBlockIds.value.clear()
  selected.value = null
  leftMode.value = 'panel'
  hexDrafts.value = {}
})

const totalSectionCount = computed(() =>
  TEMPLATE_TYPES.reduce((sum, template) => sum + (theme.value?.templates[template].length ?? 0), 0),
)

const publishDialog = ref(false)
const publishMessage = computed(
  () =>
    `This publishes ${TEMPLATE_TYPES.length} templates (${totalSectionCount.value} sections) to your live storefront. Visitors see the changes immediately.`,
)

function confirmPublish() {
  if (!theme.value) return
  themesStore.publishTheme(theme.value.id)
  allowNextLeave()
  toast.success('Theme published')
}

const discardDialog = ref(false)

function confirmDiscard() {
  if (!theme.value) return
  themesStore.discardDraft(theme.value.id)
  selected.value = null
  newSectionIds.value.clear()
  newBlockIds.value.clear()
  allowNextLeave()
  toast.success('Draft changes discarded')
}

// ── Narrow viewport: left panel collapses behind a toolbar toggle ─────────────
const narrowQuery = window.matchMedia('(max-width: 900px)')
const isNarrow = ref(narrowQuery.matches)
const leftPanelOpen = ref(!narrowQuery.matches)

function onNarrowChange(e: MediaQueryListEvent) {
  isNarrow.value = e.matches
  leftPanelOpen.value = !e.matches
}
onMounted(() => narrowQuery.addEventListener('change', onNarrowChange))
onBeforeUnmount(() => narrowQuery.removeEventListener('change', onNarrowChange))
</script>

<template>
  <div v-if="!channel || !theme" class="tb-missing d-flex align-center justify-center">
    <!-- A Store Builder store with no theme yet (made blank) is sent to the theme library to choose one. -->
    <MpEmptyState
      v-if="channel?.webStore?.storeBuilderEnabled"
      icon="palette"
      title="No theme yet"
      description="This store has no theme to edit. Apply one from the theme library first."
      action-label="Choose a theme"
      @action="router.push({ name: 'StoreThemes', params: { accountId, channelId } })"
    />
    <MpEmptyState
      v-else
      icon="paintbrush"
      :title="channel ? 'No theme for this channel' : 'Sales channel not found'"
      :description="channel
        ? 'This channel doesn\'t have a store theme yet. Themes are available for channels with Store Builder enabled.'
        : 'This sales channel doesn\'t exist or was removed.'"
      :actionLabel="channel ? 'Back to channel' : 'Back to sales channels'"
      actionIcon="arrow-left"
      @action="router.push(backRoute)"
    />
  </div>

  <MpBuilderShell
    v-else
    :back-label="`Back to ${channel.name}`"
    :title="theme.name"
    :dirty="isDirty"
    persistence-mode="live"
    @back="router.push(backRoute)"
  >
    <template #title>
      <v-btn
        v-if="isNarrow"
        :icon="leftPanelOpen ? 'panel-left-close' : 'panel-left'"
        variant="text"
        size="small"
        :aria-label="leftPanelOpen ? 'Hide sections panel' : 'Show sections panel'"
        @click="leftPanelOpen = !leftPanelOpen"
      ></v-btn>
      <h1 class="font-weight-bold text-body-1 text-truncate ma-0">{{ theme.name }}</h1>
      <MpStatusChip :status="theme.status" type="general" size="sm" />
      <MpRowActionsMenu ariaLabel="Theme actions">
        <MpMenuItem
          icon="code"
          title="Edit Code"
          @click="router.push({ name: 'StoreThemeCode', params: { accountId, channelId } })"
        ></MpMenuItem>
      </MpRowActionsMenu>
    </template>

    <template #toolbar-center>
      <!-- Builder toolbar control: compact density and detail suppression are deliberate here. -->
      <v-select
        v-model="activeTemplate"
        :items="templateTypeItems"
        hide-details
        class="tb-template-select flex-shrink-0"
        aria-label="Template type"
      ></v-select>
    </template>

    <template #actions>
      <MpSegmentedControl
        :model-value="device"
        size="sm"
        ariaLabel="Preview device"
        :items="deviceOptions.map(o => ({ value: o.value, icon: o.icon, label: o.label, tooltip: o.label }))"
        @update:model-value="(v) => { if (v) device = v as Device }"
      />
      <v-divider vertical class="mx-1" style="height:24px;"></v-divider>
      <v-tooltip text="Ask Da Vinci to review this theme" location="bottom">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="sparkles"
            variant="text"
            size="small"
            color="primary"
            aria-label="Ask Da Vinci to review this theme"
            @click="askDaVinci"
          ></v-btn>
        </template>
      </v-tooltip>
      <v-divider vertical class="mx-1" style="height:24px;"></v-divider>
      <v-btn variant="outlined" size="small" class="text-none" :disabled="!isDirty" @click="discardDialog = true">
        Discard draft
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        class="text-none"
        :prepend-icon="isDirty ? 'rocket' : 'circle-check'"
        :disabled="!isDirty"
        @click="publishDialog = true"
      >
        {{ isDirty ? 'Publish' : 'Published' }}
      </v-btn>
    </template>

    <!-- Body -->
    <div class="tb-body d-flex h-100" style="overflow:hidden;">
      <!-- Left panel: Sections / Theme styles -->
      <!-- Scoped flex styles (not d-flex): the utility's !important would defeat v-show -->
      <aside
        v-show="leftPanelOpen"
        class="tb-panel-left border-r bg-surface"
        :class="{ 'tb-panel-left--overlay': isNarrow }"
      >
        <!-- Da Vinci generator fully replaces the tab strip while active -->
        <ThemeDaVinciPanel
          v-if="leftMode === 'davinci'"
          :messages="visibleMessages"
          :generating="generating"
          @generate="onGenerate"
          @undo="onUndo"
          @clear="onClearChat"
          @close="leftMode = 'panel'"
        />

        <template v-else>
        <div class="tb-panel-mode d-flex flex-grow-1" style="overflow:hidden;">
          <nav class="tb-mode-rail" role="tablist" aria-label="Editor panel">
            <v-tooltip text="Sections" location="end">
              <template #activator="{ props }">
                <button
                  v-bind="props"
                  type="button"
                  class="tb-mode-rail__btn"
                  :class="{ 'tb-mode-rail__btn--active': leftTab === 'sections' }"
                  role="tab"
                  :aria-selected="leftTab === 'sections'"
                  :tabindex="leftTab === 'sections' ? 0 : -1"
                  aria-label="Sections"
                  @click="leftTab = 'sections'"
                  @keydown="onModeRailKeydown"
                >
                  <v-icon size="18">layers</v-icon>
                </button>
              </template>
            </v-tooltip>
            <v-tooltip text="Theme styles" location="end">
              <template #activator="{ props }">
                <button
                  v-bind="props"
                  type="button"
                  class="tb-mode-rail__btn"
                  :class="{ 'tb-mode-rail__btn--active': leftTab === 'styles' }"
                  role="tab"
                  :aria-selected="leftTab === 'styles'"
                  :tabindex="leftTab === 'styles' ? 0 : -1"
                  aria-label="Theme styles"
                  @click="leftTab = 'styles'"
                  @keydown="onModeRailKeydown"
                >
                  <v-icon size="18">palette</v-icon>
                </button>
              </template>
            </v-tooltip>
          </nav>

          <div class="tb-panel-content d-flex flex-column flex-grow-1">

        <div v-if="leftTab === 'sections'" class="flex-grow-1 overflow-y-auto pa-2" role="list" aria-label="Template sections">
          <div v-for="(section, index) in activeSections" :key="section.id" role="listitem">
            <div
              class="tb-section-row"
              :class="{ 'tb-section-row--selected': section.id === selectedSectionId, 'tb-section-row--hidden': section.hidden }"
            >
              <v-btn
                v-if="sectionAcceptsBlocks(section)"
                :icon="expandedSectionIds.has(section.id) ? 'chevron-down' : 'chevron-right'"
                variant="text"
                size="small"
                density="comfortable"
                class="tb-section-row__expand"
                :aria-label="expandedSectionIds.has(section.id) ? `Collapse ${section.label} blocks` : `Expand ${section.label} blocks`"
                :aria-expanded="expandedSectionIds.has(section.id)"
                @click="toggleExpanded(section.id)"
              ></v-btn>
              <span v-else class="tb-section-row__expand-spacer" aria-hidden="true"></span>
              <button class="tb-section-row__main" :aria-label="`Select ${section.label}`" @click="selectSection(section.id)">
                <v-icon size="16" class="tb-section-row__icon">{{ sectionIcon(section.kind) }}</v-icon>
                <span class="tb-section-row__label text-truncate">{{ section.label }}</span>
                <span
                  v-if="newSectionIds.has(section.id)"
                  class="tb-section-row__new"
                  role="status"
                  aria-label="New — added by Da Vinci"
                >New</span>
              </button>
              <div class="tb-section-row__actions">
                <v-btn
                  :icon="section.hidden ? 'eye-off' : 'eye'"
                  variant="text"
                  size="small"
                  density="comfortable"
                  :aria-label="section.hidden ? `Show ${section.label}` : `Hide ${section.label}`"
                  @click="toggleHidden(section)"
                ></v-btn>
                <v-btn
                  icon="chevron-up"
                  variant="text"
                  size="small"
                  density="comfortable"
                  :disabled="index === 0"
                  :aria-label="`Move ${section.label} up`"
                  @click="moveSection(section, -1)"
                ></v-btn>
                <v-btn
                  icon="chevron-down"
                  variant="text"
                  size="small"
                  density="comfortable"
                  :disabled="index === activeSections.length - 1"
                  :aria-label="`Move ${section.label} down`"
                  @click="moveSection(section, 1)"
                ></v-btn>
                <v-btn
                  icon="trash-2"
                  variant="text"
                  size="small"
                  density="comfortable"
                  :aria-label="`Remove ${section.label}`"
                  @click="askRemove(section)"
                ></v-btn>
              </div>
            </div>

            <!-- Nested block sub-tree (expanded, block-accepting sections) -->
            <div
              v-if="sectionAcceptsBlocks(section) && expandedSectionIds.has(section.id)"
              class="tb-blocks"
              role="list"
              :aria-label="`${section.label} blocks`"
            >
              <div
                v-for="(block, bIndex) in (section.blocks ?? [])"
                :key="block.id"
                role="listitem"
                class="tb-block-row"
                :class="{ 'tb-block-row--selected': selected?.type === 'block' && selected.id === block.id }"
              >
                <button
                  class="tb-block-row__main"
                  :aria-label="`Select ${blockLabel(block)} block`"
                  @click="selectBlock(section.id, block.id)"
                >
                  <v-icon size="16" class="tb-block-row__icon">{{ blockIcon(block.kind) }}</v-icon>
                  <span class="tb-block-row__label text-truncate">{{ blockLabel(block) }}</span>
                  <span
                    v-if="newBlockIds.has(block.id)"
                    class="tb-section-row__new"
                    role="status"
                    aria-label="New block"
                  >New</span>
                </button>
                <div class="tb-section-row__actions">
                  <v-btn
                    icon="chevron-up"
                    variant="text"
                    size="small"
                    density="comfortable"
                    :disabled="bIndex === 0"
                    :aria-label="`Move ${blockLabel(block)} up`"
                    @click="moveBlock(section.id, block.id, -1)"
                  ></v-btn>
                  <v-btn
                    icon="chevron-down"
                    variant="text"
                    size="small"
                    density="comfortable"
                    :disabled="bIndex === (section.blocks?.length ?? 0) - 1"
                    :aria-label="`Move ${blockLabel(block)} down`"
                    @click="moveBlock(section.id, block.id, 1)"
                  ></v-btn>
                  <v-btn
                    icon="trash-2"
                    variant="text"
                    size="small"
                    density="comfortable"
                    :aria-label="`Remove ${blockLabel(block)}`"
                    @click="askRemoveBlock(section.id, block.id)"
                  ></v-btn>
                </div>
              </div>

              <!-- Add block: menu over the blocks this section takes on this theme -->
              <v-menu v-if="addableBlocks(section).length" location="bottom start">
                <template #activator="{ props: menuProps }">
                  <button v-bind="menuProps" class="tb-block-add" :aria-label="`Add a block to ${section.label}`">
                    <v-icon size="16" class="tb-block-row__icon">plus</v-icon>
                    <span class="tb-block-row__label">Add block</span>
                  </button>
                </template>
                <v-list density="compact">
                  <!-- A block the section is full of (a banner's three stats) stays listed, turned off, with why. -->
                  <v-list-item
                    v-for="def in addableBlocks(section)"
                    :key="def.kind"
                    :disabled="!blockHasRoom(section, def.kind)"
                    :aria-disabled="!blockHasRoom(section, def.kind) ? 'true' : undefined"
                    @click="addBlockToSection(section.id, def.kind)"
                  >
                    <template #prepend>
                      <v-icon size="16">{{ def.icon }}</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">{{ def.title }}</v-list-item-title>
                    <v-list-item-subtitle v-if="!blockHasRoom(section, def.kind)" class="text-caption">{{ def.limit?.reason }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>

          <div v-if="!activeSections.length" class="text-caption text-medium-emphasis text-center pa-4">
            No sections yet — add one below.
          </div>
        </div>

        <!-- Theme styles tab: global colors, fonts, radius, button style -->
        <div v-else class="flex-grow-1 overflow-y-auto pa-3">
          <MpFormGrid>
            <!-- Each colour: the presets, and its hex (the current colour, whatever it is), in one field. -->
            <MpFormField v-for="row in styleColorRows" :key="row.key" :label="row.label" :hint="row.hint">
              <template #default="{ labelId }">
                <div class="tb-color">
                  <div class="tb-swatch-row" role="radiogroup" :aria-labelledby="labelId">
                    <button
                      v-for="swatch in swatchPalette"
                      :key="swatch.value"
                      class="tb-swatch"
                      :class="{ 'tb-swatch--selected': sameColor(colorOf(row.key), swatch.value) }"
                      :style="{ background: swatch.value }"
                      role="radio"
                      :tabindex="swatchTabindex(swatch, colorOf(row.key))"
                      :aria-checked="sameColor(colorOf(row.key), swatch.value)"
                      :aria-label="`${row.label}: ${swatch.label}`"
                      @click="pickSwatch(row.key, swatch.value)"
                      @keydown="onSwatchKeydown($event, (v: string) => pickSwatch(row.key, v))"
                    ></button>
                  </div>
                  <v-text-field
                    :model-value="hexText(row.key)"
                    class="tb-hex"
                    :aria-label="`${row.label}, as a hex value`"
                    placeholder="#495DA7"
                    maxlength="7"
                    spellcheck="false"
                    autocomplete="off"
                    :error-messages="hexError(row.key)"
                    @update:model-value="(v: string | null) => onHexInput(row.key, v)"
                    @blur="clearHexDraft(row.key)"
                  >
                    <template #prepend-inner>
                      <span class="tb-hex__well" :style="{ background: colorOf(row.key) || 'transparent' }" aria-hidden="true"></span>
                    </template>
                  </v-text-field>
                </div>
              </template>
            </MpFormField>

            <v-divider></v-divider>

            <v-select
              :model-value="theme.styles.headingFont"
              label="Heading font"
              :items="themeFonts"
              @update:model-value="(v: string) => setStyle({ headingFont: v })"
            ></v-select>
            <v-select
              :model-value="theme.styles.bodyFont"
              label="Body font"
              :items="themeFonts"
              @update:model-value="(v: string) => setStyle({ bodyFont: v })"
            ></v-select>

            <MpFormField label="Corner radius">
              <template #default="{ labelId }">
                <v-slider
                  :model-value="theme.styles.cornerRadius"
                  :min="0"
                  :max="24"
                  :step="2"
                  thumb-label
                  :aria-labelledby="labelId"
                  @update:model-value="(v: number) => setStyle({ cornerRadius: v })"
                ></v-slider>
              </template>
            </MpFormField>

            <!-- The sections drawing's cards: their own corners (cards without them follow Corner radius) and shadow. -->
            <template v-if="drawing === 'sections'">
              <MpFormField label="Card corners" hint="Product cards, room tiles and logo cards">
                <template #default="{ labelId, descriptionId }">
                  <v-slider
                    :model-value="theme.styles.cardRadius ?? theme.styles.cornerRadius"
                    :min="0"
                    :max="24"
                    :step="2"
                    thumb-label
                    :aria-labelledby="labelId"
                    :aria-describedby="descriptionId"
                    @update:model-value="(v: number) => setStyle({ cardRadius: v })"
                  ></v-slider>
                </template>
              </MpFormField>
              <MpFormField label="Card shadow">
                <MpSegmentedControl
                  :model-value="theme.styles.cardShadow ?? 'None'"
                  :items="cardShadowItems"
                  ariaLabel="Card shadow"
                  @update:model-value="(v) => { if (v) setStyle({ cardShadow: v as NonNullable<ThemeStyles['cardShadow']> }) }"
                />
              </MpFormField>
            </template>

            <MpFormField label="Button style">
              <div class="d-flex flex-column gap-2">
                <MpOptionCard
                  v-for="option in buttonStyleOptions"
                  :key="option.value"
                  :selected="theme.styles.buttonStyle === option.value"
                  :title="option.title"
                  :description="option.description"
                  :icon="option.icon"
                  @click="setStyle({ buttonStyle: option.value })"
                />
              </div>
            </MpFormField>

            <MpFormField v-if="drawing === 'sections'" label="Button labels">
              <MpSegmentedControl
                :model-value="theme.styles.buttonCase ?? 'As typed'"
                :items="buttonCaseItems"
                ariaLabel="Button labels"
                @update:model-value="(v) => { if (v) setStyle({ buttonCase: v as NonNullable<ThemeStyles['buttonCase']> }) }"
              />
            </MpFormField>

            <MpFormSection title="Badges" description="The tags on product cards and galleries. Their text colour follows from the fill." />

            <MpFormField v-for="row in badgeColorRows" :key="row.key" :label="row.label">
              <template #default="{ labelId }">
                <div class="tb-color">
                  <div class="tb-swatch-row" role="radiogroup" :aria-labelledby="labelId">
                    <button
                      v-for="swatch in swatchPalette"
                      :key="swatch.value"
                      class="tb-swatch"
                      :class="{ 'tb-swatch--selected': sameColor(colorOf(row.key), swatch.value) }"
                      :style="{ background: swatch.value }"
                      role="radio"
                      :tabindex="swatchTabindex(swatch, colorOf(row.key))"
                      :aria-checked="sameColor(colorOf(row.key), swatch.value)"
                      :aria-label="`${row.label}: ${swatch.label}`"
                      @click="pickSwatch(row.key, swatch.value)"
                      @keydown="onSwatchKeydown($event, (v: string) => pickSwatch(row.key, v))"
                    ></button>
                  </div>
                  <v-text-field
                    :model-value="hexText(row.key)"
                    class="tb-hex"
                    :aria-label="`${row.label}, as a hex value`"
                    placeholder="#495DA7"
                    maxlength="7"
                    spellcheck="false"
                    autocomplete="off"
                    :error-messages="hexError(row.key)"
                    @update:model-value="(v: string | null) => onHexInput(row.key, v)"
                    @blur="clearHexDraft(row.key)"
                  >
                    <template #prepend-inner>
                      <span class="tb-hex__well" :style="{ background: colorOf(row.key) || 'transparent' }" aria-hidden="true"></span>
                    </template>
                  </v-text-field>
                </div>
              </template>
            </MpFormField>
          </MpFormGrid>
        </div>

        <div v-if="leftTab === 'sections'" class="pa-3 border-t">
          <v-btn variant="outlined" size="small" class="text-none" prepend-icon="plus" block @click="addDialog = true">
            Add section
          </v-btn>
        </div>
          </div>
        </div>
        </template>
      </aside>

      <!-- Canvas -->
      <div class="tb-canvas bg-background">
        <div class="tb-canvas__scroll">
          <div class="tb-stage mx-auto pa-6" :style="stageStyle">
            <StorefrontPreview
              :sections="activeSections"
              :styles="theme.styles"
              v-bind="previewProps"
              :template="activeTemplate"
              :device="device"
              interactive
              :selected-id="selectedSectionId"
              :selected-block-id="selected?.type === 'block' ? selected.id : null"
              :pending-ids="[...newSectionIds]"
              :pending-block-ids="[...newBlockIds]"
              :generating="generating"
              @select="selectSection"
              @select-block="selectBlock"
            />
          </div>
        </div>
      </div>

      <!-- Settings panel: section OR block (schema-driven, edits apply live) -->
      <aside
        v-if="selectedSection && (isBlockSelected ? selectedBlockDef : selectedSectionDef)"
        class="tb-panel-right border-l bg-surface d-flex flex-column"
      >
        <div class="pa-4 border-b d-flex align-center justify-space-between flex-shrink-0">
          <div class="d-flex align-center gap-3" style="min-width:0;">
            <v-avatar color="primary" variant="tonal" size="32" rounded="lg" class="flex-shrink-0">
              <v-icon size="16">{{ (isBlockSelected ? selectedBlockDef : selectedSectionDef)?.icon }}</v-icon>
            </v-avatar>
            <div style="min-width:0;">
              <div class="text-body-2 font-weight-bold text-truncate">
                {{ isBlockSelected ? blockLabel(selectedBlock!) : selectedSection.label }}
              </div>
              <div v-if="isBlockSelected" class="text-caption text-medium-emphasis text-truncate">
                in {{ selectedSection.label }}
              </div>
            </div>
          </div>
          <v-btn icon="x" variant="text" size="small" aria-label="Close settings panel" @click="closePanel"></v-btn>
        </div>

        <div class="pa-4 flex-grow-1 overflow-y-auto">
          <MpFormGrid>
            <!-- Section rename (section-only) -->
            <template v-if="!isBlockSelected">
              <v-text-field
                :model-value="selectedSection.label"
                label="Section label"
                @update:model-value="renameSection"
              ></v-text-field>
              <v-divider v-if="panelFields.length"></v-divider>
            </template>

            <!-- Shared schema-driven field renderer (section + block) -->
            <template v-for="f in panelFields" :key="f.key">
              <v-textarea
                v-if="f.type === 'textarea'"
                :model-value="panelText(f.key)"
                :label="f.label"
                rows="3"
                auto-grow
                @update:model-value="(v: string) => panelSet(f.key, v)"
              ></v-textarea>
              <!-- Unset, or an older theme's value: the option the storefront draws (selectValue). -->
              <v-select
                v-else-if="f.type === 'select'"
                :model-value="selectValue(f, panelSettings[f.key])"
                :label="f.label"
                :items="selectItems(f)"
                @update:model-value="(v: string) => panelSet(f.key, v)"
              ></v-select>
              <v-select
                v-else-if="f.type === 'collection'"
                :model-value="panelText(f.key) || 'all'"
                :label="f.label"
                :items="collectionItems"
                @update:model-value="(v: string) => panelSet(f.key, v)"
              ></v-select>
              <v-switch
                v-else-if="f.type === 'toggle'"
                :model-value="panelSettings[f.key] === true"
                :label="f.label"
                :hint="f.hint"
                :persistent-hint="!!f.hint"
                @update:model-value="(v: unknown) => panelSet(f.key, v === true)"
              ></v-switch>
              <MpFormField v-else-if="f.type === 'color'" :label="f.label">
                <template #default="{ labelId }">
                  <div class="tb-swatch-row" role="radiogroup" :aria-labelledby="labelId">
                    <button
                      v-for="swatch in swatchPalette"
                      :key="swatch.value"
                      class="tb-swatch"
                      :class="{ 'tb-swatch--selected': sameColor(panelText(f.key), swatch.value) }"
                      :style="{ background: swatch.value }"
                      role="radio"
                      :tabindex="swatchTabindex(swatch, panelText(f.key))"
                      :aria-checked="sameColor(panelText(f.key), swatch.value)"
                      :aria-label="`${f.label}: ${swatch.label}`"
                      @click="panelSet(f.key, swatch.value)"
                      @keydown="onSwatchKeydown($event, (v: string) => panelSet(f.key, v))"
                    ></button>
                  </div>
                </template>
              </MpFormField>
              <MpFormField v-else-if="f.type === 'slider'" :label="f.label">
                <template #default="{ labelId }">
                  <v-slider
                    :model-value="panelNum(f.key, f.min ?? 0)"
                    :min="f.min ?? 0"
                    :max="f.max ?? 10"
                    :step="1"
                    thumb-label
                    :aria-labelledby="labelId"
                    @update:model-value="(v: number) => panelSet(f.key, v)"
                  ></v-slider>
                </template>
              </MpFormField>
              <v-text-field
                v-else
                :model-value="panelText(f.key)"
                :label="f.label"
                @update:model-value="(v: string) => panelSet(f.key, v)"
              ></v-text-field>
            </template>

            <p v-if="isBlockSelected && selectedBlockDef?.note" class="text-caption text-medium-emphasis mb-0">{{ selectedBlockDef.note }}</p>

            <MpAlert tone="info" live="off">
              Changes apply to the preview as you type. Publish the theme to make them live.
            </MpAlert>
          </MpFormGrid>
        </div>
      </aside>
    </div>

    <AddSectionDialog
      v-model="addDialog"
      :sections="addableSections"
      :is-kind-disabled="isKindDisabled"
      @add="addSection"
      @add-variant="addSectionVariant"
      @generate="openDaVinci"
    />

    <MpConfirmDialog
      v-model="removeDialog"
      danger
      title="Remove this section?"
      :message="`&quot;${removeTarget?.label ?? 'This section'}&quot; will be removed from the ${activeTemplate} template. You can add it back later from the section picker.`"
      confirm-label="Remove section"
      @confirm="confirmRemove"
    />

    <MpConfirmDialog
      v-model="blockRemoveDialog"
      danger
      title="Remove this block?"
      :message="`&quot;${blockRemoveLabel}&quot; will be removed from this section. You can add it back later.`"
      confirm-label="Remove block"
      @confirm="confirmRemoveBlock"
    />

    <MpConfirmDialog
      v-model="publishDialog"
      :title="`Publish &quot;${theme.name}&quot;?`"
      :message="publishMessage"
      confirm-label="Publish theme"
      @confirm="confirmPublish"
    />

    <MpConfirmDialog
      v-model="discardDialog"
      danger
      title="Discard draft changes?"
      :message="theme.publishedAt
        ? 'All edits since the last publish will be reverted. This can\'t be undone.'
        : 'All edits will be reverted to the theme\'s starting point. This can\'t be undone.'"
      confirm-label="Discard changes"
      @confirm="confirmDiscard"
    />

    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
  </MpBuilderShell>
</template>

<style scoped>
.tb-missing { min-height: 60vh; }

.border-b { border-bottom: 1px solid var(--mp-border-subtle); }
.border-t { border-top: 1px solid var(--mp-border-subtle); }
.border-r { border-right: 1px solid var(--mp-border-subtle); }
.border-l { border-left: 1px solid var(--mp-border-subtle); }

/* ── Sections panel ──────────────────────────────────────────────── */
.tb-panel-left {
  display: flex;
  flex-direction: column;
  width: 324px;
  flex-shrink: 0;
  overflow: hidden;
}

/* Left icon rail — Layers / Theme styles mode switch (replaces the old tabs) */
.tb-mode-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-4);
  width: 44px;
  flex-shrink: 0;
  padding: var(--mp-space-8) 0;
  border-right: 1px solid var(--mp-border-subtle);
  background: var(--surface-primary);
}
.tb-mode-rail__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  border-radius: var(--r-chip);
  color: var(--muted);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
}
.tb-mode-rail__btn:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}
.tb-mode-rail__btn--active {
  background: var(--accent-soft);
  color: var(--accent);
}
.tb-mode-rail__btn:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
.tb-panel-content {
  min-width: 0;
  overflow: hidden;
}
.tb-template-select {
  max-width: 190px;
}

/* <900px: panel overlays the canvas, toggled from the toolbar */
.tb-body { position: relative; }
.tb-panel-left--overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 5;
  box-shadow: var(--mp-shadow-lg);
}

.tb-section-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-2);
  padding: var(--mp-space-2) var(--mp-space-4) var(--mp-space-2) 0;
  border-radius: var(--r-chip);
  transition: background 0.15s;
}
.tb-section-row:hover { background: var(--surface-secondary); }
.tb-section-row--selected,
.tb-section-row--selected:hover { background: var(--accent-soft); }
.tb-section-row--selected .tb-section-row__main { color: var(--accent); }
.tb-section-row--hidden .tb-section-row__icon,
.tb-section-row--hidden .tb-section-row__label { color: var(--text-disabled); }

.tb-section-row__main {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  flex: 1;
  min-width: 0;
  padding: var(--mp-space-6) var(--mp-space-8);
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: var(--r-chip);
  text-align: left;
  color: var(--text-primary);
}
.tb-section-row__main:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.tb-section-row__icon { color: var(--muted); flex-shrink: 0; }
.tb-section-row__label { font-size: var(--mp-text-label-fontSize); font-weight: var(--mp-fontWeight-semibold); }
.tb-section-row__new {
  flex-shrink: 0;
  padding: var(--mp-space-2) var(--mp-space-6);
  border-radius: var(--r-pill);
  background: var(--accent);
  color: rgb(var(--v-theme-on-primary));
  font-size: var(--mp-fontSize-10);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: 0.04em;
}

.tb-section-row__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 0;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.15s;
}
.tb-section-row:hover .tb-section-row__actions,
.tb-section-row:focus-within .tb-section-row__actions,
.tb-section-row--selected .tb-section-row__actions,
.tb-block-row:hover .tb-section-row__actions,
.tb-block-row:focus-within .tb-section-row__actions,
.tb-block-row--selected .tb-section-row__actions { width: auto; overflow: visible; opacity: 1; }

/* Expand chevron + spacer keep section rows aligned whether or not they nest */
.tb-section-row__expand { flex-shrink: 0; }
.tb-section-row__expand-spacer { width: var(--mp-space-28); flex-shrink: 0; }

/* ── Block sub-tree (nested under a section) ─────────────────────── */
.tb-blocks {
  display: flex;
  flex-direction: column;
  margin: 0 0 var(--mp-space-4) var(--mp-space-24);
  padding-left: var(--mp-space-8);
  border-left: 1px solid var(--mp-border-subtle);
}

.tb-block-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-2);
  padding: var(--mp-space-2) var(--mp-space-4) var(--mp-space-2) 0;
  border-radius: var(--r-chip);
  transition: background 0.15s;
}
.tb-block-row:hover { background: var(--surface-secondary); }
.tb-block-row--selected,
.tb-block-row--selected:hover { background: var(--accent-soft); }
.tb-block-row--selected .tb-block-row__main { color: var(--accent); }

.tb-block-row__main {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  flex: 1;
  min-width: 0;
  padding: var(--mp-space-4) var(--mp-space-8);
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: var(--r-chip);
  text-align: left;
  color: var(--text-primary);
}
.tb-block-row__main:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.tb-block-row__icon { color: var(--muted); flex-shrink: 0; }
.tb-block-row__label { font-size: var(--mp-fontSize-12); font-weight: var(--mp-fontWeight-medium); }

.tb-block-add {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  width: 100%;
  padding: var(--mp-space-4) var(--mp-space-8);
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: var(--r-chip);
  text-align: left;
  color: var(--accent);
}
.tb-block-add:hover { background: var(--accent-soft); }
.tb-block-add:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.tb-block-add .tb-block-row__icon { color: var(--accent); }
.tb-block-add .tb-block-row__label { font-weight: var(--mp-fontWeight-semibold); }

/* ── Canvas ──────────────────────────────────────────────────────── */
.tb-canvas { flex: 1 1 auto; position: relative; overflow: hidden; background: var(--surface-0); }
.tb-canvas__scroll { position: absolute; inset: 0; overflow: auto; }
.tb-stage { transition: width 280ms ease; margin-inline: auto; }
.tb-stage :deep(.sf-preview) { box-shadow: var(--mp-shadow-md); }

/* ── Settings panel ──────────────────────────────────────────────── */
.tb-panel-right { width: 340px; flex-shrink: 0; overflow: hidden; }

/* ── Color swatches (token palette presets) ──────────────────────── */
.tb-color { display: flex; flex-direction: column; gap: var(--mp-space-10); }
.tb-swatch-row { display: flex; flex-wrap: wrap; gap: var(--mp-space-10); }

/* The current colour's hex, with a well that shows it (whatever it is, preset or not). */
.tb-hex__well {
  flex-shrink: 0;
  width: var(--mp-space-20);
  height: var(--mp-space-20);
  border-radius: var(--r-pill);
  box-shadow: inset 0 0 0 1px var(--mp-border-subtle);
}

.tb-swatch {
  width: var(--mp-space-28);
  height: var(--mp-space-28);
  padding: 0;
  border: 0;
  border-radius: var(--r-pill);
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--mp-border-subtle);
  transition: transform 0.15s, box-shadow 0.15s;
}
.tb-swatch:hover { transform: scale(1.12); }
.tb-swatch:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.tb-swatch--selected {
  box-shadow:
    inset 0 0 0 1px var(--mp-border-subtle),
    0 0 0 2px var(--surface-primary),
    0 0 0 4px var(--accent);
}
</style>
