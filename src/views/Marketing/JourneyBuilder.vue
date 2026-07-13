<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import JourneyFlowColumn from '@/components/marketing/JourneyFlowColumn.vue'
import { categoryColor, categoryLabel } from '@/components/marketing/flowTheme'
import { useCampaignsStore, type JourneyStatus } from '@/stores/useCampaigns'
import { useDataJourneysStore } from '@/stores/useDataJourneys'
import { useCopilotStore } from '@/stores/useCopilot'
import { useContentStore } from '@/stores/useContent'
import type { CatalogItem, FlowNode } from '@/stores/journeyFlowData'
import { catalogByKind, dataNodeCatalog, nodeCatalog } from '@/stores/journeyFlowData'
import { addNodeAfter as insertNodeAfter, buildSegments, detachNode, flowValidation, removeNode, type FlowSegment } from '@/composables/useFlowTree'

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
const contentStore = useContentStore()
const contentNames = computed(() => contentStore.items.map(c => c.name))
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

// ── Save persistence + dirty indicator ───────────────────────────────────────
// Node edits already mutate the store's live flow array; "persisting" stamps an
// updated timestamp (marketing journeys only — data journeys have no such API)
// and moves the dirty snapshot forward so the "Unsaved changes" chip clears.
const savedSnapshot = ref('')
function snapshotNodes() { savedSnapshot.value = JSON.stringify(nodes.value) }
watch(journeyId, () => snapshotNodes(), { immediate: true })
const isDirty = computed(() => JSON.stringify(nodes.value) !== savedSnapshot.value)

function persistFlow() {
  if (!isData.value) store.saveJourneyFlow(journeyId.value, nodes.value)
  snapshotNodes()
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

// Icon-tile accent (soft container + colored glyph) shared by palette rows and
// the config-panel header; 'end' has no theme CSS var → neutral mix.
const tileStyle = (c: keyof typeof categoryColor) => c === 'end'
  ? { background: 'rgba(var(--v-theme-on-surface), 0.08)', color: 'rgba(var(--v-theme-on-surface), 0.65)' }
  : { background: `rgba(var(--v-theme-${categoryColor[c]}), 0.12)`, color: `rgb(var(--v-theme-${categoryColor[c]}))` }

// Step palette — the full legacy node catalog, grouped by category. Section
// dots reuse the same category colour as the nodes they create (flowTheme).
// Data journeys expose triggers + actions only (mirrors the legacy palette).
interface PaletteSection { key: string; label: string; color: string; items: CatalogItem[] }

const paletteSections = computed<PaletteSection[]>(() => {
  const catalog = domainCatalog.value
  const sections: PaletteSection[] = [
    { key: 'triggers', label: 'Triggers', color: categoryColor.trigger, items: catalog.filter(i => i.category === 'trigger') },
    { key: 'actions', label: 'Actions', color: categoryColor.action, items: catalog.filter(i => i.category === 'action') },
  ]
  if (!isData.value) {
    sections.push(
      { key: 'logic', label: 'Logic & Filters', color: categoryColor.filter, items: catalog.filter(i => i.category === 'filter') },
      { key: 'delay', label: 'Delays', color: categoryColor.delay, items: catalog.filter(i => i.category === 'delay') },
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

// ── Detach ────────────────────────────────────────────────────────────────────
// "Detach" (config panel footer) unlinks a step from the flow but keeps it
// around — parked in a "detached steps" tray — rather than deleting it outright.
const detachedNodes = computed(() => nodes.value.filter(n => n.detached))
const canDetach = computed(() => {
  const c = selectedNode.value?.category
  return c === 'action' || c === 'delay'
})
function detachSelected() {
  if (!selectedNode.value || !canDetach.value) return
  detachNode(nodes.value, selectedNode.value.id)
  selectedNodeId.value = null
}
function purgeDetached(id: string) {
  const idx = nodes.value.findIndex(n => n.id === id)
  if (idx !== -1) nodes.value.splice(idx, 1)
}

// ── Config panel draft (name + description + schema-driven fields) ───────────
const draft = reactive({ title: '', subtitle: '' })
const draftConfig = ref<Record<string, string | number | boolean | string[]>>({})
const selectedFields = computed(() => catalogByKind[selectedNode.value?.kind ?? '']?.fields ?? [])

watch(selectedNodeId, () => {
  const n = selectedNode.value
  if (!n) return
  draft.title = n.title
  draft.subtitle = n.subtitle
  const config: Record<string, string | number | boolean | string[]> = {}
  for (const f of catalogByKind[n.kind]?.fields ?? []) {
    const existing = n.config[f.key]
    if (existing != null) { config[f.key] = existing; continue }
    if (f.default != null) { config[f.key] = f.default; continue }
    config[f.key] = f.type === 'switch' ? false
      : f.type === 'multi-select' ? []
      : f.type === 'select' || f.type === 'content-picker' ? f.options?.[0] ?? ''
      : ''
  }
  draftConfig.value = config
})

// Keep the selected card in view — the config panel narrows the canvas and can
// otherwise hide the very node being edited. Instant (non-smooth) scroll: smooth
// scrolling is rAF-driven and silently stalls in hidden/backgrounded tabs.
watch(selectedNodeId, id => {
  if (!id) return
  void nextTick(() => {
    canvasEl.value?.querySelector('.flow-node--selected')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  })
})

function saveNode() {
  const n = selectedNode.value
  if (n) {
    n.title = draft.title.trim() || n.title
    n.subtitle = draft.subtitle
    for (const f of selectedFields.value) {
      const v = draftConfig.value[f.key]
      n.config[f.key] = f.type === 'number' ? Number(v) || 0 : (v ?? (f.type === 'multi-select' ? [] : ''))
    }
    n.configured = true
  }
  saveMessage.value = 'Step updated'
  saveSnack.value = true
  selectedNodeId.value = null
}
function cancelPanel() { selectedNodeId.value = null }

function removeSelected() {
  if (!selectedNode.value) return
  deleteNode(selectedNode.value.id)
}

function saveDraftJourney() {
  persistFlow()
  saveMessage.value = 'Draft saved'
  saveSnack.value = true
}

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
    persistFlow()
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
  persistFlow()
  saveMessage.value = 'Journey activated'
  saveSnack.value = true
  void nextTick(() => { issuesOpen.value = false })
}

// Jump-to-issue: select, scroll to, and pulse the offending node once.
const flashNodeId = ref<string | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | undefined
function jumpToIssue(nodeId?: string) {
  issuesOpen.value = false
  if (!nodeId) return
  selectedNodeId.value = nodeId
  flashNodeId.value = null
  void nextTick(() => { flashNodeId.value = nodeId })
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flashNodeId.value = null }, 1400)
}

// ── Node config panel: live-stats strip ──────────────────────────────────────
// Mock, deterministic contact stats per node (no Math.random in render): seeded
// from the node's own contact count where the store has one, otherwise from a
// hash of its id; the refresh icon bumps a per-node counter to vary the number.
const statsRefreshSeed = reactive<Record<string, number>>({})
function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function refreshStats(nodeId: string) {
  statsRefreshSeed[nodeId] = (statsRefreshSeed[nodeId] ?? 0) + 1
}
const nodeStatValue = computed(() => {
  const n = selectedNode.value
  if (!n) return 0
  const seed = statsRefreshSeed[n.id] ?? 0
  if (n.contacts != null) {
    if (seed === 0) return n.contacts
    const delta = (hashSeed(`${n.id}:${seed}`) % 41) - 20
    return Math.max(0, n.contacts + delta)
  }
  return 50 + (hashSeed(`${n.id}:${seed}`) % 950)
})
const statsDescription = computed(() => {
  switch (selectedNode.value?.category) {
    case 'trigger': return 'contacts entered through this trigger'
    case 'delay': return 'contacts waiting in this delay'
    case 'filter': return 'contacts routed through this split'
    case 'action': return 'contacts passed through this step'
    default: return ''
  }
})

// ── Canvas zoom + pan ─────────────────────────────────────────────────────────
// Zoom uses the CSS `zoom` property (not transform:scale) so the scrollable
// area grows/shrinks with the content and nothing clips off-screen; focal-point
// compensation then works in plain layout coordinates.
const canvasEl = ref<HTMLElement | null>(null)
const zoom = ref(1)
const zoomPct = computed(() => Math.round(zoom.value * 100))
const zoomStyle = computed(() => ({ zoom: String(zoom.value) }))

function setZoomAround(next: number, focalX?: number, focalY?: number) {
  const el = canvasEl.value
  const clamped = Math.min(1.5, Math.max(0.5, +next.toFixed(2)))
  if (clamped === zoom.value) return
  if (!el) { zoom.value = clamped; return }
  const fx = focalX ?? el.clientWidth / 2
  const fy = focalY ?? el.clientHeight / 2
  const ratio = clamped / zoom.value
  const sl = el.scrollLeft
  const st = el.scrollTop
  zoom.value = clamped
  void nextTick(() => {
    el.scrollLeft = (sl + fx) * ratio - fx
    el.scrollTop = (st + fy) * ratio - fy
  })
}
function zoomIn() { setZoomAround(zoom.value + 0.1) }
function zoomOut() { setZoomAround(zoom.value - 0.1) }
function resetZoom() { setZoomAround(1) }

function fitToView() {
  const el = canvasEl.value
  if (!el) return
  const contentW = el.scrollWidth / zoom.value
  const contentH = el.scrollHeight / zoom.value
  const next = Math.min(1.5, Math.max(0.5, Math.min(el.clientWidth / contentW, el.clientHeight / contentH) * 0.97))
  zoom.value = +next.toFixed(2)
  void nextTick(() => {
    el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
    el.scrollTop = 0
  })
}

// Ctrl/Cmd + wheel zooms around the cursor; plain wheel keeps scrolling.
// Needs a non-passive listener to preventDefault the browser page-zoom.
function onCanvasWheel(e: WheelEvent) {
  if (!(e.ctrlKey || e.metaKey) || !canvasEl.value) return
  e.preventDefault()
  const rect = canvasEl.value.getBoundingClientRect()
  setZoomAround(zoom.value + (e.deltaY < 0 ? 0.1 : -0.1), e.clientX - rect.left, e.clientY - rect.top)
}
watch(canvasEl, (el, old) => {
  old?.removeEventListener('wheel', onCanvasWheel)
  el?.addEventListener('wheel', onCanvasWheel, { passive: false })
})

// Drag-to-pan on empty canvas: 3px threshold so node clicks stay clicks.
const isPanning = ref(false)
let panPointer: number | null = null
let panStart = { x: 0, y: 0, left: 0, top: 0 }

function onCanvasPointerDown(e: PointerEvent) {
  const el = canvasEl.value
  if (e.button !== 0 || !el) return
  if ((e.target as HTMLElement).closest('.flow-node, button, a, input, .v-chip')) return
  panPointer = e.pointerId
  panStart = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
}
function onCanvasPointerMove(e: PointerEvent) {
  const el = canvasEl.value
  if (panPointer !== e.pointerId || !el) return
  const dx = e.clientX - panStart.x
  const dy = e.clientY - panStart.y
  if (!isPanning.value && Math.hypot(dx, dy) < 3) return
  if (!isPanning.value) {
    isPanning.value = true
    // Pointer may already be gone (released off-window / synthetic events).
    try { el.setPointerCapture(e.pointerId) } catch { /* pan still works, uncaptured */ }
  }
  el.scrollLeft = panStart.left - dx
  el.scrollTop = panStart.top - dy
}
function onCanvasPointerUp(e: PointerEvent) {
  if (panPointer !== e.pointerId) return
  panPointer = null
  isPanning.value = false
}

// ── Keyboard: arrows walk the flow, Delete removes, Escape closes ────────────
function flattenSegs(segs: FlowSegment[], out: string[] = []): string[] {
  for (const s of segs) {
    out.push(s.node.id)
    if (s.branches) for (const b of s.branches) { if (!b.empty) flattenSegs(b.segments, out) }
  }
  return out
}
const flatIds = computed(() => flattenSegs(segments.value))

function onKeydown(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) return
  if (e.key === 'Escape') {
    if (selectedNodeId.value) selectedNodeId.value = null
    return
  }
  const down = e.key === 'ArrowDown' || e.key === 'Down'
  const up = e.key === 'ArrowUp' || e.key === 'Up'
  if (down || up) {
    const ids = flatIds.value
    if (!ids.length) return
    e.preventDefault()
    const idx = selectedNodeId.value ? ids.indexOf(selectedNodeId.value) : -1
    selectedNodeId.value = down
      ? ids[Math.min(ids.length - 1, idx + 1)] ?? null
      : ids[Math.max(0, idx <= 0 ? 0 : idx - 1)] ?? null
    return
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode.value && selectedNode.value.category !== 'trigger') {
    e.preventDefault()
    deleteNode(selectedNode.value.id)
  }
}
window.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  canvasEl.value?.removeEventListener('wheel', onCanvasWheel)
  clearTimeout(flashTimer)
})
</script>

<template>
  <div v-if="!journey" class="jb-root d-flex align-center justify-center">
    <MpEmptyState icon="search-x" :title="`${isData ? 'Data journey' : 'Journey'} not found`"
      :description="`This ${entityLabel} doesn't exist or was deleted.`" actionLabel="Back to the list" actionIcon="arrow-left"
      @action="router.push(listRoute)" />
  </div>

  <div v-else class="jb-root d-flex flex-column">
    <!-- Toolbar -->
    <div class="jb-toolbar d-flex align-center justify-space-between px-5 bg-surface">
      <div class="d-flex align-center gap-3" style="min-width:0;">
        <v-tooltip :text="isData ? 'Back to Data Journeys' : 'Back to Journeys'" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="chevron-left" variant="text" size="small"
              :aria-label="isData ? 'Back to Data Journeys' : 'Back to Journeys'"
              @click="router.push(listRoute)"></v-btn>
          </template>
        </v-tooltip>
        <div v-if="!editingName" class="text-truncate jb-name" role="button" tabindex="0"
          aria-label="Rename journey" @click="editingName = true; nameInput = journeyName"
          @keydown.enter.prevent="editingName = true; nameInput = journeyName">
          {{ journeyName }}
          <v-icon size="13" class="jb-name__pencil ml-1">pencil</v-icon>
        </div>
        <v-text-field v-else v-model="nameInput" variant="outlined" density="compact" hide-details autofocus
          style="width:320px;" aria-label="Journey name"
          @blur="journeyName = nameInput; editingName = false" @keyup.enter="journeyName = nameInput; editingName = false"></v-text-field>
        <MpStatusChip :status="journeyStatus" type="general" size="x-small" />
        <v-chip v-if="isDirty" size="x-small" color="warning" variant="tonal" class="font-weight-bold flex-shrink-0">
          <v-icon start size="11">circle-dashed</v-icon>Unsaved changes
        </v-chip>
        <v-chip v-else size="x-small" variant="text" class="font-weight-medium text-medium-emphasis flex-shrink-0">
          <v-icon start size="11" color="success">circle-check</v-icon>Saved
        </v-chip>
      </div>
      <div class="d-flex align-center gap-2">
        <v-tooltip text="Ask Da Vinci to review this journey" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="sparkles" variant="text" size="small" class="jb-davinci"
              aria-label="Ask Da Vinci to review this journey" @click="askDaVinci"></v-btn>
          </template>
        </v-tooltip>
        <v-btn v-if="issues.length" variant="tonal" size="small" rounded="pill" class="text-none" prepend-icon="triangle-alert"
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
                <template v-if="issue.nodeId" #append>
                  <v-icon size="13" class="text-disabled">locate</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </div>

    <!-- Detached steps tray -->
    <div v-if="detachedNodes.length" class="jb-detached d-flex align-center flex-wrap gap-2 px-5 py-2 border-b bg-surface flex-shrink-0">
      <v-icon size="16" class="text-medium-emphasis">unlink</v-icon>
      <span class="text-caption font-weight-bold text-medium-emphasis">
        {{ detachedNodes.length }} detached step{{ detachedNodes.length === 1 ? '' : 's' }}
      </span>
      <v-chip v-for="n in detachedNodes" :key="n.id" size="small" variant="tonal" closable
        :aria-label="`Permanently remove detached step: ${n.title}`" @click:close="purgeDetached(n.id)">
        {{ n.title }}
      </v-chip>
    </div>

    <!-- Body -->
    <div class="d-flex flex-grow-1" style="overflow:hidden;">
      <!-- Palette -->
      <aside class="jb-palette border-r bg-surface d-flex flex-column">
        <div class="pa-3 border-b">
          <div class="mp-meta-label text-medium-emphasis" style="line-height:1.2;">Journey steps</div>
          <div class="text-caption text-medium-emphasis mb-2">Click a step to add it to your flow</div>
          <v-text-field v-model="paletteQuery" placeholder="Search steps..." variant="outlined" density="compact"
            hide-details clearable prepend-inner-icon="search" aria-label="Search steps" class="jb-search" />
        </div>
        <div class="flex-grow-1 overflow-y-auto pa-2 jb-palette__scroll">
          <div v-if="visibleSections.length === 0" class="text-caption text-medium-emphasis text-center pa-4">
            No steps match "{{ paletteQuery }}"
          </div>
          <div v-for="s in visibleSections" :key="s.key" class="palette-section">
            <button class="palette-section__header" :aria-expanded="openSections[s.key]" :aria-controls="`palette-${s.key}`"
              @click="toggleSection(s.key)">
              <span class="palette-dot" :style="{ backgroundColor: `rgb(var(--v-theme-${s.color}))` }"></span>
              <span class="palette-section__label mp-meta-label">{{ s.label }}</span>
              <span class="palette-count">{{ s.items.length }}</span>
              <v-icon size="18" class="palette-chevron" :class="{ 'palette-chevron--open': openSections[s.key] }">chevron-down</v-icon>
            </button>
            <div v-show="openSections[s.key] || paletteQuery" :id="`palette-${s.key}`" class="palette-section__items">
              <button v-for="item in s.items" :key="item.kind" class="palette-item" :title="item.subtitle"
                @click="addFromPalette(item)">
                <span class="palette-tile" :style="tileStyle(item.category)">
                  <v-icon size="15">{{ item.icon }}</v-icon>
                </span>
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
      <div class="jb-canvas">
        <div ref="canvasEl" class="jb-canvas__scroll" :class="{ 'jb-canvas__scroll--panning': isPanning }"
          @pointerdown="onCanvasPointerDown" @pointermove="onCanvasPointerMove"
          @pointerup="onCanvasPointerUp" @pointercancel="onCanvasPointerUp">
          <div class="d-flex flex-column align-center pa-8" :style="zoomStyle">
            <div class="d-flex flex-column align-center" style="min-width:320px;">
              <JourneyFlowColumn :segments="segments" :selected-id="selectedNodeId" :catalog="domainCatalog" :flash-id="flashNodeId"
                @select="selectNode"
                @add="(afterId, item, childIndex) => addNodeAfter(afterId, item, childIndex)"
                @duplicate="duplicateNode"
                @remove="deleteNode" />
            </div>
          </div>
        </div>

        <!-- Zoom controls -->
        <div class="jb-zoom d-flex align-center bg-surface border rounded-lg">
          <v-tooltip text="Fit to view" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="maximize" variant="text" size="small" aria-label="Fit to view" @click="fitToView"></v-btn>
            </template>
          </v-tooltip>
          <v-divider vertical style="height:20px;"></v-divider>
          <v-btn icon="zoom-out" variant="text" size="small" aria-label="Zoom out" :disabled="zoom <= 0.5" @click="zoomOut"></v-btn>
          <v-tooltip text="Reset to 100%" location="top">
            <template #activator="{ props }">
              <button v-bind="props" class="jb-zoom__pct text-caption font-weight-medium" aria-label="Reset zoom to 100%"
                @click="resetZoom">{{ zoomPct }}%</button>
            </template>
          </v-tooltip>
          <v-btn icon="zoom-in" variant="text" size="small" aria-label="Zoom in" :disabled="zoom >= 1.5" @click="zoomIn"></v-btn>
        </div>
      </div>

      <!-- Config panel -->
      <aside v-if="selectedNode" class="jb-panel border-l bg-surface d-flex flex-column">
          <div class="pa-4 border-b d-flex align-center justify-space-between flex-shrink-0">
            <div class="d-flex align-center gap-3" style="min-width:0;">
              <span class="jb-panel__tile flex-shrink-0" :style="tileStyle(selectedNode.category)">
                <v-icon size="17">{{ selectedNode.icon }}</v-icon>
              </span>
              <div style="min-width:0;">
                <div class="jb-panel__eyebrow" :style="{ color: tileStyle(selectedNode.category).color }">
                  {{ categoryLabel[selectedNode.category] }}
                </div>
                <div class="mp-section-title text-truncate">{{ selectedNode.title }}</div>
              </div>
            </div>
            <v-btn icon="x" variant="text" size="small" aria-label="Close settings panel" @click="cancelPanel"></v-btn>
          </div>

          <div class="pa-4 flex-grow-1 overflow-y-auto">
            <v-alert v-if="!selectedNode.configured" type="warning" variant="tonal" density="compact" rounded="lg" class="text-caption mb-4">
              This step isn't configured yet — review the settings below and save.
            </v-alert>

            <!-- Live-stats strip -->
            <div v-if="statsDescription" class="jb-stats d-flex align-center gap-3 pa-3 mb-4 border rounded-lg">
              <v-icon size="16" class="text-medium-emphasis flex-shrink-0">users</v-icon>
              <div class="flex-grow-1" style="min-width:0;">
                <div class="text-body-2 font-weight-bold" style="line-height:1.2;">{{ nodeStatValue.toLocaleString() }}</div>
                <div class="text-caption text-medium-emphasis">{{ statsDescription }}</div>
              </div>
              <router-link :to="{ name: 'AllContacts', params: { accountId } }" class="text-caption font-weight-bold text-primary jb-stats__link">
                View contacts
              </router-link>
              <v-btn icon="refresh-cw" variant="text" size="x-small" aria-label="Refresh contact stats"
                @click="refreshStats(selectedNode.id)"></v-btn>
            </div>

            <div class="jb-section-label mp-meta-label">Step details</div>
            <v-text-field v-model="draft.title" label="Step name" variant="outlined" density="compact" class="mb-3"></v-text-field>
            <v-text-field v-model="draft.subtitle" label="Description" variant="outlined" density="compact" class="mb-4"></v-text-field>

            <template v-if="selectedFields.length">
              <div class="jb-section-label mp-meta-label">Configuration</div>
              <!-- Schema-driven fields from the node catalog -->
              <template v-for="f in selectedFields" :key="f.key">
                <v-select v-if="f.type === 'select'" :model-value="String(draftConfig[f.key] ?? '')" :label="f.label" :items="f.options"
                  variant="outlined" density="compact" class="mb-3"
                  @update:model-value="(v: string) => draftConfig[f.key] = v"></v-select>
                <v-select v-else-if="f.type === 'content-picker'" :model-value="String(draftConfig[f.key] ?? '')" :label="f.label" :items="contentNames"
                  variant="outlined" density="compact" class="mb-3" prepend-inner-icon="file-text"
                  @update:model-value="(v: string) => draftConfig[f.key] = v"></v-select>
                <v-select v-else-if="f.type === 'multi-select'" :model-value="(draftConfig[f.key] as string[] ?? [])" :label="f.label" :items="f.options"
                  variant="outlined" density="compact" class="mb-3" multiple chips closable-chips
                  @update:model-value="(v: string[]) => draftConfig[f.key] = v"></v-select>
                <v-text-field v-else-if="f.type === 'number'" :model-value="String(draftConfig[f.key] ?? '')" :label="f.label" type="number"
                  variant="outlined" density="compact" class="mb-3"
                  @update:model-value="(v: string) => draftConfig[f.key] = v"></v-text-field>
                <v-switch v-else-if="f.type === 'switch'" v-model="draftConfig[f.key]" :label="f.label"
                  color="primary" density="compact" hide-details class="mb-3"></v-switch>
                <v-text-field v-else :model-value="String(draftConfig[f.key] ?? '')" :label="f.label"
                  variant="outlined" density="compact" class="mb-3"
                  @update:model-value="(v: string) => draftConfig[f.key] = v"></v-text-field>
              </template>
            </template>

            <v-alert v-if="selectedNode.category === 'delay'" type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">
              Journey pauses here before moving to the next step.
            </v-alert>
            <v-alert v-else-if="selectedNode.category === 'filter'" type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">
              Contacts are routed into one of the branches: {{ (selectedNode.branchLabels ?? []).join(' · ') }}.
            </v-alert>
          </div>

          <div class="pa-4 border-t d-flex align-center gap-2 flex-shrink-0">
            <v-btn color="primary" variant="flat" class="text-none flex-grow-1" @click="saveNode">Save</v-btn>
            <v-btn variant="tonal" class="text-none" :disabled="!canDetach" @click="detachSelected">Detach</v-btn>
            <v-btn variant="text" color="error" class="text-none px-2" :disabled="selectedNode.category === 'trigger'"
              @click="removeSelected">Remove</v-btn>
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
.jb-toolbar {
  height: 56px; flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.jb-name {
  cursor: pointer; border-radius: 6px; padding: 2px 6px; margin: -2px -6px;
  font-size: 15px; font-weight: 650; color: rgb(var(--v-theme-on-surface));
  transition: background var(--dur-fast) var(--ease);
}
.jb-name:hover { background: rgba(var(--v-theme-on-surface), 0.06); }
.jb-name:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.jb-name__pencil { opacity: 0; color: rgba(var(--v-theme-on-surface), 0.5); transition: opacity var(--dur-fast) var(--ease); }

/* Ask Da Vinci — AI as a quiet utility: muted neutral sparkle, no fill/accent. */
.jb-davinci :deep(.v-icon) { opacity: 0.55; }
.jb-davinci:hover :deep(.v-icon) { opacity: 0.9; }

/* Ghost search — soft on-surface fill, hairline border that recedes. */
.jb-search :deep(.v-field) { background: rgba(var(--v-theme-on-surface), 0.04); }
.jb-search :deep(.v-field__outline__start),
.jb-search :deep(.v-field__outline__notch)::before,
.jb-search :deep(.v-field__outline__notch)::after,
.jb-search :deep(.v-field__outline__end) { opacity: 0.5; }
.jb-name:hover .jb-name__pencil, .jb-name:focus-visible .jb-name__pencil { opacity: 1; }

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-l { border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

/* ── Palette ─────────────────────────────────────────────────────────────── */
.jb-palette { width: 248px; flex-shrink: 0; overflow: hidden; }
.jb-palette__scroll { scrollbar-width: thin; scrollbar-color: rgba(var(--v-theme-on-surface), 0.2) transparent; }
.palette-section { margin-bottom: 4px; }
.palette-section__header {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 8px; border: 0; background: transparent; cursor: pointer;
  border-radius: var(--mp-component-card-radius-sm); text-align: left; color: rgb(var(--v-theme-on-surface));
}
.palette-section__header:hover { background: rgba(var(--v-theme-on-surface), 0.05); }
.palette-section__header:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.palette-dot { width: 8px; height: 8px; border-radius: 3px; flex-shrink: 0; }
.palette-section__label { flex: 1; color: rgba(var(--v-theme-on-surface), 0.6); }
.palette-count {
  font-size: 0.625rem; font-weight: 700; line-height: 1;
  padding: 3px 7px; border-radius: 999px; margin-right: 2px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  background: rgba(var(--v-theme-on-surface), 0.06);
}
.palette-chevron { transition: transform var(--dur-base) var(--ease); color: rgba(var(--v-theme-on-surface), 0.5); }
.palette-chevron--open { transform: rotate(180deg); }
.palette-section__items { padding: 2px 0 6px; }

.palette-tile {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: var(--mp-component-card-radius-sm); flex-shrink: 0;
}
.palette-item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 7px 8px; border: 0; background: transparent; cursor: pointer;
  border-radius: var(--mp-component-card-radius-sm); text-align: left; transition: background var(--dur-fast) var(--ease);
}
.palette-item:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.palette-item:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.palette-item__text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.palette-item__title { font-size: 0.8125rem; font-weight: 550; line-height: 1.3; color: rgb(var(--v-theme-on-surface)); }
.palette-item__sub { font-size: 0.6875rem; line-height: 1.3; color: rgba(var(--v-theme-on-surface), 0.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.palette-item__add { color: rgba(var(--v-theme-on-surface), 0.35); flex-shrink: 0; }
.palette-item:hover .palette-item__add { color: rgb(var(--v-theme-primary)); }

/* ── Canvas ──────────────────────────────────────────────────────────────── */
.jb-canvas { flex: 1 1 auto; position: relative; overflow: hidden; }
.jb-canvas__scroll {
  position: absolute; inset: 0; overflow: auto;
  cursor: grab; touch-action: none;
  background-color: rgb(var(--v-theme-background));
  background-image: radial-gradient(circle, rgba(var(--v-theme-on-surface), 0.13) 1.1px, transparent 1.1px);
  background-size: 22px 22px;
  background-attachment: local;
}
.jb-canvas__scroll--panning { cursor: grabbing; user-select: none; }

/* Node card, connector, and branch styles live in JourneyFlowColumn.vue */

/* ── Zoom controls ───────────────────────────────────────────────────────── */
.jb-zoom { position: absolute; bottom: 16px; right: 16px; padding: 2px; gap: 2px; box-shadow: var(--mp-shadow-md); }
.jb-zoom__pct {
  min-width: 44px; text-align: center; color: rgba(var(--v-theme-on-surface), 0.7);
  border: 0; background: transparent; cursor: pointer; padding: 6px 2px; border-radius: 6px;
}
.jb-zoom__pct:hover { background: rgba(var(--v-theme-on-surface), 0.05); }
.jb-zoom__pct:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }

/* ── Config panel ────────────────────────────────────────────────────────── */
/* No entrance animation: hidden/backgrounded renderers freeze animation frames,
   which would leave the panel stuck invisible at 0%. Instant + elevated is safe. */
.jb-panel { width: 380px; flex-shrink: 0; overflow: hidden; box-shadow: var(--mp-shadow-lg); }
.jb-panel__tile {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 10px;
}
.jb-panel__eyebrow {
  font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; line-height: 1.4;
}
.jb-section-label {
  color: rgba(var(--v-theme-on-surface), 0.45); margin-bottom: 10px;
}

/* ── Detached steps tray ─────────────────────────────────────────────────── */
.jb-detached { min-height: 40px; }

/* ── Live-stats strip ────────────────────────────────────────────────────── */
.jb-stats { background: rgba(var(--v-theme-on-surface), 0.03); }
.jb-stats__link { text-decoration: none; white-space: nowrap; }
.jb-stats__link:hover { text-decoration: underline; }
</style>
