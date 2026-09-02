<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
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
  type TicketPriority,
  type TicketStatus,
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
  search.value = ''
  checked.value = []
  viewsMenuOpen.value = false
}

function selectTrash() {
  currentInbox.value = 'trash'
  currentView.value = 'All Tickets'
  appliedFilters.value = emptyTicketFilters()
  search.value = ''
  checked.value = []
  viewsMenuOpen.value = false
}

// ── Search + sort (list-local, not part of a saved view) ─────────────────────
const search = ref('')

const SORT_OPTIONS = [
  { key: 'updated', label: 'Last updated' },
  { key: 'created-desc', label: 'Newest created' },
  { key: 'created-asc', label: 'Oldest created' },
  { key: 'priority', label: 'Priority (high first)' },
] as const
type SortKey = (typeof SORT_OPTIONS)[number]['key']
const sortKey = ref<SortKey>('updated')
const PRIORITY_RANK: Record<TicketPriority, number> = { High: 0, Medium: 1, Low: 2 }

// ── Filters drawer ────────────────────────────────────────────────────────────
// Status is promoted to the quick-filter tabs above the list, so it is not in
// the drawer — the same field never lives in both places.
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
  Object.assign(workingFilters, { ...emptyTicketFilters(), status: [...workingFilters.status] })
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

// ── Status quick filter (tabs) ⇄ appliedFilters.status ───────────────────────
const statusTab = computed<string>({
  get: () => (appliedFilters.value.status.length === 1 ? appliedFilters.value.status[0]! : 'all'),
  set: key => {
    appliedFilters.value = { ...appliedFilters.value, status: key === 'all' ? [] : [key as TicketStatus] }
  },
})

// ── The list ──────────────────────────────────────────────────────────────────
// Everything except the status cut and the sort, so the tab counts can be
// computed from the same base the tabs slice.
const searchedTickets = computed<Ticket[]>(() => {
  let list = currentInbox.value === 'trash' ? store.trashedTickets : store.visibleTickets
  if (currentInbox.value !== 'all' && currentInbox.value !== 'trash') {
    list = list.filter(t => t.inbox === currentInbox.value)
  }
  if (currentView.value === 'My Tickets') list = list.filter(t => t.assignee === CURRENT_AGENT)
  if (currentView.value === 'High Priority Tickets') list = list.filter(t => t.priority === 'High')

  const f = appliedFilters.value
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

  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(t =>
      [t.number, t.subject, t.customer, t.customerEmail, ...t.thread.map(m => m.body)]
        .some(field => field.toLowerCase().includes(q)),
    )
  }
  return list
})

const statusTabs = computed(() => [
  { key: 'all', label: 'All', count: searchedTickets.value.length },
  ...TICKET_STATUSES.map(status => ({
    key: status,
    label: status,
    count: searchedTickets.value.filter(t => t.status === status).length,
  })),
])

const listTickets = computed<Ticket[]>(() => {
  const f = appliedFilters.value
  const list = f.status.length ? searchedTickets.value.filter(t => f.status.includes(t.status)) : searchedTickets.value
  const sorted = [...list]
  switch (sortKey.value) {
    case 'created-desc': return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'created-asc': return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    case 'priority': return sorted.sort((a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.updatedAt.localeCompare(a.updatedAt))
    default: return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
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

function clearSelection() {
  router.replace({ query: { ...route.query, selected: undefined } })
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
  if (checked.value.includes(selectedId.value)) clearSelection()
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
  <div class="mp-frame-fill tickets-shell d-flex flex-column">
    <div class="tickets-head flex-shrink-0">
      <MpPageHeader title="Tickets" density="compact">
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
    </div>

    <div class="tickets-split" :class="{ 'tickets-split--has-selection': !!selectedTicket }">
      <!-- List panel -->
      <v-card flat border rounded="lg" class="tickets-list" :class="{ 'tickets-list--selecting': checked.length > 0 }">
        <div class="tickets-toolbar border-b d-flex flex-column ga-2">
          <div class="d-flex align-center ga-1">
            <v-menu v-model="viewsMenuOpen" location="bottom start" :close-on-content-click="false">
              <template #activator="{ props: activator }">
                <button
                  v-bind="activator"
                  type="button"
                  class="tickets-views-trigger d-flex align-center ga-2 flex-grow-1"
                  :aria-expanded="viewsMenuOpen"
                  aria-haspopup="menu"
                  aria-label="Change inbox and view"
                >
                  <v-icon size="18" class="text-medium-emphasis">inbox</v-icon>
                  <span class="text-body-2 font-weight-medium text-truncate">{{ currentLabel }}</span>
                  <v-icon size="16" class="text-medium-emphasis ms-auto">{{ viewsMenuOpen ? 'chevron-up' : 'chevron-down' }}</v-icon>
                </button>
              </template>
              <v-card flat border rounded="lg" class="py-1 tickets-views-panel" width="300" max-height="420">
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

            <v-menu location="bottom end">
              <template #activator="{ props: activator }">
                <v-tooltip text="Sort tickets" location="bottom">
                  <template #activator="{ props: tooltip }">
                    <v-btn
                      v-bind="{ ...activator, ...tooltip }"
                      icon="arrow-up-down"
                      variant="text"
                      size="small"
                      aria-label="Sort tickets"
                    ></v-btn>
                  </template>
                </v-tooltip>
              </template>
              <v-list role="menu" aria-label="Sort tickets">
                <MpMenuItem
                  v-for="option in SORT_OPTIONS"
                  :key="option.key"
                  :title="option.label"
                  role="menuitemradio"
                  :aria-checked="sortKey === option.key"
                  :active="sortKey === option.key"
                  @click="sortKey = option.key"
                />
              </v-list>
            </v-menu>
          </div>

          <!-- Toolbar search, not a form field: placeholder + aria-label, details
               suppressed so the header block never shifts. -->
          <v-text-field
            v-model="search"
            placeholder="Search tickets"
            aria-label="Search tickets"
            prepend-inner-icon="search"
            clearable
            hide-details
          ></v-text-field>

          <MpFilterTabs
            v-model="statusTab"
            :tabs="statusTabs"
            ariaLabel="Filter tickets by status"
            controlsId="tickets-list"
          />
        </div>

        <div id="tickets-list" class="tickets-list__scroll">
          <div
            v-for="t in listTickets"
            :key="t.id"
            class="tickets-row d-flex align-center"
            :class="{ 'tickets-row--selected': t.id === selectedId, 'tickets-row--checked': checked.includes(t.id) }"
          >
            <v-checkbox-btn
              :model-value="checked.includes(t.id)"
              :aria-label="`Select ticket: ${t.subject}`"
              density="compact"
              class="tickets-row__check flex-grow-0"
              @update:model-value="(v: boolean) => toggleChecked(t.id, v)"
            ></v-checkbox-btn>
            <MpListRow clickable class="tickets-row__body" @click="openTicket(t)">
              <span class="d-flex align-center ga-2">
                <span v-if="t.unread" class="tickets-unread-dot flex-shrink-0" role="img" aria-label="Unread"></span>
                <span class="tickets-row__subject text-body-2 text-truncate" :class="{ 'tickets-row__subject--unread': t.unread }">
                  {{ t.subject }}
                </span>
                <span class="tickets-row__date text-caption text-medium-emphasis ms-auto flex-shrink-0">{{ formatListDate(t.updatedAt) }}</span>
              </span>
              <span class="d-flex align-center ga-2 mt-1">
                <span class="text-caption text-medium-emphasis text-truncate">{{ t.customer }} · {{ snippet(t) }}</span>
                <MpStatusChip :status="t.status" type="ticket" size="sm" class="ms-auto flex-shrink-0" />
              </span>
            </MpListRow>
          </div>

          <MpEmptyState
            v-if="!listTickets.length && search.trim()"
            icon="search"
            :title="`No tickets match “${search.trim()}”`"
            description="Try a different search or clear it."
            actionLabel="Clear search"
            @action="search = ''"
          />
          <MpEmptyState
            v-else-if="!listTickets.length"
            icon="inbox"
            :title="currentInbox === 'trash' ? 'Trash is empty' : 'No tickets in this view'"
            :description="currentInbox === 'trash'
              ? 'Deleted tickets land here and can be restored.'
              : 'Change the view or adjust your filters to see more tickets.'"
          />
        </div>
      </v-card>

      <!-- Detail pane -->
      <v-card flat border rounded="lg" class="tickets-detail">
        <TicketWorkspace
          v-if="selectedTicket"
          :ticket-id="selectedTicket.id"
          variant="pane"
          show-back
          @back="clearSelection"
        />
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
    <MpFormDrawer v-model="filtersOpen" title="Filters" subtitle="Status is filtered with the tabs above the list." size="sm">
      <MpFormGrid>
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

<style scoped lang="scss">
/* The shell fills the content frame (.mp-frame-fill owns the shell constants);
   the head band and the split restate the shell's inset as their gutters —
   the same idiom as CreatePromotion. */
.tickets-head {
  padding: var(--mp-space-24) var(--mp-space-32) var(--mp-space-16);
}

.tickets-split {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  gap: var(--mp-space-16);
  padding: 0 var(--mp-space-32) var(--mp-space-32);
}

/* display lives here, not in d-flex, so the stacked breakpoint can hide a pane
   (Vuetify's .d-flex is display:flex !important and would win). */
.tickets-list,
.tickets-detail {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.tickets-list { flex: 0 0 var(--mp-layout-inboxListWidth); }
.tickets-detail { flex: 1 1 0; min-width: 0; }

.tickets-list__scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.border-b { border-bottom: 1px solid var(--border-subtle); }

/* ── List toolbar: views + sort · search · status tabs ─────────────────── */
.tickets-toolbar {
  flex-shrink: 0;
  padding: var(--mp-space-8) var(--mp-component-card-paddingCompact) 0;
}

.tickets-views-trigger {
  min-width: 0;
  min-height: var(--mp-component-control-height);
  padding-inline: var(--mp-space-8);
  border: 0;
  border-radius: var(--mp-component-chip-radius);
  background: transparent;
  color: var(--on-surface);
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.tickets-views-trigger:hover { background: var(--surface-secondary); }
.tickets-views-trigger:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }

.tickets-views-panel { overflow-y: auto; }

/* ── Rows ───────────────────────────────────────────────────────────────── */
.tickets-row {
  padding-inline: var(--mp-space-4) var(--mp-component-card-paddingCompact);
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.tickets-row + .tickets-row { border-top: 1px solid var(--border-subtle); }
.tickets-row:hover { background: var(--surface-secondary); }
.tickets-row--selected,
.tickets-row--selected:hover { background: var(--accent-soft); }

/* The row body is the MpListRow; its own hover bleed is neutralised because the
   whole row (checkbox included) is the hover surface here. */
.tickets-row__body {
  flex: 1 1 0;
  width: auto;
  min-width: 0;
  margin-inline: 0;
  padding-inline: 0;
  background: transparent;
}
.tickets-row__body:hover { background: transparent; }

.tickets-row__subject { font-weight: var(--mp-fontWeight-medium); }
.tickets-row__subject--unread { font-weight: var(--mp-fontWeight-semibold); }
.tickets-row__date { font-variant-numeric: tabular-nums; }

/* Checkboxes stay quiet until the row is hovered, focused, checked, or a bulk
   selection is in progress; the column is always reserved so nothing shifts. */
.tickets-row__check {
  opacity: 0;
  transition: opacity var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.tickets-row:hover .tickets-row__check,
.tickets-row:focus-within .tickets-row__check,
.tickets-row--checked .tickets-row__check,
.tickets-list--selecting .tickets-row__check { opacity: 1; }

.tickets-unread-dot {
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  background: var(--accent-default);
}

/* ── Below the split breakpoint: one pane at a time, the URL decides which ── */
@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .tickets-head { padding: var(--mp-space-16) var(--mp-space-16) var(--mp-space-12); }
  .tickets-split { padding: 0 var(--mp-space-16) var(--mp-space-16); }

  .tickets-list { flex: 1 1 0; }
  .tickets-split:not(.tickets-split--has-selection) .tickets-detail { display: none; }
  .tickets-split.tickets-split--has-selection .tickets-list { display: none; }
}
</style>
