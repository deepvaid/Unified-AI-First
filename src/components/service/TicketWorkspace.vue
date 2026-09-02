<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
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
  /** Render a back control (shown below the split breakpoint, where the list is hidden). */
  showBack?: boolean
}>(), {
  variant: 'pane',
  defaultRail: null,
  showBack: false,
})

const emit = defineEmits<{ back: [] }>()

const store = useTicketsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const accountId = computed(() => route.params.accountId as string)

const ticket = computed(() => store.find(props.ticketId))

const eyebrow = computed(() =>
  [ticket.value?.number, ticket.value?.channel, ticket.value?.inbox].filter(Boolean).join(' · '),
)

// ── Formatting ───────────────────────────────────────────────────────────────
function formatAt(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date}, ${time}`
}

const initials = (name: string) =>
  name.split(' ').map(part => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

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

// The thread scrolls on its own; the composer is docked below it, so the
// latest message has to be brought into view explicitly.
const feedEl = ref<HTMLElement | null>(null)
async function scrollFeedToEnd(smooth = true) {
  await nextTick()
  const el = feedEl.value
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'auto' })
}

// ── Property row (inline-editable Priority / Type / Status / Agent) ──────────
const priorityDot: Record<TicketPriority, string> = { Low: 'primary', Medium: 'warning', High: 'error' }

const propertyMenus = computed(() => {
  const t = ticket.value
  if (!t) return []
  return [
    { key: 'priority', label: 'Priority', icon: null, value: t.priority, options: TICKET_PRIORITIES as readonly string[] },
    { key: 'type', label: 'Type', icon: 'tag', value: t.type || 'None', options: TICKET_TYPES as readonly string[] },
    { key: 'status', label: 'Status', icon: 'circle-dot', value: t.status, options: TICKET_STATUSES as readonly string[] },
    { key: 'agent', label: 'Agent', icon: 'user', value: t.assignee || 'Unassigned', options: TICKET_AGENTS as readonly string[] },
  ]
})

function setProperty(key: string, value: string) {
  if (key === 'priority') {
    store.updateTicket(props.ticketId, { priority: value as TicketPriority })
    toast.success(`Priority updated to ${value}`)
  } else if (key === 'type') {
    store.updateTicket(props.ticketId, { type: value })
    toast.success(`Type updated to ${value}`)
  } else if (key === 'status') {
    store.updateTicket(props.ticketId, { status: value as TicketStatus })
    toast.success(`Status updated to ${value}`)
  } else {
    store.updateTicket(props.ticketId, { assignee: value })
    toast.success(`Assigned to ${value}`)
  }
}

// ── Right rail panels ────────────────────────────────────────────────────────
type RailPanel = 'contact' | 'tags' | 'orders'
const railOpen = ref<RailPanel | null>(props.defaultRail)
watch(() => props.ticketId, () => {
  railOpen.value = props.defaultRail
  closeComposer()
  scrollFeedToEnd(false)
})
function toggleRail(panel: RailPanel) {
  railOpen.value = railOpen.value === panel ? null : panel
}
const railButtons: { panel: RailPanel; icon: string; label: string }[] = [
  { panel: 'contact', icon: 'contact', label: 'Customer info' },
  { panel: 'tags', icon: 'tag', label: 'Tags' },
  { panel: 'orders', icon: 'package', label: 'Customer orders' },
]
const activeRail = computed(() => railButtons.find(b => b.panel === railOpen.value))

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
  scrollFeedToEnd()
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
  scrollFeedToEnd()
}
const SEND_AND_SET: TicketStatus[] = ['Pending', 'On Hold', 'Closed']
</script>

<template>
  <div v-if="ticket" class="tw d-flex flex-column h-100">
    <!-- Title band (the full page already renders the subject in its page header) -->
    <header v-if="variant === 'pane'" class="tw-head border-b d-flex align-center ga-3">
      <v-btn
        v-if="showBack"
        class="tw-back"
        icon="chevron-left"
        variant="text"
        size="small"
        aria-label="Back to ticket list"
        @click="emit('back')"
      ></v-btn>
      <div class="tw-head__title">
        <div class="mp-meta-label text-medium-emphasis">{{ eyebrow }}</div>
        <h2 class="mp-section-title text-truncate">{{ ticket.subject }}</h2>
      </div>
    </header>

    <!-- Property row + pane actions -->
    <div class="tw-props border-b d-flex align-center flex-wrap ga-2">
      <v-menu v-for="menu in propertyMenus" :key="menu.key" location="bottom start">
        <template #activator="{ props: activator }">
          <button
            v-bind="activator"
            type="button"
            class="tw-prop"
            :aria-label="`${menu.label}: ${menu.value}. Change ${menu.label.toLowerCase()}`"
          >
            <span
              v-if="menu.key === 'priority'"
              class="tw-dot"
              :style="{ background: `rgb(var(--v-theme-${priorityDot[ticket.priority]}))` }"
            ></span>
            <v-icon v-else size="16" class="tw-prop__icon">{{ menu.icon }}</v-icon>
            <span class="tw-prop__label">{{ menu.label }}</span>
            <span class="tw-prop__value">{{ menu.value }}</span>
            <v-icon size="14" class="tw-prop__icon">chevron-down</v-icon>
          </button>
        </template>
        <v-list role="menu">
          <MpMenuItem
            v-for="option in menu.options"
            :key="option"
            :title="option"
            :active="option === menu.value"
            @click="setProperty(menu.key, option)"
          />
        </v-list>
      </v-menu>

      <div class="d-flex align-center ga-1 ms-auto">
        <v-tooltip text="Show activities" location="bottom">
          <template #activator="{ props: tooltip }">
            <v-btn
              v-bind="tooltip"
              icon="history"
              variant="text"
              size="small"
              :color="showActivities ? 'primary' : undefined"
              :aria-pressed="showActivities"
              aria-label="Show activities"
              @click="showActivities = !showActivities"
            ></v-btn>
          </template>
        </v-tooltip>
        <v-tooltip v-if="variant === 'pane'" text="Open as a full page" location="bottom">
          <template #activator="{ props: tooltip }">
            <v-btn
              v-bind="tooltip"
              icon="expand"
              variant="text"
              size="small"
              aria-label="Open ticket as a full page"
              @click="expandToPage"
            ></v-btn>
          </template>
        </v-tooltip>
        <MpRowActionsMenu ariaLabel="Ticket actions">
          <MpMenuItem title="Edit ticket details" icon="pencil" @click="openEditDetails" />
          <MpMenuItem title="Mark as unread" icon="mail" @click="markUnread" />
        </MpRowActionsMenu>
      </div>
    </div>

    <!-- Body: thread column (feed + docked footer) beside the right rail -->
    <div class="tw-body d-flex flex-grow-1">
      <div class="tw-thread d-flex flex-column flex-grow-1">
        <div ref="feedEl" class="tw-feed flex-grow-1 overflow-y-auto d-flex flex-column">
          <template v-for="item in feed" :key="item.kind === 'message' ? `m${item.message.id}` : `a${item.activity.id}`">
            <MpChatBubble
              v-if="item.kind === 'message'"
              side="start"
              :tone="item.message.role === 'customer' ? 'accent' : 'neutral'"
              :author="item.message.author"
              :time="formatAt(item.message.time)"
              class="tw-bubble"
              :class="{ 'tw-bubble--note': item.message.role === 'note' }"
            >
              <template #avatar>
                <v-avatar v-if="item.message.role === 'customer'" size="28" color="primary">
                  <span class="text-caption tw-strong">{{ initials(item.message.author) }}</span>
                </v-avatar>
                <v-avatar v-else-if="item.message.role === 'agent'" size="28" color="secondary">
                  <span class="text-caption tw-strong">{{ initials(item.message.author) }}</span>
                </v-avatar>
                <v-avatar v-else-if="item.message.role === 'bot'" size="28" color="surface-variant">
                  <v-icon size="16">bot</v-icon>
                </v-avatar>
                <v-avatar v-else size="28" color="warning" variant="tonal">
                  <v-icon size="16">sticky-note</v-icon>
                </v-avatar>
              </template>
              <span class="tw-bubble__meta d-block text-caption">
                {{ sentence(item.message.action) }}<template v-if="item.message.to"> · To: {{ item.message.to }}</template>
              </span>
              {{ item.message.body }}
              <template v-if="item.message.role === 'note'" #footer>
                <span class="d-inline-flex align-center ga-1">
                  <v-icon size="16">lock</v-icon> Internal note — not visible to the customer
                </span>
              </template>
            </MpChatBubble>

            <MpListRow
              v-else
              variant="boxed"
              density="compact"
              :eyebrow="`${item.activity.actor} · ${formatAt(item.activity.time)}`"
              :title="item.activity.text"
            >
              <template #lead>
                <v-icon size="16" class="text-medium-emphasis">activity</v-icon>
              </template>
            </MpListRow>
          </template>
        </div>

        <!-- Docked footer: the composer replaces the action bar while it is open -->
        <div class="tw-foot border-t flex-shrink-0 d-flex flex-column">
          <v-card v-if="composerMode" flat border rounded="lg" class="tw-composer ma-4">
            <div class="d-flex align-center ga-2 px-3 py-2 border-b">
              <!-- Composer chrome, not form fields: placeholder + aria-label, details
                   suppressed so the control row can never shift height. -->
              <v-select
                :model-value="composerMode"
                :items="[...COMPOSER_MODES]"
                aria-label="Message type"
                hide-details
                density="compact"
                class="tw-composer__mode"
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
                class="tw-composer__from"
              ></v-select>
              <v-spacer />
              <v-btn icon="paperclip" variant="text" size="small" aria-label="Attach a file" @click="mockAttach(composer)"></v-btn>
            </div>

            <div v-if="composerMode !== 'Note'" class="d-flex align-center ga-2 px-3 py-1 border-b">
              <v-text-field v-model="composer.to" placeholder="To" aria-label="To" hide-details density="compact"></v-text-field>
              <v-btn v-if="!showCc" variant="text" size="small" class="text-none" @click="showCc = true">Cc</v-btn>
              <v-btn v-if="!showBcc" variant="text" size="small" class="text-none" @click="showBcc = true">Bcc</v-btn>
            </div>
            <div v-if="showCc" class="px-3 py-1 border-b">
              <v-text-field v-model="composer.cc" placeholder="Cc" aria-label="Cc" hide-details density="compact"></v-text-field>
            </div>
            <div v-if="showBcc" class="px-3 py-1 border-b">
              <v-text-field v-model="composer.bcc" placeholder="Bcc" aria-label="Bcc" hide-details density="compact"></v-text-field>
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
              <v-btn variant="text" class="text-none" @click="closeComposer">Cancel</v-btn>
              <!-- Rich text is out of scope (see GAPS.md); say so instead of showing dead controls. -->
              <span class="text-caption text-medium-emphasis">Plain text</span>
              <v-spacer />
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

          <div v-else class="tw-actions d-flex align-center ga-2">
            <v-btn color="primary" variant="flat" class="text-none" prepend-icon="reply"
              @click="openComposer('Reply')">Reply</v-btn>
            <v-btn variant="outlined" class="text-none" prepend-icon="forward"
              @click="openComposer('Forward')">Forward</v-btn>
            <v-btn variant="outlined" class="text-none" prepend-icon="file-pen"
              @click="openComposer('Note')">Note</v-btn>
          </div>
        </div>
      </div>

      <!-- Right rail: optional panel + icon strip -->
      <div class="tw-aside d-flex flex-shrink-0">
        <section v-if="railOpen && activeRail" class="tw-rail-panel border-l d-flex flex-column" :aria-label="activeRail.label">
          <div class="tw-rail-panel__head d-flex align-center ga-2 border-b">
            <v-icon size="18" class="text-medium-emphasis">{{ activeRail.icon }}</v-icon>
            <span class="text-body-2 tw-strong text-truncate">{{ activeRail.label }}</span>
            <v-spacer />
            <v-btn v-if="railOpen === 'contact'" icon="pencil" variant="text" size="small"
              aria-label="Edit contact" @click="openContactEdit"></v-btn>
            <v-btn icon="x" variant="text" size="small" aria-label="Close panel" @click="railOpen = null"></v-btn>
          </div>

          <div class="tw-rail-panel__body">
            <template v-if="railOpen === 'contact'">
              <dl class="mp-label-value tw-dl">
                <div>
                  <dt class="mp-meta-label text-medium-emphasis">Name</dt>
                  <dd>
                    <RouterLink
                      :to="{ name: 'AllContacts', params: { accountId } }"
                      class="text-body-2 text-primary text-decoration-none d-inline-flex align-center ga-1"
                    >{{ ticket.customer }} <v-icon size="16">external-link</v-icon></RouterLink>
                  </dd>
                </div>
                <div>
                  <dt class="mp-meta-label text-medium-emphasis">Email</dt>
                  <dd class="text-body-2">{{ ticket.customerEmail }}</dd>
                </div>
                <div>
                  <dt class="mp-meta-label text-medium-emphasis">Mobile no.</dt>
                  <dd class="text-body-2">{{ ticket.customerPhone || '—' }}</dd>
                </div>
              </dl>
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
                placeholder="Search orders"
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
                    <td colspan="3" class="text-center text-caption text-medium-emphasis py-4">No orders found</td>
                  </tr>
                </tbody>
              </v-table>
            </template>
          </div>
        </section>

        <div class="tw-rail border-l d-flex flex-column align-center ga-1" role="toolbar" aria-label="Ticket panels" aria-orientation="vertical">
          <v-tooltip v-for="button in railButtons" :key="button.panel" :text="button.label" location="start">
            <template #activator="{ props: tooltip }">
              <v-btn
                v-bind="tooltip"
                :icon="button.icon"
                :variant="railOpen === button.panel ? 'tonal' : 'text'"
                :color="railOpen === button.panel ? 'primary' : undefined"
                size="small"
                :aria-label="button.label"
                :aria-pressed="railOpen === button.panel"
                @click="toggleRail(button.panel)"
              ></v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>
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

<style scoped lang="scss">
.tw { min-height: 0; }

.border-b { border-bottom: 1px solid var(--border-subtle); }
.border-t { border-top: 1px solid var(--border-subtle); }
.border-l { border-left: 1px solid var(--border-subtle); }

/* Vuetify has no 600 utility; this is the one semibold hook in the workspace. */
.tw-strong { font-weight: var(--mp-fontWeight-semibold); }

/* ── Title band ─────────────────────────────────────────────────────────── */
.tw-head {
  flex-shrink: 0;
  padding: var(--mp-space-16) var(--mp-component-card-padding);
}
.tw-head__title { min-width: 0; flex: 1 1 auto; }
.tw-head__title .mp-section-title { margin-top: var(--mp-space-2); }

/* The back control only exists where the list is hidden (below the split breakpoint). */
.tw-back { display: none; }

/* ── Property row ───────────────────────────────────────────────────────── */
.tw-props {
  flex-shrink: 0;
  padding: var(--mp-space-8) var(--mp-component-card-padding);
}

/* Inline property triggers read as compact field-chips: label + value as one control. */
.tw-prop {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  height: var(--mp-component-field-height-sm);
  padding-inline: var(--mp-space-10);
  border: 0;
  border-radius: var(--mp-component-chip-radius);
  background: var(--surface-secondary);
  color: var(--on-surface);
  font: inherit;
  cursor: pointer;
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.tw-prop:hover { background: var(--accent-soft); }
.tw-prop:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.tw-prop__icon { color: var(--on-surface-muted); }
.tw-prop__label {
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}
.tw-prop__value {
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-fontWeight-semibold);
}

.tw-dot {
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  display: inline-block;
  flex-shrink: 0;
}

/* ── Body ───────────────────────────────────────────────────────────────── */
.tw-body { min-height: 0; position: relative; isolation: isolate; }
.tw-thread { min-width: 0; min-height: 0; }

.tw-feed {
  padding: var(--mp-component-card-padding);
  gap: var(--mp-component-card-gap);
}

/* The thread reads as documents, not chat: bubbles span the column. */
.tw-bubble { max-width: 100%; }
.tw-bubble__meta {
  color: var(--on-surface-muted);
  margin-bottom: var(--mp-space-4);
}

/* Internal notes carry a warm tint through MpChatBubble's documented re-skin seam. */
.tw-bubble.tw-bubble--note {
  --mp-bubble-bg: var(--warn-soft);
  --mp-bubble-fg: var(--warn-ink);
  --mp-bubble-border: transparent;
}
.tw-bubble.tw-bubble--note .tw-bubble__meta { color: inherit; }

/* Docked footer: the thread keeps at least 40% of the pane. */
.tw-foot { max-height: 60%; }
.tw-composer {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}
.tw-actions { padding: var(--mp-space-12) var(--mp-component-card-padding); }

/* Composer selects share the toolbar search widths so the chrome sits on one ramp. */
.tw-composer__mode { max-width: calc(var(--mp-component-toolbar-searchMinWidth) / 2); }
.tw-composer__from { max-width: var(--mp-component-toolbar-searchWidth); }

/* Split button: flat pair, no double radius between the halves. */
.tw-send { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.tw-send-caret { border-top-left-radius: 0; border-bottom-left-radius: 0; height: auto; }

/* The composer body is chrome inside a card, not a labelled form field. */
.tw-composer-body :deep(.v-field__outline) { display: none; }

/* ── Right rail ─────────────────────────────────────────────────────────── */
.tw-aside { min-height: 0; }

.tw-rail {
  width: var(--mp-space-48);
  padding-block: var(--mp-space-8);
}

.tw-rail-panel {
  width: var(--mp-layout-inboxRailPanelWidth);
  min-width: 0;
  min-height: 0;
}
.tw-rail-panel__head {
  flex-shrink: 0;
  min-height: var(--mp-component-control-height);
  padding: var(--mp-space-8) var(--mp-space-12) var(--mp-space-8) var(--mp-space-16);
}
.tw-rail-panel__body {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-16);
}

/* One column of label/value pairs at panel width. */
.tw-dl {
  grid-template-columns: 1fr;
  gap: var(--mp-space-16);
}
.tw-dl dd { margin: 0; margin-top: var(--mp-space-2); }

/* ── Below the split breakpoint: back control appears, the panel overlays the thread ── */
@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .tw-back { display: inline-flex; }

  .tw-head,
  .tw-props { padding-inline: var(--mp-space-16); }
  .tw-feed { padding: var(--mp-space-16); }
  .tw-actions { padding-inline: var(--mp-space-16); }

  .tw-rail-panel {
    position: absolute;
    inset: 0 var(--mp-space-48) 0 0;
    width: auto;
    z-index: 1;
    background: var(--surface-primary);
  }
}
</style>
