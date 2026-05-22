<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)
type NodeType = 'trigger' | 'email' | 'delay' | 'condition' | 'action'

interface FlowNode {
  id: string; type: NodeType; title: string; subtitle: string
  icon: string; color: string; branch?: 'yes'|'no'; children: string[]
}

const sidebarTab = ref<'triggers'|'actions'>('triggers')
const journeyName = ref('Post-Purchase — Thank You + Review Request')
const journeyStatus = ref<'Draft'|'Active'>('Draft')
const editingName = ref(false)
const nameInput = ref('')
const saveSnack = ref(false)
const selectedNodeId = ref<string|null>(null)

const triggerNodes = [
  { type: 'trigger' as NodeType, title: 'New Subscription', subtitle: 'Contact joins a list', icon: 'user-plus', color: 'secondary' },
  { type: 'trigger' as NodeType, title: 'Campaign Opened', subtitle: 'Contact opens an email', icon: 'mail-open', color: 'secondary' },
  { type: 'trigger' as NodeType, title: 'Link Clicked', subtitle: 'Contact clicks a link', icon: 'mouse-pointer-click', color: 'secondary' },
  { type: 'trigger' as NodeType, title: 'Product Purchased', subtitle: 'Order completed', icon: 'shopping-cart', color: 'secondary' },
  { type: 'trigger' as NodeType, title: 'Cart Abandoned', subtitle: 'Cart idle for N minutes', icon: 'shopping-cart', color: 'secondary' },
  { type: 'trigger' as NodeType, title: 'Form Submitted', subtitle: 'Acquisition form event', icon: 'list-checks', color: 'secondary' },
  { type: 'trigger' as NodeType, title: 'Segment Entry', subtitle: 'Contact matches segment', icon: 'users', color: 'secondary' },
  { type: 'trigger' as NodeType, title: 'API Event', subtitle: 'External webhook', icon: 'code-2', color: 'secondary' },
]
const actionNodes = [
  { type: 'email' as NodeType, title: 'Send Email', subtitle: 'Deliver a campaign email', icon: 'send', color: 'primary' },
  { type: 'delay' as NodeType, title: 'Wait / Delay', subtitle: 'Pause before next step', icon: 'hourglass', color: 'grey-darken-1' },
  { type: 'condition' as NodeType, title: 'If / Else Condition', subtitle: 'Branch based on event', icon: 'split', color: 'warning' },
  { type: 'action' as NodeType, title: 'Apply Tag', subtitle: 'Add a tag to contact', icon: 'tags', color: 'success' },
  { type: 'action' as NodeType, title: 'Remove Tag', subtitle: 'Remove tag from contact', icon: 'tag', color: 'error' },
  { type: 'action' as NodeType, title: 'Update Field', subtitle: 'Set a contact field value', icon: 'pencil', color: 'info' },
  { type: 'action' as NodeType, title: 'Add to List', subtitle: 'Subscribe to another list', icon: 'playlist-plus', color: 'success' },
  { type: 'action' as NodeType, title: 'HTTP Post', subtitle: 'Send to external URL', icon: 'globehook', color: 'purple' },
]

const nodes = ref<FlowNode[]>([
  { id:'n1', type:'trigger', title:'Product Purchased', subtitle:'Any order with total > $0', icon:'shopping-cart', color:'secondary', children:['n2'] },
  { id:'n2', type:'delay', title:'Wait 2 Hours', subtitle:'Processing window', icon:'hourglass', color:'grey-darken-1', children:['n3'] },
  { id:'n3', type:'email', title:'Send: Thank You Email', subtitle:'Subject: "Your order is confirmed! 🎉"', icon:'send', color:'primary', children:['n4'] },
  { id:'n4', type:'delay', title:'Wait 7 Days', subtitle:'Allow delivery + use time', icon:'hourglass', color:'grey-darken-1', children:['n5'] },
  { id:'n5', type:'condition', title:'Opened Thank You Email?', subtitle:'Check open event on Email #1', icon:'split', color:'warning', children:['n6','n7'] },
  { id:'n6', type:'email', title:'YES → Send: Review Request', subtitle:'Subject: "How did we do? ⭐"', icon:'star', color:'primary', branch:'yes', children:['n8'] },
  { id:'n7', type:'email', title:'NO → Resend New Subject', subtitle:'Subject: "One quick question 👋"', icon:'mail-x', color:'error', branch:'no', children:['n8'] },
  { id:'n8', type:'action', title:'Apply Tag: Reviewed', subtitle:'Mark contact journey complete', icon:'tags', color:'success', children:[] },
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

function selectNode(id: string) { selectedNodeId.value = selectedNodeId.value === id ? null : id }
function addNodeAfter(afterId: string, tmpl: typeof actionNodes[0]) {
  const newId = `n${Date.now()}`
  const parent = nodes.value.find(n => n.id === afterId)
  const newNode: FlowNode = { id: newId, type: tmpl.type, title: tmpl.title, subtitle: tmpl.subtitle, icon: tmpl.icon, color: tmpl.color, children: parent ? [...parent.children] : [] }
  if (parent) parent.children = [newId]
  nodes.value.push(newNode)
  selectedNodeId.value = newId
}
function deleteNode(id: string) {
  const target = nodes.value.find(n => n.id === id)
  if (!target || target.type === 'trigger') return
  nodes.value.forEach(n => { if (n.children.includes(id)) n.children = [...n.children.filter(c => c !== id), ...target.children] })
  nodes.value = nodes.value.filter(n => n.id !== id)
  if (selectedNodeId.value === id) selectedNodeId.value = null
}

const typeLabel = (t: NodeType) => ({ trigger:'Trigger', email:'Email', delay:'Delay', condition:'Condition', action:'Action' })[t]
const typeBadgeColor = (t: NodeType) => ({ trigger:'secondary', email:'primary', delay:'grey-darken-1', condition:'warning', action:'success' })[t]
</script>

<template>
  <div class="d-flex flex-column" style="height:100vh;overflow:hidden;">
    <!-- Toolbar -->
    <div class="d-flex align-center justify-space-between px-5 border-b bg-surface" style="height:56px;flex-shrink:0;">
      <div class="d-flex align-center gap-3">
        <v-tooltip text="Back to Journeys" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="arrow-left" variant="text" size="small" aria-label="Back to Journeys" @click="router.push({ name: 'Journeys', params: { accountId: accountId } })"></v-btn>
          </template>
        </v-tooltip>
        <div v-if="!editingName" class="font-weight-bold text-body-1 cursor-pointer" @click="editingName=true;nameInput=journeyName">{{ journeyName }}</div>
        <v-text-field v-else v-model="nameInput" variant="outlined" density="compact" hide-details autofocus style="width:300px;"
          @blur="journeyName=nameInput;editingName=false" @keyup.enter="journeyName=nameInput;editingName=false"></v-text-field>
        <v-chip :color="journeyStatus==='Active'?'success':'grey'" size="x-small" variant="flat" class="font-weight-bold">{{ journeyStatus }}</v-chip>
      </div>
      <div class="d-flex align-center gap-2">
        <v-tooltip text="Journey settings" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="settings" variant="text" size="small"></v-btn>
          </template>
        </v-tooltip>
        <v-divider vertical class="mx-1" style="height:24px;"></v-divider>
        <v-btn variant="flat" size="small" class="text-none" @click="saveSnack=true" color="surface">Save Draft</v-btn>
        <v-btn color="success" variant="elevated" size="small" class="text-none" prepend-icon="play" @click="journeyStatus='Active';saveSnack=true">Activate</v-btn>
      </div>
    </div>

    <!-- Body -->
    <div class="d-flex flex-grow-1" style="overflow:hidden;">
      <!-- Node Palette Sidebar -->
      <div class="border-r bg-surface d-flex flex-column" style="width:232px;flex-shrink:0;overflow-y:auto;">
        <div class="pa-3 border-b">
          <v-btn-toggle
            v-model="sidebarTab"
            density="compact"
            variant="outlined"
            divided
            mandatory
            rounded="lg"
            class="mp-toggle-group mp-toggle-group--segmented"
            style="width:100%;"
          >
            <v-btn value="triggers" class="text-none" size="small" style="flex:1;">Triggers</v-btn>
            <v-btn value="actions" class="text-none" size="small" style="flex:1;">Actions</v-btn>
          </v-btn-toggle>
        </div>
        <div class="pa-2 flex-grow-1 overflow-y-auto">
          <div class="text-caption text-medium-emphasis font-weight-bold px-1 pb-1 pt-2 text-uppercase">
            {{ sidebarTab === 'triggers' ? 'Journey Triggers' : 'Actions & Steps' }}
          </div>
          <div v-for="tmpl in sidebarTab==='triggers' ? triggerNodes : actionNodes" :key="tmpl.title"
            class="rounded-lg pa-2 mb-1 d-flex align-center gap-2 cursor-pointer node-palette-item">
            <v-avatar :color="tmpl.color" variant="tonal" size="28">
              <v-icon :color="tmpl.color" size="15">{{ tmpl.icon }}</v-icon>
            </v-avatar>
            <div style="min-width:0;">
              <div class="text-caption font-weight-bold text-truncate">{{ tmpl.title }}</div>
              <div class="text-medium-emphasis text-truncate" style="font-size:10px;">{{ tmpl.subtitle }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Canvas -->
      <div class="flex-grow-1 overflow-auto bg-background d-flex justify-center pa-8">
        <div class="d-flex flex-column align-center" style="min-width:520px;">
          <template v-for="node in sortedNodes" :key="node.id">
            <div v-if="node.branch" class="mb-2">
              <v-chip :color="node.branch==='yes'?'success':'error'" size="x-small" variant="flat" class="font-weight-bold">
                {{ node.branch==='yes' ? '✓ YES' : '✗ NO' }}
              </v-chip>
            </div>
            <div class="d-flex flex-column align-center flow-node-wrap">
              <v-card :variant="selectedNodeId===node.id?'elevated':'flat'" :elevation="selectedNodeId===node.id?4:0"
                border rounded="lg" class="pa-4 cursor-pointer flow-node" :class="{'node-selected':selectedNodeId===node.id}"
                style="width:460px;" @click="selectNode(node.id)">
                <div class="d-flex align-center gap-3">
                  <v-avatar :color="node.color" variant="tonal" size="40">
                    <v-icon :color="node.color" size="20">{{ node.icon }}</v-icon>
                  </v-avatar>
                  <div class="flex-grow-1" style="min-width:0;">
                    <div class="mb-1">
                      <v-chip :color="typeBadgeColor(node.type)" size="x-small" variant="flat" class="font-weight-bold text-uppercase">{{ typeLabel(node.type) }}</v-chip>
                    </div>
                    <div class="text-body-2 font-weight-bold text-truncate">{{ node.title }}</div>
                    <div class="text-caption text-medium-emphasis">{{ node.subtitle }}</div>
                  </div>
                  <div class="d-flex gap-1 node-actions">
                    <v-tooltip text="Edit" location="top">
                      <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="pencil" variant="text" size="x-small" color="primary" @click.stop="selectNode(node.id)"></v-btn>
                      </template>
                    </v-tooltip>
                    <v-tooltip text="Delete" location="top">
                      <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="trash-2" variant="text" size="x-small" color="error"
                          :disabled="node.type==='trigger'" @click.stop="deleteNode(node.id)"></v-btn>
                      </template>
                    </v-tooltip>
                  </div>
                </div>
              </v-card>

              <div class="d-flex flex-column align-center">
                <div style="width:2px;height:24px;background:rgba(var(--v-border-color),0.5);"></div>
                <v-menu :close-on-content-click="false" location="right">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="plus" size="x-small" variant="flat" color="primary" class="add-btn"></v-btn>
                  </template>
                  <v-card rounded="lg" elevation="8" width="200" class="py-2">
                    <div class="px-3 py-1 text-caption text-medium-emphasis font-weight-bold text-uppercase border-b mb-1">Add Step</div>
                    <v-list density="compact" nav>
                      <v-list-item v-for="tmpl in actionNodes" :key="tmpl.title" rounded="lg" @click="addNodeAfter(node.id, tmpl)">
                        <template v-slot:prepend><v-icon :color="tmpl.color" size="16">{{ tmpl.icon }}</v-icon></template>
                        <v-list-item-title class="text-caption">{{ tmpl.title }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </v-menu>
                <div style="width:2px;height:24px;background:rgba(var(--v-border-color),0.5);"></div>
              </div>
            </div>
          </template>
          <v-card variant="outlined" rounded="lg" class="pa-3 d-flex align-center justify-center gap-2 text-medium-emphasis" style="border-style:dashed;width:200px;">
            <v-icon size="18">flag</v-icon>
            <span class="text-caption font-weight-medium">End of Journey</span>
          </v-card>
        </div>
      </div>

      <!-- Detail Panel -->
      <div v-if="selectedNode" class="border-l bg-surface d-flex flex-column" style="width:296px;flex-shrink:0;overflow:hidden;">
        <div class="pa-4 border-b d-flex align-center justify-space-between" style="flex-shrink:0;">
          <div>
            <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-1">{{ typeLabel(selectedNode.type) }} Settings</div>
            <div class="text-body-2 font-weight-bold">{{ selectedNode.title }}</div>
          </div>
          <v-btn icon="x" variant="text" size="small" @click="selectedNodeId=null"></v-btn>
        </div>
        <div class="pa-4 flex-grow-1 overflow-y-auto">
          <template v-if="selectedNode.type==='trigger'">
            <v-select label="Trigger Condition" :items="['Any Order','Order > $50','First Order Only']" model-value="Any Order" variant="outlined" density="compact" class="mb-3"></v-select>
            <v-select label="Applies to List" :items="['All Contacts','VIP Customer Circle','Newsletter Subscribers']" model-value="All Contacts" variant="outlined" density="compact"></v-select>
          </template>
          <template v-else-if="selectedNode.type==='email'">
            <v-select label="Email Template" :items="['Thank You Email','Review Request','Win-Back','Upsell Offer']" variant="outlined" density="compact" class="mb-3"></v-select>
            <v-text-field label="Subject Line" :model-value="selectedNode.subtitle" variant="outlined" density="compact" class="mb-3"></v-text-field>
            <v-text-field label="Sender Name" model-value="MaropostX Store" variant="outlined" density="compact"></v-text-field>
          </template>
          <template v-else-if="selectedNode.type==='delay'">
            <div class="d-flex gap-2 mb-3">
              <v-text-field label="Duration" model-value="7" variant="outlined" density="compact" type="number" style="width:90px;flex-shrink:0;"></v-text-field>
              <v-select label="Unit" :items="['Minutes','Hours','Days','Weeks']" model-value="Days" variant="outlined" density="compact"></v-select>
            </div>
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">Journey pauses here for the specified duration.</v-alert>
          </template>
          <template v-else-if="selectedNode.type==='condition'">
            <v-select label="Check Event" :items="['Email Opened','Email Clicked','Product Purchased','Contact Field']" model-value="Email Opened" variant="outlined" density="compact" class="mb-3"></v-select>
            <v-select label="Time Window" :items="['Since last email','Last 24 hours','Last 7 days']" model-value="Since last email" variant="outlined" density="compact" class="mb-3"></v-select>
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">YES branch: condition met. NO branch: not met.</v-alert>
          </template>
          <template v-else>
            <v-text-field label="Tag Name" model-value="Reviewed" variant="outlined" density="compact" class="mb-3"></v-text-field>
            <v-select label="Operation" :items="['Apply Tag','Remove Tag']" model-value="Apply Tag" variant="outlined" density="compact"></v-select>
          </template>
        </div>
        <div class="pa-4 border-t">
          <v-btn color="primary" variant="elevated" block class="text-none" @click="selectedNodeId=null">Apply Changes</v-btn>
        </div>
      </div>
    </div>

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Journey saved</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-l { border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.node-palette-item { transition: background 0.15s; }
.node-palette-item:hover { background: rgba(var(--v-theme-primary), 0.08); }
.flow-node { transition: box-shadow 0.15s; }
.flow-node:hover { border-color: rgb(var(--v-theme-primary)) !important; }
.node-selected { border-color: rgb(var(--v-theme-primary)) !important; }
.node-actions { opacity: 0; transition: opacity 0.15s; }
.flow-node:hover .node-actions { opacity: 1; }
.add-btn { opacity: 0.35; transition: opacity 0.15s, transform 0.15s; }
.flow-node-wrap:hover .add-btn { opacity: 1; transform: scale(1.1); }
</style>
