<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTicketsStore, SUPPORT_INBOXES } from '@/stores/useTickets'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'

const store = useTicketsStore()
const replyBody = ref('')
const search = ref('')
const filterStatus = ref('All')

// ── Inboxes (one per store/sales channel) ────────────────────────────────
const inboxFilter = ref('all')
const inboxOptions = [
  { title: 'All inboxes', value: 'all' },
  ...SUPPORT_INBOXES.map(i => ({ title: i, value: i })),
]
const inboxTickets = computed(() =>
  inboxFilter.value === 'all'
    ? store.tickets
    : store.tickets.filter(t => t.inbox === inboxFilter.value)
)

// Keep the detail pane in sync with the selected inbox
watch(inboxFilter, () => {
  if (!inboxTickets.value.some(t => t.id === store.activeTicketId)) {
    store.setActive(inboxTickets.value[0]?.id ?? 0)
  }
})

const activeTicket = computed(() => store.tickets.find(t => t.id === store.activeTicketId))

const openCount = computed(() => inboxTickets.value.filter(t => t.status === 'Open').length)
const inProgressCount = computed(() => inboxTickets.value.filter(t => t.status === 'In Progress').length)

const replyPlaceholder = computed(() => {
  const first = activeTicket.value?.customer.split(' ')[0]
  return first ? `Reply to ${first}…` : 'Write a reply…'
})

// ── New Ticket Drawer ────────────────────────────────────────────────────
const toast = useToast()
const newTicketDrawer = ref(false)
const formTouched = ref(false)

const emptyForm = () => ({
  customer: '',
  email: '',
  subject: '',
  category: 'General',
  priority: 'Normal' as const,
  description: '',
  assignee: 'Auto-assign',
  inbox: inboxFilter.value === 'all' ? SUPPORT_INBOXES[0]! : inboxFilter.value,
})
const newTicket = ref(emptyForm())

const formErrors = computed(() => ({
  customer: formTouched.value && !newTicket.value.customer.trim() ? 'Customer name is required' : '',
  email: formTouched.value && !newTicket.value.email.trim() ? 'Customer email is required' : '',
  subject: formTouched.value && !newTicket.value.subject.trim() ? 'Subject is required' : '',
}))
const formValid = computed(() =>
  newTicket.value.customer.trim() && newTicket.value.email.trim() && newTicket.value.subject.trim()
)

function openNewTicket() {
  newTicket.value = emptyForm()
  formTouched.value = false
  newTicketDrawer.value = true
}

function submitTicket() {
  formTouched.value = true
  if (!formValid.value) return
  store.createTicket({ ...newTicket.value })
  newTicketDrawer.value = false
  toast.success('Ticket created and assigned')
  newTicket.value = emptyForm()
  formTouched.value = false
}

// ── Canned responses ─────────────────────────────────────────────────────
const cannedMenu = ref(false)
const cannedResponses = [
  { label: 'Thank you for reaching out', body: 'Hi {{first_name}},\n\nThank you for contacting our support team. We have received your message and will respond within 24 hours.' },
  { label: 'Order status update',        body: 'Hi {{first_name}},\n\nYour order {{order_id}} is currently being processed and will ship within 1–2 business days.' },
  { label: 'Refund confirmation',        body: 'Hi {{first_name}},\n\nYour refund of {{amount}} has been processed and will appear in your account within 3–5 business days.' },
]

// ── Filters ───────────────────────────────────────────────────────────────
const statusOptions = ['All', 'Open', 'In Progress', 'Awaiting Reply', 'Resolved', 'Closed']

const filterCounts = computed(() => {
  const map: Record<string, number> = { All: inboxTickets.value.length }
  for (const s of statusOptions.slice(1)) {
    map[s] = inboxTickets.value.filter(t => t.status === s).length
  }
  return map
})

const statusTabs = computed(() =>
  statusOptions.map(s => ({
    label: s,
    key: s,
    count: filterCounts.value[s] ?? 0,
  }))
)


const filteredTickets = computed(() => {
  const q = search.value.toLowerCase()
  return inboxTickets.value.filter(ticket => {
    const matchesStatus = filterStatus.value === 'All' || ticket.status === filterStatus.value
    const matchesSearch =
      !q ||
      ticket.subject.toLowerCase().includes(q) ||
      ticket.customer.toLowerCase().includes(q) ||
      ticket.number.toLowerCase().includes(q) ||
      ticket.customerEmail.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })
})

// ── Utilities ─────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function sendReply() {
  if (replyBody.value.trim() && activeTicket.value) {
    store.replyToTicket(activeTicket.value.id, replyBody.value.trim())
    replyBody.value = ''
  }
}

function markResolved() {
  if (activeTicket.value) store.resolveTicket(activeTicket.value.id)
}

function closeActiveTicket() {
  if (activeTicket.value) store.closeTicket(activeTicket.value.id)
}

// ── Delete (confirmed) ─────────────────────────────────────────────────────
const confirmDelete = ref(false)
function deleteActiveTicket() {
  if (activeTicket.value) store.deleteTicket(activeTicket.value.id)
  confirmDelete.value = false
}

// ── Multi-select + bulk actions ────────────────────────────────────────────
const selectedIds = ref<number[]>([])
const selectedSet = computed(() => new Set(selectedIds.value))
const confirmBulkDelete = ref(false)

function toggleSelected(id: number) {
  selectedIds.value = selectedSet.value.has(id)
    ? selectedIds.value.filter(x => x !== id)
    : [...selectedIds.value, id]
}
function selectAllVisible() {
  selectedIds.value = filteredTickets.value.map(t => t.id)
}
function clearSelection() {
  selectedIds.value = []
}
// Selection only ever refers to visible rows — prune when the inbox/status/search
// filters (or a deletion) drop a selected ticket out of the list.
watch(filteredTickets, tickets => {
  const visible = new Set(tickets.map(t => t.id))
  if (selectedIds.value.some(id => !visible.has(id))) {
    selectedIds.value = selectedIds.value.filter(id => visible.has(id))
  }
})

function announceBulk(n: number, verb: string) {
  toast.success(`${n} ticket${n === 1 ? '' : 's'} ${verb}`)
}
function bulkResolve() {
  const ids = [...selectedIds.value]
  ids.forEach(id => store.resolveTicket(id))
  clearSelection()
  announceBulk(ids.length, 'resolved')
}
function bulkClose() {
  const ids = [...selectedIds.value]
  ids.forEach(id => store.closeTicket(id))
  clearSelection()
  announceBulk(ids.length, 'closed')
}
function bulkDelete() {
  const ids = [...selectedIds.value]
  ids.forEach(id => store.deleteTicket(id))
  clearSelection()
  confirmBulkDelete.value = false
  announceBulk(ids.length, 'deleted')
}
</script>

<template>
  <div class="tkt-page d-flex flex-column">
    <!-- ── Header ────────────────────────────────────────────────── -->
    <MpPageHeader
      title="Support Tickets"
      :subtitle="`${openCount} open · ${inProgressCount} in progress`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openNewTicket">
          New Ticket
        </v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="filterStatus" :tabs="statusTabs" aria-label="Filter tickets by status" />
      </template>
    </MpPageHeader>

    <!-- ── Workspace: list + detail ─────────────────────────────── -->
    <div class="tkt-workspace d-flex gap-4 mt-4">
      <!-- Left pane: Ticket list -->
      <v-card variant="flat" border rounded="lg" class="tkt-list-panel d-flex flex-column overflow-hidden">
        <!-- In-pane controls: inbox switcher + search. These are dense list-pane
             controls, not form fields — `density="compact"` and the bare
             `hide-details` are deliberate suppression so the pane header stays
             one row tall. -->
        <div class="tkt-list-head px-3 pt-2 pb-3">
          <v-select
            v-model="inboxFilter"
            :items="inboxOptions"
            variant="plain"
            density="compact"
            hide-details
            prepend-inner-icon="inbox"
            aria-label="Switch support inbox"
            class="tkt-inbox-switch"
          />
          <v-text-field
            v-model="search"
            prepend-inner-icon="search"
            placeholder="Search tickets…"
            aria-label="Search tickets"
            density="compact"
            hide-details
            clearable
          />
        </div>
        <v-divider />

        <div class="flex-grow-1 overflow-y-auto">
          <MpEmptyState
            v-if="filteredTickets.length === 0"
            icon="inbox"
            :title="search || filterStatus !== 'All' || inboxFilter !== 'all' ? 'No matching tickets' : 'No tickets yet'"
            :description="search || filterStatus !== 'All' || inboxFilter !== 'all' ? 'Try adjusting your search, status filter, or inbox.' : 'Create a ticket to start tracking support requests.'"
            :action-label="filterStatus === 'All' && !search ? 'Create ticket' : undefined"
            class="ma-4"
            @action="openNewTicket"
          />
          <div
            v-for="ticket in filteredTickets"
            :key="ticket.id"
            class="tkt-row d-flex align-start gap-1 pa-3"
            :class="{
              'tkt-row--active': store.activeTicketId === ticket.id,
              'tkt-row--selected': selectedSet.has(ticket.id),
            }"
          >
            <v-checkbox-btn
              :model-value="selectedSet.has(ticket.id)"
              density="compact"
              class="tkt-row__check flex-shrink-0"
              :aria-label="`Select ticket ${ticket.number}`"
              @update:model-value="toggleSelected(ticket.id)"
            />
            <button
              class="tkt-row__main flex-grow-1 d-flex flex-column text-left min-w-0"
              :aria-pressed="store.activeTicketId === ticket.id"
              :aria-label="`Ticket ${ticket.number}: ${ticket.subject}`"
              @click="store.setActive(ticket.id)"
            >
              <div class="d-flex align-center gap-2 w-100 mb-1">
                <span
                  v-if="ticket.priority === 'Urgent' || ticket.priority === 'High'"
                  class="tkt-row__dot flex-shrink-0"
                  :class="ticket.priority === 'Urgent' ? 'tkt-row__dot--urgent' : 'tkt-row__dot--high'"
                  :title="`${ticket.priority} priority`"
                />
                <span class="text-body-2 font-weight-semibold tkt-row__customer flex-grow-1">{{ ticket.customer }}</span>
                <span class="text-caption text-medium-emphasis flex-shrink-0">{{ timeAgo(ticket.updatedAt) }}</span>
              </div>
              <div class="text-body-2 tkt-row__subject w-100 mb-2">{{ ticket.subject }}</div>
              <div class="d-flex align-center justify-space-between w-100">
                <MpStatusChip :status="ticket.status" type="ticket" size="sm" />
                <span v-if="inboxFilter === 'all'" class="tkt-row__origin text-caption text-medium-emphasis">
                  <v-icon size="12">store</v-icon>
                  {{ ticket.inbox }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </v-card>

      <!-- Right pane: Ticket detail -->
      <v-card
        v-if="activeTicket"
        variant="flat"
        border
        rounded="lg"
        class="tkt-detail-panel flex-grow-1 d-flex flex-column overflow-hidden"
      >
        <!-- Detail header: subject first, quiet meta below -->
        <div class="tkt-detail__header px-5 py-4 d-flex align-start justify-space-between gap-3">
          <div class="flex-grow-1 min-w-0">
            <div class="text-subtitle-1 font-weight-semibold tkt-detail__subject mb-1">{{ activeTicket.subject }}</div>
            <div class="d-flex align-center gap-2 flex-wrap">
              <span class="text-caption text-medium-emphasis">{{ activeTicket.number }}</span>
              <MpStatusChip :status="activeTicket.status" type="ticket" size="sm" />
              <v-chip
                v-for="tag in activeTicket.tags"
                :key="tag"
                size="x-small"
                variant="outlined"
                color="secondary"
              >{{ tag }}</v-chip>
            </div>
          </div>
          <div class="d-flex gap-2 align-center flex-shrink-0">
            <v-btn
              variant="tonal"
              color="success"
              size="small"
              class="text-none"
              prepend-icon="circle-check"
              :disabled="activeTicket.status === 'Resolved' || activeTicket.status === 'Closed'"
              @click="markResolved"
            >Resolve</v-btn>
            <v-menu location="bottom end">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="more-vertical"
                  variant="text"
                  size="small"
                  aria-label="More ticket options"
                />
              </template>
              <v-list density="compact" rounded="lg" nav min-width="180">
                <v-list-item prepend-icon="x-circle" title="Close Ticket" @click="closeActiveTicket" />
                <v-divider class="my-1" />
                <v-list-item prepend-icon="trash-2" title="Delete Ticket" class="text-error" @click="confirmDelete = true" />
              </v-list>
            </v-menu>
          </div>
        </div>

        <!-- Properties strip -->
        <div class="tkt-props px-5 py-3">
          <div class="tkt-prop">
            <span>Customer</span>
            <strong>{{ activeTicket.customer }}</strong>
            <em>{{ activeTicket.customerEmail }}</em>
          </div>
          <div class="tkt-prop">
            <span>Priority</span>
            <MpStatusChip :status="activeTicket.priority" type="priority" size="sm" variant="flat" class="mt-1" />
          </div>
          <div class="tkt-prop">
            <span>Assignee</span>
            <strong>{{ activeTicket.assignee }}</strong>
          </div>
          <div class="tkt-prop">
            <span>Inbox</span>
            <strong>{{ activeTicket.inbox }}</strong>
          </div>
          <div class="tkt-prop">
            <span>Category</span>
            <strong>{{ activeTicket.category }}</strong>
          </div>
          <div class="tkt-prop">
            <span>Opened</span>
            <strong>{{ timeAgo(activeTicket.createdAt) }}</strong>
          </div>
        </div>

        <!-- Thread -->
        <div class="flex-grow-1 overflow-y-auto tkt-thread pa-5">
          <div class="tkt-conversation">
            <article
              v-for="(msg, idx) in activeTicket.thread"
              :key="idx"
              class="tkt-message"
              :class="`tkt-message--${msg.role}`"
            >
              <v-avatar
                :color="msg.role === 'agent' ? 'primary' : 'surface-variant'"
                :variant="msg.role === 'agent' ? 'flat' : 'tonal'"
                size="34"
                class="text-caption font-weight-bold tkt-message__avatar"
              >
                {{ msg.avatar }}
              </v-avatar>
              <div class="tkt-message__content min-w-0">
                <div class="tkt-message__meta">
                  <span>{{ msg.author }}</span>
                  <time>{{ msg.time }}</time>
                </div>
                <div class="tkt-message__bubble">{{ msg.body }}</div>
              </div>
            </article>
          </div>
        </div>

        <!-- Composer -->
        <div class="tkt-reply pa-4">
          <div class="tkt-composer">
            <v-textarea
              v-model="replyBody"
              :placeholder="replyPlaceholder"
              variant="plain"
              rows="3"
              hide-details
              class="tkt-composer__input px-4 pt-1"
              aria-label="Reply to ticket"
            />
            <div class="d-flex justify-space-between align-center px-3 pb-3">
              <div class="d-flex gap-1">
                <v-tooltip text="Coming soon" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="paperclip" variant="text" size="small" aria-label="Attach file (coming soon)" />
                  </template>
                </v-tooltip>
                <v-tooltip text="Coming soon" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="smile" variant="text" size="small" aria-label="Insert emoji (coming soon)" />
                  </template>
                </v-tooltip>
                <v-menu v-model="cannedMenu" location="top start">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="files"
                      variant="text"
                      size="small"
                      aria-label="Insert canned response"
                      :aria-expanded="cannedMenu"
                    />
                  </template>
                  <v-list density="compact" rounded="lg" nav min-width="240">
                    <v-list-subheader>Canned Responses</v-list-subheader>
                    <v-list-item
                      v-for="cr in cannedResponses"
                      :key="cr.label"
                      :title="cr.label"
                      @click="replyBody += cr.body; cannedMenu = false"
                    />
                  </v-list>
                </v-menu>
              </div>
              <div class="d-flex gap-2 align-center">
                <v-btn
                  variant="text"
                  size="small"
                  class="text-none text-medium-emphasis"
                  :disabled="activeTicket.status === 'Closed'"
                  @click="closeActiveTicket"
                >Close Ticket</v-btn>
                <v-btn
                  color="primary"
                  variant="flat"
                  class="text-none"
                  prepend-icon="send"
                  :disabled="!replyBody.trim() || activeTicket.status === 'Closed'"
                  @click="sendReply"
                >Send Reply</v-btn>
              </div>
            </div>
          </div>
        </div>
      </v-card>

      <!-- No ticket selected -->
      <v-card
        v-else
        variant="flat"
        border
        rounded="lg"
        class="flex-grow-1 d-flex align-center justify-center"
      >
        <MpEmptyState
          icon="headset"
          title="Select a ticket"
          description="Choose a support ticket from the list to view details and reply."
          class="py-12"
        />
      </v-card>
    </div>

    <!-- ── Bulk actions (appears on selection) ──────────────────── -->
    <MpFloatingBulkBar
      :count="selectedIds.length"
      :total="filteredTickets.length"
      @clear="clearSelection"
      @select-all="selectAllVisible"
    >
      <v-btn variant="text" size="small" prepend-icon="circle-check" class="text-none" @click="bulkResolve">Resolve</v-btn>
      <v-btn variant="text" size="small" prepend-icon="x-circle" class="text-none" @click="bulkClose">Close</v-btn>
      <v-btn variant="text" size="small" prepend-icon="trash-2" color="error" class="text-none" @click="confirmBulkDelete = true">Delete</v-btn>
    </MpFloatingBulkBar>
  </div>

  <!-- ── New Ticket Drawer ─────────────────────────────────────── -->
  <MpFormDrawer
    v-model="newTicketDrawer"
    title="Create New Ticket"
    subtitle="Log a support request on behalf of a customer"
  >
    <MpFormSection title="Customer" />
    <MpFormGrid>
      <v-text-field
        v-model="newTicket.customer"
        label="Customer Name *"
        prepend-inner-icon="user"
        :error-messages="formErrors.customer"
        required
      />
      <v-text-field
        v-model="newTicket.email"
        label="Customer Email *"
        type="email"
        prepend-inner-icon="mail"
        :error-messages="formErrors.email"
        required
      />
    </MpFormGrid>

    <MpFormSection title="Ticket Details" />
    <MpFormGrid :cols="2">
      <v-text-field
        v-model="newTicket.subject"
        label="Subject *"
        class="mp-form-grid__full"
        placeholder="Brief description of the issue"
        :error-messages="formErrors.subject"
        required
      />
      <v-select
        v-model="newTicket.category"
        label="Category"
        :items="['General', 'Order Issue', 'Billing', 'Technical', 'Returns & Refunds', 'Shipping']"
      />
      <v-select
        v-model="newTicket.priority"
        label="Priority"
        :items="[
          { title: 'Urgent', value: 'Urgent' },
          { title: 'High', value: 'High' },
          { title: 'Normal', value: 'Normal' },
          { title: 'Low', value: 'Low' },
        ]"
      >
        <template #selection="{ item }">
          <MpStatusChip :status="item.value" type="priority" size="sm" variant="flat" />
        </template>
      </v-select>
      <v-textarea
        v-model="newTicket.description"
        label="Description"
        rows="5"
        class="mp-form-grid__full"
        placeholder="Describe the customer's issue in detail…"
      />
      <v-select
        v-model="newTicket.inbox"
        label="Inbox"
        :items="SUPPORT_INBOXES"
        class="mp-form-grid__full"
        prepend-inner-icon="store"
        hint="The store or sales channel this request belongs to"
        persistent-hint
      />
      <v-select
        v-model="newTicket.assignee"
        label="Assign To"
        :items="['Auto-assign', 'Sarah Connor', 'Mike Zhang', 'Priya Sharma']"
        class="mp-form-grid__full"
        prepend-inner-icon="log-in"
      />
    </MpFormGrid>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="newTicketDrawer = false">Cancel</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        class="text-none"
        prepend-icon="plus"
        @click="submitTicket"
      >Create Ticket</v-btn>
    </template>
  </MpFormDrawer>

  <!-- Delete confirmation -->
  <MpConfirmDialog
    v-model="confirmDelete"
    title="Delete ticket?"
    message="This permanently removes the ticket and its entire conversation thread. This cannot be undone."
    confirm-label="Delete Ticket"
    danger
    @confirm="deleteActiveTicket"
  />

  <!-- Bulk delete confirmation -->
  <MpConfirmDialog
    v-model="confirmBulkDelete"
    title="Delete selected tickets?"
    :message="selectedIds.length === 1
      ? 'This permanently removes the selected ticket and its entire conversation thread. This cannot be undone.'
      : `This permanently removes ${selectedIds.length} tickets and their entire conversation threads. This cannot be undone.`"
    confirm-label="Delete Tickets"
    danger
    @confirm="bulkDelete"
  />
</template>

<style scoped>
/* ── Page shell ────────────────────────────────────────────────── */
.tkt-page {
  height: 100%;
  gap: 0;
}

/* ── Workspace ─────────────────────────────────────────────────── */
/*
 * v-container doesn't propagate a fixed height, so we must size the workspace
 * explicitly. --v-layout-top is Vuetify's CSS var for the app-bar offset (56px).
 * 172px = 32px container-padding-top + 68px page-header + 50px filter-row +
 *         22px extra buffer. (List controls now live inside the list pane.)
 */
.tkt-workspace {
  flex-direction: row;
  overflow: hidden;
  height: calc(100vh - var(--v-layout-top, 56px) - 172px);
  min-height: 480px;
}
.tkt-list-panel {
  width: 340px;
  min-width: 300px;
  flex-shrink: 0;
  height: 100%;
}

/* ── In-pane list controls ─────────────────────────────────────── */
.tkt-inbox-switch {
  flex: 0 0 auto;
  margin-bottom: 4px;
}
.tkt-inbox-switch :deep(.v-field__input) {
  font-size: 14px;
  font-weight: 700;
  min-height: 36px;
  padding-top: 4px;
  padding-bottom: 4px;
}
/* P6-12 correction: this stays. It looks like the affix hand-patch that phase set
   out to delete, but it is not — the app-level affix rules are scoped to the
   outlined variant, and this control is `variant="plain"`, which Vuetify
   deliberately top-aligns. Combined with the bespoke 36px input height above, the
   icon needs its own offset. Not a form field: it is the inbox switcher in the
   ticket toolbar. */
.tkt-inbox-switch :deep(.v-field__prepend-inner) {
  padding-top: var(--mp-space-6);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* ── Ticket rows ───────────────────────────────────────────────── */
.tkt-row {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: background 0.12s ease;
}
.tkt-row:last-child { border-bottom: none; }
.tkt-row:hover { background: rgba(var(--v-theme-primary), 0.04); }
.tkt-row--active {
  background: rgba(var(--v-theme-primary), 0.07) !important;
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-primary));
}
.tkt-row--selected {
  background: rgba(var(--v-theme-primary), 0.05);
}
.tkt-row__main {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}
.tkt-row__main:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
.tkt-row__check {
  margin: -6px 0 0 -8px;
}
.tkt-row__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.tkt-row__dot--urgent { background: rgb(var(--v-theme-error)); }
.tkt-row__dot--high { background: rgb(var(--v-theme-warning)); }
.tkt-row__customer {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.tkt-row__subject {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.68);
}
.tkt-row__origin {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.min-w-0 { min-width: 0; }

/* ── Detail panel ──────────────────────────────────────────────── */
.tkt-detail-panel { min-width: 0; height: 100%; }
.tkt-detail__header {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.tkt-detail__subject {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ── Properties strip ──────────────────────────────────────────── */
.tkt-props {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface-variant), 0.18);
}
.tkt-prop {
  min-width: 0;
}
.tkt-prop span,
.tkt-prop strong,
.tkt-prop em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tkt-prop span {
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.tkt-prop strong {
  margin-top: 1px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px;
  font-weight: 600;
}
.tkt-prop em {
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-size: 12px;
  font-style: normal;
}

/* ── Thread ────────────────────────────────────────────────────── */
.tkt-thread { background: rgba(var(--v-theme-on-surface), 0.015); }
.tkt-conversation {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 880px;
  margin-inline: auto;
}
.tkt-message {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}
.tkt-message__avatar {
  margin-top: 22px;
}
.tkt-message__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tkt-message__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  min-width: 0;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 12px;
}
.tkt-message__meta span {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 700;
}
.tkt-message__meta time {
  margin-left: auto;
  white-space: nowrap;
}
.tkt-message__bubble {
  padding: 12px 16px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), 0.82);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}
.tkt-message--agent .tkt-message__bubble {
  border-color: rgba(var(--v-theme-primary), 0.22);
  background: rgba(var(--v-theme-primary), 0.06);
}

/* ── Composer ──────────────────────────────────────────────────── */
.tkt-reply {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}
.tkt-composer {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}
.tkt-composer:focus-within {
  border-color: rgba(var(--v-theme-primary), 0.5);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
}
.tkt-composer__input :deep(textarea) {
  font-size: 14px;
  line-height: 1.6;
}

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .tkt-workspace {
    flex-direction: column;
    overflow: visible;
    height: auto;
    min-height: 0;
  }
  .tkt-list-panel {
    width: 100%;
    min-width: 0;
    height: auto;
    max-height: 42vh;
  }
  .tkt-detail-panel {
    height: auto;
    min-height: 400px;
  }
}
@media (max-width: 640px) {
  .tkt-list-panel { max-height: 36vh; }
  .tkt-props { gap: 8px 20px; }
}
</style>
