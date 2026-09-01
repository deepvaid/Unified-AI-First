<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpChatBubble from '@/components/MpChatBubble.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import {
  useTicketsStore,
  TICKET_AGENTS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TAGS,
  TICKET_TYPES,
  type TicketPriority,
  type TicketStatus,
} from '@/stores/useTickets'
import { useToast } from '@/composables/useToast'

const props = withDefaults(defineProps<{
  ticketId: number
  /** 'pane' = the split-view detail pane; 'page' = the full-page ticket route. */
  variant?: 'pane' | 'page'
  /** Rail panel to open on mount (the full page opens Customer Info by default). */
  defaultRail?: 'contact' | 'tags' | 'orders' | null
}>(), {
  variant: 'pane',
  defaultRail: null,
})

const store = useTicketsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const accountId = computed(() => route.params.accountId as string)

const ticket = computed(() => store.find(props.ticketId))

// ── Formatting ───────────────────────────────────────────────────────────────
function formatAt(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date}, ${time}`
}

const initials = (name: string) =>
  name.split(' ').map(part => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

// ── Feed: messages, optionally interleaved with system activities ────────────
const showActivities = ref(false)

type FeedItem =
  | { kind: 'message'; time: string; message: NonNullable<typeof ticket.value>['thread'][number] }
  | { kind: 'activity'; time: string; activity: NonNullable<typeof ticket.value>['activities'][number] }

const feed = computed<FeedItem[]>(() => {
  if (!ticket.value) return []
  const items: FeedItem[] = ticket.value.thread.map(m => ({ kind: 'message' as const, time: m.time, message: m }))
  if (showActivities.value) {
    items.push(...ticket.value.activities.map(a => ({ kind: 'activity' as const, time: a.time, activity: a })))
  }
  return items.sort((a, b) => a.time.localeCompare(b.time))
})

// ── Property bar (inline-editable Priority / Type / Status / Agent) ──────────
const priorityDot: Record<TicketPriority, string> = { Low: 'primary', Medium: 'warning', High: 'error' }

function setPriority(value: TicketPriority) {
  store.updateTicket(props.ticketId, { priority: value })
  toast.success(`Priority updated to ${value}`)
}
function setType(value: string) {
  store.updateTicket(props.ticketId, { type: value })
  toast.success(`Type updated to ${value}`)
}
function setStatus(value: TicketStatus) {
  store.updateTicket(props.ticketId, { status: value })
  toast.success(`Status updated to ${value}`)
}
function setAgent(value: string) {
  store.updateTicket(props.ticketId, { assignee: value })
  toast.success(`Assigned to ${value}`)
}

// ── Right rail panels ────────────────────────────────────────────────────────
type RailPanel = 'contact' | 'tags' | 'orders'
const railOpen = ref<RailPanel | null>(props.defaultRail)
watch(() => props.ticketId, () => { railOpen.value = props.defaultRail })
function toggleRail(panel: RailPanel) {
  railOpen.value = railOpen.value === panel ? null : panel
}
const railButtons: { panel: RailPanel; icon: string; label: string }[] = [
  { panel: 'contact', icon: 'contact', label: 'Customer info' },
  { panel: 'tags', icon: 'tag', label: 'Tags' },
  { panel: 'orders', icon: 'package', label: 'Customer orders' },
]

const orderSearch = ref('')
const visibleOrders = computed(() => {
  const q = orderSearch.value.trim().toLowerCase()
  const orders = ticket.value?.orders ?? []
  return q ? orders.filter(o => `${o.id} ${o.store}`.toLowerCase().includes(q)) : orders
})

function setTags(tags: string[]) {
  store.updateTicket(props.ticketId, { tags })
}

// Customer Info → pencil: edit the contact on this ticket.
const contactDialog = ref(false)
const contactForm = reactive({ name: '', email: '', phone: '' })
function openContactEdit() {
  if (!ticket.value) return
  Object.assign(contactForm, {
    name: ticket.value.customer,
    email: ticket.value.customerEmail,
    phone: ticket.value.customerPhone,
  })
  contactDialog.value = true
}
function saveContact() {
  store.updateContact(props.ticketId, { ...contactForm })
  contactDialog.value = false
  toast.success('Contact updated')
}

// ── Kebab: Edit Ticket Details / Mark as unread ──────────────────────────────
const editDrawer = ref(false)
const editForm = reactive({ subject: '', description: '', attachments: [] as string[] })
function openEditDetails() {
  if (!ticket.value) return
  Object.assign(editForm, {
    subject: ticket.value.subject,
    description: ticket.value.thread.find(m => m.role === 'customer')?.body ?? '',
    attachments: [],
  })
  editDrawer.value = true
}
function saveDetails() {
  if (!ticket.value) return
  store.updateTicket(props.ticketId, { subject: editForm.subject })
  const first = ticket.value.thread.find(m => m.role === 'customer')
  if (first) first.body = editForm.description
  editDrawer.value = false
  toast.success('Ticket details updated')
}
let attachSeq = 1
function mockAttach(target: { attachments: string[] }) {
  target.attachments.push(`attachment-${attachSeq++}.pdf`)
}

function markUnread() {
  store.markUnread([props.ticketId])
  toast.success('Marked as unread')
}

function expandToPage() {
  router.push({ name: 'TicketDetail', params: { accountId: accountId.value, id: String(props.ticketId) } })
}

// ── Composer (Reply / Forward / Note) ────────────────────────────────────────
const COMPOSER_MODES = ['Reply', 'Forward', 'Note'] as const
type ComposerMode = (typeof COMPOSER_MODES)[number]
const composerMode = ref<ComposerMode | null>(null)
const composer = reactive({
  from: 'support@maropost.com',
  to: '',
  cc: '',
  bcc: '',
  body: '',
  attachments: [] as string[],
})
const showCc = ref(false)
const showBcc = ref(false)
const FROM_OPTIONS = ['support@maropost.com', 'sushant@maropost.com']
const SIGNATURE = '\n\nBest Regards,\nDeepak Vaidya'

function openComposer(mode: ComposerMode) {
  composerMode.value = mode
  composer.from = FROM_OPTIONS[0]!
  composer.to = mode === 'Reply' ? (ticket.value?.customerEmail ?? '') : ''
  composer.cc = ''
  composer.bcc = ''
  composer.body = mode === 'Note' ? '' : SIGNATURE
  composer.attachments = []
  showCc.value = false
  showBcc.value = false
}
function closeComposer() {
  composerMode.value = null
}
const canSend = computed(() => {
  if (!composerMode.value) return false
  if (!composer.body.trim()) return false
  if (composerMode.value !== 'Note' && !composer.to.trim()) return false
  return true
})
function send(setStatus?: TicketStatus) {
  if (!composerMode.value || !canSend.value) return
  store.sendMessage(props.ticketId, {
    mode: composerMode.value,
    to: composer.to,
    body: composer.body.trim(),
    setStatus,
  })
  const verb = composerMode.value === 'Note' ? 'Note added' : composerMode.value === 'Forward' ? 'Ticket forwarded' : 'Reply sent'
  toast.success(setStatus ? `${verb} — status set to ${setStatus}` : verb)
  closeComposer()
}
const SEND_AND_SET: TicketStatus[] = ['Pending', 'On Hold', 'Closed']
</script>

<template>
  <div v-if="ticket" class="d-flex flex-column h-100" style="min-height: 0;">
    <!-- Property bar + header row -->
    <div class="tw-head border-b px-4 py-2 d-flex align-center flex-wrap ga-2 flex-shrink-0">
      <div class="d-flex align-center ga-4 flex-wrap">
        <v-menu v-for="menu in [
          { key: 'priority', label: 'Priority', value: ticket.priority, options: TICKET_PRIORITIES },
          { key: 'type', label: 'Type', value: ticket.type || '--', options: TICKET_TYPES },
          { key: 'status', label: 'Status', value: ticket.status, options: TICKET_STATUSES },
          { key: 'agent', label: 'Agent', value: ticket.assignee || 'Unassigned', options: TICKET_AGENTS },
        ]" :key="menu.key" location="bottom start">
          <template #activator="{ props: activator }">
            <button v-bind="activator" class="tw-prop" :aria-label="`${menu.label}: ${menu.value}. Change ${menu.label.toLowerCase()}`">
              <span class="tw-prop__label mp-meta-label text-medium-emphasis">{{ menu.label }}</span>
              <span class="tw-prop__value d-inline-flex align-center ga-1">
                <span v-if="menu.key === 'priority'" class="tw-dot" :style="{ background: `rgb(var(--v-theme-${priorityDot[ticket.priority]}))` }"></span>
                {{ menu.value }}
                <v-icon size="14">chevron-down</v-icon>
              </span>
            </button>
          </template>
          <v-list role="menu">
            <MpMenuItem
              v-for="option in menu.options"
              :key="option"
              :title="option"
              @click="menu.key === 'priority' ? setPriority(option as TicketPriority)
                : menu.key === 'type' ? setType(option)
                : menu.key === 'status' ? setStatus(option as TicketStatus)
                : setAgent(option)"
            />
          </v-list>
        </v-menu>
      </div>

      <v-spacer />

      <v-switch
        v-model="showActivities"
        label="Show activities"
        color="primary"
        density="compact"
        hide-details
        inset
        class="flex-grow-0"
      ></v-switch>
      <v-btn
        v-if="variant === 'pane'"
        icon="expand"
        variant="text"
        size="small"
        aria-label="Open ticket as a full page"
        @click="expandToPage"
      ></v-btn>
      <MpRowActionsMenu ariaLabel="Ticket actions">
        <MpMenuItem title="Edit ticket details" icon="pencil" @click="openEditDetails" />
        <MpMenuItem title="Mark as unread" icon="mail" @click="markUnread" />
      </MpRowActionsMenu>
    </div>

    <!-- Body: thread + right rail -->
    <div class="d-flex flex-grow-1" style="min-height: 0;">
      <!-- Thread -->
      <div class="flex-grow-1 overflow-y-auto pa-4 d-flex flex-column ga-4" style="min-width: 0;">
        <template v-for="item in feed" :key="item.kind === 'message' ? `m${item.message.id}` : `a${item.activity.id}`">
          <MpChatBubble
            v-if="item.kind === 'message'"
            side="start"
            :tone="item.message.role === 'customer' ? 'accent' : 'neutral'"
            :author="`${item.message.author} · ${item.message.action} · ${formatAt(item.message.time)}`"
            class="tw-bubble"
          >
            <template v-if="variant === 'page'" #avatar>
              <v-avatar size="32" :color="item.message.role === 'customer' ? 'primary' : 'secondary'">
                <span class="text-caption text-white">{{ initials(item.message.author) }}</span>
              </v-avatar>
            </template>
            <span v-if="item.message.to" class="d-block text-caption text-medium-emphasis mb-1">To: {{ item.message.to }}</span>
            {{ item.message.body }}
            <template v-if="item.message.role === 'note'" #footer>
              <span class="d-inline-flex align-center ga-1 text-caption text-medium-emphasis">
                <v-icon size="12">lock</v-icon> Internal note — not visible to the customer
              </span>
            </template>
          </MpChatBubble>

          <MpListRow
            v-else
            variant="boxed"
            density="compact"
            :eyebrow="`${item.activity.actor} · ${formatAt(item.activity.time)}`"
            :title="item.activity.text"
          />
        </template>

        <!-- Composer -->
        <v-card v-if="composerMode" flat border rounded="lg" class="flex-shrink-0">
          <div class="d-flex align-center ga-2 px-3 py-2 border-b">
            <v-select
              :model-value="composerMode"
              :items="[...COMPOSER_MODES]"
              aria-label="Message type"
              hide-details
              density="compact"
              style="max-width: 130px;"
              @update:model-value="(mode: ComposerMode) => openComposer(mode)"
            ></v-select>
            <v-select
              v-if="composerMode !== 'Note'"
              v-model="composer.from"
              :items="FROM_OPTIONS"
              aria-label="From address"
              hide-details
              density="compact"
              prepend-inner-icon="at-sign"
              style="max-width: 260px;"
            ></v-select>
            <v-spacer />
            <v-btn icon="paperclip" variant="text" size="small" aria-label="Attach a file" @click="mockAttach(composer)"></v-btn>
          </div>

          <div v-if="composerMode !== 'Note'" class="d-flex align-center ga-2 px-3 py-1 border-b">
            <v-text-field
              v-model="composer.to"
              placeholder="To"
              aria-label="To"
              hide-details
              density="compact"
            ></v-text-field>
            <v-btn v-if="!showCc" variant="text" size="small" class="text-none" @click="showCc = true">Cc</v-btn>
            <v-btn v-if="!showBcc" variant="text" size="small" class="text-none" @click="showBcc = true">Bcc</v-btn>
          </div>
          <div v-if="showCc" class="px-3 py-1 border-b">
            <v-text-field v-model="composer.cc" placeholder="Cc" aria-label="Cc" hide-details density="compact"></v-text-field>
          </div>
          <div v-if="showBcc" class="px-3 py-1 border-b">
            <v-text-field v-model="composer.bcc" placeholder="Bcc" aria-label="Bcc" hide-details density="compact"></v-text-field>
          </div>

          <!-- Formatting toolbar is intentionally inert: rich text is out of scope (see GAPS.md) -->
          <div class="d-flex align-center ga-1 px-3 py-1 border-b" aria-hidden="true">
            <v-btn v-for="icon in ['bold', 'italic', 'link', 'quote', 'list', 'list-ordered']" :key="icon"
              :icon="icon" variant="text" size="x-small" disabled></v-btn>
            <span class="text-caption text-disabled ml-2">Plain text — rich formatting isn't part of this prototype</span>
          </div>

          <v-textarea
            v-model="composer.body"
            :placeholder="composerMode === 'Note' ? 'Write an internal note…' : 'Write your message…'"
            :aria-label="composerMode === 'Note' ? 'Internal note' : 'Message body'"
            rows="5"
            hide-details
            class="tw-composer-body"
          ></v-textarea>

          <div v-if="composer.attachments.length" class="d-flex flex-wrap ga-2 px-3 pt-2">
            <v-chip v-for="(file, i) in composer.attachments" :key="file" size="small" closable
              prepend-icon="paperclip" @click:close="composer.attachments.splice(i, 1)">{{ file }}</v-chip>
          </div>

          <div class="d-flex align-center ga-2 pa-3">
            <v-btn variant="outlined" class="text-none" @click="closeComposer">Cancel</v-btn>
            <template v-if="composerMode === 'Note'">
              <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSend" @click="send()">Add note</v-btn>
            </template>
            <template v-else>
              <div class="d-inline-flex">
                <v-btn color="primary" variant="flat" class="text-none tw-send" :disabled="!canSend" @click="send()">Send</v-btn>
                <v-menu location="top end">
                  <template #activator="{ props: activator }">
                    <v-btn v-bind="activator" color="primary" variant="flat" icon="chevron-down" size="small"
                      class="tw-send-caret" :disabled="!canSend" aria-label="Send and set status"></v-btn>
                  </template>
                  <v-list role="menu">
                    <MpMenuItem v-for="status in SEND_AND_SET" :key="status"
                      :title="`Send and set as ${status}`" @click="send(status)" />
                  </v-list>
                </v-menu>
              </div>
            </template>
          </div>
        </v-card>
      </div>

      <!-- Right rail -->
      <div class="d-flex flex-shrink-0" style="min-height: 0;">
        <div v-if="railOpen" class="tw-rail-panel border-l d-flex flex-column">
          <div class="d-flex align-center ga-2 px-4 py-3 border-b">
            <v-icon size="18">{{ railButtons.find(b => b.panel === railOpen)?.icon }}</v-icon>
            <span class="text-body-2 font-weight-bold">{{ railButtons.find(b => b.panel === railOpen)?.label }}</span>
            <v-btn v-if="railOpen === 'contact'" icon="pencil" variant="text" size="x-small"
              aria-label="Edit contact" @click="openContactEdit"></v-btn>
            <v-spacer />
            <v-btn icon="x" variant="text" size="x-small" aria-label="Close panel" @click="railOpen = null"></v-btn>
          </div>

          <div class="pa-4 overflow-y-auto">
            <template v-if="railOpen === 'contact'">
              <div class="d-flex flex-column ga-4">
                <div>
                  <div class="mp-meta-label text-medium-emphasis">Name</div>
                  <RouterLink
                    :to="{ name: 'AllContacts', params: { accountId } }"
                    class="text-body-2 text-primary text-decoration-none d-inline-flex align-center ga-1"
                  >{{ ticket.customer }} <v-icon size="13">external-link</v-icon></RouterLink>
                </div>
                <div>
                  <div class="mp-meta-label text-medium-emphasis">Email</div>
                  <div class="text-body-2">{{ ticket.customerEmail }}</div>
                </div>
                <div>
                  <div class="mp-meta-label text-medium-emphasis">Mobile no.</div>
                  <div class="text-body-2">{{ ticket.customerPhone || '—' }}</div>
                </div>
              </div>
            </template>

            <template v-else-if="railOpen === 'tags'">
              <v-select
                :model-value="ticket.tags"
                :items="TICKET_TAGS"
                label="Tags"
                multiple
                chips
                closable-chips
                @update:model-value="setTags"
              ></v-select>
            </template>

            <template v-else>
              <v-text-field
                v-model="orderSearch"
                placeholder="Search"
                aria-label="Search customer orders"
                prepend-inner-icon="search"
                hide-details
                density="compact"
                class="mb-3"
              ></v-text-field>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Store</th>
                    <th>Order date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in visibleOrders" :key="order.id">
                    <td>{{ order.id }}</td>
                    <td>{{ order.store }}</td>
                    <td>{{ order.date }}</td>
                  </tr>
                  <tr v-if="!visibleOrders.length">
                    <td colspan="3" class="text-center text-medium-emphasis">No data available</td>
                  </tr>
                </tbody>
              </v-table>
            </template>
          </div>
        </div>

        <div class="tw-rail border-l d-flex flex-column align-center py-3 ga-1">
          <v-btn
            v-for="button in railButtons"
            :key="button.panel"
            :icon="button.icon"
            variant="text"
            size="small"
            :color="railOpen === button.panel ? 'primary' : undefined"
            :aria-label="button.label"
            :aria-pressed="railOpen === button.panel"
            @click="toggleRail(button.panel)"
          ></v-btn>
        </div>
      </div>
    </div>

    <!-- Action bar -->
    <div class="d-flex align-center ga-2 px-4 py-3 border-t flex-shrink-0">
      <v-btn color="primary" variant="flat" class="text-none" prepend-icon="reply"
        @click="openComposer('Reply')">Reply</v-btn>
      <v-btn variant="outlined" class="text-none" prepend-icon="forward"
        @click="openComposer('Forward')">Forward</v-btn>
      <v-btn variant="outlined" class="text-none" prepend-icon="file-pen"
        @click="openComposer('Note')">Note</v-btn>
    </div>

    <!-- Edit Ticket Details drawer -->
    <MpFormDrawer v-model="editDrawer" title="Edit ticket details" :subtitle="ticket.number" guarded>
      <MpFormGrid>
        <v-text-field v-model="editForm.subject" label="Subject *"></v-text-field>
        <v-textarea v-model="editForm.description" label="Description *" rows="5"></v-textarea>
        <v-text-field :model-value="`${ticket.customer} - ${ticket.customerEmail}`" label="Contacts"
          readonly class="mp-field-readonly"></v-text-field>
        <div>
          <v-btn variant="outlined" class="text-none" prepend-icon="paperclip" @click="mockAttach(editForm)">
            Attach file
          </v-btn>
          <div v-if="editForm.attachments.length" class="d-flex flex-wrap ga-2 mt-2">
            <v-chip v-for="(file, i) in editForm.attachments" :key="file" size="small" closable
              prepend-icon="paperclip" @click:close="editForm.attachments.splice(i, 1)">{{ file }}</v-chip>
          </div>
        </div>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="editDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none"
          :disabled="!editForm.subject.trim() || !editForm.description.trim()" @click="saveDetails">Save</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Contact edit (Customer Info pencil) -->
    <MpDialog v-model="contactDialog" title="Edit contact" size="sm">
      <MpFormGrid>
        <v-text-field v-model="contactForm.name" label="Name *"></v-text-field>
        <v-text-field v-model="contactForm.email" label="Email *" type="email"></v-text-field>
        <v-text-field v-model="contactForm.phone" label="Mobile no." hint="Include the country code"></v-text-field>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="contactDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none"
          :disabled="!contactForm.name.trim() || !contactForm.email.trim()" @click="saveContact">Save</v-btn>
      </template>
    </MpDialog>
  </div>

  <MpEmptyState
    v-else
    icon="ticket"
    title="Ticket not found"
    description="This ticket doesn't exist or was deleted."
  />
</template>

<style scoped>
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-l { border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

/* Inline property triggers: label + value read as one control. */
.tw-prop {
  display: inline-flex; align-items: center; gap: var(--mp-space-6);
  border: 0; background: transparent; font: inherit; cursor: pointer;
  border-radius: var(--mp-radius-8);
  padding: var(--mp-space-2) var(--mp-space-6);
  color: rgb(var(--v-theme-on-surface));
}
.tw-prop:hover { background: rgba(var(--v-theme-on-surface), 0.06); }
.tw-prop:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.tw-prop__value { font-size: var(--mp-font-size-13); font-weight: 600; }

.tw-dot {
  width: var(--mp-space-8); height: var(--mp-space-8);
  border-radius: var(--mp-radius-full); display: inline-block;
}

/* The thread reads as documents, not chat: bubbles span the pane. */
.tw-bubble { max-width: 100%; }
.tw-bubble :deep(.mp-bubble) { max-width: 100%; width: 100%; }

.tw-rail { width: 48px; }
.tw-rail-panel { width: 300px; min-width: 0; }

/* Split button: flat pair, no double radius between the halves. */
.tw-send { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.tw-send-caret { border-top-left-radius: 0; border-bottom-left-radius: 0; height: auto; }

/* The composer body is chrome inside a card, not a labelled form field. */
.tw-composer-body :deep(.v-field__outline) { display: none; }
</style>
