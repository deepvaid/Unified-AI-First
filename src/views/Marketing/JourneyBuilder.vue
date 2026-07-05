<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import type { CatalogItem, FlowNode, NodeCategory } from '@/stores/journeyFlowData'
import { catalogByKind, nodeCatalog } from '@/stores/journeyFlowData'
import { addNodeAfter as insertNodeAfter, removeNode } from '@/composables/useFlowTree'

const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

const store = useCampaignsStore()
const journeyId = computed(() => Number(route.params.id))
const journey = computed(() => store.journeys.find(j => j.id === journeyId.value))
const nodes = computed<FlowNode[]>(() => store.journeyFlows[journeyId.value] ?? [])

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
const headerStyle = (c: NodeCategory) => c === 'end'
  ? {
      backgroundColor: 'rgba(var(--v-theme-on-surface), 0.06)',
      borderBottomColor: 'rgba(var(--v-theme-on-surface), 0.12)',
    }
  : {
      backgroundColor: `rgba(var(--v-theme-${categoryColor[c]}), 0.12)`,
      borderBottomColor: `rgba(var(--v-theme-${categoryColor[c]}), 0.24)`,
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
interface PaletteSection { key: string; label: string; color: string; items: CatalogItem[] }

const paletteSections: PaletteSection[] = [
  { key: 'triggers', label: 'Triggers', color: 'primary', items: nodeCatalog.filter(i => i.category === 'trigger') },
  { key: 'actions', label: 'Actions', color: 'success', items: nodeCatalog.filter(i => i.category === 'action') },
  { key: 'logic', label: 'Logic & Filters', color: 'secondary', items: nodeCatalog.filter(i => i.category === 'filter') },
  { key: 'delay', label: 'Delays', color: 'warning', items: nodeCatalog.filter(i => i.category === 'delay') },
]

const openSections = reactive<Record<string, boolean>>({ triggers: true, actions: true, logic: true, delay: true })
function toggleSection(key: string) { openSections[key] = !openSections[key] }

const addableItems = computed(() => paletteSections.filter(s => s.key !== 'triggers').flatMap(s => s.items))

const selectedNode = computed(() => nodes.value.find(n => n.id === selectedNodeId.value))
const sortedNodes = computed(() => {
  const result: FlowNode[] = []; const visited = new Set<string>()
  function walk(id: string) {
    if (visited.has(id)) return; visited.add(id)
    const n = nodes.value.find(x => x.id === id)
    if (n) { result.push(n); n.children.forEach(walk) }
  }
  const first = nodes.value[0]
  if (first) walk(first.id)
  return result
})

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

function deleteNode(id: string) {
  const target = nodes.value.find(n => n.id === id)
  if (!target || target.category === 'trigger') return
  const removed = removeNode(nodes.value, id)
  if (selectedNodeId.value && removed.includes(selectedNodeId.value)) selectedNodeId.value = null
}

// ── Config panel draft (real round-trip for name + description) ───────────────
const draft = reactive({ title: '', subtitle: '' })
watch(selectedNodeId, () => {
  const n = selectedNode.value
  if (n) { draft.title = n.title; draft.subtitle = n.subtitle }
})
function saveNode() {
  const n = selectedNode.value
  if (n) { n.title = draft.title.trim() || n.title; n.subtitle = draft.subtitle; n.configured = true }
  saveMessage.value = 'Step updated'
  saveSnack.value = true
  selectedNodeId.value = null
}
function cancelPanel() { selectedNodeId.value = null }

function saveDraftJourney() { saveMessage.value = 'Draft saved'; saveSnack.value = true }
function activateJourney() {
  store.setJourneyStatus(journeyId.value, 'Active')
  saveMessage.value = 'Journey activated'
  saveSnack.value = true
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
    <MpEmptyState icon="search-x" title="Journey not found"
      description="This journey doesn't exist or was deleted." actionLabel="Back to Journeys" actionIcon="arrow-left"
      @action="router.push({ name: 'Journeys', params: { accountId } })" />
  </div>

  <div v-else class="jb-root d-flex flex-column">
    <!-- Toolbar -->
    <div class="jb-toolbar d-flex align-center justify-space-between px-5 border-b bg-surface">
      <div class="d-flex align-center gap-3" style="min-width:0;">
        <v-tooltip text="Back to Journeys" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="arrow-left" variant="text" size="small" aria-label="Back to Journeys"
              @click="router.push({ name: 'Journeys', params: { accountId } })"></v-btn>
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
        <v-tooltip text="Journey settings" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="settings" variant="text" size="small" aria-label="Journey settings"></v-btn>
          </template>
        </v-tooltip>
        <v-divider vertical class="mx-1" style="height:24px;"></v-divider>
        <v-btn variant="outlined" size="small" class="text-none" prepend-icon="save" @click="saveDraftJourney">Save draft</v-btn>
        <v-btn color="primary" variant="flat" size="small" class="text-none" prepend-icon="play" @click="activateJourney">Activate</v-btn>
      </div>
    </div>

    <!-- Body -->
    <div class="d-flex flex-grow-1" style="overflow:hidden;">
      <!-- Palette -->
      <aside class="jb-palette border-r bg-surface d-flex flex-column">
        <div class="pa-3 border-b">
          <div class="text-overline text-medium-emphasis" style="line-height:1.2;">Journey steps</div>
          <div class="text-caption text-medium-emphasis">Click a step to add it to your flow</div>
        </div>
        <div class="flex-grow-1 overflow-y-auto pa-2">
          <div v-for="s in paletteSections" :key="s.key" class="palette-section">
            <button class="palette-section__header" :aria-expanded="openSections[s.key]" :aria-controls="`palette-${s.key}`"
              @click="toggleSection(s.key)">
              <span class="palette-dot" :style="{ backgroundColor: `rgb(var(--v-theme-${s.color}))` }"></span>
              <span class="palette-section__label">{{ s.label }}</span>
              <span class="text-caption text-disabled mr-1">{{ s.items.length }}</span>
              <v-icon size="18" class="palette-chevron" :class="{ 'palette-chevron--open': openSections[s.key] }">chevron-down</v-icon>
            </button>
            <div v-show="openSections[s.key]" :id="`palette-${s.key}`" class="palette-section__items">
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
              <template v-for="node in sortedNodes" :key="node.id">
                <div class="d-flex flex-column align-center flow-node-wrap">
                  <div class="flow-node" :class="{ 'flow-node--selected': selectedNodeId === node.id }">
                    <button class="flow-node__open" :aria-label="`Configure step: ${node.title}`" @click="selectNode(node.id)">
                      <span class="flow-node__header" :style="headerStyle(node.category)">
                        <v-avatar :color="categoryColor[node.category]" size="34" rounded="lg" class="flex-shrink-0">
                          <v-icon color="white" size="18">{{ node.icon }}</v-icon>
                        </v-avatar>
                        <span class="flow-node__heading">
                          <span class="flow-node__type">{{ categoryLabel(node.category) }}</span>
                          <span class="flow-node__title">{{ node.title }}</span>
                          <span v-if="node.contacts != null" class="flow-node__meta">
                            <v-icon size="11" class="mr-1">users</v-icon>{{ node.contacts.toLocaleString() }} contacts
                          </span>
                        </span>
                      </span>
                      <span class="flow-node__body">{{ node.subtitle }}</span>
                    </button>

                    <div class="flow-node__tools">
                      <v-menu location="bottom end">
                        <template #activator="{ props }">
                          <v-btn v-bind="props" icon="more-vertical" variant="text" size="x-small"
                            :aria-label="`Actions for ${node.title}`" @click.stop></v-btn>
                        </template>
                        <v-card rounded="lg" border flat width="180" class="py-1">
                          <v-list density="compact" nav>
                            <v-list-item prepend-icon="pencil" title="Configure" @click="selectNode(node.id)"></v-list-item>
                            <v-list-item prepend-icon="copy" title="Duplicate" :disabled="node.category === 'trigger' || node.category === 'filter'"
                              @click="duplicateNode(node.id)"></v-list-item>
                            <v-list-item prepend-icon="trash-2" title="Delete" base-color="error"
                              :disabled="node.category === 'trigger'" @click="deleteNode(node.id)"></v-list-item>
                          </v-list>
                        </v-card>
                      </v-menu>
                    </div>
                  </div>

                  <!-- Connector + add-step -->
                  <div class="d-flex flex-column align-center">
                    <div class="flow-connector"></div>
                    <v-menu :close-on-content-click="true" location="right">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="plus" size="x-small" variant="flat" color="primary" class="add-btn"
                          aria-label="Add step after this one"></v-btn>
                      </template>
                      <v-card rounded="lg" border flat width="220" class="py-2">
                        <div class="px-3 py-1 text-caption text-medium-emphasis font-weight-bold text-uppercase border-b mb-1">Add step</div>
                        <v-list density="compact" nav>
                          <v-list-item v-for="tmpl in addableItems" :key="tmpl.kind" rounded="lg" @click="addNodeAfter(node.id, tmpl)">
                            <template #prepend>
                              <v-avatar :color="categoryColor[tmpl.category]" size="22" rounded="md">
                                <v-icon color="white" size="13">{{ tmpl.icon }}</v-icon>
                              </v-avatar>
                            </template>
                            <v-list-item-title class="text-caption ml-2">{{ tmpl.title }}</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-card>
                    </v-menu>
                    <div class="flow-connector"></div>
                  </div>
                </div>
              </template>

              <v-card variant="outlined" rounded="lg" class="pa-3 d-flex align-center justify-center gap-2 text-medium-emphasis flow-end">
                <v-icon size="18">flag</v-icon>
                <span class="text-caption font-weight-medium">End of journey</span>
              </v-card>
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
          <v-text-field v-model="draft.title" label="Step name" variant="outlined" density="compact" class="mb-3"></v-text-field>
          <v-text-field v-model="draft.subtitle" label="Description" variant="outlined" density="compact" class="mb-4"></v-text-field>
          <v-divider class="mb-4"></v-divider>

          <template v-if="selectedNode.category === 'trigger'">
            <v-select label="Trigger condition" :items="['Any Order', 'Order > $50', 'First Order Only']" model-value="Any Order" variant="outlined" density="compact" class="mb-3"></v-select>
            <v-select label="Applies to list" :items="['All Contacts', 'VIP Customer Circle', 'Newsletter Subscribers']" model-value="All Contacts" variant="outlined" density="compact"></v-select>
          </template>
          <template v-else-if="selectedNode.kind === 'send-email'">
            <v-select label="Email template" :items="['Thank You Email', 'Review Request', 'Win-Back', 'Upsell Offer']" variant="outlined" density="compact" class="mb-3"></v-select>
            <v-text-field label="Subject line" :model-value="selectedNode.subtitle" variant="outlined" density="compact" class="mb-3"></v-text-field>
            <v-text-field label="Sender name" model-value="MaropostX Store" variant="outlined" density="compact"></v-text-field>
          </template>
          <template v-else-if="selectedNode.category === 'delay'">
            <div class="d-flex gap-2 mb-3">
              <v-text-field label="Duration" model-value="7" variant="outlined" density="compact" type="number" style="width:90px;flex-shrink:0;"></v-text-field>
              <v-select label="Unit" :items="['Minutes', 'Hours', 'Days', 'Weeks']" model-value="Days" variant="outlined" density="compact"></v-select>
            </div>
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">Journey pauses here for the specified duration.</v-alert>
          </template>
          <template v-else-if="selectedNode.category === 'filter'">
            <v-select label="Check event" :items="['Email Opened', 'Email Clicked', 'Product Purchased', 'Contact Field']" model-value="Email Opened" variant="outlined" density="compact" class="mb-3"></v-select>
            <v-select label="Time window" :items="['Since last email', 'Last 24 hours', 'Last 7 days']" model-value="Since last email" variant="outlined" density="compact" class="mb-3"></v-select>
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">YES branch: condition met. NO branch: not met.</v-alert>
          </template>
          <template v-else>
            <v-text-field label="Tag name" model-value="Reviewed" variant="outlined" density="compact" class="mb-3"></v-text-field>
            <v-select label="Operation" :items="['Apply Tag', 'Remove Tag']" model-value="Apply Tag" variant="outlined" density="compact"></v-select>
          </template>
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

.flow-node {
  position: relative; width: 460px; background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px; overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s;
}
.flow-node:hover { border-color: rgba(var(--v-theme-primary), 0.5); }
.flow-node--selected { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 1px rgb(var(--v-theme-primary)); }

.flow-node__open {
  display: block; width: 100%; padding: 0; margin: 0; border: 0;
  background: transparent; text-align: left; cursor: pointer; color: inherit;
}
.flow-node__open:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; border-radius: 12px; }
.flow-node__header {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 64px 10px 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.flow-node__heading { display: flex; flex-direction: column; min-width: 0; }
.flow-node__type { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgba(var(--v-theme-on-surface), 0.55); line-height: 1.4; }
.flow-node__title { font-size: 0.875rem; font-weight: 700; color: rgb(var(--v-theme-on-surface)); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.flow-node__meta { display: inline-flex; align-items: center; margin-top: 2px; font-size: 0.6875rem; font-weight: 600; line-height: 1.3; color: rgba(var(--v-theme-on-surface), 0.6); }
.flow-node__body { display: block; padding: 10px 14px; font-size: 0.75rem; color: rgba(var(--v-theme-on-surface), 0.65); }
.flow-node__tools { position: absolute; top: 8px; right: 8px; }

.flow-connector { width: 2px; height: 22px; background: rgba(var(--v-border-color), 0.6); }
.add-btn { opacity: 0.4; transition: opacity 0.15s, transform 0.15s; }
.flow-node-wrap:hover .add-btn { opacity: 1; transform: scale(1.08); }
.add-btn:focus-visible { opacity: 1; }
.flow-end { border-style: dashed; width: 200px; }

/* ── Zoom controls ───────────────────────────────────────────────────────── */
.jb-zoom { position: absolute; bottom: 16px; right: 16px; padding: 2px; gap: 2px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.jb-zoom__pct { min-width: 40px; text-align: center; color: rgba(var(--v-theme-on-surface), 0.7); }

/* ── Config panel ────────────────────────────────────────────────────────── */
.jb-panel { width: 340px; flex-shrink: 0; overflow: hidden; }
</style>
