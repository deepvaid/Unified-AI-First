<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import StorefrontPreview from '@/components/saleschannels/StorefrontPreview.vue'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import {
  getSectionDef,
  sectionCatalog,
  type TemplateType,
  type ThemeSection,
  type ThemeSectionDef,
} from '@/stores/themeBuilderData'

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
    <div class="tb-toolbar d-flex align-center px-5 border-b bg-surface">
      <div class="d-flex align-center gap-3" style="min-width:0;">
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
        <div class="font-weight-bold text-body-1 text-truncate">{{ theme.name }}</div>
        <MpStatusChip :status="theme.status" type="general" size="x-small" />
        <v-tooltip v-if="isDirty" text="Unpublished changes" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props" class="tb-dirty-dot" role="status" aria-label="Unpublished changes"></span>
          </template>
        </v-tooltip>
      </div>
    </div>

    <!-- Body -->
    <div class="d-flex flex-grow-1" style="overflow:hidden;">
      <!-- Sections panel -->
      <aside class="tb-panel-left border-r bg-surface d-flex flex-column">
        <div class="pa-3 border-b">
          <div class="text-overline text-medium-emphasis" style="line-height:1.2;">Sections</div>
          <div class="text-caption text-medium-emphasis">Click a section to select it on the canvas</div>
        </div>

        <div class="flex-grow-1 overflow-y-auto pa-2" role="list" aria-label="Template sections">
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

        <div class="pa-3 border-t">
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
          <div class="tb-stage mx-auto pa-6">
            <StorefrontPreview
              :sections="activeSections"
              :styles="theme.styles"
              interactive
              :selected-id="selectedId"
              @select="selectSection"
            />
          </div>
        </div>
      </div>
    </div>

    <MpConfirmDialog
      v-model="removeDialog"
      danger
      title="Remove this section?"
      :message="`&quot;${removeTarget?.label ?? 'This section'}&quot; will be removed from the ${activeTemplate} template. You can add it back later from the section picker.`"
      confirm-label="Remove section"
      @confirm="confirmRemove"
    />
  </div>
</template>

<style scoped>
.tb-root { height: 100vh; overflow: hidden; }
.tb-toolbar { height: 56px; flex-shrink: 0; }

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

.tb-dirty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: rgb(var(--v-theme-warning));
}

/* ── Sections panel ──────────────────────────────────────────────── */
.tb-panel-left { width: 280px; flex-shrink: 0; overflow: hidden; }

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
.tb-stage { max-width: 1080px; }
</style>
