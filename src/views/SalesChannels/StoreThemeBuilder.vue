<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpBuilderShell from '@/components/MpBuilderShell.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import StorefrontPreview from '@/components/saleschannels/StorefrontPreview.vue'
import AddSectionDialog from '@/components/saleschannels/AddSectionDialog.vue'
import ThemeDaVinciPanel, { type ThemeChatMessage } from '@/components/saleschannels/ThemeDaVinciPanel.vue'
import { generateSections } from '@/composables/useThemeGenerator'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import { useCopilotStore } from '@/stores/useCopilot'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import {
  blockCatalog,
  getBlockDef,
  getSectionDef,
  themeFonts,
  TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABELS,
  type TemplateType,
  type ThemeBlock,
  type ThemeSection,
  type ThemeSectionDef,
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
const theme = computed(() => themesStore.themeForChannel(channelId.value))

const backRoute = computed(() =>
  channel.value
    ? { name: 'SalesChannelDetail', params: { accountId: accountId.value, channelId: channelId.value } }
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
  return Boolean(getSectionDef(section.kind)?.acceptsBlocks) || Boolean(section.blocks?.length)
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

/** Tree label for a block: its def title, or a snippet of its primary setting. */
function blockLabel(block: ThemeBlock): string {
  const def = getBlockDef(block.kind)
  const snippet = String(block.settings.text ?? block.settings.body ?? block.settings.label ?? '').trim()
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
const panelFields = computed(() =>
  isBlockSelected.value ? (selectedBlockDef.value?.fields ?? []) : (selectedSectionDef.value?.fields ?? []),
)
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

const styleColorRows: { key: 'brandColor' | 'accentColor' | 'background' | 'textColor'; label: string }[] = [
  { key: 'brandColor', label: 'Brand color' },
  { key: 'accentColor', label: 'Accent color' },
  { key: 'background', label: 'Background' },
  { key: 'textColor', label: 'Text color' },
]

const buttonStyleOptions: { value: ThemeStyles['buttonStyle']; title: string; description: string; icon: string }[] = [
  { value: 'solid', title: 'Solid', description: 'Filled buttons in your brand color.', icon: 'square' },
  { value: 'outline', title: 'Outline', description: 'Bordered buttons, transparent fill.', icon: 'square-dashed' },
  { value: 'pill', title: 'Pill', description: 'Fully rounded, filled buttons.', icon: 'rectangle-horizontal' },
]

function setStyle(patch: Partial<ThemeStyles>) {
  if (!theme.value) return
  themesStore.updateStyles(theme.value.id, patch)
}

// ── Swatch radiogroup keyboard support (roving tabindex) ─────────────────────
// Both swatch loops (styles tab + inspector color field) render swatchPalette
// in the same order, so array-index alignment resolves the next value without
// extra DOM data attributes.
function swatchTabindex(swatch: { value: string }, currentValue: string): number {
  const checkedIndex = swatchPalette.findIndex((s) => s.value === currentValue)
  const targetIndex = checkedIndex === -1 ? 0 : checkedIndex
  return swatchPalette[targetIndex]?.value === swatch.value ? 0 : -1
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

function onGenerate(prompt: string) {
  if (!theme.value) return
  const template = activeTemplate.value
  chatMessages.value.push({ id: chatId('u'), role: 'user', text: prompt, template })

  const result = generateSections(prompt, {
    template,
    existingKinds: activeSections.value.map((s) => s.kind),
  })

  if (!result.matched || result.kinds.length === 0) {
    chatMessages.value.push({ id: chatId('d'), role: 'davinci', text: result.reply, template })
    return
  }

  const created = themesStore.addSections(theme.value.id, template, result.kinds, result.overrides)
  if (created.length === 0) {
    // Everything requested already exists (unique kinds) — reply, no store write.
    chatMessages.value.push({
      id: chatId('d'),
      role: 'davinci',
      text: 'Those sections are already on this template.',
      template,
    })
    return
  }

  const addedIds = created.map((s) => s.id)
  chatMessages.value.push({
    id: chatId('d'),
    role: 'davinci',
    text: result.reply,
    template,
    addedIds,
    addedTitles: created.map((s) => s.label),
  })

  addedIds.forEach((id) => newSectionIds.value.add(id))
  // Select the first added section without clearing its "New" cue (review aid).
  selected.value = { type: 'section', id: created[0]!.id }
  toast.success(`Da Vinci added ${created.length} section${created.length === 1 ? '' : 's'}`)
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
  newSectionIds.value.clear()
  newBlockIds.value.clear()
  selected.value = null
  leftMode.value = 'panel'
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
    <MpEmptyState
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
      <div class="font-weight-bold text-body-1 text-truncate">{{ theme.name }}</div>
      <MpStatusChip :status="theme.status" type="general" size="x-small" />
      <v-menu location="bottom start">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="more-vertical"
            variant="text"
            size="small"
            aria-label="Theme actions"
          ></v-btn>
        </template>
        <v-list density="compact" class="py-1">
          <v-list-item
            prepend-icon="code"
            title="Edit Code"
            @click="router.push({ name: 'StoreThemeCode', params: { accountId, channelId } })"
          ></v-list-item>
        </v-list>
      </v-menu>
    </template>

    <template #toolbar-center>
      <v-select
        v-model="activeTemplate"
        :items="templateTypeItems"
        density="compact"
        variant="outlined"
        hide-details
        rounded="lg"
        class="tb-template-select flex-shrink-0"
        aria-label="Template type"
      ></v-select>
    </template>

    <template #actions>
      <v-btn-toggle v-model="device" mandatory density="compact" rounded="lg" border aria-label="Preview device">
        <v-tooltip v-for="option in deviceOptions" :key="option.value" :text="option.label" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :value="option.value"
              :icon="option.icon"
              size="small"
              :aria-label="option.label"
            ></v-btn>
          </template>
        </v-tooltip>
      </v-btn-toggle>
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
          @generate="onGenerate"
          @undo="onUndo"
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
                  <v-icon size="20">layers</v-icon>
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
                  <v-icon size="20">palette</v-icon>
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
                size="x-small"
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
                  size="x-small"
                  density="comfortable"
                  :aria-label="section.hidden ? `Show ${section.label}` : `Hide ${section.label}`"
                  @click="toggleHidden(section)"
                ></v-btn>
                <v-btn
                  icon="chevron-up"
                  variant="text"
                  size="x-small"
                  density="comfortable"
                  :disabled="index === 0"
                  :aria-label="`Move ${section.label} up`"
                  @click="moveSection(section, -1)"
                ></v-btn>
                <v-btn
                  icon="chevron-down"
                  variant="text"
                  size="x-small"
                  density="comfortable"
                  :disabled="index === activeSections.length - 1"
                  :aria-label="`Move ${section.label} down`"
                  @click="moveSection(section, 1)"
                ></v-btn>
                <v-btn
                  icon="trash-2"
                  variant="text"
                  size="x-small"
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
                  <v-icon size="14" class="tb-block-row__icon">{{ blockIcon(block.kind) }}</v-icon>
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
                    size="x-small"
                    density="comfortable"
                    :disabled="bIndex === 0"
                    :aria-label="`Move ${blockLabel(block)} up`"
                    @click="moveBlock(section.id, block.id, -1)"
                  ></v-btn>
                  <v-btn
                    icon="chevron-down"
                    variant="text"
                    size="x-small"
                    density="comfortable"
                    :disabled="bIndex === (section.blocks?.length ?? 0) - 1"
                    :aria-label="`Move ${blockLabel(block)} down`"
                    @click="moveBlock(section.id, block.id, 1)"
                  ></v-btn>
                  <v-btn
                    icon="trash-2"
                    variant="text"
                    size="x-small"
                    density="comfortable"
                    :aria-label="`Remove ${blockLabel(block)}`"
                    @click="askRemoveBlock(section.id, block.id)"
                  ></v-btn>
                </div>
              </div>

              <!-- Add block: menu over the block catalog -->
              <v-menu location="bottom start">
                <template #activator="{ props: menuProps }">
                  <button v-bind="menuProps" class="tb-block-add" :aria-label="`Add a block to ${section.label}`">
                    <v-icon size="14" class="tb-block-row__icon">plus</v-icon>
                    <span class="tb-block-row__label">Add block</span>
                  </button>
                </template>
                <v-list density="compact" class="py-1">
                  <v-list-item
                    v-for="def in blockCatalog"
                    :key="def.kind"
                    @click="addBlockToSection(section.id, def.kind)"
                  >
                    <template #prepend>
                      <v-icon size="16">{{ def.icon }}</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">{{ def.title }}</v-list-item-title>
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
          <div v-for="row in styleColorRows" :key="row.key" class="mb-4">
            <div class="text-caption font-weight-bold mb-2">{{ row.label }}</div>
            <div class="tb-swatch-row" role="radiogroup" :aria-label="row.label">
              <button
                v-for="swatch in swatchPalette"
                :key="swatch.value"
                class="tb-swatch"
                :class="{ 'tb-swatch--selected': theme.styles[row.key] === swatch.value }"
                :style="{ background: swatch.value }"
                role="radio"
                :tabindex="swatchTabindex(swatch, theme.styles[row.key])"
                :aria-checked="theme.styles[row.key] === swatch.value"
                :aria-label="`${row.label}: ${swatch.label}`"
                @click="setStyle({ [row.key]: swatch.value })"
                @keydown="onSwatchKeydown($event, (v: string) => setStyle({ [row.key]: v }))"
              ></button>
            </div>
          </div>

          <v-divider class="mb-4"></v-divider>

          <v-select
            :model-value="theme.styles.headingFont"
            label="Heading font"
            :items="themeFonts"
            variant="outlined"
            density="compact"
            class="mb-3"
            @update:model-value="(v: string) => setStyle({ headingFont: v })"
          ></v-select>
          <v-select
            :model-value="theme.styles.bodyFont"
            label="Body font"
            :items="themeFonts"
            variant="outlined"
            density="compact"
            class="mb-4"
            @update:model-value="(v: string) => setStyle({ bodyFont: v })"
          ></v-select>

          <div class="text-caption font-weight-bold mb-2">Corner radius</div>
          <v-slider
            :model-value="theme.styles.cornerRadius"
            :min="0"
            :max="24"
            :step="2"
            density="compact"
            color="primary"
            thumb-label
            hide-details
            aria-label="Corner radius"
            class="mb-4"
            @update:model-value="(v: number) => setStyle({ cornerRadius: v })"
          ></v-slider>

          <div class="text-caption font-weight-bold mb-2">Button style</div>
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
              :device="device"
              interactive
              :selected-id="selectedSectionId"
              :selected-block-id="selected?.type === 'block' ? selected.id : null"
              :pending-ids="[...newSectionIds]"
              :pending-block-ids="[...newBlockIds]"
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
              <v-icon size="17">{{ (isBlockSelected ? selectedBlockDef : selectedSectionDef)?.icon }}</v-icon>
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
          <!-- Section rename (section-only) -->
          <template v-if="!isBlockSelected">
            <v-text-field
              :model-value="selectedSection.label"
              label="Section label"
              variant="outlined"
              density="compact"
              class="mb-3"
              @update:model-value="renameSection"
            ></v-text-field>
            <v-divider v-if="panelFields.length" class="mb-4"></v-divider>
          </template>

          <!-- Shared schema-driven field renderer (section + block) -->
          <template v-for="f in panelFields" :key="f.key">
            <v-textarea
              v-if="f.type === 'textarea'"
              :model-value="panelText(f.key)"
              :label="f.label"
              variant="outlined"
              density="compact"
              rows="3"
              auto-grow
              class="mb-3"
              @update:model-value="(v: string) => panelSet(f.key, v)"
            ></v-textarea>
            <v-select
              v-else-if="f.type === 'select'"
              :model-value="panelText(f.key)"
              :label="f.label"
              :items="f.options"
              variant="outlined"
              density="compact"
              class="mb-3"
              @update:model-value="(v: string) => panelSet(f.key, v)"
            ></v-select>
            <v-switch
              v-else-if="f.type === 'toggle'"
              :model-value="panelSettings[f.key] === true"
              :label="f.label"
              color="primary"
              density="compact"
              hide-details
              class="mb-3"
              @update:model-value="(v: unknown) => panelSet(f.key, v === true)"
            ></v-switch>
            <div v-else-if="f.type === 'color'" class="mb-4">
              <div class="text-caption font-weight-bold mb-2">{{ f.label }}</div>
              <div class="tb-swatch-row" role="radiogroup" :aria-label="f.label">
                <button
                  v-for="swatch in swatchPalette"
                  :key="swatch.value"
                  class="tb-swatch"
                  :class="{ 'tb-swatch--selected': panelText(f.key) === swatch.value }"
                  :style="{ background: swatch.value }"
                  role="radio"
                  :tabindex="swatchTabindex(swatch, panelText(f.key))"
                  :aria-checked="panelText(f.key) === swatch.value"
                  :aria-label="`${f.label}: ${swatch.label}`"
                  @click="panelSet(f.key, swatch.value)"
                  @keydown="onSwatchKeydown($event, (v: string) => panelSet(f.key, v))"
                ></button>
              </div>
            </div>
            <div v-else-if="f.type === 'slider'" class="mb-3">
              <div class="text-caption font-weight-bold mb-1">{{ f.label }}</div>
              <v-slider
                :model-value="panelNum(f.key, f.min ?? 0)"
                :min="f.min ?? 0"
                :max="f.max ?? 10"
                :step="1"
                density="compact"
                color="primary"
                thumb-label
                hide-details
                :aria-label="f.label"
                @update:model-value="(v: number) => panelSet(f.key, v)"
              ></v-slider>
            </div>
            <v-text-field
              v-else
              :model-value="panelText(f.key)"
              :label="f.label"
              variant="outlined"
              density="compact"
              class="mb-3"
              @update:model-value="(v: string) => panelSet(f.key, v)"
            ></v-text-field>
          </template>

          <div class="tb-note d-flex align-start gap-2">
            <v-icon size="15" class="flex-shrink-0 mt-1">info</v-icon>
            <span class="text-caption">Changes apply to the preview as you type. Publish the theme to make them live.</span>
          </div>
        </div>
      </aside>
    </div>

    <AddSectionDialog
      v-model="addDialog"
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

/* Settings-panel note — token-based so it reads in light + dark (the old
   tonal info alert fell below AA on the dark surface). */
.tb-note {
  padding: 10px 12px;
  border-radius: var(--r-section);
  background: var(--accent-soft);
  color: var(--text-primary);
}
.tb-note .v-icon { color: var(--accent); }

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
  gap: 4px;
  width: 44px;
  flex-shrink: 0;
  padding: 8px 0;
  border-right: 1px solid var(--mp-border-subtle);
  background: var(--surface-primary);
}
.tb-mode-rail__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
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
  outline: none;
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.5);
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
  box-shadow: 0 8px 24px rgba(var(--v-theme-on-surface), 0.14);
}

.tb-section-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px 2px 0;
  border-radius: var(--r-chip);
  transition: background 0.15s;
}
.tb-section-row:hover { background: var(--surface-secondary); }
.tb-section-row--selected,
.tb-section-row--selected:hover { background: var(--accent-soft); }
.tb-section-row--selected .tb-section-row__main { color: var(--accent); }
.tb-section-row--hidden .tb-section-row__icon,
.tb-section-row--hidden .tb-section-row__label { opacity: 0.45; }

.tb-section-row__main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 7px 8px;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: var(--r-chip);
  text-align: left;
  color: var(--text-primary);
}
.tb-section-row__main:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.tb-section-row__icon { color: var(--muted); flex-shrink: 0; }
.tb-section-row__label { font-size: 0.8125rem; font-weight: 600; }
.tb-section-row__new {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  background: var(--accent);
  color: rgb(var(--v-theme-on-primary));
  font-size: 0.625rem;
  font-weight: 700;
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
.tb-section-row__expand-spacer { width: 28px; flex-shrink: 0; }

/* ── Block sub-tree (nested under a section) ─────────────────────── */
.tb-blocks {
  display: flex;
  flex-direction: column;
  margin: 0 0 4px 26px;
  padding-left: 8px;
  border-left: 1px solid var(--mp-border-subtle);
}

.tb-block-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 4px 1px 0;
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
  gap: 7px;
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: var(--r-chip);
  text-align: left;
  color: var(--text-primary);
}
.tb-block-row__main:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.tb-block-row__icon { color: var(--muted); flex-shrink: 0; }
.tb-block-row__label { font-size: 0.75rem; font-weight: 500; }

.tb-block-add {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 5px 8px;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: var(--r-chip);
  text-align: left;
  color: var(--accent);
}
.tb-block-add:hover { background: var(--accent-soft); }
.tb-block-add:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.tb-block-add .tb-block-row__icon { color: var(--accent); }
.tb-block-add .tb-block-row__label { font-weight: 600; }

/* ── Canvas ──────────────────────────────────────────────────────── */
.tb-canvas { flex: 1 1 auto; position: relative; overflow: hidden; background: var(--surface-0); }
.tb-canvas__scroll { position: absolute; inset: 0; overflow: auto; }
.tb-stage { transition: width 280ms ease; margin-inline: auto; }
.tb-stage :deep(.sf-preview) { box-shadow: var(--mp-shadow-md); }

/* ── Settings panel ──────────────────────────────────────────────── */
.tb-panel-right { width: 340px; flex-shrink: 0; overflow: hidden; }

/* ── Color swatches (token palette presets) ──────────────────────── */
.tb-swatch-row { display: flex; flex-wrap: wrap; gap: 10px; }

.tb-swatch {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--mp-border-subtle);
  transition: transform 0.15s, box-shadow 0.15s;
}
.tb-swatch:hover { transform: scale(1.12); }
.tb-swatch:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.tb-swatch--selected {
  box-shadow:
    inset 0 0 0 1px var(--mp-border-subtle),
    0 0 0 2px var(--surface-primary),
    0 0 0 4px var(--accent);
}
</style>
