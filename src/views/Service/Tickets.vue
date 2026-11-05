<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import { useDisplay } from 'vuetify'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpSplitPane from '@/components/MpSplitPane.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import TicketWorkspace from '@/components/service/TicketWorkspace.vue'
import TicketViewSwitcher from '@/components/service/TicketViewSwitcher.vue'
import {
  useTicketsStore,
  emptyTicketFilters,
  TICKET_CHANNELS,
  TICKET_GROUPS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
  type TicketFilters,
  type TicketPriority,
  type TicketStatus,
} from '@/stores/useTickets'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import {
  BUILT_IN_VIEWS,
  CREATED_WITHIN,
  UNASSIGNED,
  filterChips,
  inInbox,
  isBuiltInView,
  matchesBuiltInView,
  matchesFilters,
  matchesSearch,
  sameFilters,
  withoutChip,
  type FilterChipKey,
} from '@/service/ticketFilters'
import { mp_layout_inboxListMinWidth, mp_layout_inboxListWidth } from '@/design-tokens/generated/tokens'
import { useToast } from '@/composables/useToast'

const store = useTicketsStore()
const settings = useServiceSettingsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { mdAndUp } = useDisplay()
const accountId = computed(() => route.params.accountId as string)
const CURRENT_AGENT = 'Deepak Vaidya'
const plural = (n: number, word = 'ticket') => `${n} ${word}${n === 1 ? '' : 's'}`

// ── List context ⇄ URL ────────────────────────────────────────────────────────
// Inbox, view, filters, search and sort live in the query string next to
// ?selected, so opening a ticket as a full page and coming back (or reloading,
// or sharing the link) lands on the same list instead of a reset All Tickets.
function queryText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
function queryList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  return typeof value === 'string' && value ? value.split(',') : []
}
const pick = <T extends string>(values: string[], allowed: readonly T[]): T[] =>
  values.filter((v): v is T => (allowed as readonly string[]).includes(v))

function filtersFromQuery(q: LocationQuery): TicketFilters {
  const read = queryText(q.read)
  const within = queryText(q.within)
  return {
    status: pick(queryList(q.status), TICKET_STATUSES),
    priority: pick(queryList(q.priority), TICKET_PRIORITIES),
    channel: pick(queryList(q.channel), TICKET_CHANNELS),
    type: queryList(q.type),
    group: queryList(q.group),
    agent: queryText(q.agent),
    contact: queryText(q.contact),
    tags: queryList(q.tags),
    createdWithin: within === 'today' || within === '7d' || within === '30d' ? within : '',
    createdFrom: queryText(q.from),
    createdTo: queryText(q.to),
    readStatus: read === 'Read' || read === 'Unread' ? read : '',
  }
}

function filtersToQuery(f: TicketFilters): Record<string, string> {
  const query: Record<string, string> = {}
  const lists = { status: f.status, priority: f.priority, channel: f.channel, type: f.type, group: f.group, tags: f.tags }
  for (const [key, values] of Object.entries(lists)) if (values.length) query[key] = values.join(',')
  const texts = { agent: f.agent, contact: f.contact, within: f.createdWithin, from: f.createdFrom, to: f.createdTo, read: f.readStatus }
  for (const [key, value] of Object.entries(texts)) if (value) query[key] = value
  return query
}

// ── Inbox & view (TicketViewSwitcher) ────────────────────────────────────────
// `currentInbox` is 'all', an Inbox.id, or one of the folders 'spam' / 'trash'.
// Custom views belong to one inbox, so a view name is only valid with its inbox.
const viewsIn = (inbox: string) => [
  ...BUILT_IN_VIEWS,
  ...store.customViews.filter(v => v.inboxId === inbox).map(v => v.name),
] as string[]

const inboxFromQuery = queryText(route.query.inbox)
const currentInbox = ref<string>(
  ['spam', 'trash', ...settings.inboxes.map(i => i.id)].includes(inboxFromQuery) ? inboxFromQuery : 'all',
)
const viewFromQuery = queryText(route.query.view)
const currentView = ref(viewsIn(currentInbox.value).includes(viewFromQuery) ? viewFromQuery : 'All Tickets')

const inFolder = computed(() => currentInbox.value === 'spam' || currentInbox.value === 'trash')

function selectView(inbox: string, view: string) {
  currentInbox.value = inbox
  currentView.value = view
  const saved = store.customViews.find(v => v.name === view && v.inboxId === inbox)
  appliedFilters.value = saved ? { ...saved.filters } : emptyTicketFilters()
  search.value = ''
  checked.value = []
}

// ── Search + sort (list-local, not part of a saved view) ─────────────────────
const search = ref(queryText(route.query.q))

const SORT_OPTIONS = [
  { key: 'updated', label: 'Last updated' },
  { key: 'created-desc', label: 'Newest created' },
  { key: 'created-asc', label: 'Oldest created' },
  { key: 'priority', label: 'Priority (high first)' },
] as const
type SortKey = (typeof SORT_OPTIONS)[number]['key']
const sortFromQuery = SORT_OPTIONS.find(o => o.key === route.query.sort)?.key
const sortKey = ref<SortKey>(sortFromQuery ?? 'updated')
const PRIORITY_RANK: Record<TicketPriority, number> = { High: 0, Medium: 1, Low: 2 }

// ── Filters drawer ────────────────────────────────────────────────────────────
// Status is promoted to the quick-filter tabs above the list, so it is not in
// the drawer — the same field never lives in both places.
const filtersOpen = ref(false)
const workingFilters = reactive<TicketFilters>(emptyTicketFilters())
const appliedFilters = ref<TicketFilters>(filtersFromQuery(route.query))
const copyFilters = (f: TicketFilters): TicketFilters => JSON.parse(JSON.stringify(f))

// A link that names a saved view but carries no filters opens the view as saved.
const viewOnLoad = store.customViews.find(v => v.name === currentView.value && v.inboxId === currentInbox.value)
if (viewOnLoad && !Object.keys(filtersToQuery(appliedFilters.value)).length) appliedFilters.value = copyFilters(viewOnLoad.filters)

// "Created" is one choice in the drawer: a rolling window, or a custom range
// that reveals the two date fields.
type CreatedMode = '' | 'today' | '7d' | '30d' | 'custom'
const createdMode = ref<CreatedMode>('')
const CREATED_OPTIONS: { value: CreatedMode; label: string }[] = [
  { value: '', label: 'Any time' },
  ...CREATED_WITHIN.map(p => ({ value: p.value, label: p.label })),
  { value: 'custom', label: 'Custom range' },
]
watch(createdMode, mode => {
  workingFilters.createdWithin = mode === 'custom' ? '' : mode
  if (mode !== 'custom') {
    workingFilters.createdFrom = ''
    workingFilters.createdTo = ''
  }
})

const READ_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'Unread', label: 'Unread' },
  { value: 'Read', label: 'Read' },
]
const readStatusModel = computed<string | null>({
  get: () => workingFilters.readStatus || 'any',
  set: value => { workingFilters.readStatus = value === 'Read' || value === 'Unread' ? value : '' },
})

watch(filtersOpen, open => {
  if (!open) return
  Object.assign(workingFilters, copyFilters(appliedFilters.value))
  const f = appliedFilters.value
  createdMode.value = f.createdWithin || (f.createdFrom || f.createdTo ? 'custom' : '')
})

const workingChipCount = computed(() => filterChips(workingFilters).length)
const agentOptions = computed(() => [UNASSIGNED, ...settings.agentNames])

// Defaults stay out of the URL so a plain inbox link stays plain.
watch([currentInbox, currentView, appliedFilters, search, sortKey], () => {
  const query: LocationQueryRaw = filtersToQuery(appliedFilters.value)
  if (currentInbox.value !== 'all') query.inbox = currentInbox.value
  if (currentView.value !== 'All Tickets') query.view = currentView.value
  if (search.value.trim()) query.q = search.value.trim()
  if (sortKey.value !== 'updated') query.sort = sortKey.value
  if (route.query.selected) query.selected = route.query.selected
  void router.replace({ query })
}, { deep: true })

function applyFilters() {
  appliedFilters.value = copyFilters(workingFilters)
  filtersOpen.value = false
}
/** Clears the drawer; status stays with the tabs. */
function clearFilters() {
  Object.assign(workingFilters, { ...emptyTicketFilters(), status: [...workingFilters.status] })
  createdMode.value = ''
}

// ── Applied filters: chips above the list ────────────────────────────────────
const appliedChips = computed(() => filterChips(appliedFilters.value))
function removeChip(key: FilterChipKey) {
  appliedFilters.value = withoutChip(appliedFilters.value, key)
}
function clearApplied() {
  appliedFilters.value = { ...emptyTicketFilters(), status: [...appliedFilters.value.status] }
}

// A saved view whose filters were changed here is "edited" until it is saved
// or reset — the view itself only changes when the agent says so.
const savedView = computed(() =>
  store.customViews.find(v => v.name === currentView.value && v.inboxId === currentInbox.value))
const viewEdited = computed(() => !!savedView.value && !sameFilters(appliedFilters.value, savedView.value.filters))
function resetView() {
  if (savedView.value) appliedFilters.value = copyFilters(savedView.value.filters)
}
function saveViewChanges() {
  if (!savedView.value) return
  store.saveView(savedView.value.name, copyFilters(appliedFilters.value), savedView.value.inboxId)
  toast.success(`View "${savedView.value.name}" updated`)
}
/** From the list: the applied filters become the new view's. */
function saveAppliedAsView() {
  Object.assign(workingFilters, copyFilters(appliedFilters.value))
  saveViewDialog.value = true
}

// Views are saved in the inbox you're in (from Spam/Trash, under All inboxes).
const saveViewDialog = ref(false)
const saveViewName = ref('')
const saveViewInbox = computed(() => (inFolder.value ? 'all' : currentInbox.value))
const saveViewError = computed(() => {
  const name = saveViewName.value.trim().toLowerCase()
  if (!name) return ''
  const taken = viewsIn(saveViewInbox.value).some(view => view.toLowerCase() === name)
  return taken ? 'A view with this name already exists in this inbox.' : ''
})
function saveAsView() {
  const name = saveViewName.value.trim()
  if (!name || saveViewError.value) return
  store.saveView(name, copyFilters(workingFilters), saveViewInbox.value)
  appliedFilters.value = copyFilters(workingFilters)
  currentInbox.value = saveViewInbox.value
  currentView.value = name
  saveViewDialog.value = false
  saveViewName.value = ''
  filtersOpen.value = false
  toast.success(`View "${name}" saved in ${saveViewInbox.value === 'all' ? 'All inboxes' : settings.inboxName(saveViewInbox.value)}`)
}

// Spam senders are never offered as contacts.
const contactOptions = computed(() =>
  [...new Set(store.tickets.filter(t => t.folder !== 'spam').map(t => `${t.customer} - ${t.customerEmail}`))],
)

// ── Status quick filter (tabs) ⇄ appliedFilters.status ───────────────────────
const statusTab = computed<string>({
  get: () => (appliedFilters.value.status.length === 1 ? appliedFilters.value.status[0]! : 'all'),
  set: key => {
    appliedFilters.value = { ...appliedFilters.value, status: key === 'all' ? [] : [key as TicketStatus] }
  },
})

// ── The list ──────────────────────────────────────────────────────────────────
// Everything except the status cut and the sort, so the tab counts come from
// the same base the tabs slice. The rules are shared with the switcher's counts.
// The folder or inbox, cut by a built-in view and the search — what the
// filters then narrow. The drawer previews its count from the same base.
const baseTickets = computed<Ticket[]>(() => {
  const folder = currentInbox.value === 'spam' ? store.spamTickets
    : currentInbox.value === 'trash' ? store.trashedTickets
      : store.visibleTickets.filter(t => inInbox(t, currentInbox.value))
  const view = currentView.value
  return folder.filter(t =>
    (!isBuiltInView(view) || matchesBuiltInView(t, view, CURRENT_AGENT)) && matchesSearch(t, search.value))
})
const searchedTickets = computed<Ticket[]>(() =>
  baseTickets.value.filter(t => matchesFilters(t, appliedFilters.value, { status: false })))
const previewCount = computed(() => baseTickets.value.filter(t => matchesFilters(t, workingFilters)).length)

const inboxLabel = computed(() =>
  currentInbox.value === 'all' ? 'All inboxes'
    : currentInbox.value === 'spam' ? 'Spam'
      : currentInbox.value === 'trash' ? 'Trash' : settings.inboxName(currentInbox.value))
const filtersSubtitle = computed(() =>
  inFolder.value ? `In ${inboxLabel.value}.` : `In ${inboxLabel.value} · ${currentView.value}.`)

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

// Applying or removing a filter says what it did, for screen readers.
const filterAnnouncement = ref('')
watch(appliedFilters, () => {
  filterAnnouncement.value = `${plural(listTickets.value.length)} shown`
}, { deep: true })

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

// When the open ticket leaves the list (spam, trash, not spam, restore) the next
// one opens instead of a blank pane. The order is a snapshot that a watcher
// refreshes after the move has been handled, so it still knows what came next.
let listOrder: number[] = []
watch(() => listTickets.value.map(t => t.id), ids => { listOrder = ids }, { immediate: true })

function nextAfter(id: number, leaving: number[]): number {
  const i = listOrder.indexOf(id)
  const stays = (x: number) => !leaving.includes(x)
  return listOrder.slice(i + 1).find(stays) ?? listOrder.slice(0, Math.max(i, 0)).reverse().find(stays) ?? 0
}
function advanceFrom(leaving: number[]) {
  if (!leaving.includes(selectedId.value)) return
  const next = store.find(nextAfter(selectedId.value, leaving))
  if (next) openTicket(next)
  else clearSelection()
}

// Back from the full page (or a shared link): bring the selected row into view
// and put focus on it, so the agent carries on from the ticket they left.
const listEl = ref<HTMLElement | null>(null)
onMounted(async () => {
  if (!selectedId.value) return
  await nextTick()
  const row = listEl.value?.querySelector<HTMLElement>(`[data-ticket-id="${selectedId.value}"] .tickets-row__body`)
  row?.scrollIntoView({ block: 'nearest' })
  row?.focus({ preventScroll: true })
})

// ── Split: list width the agent drags, remembered ─────────────────────────────
// The pane clamps what it renders to the window; the saved preference only
// changes when the agent moves the separator.
const LIST_DEFAULT = parseFloat(mp_layout_inboxListWidth)
const LIST_MIN = parseFloat(mp_layout_inboxListMinWidth)
const LIST_WIDTH_KEY = 'mp.tickets.listWidth.v1'
function readListWidth(): number {
  try {
    const saved = Number(localStorage.getItem(LIST_WIDTH_KEY))
    return Number.isFinite(saved) && saved >= LIST_MIN ? saved : LIST_DEFAULT
  } catch {
    return LIST_DEFAULT
  }
}
const listWidth = ref(readListWidth())
watch(listWidth, width => {
  try { localStorage.setItem(LIST_WIDTH_KEY, String(width)) } catch { /* private mode */ }
})
// Below the split breakpoint one pane shows at a time; the URL decides which.
const stacked = computed(() => (mdAndUp.value ? null : selectedTicket.value ? 'end' : 'start'))

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
  toast.success(`${plural(checked.value.length)} assigned to ${assignAgent.value}`)
  assignDialog.value = false
  assignAgent.value = ''
  checked.value = []
}

function closeSelected() {
  store.closeMany(checked.value)
  toast.success(`${plural(checked.value.length)} closed`)
  checked.value = []
}

function unreadSelected() {
  store.markUnread(checked.value)
  toast.success('Marked as unread')
  checked.value = []
}

/** Folder moves share one shape: advance past them, move, toast with Undo. */
function moveSelected(move: (ids: number[]) => void, undo: (ids: number[]) => void, message: string) {
  const ids = [...checked.value]
  advanceFrom(ids)
  move(ids)
  checked.value = []
  toast.success(`${plural(ids.length)} ${message}`, { action: { label: 'Undo', onClick: () => undo(ids) } })
}
const spamSelected = () => moveSelected(store.markSpam, store.markNotSpam, 'marked as spam')
const notSpamSelected = () => moveSelected(store.markNotSpam, store.markSpam, 'moved back to the inbox')
const restoreSelected = () => moveSelected(store.restoreMany, store.trashMany, 'restored')

// Trash is recoverable, so it's "Move to trash" — bulk still confirms the count.
const trashDialog = ref(false)
function confirmTrash() {
  const fromSpam = currentInbox.value === 'spam'
  moveSelected(store.trashMany, fromSpam ? store.markSpam : store.restoreMany, 'moved to Trash')
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
          <v-badge
            :model-value="appliedChips.length > 0"
            :content="appliedChips.length"
            color="primary"
            location="top end"
            offset-x="8"
            offset-y="6"
          >
            <v-btn
              variant="outlined"
              class="text-none"
              prepend-icon="list-filter"
              :aria-label="appliedChips.length ? `Filters (${appliedChips.length} applied)` : 'Filters'"
              @click="filtersOpen = true"
            >
              Filters
            </v-btn>
          </v-badge>
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

    <div class="tickets-body" :class="{ 'tickets-body--bulk': checked.length > 0 }">
      <!-- One container: list | separator | ticket. -->
      <v-card flat border rounded="lg" class="tickets-card">
        <MpSplitPane
          v-model:size="listWidth"
          :default-size="LIST_DEFAULT"
          :min="LIST_MIN"
          ariaLabel="Resize ticket list"
          controls="tickets-list-pane"
          :stacked="stacked"
          class="tickets-split"
        >
          <template #start>
            <div id="tickets-list-pane" class="tickets-list" :class="{ 'tickets-list--selecting': checked.length > 0 }">
              <div class="tickets-toolbar border-b d-flex flex-column ga-2">
                <div class="d-flex align-center ga-1">
                  <TicketViewSwitcher
                    :inbox="currentInbox"
                    :view="currentView"
                    :current-agent="CURRENT_AGENT"
                    @select="selectView"
                  />

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

                <!-- Applied filters: one chip per field, removable in place. -->
                <div v-if="appliedChips.length" class="tickets-chips d-flex align-center flex-wrap ga-1" role="group" aria-label="Applied filters">
                  <v-chip
                    v-for="chip in appliedChips"
                    :key="chip.key"
                    size="small"
                    variant="tonal"
                    color="primary"
                    closable
                    :close-label="`Remove filter: ${chip.label}`"
                    class="tickets-chip"
                    @click:close="removeChip(chip.key)"
                  >
                    <span class="text-truncate">{{ chip.label }}</span>
                  </v-chip>
                  <!-- The actions wrap as one unit, so neither is left alone on a line. -->
                  <span class="d-flex align-center ms-auto">
                    <v-btn variant="text" size="small" class="text-none" @click="clearApplied">Clear all</v-btn>
                    <v-btn v-if="!savedView" variant="text" size="small" class="text-none" @click="saveAppliedAsView">Save as view</v-btn>
                  </span>
                </div>

                <!-- A saved view changed here stays the same until saved or reset. -->
                <div v-if="viewEdited" class="tickets-edited d-flex flex-column ga-1" role="status">
                  <p class="tickets-edited__text text-caption d-flex align-center ga-1">
                    <v-icon size="14" aria-hidden="true">pencil</v-icon>
                    <span class="text-truncate">Unsaved changes to “{{ currentView }}”</span>
                  </p>
                  <div class="d-flex justify-end flex-wrap ga-1">
                    <v-btn variant="text" size="small" class="text-none" @click="resetView">Reset</v-btn>
                    <v-btn variant="text" size="small" class="text-none" @click="saveAppliedAsView">Save as new</v-btn>
                    <v-btn variant="flat" color="primary" size="small" class="text-none" @click="saveViewChanges">Save view</v-btn>
                  </div>
                </div>
                <p class="d-sr-only" aria-live="polite">{{ filterAnnouncement }}</p>

                <MpFilterTabs
                  v-model="statusTab"
                  :tabs="statusTabs"
                  ariaLabel="Filter tickets by status"
                  controlsId="tickets-list"
                />
              </div>

              <MpAlert v-if="currentInbox === 'spam'" tone="info" class="tickets-folder-note">
                Spam is kept out of your inbox and gets no acknowledgement or SLA. Not spam moves a ticket back.
              </MpAlert>

              <div id="tickets-list" ref="listEl" class="tickets-list__scroll">
                <div
                  v-for="t in listTickets"
                  :key="t.id"
                  :data-ticket-id="t.id"
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
                  v-else-if="!listTickets.length && currentInbox === 'spam'"
                  icon="shield-check"
                  title="No spam"
                  description="Tickets marked as spam — by you or the spam filter — land here."
                />
                <MpEmptyState
                  v-else-if="!listTickets.length && appliedChips.length"
                  icon="list-filter"
                  title="No tickets match these filters"
                  description="Remove a filter above, or clear them all."
                  actionLabel="Clear filters"
                  @action="clearApplied"
                />
                <MpEmptyState
                  v-else-if="!listTickets.length"
                  icon="inbox"
                  :title="currentInbox === 'trash' ? 'Trash is empty' : 'No tickets in this view'"
                  :description="currentInbox === 'trash'
                    ? 'Tickets you move to Trash land here and can be restored.'
                    : 'Change the view or the status tab to see more tickets.'"
                />
              </div>
            </div>
          </template>

          <template #end>
            <div class="tickets-detail">
              <TicketWorkspace
                v-if="selectedTicket"
                :ticket-id="selectedTicket.id"
                variant="pane"
                show-back
                @back="clearSelection"
                @moved="id => advanceFrom([id])"
              />
              <MpEmptyState
                v-else
                class="ma-auto"
                icon="ticket"
                title="Select a ticket to view its details"
                description="Pick a conversation from the list to read the thread, reply, and update its properties."
              />
            </div>
          </template>
        </MpSplitPane>
      </v-card>
    </div>

    <MpFloatingBulkBar :count="checked.length" :total="listTickets.length" @clear="checked = []">
      <template v-if="currentInbox === 'trash'">
        <v-btn variant="text" class="text-none" prepend-icon="undo-2" @click="restoreSelected">Restore</v-btn>
      </template>
      <template v-else-if="currentInbox === 'spam'">
        <v-btn variant="text" class="text-none" prepend-icon="shield-check" @click="notSpamSelected">Not spam</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="trash-2" @click="trashDialog = true">Move to trash</v-btn>
      </template>
      <template v-else>
        <v-btn variant="text" class="text-none" prepend-icon="user-check" @click="assignDialog = true">Assign</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="circle-x" @click="closeSelected">Close</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="mail" @click="unreadSelected">Mark as unread</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="shield-alert" @click="spamSelected">Mark as spam</v-btn>
        <v-btn variant="text" class="text-none" prepend-icon="trash-2" @click="trashDialog = true">Move to trash</v-btn>
      </template>
    </MpFloatingBulkBar>

    <!-- Filters -->
    <MpFormDrawer v-model="filtersOpen" title="Filters" :subtitle="`${filtersSubtitle} Status stays on the tabs above the list.`" size="sm">
      <MpFormSection title="Ticket">
        <MpFormGrid>
          <MpFormField label="Priority">
            <template #default="{ labelId }">
              <v-chip-group v-model="workingFilters.priority" multiple column color="primary" class="tickets-toggles" role="group" :aria-labelledby="labelId">
                <v-chip v-for="p in TICKET_PRIORITIES" :key="p" :value="p" variant="outlined" filter role="button" class="tickets-toggle"
                  :aria-pressed="workingFilters.priority.includes(p)">{{ p }}</v-chip>
              </v-chip-group>
            </template>
          </MpFormField>
          <MpFormField label="Channel">
            <template #default="{ labelId }">
              <v-chip-group v-model="workingFilters.channel" multiple column color="primary" class="tickets-toggles" role="group" :aria-labelledby="labelId">
                <v-chip v-for="c in TICKET_CHANNELS" :key="c" :value="c" variant="outlined" filter role="button" class="tickets-toggle"
                  :aria-pressed="workingFilters.channel.includes(c)">{{ c }}</v-chip>
              </v-chip-group>
            </template>
          </MpFormField>
          <v-autocomplete v-model="workingFilters.type" :items="settings.typeNames" label="Type" placeholder="Any type"
            multiple chips closable-chips clearable></v-autocomplete>
          <v-autocomplete v-model="workingFilters.tags" :items="settings.tagNames" label="Tags" placeholder="Any tag"
            multiple chips closable-chips clearable hint="Tickets with any of these tags"></v-autocomplete>
        </MpFormGrid>
      </MpFormSection>

      <MpFormSection title="People">
        <MpFormGrid>
          <!-- '' means "no filter"; the field wants null so the placeholder shows. -->
          <v-autocomplete :model-value="workingFilters.agent || null" :items="agentOptions" label="Agent" placeholder="Anyone" clearable
            @update:model-value="(v: string | null) => { workingFilters.agent = v ?? '' }"></v-autocomplete>
          <v-autocomplete :model-value="workingFilters.contact || null" :items="contactOptions" label="Contact" placeholder="Any contact" clearable
            @update:model-value="(v: string | null) => { workingFilters.contact = v ?? '' }"></v-autocomplete>
          <MpFormField label="Group">
            <template #default="{ labelId }">
              <v-chip-group v-model="workingFilters.group" multiple column color="primary" class="tickets-toggles" role="group" :aria-labelledby="labelId">
                <v-chip v-for="g in TICKET_GROUPS" :key="g" :value="g" variant="outlined" filter role="button" class="tickets-toggle"
                  :aria-pressed="workingFilters.group.includes(g)">{{ g }}</v-chip>
              </v-chip-group>
            </template>
          </MpFormField>
        </MpFormGrid>
      </MpFormSection>

      <MpFormSection title="Activity">
        <MpFormGrid>
          <MpFormField label="Created">
            <template #default="{ labelId }">
              <v-chip-group v-model="createdMode" mandatory column color="primary" class="tickets-toggles" role="radiogroup" :aria-labelledby="labelId">
                <v-chip v-for="o in CREATED_OPTIONS" :key="o.value" :value="o.value" variant="outlined" class="tickets-toggle"
                  role="radio" :aria-checked="createdMode === o.value">{{ o.label }}</v-chip>
              </v-chip-group>
            </template>
          </MpFormField>
          <MpFormGrid v-if="createdMode === 'custom'" :cols="2">
            <v-text-field v-model="workingFilters.createdFrom" label="From" type="date" :max="workingFilters.createdTo || undefined"></v-text-field>
            <v-text-field v-model="workingFilters.createdTo" label="To" type="date" :min="workingFilters.createdFrom || undefined"></v-text-field>
          </MpFormGrid>
          <MpFormField label="Read status">
            <MpSegmentedControl v-model="readStatusModel" :items="READ_OPTIONS" ariaLabel="Read status" />
          </MpFormField>
        </MpFormGrid>
      </MpFormSection>

      <template #footerStart>
        <v-btn variant="text" class="text-none" :disabled="!workingChipCount" @click="clearFilters">Clear all</v-btn>
      </template>
      <template #footer>
        <v-btn variant="outlined" class="text-none" :disabled="!workingChipCount" @click="saveViewDialog = true">Save as view</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="applyFilters">
          Show {{ plural(previewCount) }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <!-- Save as View -->
    <MpDialog
      v-model="saveViewDialog"
      title="Save as view"
      :subtitle="`Saved in ${saveViewInbox === 'all' ? 'All inboxes' : settings.inboxName(saveViewInbox)}, in the inbox menu.`"
      size="sm"
    >
      <MpFormGrid>
        <v-text-field v-model="saveViewName" label="View name *" placeholder="e.g. Unassigned refunds" :error-messages="saveViewError"
          @keydown.enter="saveAsView"></v-text-field>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="saveViewDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!saveViewName.trim() || !!saveViewError" @click="saveAsView">Save view</v-btn>
      </template>
    </MpDialog>

    <!-- Assign -->
    <MpDialog
      v-model="assignDialog"
      title="Assign tickets"
      :subtitle="`${plural(checked.length)} selected`"
      size="sm"
    >
      <MpFormGrid>
        <v-select v-model="assignAgent" :items="settings.agentNames" label="Select agent *"></v-select>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="assignDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!assignAgent" @click="confirmAssign">Assign</v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="trashDialog"
      danger
      :title="`Move ${plural(checked.length)} to Trash?`"
      message="You can restore them from Trash in the inbox menu."
      confirm-label="Move to trash"
      @confirm="confirmTrash"
    />
  </div>
</template>

<style scoped lang="scss">
/* The shell fills the content frame (.mp-frame-fill owns the shell constants);
   the head band and the body restate the shell's inset as their gutters —
   the same idiom as CreatePromotion. */
.tickets-head {
  padding: var(--mp-space-24) var(--mp-space-32) var(--mp-space-16);
}

.tickets-body {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 var(--mp-space-32) var(--mp-space-32);
}
/* While rows are checked, MpFloatingBulkBar floats over the bottom of the
   frame (24 from the edge + its own 20 margin + 48 tall). The card ends above
   it — plus one gap — so it never covers the reply bar or the last row.
   Two classes, so this also beats the compact padding below the breakpoint. */
.tickets-body.tickets-body--bulk {
  padding-bottom: calc(var(--mp-space-24) + var(--mp-space-20) + var(--mp-space-48) + var(--mp-space-16));
}

/* One card holds both panes; the split's separator is the only divider. */
.tickets-card {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tickets-split {
  flex: 1 1 0;
}

.tickets-list,
.tickets-detail {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

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

.tickets-folder-note {
  flex-shrink: 0;
  margin: var(--mp-space-8) var(--mp-component-card-paddingCompact) 0;
}

/* Drawer toggles are controls, not marks: the lg chip height (32), so they're
   easy to hit. Vuetify sizes chips from its own custom property. */
.tickets-toggles { padding: 0; }
/* The chips sit in Vuetify's slide-group content box, not the group root. */
.tickets-toggles :deep(.v-slide-group__content) { gap: var(--mp-space-8); }
.tickets-toggle {
  --v-chip-height: var(--mp-component-chip-height-lg);
  margin: 0;
}

/* Applied filters: chips wrap; a long value truncates inside its chip. */
.tickets-chip { max-width: 100%; }

/* Edited saved view: a quiet strip on the warning pair, actions trailing. */
.tickets-edited {
  padding: var(--mp-space-8);
  border-radius: var(--mp-component-chip-radius);
  background: var(--warn-soft);
  color: var(--warn-ink);
}
.tickets-edited__text {
  margin: 0;
  padding-inline: var(--mp-space-4);
  min-width: 0;
  color: var(--warn-ink);
}
.tickets-edited .v-btn--variant-text { color: var(--warn-ink); }

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

/* ── Below the split breakpoint: tighter gutters (MpSplitPane stacks the panes) ── */
@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .tickets-head { padding: var(--mp-space-16) var(--mp-space-16) var(--mp-space-12); }
  .tickets-body { padding: 0 var(--mp-space-16) var(--mp-space-16); }
}
</style>
