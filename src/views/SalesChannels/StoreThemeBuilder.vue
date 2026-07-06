<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import StorefrontPreview from '@/components/saleschannels/StorefrontPreview.vue'
import { useCopilotStore } from '@/stores/useCopilot'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import {
  getSectionDef,
  sectionCatalog,
  themeFonts,
  TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABELS,
  type TemplateType,
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

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const theme = computed(() => themesStore.themeForChannel(channelId.value))

const backRoute = computed(() =>
  channel.value
    ? { name: 'SalesChannelDetail', params: { accountId: accountId.value, channelId: channelId.value } }
    : { name: 'SalesChannels', params: { accountId: accountId.value } },
)

// ── Active template + sections ────────────────────────────────────────────────
const activeTemplate = ref<TemplateType>('home')
const activeSections = computed<ThemeSection[]>(() => theme.value?.templates[activeTemplate.value] ?? [])

const selectedId = ref<string | null>(null)
function selectSection(id: string) {
  selectedId.value = id
}

// Switching templates drops the selection — it belongs to the old template.
watch(activeTemplate, () => {
  selectedId.value = null
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
    if (selectedId.value === removeTargetId.value) selectedId.value = null
    themesStore.removeSection(theme.value.id, activeTemplate.value, removeTargetId.value)
  }
  removeTargetId.value = null
}

// ── Add-section picker ────────────────────────────────────────────────────────
const addMenuOpen = ref(false)

function isKindDisabled(def: ThemeSectionDef) {
  return Boolean(def.unique) && activeSections.value.some((s) => s.kind === def.kind)
}

function addSection(def: ThemeSectionDef) {
  if (!theme.value) return
  const section = themesStore.addSection(theme.value.id, activeTemplate.value, def.kind)
  if (section) selectedId.value = section.id
  addMenuOpen.value = false
}

// ── Section settings panel (schema-driven, live edits) ───────────────────────
const selectedSection = computed(() => activeSections.value.find((s) => s.id === selectedId.value))
const selectedDef = computed(() => (selectedSection.value ? getSectionDef(selectedSection.value.kind) : undefined))

function closePanel() {
  selectedId.value = null
}

function renameSection(label: string) {
  if (!theme.value || !selectedId.value || !label.trim()) return
  themesStore.updateSection(theme.value.id, activeTemplate.value, selectedId.value, { label: label.trim() })
}

function setSetting(key: string, value: string | number | boolean) {
  if (!theme.value || !selectedId.value) return
  themesStore.updateSection(theme.value.id, activeTemplate.value, selectedId.value, { settings: { [key]: value } })
}

function settingText(key: string): string {
  return String(selectedSection.value?.settings[key] ?? '')
}

function settingNum(key: string, fallback: number): number {
  const value = selectedSection.value?.settings[key]
  return typeof value === 'number' ? value : fallback
}

// Escape closes the settings panel (JourneyBuilder precedent).
function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && selectedId.value) selectedId.value = null
}
onMounted(() => window.addEventListener('keydown', onEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape))

// ── Theme styles panel ────────────────────────────────────────────────────────
type LeftTab = 'sections' | 'styles'
const leftTab = ref<LeftTab>('sections')

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

// ── Ask Da Vinci ──────────────────────────────────────────────────────────────
const copilot = useCopilotStore()
function askDaVinci() {
  copilot.openWithPrompt(`Review my storefront theme "${theme.value?.name ?? ''}" and suggest improvements to layout and colors.`)
}

// ── Publish / discard flow ────────────────────────────────────────────────────
const snack = ref(false)
const snackMessage = ref('')

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
  snackMessage.value = 'Theme published'
  snack.value = true
}

const discardDialog = ref(false)

function confirmDiscard() {
  if (!theme.value) return
  themesStore.discardDraft(theme.value.id)
  selectedId.value = null
  snackMessage.value = 'Draft changes discarded'
  snack.value = true
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
  <div v-if="!channel || !theme" class="tb-root d-flex align-center justify-center">
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

  <div v-else class="tb-root d-flex flex-column">
    <!-- Toolbar -->
    <div class="tb-toolbar d-flex align-center justify-space-between px-5 gap-3 border-b bg-surface">
      <div class="tb-toolbar__side d-flex align-center gap-3" style="min-width:0;">
        <v-tooltip :text="`Back to ${channel.name}`" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="arrow-left"
              variant="text"
              size="small"
              :aria-label="`Back to ${channel.name}`"
              @click="router.push(backRoute)"
            ></v-btn>
          </template>
        </v-tooltip>
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
        <v-tooltip v-if="isDirty" text="Unpublished changes" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props" class="tb-dirty-dot" role="status" aria-label="Unpublished changes"></span>
          </template>
        </v-tooltip>
      </div>

      <v-btn-toggle
        v-model="activeTemplate"
        mandatory
        density="compact"
        rounded="lg"
        border
        class="flex-shrink-0"
        aria-label="Template type"
      >
        <v-btn v-for="t in TEMPLATE_TYPES" :key="t" :value="t" size="small" class="text-none px-3">
          {{ TEMPLATE_TYPE_LABELS[t] }}
        </v-btn>
      </v-btn-toggle>

      <div class="tb-toolbar__side d-flex align-center gap-2 justify-end">
        <v-btn-toggle v-model="device" mandatory density="compact" rounded="lg" border aria-label="Preview device">
          <v-btn
            v-for="option in deviceOptions"
            :key="option.value"
            :value="option.value"
            :icon="option.icon"
            size="small"
            :aria-label="option.label"
          ></v-btn>
        </v-btn-toggle>
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
          prepend-icon="rocket"
          :disabled="!isDirty"
          @click="publishDialog = true"
        >
          Publish
        </v-btn>
      </div>
    </div>

    <!-- Body -->
    <div class="tb-body d-flex flex-grow-1" style="overflow:hidden;">
      <!-- Left panel: Sections / Theme styles -->
      <!-- Scoped flex styles (not d-flex): the utility's !important would defeat v-show -->
      <aside
        v-show="leftPanelOpen"
        class="tb-panel-left border-r bg-surface"
        :class="{ 'tb-panel-left--overlay': isNarrow }"
      >
        <v-tabs v-model="leftTab" density="compact" color="primary" grow class="border-b flex-shrink-0">
          <v-tab value="sections" class="text-none">Sections</v-tab>
          <v-tab value="styles" class="text-none">Theme styles</v-tab>
        </v-tabs>

        <div v-if="leftTab === 'sections'" class="flex-grow-1 overflow-y-auto pa-2" role="list" aria-label="Template sections">
          <div
            v-for="(section, index) in activeSections"
            :key="section.id"
            role="listitem"
            class="tb-section-row"
            :class="{ 'tb-section-row--selected': section.id === selectedId, 'tb-section-row--hidden': section.hidden }"
          >
            <button class="tb-section-row__main" :aria-label="`Select ${section.label}`" @click="selectSection(section.id)">
              <v-icon size="16" class="tb-section-row__icon">{{ sectionIcon(section.kind) }}</v-icon>
              <span class="tb-section-row__label text-truncate">{{ section.label }}</span>
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
                :aria-checked="theme.styles[row.key] === swatch.value"
                :aria-label="`${row.label}: ${swatch.label}`"
                @click="setStyle({ [row.key]: swatch.value })"
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

          <div class="text-caption font-weight-bold mb-1">Corner radius</div>
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
          <v-menu v-model="addMenuOpen" :close-on-content-click="false" location="top start">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="outlined" size="small" class="text-none" prepend-icon="plus" block>
                Add section
              </v-btn>
            </template>
            <v-card rounded="lg" border flat width="320" class="py-1">
              <div class="px-4 py-2 border-b text-body-2 font-weight-bold">Add a section</div>
              <v-list density="compact" nav max-height="380" class="overflow-y-auto">
                <v-list-item
                  v-for="def in sectionCatalog"
                  :key="def.kind"
                  rounded="lg"
                  :disabled="isKindDisabled(def)"
                  @click="addSection(def)"
                >
                  <template #prepend>
                    <v-avatar color="primary" variant="tonal" size="28" rounded="lg">
                      <v-icon size="15">{{ def.icon }}</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-medium ml-2">{{ def.title }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption ml-2" style="white-space:normal;">
                    {{ isKindDisabled(def) ? 'Already in this template' : def.description }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>
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
              :selected-id="selectedId"
              @select="selectSection"
            />
          </div>
        </div>
      </div>

      <!-- Section settings panel (schema-driven, edits apply live) -->
      <aside v-if="selectedSection && selectedDef" class="tb-panel-right border-l bg-surface d-flex flex-column">
        <div class="pa-4 border-b d-flex align-center justify-space-between flex-shrink-0">
          <div class="d-flex align-center gap-3" style="min-width:0;">
            <v-avatar color="primary" variant="tonal" size="32" rounded="lg" class="flex-shrink-0">
              <v-icon size="17">{{ selectedDef.icon }}</v-icon>
            </v-avatar>
            <div style="min-width:0;">
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase">{{ selectedDef.title }}</div>
              <div class="text-body-2 font-weight-bold text-truncate">{{ selectedSection.label }}</div>
            </div>
          </div>
          <v-btn icon="x" variant="text" size="small" aria-label="Close settings panel" @click="closePanel"></v-btn>
        </div>

        <div class="pa-4 flex-grow-1 overflow-y-auto">
          <v-text-field
            :model-value="selectedSection.label"
            label="Section label"
            variant="outlined"
            density="compact"
            class="mb-3"
            @update:model-value="renameSection"
          ></v-text-field>
          <v-divider v-if="selectedDef.fields.length" class="mb-4"></v-divider>

          <!-- Schema-driven fields from the section catalog -->
          <template v-for="f in selectedDef.fields" :key="f.key">
            <v-textarea
              v-if="f.type === 'textarea'"
              :model-value="settingText(f.key)"
              :label="f.label"
              variant="outlined"
              density="compact"
              rows="3"
              auto-grow
              class="mb-3"
              @update:model-value="(v: string) => setSetting(f.key, v)"
            ></v-textarea>
            <v-select
              v-else-if="f.type === 'select'"
              :model-value="settingText(f.key)"
              :label="f.label"
              :items="f.options"
              variant="outlined"
              density="compact"
              class="mb-3"
              @update:model-value="(v: string) => setSetting(f.key, v)"
            ></v-select>
            <v-switch
              v-else-if="f.type === 'toggle'"
              :model-value="selectedSection.settings[f.key] === true"
              :label="f.label"
              color="primary"
              density="compact"
              hide-details
              class="mb-3"
              @update:model-value="(v: unknown) => setSetting(f.key, v === true)"
            ></v-switch>
            <div v-else-if="f.type === 'color'" class="mb-4">
              <div class="text-caption font-weight-bold mb-2">{{ f.label }}</div>
              <div class="tb-swatch-row" role="radiogroup" :aria-label="f.label">
                <button
                  v-for="swatch in swatchPalette"
                  :key="swatch.value"
                  class="tb-swatch"
                  :class="{ 'tb-swatch--selected': settingText(f.key) === swatch.value }"
                  :style="{ background: swatch.value }"
                  role="radio"
                  :aria-checked="settingText(f.key) === swatch.value"
                  :aria-label="`${f.label}: ${swatch.label}`"
                  @click="setSetting(f.key, swatch.value)"
                ></button>
              </div>
            </div>
            <div v-else-if="f.type === 'slider'" class="mb-3">
              <div class="text-caption font-weight-bold mb-1">{{ f.label }}</div>
              <v-slider
                :model-value="settingNum(f.key, f.min ?? 0)"
                :min="f.min ?? 0"
                :max="f.max ?? 10"
                :step="1"
                density="compact"
                color="primary"
                thumb-label
                hide-details
                :aria-label="f.label"
                @update:model-value="(v: number) => setSetting(f.key, v)"
              ></v-slider>
            </div>
            <v-text-field
              v-else
              :model-value="settingText(f.key)"
              :label="f.label"
              variant="outlined"
              density="compact"
              class="mb-3"
              @update:model-value="(v: string) => setSetting(f.key, v)"
            ></v-text-field>
          </template>

          <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">
            Changes apply to the preview as you type. Publish the theme to make them live.
          </v-alert>
        </div>

        <div class="pa-4 border-t flex-shrink-0">
          <v-btn color="primary" variant="flat" class="text-none" block @click="closePanel">Done</v-btn>
        </div>
      </aside>
    </div>

    <MpConfirmDialog
      v-model="removeDialog"
      danger
      title="Remove this section?"
      :message="`&quot;${removeTarget?.label ?? 'This section'}&quot; will be removed from the ${activeTemplate} template. You can add it back later from the section picker.`"
      confirm-label="Remove section"
      @confirm="confirmRemove"
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

    <v-snackbar v-model="snack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackMessage }}</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.tb-root { height: 100vh; overflow: hidden; }
.tb-toolbar { height: 56px; flex-shrink: 0; }
.tb-toolbar__side { flex: 1 1 0; }

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-l { border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

.tb-dirty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: rgb(var(--v-theme-warning));
}

/* ── Sections panel ──────────────────────────────────────────────── */
.tb-panel-left {
  display: flex;
  flex-direction: column;
  width: 280px;
  flex-shrink: 0;
  overflow: hidden;
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
  border-radius: 8px;
  transition: background 0.15s;
}
.tb-section-row:hover { background: rgba(var(--v-theme-on-surface), 0.05); }
.tb-section-row--selected,
.tb-section-row--selected:hover { background: rgba(var(--v-theme-primary), 0.1); }
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
  border-radius: 8px;
  text-align: left;
  color: rgb(var(--v-theme-on-surface));
}
.tb-section-row__main:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.tb-section-row__icon { color: rgba(var(--v-theme-on-surface), 0.6); flex-shrink: 0; }
.tb-section-row__label { font-size: 0.8125rem; font-weight: 600; }

.tb-section-row__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.tb-section-row:hover .tb-section-row__actions,
.tb-section-row:focus-within .tb-section-row__actions,
.tb-section-row--selected .tb-section-row__actions { opacity: 1; }

/* ── Canvas ──────────────────────────────────────────────────────── */
.tb-canvas { flex: 1 1 auto; position: relative; overflow: hidden; }
.tb-canvas__scroll { position: absolute; inset: 0; overflow: auto; }
.tb-stage { transition: width 280ms ease; }

/* ── Settings panel ──────────────────────────────────────────────── */
.tb-panel-right { width: 340px; flex-shrink: 0; overflow: hidden; }

/* ── Color swatches (token palette presets) ──────────────────────── */
.tb-swatch-row { display: flex; flex-wrap: wrap; gap: 8px; }

.tb-swatch {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(var(--v-border-color), var(--v-border-opacity));
  transition: transform 0.15s, box-shadow 0.15s;
}
.tb-swatch:hover { transform: scale(1.12); }
.tb-swatch:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.tb-swatch--selected {
  box-shadow:
    inset 0 0 0 1px rgba(var(--v-border-color), var(--v-border-opacity)),
    0 0 0 2px rgb(var(--v-theme-surface)),
    0 0 0 4px rgb(var(--v-theme-primary));
}
</style>
