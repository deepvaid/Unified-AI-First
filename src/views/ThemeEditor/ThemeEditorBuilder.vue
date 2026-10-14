<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import StorefrontPreview from '@/components/saleschannels/StorefrontPreview.vue'
import ThemeDaVinciPanel, { type ThemeChatMessage, type ThemeGenerating } from '@/components/saleschannels/ThemeDaVinciPanel.vue'
import ThemeAddSectionDialog from '@/components/themeeditor/ThemeAddSectionDialog.vue'
import ThemeEditorFrame from '@/components/themeeditor/ThemeEditorFrame.vue'
import ThemeFieldControl from '@/components/themeeditor/ThemeFieldControl.vue'
import ThemeInspectorPanel from '@/components/themeeditor/ThemeInspectorPanel.vue'
import ThemeLayersPanel from '@/components/themeeditor/ThemeLayersPanel.vue'
import ThemeSettingsInspector from '@/components/themeeditor/ThemeSettingsInspector.vue'
import ThemeSettingsList from '@/components/themeeditor/ThemeSettingsList.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { GENERATION_STAGES, GENERATION_STAGE_MS } from '@/composables/useThemeGenerator'
import { useToast } from '@/composables/useToast'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useThemeEditorStore } from '@/stores/useThemeEditor'
import {
  STYLE_FIELDS,
  THEME_SETTINGS_ITEMS,
  getBlockDef,
  getSectionDef,
  toPreviewSections,
  toPreviewStyles,
  type ThemeEditorSectionDef,
  type ThemeEditorValue,
  type ThemeSettingsItemId,
} from '@/stores/themeEditorData'

// Theme builder — store builder re-skin (docs/rebuild/theme-editor-reskin/README.md).
// The UAT screen 1:1: Layers (or Theme Settings, from the rail) · template + variant pickers and
// the device toggle over the storefront preview · Preview / Save / Publish. As in UAT, a selected
// section or block opens its inspector in the Layers column (× goes back to Layers), a theme
// settings page opens on the right, and Da Vinci (Add section → "Generate with AI", or "Edit with
// Da Vinci") takes the Layers column too. Same workflow, on the design system's components.

const route = useRoute()
const router = useRouter()
const accountId = computed(() => String(route.params.accountId ?? ''))
const channelId = computed(() => String(route.params.channelId ?? ''))
const themeId = computed(() => String(route.params.themeId ?? ''))
const mode = computed<'builder' | 'settings'>(() => (route.name === 'ThemeEditorSettings' ? 'settings' : 'builder'))

const salesChannelsStore = useSalesChannelsStore()
const themesStore = useStoreThemesStore()
const editor = useThemeEditorStore()
const toast = useToast()

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const themeName = computed(() => themesStore.getTheme(themeId.value)?.name ?? 'Theme')
const state = computed(() => editor.stateFor(themeId.value))

// ── Template ──────────────────────────────────────────────────────────────────
const templateType = computed(() => String(route.query['template-type'] ?? 'home'))
const templateOptions = computed(() => state.value.templates.map((entry) => ({ title: entry.label, value: entry.type })))
const template = computed(() => editor.template(themeId.value, templateType.value) ?? state.value.templates[0]!)
const variant = ref('default')

function setTemplate(type: string | null) {
  if (!type || type === template.value.type) return
  clearSelection()
  closeDaVinci()
  router.replace({ query: { ...route.query, 'template-type': type, 'template-id': 'default' } })
}

// ── Selection ─────────────────────────────────────────────────────────────────
const selectedSectionId = ref<string | null>(null)
const selectedBlockId = ref<string | null>(null)
const settingsItem = ref<ThemeSettingsItemId | null>(null)

const selectedSection = computed(() => (selectedSectionId.value ? template.value.sections.find((entry) => entry.id === selectedSectionId.value) : undefined))
const selectedBlock = computed(() => (selectedSection.value && selectedBlockId.value ? editor.findBlock(selectedSection.value, selectedBlockId.value)?.block : undefined))

function selectSection(sectionId: string) {
  selectedSectionId.value = sectionId
  selectedBlockId.value = null
}

function selectBlock(sectionId: string, blockId: string) {
  selectedSectionId.value = sectionId
  selectedBlockId.value = blockId
}

function clearSelection() {
  selectedSectionId.value = null
  selectedBlockId.value = null
}

/** The storefront chrome isn't in Layers: its sections open their own template, as UAT's "Edit header" does. */
function onPreviewSelect(id: string) {
  if (id === 'lumos-chrome-header' || id === 'lumos-chrome-announcement') return setTemplate('header')
  if (id === 'lumos-chrome-footer') return setTemplate('footer')
  selectSection(id)
}

watch(mode, () => {
  clearSelection()
  closeDaVinci()
  settingsItem.value = null
})

const inspectorTitle = computed(() => {
  if (mode.value === 'settings') return THEME_SETTINGS_ITEMS.find((item) => item.id === settingsItem.value)?.label ?? ''
  return selectedBlock.value?.label ?? selectedSection.value?.label ?? ''
})

/** What the Layers column shows: Da Vinci, the selection's inspector, or Layers itself. */
const leftPanel = computed<'davinci' | 'inspector' | 'layers'>(() => {
  if (davinci.value) return 'davinci'
  if (mode.value === 'builder' && selectedSection.value) return 'inspector'
  return 'layers'
})

const sectionFields = computed(() => (selectedSection.value ? getSectionDef(selectedSection.value.kind)?.fields ?? [] : []))
const blockFields = computed(() => (selectedBlock.value ? getBlockDef(selectedBlock.value.kind)?.fields ?? [] : []))

// ── Edits (all through the store, so dirty tracking stays honest) ─────────────
function updateSectionSetting(key: string, value: ThemeEditorValue) {
  if (selectedSection.value) editor.updateSection(themeId.value, template.value.type, selectedSection.value.id, { settings: { [key]: value } })
}

function renameSection(label: string) {
  if (selectedSection.value) editor.updateSection(themeId.value, template.value.type, selectedSection.value.id, { label })
}

function updateBlockSetting(key: string, value: ThemeEditorValue) {
  if (selectedSection.value && selectedBlock.value) editor.updateBlock(themeId.value, template.value.type, selectedSection.value.id, selectedBlock.value.id, { settings: { [key]: value } })
}

function addBlock(sectionId: string, kind: string, parentBlockId?: string) {
  const created = editor.addBlock(themeId.value, template.value.type, sectionId, kind, parentBlockId)
  if (created) selectBlock(sectionId, created.id)
}

// ── Add section ───────────────────────────────────────────────────────────────
const addOpen = ref(false)

function onAddSection(def: ThemeEditorSectionDef, variantId?: string) {
  const created = editor.addSection(themeId.value, template.value.type, def, variantId)
  if (!created) return
  selectSection(created.id)
  toast.success(`${created.label} added`)
}

// ── Da Vinci (generate a section, or edit the selected one) ─────────────────
// UAT's generator, mocked: the request walks the same three stages, then a new section lands at
// the top of the template ("Image Banner with Text", placeholder copy) or the edited section takes
// the change. Each section keeps its own conversation; new sections share one.
const davinci = ref<{ mode: 'generate' | 'edit'; sectionId?: string } | null>(null)
const conversations = ref<Record<string, ThemeChatMessage[]>>({})
const generating = ref<ThemeGenerating | null>(null)
let generationToken = 0

const conversationKey = computed(() => (davinci.value?.mode === 'edit' ? davinci.value.sectionId! : 'new'))
const conversation = computed(() => conversations.value[conversationKey.value] ?? [])

function openGenerator() {
  addOpen.value = false
  clearSelection()
  davinci.value = { mode: 'generate' }
}

function openEditor(sectionId: string) {
  if (selectedSectionId.value !== sectionId) selectSection(sectionId)
  davinci.value = { mode: 'edit', sectionId }
}

function closeDaVinci() {
  generationToken += 1
  generating.value = null
  davinci.value = null
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const chatId = () => `te-chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

function pushTurn(key: string, turn: Omit<ThemeChatMessage, 'id' | 'at'>) {
  conversations.value[key] = [...(conversations.value[key] ?? []), { ...turn, id: chatId(), at: new Date().toISOString() }]
}

async function onGenerate(prompt: string) {
  const session = davinci.value
  if (!session || generating.value) return
  const key = conversationKey.value
  const token = ++generationToken
  pushTurn(key, { role: 'user', text: prompt })
  generating.value = { prompt, stage: 0 }
  for (let stage = 1; stage < GENERATION_STAGES.length; stage += 1) {
    await wait(GENERATION_STAGE_MS)
    if (token !== generationToken) return
    generating.value = { prompt, stage }
  }
  await wait(GENERATION_STAGE_MS)
  if (token !== generationToken) return
  generating.value = null

  if (session.mode === 'generate') {
    const def = getSectionDef('image-banner')!
    const created = editor.addSection(themeId.value, template.value.type, def, 'with-cta', 0)
    if (!created) return
    editor.updateSection(themeId.value, template.value.type, created.id, {
      label: 'Image Banner with Text',
      settings: { headline: 'Section Title', ctaLabel: 'Button Text' },
    })
    const placed = template.value.sections.find((entry) => entry.id === created.id)
    if (placed) placed.aiGenerated = true
    pushTurn(key, { role: 'davinci', text: `Section generated: Image Banner with Text, added at the top of the ${template.value.label} template.`, addedTitles: ['Image Banner with Text'] })
    toast.success('Section generated successfully!')
    return
  }

  const target = template.value.sections.find((entry) => entry.id === session.sectionId)
  if (!target) return
  const align = /\bcent(?:er|re)\b/i.test(prompt) ? 'Center' : /\bright\b/i.test(prompt) ? 'Right' : /\bleft\b/i.test(prompt) ? 'Left' : null
  if (align && getSectionDef(target.kind)?.fields.some((field) => field.key === 'alignment')) {
    editor.updateSection(themeId.value, template.value.type, target.id, { settings: { alignment: align } })
  }
  pushTurn(key, { role: 'davinci', text: `Section updated: ${target.label}.`, addedTitles: [target.label] })
  toast.success('Section updated successfully!')
}

function clearConversation() {
  conversations.value[conversationKey.value] = []
}

// ── Remove (confirmed) ────────────────────────────────────────────────────────
const pendingRemove = ref<{ sectionId: string; blockId?: string; label: string } | null>(null)
const removeOpen = computed({
  get: () => pendingRemove.value !== null,
  set: (value: boolean) => {
    if (!value) pendingRemove.value = null
  },
})

function askRemoveSection(sectionId: string) {
  const target = template.value.sections.find((entry) => entry.id === sectionId)
  if (target) pendingRemove.value = { sectionId, label: target.label }
}

function askRemoveBlock(sectionId: string, blockId: string) {
  const target = template.value.sections.find((entry) => entry.id === sectionId)
  const found = target && editor.findBlock(target, blockId)
  if (found) pendingRemove.value = { sectionId, blockId, label: found.block.label }
}

function confirmRemove() {
  const pending = pendingRemove.value
  if (!pending) return
  if (pending.blockId) {
    editor.removeBlock(themeId.value, template.value.type, pending.sectionId, pending.blockId)
    if (selectedBlockId.value === pending.blockId) selectedBlockId.value = null
  } else {
    editor.removeSection(themeId.value, template.value.type, pending.sectionId)
    if (selectedSectionId.value === pending.sectionId) clearSelection()
    if (davinci.value?.sectionId === pending.sectionId) closeDaVinci()
  }
  toast.success(`${pending.label} removed`)
}

// ── Preview ───────────────────────────────────────────────────────────────────
type Device = 'desktop' | 'tablet' | 'mobile'
const device = ref<Device>('desktop')
// Three silhouettes that can't be confused at toolbar size: a portrait phone, a
// landscape tablet (as UAT draws it) and a monitor. Lucide's portrait `tablet`
// differs from `smartphone` by two pixels of width at this size.
const DEVICE_ITEMS = [
  { value: 'mobile', label: 'Mobile (390px)', icon: 'smartphone', tooltip: 'Mobile (390px)' },
  { value: 'tablet', label: 'Tablet (768px)', icon: 'rectangle-horizontal', tooltip: 'Tablet (768px)' },
  { value: 'desktop', label: 'Desktop (1100px)', icon: 'monitor', tooltip: 'Desktop (1100px)' },
]
const STAGE_WIDTH: Record<Device, string> = {
  mobile: 'var(--mp-component-preview-viewport-mobile)',
  tablet: 'var(--mp-component-preview-viewport-tablet)',
  desktop: 'var(--mp-component-preview-viewport-desktop)',
}
const stageStyle = computed(() => ({ width: `min(${STAGE_WIDTH[device.value]}, 100%)` }))

const previewSections = computed(() => toPreviewSections(template.value))
const previewStyles = computed(() => toPreviewStyles(state.value.settings))
const previewBrand = computed(() => state.value.settings.logo.storeName.toUpperCase())

// ── Save / Publish / Preview ──────────────────────────────────────────────────
const dirty = computed(() => editor.isDirty(themeId.value))

function save() {
  editor.save(themeId.value)
  toast.success('Theme saved')
}

const publishOpen = ref(false)

function publish() {
  editor.save(themeId.value)
  themesStore.publishTheme(themeId.value)
  toast.success(`${themeName.value} is now the live theme`)
}

const storefrontHref = computed(
  () => router.resolve({ name: 'StorefrontHome', params: { accountId: accountId.value, channelId: channelId.value } }).href,
)

const { confirmLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } = useDirtyLeaveGuard(dirty, {
  title: 'Discard unsaved changes?',
  message: 'Changes to this theme haven’t been saved.',
})
</script>

<template>
  <ThemeEditorFrame :account-id="accountId" :channel-id="channelId" :theme-id="themeId" :active="mode">
    <template #actions>
      <v-btn variant="text" class="text-none" prepend-icon="external-link" :href="storefrontHref" target="_blank" rel="noopener">Preview</v-btn>
      <v-btn variant="outlined" class="text-none" :disabled="!dirty" @click="save">Save</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="publishOpen = true">Publish</v-btn>
    </template>

    <aside v-if="leftPanel === 'davinci'" class="te-assistant" aria-label="Da Vinci AI">
      <ThemeDaVinciPanel
        :mode="davinci!.mode"
        :messages="conversation"
        :generating="generating"
        @generate="onGenerate"
        @clear="clearConversation"
        @close="closeDaVinci"
      />
    </aside>

    <ThemeInspectorPanel v-else-if="leftPanel === 'inspector'" placement="start" :title="inspectorTitle" @close="clearSelection">
      <template v-if="selectedBlock">
        <ThemeFieldControl
          v-for="field in blockFields"
          :key="`${selectedBlock.id}-${field.key}`"
          :field="field"
          :model-value="selectedBlock.settings[field.key]"
          @update:model-value="updateBlockSetting(field.key, $event)"
        />
      </template>

      <template v-else-if="selectedSection">
        <v-text-field label="Section name" :model-value="selectedSection.label" @update:model-value="renameSection" />
        <v-btn variant="tonal" color="primary" block prepend-icon="sparkles" class="text-none" @click="openEditor(selectedSection.id)">Edit with Da Vinci</v-btn>
        <ThemeFieldControl
          v-for="field in sectionFields"
          :key="`${selectedSection.id}-${field.key}`"
          :field="field"
          :model-value="selectedSection.settings[field.key]"
          @update:model-value="updateSectionSetting(field.key, $event)"
        />
        <MpFormSection title="Style">
          <ThemeFieldControl
            v-for="field in STYLE_FIELDS"
            :key="`${selectedSection.id}-${field.key}`"
            :field="field"
            :model-value="selectedSection.settings[field.key]"
            @update:model-value="updateSectionSetting(field.key, $event)"
          />
        </MpFormSection>
      </template>
    </ThemeInspectorPanel>

    <ThemeLayersPanel
      v-else-if="mode === 'builder'"
      :sections="template.sections"
      :selected-section-id="selectedSectionId"
      :selected-block-id="selectedBlockId"
      @select-section="selectSection"
      @select-block="selectBlock"
      @add-section="addOpen = true"
      @add-block="addBlock"
      @remove-section="askRemoveSection"
      @remove-block="askRemoveBlock"
      @reorder-section="(from, to) => editor.moveSection(themeId, template.type, from, to)"
      @reorder-block="(sectionId, from, to) => editor.moveBlock(themeId, template.type, sectionId, from, to)"
      @edit-with-ai="openEditor"
    />
    <ThemeSettingsList v-else :selected="settingsItem" @select="settingsItem = $event" />

    <div class="te-canvas">
      <div class="te-canvas__bar">
        <!-- Toolbar pickers: placeholder + aria-label, no static label or details row, and the
             quiet field treatment (value + chevron, no resting border) shared with the top bar. -->
        <v-autocomplete
          :model-value="template.type"
          :items="templateOptions"
          aria-label="Template"
          placeholder="Search templates"
          hide-details
          class="te-canvas__select mp-field-quiet"
          @update:model-value="setTemplate"
        />
        <v-select
          v-model="variant"
          :items="[{ title: 'Default', value: 'default' }]"
          aria-label="Template variant"
          hide-details
          class="te-canvas__select te-canvas__select--variant mp-field-quiet"
        />
        <div class="flex-grow-1" />
        <MpSegmentedControl v-model="device" :items="DEVICE_ITEMS" ariaLabel="Preview device" />
      </div>

      <div class="te-canvas__scroll">
        <div class="te-stage" :style="stageStyle">
          <StorefrontPreview
            :sections="previewSections"
            :styles="previewStyles"
            :device="device"
            interactive
            :selected-id="selectedSectionId"
            :selected-block-id="selectedBlockId"
            :brand="previewBrand"
            :generating="davinci?.mode === 'generate' ? generating : null"
            :menu="['Contact Us']"
            @select="onPreviewSelect"
            @select-block="selectBlock"
          />
        </div>
      </div>
    </div>

    <ThemeInspectorPanel v-if="mode === 'settings' && settingsItem" :title="inspectorTitle" @close="settingsItem = null">
      <ThemeSettingsInspector :item="settingsItem" :settings="state.settings" @change="editor.patchSettings(themeId, $event)" />
    </ThemeInspectorPanel>

    <ThemeAddSectionDialog v-model="addOpen" @add="onAddSection" @generate="openGenerator" />

    <MpConfirmDialog
      v-model="removeOpen"
      :title="pendingRemove?.blockId ? 'Remove block?' : 'Remove section?'"
      :message="`${pendingRemove?.label ?? 'This item'} will be removed from the ${template.label} template.`"
      confirm-label="Remove"
      danger
      @confirm="confirmRemove"
    />
    <MpConfirmDialog
      v-model="publishOpen"
      title="Publish theme?"
      :message="`${themeName} will become the live theme for ${channel?.name ?? 'this store'}. Shoppers see it immediately.`"
      confirm-label="Publish"
      @confirm="publish"
    />
    <MpConfirmDialog
      v-model="confirmLeave"
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      danger
      @confirm="discardAndLeave"
    />
  </ThemeEditorFrame>
</template>

<style scoped>
/* Da Vinci takes the Layers column's place, at a transcript's measure. */
.te-assistant {
  display: flex;
  flex-shrink: 0;
  width: var(--mp-component-editor-assistantWidth);
  min-height: 0;
  border-right: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  color: var(--on-surface);
}

.te-canvas {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  background: var(--surface-canvas);
  /* Own stacking context: the preview's positioned selection labels stay under the
     inspector when it overlays the canvas (below breakpointWide). */
  isolation: isolate;
}

/* Canvas header — template pickers and the device toggle, on the toolbar height. */
.te-canvas__bar {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  flex-shrink: 0;
  height: var(--mp-component-editor-topBarHeight);
  padding-inline: var(--mp-space-16);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-primary);
  overflow: hidden;
}

/* Pickers size to their value on the toolbar ramp and give way before the device
   toggle does on a narrow canvas. */
.te-canvas__select {
  flex: 0 1 auto;
  width: fit-content;
  /* The floor is half the search width (the Tickets composer-select stop): an
     autocomplete's fit-content under-measures its selection by a couple of pixels,
     which clipped "Home" to "Ho…". */
  min-width: calc(var(--mp-component-toolbar-searchMinWidth) / 2);
  max-width: var(--mp-component-toolbar-searchMinWidth);
}

.te-canvas__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: var(--mp-space-24);
}

/* The stage clamps the preview to the chosen device width and centres it. */
.te-stage {
  margin-inline: auto;
  transition: width var(--dur-slow) var(--ease);
}

.te-stage :deep(.sf-preview) {
  box-shadow: var(--elevation-overlay);
}
</style>
