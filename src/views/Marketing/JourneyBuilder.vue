<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MpBuilderShell from '@/components/MpBuilderShell.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import JourneyFlowColumn from '@/components/marketing/JourneyFlowColumn.vue'
import { categoryColor, categoryLabel } from '@/components/marketing/flowTheme'
import { useCampaignsStore, type JourneyStatus } from '@/stores/useCampaigns'
import { useDataJourneysStore } from '@/stores/useDataJourneys'
import { useCopilotStore } from '@/stores/useCopilot'
import { useContentStore } from '@/stores/useContent'
import type { CatalogItem, FlowNode } from '@/stores/journeyFlowData'
import { catalogByKind, dataNodeCatalog, makeNode, nodeCatalog, type ConfigField } from '@/stores/journeyFlowData'
import { addNodeAfter as insertNodeAfter, buildSegments, createNodeFromCatalog, detachNode, flowValidation, removeNode, type FlowSegment } from '@/composables/useFlowTree'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'

// Rebuilt from the production journey builder (/journeys/:id/journey-builder,
// crawled 2026-09-02 — docs/rebuild/journey-builder/). Production is a free-form
// Vue Flow canvas; the sandbox keeps its tree layout (JourneyFlowColumn) and
// reproduces every palette item, node form, action and state on top of it.

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

// Marketing journeys speak Active/Paused/Draft; data journeys speak Enabled/Disabled.
function setStatus(status: JourneyStatus) {
  if (isData.value) {
    dataStore.setDataJourneyStatus(
      journeyId.value,
      status === 'Active' ? 'Enabled' : status === 'Paused' ? 'Disabled' : 'Draft',
    )
  } else {
    store.setJourneyStatus(journeyId.value, status)
  }
}

// ── Save persistence + dirty indicator ───────────────────────────────────────
// Node edits already mutate the store's live flow array; "persisting" stamps an
// updated timestamp (marketing journeys only — data journeys have no such API)
// and moves the dirty snapshot forward so the "Unsaved changes" chip clears.
// Production has no dirty state and confirms every Exit; the chip + guard only
// interrupt when there is something to lose.
const savedSnapshot = ref('')
function snapshotNodes() { savedSnapshot.value = JSON.stringify(nodes.value) }
watch(journeyId, () => snapshotNodes(), { immediate: true })
const isDirty = computed(() => JSON.stringify(nodes.value) !== savedSnapshot.value)
const {
  confirmLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Exit journey?',
  message: 'Changes which are not saved will be lost. Do you wish to continue?',
})

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
const toast = useToast()
const selectedNodeId = ref<string | null>(null)

// Icon-tile accent (soft container + colored glyph) shared by palette rows and
// the config-panel header; 'end' has no theme CSS var → neutral mix.
const tileStyle = (c: keyof typeof categoryColor) => c === 'end'
  ? { background: 'rgba(var(--v-theme-on-surface), 0.08)', color: 'rgba(var(--v-theme-on-surface), 0.65)' }
  : { background: `rgba(var(--v-theme-${categoryColor[c]}), 0.12)`, color: `rgb(var(--v-theme-${categoryColor[c]}))` }

// Step palette — production's five sections in production order (Triggers open
// by default, the rest collapsed). Data journeys expose triggers + actions only.
interface PaletteSection { key: string; label: string; color: string; items: CatalogItem[] }

const paletteSections = computed<PaletteSection[]>(() => {
  const catalog = domainCatalog.value
  const sections: PaletteSection[] = [
    { key: 'triggers', label: 'Triggers', color: categoryColor.trigger, items: catalog.filter(i => i.category === 'trigger') },
    { key: 'actions', label: 'Actions', color: categoryColor.action, items: catalog.filter(i => i.category === 'action') },
  ]
  if (!isData.value) {
    sections.push(
      { key: 'filters', label: 'Filters', color: categoryColor.filter, items: catalog.filter(i => i.category === 'filter') },
      { key: 'delay', label: 'Delay', color: categoryColor.delay, items: catalog.filter(i => i.category === 'delay') },
      { key: 'end', label: 'End', color: categoryColor.end, items: catalog.filter(i => i.category === 'end') },
    )
  }
  return sections
})

const openSections = reactive<Record<string, boolean>>({ triggers: true, actions: false, filters: false, delay: false, end: false })
function toggleSection(key: string) { openSections[key] = !openSections[key] }
const showStepMore = ref(false)
const paletteOpen = ref(true)
const isNarrow = ref(false)

function syncNarrow() {
  isNarrow.value = window.matchMedia('(max-width: 1024px)').matches
  if (!isNarrow.value) paletteOpen.value = true
}
if (typeof window !== 'undefined') {
  syncNarrow()
  // Narrow screens start with the canvas visible; the palette is one tap away.
  if (isNarrow.value) paletteOpen.value = false
  window.addEventListener('resize', syncNarrow)
  onBeforeUnmount(() => window.removeEventListener('resize', syncNarrow))
}

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
const canvasEmpty = computed(() => nodes.value.length === 0)

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

// Palette click = production's double-click-to-add. A trigger becomes (or
// replaces) the root; anything else is inserted after the selected step, or at
// the end of the main path. An emptied canvas needs its trigger first.
function addFromPalette(item: CatalogItem) {
  if (item.category === 'trigger') {
    const root = nodes.value[0]
    if (root) {
      root.kind = item.kind; root.title = item.title; root.subtitle = item.subtitle
      root.icon = item.icon; root.config = {}; root.configured = item.fields.length === 0
      selectedNodeId.value = root.id
    } else {
      const created = createNodeFromCatalog(item)
      nodes.value.push(created)
      selectedNodeId.value = created.id
    }
    return
  }
  if (canvasEmpty.value) {
    toast.error('Add a trigger first — every journey starts with one.')
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

// Production's "Flip Yes/No": the two branch targets swap; labels stay put.
function flipYesNo(id: string) {
  const n = nodes.value.find(x => x.id === id)
  if (!n || n.kind !== 'yes-no') return
  const [a = '', b = ''] = n.children
  n.children = [b, a]
  toast.success('Yes and No branches swapped')
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
const selectedItem = computed(() => catalogByKind[selectedNode.value?.kind ?? ''])
const selectedFields = computed(() => selectedItem.value?.fields ?? [])
/** Read-only field kinds never write config. */
const isStaticField = (f: ConfigField) => f.type === 'note' || f.type === 'link' || f.type === 'action'

// Adjacent fields sharing a `section` render under one sub-heading — this is
// how production's tabbed drawers (Send Email / Send Test Email, Message /
// Compliance, General / Brand DNM, Product / Order status) are flattened.
const selectedFieldGroups = computed(() => {
  const groups: { section: string | null; fields: ConfigField[] }[] = []
  for (const f of selectedFields.value) {
    const section = f.section ?? null
    const last = groups[groups.length - 1]
    if (last && last.section === section) last.fields.push(f)
    else groups.push({ section, fields: [f] })
  }
  return groups
})

watch(selectedNodeId, () => {
  const n = selectedNode.value
  if (!n) return
  draft.title = n.title
  draft.subtitle = n.subtitle
  const config: Record<string, string | number | boolean | string[]> = {}
  for (const f of catalogByKind[n.kind]?.fields ?? []) {
    if (isStaticField(f)) continue
    const existing = n.config[f.key]
    if (existing != null) { config[f.key] = existing; continue }
    if (f.default != null) { config[f.key] = f.default; continue }
    config[f.key] = f.type === 'switch' ? false
      : f.type === 'multi-select' ? []
      : f.type === 'select' || f.type === 'content-picker' || f.type === 'radio' ? f.options?.[0] ?? ''
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

// API Event shows its trigger URLs with the real account / journey ids.
function noteLine(line: string): string {
  return line
    .replace('{accountId}', accountId.value)
    .replace('{journeyId}', String(journeyId.value))
    .replace('{triggerId}', String(38479310348576 + journeyId.value))
}

// Mock side effects for the drawer's action buttons (production: Send Test).
function runFieldAction(f: ConfigField) {
  if (f.key === 'sendTest') {
    const emails = String(draftConfig.value.testEmails ?? '').split(',').map(s => s.trim()).filter(Boolean)
    const lists = (draftConfig.value.testLists as string[] | undefined) ?? []
    if (!emails.length && !lists.length) {
      toast.error('Enter at least one email address or pick a list to send a test.')
      return
    }
    const to = [emails.length ? `${emails.length} address${emails.length === 1 ? '' : 'es'}` : '', lists.length ? `${lists.length} list${lists.length === 1 ? '' : 's'}` : '']
      .filter(Boolean).join(' and ')
    toast.success(`Test email sent to ${to}`)
    return
  }
  toast.info(`${f.label} — not available in this prototype`)
}

function saveNode() {
  const n = selectedNode.value
  if (n) {
    n.title = draft.title.trim() || n.title
    n.subtitle = draft.subtitle
    for (const f of selectedFields.value) {
      if (isStaticField(f)) continue
      const v = draftConfig.value[f.key]
      n.config[f.key] = f.type === 'number' ? Number(v) || 0 : (v ?? (f.type === 'multi-select' ? [] : ''))
    }
    // Percent Split: one field drives both branch labels (X% / remainder).
    if (n.kind === 'percent-split') {
      const pct = Math.min(50, Math.max(10, Number(n.config.splitPercentage) || 50))
      n.config.splitPercentage = pct
      n.branchLabels = [`${pct}%`, `${100 - pct}%`]
    }
    n.configured = true
  }
  // Apply closes the panel; the toolbar Save persists the whole flow.
  toast.success('Step applied')
  selectedNodeId.value = null
}
function cancelPanel() { selectedNodeId.value = null; showStepMore.value = false }

watch(selectedNodeId, () => { showStepMore.value = false })

function removeSelected() {
  if (!selectedNode.value) return
  deleteNode(selectedNode.value.id)
}

const copilot = useCopilotStore()
function askDaVinci() {
  copilot.openWithPrompt(`Review my ${entityLabel.value} "${journeyName.value}" and suggest improvements to timing and copy.`)
}

// ── Validation + the two saves ───────────────────────────────────────────────
// Production: SAVE validates (invalid steps outlined, snackbar "Cannot save
// journey") and persists live; SAVE AS DRAFT skips validation and stores the
// draft status. The issues pill surfaces the same list before anyone clicks.
const issues = computed(() => flowValidation(nodes.value))
const issueErrors = computed(() => issues.value.filter(i => i.level === 'error'))
const issuesOpen = ref(false)

const isLive = computed(() => journeyStatus.value === (isData.value ? 'Enabled' : 'Active'))

function saveDraftJourney() {
  persistFlow()
  if (!isData.value) setStatus('Draft')
  toast.success('Draft saved')
}

function saveJourney() {
  if (issueErrors.value.length > 0) {
    issuesOpen.value = true
    const first = issueErrors.value.find(i => i.nodeId)
    if (first?.nodeId) flashNode(first.nodeId)
    toast.error(issueErrors.value[0]?.message ?? 'Journey is incomplete.', { title: 'Cannot save journey' })
    return
  }
  persistFlow()
  if (!isData.value && journeyStatus.value === 'Draft') setStatus('Active')
  toast.success('Journey saved')
  void nextTick(() => { issuesOpen.value = false })
}

// Data journeys keep the legacy Enable / Disable toggle.
function tryActivate() {
  if (isLive.value) {
    setStatus('Paused')
    persistFlow()
    toast.success('Data journey disabled')
    void nextTick(() => { issuesOpen.value = false })
    return
  }
  if (issueErrors.value.length > 0) {
    issuesOpen.value = true
    return
  }
  setStatus('Active')
  persistFlow()
  toast.success('Data journey enabled')
  void nextTick(() => { issuesOpen.value = false })
}

// ── Clear canvas (production's DELETE ALL) ───────────────────────────────────
// Marketing journeys empty the canvas completely (the palette re-seeds it with a
// trigger); data journeys keep the legacy behaviour of a blank trigger.
const clearDialog = ref(false)
function clearCanvas() {
  if (isData.value) {
    dataStore.flows[journeyId.value] = [makeNode({
      id: `d${journeyId.value}-t1`,
      kind: 'dj-api-event',
      title: 'Choose a trigger',
      subtitle: 'Click to configure when this journey runs',
      configured: false,
    })]
  } else {
    nodes.value.splice(0, nodes.value.length)
  }
  selectedNodeId.value = null
  toast.success('Canvas cleared')
}

// Jump-to-issue: select, scroll to, and pulse the offending node once.
const flashNodeId = ref<string | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | undefined
function flashNode(nodeId: string) {
  selectedNodeId.value = nodeId
  flashNodeId.value = null
  void nextTick(() => { flashNodeId.value = nodeId })
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flashNodeId.value = null }, 1400)
}
function jumpToIssue(nodeId?: string) {
  issuesOpen.value = false
  if (nodeId) flashNode(nodeId)
}

// ── Contact search (production's canvas magnifier) ───────────────────────────
// Looks a contact up by email / phone / id and highlights the step they are in.
// Mock: a deterministic pick over the journey's steps; the toast names the step.
const searchOpen = ref(false)
const searchQuery = ref('')
function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (!searchOpen.value) searchQuery.value = ''
}
function runContactSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  const candidates = nodes.value.filter(n => n.category !== 'end' && !n.detached)
  if (!candidates.length) {
    toast.info(`No step is holding "${q}" right now.`)
    return
  }
  const pick = candidates[hashSeed(q) % candidates.length]!
  flashNode(pick.id)
  toast.info(`"${q}" is currently at "${pick.title}".`)
}

// ── Node config panel: live-stats strip ──────────────────────────────────────
// Production shows "N contact(s) entered through this trigger" / "N contact(s)
// are waiting in this delay" on trigger and delay steps only. Mock, deterministic
// counts: the store's own contact count where it has one, otherwise a hash of
// the node id; the refresh icon bumps a per-node counter to vary the number.
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
const statsLine = computed(() => {
  const n = nodeStatValue.value
  const count = `${n.toLocaleString()} contact${n === 1 ? '' : 's'}`
  switch (selectedNode.value?.category) {
    case 'trigger': return `${count} entered through this trigger`
    case 'delay': return `${count} ${n === 1 ? 'is' : 'are'} waiting in this delay`
    default: return ''
  }
})

// ── Canvas zoom + pan ─────────────────────────────────────────────────────────
// Zoom uses the CSS `zoom` property (not transform:scale) so the scrollable
// area grows/shrinks with the content and nothing clips off-screen; focal-point
// compensation then works in plain layout coordinates. Range and step match
// production (20–400%, ±10%); below 75% the cards switch to the compact face
// exactly as production does — but positions stay put (see IMPROVEMENTS).
const ZOOM_MIN = 0.2
const ZOOM_MAX = 4
const ZOOM_STEP = 0.1
const COMPACT_BELOW = 0.75
const canvasEl = ref<HTMLElement | null>(null)
const zoom = ref(1)
const zoomPct = computed(() => Math.round(zoom.value * 100))
const zoomStyle = computed(() => ({ zoom: String(zoom.value) }))
const nodeFace = computed<'card' | 'compact'>(() => (zoom.value < COMPACT_BELOW ? 'compact' : 'card'))

function setZoomAround(next: number, focalX?: number, focalY?: number) {
  const el = canvasEl.value
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +next.toFixed(2)))
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
function zoomIn() { setZoomAround(zoom.value + ZOOM_STEP) }
function zoomOut() { setZoomAround(zoom.value - ZOOM_STEP) }

// Editable percentage (production: digits/% only, Enter applies).
const zoomInput = ref(`${zoomPct.value}%`)
const editingZoom = ref(false)
watch(zoomPct, v => { if (!editingZoom.value) zoomInput.value = `${v}%` })
function onZoomInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  zoomInput.value = raw.replace(/[^\d%]/g, '')
}
function applyZoomInput() {
  editingZoom.value = false
  const parsed = parseInt(zoomInput.value.replace('%', ''), 10)
  if (!Number.isNaN(parsed)) setZoomAround(parsed / 100)
  zoomInput.value = `${zoomPct.value}%`
}

function fitToView() {
  const el = canvasEl.value
  if (!el) return
  const contentW = el.scrollWidth / zoom.value
  const contentH = el.scrollHeight / zoom.value
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.min(el.clientWidth / contentW, el.clientHeight / contentH) * 0.97))
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
  setZoomAround(zoom.value + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), e.clientX - rect.left, e.clientY - rect.top)
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
  <div v-if="!journey" class="jb-missing d-flex align-center justify-center">
    <MpEmptyState icon="search-x" :title="`${isData ? 'Data journey' : 'Journey'} not found`"
      :description="`This ${entityLabel} doesn't exist or was deleted.`" actionLabel="Back to the list" actionIcon="arrow-left"
      @action="router.push(listRoute)" />
  </div>

  <MpBuilderShell
    v-else
    :back-label="isData ? 'Back to Data Journeys' : 'Exit to Journeys'"
    :title="journeyName"
    :dirty="isDirty"
    persistence-mode="explicit"
    @back="router.push(listRoute)"
  >
    <template #title>
      <v-btn
        class="jb-palette-toggle"
        variant="text"
        icon="panel-left"
        size="small"
        :aria-label="paletteOpen ? 'Hide steps panel' : 'Show steps panel'"
        @click="paletteOpen = !paletteOpen"
      />
      <button v-if="!editingName" type="button" class="text-truncate jb-name"
        aria-label="Rename journey" @click="editingName = true; nameInput = journeyName">
        {{ journeyName }}
        <v-icon size="16" class="jb-name__pencil ml-1">pencil</v-icon>
      </button>
      <!-- Toolbar chrome, not a form: the inline rename field, the contact search and
           the palette search below keep compact + hide-details deliberately. -->
      <v-text-field v-else v-model="nameInput" hide-details autofocus
        class="jb-name-field" aria-label="Journey name"
        @blur="journeyName = nameInput; editingName = false" @keyup.enter="journeyName = nameInput; editingName = false"></v-text-field>
      <MpStatusChip :status="journeyStatus" type="general" size="sm" />
    </template>

    <template #actions>
      <!-- Contact search (marketing journeys) — production's canvas magnifier -->
      <template v-if="!isData">
        <v-text-field v-if="searchOpen" v-model="searchQuery" hide-details autofocus
          class="jb-contact-search" placeholder="Email, Phone No. or Contact ID"
          aria-label="Find a contact in this journey" prepend-inner-icon="search"
          @keyup.enter="runContactSearch" @keyup.esc="toggleSearch"></v-text-field>
        <v-tooltip :text="searchOpen ? 'Close contact search' : 'Find a contact in this journey'" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" :icon="searchOpen ? 'x' : 'search'" variant="text" size="small"
              :aria-label="searchOpen ? 'Close contact search' : 'Find a contact in this journey'"
              :aria-pressed="searchOpen" @click="toggleSearch"></v-btn>
          </template>
        </v-tooltip>
      </template>
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
      <v-divider vertical class="mx-1 jb-actions__divider"></v-divider>
      <!-- Below 1024px the labels hide and the icons carry the buttons; aria-label keeps the name. -->
      <v-btn variant="outlined" size="small" class="text-none jb-action" prepend-icon="eraser" :disabled="canvasEmpty"
        :aria-label="isData ? 'Clear' : 'Clear canvas'" @click="clearDialog = true">
        <span class="jb-action__label">{{ isData ? 'Clear' : 'Clear canvas' }}</span>
      </v-btn>
      <v-btn variant="outlined" size="small" class="text-none jb-action" prepend-icon="save"
        :aria-label="isData ? 'Save' : 'Save as draft'" @click="saveDraftJourney">
        <span class="jb-action__label">{{ isData ? 'Save' : 'Save as draft' }}</span>
      </v-btn>
      <v-menu v-model="issuesOpen" :close-on-content-click="false" :open-on-click="false" location="bottom end">
        <template #activator="{ props: menu }">
          <v-btn v-if="isData" v-bind="menu" color="primary" variant="flat" size="small" class="text-none"
            :prepend-icon="isLive ? 'pause' : 'play'" @click.stop="tryActivate">
            {{ isLive ? 'Disable' : 'Enable' }}
          </v-btn>
          <v-btn v-else v-bind="menu" color="primary" variant="flat" size="small" class="text-none jb-action"
            prepend-icon="check" aria-label="Save" @click.stop="saveJourney"><span class="jb-action__label">Save</span></v-btn>
        </template>
        <v-card rounded="lg" border flat width="360" class="py-1">
          <div class="px-4 py-2 border-b d-flex align-center gap-2">
            <v-icon size="16" :color="issueErrors.length ? 'error' : 'warning'">triangle-alert</v-icon>
            <span class="text-body-2 font-weight-bold">
              {{ issueErrors.length ? (isData ? 'Fix these before enabling' : 'Fix these before saving') : 'Heads up' }}
            </span>
            <v-btn icon="x" variant="text" size="x-small" class="ml-auto" aria-label="Close issues" @click="issuesOpen = false"></v-btn>
          </div>
          <v-list density="compact" nav max-height="300" class="overflow-y-auto">
            <v-list-item v-for="(issue, i) in issues" :key="i" rounded="lg"
              :disabled="!issue.nodeId" @click="jumpToIssue(issue.nodeId)">
              <template #prepend>
                <v-icon size="16" :color="issue.level === 'error' ? 'error' : 'warning'">
                  {{ issue.level === 'error' ? 'circle-alert' : 'triangle-alert' }}
                </v-icon>
              </template>
              <v-list-item-title class="text-caption ml-2 jb-issue__text">{{ issue.message }}</v-list-item-title>
              <template v-if="issue.nodeId" #append>
                <v-icon size="16" class="text-disabled">locate</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </template>

    <div class="d-flex flex-column h-100">
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
    <div class="jb-body d-flex flex-grow-1">
      <!-- Palette -->
      <div
        v-if="paletteOpen && isNarrow"
        class="jb-scrim"
        aria-hidden="true"
        @click="paletteOpen = false"
      />
      <aside class="jb-palette border-r bg-surface d-flex flex-column" :class="{ 'jb-palette--open': paletteOpen, 'jb-palette--hidden': !paletteOpen && isNarrow }"
        aria-label="Build your journey">
        <div class="pa-3 border-b">
          <h2 class="jb-palette__title">Build your journey</h2>
          <div class="text-caption text-medium-emphasis mb-2">Click a step to add it to your flow</div>
          <v-text-field v-model="paletteQuery" placeholder="Search steps..."
            hide-details clearable prepend-inner-icon="search" aria-label="Search steps" class="jb-search" />
        </div>
        <div class="flex-grow-1 overflow-y-auto pa-2 jb-palette__scroll">
          <div v-if="visibleSections.length === 0" class="text-caption text-medium-emphasis text-center pa-4">
            No steps match "{{ paletteQuery }}"
          </div>
          <div v-for="s in visibleSections" :key="s.key" class="palette-section">
            <button class="palette-section__header" :aria-expanded="openSections[s.key] || !!paletteQuery" :aria-controls="`palette-${s.key}`"
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
                  <v-icon size="16">{{ item.icon }}</v-icon>
                </span>
                <span class="palette-item__text">
                  <span class="palette-item__title">{{ item.title }}</span>
                  <span class="palette-item__sub">{{ item.subtitle }}</span>
                </span>
                <v-icon size="16" class="palette-item__add">plus</v-icon>
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
          <div v-if="canvasEmpty" class="jb-canvas__empty d-flex align-center justify-center">
            <MpEmptyState icon="workflow" title="Start with a trigger"
              description="The canvas is empty. Pick a trigger from the Triggers panel to begin this journey, then add the steps that follow it." />
          </div>
          <div v-else class="d-flex flex-column align-center pa-8" :style="zoomStyle">
            <div class="d-flex flex-column align-center jb-flow">
              <JourneyFlowColumn :segments="segments" :selected-id="selectedNodeId" :catalog="domainCatalog" :flash-id="flashNodeId"
                :face="nodeFace"
                @select="selectNode"
                @add="(afterId, item, childIndex) => addNodeAfter(afterId, item, childIndex)"
                @duplicate="duplicateNode"
                @remove="deleteNode"
                @flip="flipYesNo" />
            </div>
          </div>
        </div>

        <!-- Zoom controls: fit · − · editable % · + (production: −/%/+, 20–400%) -->
        <div class="jb-zoom d-flex align-center bg-surface border rounded-lg" role="group" aria-label="Canvas zoom">
          <v-tooltip text="Fit to view" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="maximize" variant="text" size="small" aria-label="Fit to view" @click="fitToView"></v-btn>
            </template>
          </v-tooltip>
          <v-divider vertical class="jb-zoom__divider"></v-divider>
          <v-tooltip text="Zoom out" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="zoom-out" variant="text" size="small" aria-label="Zoom out" :disabled="zoom <= ZOOM_MIN" @click="zoomOut"></v-btn>
            </template>
          </v-tooltip>
          <input class="jb-zoom__pct text-caption font-weight-medium" :value="zoomInput" aria-label="Zoom percentage"
            inputmode="numeric" spellcheck="false"
            @focus="editingZoom = true" @input="onZoomInput" @keydown.enter="applyZoomInput" @blur="applyZoomInput" />
          <v-tooltip text="Zoom in" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="zoom-in" variant="text" size="small" aria-label="Zoom in" :disabled="zoom >= ZOOM_MAX" @click="zoomIn"></v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>

      <!-- Node details panel (production: 800px right drawer "Node details") -->
      <aside v-if="selectedNode" class="jb-panel border-l bg-surface d-flex flex-column" aria-label="Node details">
          <div class="pa-4 border-b d-flex align-center justify-space-between flex-shrink-0">
            <div class="d-flex align-center gap-3 jb-panel__head">
              <span class="jb-panel__tile flex-shrink-0" :style="tileStyle(selectedNode.category)">
                <v-icon size="18">{{ selectedNode.icon }}</v-icon>
              </span>
              <div class="jb-panel__head">
                <div class="jb-panel__eyebrow" :style="{ color: tileStyle(selectedNode.category).color }">
                  {{ categoryLabel[selectedNode.category] }}
                </div>
                <h2 class="mp-section-title text-truncate">{{ selectedNode.title }}</h2>
              </div>
            </div>
            <v-btn icon="x" variant="text" size="small" aria-label="Close node details" @click="cancelPanel"></v-btn>
          </div>

          <div class="pa-4 flex-grow-1 overflow-y-auto">
            <MpFormGrid>
              <p v-if="selectedItem?.description" class="text-body-2 text-medium-emphasis jb-panel__intro">
                {{ selectedItem.description }}
              </p>

              <MpAlert v-if="!selectedNode.configured" tone="warning">
                This step isn't configured yet — review the settings below and apply.
              </MpAlert>

              <!-- Live stats (triggers and delays, as in production) -->
              <div v-if="statsLine" class="jb-stats d-flex align-center gap-3 pa-3 border rounded-lg">
                <v-icon size="16" class="text-medium-emphasis flex-shrink-0">users</v-icon>
                <div class="flex-grow-1 text-body-2 jb-stats__text">{{ statsLine }}</div>
                <router-link :to="{ name: 'AllContacts', params: { accountId } }" class="text-caption font-weight-bold text-primary jb-stats__link">
                  View contacts
                </router-link>
                <v-btn icon="refresh-cw" variant="text" size="x-small" aria-label="Refresh contacts count"
                  @click="refreshStats(selectedNode.id)"></v-btn>
              </div>

              <MpFormSection title="Step details" />
              <v-text-field v-model="draft.title" label="Step name"></v-text-field>

              <template v-if="selectedFields.length">
                <MpFormSection v-if="!selectedFieldGroups[0]?.section" title="Configuration" />
                <!-- Schema-driven fields from the node catalog, grouped by section -->
                <template v-for="(g, gi) in selectedFieldGroups" :key="g.section ?? gi">
                <MpFormSection v-if="g.section" :title="g.section" />
                <template v-for="f in g.fields" :key="f.key">
                  <v-select v-if="f.type === 'select'" :model-value="String(draftConfig[f.key] ?? '')" :label="f.label" :items="f.options"
                    :hint="f.hint" :persistent-hint="!!f.hint"
                    @update:model-value="(v: string) => draftConfig[f.key] = v"></v-select>
                  <v-select v-else-if="f.type === 'content-picker'" :model-value="String(draftConfig[f.key] ?? '')" :label="f.label" :items="contentNames"
                    prepend-inner-icon="file-text"
                    @update:model-value="(v: string) => draftConfig[f.key] = v"></v-select>
                  <v-select v-else-if="f.type === 'multi-select'" :model-value="(draftConfig[f.key] as string[] ?? [])" :label="f.label" :items="f.options"
                    multiple chips closable-chips
                    @update:model-value="(v: string[]) => draftConfig[f.key] = v"></v-select>
                  <v-text-field v-else-if="f.type === 'number'" :model-value="String(draftConfig[f.key] ?? '')" :label="f.label" type="number"
                    :hint="f.hint" :persistent-hint="!!f.hint"
                    @update:model-value="(v: string) => draftConfig[f.key] = v"></v-text-field>
                  <v-switch v-else-if="f.type === 'switch'" v-model="draftConfig[f.key]" :label="f.label"
                    :hint="f.hint" :persistent-hint="!!f.hint"></v-switch>
                  <v-textarea v-else-if="f.type === 'textarea'" :model-value="String(draftConfig[f.key] ?? '')" :label="f.label" rows="3"
                    :hint="f.hint" :persistent-hint="!!f.hint"
                    @update:model-value="(v: string) => draftConfig[f.key] = v"></v-textarea>
                  <MpFormField v-else-if="f.type === 'radio'" :label="f.label" :hint="f.hint">
                    <template #default="{ labelId }">
                      <v-radio-group :model-value="String(draftConfig[f.key] ?? '')" inline hide-details :aria-labelledby="labelId"
                        @update:model-value="(v: string | null) => draftConfig[f.key] = v ?? ''">
                        <v-radio v-for="opt in f.options" :key="opt" :label="opt" :value="opt"></v-radio>
                      </v-radio-group>
                    </template>
                  </MpFormField>
                  <div v-else-if="f.type === 'note'" class="jb-note">
                    <div class="text-body-2">{{ f.label }}</div>
                    <ul v-if="f.options?.length" class="jb-note__lines">
                      <li v-for="line in f.options" :key="line"><code>{{ noteLine(line) }}</code></li>
                    </ul>
                  </div>
                  <div v-else-if="f.type === 'action'">
                    <v-btn variant="tonal" class="text-none" prepend-icon="send" @click="runFieldAction(f)">{{ f.label }}</v-btn>
                  </div>
                  <router-link v-else-if="f.type === 'link'" :to="{ name: f.to ?? 'Journeys', params: { accountId } }"
                    class="text-body-2 font-weight-medium text-primary jb-panel__link">
                    {{ f.label }}
                    <v-icon size="16" class="ml-1">arrow-up-right</v-icon>
                  </router-link>
                  <v-text-field v-else :model-value="String(draftConfig[f.key] ?? '')" :label="f.label" :placeholder="f.placeholder"
                    :hint="f.hint" :persistent-hint="!!f.hint"
                    @update:model-value="(v: string) => draftConfig[f.key] = v"></v-text-field>
                </template>
                </template>
              </template>

              <MpAlert v-if="selectedNode.category === 'filter'" tone="info">
                Contacts are routed into one of the branches: {{ (selectedNode.branchLabels ?? []).join(' · ') }}.
              </MpAlert>

              <div>
                <v-btn
                  variant="text"
                  size="small"
                  class="text-none px-0"
                  :append-icon="showStepMore ? 'chevron-up' : 'chevron-down'"
                  @click="showStepMore = !showStepMore"
                >{{ showStepMore ? 'Less' : 'More' }}</v-btn>
              </div>

              <template v-if="showStepMore">
                <v-text-field v-model="draft.subtitle" label="Description"></v-text-field>
              </template>
            </MpFormGrid>
          </div>

          <div class="pa-4 border-t d-flex align-center gap-2 flex-shrink-0">
            <v-btn color="primary" variant="flat" class="text-none flex-grow-1" @click="saveNode">Apply</v-btn>
            <v-btn variant="tonal" class="text-none" :disabled="!canDetach" @click="detachSelected">Detach</v-btn>
            <v-btn variant="text" color="error" class="text-none px-2" :disabled="selectedNode.category === 'trigger'"
              @click="removeSelected">Remove</v-btn>
          </div>
      </aside>
    </div>
    </div>

    <MpConfirmDialog
      v-model="deleteDialog"
      danger
      title="Delete this split?"
      :message="`Deleting &quot;${deleteTarget?.title}&quot; also removes every step inside its branches. Steps after the point where the branches rejoin are kept.`"
      confirm-label="Delete split"
      @confirm="confirmDelete"
    />
    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
    <MpConfirmDialog
      v-model="clearDialog"
      danger
      title="Clear the canvas?"
      :message="isData
        ? 'Every step on this canvas will be removed and replaced with an empty trigger. This can\'t be undone.'
        : 'All steps will be removed immediately. Do you wish to continue?'"
      confirm-label="Clear canvas"
      @confirm="clearCanvas"
    />
  </MpBuilderShell>
</template>

<style scoped>
.jb-missing { min-height: 60vh; }
.jb-body { position: relative; overflow: hidden; min-height: 0; }
.jb-name {
  cursor: pointer; border-radius: var(--mp-radius-4); padding: var(--mp-space-2) var(--mp-space-6); margin: calc(-1 * var(--mp-space-2)) calc(-1 * var(--mp-space-6));
  font-size: var(--mp-fontSize-15); font-weight: var(--mp-text-sectionTitle-fontWeight); color: rgb(var(--v-theme-on-surface));
  transition: background var(--dur-fast) var(--ease);
  /* Native <button> resets so the rename control keeps its text styling. */
  border: 0; background: transparent; font-family: inherit; text-align: left;
  display: block; max-width: 100%;
}
.jb-name:hover { background: var(--surface-secondary); }
.jb-name:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.jb-name__pencil { opacity: 0; color: var(--on-surface-muted); transition: opacity var(--dur-fast) var(--ease); }
.jb-name:hover .jb-name__pencil, .jb-name:focus-visible .jb-name__pencil { opacity: 1; }
.jb-name-field { width: 320px; }
.jb-contact-search { width: 260px; }
.jb-actions__divider { height: var(--mp-space-24); }
.jb-issue__text { white-space: normal; }

/* Ask Da Vinci — AI as a quiet utility: muted neutral sparkle, no fill/accent. */
.jb-davinci :deep(.v-icon) { opacity: 0.55; }
.jb-davinci:hover :deep(.v-icon) { opacity: 0.9; }

.border-b { border-bottom: 1px solid var(--border-subtle); }
.border-t { border-top: 1px solid var(--border-subtle); }
.border-r { border-right: 1px solid var(--border-subtle); }
.border-l { border-left: 1px solid var(--border-subtle); }

/* ── Palette ─────────────────────────────────────────────────────────────── */
.jb-palette-toggle { display: none; }
/* Covers the builder body (palette overlay backdrop); .jb-body is the
   positioned ancestor, so inset 0 stops cleanly under the toolbar/tray. */
.jb-scrim {
  position: absolute; inset: 0; z-index: 4;
  background: rgba(var(--v-theme-on-surface), 0.32);
}
/* Palette: quiet grey well with white step rows (Klaviyo / Customer.io pattern) so each
   step reads as a pick-up-able object and the heading/search stay on the surface. */
.jb-palette { width: var(--mp-layout-sectionRailWidth); flex-shrink: 0; overflow: hidden; }
.jb-palette__title { font-size: var(--mp-fontSize-14); font-weight: var(--mp-text-sectionTitle-fontWeight); line-height: 1.3; color: rgb(var(--v-theme-on-surface)); }
.jb-palette__scroll { background: var(--surface-secondary); }
@media (max-width: 1024px) {
  .jb-palette-toggle { display: inline-flex; }
  .jb-palette {
    position: absolute; top: 0; left: 0; bottom: 0; z-index: 5;
    transform: translateX(-100%);
    transition: transform 160ms ease;
    box-shadow: var(--mp-shadow-lg);
  }
  .jb-palette--open { transform: translateX(0); }
  .jb-palette--hidden { transform: translateX(-100%); }
  .jb-panel { width: min(var(--mp-component-builder-panelWidth), 100vw) !important; max-width: 100%; }
  .jb-contact-search { width: 180px; }
  .jb-action__label { display: none; }
  .jb-action :deep(.v-btn__prepend) { margin-inline: 0; }
}
.jb-palette__scroll { scrollbar-width: thin; scrollbar-color: rgba(var(--v-theme-on-surface), 0.2) transparent; }
.palette-section { margin-bottom: var(--mp-space-6); }
.palette-section__header {
  display: flex; align-items: center; gap: var(--mp-space-8); width: 100%;
  padding: var(--mp-space-8) var(--mp-space-6); border: 0; background: transparent; cursor: pointer;
  border-radius: var(--mp-radius-8); text-align: left; color: rgb(var(--v-theme-on-surface));
}
.palette-section__header:hover { background: rgba(var(--v-theme-on-surface), 0.05); }
.palette-section__header:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.palette-dot { width: var(--mp-space-6); height: var(--mp-space-6); border-radius: var(--mp-radius-full); flex-shrink: 0; }
.palette-section__label { flex: 1; color: rgba(var(--v-theme-on-surface), 0.6); }
.palette-count {
  font-size: var(--mp-fontSize-10); font-weight: 700; line-height: 1;
  padding: 3px 7px; border-radius: var(--mp-radius-full); margin-right: var(--mp-space-2);
  color: rgba(var(--v-theme-on-surface), 0.55);
  background: rgba(var(--v-theme-on-surface), 0.06);
}
.palette-chevron { transition: transform var(--dur-base) var(--ease); color: rgba(var(--v-theme-on-surface), 0.5); }
.palette-chevron--open { transform: rotate(180deg); }
.palette-section__items { display: flex; flex-direction: column; gap: var(--mp-space-6); padding: var(--mp-space-2) 0 var(--mp-space-8); }

.palette-tile {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: var(--mp-radius-8); flex-shrink: 0;
}
.palette-item {
  display: flex; align-items: center; gap: var(--mp-space-10); width: 100%;
  padding: var(--mp-space-8) var(--mp-space-10); cursor: pointer;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10); text-align: left;
  box-shadow: var(--mp-shadow-sm);
  transition: border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
}
.palette-item:hover { border-color: var(--border-strong); box-shadow: var(--mp-shadow-md); transform: translateY(-1px); }
.palette-item:active { transform: translateY(0); box-shadow: var(--mp-shadow-sm); }
.palette-item:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .palette-item, .palette-item:hover { transform: none; } }
.palette-item__text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.palette-item__title { font-size: var(--mp-fontSize-13); font-weight: 550; line-height: 1.3; color: rgb(var(--v-theme-on-surface)); }
.palette-item__sub { font-size: var(--mp-fontSize-11); line-height: 1.3; color: rgba(var(--v-theme-on-surface), 0.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.palette-item__add { color: rgba(var(--v-theme-on-surface), 0.35); flex-shrink: 0; }
.palette-item:hover .palette-item__add { color: rgb(var(--v-theme-primary)); }

/* ── Canvas ──────────────────────────────────────────────────────────────── */
.jb-canvas { flex: 1 1 auto; position: relative; overflow: hidden; }
/* Canvas grid: a 24px dot grid (Klaviyo / Deel / Twenty) — dots survive display
   scaling where 1px hairlines vanish. Dots are on-surface at 18% so the pattern is
   clearly a grid yet sits behind the connectors; it scrolls with the content. */
.jb-canvas__scroll {
  position: absolute; inset: 0; overflow: auto;
  cursor: grab; touch-action: none;
  background-color: rgb(var(--v-theme-background));
  background-image: radial-gradient(circle at center, rgba(var(--v-theme-on-surface), 0.18) 1.5px, transparent 1.6px);
  /* The global reset sets background-repeat: no-repeat on every element — restore tiling. */
  background-repeat: repeat;
  background-size: 24px 24px;
  background-position: 12px 12px;
  background-attachment: local;
}
.jb-canvas__scroll--panning { cursor: grabbing; user-select: none; }
.jb-canvas__empty { min-height: 100%; cursor: default; }
.jb-flow { min-width: 320px; }

/* Node card, connector, and branch styles live in JourneyFlowColumn.vue */

/* ── Zoom controls ───────────────────────────────────────────────────────── */
.jb-zoom { position: absolute; bottom: var(--mp-space-16); right: var(--mp-space-16); padding: var(--mp-space-2); gap: var(--mp-space-2); box-shadow: var(--mp-shadow-md); }
.jb-zoom__divider { height: var(--mp-space-20); }
.jb-zoom__pct {
  width: 56px; text-align: center; color: rgba(var(--v-theme-on-surface), 0.7);
  border: 0; background: transparent; padding: var(--mp-space-6) var(--mp-space-2); border-radius: var(--mp-radius-4);
  font-family: inherit;
}
.jb-zoom__pct:hover { background: rgba(var(--v-theme-on-surface), 0.05); }
.jb-zoom__pct:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }

/* ── Node details panel ──────────────────────────────────────────────────── */
/* No entrance animation: hidden/backgrounded renderers freeze animation frames,
   which would leave the panel stuck invisible at 0%. Instant + elevated is safe. */
.jb-panel { width: var(--mp-component-builder-panelWidth); flex-shrink: 0; overflow: hidden; box-shadow: var(--mp-shadow-lg); }
.jb-panel__head { min-width: 0; }
.jb-panel__tile {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: var(--mp-radius-10);
}
.jb-panel__eyebrow {
  font-size: var(--mp-fontSize-10); font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; line-height: 1.4;
}
.jb-panel__intro { margin: 0; line-height: 1.5; }
.jb-panel__link { text-decoration: none; display: inline-flex; align-items: center; }
.jb-panel__link:hover { text-decoration: underline; }
.jb-note { display: flex; flex-direction: column; gap: var(--mp-space-8); }
.jb-note__lines {
  margin: 0; padding: var(--mp-space-12); list-style: none;
  display: flex; flex-direction: column; gap: var(--mp-space-8);
  background: var(--surface-secondary); border-radius: var(--mp-radius-10);
}
.jb-note__lines code {
  font-size: var(--mp-fontSize-12); line-height: 1.45; word-break: break-all;
  color: rgb(var(--v-theme-on-surface));
}
/* ── Detached steps tray ─────────────────────────────────────────────────── */
.jb-detached { min-height: var(--mp-component-control-height); }

/* ── Live-stats strip ────────────────────────────────────────────────────── */
.jb-stats { background: rgba(var(--v-theme-on-surface), 0.03); }
.jb-stats__text { min-width: 0; }
.jb-stats__link { text-decoration: none; white-space: nowrap; }
.jb-stats__link:hover { text-decoration: underline; }
</style>
