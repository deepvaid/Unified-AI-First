<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import TicketWorkspace from '@/components/service/TicketWorkspace.vue'
import {
  useTicketsStore,
  emptyTicketFilters,
  SUPPORT_INBOXES,
  TICKET_AGENTS,
  TICKET_CHANNELS,
  TICKET_GROUPS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TAGS,
  TICKET_TYPES,
  type Ticket,
  type TicketFilters,
} from '@/stores/useTickets'
import { useToast } from '@/composables/useToast'

const store = useTicketsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const accountId = computed(() => route.params.accountId as string)
const CURRENT_AGENT = 'Deepak Vaidya'

// ── Views menu (inbox groups × built-in + saved views, Trash last) ───────────
const BUILT_IN_VIEWS = ['All Tickets', 'My Tickets', 'High Priority Tickets']
const currentInbox = ref<'all' | 'trash' | string>('all')
const currentView = ref('All Tickets')
const viewsMenuOpen = ref(false)

const inboxGroups = computed(() => [
  { key: 'all', label: 'ALL INBOXES' },
  ...SUPPORT_INBOXES.map(name => ({ key: name, label: name.toUpperCase() })),
])
const viewNames = computed(() => [...BUILT_IN_VIEWS, ...store.customViews.map(v => v.name)])

const currentLabel = computed(() => {
  if (currentInbox.value === 'trash') return 'Trash'
  const inbox = currentInbox.value === 'all' ? 'All Inboxes' : currentInbox.value
  return `${inbox} · ${currentView.value}`
})

function selectView(inboxKey: string, view: string) {
  currentInbox.value = inboxKey
  currentView.value = view
  const saved = store.customViews.find(v => v.name === view)
  appliedFilters.value = saved ? { ...saved.filters } : emptyTicketFilters()
  checked.value = []
  viewsMenuOpen.value = false
}

function selectTrash() {
  currentInbox.value = 'trash'
  currentView.value = 'All Tickets'
  appliedFilters.value = emptyTicketFilters()
  checked.value = []
  viewsMenuOpen.value = false
}

// ── Filters drawer ────────────────────────────────────────────────────────────
const filtersOpen = ref(false)
const workingFilters = reactive<TicketFilters>(emptyTicketFilters())
const appliedFilters = ref<TicketFilters>(emptyTicketFilters())
const filtersDirty = computed(() => JSON.stringify(workingFilters) !== JSON.stringify(appliedFilters.value))

watch(filtersOpen, open => {
  if (open) Object.assign(workingFilters, JSON.parse(JSON.stringify(appliedFilters.value)))
})

function applyFilters() {
  appliedFilters.value = JSON.parse(JSON.stringify(workingFilters))
  filtersOpen.value = false
}
function clearFilters() {
  Object.assign(workingFilters, emptyTicketFilters())
}

const saveViewDialog = ref(false)
const saveViewName = ref('')
function saveAsView() {
  const name = saveViewName.value.trim()
  if (!name) return
  store.saveView(name, JSON.parse(JSON.stringify(workingFilters)))
  appliedFilters.value = JSON.parse(JSON.stringify(workingFilters))
  currentView.value = name
  saveViewDialog.value = false
  saveViewName.value = ''
  filtersOpen.value = false
  toast.success(`View "${name}" saved`)
}

const contactOptions = computed(() =>
  [...new Set(store.tickets.map(t => `${t.customer} - ${t.customerEmail}`))],
)

// ── The list ──────────────────────────────────────────────────────────────────
const listTickets = computed<Ticket[]>(() => {
  let list = currentInbox.value === 'trash' ? store.trashedTickets : store.visibleTickets
  if (currentInbox.value !== 'all' && currentInbox.value !== 'trash') {
    list = list.filter(t => t.inbox === currentInbox.value)
  }
  if (currentView.value === 'My Tickets') list = list.filter(t => t.assignee === CURRENT_AGENT)
  if (currentView.value === 'High Priority Tickets') list = list.filter(t => t.priority === 'High')

  const f = appliedFilters.value
  if (f.status.length) list = list.filter(t => f.status.includes(t.status))
  if (f.priority.length) list = list.filter(t => f.priority.includes(t.priority))
  if (f.channel.length) list = list.filter(t => t.channel && f.channel.includes(t.channel))
  if (f.type.length) list = list.filter(t => f.type.includes(t.type))
  if (f.group.length) list = list.filter(t => f.group.includes(t.group))
  if (f.agent) list = list.filter(t => t.assignee === f.agent)
  if (f.contact) list = list.filter(t => `${t.customer} - ${t.customerEmail}` === f.contact)
  if (f.tags.length) list = list.filter(t => f.tags.some(tag => t.tags.includes(tag)))
  if (f.createdFrom) list = list.filter(t => t.createdAt >= f.createdFrom)
  if (f.createdTo) list = list.filter(t => t.createdAt.slice(0, 10) <= f.createdTo)
  if (f.readStatus) list = list.filter(t => (f.readStatus === 'Unread') === t.unread)

  return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

function formatListDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dayDiff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000)
  if (dayDiff <= 0) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (dayDiff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const snippet = (t: Ticket) => t.thread.find(m => m.role === 'customer')?.body ?? ''

// ── Selection (detail pane) — the selected ticket lives in the URL ────────────
const selectedId = computed(() => Number(route.query.selected ?? 0))
const selectedTicket = computed(() => (selectedId.value ? store.find(selectedId.value) : undefined))

function openTicket(t: Ticket) {
  router.replace({ query: { ...route.query, selected: String(t.id) } })
  store.markRead(t.id)
  store.setActive(t.id)
}

// ── Bulk selection ────────────────────────────────────────────────────────────
const checked = ref<number[]>([])
function toggleChecked(id: number, value: boolean) {
  checked.value = value ? [...checked.value, id] : checked.value.filter(x => x !== id)
}

const assignDialog = ref(false)
const assignAgent = ref('')
function confirmAssign() {
  if (!assignAgent.value) return
  store.assignMany(checked.value, assignAgent.value)
  toast.success(`${checked.value.length} ticket${checked.value.length === 1 ? '' : 's'} assigned to ${assignAgent.value}`)
  assignDialog.value = false
  assignAgent.value = ''
  checked.value = []
}

function closeSelected() {
  store.closeMany(checked.value)
  toast.success(`${checked.value.length} ticket${checked.value.length === 1 ? '' : 's'} closed`)
  checked.value = []
}

function unreadSelected() {
  store.markUnread(checked.value)
  toast.success('Marked as unread')
  checked.value = []
}

const deleteDialog = ref(false)
function confirmDelete() {
  store.trashMany(checked.value)
  toast.success(`${checked.value.length} ticket${checked.value.length === 1 ? '' : 's'} moved to Trash`)
  if (checked.value.includes(selectedId.value)) {
    router.replace({ query: { ...route.query, selected: undefined } })
  }
  checked.value = []
}

function restoreSelected() {
  store.restoreMany(checked.value)
  toast.success(`${checked.value.length} ticket${checked.value.length === 1 ? '' : 's'} restored`)
  checked.value = []
}

// ── Header actions ────────────────────────────────────────────────────────────
function newTicket() {
  router.push({ name: 'TicketCreate', params: { accountId: accountId.value } })
}
function newContact() {
  router.push({ name: 'CreateContact', params: { accountId: accountId.value } })
}
</script>

<template>
  <div class="pa-6 d-flex flex-column">
    <MpPageHeader title="Tickets">
      <template #actions>
        <v-btn variant="outlined" class="text-none" prepend-icon="list-filter" @click="filtersOpen = true">
          Filters
        </v-btn>
        <v-menu location="bottom end">
          <template #activator="{ props: activator }">
            <v-btn v-bind="activator" color="primary" variant="flat" class="text-none"
              prepend-icon="plus" append-icon="chevron-down">New</v-btn>
          </template>
          <v-list role="menu">
            <MpMenuItem title="New ticket" icon="ticket" @click="newTicket" />
            <MpMenuItem title="New contact" icon="user-plus" @click="newContact" />
          </v-list>
        </v-menu>
      </template>
    </MpPageHeader>

    <div class="tickets-split d-flex ga-4 mt-4">
      <!-- List panel -->
      <v-card flat border rounded="lg" class="tickets-list d-flex flex-column flex-shrink-0">
        <v-menu v-model="viewsMenuOpen" location="bottom start" :close-on-content-click="false">
          <template #activator="{ props: activator }">
            <button
              v-bind="activator"
              class="tickets-views-trigger d-flex align-center ga-2 px-4 border-b"
              :aria-expanded="viewsMenuOpen"
              aria-haspopup="menu"
              aria-label="Change inbox and view"
            >
              <v-icon size="18">inbox</v-icon>
              <span class="text-body-2 text-truncate">{{ currentLabel }}</span>
              <v-spacer />
              <v-icon size="16">{{ viewsMenuOpen ? 'chevron-up' : 'chevron-down' }}</v-icon>
            </button>
          </template>
          <v-card flat border rounded="lg" class="py-1" width="300" max-height="420" style="overflow-y: auto;">
            <template v-for="group in inboxGroups" :key="group.key">
              <div class="mp-meta-label text-medium-emphasis px-4 pt-3 pb-1">{{ group.label }}</div>
              <v-list density="compact" class="py-0">
                <MpMenuItem
                  v-for="view in viewNames"
                  :key="`${group.key}-${view}`"
                  :title="view"
                  :active="currentInbox === group.key && currentView === view"
                  @click="selectView(group.key, view)"
                />
              </v-list>
            </template>
            <v-divider class="my-1" />
            <v-list density="compact" class="py-0">
              <MpMenuItem title="Trash" icon="trash-2" :active="currentInbox === 'trash'" @click="selectTrash" />
            </v-list>
          </v-card>
        </v-menu>

        <div class="flex-grow-1 overflow-y-auto">
          <div v-for="t in listTickets" :key="t.id" class="tickets-row d-flex align-center"
            :class="{ 'tickets-row--selected': t.id === selectedId }">
            <v-checkbox-btn
              :model-value="checked.includes(t.id)"
              :aria-label="`Select ticket: ${t.subject}`"
              class="ml-2 flex-grow-0"
              @update:model-value="(v: boolean) => toggleChecked(t.id, v)"
            ></v-checkbox-btn>
            <MpListRow clickable variant="divided" class="flex-grow-1" style="min-width: 0;" @click="openTicket(t)">
              <span class="d-flex align-center ga-2" style="min-width: 0;">
                <span v-if="t.unread" class="tickets-unread-dot flex-shrink-0" role="img" aria-label="Unread"></span>
                <span class="text-body-2 text-truncate" :class="t.unread ? 'font-weight-bold' : 'font-weight-medium'">
                  {{ t.subject }}
                </span>
              </span>
              <span class="text-caption text-medium-emphasis d-block">{{ t.customer }}</span>
              <span class="text-caption text-medium-emphasis d-block text-truncate">{{ snippet(t) }}</span>
              <template #trailing>
                <span class="d-flex flex-column align-end ga-1">
                  <span class="text-caption text-medium-emphasis">{{ formatListDate(t.updatedAt) }}</span>
                  <MpStatusChip :status="t.status" type="ticket" size="sm" variant="outlined" />
                </span>
              </template>
            </MpListRow>
          </div>

          <MpEmptyState
            v-if="!listTickets.length"
            icon="inbox"
            :title="currentInbox === 'trash' ? 'Trash is empty' : 'No tickets in this view'"
            :description="currentInbox === 'trash'
              ? 'Deleted tickets land here and can be restored.'
              : 'Change the view or adjust your filters to see more tickets.'"
          />
        </div>
      </v-card>

      <!-- Detail pane -->
      <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column" style="min-width: 0;">
        <TicketWorkspace v-if="selectedTicket" :ticket-id="selectedTicket.id" variant="pane" />
        <MpEmptyState
          v-else
          class="ma-auto"
          icon="ticket"
          title="Select a ticket to view its details"
          description="Pick a conversation from the list to read the thread, reply, and update its properties."
        />
      </v-card>
    </div>

    <MpFloatingBulkBar :count="checked.length" :total="listTickets.length" @clear="checked = []">
      <template v-if="currentInbox === 'trash'">
        <v-btn variant="text" class="text-none" prepend-icon="undo-2" @click="restoreSelected">Restore</v-btn>
      </template>
      <template v-else>
        <v-btn variant="text" class="text-none" prepend-icon="user-check" @click="assignDialog = true">Assign</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="circle-x" @click="closeSelected">Close</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="mail" @click="unreadSelected">Mark as unread</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="trash-2" @click="deleteDialog = true">Delete</v-btn>
      </template>
    </MpFloatingBulkBar>

    <!-- Filters -->
    <MpFormDrawer v-model="filtersOpen" title="Filters" size="sm">
      <MpFormGrid>
        <v-select v-model="workingFilters.status" :items="TICKET_STATUSES" label="Status" multiple chips closable-chips></v-select>
        <v-select v-model="workingFilters.priority" :items="TICKET_PRIORITIES" label="Priority" multiple chips closable-chips></v-select>
        <v-select v-model="workingFilters.channel" :items="TICKET_CHANNELS" label="Channel" multiple chips closable-chips></v-select>
        <v-select v-model="workingFilters.type" :items="TICKET_TYPES" label="Type" multiple chips closable-chips></v-select>
        <v-select v-model="workingFilters.group" :items="TICKET_GROUPS" label="Group" multiple chips closable-chips></v-select>
        <v-select v-model="workingFilters.agent" :items="['', ...TICKET_AGENTS]" label="Agent" clearable></v-select>
        <v-select v-model="workingFilters.contact" :items="['', ...contactOptions]" label="Contacts" clearable></v-select>
        <v-select v-model="workingFilters.tags" :items="TICKET_TAGS" label="Tags" multiple chips closable-chips></v-select>
      </MpFormGrid>
      <MpFormGrid :cols="2" class="mt-4">
        <v-text-field v-model="workingFilters.createdFrom" label="Created from" type="date"></v-text-field>
        <v-text-field v-model="workingFilters.createdTo" label="Created to" type="date"></v-text-field>
        <v-select v-model="workingFilters.readStatus" :items="['', 'Read', 'Unread']" label="Read status" clearable class="mp-form-grid__full"></v-select>
      </MpFormGrid>
      <template #footerStart>
        <v-btn variant="text" class="text-none" @click="clearFilters">Clear filter</v-btn>
      </template>
      <template #footer>
        <v-btn variant="outlined" class="text-none" @click="saveViewDialog = true">Save as view</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!filtersDirty" @click="applyFilters">Apply</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Save as View -->
    <MpDialog v-model="saveViewDialog" title="Save as view" subtitle="Saved views appear in the inbox menu." size="sm">
      <MpFormGrid>
        <v-text-field v-model="saveViewName" label="View name *"></v-text-field>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="saveViewDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!saveViewName.trim()" @click="saveAsView">Save</v-btn>
      </template>
    </MpDialog>

    <!-- Assign -->
    <MpDialog
      v-model="assignDialog"
      title="Assign tickets"
      :subtitle="`${checked.length} ticket${checked.length === 1 ? '' : 's'} selected`"
      size="sm"
    >
      <MpFormGrid>
        <v-select v-model="assignAgent" :items="TICKET_AGENTS" label="Select agent *"></v-select>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="assignDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!assignAgent" @click="confirmAssign">Assign</v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="deleteDialog"
      danger
      :title="`Delete ${checked.length} ticket${checked.length === 1 ? '' : 's'}?`"
      message="Deleted tickets move to the Trash view, where you can restore them later."
      confirm-label="Delete"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
/* The split fills the viewport under the app bar, page padding and header
   (same approach as the store editor shells). */
.tickets-split {
  height: calc(100vh - var(--mp-layout-appbarHeight) - 148px);
  min-height: 420px;
}
.tickets-list { width: 380px; }

.tickets-views-trigger {
  border: 0; background: transparent; font: inherit; cursor: pointer;
  width: 100%; min-height: var(--mp-component-toolbar-minHeight, 56px);
  color: rgb(var(--v-theme-on-surface));
}
.tickets-views-trigger:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.tickets-views-trigger:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }

.tickets-row--selected {
  background: rgba(var(--v-theme-primary), 0.06);
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-primary));
}

.tickets-unread-dot {
  width: var(--mp-space-8); height: var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  background: rgb(var(--v-theme-primary));
}

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
</style>
