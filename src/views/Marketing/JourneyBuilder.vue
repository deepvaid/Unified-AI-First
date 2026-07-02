<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MpStatusChip from '@/components/MpStatusChip.vue'

const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

type NodeType = 'trigger' | 'email' | 'delay' | 'condition' | 'action'

interface FlowNode {
  id: string; type: NodeType; title: string; subtitle: string
  icon: string; contacts?: number; branch?: 'yes' | 'no'; children: string[]
}
interface PaletteItem { type: NodeType; title: string; subtitle: string; icon: string }
interface PaletteSection { key: string; label: string; color: string; items: PaletteItem[] }

// Node colour is driven purely by category (the Liquid Sky reference colour-codes
// by step type, never per-node): triggers=blue, actions/email=green,
// conditions=purple (stands in for the reference navy), delays=amber (for pink).
const typeColor: Record<NodeType, string> = {
  trigger: 'primary',
  email: 'success',
  action: 'success',
  condition: 'secondary',
  delay: 'warning',
}
const headerStyle = (t: NodeType) => ({
  backgroundColor: `rgba(var(--v-theme-${typeColor[t]}), 0.12)`,
  borderBottomColor: `rgba(var(--v-theme-${typeColor[t]}), 0.24)`,
})

const journeyName = ref('Post-Purchase — Thank You + Review Request')
const journeyStatus = ref<'Draft' | 'Active'>('Draft')
const editingName = ref(false)
const nameInput = ref('')
const saveSnack = ref(false)
const saveMessage = ref('Journey saved')
const selectedNodeId = ref<string | null>(null)

// Step palette — Liquid Sky reference categories. Section dots reuse the same
// category colour as the nodes they create (see typeColor).
const paletteSections: PaletteSection[] = [
  {
    key: 'triggers', label: 'Triggers', color: 'primary',
    items: [
      { type: 'trigger', title: 'New Subscription', subtitle: 'Contact joins a list', icon: 'user-plus' },
      { type: 'trigger', title: 'Campaign Opened', subtitle: 'Contact opens an email', icon: 'mail-open' },
      { type: 'trigger', title: 'Link Clicked', subtitle: 'Contact clicks a link', icon: 'mouse-pointer-click' },
      { type: 'trigger', title: 'Product Purchased', subtitle: 'Order completed', icon: 'shopping-cart' },
      { type: 'trigger', title: 'Cart Abandoned', subtitle: 'Cart idle for N minutes', icon: 'shopping-cart' },
      { type: 'trigger', title: 'Form Submitted', subtitle: 'Acquisition form event', icon: 'list-checks' },
      { type: 'trigger', title: 'Segment Entry', subtitle: 'Contact matches segment', icon: 'users' },
      { type: 'trigger', title: 'API Event', subtitle: 'External webhook', icon: 'code' },
    ],
  },
  {
    key: 'actions', label: 'Actions', color: 'success',
    items: [
      { type: 'email', title: 'Send Email', subtitle: 'Deliver a campaign email', icon: 'send' },
      { type: 'action', title: 'Apply Tag', subtitle: 'Add a tag to contact', icon: 'tags' },
      { type: 'action', title: 'Remove Tag', subtitle: 'Remove tag from contact', icon: 'tag' },
      { type: 'action', title: 'Update Field', subtitle: 'Set a contact field value', icon: 'pencil' },
      { type: 'action', title: 'Add to List', subtitle: 'Subscribe to another list', icon: 'list-plus' },
      { type: 'action', title: 'HTTP Post', subtitle: 'Send to external URL', icon: 'webhook' },
    ],
  },
  {
    key: 'logic', label: 'Logic & Filters', color: 'secondary',
    items: [
      { type: 'condition', title: 'If / Else Condition', subtitle: 'Branch based on event', icon: 'split' },
    ],
  },
  {
    key: 'delay', label: 'Delay', color: 'warning',
    items: [
      { type: 'delay', title: 'Wait / Delay', subtitle: 'Pause before next step', icon: 'hourglass' },
    ],
  },
]

const openSections = reactive<Record<string, boolean>>({ triggers: true, actions: true, logic: true, delay: true })
function toggleSection(key: string) { openSections[key] = !openSections[key] }

const addableItems = computed(() => paletteSections.filter(s => s.key !== 'triggers').flatMap(s => s.items))

const nodes = ref<FlowNode[]>([
  { id: 'n1', type: 'trigger', title: 'Product Purchased', subtitle: 'Any order with total > $0', icon: 'shopping-cart', contacts: 1240, children: ['n2'] },
  { id: 'n2', type: 'delay', title: 'Wait 2 Hours', subtitle: 'Processing window', icon: 'hourglass', contacts: 1240, children: ['n3'] },
  { id: 'n3', type: 'email', title: 'Send: Thank You Email', subtitle: 'Subject: "Your order is confirmed! 🎉"', icon: 'send', contacts: 1235, children: ['n4'] },
  { id: 'n4', type: 'delay', title: 'Wait 7 Days', subtitle: 'Allow delivery + use time', icon: 'hourglass', contacts: 1180, children: ['n5'] },
  { id: 'n5', type: 'condition', title: 'Opened Thank You Email?', subtitle: 'Check open event on Email #1', icon: 'split', contacts: 1170, children: ['n6', 'n7'] },
  { id: 'n6', type: 'email', title: 'YES → Send: Review Request', subtitle: 'Subject: "How did we do? ⭐"', icon: 'star', contacts: 690, branch: 'yes', children: ['n8'] },
  { id: 'n7', type: 'email', title: 'NO → Resend New Subject', subtitle: 'Subject: "One quick question 👋"', icon: 'mail-x', contacts: 480, branch: 'no', children: ['n8'] },
  { id: 'n8', type: 'action', title: 'Apply Tag: Reviewed', subtitle: 'Mark contact journey complete', icon: 'tags', contacts: 1170, children: [] },
])

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

function addNodeAfter(afterId: string, tmpl: PaletteItem) {
  const newId = `n${Date.now()}`
  const parent = nodes.value.find(n => n.id === afterId)
  const newNode: FlowNode = {
    id: newId, type: tmpl.type, title: tmpl.title, subtitle: tmpl.subtitle,
    icon: tmpl.icon, children: parent ? [...parent.children] : [],
  }
  if (parent) parent.children = [newId]
  nodes.value.push(newNode)
  selectedNodeId.value = newId
}

function addFromPalette(item: PaletteItem) {
  if (item.type === 'trigger') {
    const root = nodes.value[0]
    if (root) { root.title = item.title; root.subtitle = item.subtitle; root.icon = item.icon; selectedNodeId.value = root.id }
    return
  }
  addNodeAfter(selectedNodeId.value ?? lastMainNodeId(), item)
}

function duplicateNode(id: string) {
  const src = nodes.value.find(n => n.id === id)
  if (!src || src.type === 'trigger') return
  addNodeAfter(id, { type: src.type, title: `${src.title} (copy)`, subtitle: src.subtitle, icon: src.icon })
}

function deleteNode(id: string) {
  const target = nodes.value.find(n => n.id === id)
  if (!target || target.type === 'trigger') return
  nodes.value.forEach(n => { if (n.children.includes(id)) n.children = [...n.children.filter(c => c !== id), ...target.children] })
  nodes.value = nodes.value.filter(n => n.id !== id)
  if (selectedNodeId.value === id) selectedNodeId.value = null
}

// ── Config panel draft (real round-trip for name + description) ───────────────
const draft = reactive({ title: '', subtitle: '' })
watch(selectedNodeId, () => {
  const n = selectedNode.value
  if (n) { draft.title = n.title; draft.subtitle = n.subtitle }
})
function saveNode() {
  const n = selectedNode.value
  if (n) { n.title = draft.title.trim() || n.title; n.subtitle = draft.subtitle }
  saveMessage.value = 'Step updated'
  saveSnack.value = true
  selectedNodeId.value = null
}
function cancelPanel() { selectedNodeId.value = null }

function saveDraftJourney() { saveMessage.value = 'Draft saved'; saveSnack.value = true }
function activateJourney() { journeyStatus.value = 'Active'; saveMessage.value = 'Journey activated'; saveSnack.value = true }

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

const typeLabel = (t: NodeType) => ({ trigger: 'Trigger', email: 'Email', delay: 'Delay', condition: 'Condition', action: 'Action' })[t]
</script>

<template>
  <div class="jb-root d-flex flex-column">
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
              <button v-for="item in s.items" :key="item.title" class="palette-item" @click="addFromPalette(item)">
                <v-avatar :color="typeColor[item.type]" size="28" rounded="lg">
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
                <div v-if="node.branch" class="mb-2">
                  <v-chip :color="node.branch === 'yes' ? 'success' : 'error'" size="x-small" variant="flat" class="font-weight-bold">
                    {{ node.branch === 'yes' ? '✓ YES' : '✗ NO' }}
                  </v-chip>
                </div>

                <div class="d-flex flex-column align-center flow-node-wrap">
                  <div class="flow-node" :class="{ 'flow-node--selected': selectedNodeId === node.id }">
                    <button class="flow-node__open" :aria-label="`Configure step: ${node.title}`" @click="selectNode(node.id)">
                      <span class="flow-node__header" :style="headerStyle(node.type)">
                        <v-avatar :color="typeColor[node.type]" size="34" rounded="lg" class="flex-shrink-0">
                          <v-icon color="white" size="18">{{ node.icon }}</v-icon>
                        </v-avatar>
                        <span class="flow-node__heading">
                          <span class="flow-node__type">{{ typeLabel(node.type) }}</span>
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
                            <v-list-item prepend-icon="copy" title="Duplicate" :disabled="node.type === 'trigger'"
                              @click="duplicateNode(node.id)"></v-list-item>
                            <v-list-item prepend-icon="trash-2" title="Delete" base-color="error"
                              :disabled="node.type === 'trigger'" @click="deleteNode(node.id)"></v-list-item>
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
                          <v-list-item v-for="tmpl in addableItems" :key="tmpl.title" rounded="lg" @click="addNodeAfter(node.id, tmpl)">
                            <template #prepend>
                              <v-avatar :color="typeColor[tmpl.type]" size="22" rounded="md">
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
            <v-avatar :color="typeColor[selectedNode.type]" size="32" rounded="lg" class="flex-shrink-0">
              <v-icon color="white" size="17">{{ selectedNode.icon }}</v-icon>
            </v-avatar>
            <div style="min-width:0;">
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase">{{ typeLabel(selectedNode.type) }}</div>
              <div class="text-body-2 font-weight-bold text-truncate">{{ selectedNode.title }}</div>
            </div>
          </div>
          <v-btn icon="x" variant="text" size="small" aria-label="Close settings panel" @click="cancelPanel"></v-btn>
        </div>

        <div class="pa-4 flex-grow-1 overflow-y-auto">
          <v-text-field v-model="draft.title" label="Step name" variant="outlined" density="compact" class="mb-3"></v-text-field>
          <v-text-field v-model="draft.subtitle" label="Description" variant="outlined" density="compact" class="mb-4"></v-text-field>
          <v-divider class="mb-4"></v-divider>

          <template v-if="selectedNode.type === 'trigger'">
            <v-select label="Trigger condition" :items="['Any Order', 'Order > $50', 'First Order Only']" model-value="Any Order" variant="outlined" density="compact" class="mb-3"></v-select>
            <v-select label="Applies to list" :items="['All Contacts', 'VIP Customer Circle', 'Newsletter Subscribers']" model-value="All Contacts" variant="outlined" density="compact"></v-select>
          </template>
          <template v-else-if="selectedNode.type === 'email'">
            <v-select label="Email template" :items="['Thank You Email', 'Review Request', 'Win-Back', 'Upsell Offer']" variant="outlined" density="compact" class="mb-3"></v-select>
            <v-text-field label="Subject line" :model-value="selectedNode.subtitle" variant="outlined" density="compact" class="mb-3"></v-text-field>
            <v-text-field label="Sender name" model-value="MaropostX Store" variant="outlined" density="compact"></v-text-field>
          </template>
          <template v-else-if="selectedNode.type === 'delay'">
            <div class="d-flex gap-2 mb-3">
              <v-text-field label="Duration" model-value="7" variant="outlined" density="compact" type="number" style="width:90px;flex-shrink:0;"></v-text-field>
              <v-select label="Unit" :items="['Minutes', 'Hours', 'Days', 'Weeks']" model-value="Days" variant="outlined" density="compact"></v-select>
            </div>
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">Journey pauses here for the specified duration.</v-alert>
          </template>
          <template v-else-if="selectedNode.type === 'condition'">
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
