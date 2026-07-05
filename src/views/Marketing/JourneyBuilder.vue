<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import JourneyFlowColumn from '@/components/marketing/JourneyFlowColumn.vue'
import { useCampaignsStore, type JourneyStatus } from '@/stores/useCampaigns'
import { useDataJourneysStore } from '@/stores/useDataJourneys'
import { useCopilotStore } from '@/stores/useCopilot'
import type { CatalogItem, FlowNode, NodeCategory } from '@/stores/journeyFlowData'
import { catalogByKind, dataNodeCatalog, nodeCatalog } from '@/stores/journeyFlowData'
import { addNodeAfter as insertNodeAfter, buildSegments, flowValidation, removeNode } from '@/composables/useFlowTree'

const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

// One builder, two domains: marketing journeys (default) and data journeys
// (route meta flowDomain: 'data') — different store, palette, and back route.
const isData = computed(() => route.meta.flowDomain === 'data')
const entityLabel = computed(() => (isData.value ? 'data journey' : 'journey'))
const listRoute = computed(() => ({ name: isData.value ? 'DataJourneys' : 'Journeys', params: { accountId: accountId.value } }))

const store = useCampaignsStore()
const dataStore = useDataJourneysStore()
const journeyId = computed(() => Number(route.params.id))
const journey = computed(() =>
  isData.value
    ? dataStore.dataJourneys.find(j => j.id === journeyId.value)
    : store.journeys.find(j => j.id === journeyId.value),
)
const nodes = computed<FlowNode[]>(() =>
  (isData.value ? dataStore.flows[journeyId.value] : store.journeyFlows[journeyId.value]) ?? [],
)
const domainCatalog = computed(() => (isData.value ? dataNodeCatalog : nodeCatalog))

function setStatus(status: JourneyStatus) {
  if (isData.value) dataStore.setDataJourneyStatus(journeyId.value, status)
  else store.setJourneyStatus(journeyId.value, status)
}

// Node colour is driven purely by category (the Liquid Sky reference colour-codes
// by step type, never per-node): triggers=blue, actions=green,
// filters=purple (stands in for the reference navy), delays=amber (for pink).
const categoryColor: Record<NodeCategory, string> = {
  trigger: 'primary',
  action: 'success',
  filter: 'secondary',
  delay: 'warning',
  end: 'grey-darken-1',
}
const journeyName = computed({
  get: () => journey.value?.name ?? '',
  set: v => { if (journey.value && v.trim()) journey.value.name = v.trim() },
})
const journeyStatus = computed(() => journey.value?.status ?? 'Draft')
const editingName = ref(false)
const nameInput = ref('')
const saveSnack = ref(false)
const saveMessage = ref('Journey saved')
const selectedNodeId = ref<string | null>(null)

// Step palette — the full legacy node catalog, grouped by category. Section
// dots reuse the same category colour as the nodes they create (see categoryColor).
// Data journeys expose triggers + actions only (mirrors the legacy palette).
interface PaletteSection { key: string; label: string; color: string; items: CatalogItem[] }

const paletteSections = computed<PaletteSection[]>(() => {
  const catalog = domainCatalog.value
  const sections: PaletteSection[] = [
    { key: 'triggers', label: 'Triggers', color: 'primary', items: catalog.filter(i => i.category === 'trigger') },
    { key: 'actions', label: 'Actions', color: 'success', items: catalog.filter(i => i.category === 'action') },
  ]
  if (!isData.value) {
    sections.push(
      { key: 'logic', label: 'Logic & Filters', color: 'secondary', items: catalog.filter(i => i.category === 'filter') },
      { key: 'delay', label: 'Delays', color: 'warning', items: catalog.filter(i => i.category === 'delay') },
    )
  }
  return sections
})

const openSections = reactive<Record<string, boolean>>({ triggers: true, actions: true, logic: true, delay: true })
function toggleSection(key: string) { openSections[key] = !openSections[key] }

// Palette search — filters items across sections; matching sections auto-expand.
const paletteQuery = ref('')
const visibleSections = computed(() => {
  const q = paletteQuery.value.trim().toLowerCase()
  if (!q) return paletteSections.value
  return paletteSections.value
    .map(s => ({ ...s, items: s.items.filter(i => `${i.title} ${i.subtitle}`.toLowerCase().includes(q)) }))
    .filter(s => s.items.length > 0)
})

const selectedNode = computed(() => nodes.value.find(n => n.id === selectedNodeId.value))
const segments = computed(() => buildSegments(nodes.value))

// ── Node interactions ────────────────────────────────────────────────────────
function selectNode(id: string) { selectedNodeId.value = id }

function lastMainNodeId(): string {
  let curId = nodes.value[0]?.id
  let guard = 0
  while (curId && guard++ < 200) {
    const n = nodes.value.find(x => x.id === curId)
    if (!n || n.children.length === 0) break
    curId = n.children[0]
  }
  return curId ?? nodes.value[0]?.id ?? ''
}

function addNodeAfter(afterId: string, item: CatalogItem, childIndex = 0) {
  const newNode = insertNodeAfter(nodes.value, afterId, item, childIndex)
  selectedNodeId.value = newNode.id
}

function addFromPalette(item: CatalogItem) {
  if (item.category === 'trigger') {
    const root = nodes.value[0]
    if (root) {
      root.kind = item.kind; root.title = item.title; root.subtitle = item.subtitle
      root.icon = item.icon; root.config = {}; root.configured = item.fields.length === 0
      selectedNodeId.value = root.id
    }
    return
  }
  addNodeAfter(selectedNodeId.value ?? lastMainNodeId(), item)
}

function duplicateNode(id: string) {
  const src = nodes.value.find(n => n.id === id)
  if (!src || src.category === 'trigger' || src.category === 'filter') return
  const item = catalogByKind[src.kind]
  if (!item) return
  const copy = insertNodeAfter(nodes.value, id, item)
  copy.title = `${src.title} (copy)`
  copy.subtitle = src.subtitle
  copy.config = { ...src.config }
  copy.configured = src.configured
  selectedNodeId.value = copy.id
}

const deleteDialog = ref(false)
const deleteTargetId = ref<string | null>(null)
const deleteTarget = computed(() => nodes.value.find(n => n.id === deleteTargetId.value))

function deleteNode(id: string) {
  const target = nodes.value.find(n => n.id === id)
  if (!target || target.category === 'trigger') return
  if (target.category === 'filter') {
    // Deleting a split removes its branch subtrees — confirm first.
    deleteTargetId.value = id
    deleteDialog.value = true
    return
  }
  performDelete(id)
}

function confirmDelete() {
  if (deleteTargetId.value) performDelete(deleteTargetId.value)
  deleteDialog.value = false
  deleteTargetId.value = null
}

function performDelete(id: string) {
  const removed = removeNode(nodes.value, id)
  if (selectedNodeId.value && removed.includes(selectedNodeId.value)) selectedNodeId.value = null
}

// ── Config panel draft (name + description + schema-driven fields) ───────────
const draft = reactive({ title: '', subtitle: '' })
const draftConfig = ref<Record<string, string | number | boolean>>({})
const selectedFields = computed(() => catalogByKind[selectedNode.value?.kind ?? '']?.fields ?? [])

watch(selectedNodeId, () => {
  const n = selectedNode.value
  if (!n) return
  draft.title = n.title
  draft.subtitle = n.subtitle
  const config: Record<string, string | number | boolean> = {}
  for (const f of catalogByKind[n.kind]?.fields ?? []) {
    config[f.key] = n.config[f.key] ?? (f.type === 'switch' ? false : f.type === 'select' ? f.options?.[0] ?? '' : '')
  }
  draftConfig.value = config
})

function saveNode() {
  const n = selectedNode.value
  if (n) {
    n.title = draft.title.trim() || n.title
    n.subtitle = draft.subtitle
    for (const f of selectedFields.value) {
      const v = draftConfig.value[f.key]
      n.config[f.key] = f.type === 'number' ? Number(v) || 0 : v ?? ''
    }
    n.configured = true
  }
  saveMessage.value = 'Step updated'
  saveSnack.value = true
  selectedNodeId.value = null
}
function cancelPanel() { selectedNodeId.value = null }

function saveDraftJourney() { saveMessage.value = 'Draft saved'; saveSnack.value = true }

const copilot = useCopilotStore()
function askDaVinci() {
  copilot.openWithPrompt(`Review my ${entityLabel.value} "${journeyName.value}" and suggest improvements to timing and copy.`)
}

// ── Pre-activate validation ───────────────────────────────────────────────────
const issues = computed(() => flowValidation(nodes.value))
const issueErrors = computed(() => issues.value.filter(i => i.level === 'error'))
const issuesOpen = ref(false)

function tryActivate() {
  if (journeyStatus.value === 'Active') {
    setStatus('Paused')
    saveMessage.value = 'Journey paused'
    saveSnack.value = true
    void nextTick(() => { issuesOpen.value = false })
    return
  }
  if (issueErrors.value.length > 0) {
    issuesOpen.value = true
    return
  }
  setStatus('Active')
  saveMessage.value = 'Journey activated'
  saveSnack.value = true
  void nextTick(() => { issuesOpen.value = false })
}

function jumpToIssue(nodeId?: string) {
  if (nodeId) selectedNodeId.value = nodeId
  issuesOpen.value = false
}

// ── Canvas zoom ───────────────────────────────────────────────────────────────
const zoom = ref(1)
const zoomPct = computed(() => Math.round(zoom.value * 100))
const zoomStyle = computed(() => ({ transform: `scale(${zoom.value})`, transformOrigin: 'top center' }))
function zoomIn() { zoom.value = Math.min(1.5, +(zoom.value + 0.1).toFixed(2)) }
function zoomOut() { zoom.value = Math.max(0.5, +(zoom.value - 0.1).toFixed(2)) }
function resetZoom() { zoom.value = 1 }

// ── Keyboard: Escape closes the config panel ──────────────────────────────────
function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && selectedNodeId.value) selectedNodeId.value = null
}
onMounted(() => window.addEventListener('keydown', onEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape))

const categoryLabel = (c: NodeCategory) => ({ trigger: 'Trigger', action: 'Action', filter: 'Filter', delay: 'Delay', end: 'End' })[c]
</script>

<template>
  <div v-if="!journey" class="jb-root d-flex align-center justify-center">
    <MpEmptyState icon="search-x" :title="`${isData ? 'Data journey' : 'Journey'} not found`"
      :description="`This ${entityLabel} doesn't exist or was deleted.`" actionLabel="Back to the list" actionIcon="arrow-left"
      @action="router.push(listRoute)" />
  </div>

  <div v-else class="jb-root d-flex flex-column">
    <!-- Toolbar -->
    <div class="jb-toolbar d-flex align-center justify-space-between px-5 border-b bg-surface">
      <div class="d-flex align-center gap-3" style="min-width:0;">
        <v-tooltip :text="isData ? 'Back to Data Journeys' : 'Back to Journeys'" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="arrow-left" variant="text" size="small"
              :aria-label="isData ? 'Back to Data Journeys' : 'Back to Journeys'"
              @click="router.push(listRoute)"></v-btn>
          </template>
        </v-tooltip>
        <div v-if="!editingName" class="font-weight-bold text-body-1 text-truncate jb-name" role="button" tabindex="0"
          aria-label="Rename journey" @click="editingName = true; nameInput = journeyName"
          @keydown.enter.prevent="editingName = true; nameInput = journeyName">
          {{ journeyName }}
        </div>
        <v-text-field v-else v-model="nameInput" variant="outlined" density="compact" hide-details autofocus
          style="width:320px;" aria-label="Journey name"
          @blur="journeyName = nameInput; editingName = false" @keyup.enter="journeyName = nameInput; editingName = false"></v-text-field>
        <MpStatusChip :status="journeyStatus" type="general" size="x-small" />
      </div>
      <div class="d-flex align-center gap-2">
        <v-tooltip text="Ask Da Vinci to review this journey" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="sparkles" variant="text" size="small" color="primary"
              aria-label="Ask Da Vinci to review this journey" @click="askDaVinci"></v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Journey settings" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="settings" variant="text" size="small" aria-label="Journey settings"></v-btn>
          </template>
        </v-tooltip>
        <v-btn v-if="issues.length" variant="text" size="small" class="text-none" prepend-icon="triangle-alert"
          :color="issueErrors.length ? 'error' : 'warning'" @click="issuesOpen = true">
          {{ issues.length }} {{ issues.length === 1 ? 'issue' : 'issues' }}
        </v-btn>
        <v-divider vertical class="mx-1" style="height:24px;"></v-divider>
        <v-btn variant="outlined" size="small" class="text-none" prepend-icon="save" @click="saveDraftJourney">Save draft</v-btn>
        <v-menu v-model="issuesOpen" :close-on-content-click="false" :open-on-click="false" location="bottom end">
          <template #activator="{ props: menu }">
            <v-btn v-bind="menu" color="primary" variant="flat" size="small" class="text-none"
              :prepend-icon="journeyStatus === 'Active' ? 'pause' : 'play'" @click.stop="tryActivate">
              {{ journeyStatus === 'Active' ? 'Pause' : 'Activate' }}
            </v-btn>
          </template>
          <v-card rounded="lg" border flat width="360" class="py-1">
            <div class="px-4 py-2 border-b d-flex align-center gap-2">
              <v-icon size="16" :color="issueErrors.length ? 'error' : 'warning'">triangle-alert</v-icon>
              <span class="text-body-2 font-weight-bold">
                {{ issueErrors.length ? 'Fix these before activating' : 'Heads up' }}
              </span>
              <v-btn icon="x" variant="text" size="x-small" class="ml-auto" aria-label="Close issues" @click="issuesOpen = false"></v-btn>
            </div>
            <v-list density="compact" nav max-height="300" class="overflow-y-auto">
              <v-list-item v-for="(issue, i) in issues" :key="i" rounded="lg"
                :disabled="!issue.nodeId" @click="jumpToIssue(issue.nodeId)">
                <template #prepend>
                  <v-icon size="15" :color="issue.level === 'error' ? 'error' : 'warning'">
                    {{ issue.level === 'error' ? 'circle-alert' : 'triangle-alert' }}
                  </v-icon>
                </template>
                <v-list-item-title class="text-caption ml-2" style="white-space: normal;">{{ issue.message }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </div>

    <!-- Body -->
    <div class="d-flex flex-grow-1" style="overflow:hidden;">
      <!-- Palette -->
      <aside class="jb-palette border-r bg-surface d-flex flex-column">
        <div class="pa-3 border-b">
          <div class="text-overline text-medium-emphasis" style="line-height:1.2;">Journey steps</div>
          <div class="text-caption text-medium-emphasis mb-2">Click a step to add it to your flow</div>
          <v-text-field v-model="paletteQuery" placeholder="Search steps..." variant="outlined" density="compact"
            hide-details clearable prepend-inner-icon="search" aria-label="Search steps" />
        </div>
        <div class="flex-grow-1 overflow-y-auto pa-2">
          <div v-if="visibleSections.length === 0" class="text-caption text-medium-emphasis text-center pa-4">
            No steps match "{{ paletteQuery }}"
          </div>
          <div v-for="s in visibleSections" :key="s.key" class="palette-section">
            <button class="palette-section__header" :aria-expanded="openSections[s.key]" :aria-controls="`palette-${s.key}`"
              @click="toggleSection(s.key)">
              <span class="palette-dot" :style="{ backgroundColor: `rgb(var(--v-theme-${s.color}))` }"></span>
              <span class="palette-section__label">{{ s.label }}</span>
              <span class="text-caption text-disabled mr-1">{{ s.items.length }}</span>
              <v-icon size="18" class="palette-chevron" :class="{ 'palette-chevron--open': openSections[s.key] }">chevron-down</v-icon>
            </button>
            <div v-show="openSections[s.key] || paletteQuery" :id="`palette-${s.key}`" class="palette-section__items">
              <button v-for="item in s.items" :key="item.kind" class="palette-item" @click="addFromPalette(item)">
                <v-avatar :color="categoryColor[item.category]" size="28" rounded="lg">
                  <v-icon color="white" size="15">{{ item.icon }}</v-icon>
                </v-avatar>
                <span class="palette-item__text">
                  <span class="palette-item__title">{{ item.title }}</span>
                  <span class="palette-item__sub">{{ item.subtitle }}</span>
                </span>
                <v-icon size="15" class="palette-item__add">plus</v-icon>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Canvas -->
      <div class="jb-canvas bg-background">
        <div class="jb-canvas__scroll">
          <div class="d-flex flex-column align-center pa-8" :style="zoomStyle">
            <div class="d-flex flex-column align-center" style="min-width:460px;">
              <JourneyFlowColumn :segments="segments" :selected-id="selectedNodeId" :catalog="domainCatalog"
                @select="selectNode"
                @add="(afterId, item, childIndex) => addNodeAfter(afterId, item, childIndex)"
                @duplicate="duplicateNode"
                @remove="deleteNode" />
            </div>
          </div>
        </div>

        <!-- Zoom controls -->
        <div class="jb-zoom d-flex align-center bg-surface border rounded-lg">
          <v-tooltip text="Reset zoom" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="maximize" variant="text" size="small" aria-label="Reset zoom" @click="resetZoom"></v-btn>
            </template>
          </v-tooltip>
          <v-divider vertical style="height:20px;"></v-divider>
          <v-btn icon="zoom-out" variant="text" size="small" aria-label="Zoom out" :disabled="zoom <= 0.5" @click="zoomOut"></v-btn>
          <span class="jb-zoom__pct text-caption font-weight-medium">{{ zoomPct }}%</span>
          <v-btn icon="zoom-in" variant="text" size="small" aria-label="Zoom in" :disabled="zoom >= 1.5" @click="zoomIn"></v-btn>
        </div>
      </div>

      <!-- Config panel -->
      <aside v-if="selectedNode" class="jb-panel border-l bg-surface d-flex flex-column">
        <div class="pa-4 border-b d-flex align-center justify-space-between flex-shrink-0">
          <div class="d-flex align-center gap-3" style="min-width:0;">
            <v-avatar :color="categoryColor[selectedNode.category]" size="32" rounded="lg" class="flex-shrink-0">
              <v-icon color="white" size="17">{{ selectedNode.icon }}</v-icon>
            </v-avatar>
            <div style="min-width:0;">
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase">{{ categoryLabel(selectedNode.category) }}</div>
              <div class="text-body-2 font-weight-bold text-truncate">{{ selectedNode.title }}</div>
            </div>
          </div>
          <v-btn icon="x" variant="text" size="small" aria-label="Close settings panel" @click="cancelPanel"></v-btn>
        </div>

        <div class="pa-4 flex-grow-1 overflow-y-auto">
          <v-alert v-if="!selectedNode.configured" type="warning" variant="tonal" density="compact" rounded="lg" class="text-caption mb-4">
            This step isn't configured yet — review the settings below and save.
          </v-alert>

          <v-text-field v-model="draft.title" label="Step name" variant="outlined" density="compact" class="mb-3"></v-text-field>
          <v-text-field v-model="draft.subtitle" label="Description" variant="outlined" density="compact" class="mb-4"></v-text-field>
          <v-divider v-if="selectedFields.length" class="mb-4"></v-divider>

          <!-- Schema-driven fields from the node catalog -->
          <template v-for="f in selectedFields" :key="f.key">
            <v-select v-if="f.type === 'select'" :model-value="String(draftConfig[f.key] ?? '')" :label="f.label" :items="f.options"
              variant="outlined" density="compact" class="mb-3"
              @update:model-value="(v: string) => draftConfig[f.key] = v"></v-select>
            <v-text-field v-else-if="f.type === 'number'" :model-value="String(draftConfig[f.key] ?? '')" :label="f.label" type="number"
              variant="outlined" density="compact" class="mb-3"
              @update:model-value="(v: string) => draftConfig[f.key] = v"></v-text-field>
            <v-switch v-else-if="f.type === 'switch'" v-model="draftConfig[f.key]" :label="f.label"
              color="primary" density="compact" hide-details class="mb-3"></v-switch>
            <v-text-field v-else :model-value="String(draftConfig[f.key] ?? '')" :label="f.label"
              variant="outlined" density="compact" class="mb-3"
              @update:model-value="(v: string) => draftConfig[f.key] = v"></v-text-field>
          </template>

          <v-alert v-if="selectedNode.category === 'delay'" type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">
            Journey pauses here before moving to the next step.
          </v-alert>
          <v-alert v-else-if="selectedNode.category === 'filter'" type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">
            Contacts are routed into one of the branches: {{ (selectedNode.branchLabels ?? []).join(' · ') }}.
          </v-alert>
        </div>

        <div class="pa-4 border-t d-flex gap-2 flex-shrink-0">
          <v-btn variant="outlined" class="text-none flex-grow-1" @click="cancelPanel">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none flex-grow-1" @click="saveNode">Save</v-btn>
        </div>
      </aside>
    </div>

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ saveMessage }}</div>
    </v-snackbar>

    <MpConfirmDialog
      v-model="deleteDialog"
      danger
      title="Delete this split?"
      :message="`Deleting &quot;${deleteTarget?.title}&quot; also removes every step inside its branches. Steps after the point where the branches rejoin are kept.`"
      confirm-label="Delete split"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.jb-root { height: 100vh; overflow: hidden; }
.jb-toolbar { height: 56px; flex-shrink: 0; }
.jb-name { cursor: pointer; border-radius: 6px; padding: 2px 6px; margin: -2px -6px; transition: background 0.15s; }
.jb-name:hover { background: rgba(var(--v-theme-on-surface), 0.06); }
.jb-name:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-l { border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

/* ── Palette ─────────────────────────────────────────────────────────────── */
.jb-palette { width: 248px; flex-shrink: 0; overflow: hidden; }
.palette-section { margin-bottom: 4px; }
.palette-section__header {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 8px; border: 0; background: transparent; cursor: pointer;
  border-radius: 8px; text-align: left; color: rgb(var(--v-theme-on-surface));
}
.palette-section__header:hover { background: rgba(var(--v-theme-on-surface), 0.05); }
.palette-section__header:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.palette-dot { width: 8px; height: 8px; border-radius: 3px; flex-shrink: 0; }
.palette-section__label { flex: 1; font-size: 0.8125rem; font-weight: 700; }
.palette-chevron { transition: transform 0.2s ease; color: rgba(var(--v-theme-on-surface), 0.5); }
.palette-chevron--open { transform: rotate(180deg); }
.palette-section__items { padding: 2px 0 6px; }

.palette-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 7px 8px; border: 0; background: transparent; cursor: pointer;
  border-radius: 8px; text-align: left; transition: background 0.15s;
}
.palette-item:hover { background: rgba(var(--v-theme-primary), 0.08); }
.palette-item:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.palette-item__text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.palette-item__title { font-size: 0.75rem; font-weight: 700; line-height: 1.3; color: rgb(var(--v-theme-on-surface)); }
.palette-item__sub { font-size: 0.6875rem; line-height: 1.3; color: rgba(var(--v-theme-on-surface), 0.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.palette-item__add { color: rgba(var(--v-theme-on-surface), 0.35); flex-shrink: 0; }
.palette-item:hover .palette-item__add { color: rgb(var(--v-theme-primary)); }

/* ── Canvas ──────────────────────────────────────────────────────────────── */
.jb-canvas { flex: 1 1 auto; position: relative; overflow: hidden; }
.jb-canvas__scroll { position: absolute; inset: 0; overflow: auto; }

/* Node card, connector, and branch styles live in JourneyFlowColumn.vue */

/* ── Zoom controls ───────────────────────────────────────────────────────── */
.jb-zoom { position: absolute; bottom: 16px; right: 16px; padding: 2px; gap: 2px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.jb-zoom__pct { min-width: 40px; text-align: center; color: rgba(var(--v-theme-on-surface), 0.7); }

/* ── Config panel ────────────────────────────────────────────────────────── */
.jb-panel { width: 340px; flex-shrink: 0; overflow: hidden; }
</style>
