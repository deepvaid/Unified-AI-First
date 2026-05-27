<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTicketsStore } from '@/stores/useTickets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'

const store = useTicketsStore()
const tab = ref<'list' | 'kanban'>('list')
const replyBody = ref('')
const search = ref('')
const filterStatus = ref('All')

const activeTicket = computed(() => store.tickets.find(t => t.id === store.activeTicketId))

// ── New Ticket Drawer ────────────────────────────────────────────────────
const newTicketDrawer = ref(false)
const saveSnack = ref(false)
const formTouched = ref(false)

const emptyForm = () => ({
  customer: '',
  email: '',
  subject: '',
  category: 'General',
  priority: 'Normal' as const,
  description: '',
  assignee: 'Auto-assign',
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
  saveSnack.value = true
  newTicket.value = emptyForm()
  formTouched.value = false
  tab.value = 'list'
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
  const map: Record<string, number> = { All: store.tickets.length }
  for (const s of statusOptions.slice(1)) {
    map[s] = store.tickets.filter(t => t.status === s).length
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

const priorityColor = (p: string): string =>
  ({ Urgent: 'error', High: 'warning', Normal: 'primary', Low: 'grey' } as Record<string, string>)[p] ?? 'default'

const filteredTickets = computed(() => {
  const q = search.value.toLowerCase()
  return store.tickets.filter(ticket => {
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

// ── Kanban ────────────────────────────────────────────────────────────────
const kanbanCols = [
  { status: 'Open',          color: 'error' },
  { status: 'In Progress',   color: 'warning' },
  { status: 'Awaiting Reply', color: 'info' },
  { status: 'Resolved',      color: 'success' },
]

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
</script>

<template>
  <div class="tkt-page d-flex flex-column">
    <!-- ── Header ────────────────────────────────────────────────── -->
    <MpPageHeader
      title="Support Tickets"
      :subtitle="`${store.tickets.filter(t => t.status === 'Open').length} open · ${store.tickets.filter(t => t.status === 'In Progress').length} in progress`"
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

    <!-- ── Toolbar: Search + View Toggle ───────────────────────── -->
    <div class="d-flex align-center gap-3 tkt-toolbar">
      <v-text-field
        v-model="search"
        prepend-inner-icon="search"
        placeholder="Search by ID, subject, customer, or email…"
        aria-label="Search tickets"
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
        rounded="lg"
        class="flex-grow-1 tkt-search"
      />
      <v-btn-toggle
        v-model="tab"
        density="compact"
        mandatory
        rounded="lg"
        class="tkt-view-toggle"
        aria-label="Switch view"
      >
        <v-btn value="list" size="small" class="text-none" aria-label="List view">
          <v-icon size="16" class="mr-1">list</v-icon> List
        </v-btn>
        <v-btn value="kanban" size="small" class="text-none" aria-label="Kanban view">
          <v-icon size="16" class="mr-1">columns-3</v-icon> Kanban
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- ── List View ────────────────────────────────────────────── -->
    <div v-if="tab === 'list'" class="tkt-workspace d-flex gap-4 mt-3">
      <!-- Left pane: Ticket list -->
      <v-card variant="flat" border rounded="lg" class="tkt-list-panel d-flex flex-column overflow-hidden">
        <div class="flex-grow-1 overflow-y-auto">
          <MpEmptyState
            v-if="filteredTickets.length === 0"
            icon="inbox"
            :title="search || filterStatus !== 'All' ? 'No matching tickets' : 'No tickets yet'"
            :description="search || filterStatus !== 'All' ? 'Try adjusting your search or filter.' : 'Create a ticket to start tracking support requests.'"
            :action-label="filterStatus === 'All' && !search ? 'Create ticket' : undefined"
            class="ma-4"
            @action="openNewTicket"
          />
          <button
            v-for="ticket in filteredTickets"
            :key="ticket.id"
            class="tkt-row w-100 d-flex align-start gap-3 pa-4 text-left"
            :class="{ 'tkt-row--active': store.activeTicketId === ticket.id }"
            :aria-pressed="store.activeTicketId === ticket.id"
            :aria-label="`Ticket ${ticket.number}: ${ticket.subject}`"
            @click="store.setActive(ticket.id)"
          >
            <v-avatar
              :color="store.activeTicketId === ticket.id ? 'primary' : 'surface-variant'"
              variant="flat"
              size="34"
              class="tkt-row__avatar text-caption font-weight-bold flex-shrink-0"
            >{{ ticket.avatar }}</v-avatar>
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption text-medium-emphasis">{{ ticket.number }}</span>
                <span class="text-caption text-medium-emphasis">{{ timeAgo(ticket.updatedAt) }}</span>
              </div>
              <div class="text-body-2 font-weight-medium tkt-row__subject mb-1">{{ ticket.subject }}</div>
              <div class="text-caption text-medium-emphasis mb-2">{{ ticket.customer }}</div>
              <div class="d-flex align-center gap-1 flex-wrap">
                <MpStatusChip :status="ticket.status" type="ticket" size="x-small" />
                <v-chip
                  v-if="ticket.priority === 'Urgent' || ticket.priority === 'High'"
                  :color="priorityColor(ticket.priority)"
                  size="x-small"
                  variant="flat"
                >{{ ticket.priority }}</v-chip>
                <v-chip
                  v-for="tag in ticket.tags"
                  :key="tag"
                  size="x-small"
                  variant="outlined"
                  color="secondary"
                >{{ tag }}</v-chip>
              </div>
              <div class="tkt-row__footer">
                <span>
                  <v-icon size="13">messages-square</v-icon>
                  {{ ticket.thread.length }} conversations
                </span>
                <span>{{ ticket.category }}</span>
              </div>
            </div>
          </button>
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
        <!-- Detail header -->
        <div class="tkt-detail__header pa-4 d-flex align-start justify-space-between gap-3">
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex align-center gap-2 flex-wrap mb-1">
              <span class="text-caption font-weight-medium text-medium-emphasis">{{ activeTicket.number }}</span>
              <MpStatusChip :status="activeTicket.status" type="ticket" size="x-small" />
              <v-chip :color="priorityColor(activeTicket.priority)" size="x-small" variant="flat">{{ activeTicket.priority }}</v-chip>
              <v-chip size="x-small" variant="outlined" color="secondary">{{ activeTicket.category }}</v-chip>
            </div>
            <div class="text-subtitle-1 font-weight-semibold tkt-detail__subject">{{ activeTicket.subject }}</div>
          </div>
          <div class="d-flex gap-1 align-center flex-shrink-0">
            <v-tooltip text="Mark Resolved" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="circle-check"
                  variant="text"
                  size="small"
                  color="success"
                  aria-label="Mark Resolved"
                  :disabled="activeTicket.status === 'Resolved' || activeTicket.status === 'Closed'"
                  @click="markResolved"
                />
              </template>
            </v-tooltip>
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
                <v-list-item prepend-icon="log-in" title="Reassign Ticket" />
                <v-divider class="my-1" />
                <v-list-item prepend-icon="trash-2" title="Delete Ticket" class="text-error" />
              </v-list>
            </v-menu>
          </div>
        </div>

        <!-- Customer / Assignee summary -->
        <div class="tkt-summary-grid pa-4">
          <div class="tkt-summary-item">
            <span class="tkt-summary-item__icon">
              <v-icon size="15">user</v-icon>
            </span>
            <div class="min-w-0">
              <span>Customer</span>
              <strong>{{ activeTicket.customer }}</strong>
              <em>{{ activeTicket.customerEmail }}</em>
            </div>
          </div>
          <div class="tkt-summary-item">
            <span class="tkt-summary-item__icon">
              <v-icon size="15">headset</v-icon>
            </span>
            <div class="min-w-0">
              <span>Assignee</span>
              <strong>{{ activeTicket.assignee }}</strong>
            </div>
          </div>
          <div class="tkt-summary-item">
            <span class="tkt-summary-item__icon">
              <v-icon size="15">clock-3</v-icon>
            </span>
            <div class="min-w-0">
              <span>Opened</span>
              <strong>{{ timeAgo(activeTicket.createdAt) }}</strong>
            </div>
          </div>
          <div class="tkt-summary-item">
            <span class="tkt-summary-item__icon">
              <v-icon size="15">messages-square</v-icon>
            </span>
            <div class="min-w-0">
              <span>Conversation</span>
              <strong>{{ activeTicket.thread.length }} messages</strong>
            </div>
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
                  <em>{{ msg.role === 'agent' ? 'Support' : 'Customer' }}</em>
                  <time>{{ msg.time }}</time>
                </div>
                <div class="tkt-message__bubble">{{ msg.body }}</div>
              </div>
            </article>
          </div>
        </div>

        <!-- Reply box -->
        <div class="tkt-reply pa-4">
          <v-textarea
            v-model="replyBody"
            placeholder="Write a reply…"
            variant="outlined"
            density="comfortable"
            rows="3"
            hide-details
            class="mb-3"
            rounded="lg"
            aria-label="Reply to ticket"
          />
          <div class="d-flex justify-space-between align-center">
            <div class="d-flex gap-1">
              <v-btn icon="paperclip" variant="text" size="small" aria-label="Attach file" />
              <v-btn icon="smile" variant="text" size="small" aria-label="Insert emoji" />
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
                <v-list density="compact" rounded="lg" nav elevation="8" min-width="240">
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

    <!-- ── Kanban View ───────────────────────────────────────────── -->
    <div v-if="tab === 'kanban'" class="tkt-kanban d-flex gap-4 mt-3 overflow-x-auto pb-4">
      <div
        v-for="col in kanbanCols"
        :key="col.status"
        class="tkt-kanban-col d-flex flex-column flex-shrink-0"
      >
        <!-- Column header -->
        <div class="d-flex align-center justify-space-between mb-3 px-1">
          <div class="d-flex align-center gap-2">
            <v-chip :color="col.color" size="x-small" variant="flat" class="font-weight-bold">
              {{ store.tickets.filter(t => t.status === col.status).length }}
            </v-chip>
            <span class="text-subtitle-2 font-weight-semibold">{{ col.status }}</span>
          </div>
          <v-btn
            icon="plus"
            variant="text"
            size="x-small"
            :aria-label="`Add ticket to ${col.status}`"
            @click="openNewTicket"
          />
        </div>
        <!-- Cards -->
        <div class="d-flex flex-column gap-2 overflow-y-auto flex-grow-1">
          <v-card
            v-for="ticket in store.tickets.filter(t => t.status === col.status)"
            :key="ticket.id"
            variant="flat"
            border
            rounded="lg"
            class="pa-3 cursor-pointer tkt-kanban-card"
            tabindex="0"
            :aria-label="`${ticket.number}: ${ticket.subject}`"
            @click="store.setActive(ticket.id); tab = 'list'"
            @keydown.enter="store.setActive(ticket.id); tab = 'list'"
            @keydown.space.prevent="store.setActive(ticket.id); tab = 'list'"
          >
            <div class="d-flex align-start justify-space-between mb-2 gap-2">
              <span class="text-caption text-medium-emphasis">{{ ticket.number }}</span>
              <v-chip :color="priorityColor(ticket.priority)" size="x-small" variant="flat">{{ ticket.priority }}</v-chip>
            </div>
            <div class="text-body-2 font-weight-medium mb-3 tkt-kanban-card__subject">{{ ticket.subject }}</div>
            <div class="d-flex align-center justify-space-between">
              <v-avatar color="primary" variant="tonal" size="24" class="text-caption font-weight-bold">{{ ticket.avatar }}</v-avatar>
              <span class="text-caption text-medium-emphasis">{{ timeAgo(ticket.updatedAt) }}</span>
            </div>
          </v-card>
        </div>
      </div>
    </div>
  </div>

  <!-- ── New Ticket Drawer ─────────────────────────────────────── -->
  <MpFormDrawer
    v-model="newTicketDrawer"
    title="Create New Ticket"
    subtitle="Log a support request on behalf of a customer"
  >
    <!-- Section: Customer -->
    <div class="tkt-form-section text-overline text-medium-emphasis mb-3">Customer</div>
    <v-text-field
      v-model="newTicket.customer"
      label="Customer Name"
      variant="outlined"
      density="comfortable"
      class="mb-3"
      prepend-inner-icon="user"
      :error-messages="formErrors.customer"
      required
    />
    <v-text-field
      v-model="newTicket.email"
      label="Customer Email"
      type="email"
      variant="outlined"
      density="comfortable"
      class="mb-4"
      prepend-inner-icon="mail"
      :error-messages="formErrors.email"
      required
    />

    <v-divider class="mb-4" />

    <!-- Section: Ticket Details -->
    <div class="tkt-form-section text-overline text-medium-emphasis mb-3">Ticket Details</div>
    <v-text-field
      v-model="newTicket.subject"
      label="Subject"
      variant="outlined"
      density="comfortable"
      class="mb-3"
      placeholder="Brief description of the issue"
      :error-messages="formErrors.subject"
      required
    />
    <v-row dense class="mb-3">
      <v-col cols="6">
        <v-select
          v-model="newTicket.category"
          label="Category"
          :items="['General', 'Order Issue', 'Billing', 'Technical', 'Returns & Refunds', 'Shipping']"
          variant="outlined"
          density="comfortable"
        />
      </v-col>
      <v-col cols="6">
        <v-select
          v-model="newTicket.priority"
          label="Priority"
          :items="[
            { title: 'Urgent', value: 'Urgent' },
            { title: 'High', value: 'High' },
            { title: 'Normal', value: 'Normal' },
            { title: 'Low', value: 'Low' },
          ]"
          variant="outlined"
          density="comfortable"
        >
          <template #selection="{ item }">
            <v-chip :color="priorityColor(item.value)" size="x-small" variant="flat">{{ item.title }}</v-chip>
          </template>
        </v-select>
      </v-col>
    </v-row>
    <v-textarea
      v-model="newTicket.description"
      label="Description"
      variant="outlined"
      density="comfortable"
      rows="4"
      class="mb-3"
      placeholder="Describe the customer's issue in detail…"
    />
    <v-select
      v-model="newTicket.assignee"
      label="Assign To"
      :items="['Auto-assign', 'Sarah Connor', 'Mike Zhang', 'Priya Sharma']"
      variant="outlined"
      density="comfortable"
      prepend-inner-icon="log-in"
    />

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

  <!-- Snackbar -->
  <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
    <div class="d-flex align-center gap-2">
      <v-icon>circle-check</v-icon> Ticket created and assigned
    </div>
  </v-snackbar>
</template>

<style scoped>
/* ── Page shell ────────────────────────────────────────────────── */
.tkt-page {
  height: 100%;
  gap: 0;
}

/* ── Toolbar ───────────────────────────────────────────────────── */
.tkt-toolbar {
  min-height: 44px;
}
.tkt-search :deep(.v-field) {
  background: rgb(var(--v-theme-surface));
}
.tkt-search :deep(.v-field:hover) {
  background: rgb(var(--v-theme-surface));
}
.tkt-view-toggle {
  height: 40px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}
.tkt-view-toggle :deep(.v-btn) {
  height: 100%;
  border-radius: 0;
  padding-inline: 14px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  letter-spacing: 0;
  font-weight: 500;
}
.tkt-view-toggle :deep(.v-btn.v-btn--active) {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

/* ── Workspace (list view) ─────────────────────────────────────── */
/*
 * v-container doesn't propagate a fixed height, so we must size the workspace
 * explicitly. --v-layout-top is Vuetify's CSS var for the app-bar offset (56px).
 * 228px = 32px container-padding-top + 68px page-header + 50px filter-row +
 *         56px toolbar-row + 22px extra buffer.
 */
.tkt-workspace {
  flex-direction: row;
  overflow: hidden;
  height: calc(100vh - var(--v-layout-top, 56px) - 228px);
  min-height: 480px;
}
.tkt-list-panel {
  width: 340px;
  min-width: 300px;
  flex-shrink: 0;
  height: 100%;
}

/* ── Ticket rows ───────────────────────────────────────────────── */
.tkt-row {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s ease;
}
.tkt-row:last-child { border-bottom: none; }
.tkt-row:hover { background: rgba(var(--v-theme-primary), 0.04); }
.tkt-row--active { background: rgba(var(--v-theme-primary), 0.08) !important; }
.tkt-row:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
.tkt-row__avatar { margin-top: 2px; }
.tkt-row__subject {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tkt-row__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-size: 11px;
  font-weight: 600;
}
.tkt-row__footer span {
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
.tkt-summary-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.8fr 0.9fr;
  gap: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface-variant), 0.22);
}
.tkt-summary-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.7));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}
.tkt-summary-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
.tkt-summary-item span,
.tkt-summary-item strong,
.tkt-summary-item em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tkt-summary-item span {
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 11px;
  font-weight: 700;
}
.tkt-summary-item strong {
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 13px;
  font-weight: 700;
}
.tkt-summary-item em {
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
.tkt-message__meta em {
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-style: normal;
  font-weight: 700;
}
.tkt-message__meta time {
  margin-left: auto;
  white-space: nowrap;
}
.tkt-message__bubble {
  padding: 14px 16px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
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
.tkt-message--agent .tkt-message__meta em {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

/* ── Reply ─────────────────────────────────────────────────────── */
.tkt-reply {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

/* ── Kanban ────────────────────────────────────────────────────── */
.tkt-kanban {
  height: calc(100vh - var(--v-layout-top, 56px) - 228px);
  min-height: 480px;
}
.tkt-kanban-col { width: 280px; }
.tkt-kanban-card { transition: box-shadow 0.12s ease, transform 0.12s ease; }
.tkt-kanban-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07); }
.tkt-kanban-card:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.tkt-kanban-card__subject {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ── Form drawer ───────────────────────────────────────────────── */
.tkt-form-section {
  font-size: 10px;
  letter-spacing: 0.08em;
}

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .tkt-workspace,
  .tkt-kanban {
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
  .tkt-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .tkt-list-panel { max-height: 36vh; }
  .tkt-toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .tkt-view-toggle { width: 100%; }
  .tkt-summary-grid {
    grid-template-columns: 1fr;
  }
  .tkt-message__meta time {
    margin-left: 0;
    width: 100%;
  }
}
</style>
