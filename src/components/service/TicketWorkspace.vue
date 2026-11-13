<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, useId, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import MpChatBubble from '@/components/MpChatBubble.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import TicketWorkspaceActions from '@/components/service/TicketWorkspaceActions.vue'
import MpTagChip from '@/components/MpTagChip.vue'
import TicketOrdersPanel from '@/components/service/TicketOrdersPanel.vue'
import TicketNote from '@/components/service/TicketNote.vue'
import MpSplitHandle from '@/components/MpSplitHandle.vue'
import {
  mp_layout_inboxRailPanelMinWidth,
  mp_layout_inboxRailPanelWidth,
  mp_layout_inboxThreadMinWidth,
  mp_layout_splitHandleWidth,
  mp_space_48,
} from '@/design-tokens/generated/tokens'
import { canManageNote, pinnedNotes } from '@/service/notes'
import { useCommerceStore } from '@/stores/useCommerce'
import {
  useTicketsStore,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from '@/stores/useTickets'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
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

const emit = defineEmits<{
  back: []
  /** The ticket left its folder (spam / not spam / trash / restore) — the list opens the next one. */
  moved: [ticketId: number]
}>()

const store = useTicketsStore()
const settings = useServiceSettingsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const accountId = computed(() => route.params.accountId as string)

const ticket = computed(() => store.find(props.ticketId))

const eyebrow = computed(() =>
  [ticket.value?.number, ticket.value?.channel, ticket.value && settings.inboxName(ticket.value.inboxId)]
    .filter(Boolean)
    .join(' · '),
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

// ── Internal notes: edit, delete, pin ───────────────────────────────────────
// The signed-in agent (the prototype has one); only a note's author manages it.
const CURRENT_AGENT = 'Deepak Vaidya'
const pinned = computed(() => (ticket.value ? pinnedNotes(ticket.value.thread) : []))

function saveNote(messageId: number, body: string) {
  store.editNote(props.ticketId, messageId, body)
  toast.success('Note updated')
}
function deleteNote(messageId: number) {
  store.deleteNote(props.ticketId, messageId, CURRENT_AGENT)
  toast.success('Note deleted')
}
function pinNote(messageId: number, value: boolean) {
  store.pinNote(props.ticketId, messageId, value)
  toast.success(value ? 'Note pinned to the top of this ticket' : 'Note unpinned')
}
/** From the pinned strip: bring the note into view in the thread and focus it. */
function jumpToNote(messageId: number) {
  const note = feedEl.value?.querySelector<HTMLElement>(`[data-note-id="${messageId}"]`)
  if (!note) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  note.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  note.focus({ preventScroll: true })
}

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
    { key: 'type', label: 'Type', icon: 'tag', value: t.type || 'None', options: settings.typeNames },
    { key: 'status', label: 'Status', icon: 'circle-dot', value: t.status, options: TICKET_STATUSES as readonly string[] },
    { key: 'agent', label: 'Agent', icon: 'user', value: t.assignee || 'Unassigned', options: settings.agentNames },
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

// ── Room for the side panel ──────────────────────────────────────────────────
// The layout follows the ticket area's own width, not the window's: a ticket
// beside a wide list on a laptop is as cramped as one on a phone. When the area
// can't fit the icon strip, the narrowest panel and a readable thread, the
// workspace goes compact and an open panel overlays the thread instead of
// squeezing it. Until the area is measured, the window width stands in.
const { mdAndUp } = useDisplay()
const RAIL_STRIP = parseFloat(mp_space_48)
const SPLIT_HANDLE = parseFloat(mp_layout_splitHandleWidth)
const PANEL_DEFAULT = parseFloat(mp_layout_inboxRailPanelWidth)
const PANEL_MIN = parseFloat(mp_layout_inboxRailPanelMinWidth)
const THREAD_MIN = parseFloat(mp_layout_inboxThreadMinWidth)

const bodyEl = ref<HTMLElement | null>(null)
const bodyWidth = ref(0)
let bodyObserver: ResizeObserver | undefined
// The body only exists while there is a ticket, so follow the element itself.
watch(bodyEl, el => {
  bodyObserver?.disconnect()
  if (!el) return
  bodyWidth.value = el.clientWidth
  bodyObserver = new ResizeObserver(([entry]) => {
    if (entry) bodyWidth.value = entry.contentRect.width
  })
  bodyObserver.observe(el)
}, { flush: 'post' })
onBeforeUnmount(() => bodyObserver?.disconnect())

/** The widest the panel may be while the thread keeps its minimum. */
const railMax = computed(() => bodyWidth.value - RAIL_STRIP - SPLIT_HANDLE - THREAD_MIN)
const compact = computed(() => (bodyWidth.value ? railMax.value < PANEL_MIN : !mdAndUp.value))

// The panel's width is the agent's: dragged, remembered, and only clamped for
// display — a narrower window never overwrites what they chose.
const RAIL_WIDTH_KEY = 'mp.tickets.railWidth.v1'
function readRailWidth(): number {
  try {
    const saved = Number(localStorage.getItem(RAIL_WIDTH_KEY))
    return Number.isFinite(saved) && saved >= PANEL_MIN ? saved : PANEL_DEFAULT
  } catch {
    return PANEL_DEFAULT
  }
}
const railWidth = ref(readRailWidth())
watch(railWidth, width => {
  try { localStorage.setItem(RAIL_WIDTH_KEY, String(width)) } catch { /* private mode */ }
})
const renderedRailWidth = computed(() =>
  bodyWidth.value ? Math.min(Math.max(PANEL_MIN, railMax.value), Math.max(PANEL_MIN, railWidth.value)) : railWidth.value)
const railDragging = ref(false)
const railPanelId = useId()

// ── Right rail panels ────────────────────────────────────────────────────────
type RailPanel = 'contact' | 'tags' | 'orders'
// In compact mode an open panel covers the thread, so it never opens by itself
// there — and one that opened by itself closes if the area turns compact.
const initialRail = () => (compact.value ? null : props.defaultRail)
const railOpen = ref<RailPanel | null>(initialRail())
let railOpenedByDefault = true
watch(() => props.ticketId, () => {
  railOpen.value = initialRail()
  railOpenedByDefault = true
  closeComposer()
  scrollFeedToEnd(false)
})
watch(compact, isCompact => {
  if (isCompact && railOpenedByDefault) railOpen.value = null
})
function toggleRail(panel: RailPanel) {
  railOpenedByDefault = false
  railOpen.value = railOpen.value === panel ? null : panel
}
const railButtons: { panel: RailPanel; icon: string; label: string }[] = [
  { panel: 'contact', icon: 'contact', label: 'Customer info' },
  { panel: 'tags', icon: 'tag', label: 'Tags' },
  { panel: 'orders', icon: 'package', label: 'Customer orders' },
]
const activeRail = computed(() => railButtons.find(b => b.panel === railOpen.value))

// ── Orders: the panel drills into one order; the title band's chip opens the linked one ──
const commerce = useCommerceStore()
const orderDetailId = ref<number | null>(null)
watch(() => props.ticketId, () => { orderDetailId.value = null })

const linkedOrder = computed(() =>
  ticket.value?.linkedOrderId ? commerce.getOrderById(ticket.value.linkedOrderId) : undefined,
)
async function openLinkedOrder() {
  if (!linkedOrder.value) return
  orderDetailId.value = linkedOrder.value.id
  railOpenedByDefault = false
  railOpen.value = 'orders'
  // Same as opening it from the list: focus lands on the order's heading.
  await nextTick()
  feedEl.value?.closest('.tw-body')?.querySelector<HTMLElement>('.top__title')?.focus()
}

/** "Insert in reply": the order summary goes above the signature, in an open Reply. */
async function insertIntoReply(text: string) {
  if (composerMode.value !== 'Reply' && composerMode.value !== 'Forward') openComposer('Reply')
  const signatureAt = composer.body.indexOf(SIGNATURE)
  composer.body = signatureAt >= 0
    ? `${composer.body.slice(0, signatureAt).trimEnd()}${composer.body.slice(0, signatureAt).trim() ? '\n\n' : ''}${text}${composer.body.slice(signatureAt)}`
    : `${composer.body.trimEnd()}${composer.body.trim() ? '\n\n' : ''}${text}`
  toast.success('Order details added to your reply')
  await nextTick()
  feedEl.value?.closest('.tw-thread')?.querySelector<HTMLTextAreaElement>('.tw-composer-body textarea')?.focus()
}

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

// ── Folder moves (⋮ menu and the read-only footer) — each with Undo ─────────
type FolderMove = 'spam' | 'notSpam' | 'trash' | 'restore'
const FOLDER_MOVES: Record<FolderMove, { run: (ids: number[]) => void; message: string }> = {
  spam: { run: ids => store.markSpam(ids), message: 'Marked as spam' },
  notSpam: { run: ids => store.markNotSpam(ids), message: 'Moved back to the inbox' },
  trash: { run: ids => store.trashMany(ids), message: 'Moved to Trash' },
  restore: { run: ids => store.restoreMany(ids), message: 'Restored' },
}
function moveTicket(to: FolderMove) {
  const id = props.ticketId
  const from = ticket.value?.folder
  if (!from) return
  FOLDER_MOVES[to].run([id])
  closeComposer()
  emit('moved', id)
  toast.success(FOLDER_MOVES[to].message, {
    action: {
      label: 'Undo',
      onClick: () => {
        if (from === 'spam') store.markSpam([id])
        else if (from === 'trash') store.trashMany([id])
        else if (to === 'spam') store.markNotSpam([id])
        else store.restoreMany([id])
      },
    },
  })
}

// The list's query (inbox, view, filters, search, sort) rides along so the full
// page's Back returns to exactly that list.
function expandToPage() {
  router.push({
    name: 'TicketDetail',
    params: { accountId: accountId.value, id: String(props.ticketId) },
    query: route.query,
  })
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
  <div v-if="ticket" class="tw d-flex flex-column h-100" :class="{ 'tw--compact': compact, 'tw--resizing': railDragging }">
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
        <div class="tw-eyebrow mp-meta-label text-medium-emphasis">{{ eyebrow }}</div>
        <!-- A short title column (compact) gets two lines before the subject is cut. -->
        <h2 class="mp-section-title" :class="compact ? 'tw-subject--clamp' : 'text-truncate'">{{ ticket.subject }}</h2>
        <div v-if="linkedOrder || ticket.tags.length" class="tw-head__meta d-flex align-center flex-wrap">
          <!-- The order this ticket is about, one click from its details. -->
          <button
            v-if="linkedOrder"
            type="button"
            class="tw-order-chip"
            :aria-label="`Open linked order ${linkedOrder.orderNumber}, ${linkedOrder.status}`"
            @click="openLinkedOrder"
          >
            <v-icon size="14">package</v-icon>
            <span>Order {{ linkedOrder.orderNumber }}</span>
            <span class="tw-order-chip__status">· {{ linkedOrder.status }}</span>
          </button>
          <!-- Every tag, wrapping; colours come from Settings › Tags. -->
          <ul v-if="ticket.tags.length" class="tw-tags d-flex align-center flex-wrap" aria-label="Tags">
            <li v-for="tag in ticket.tags" :key="tag" class="d-flex">
              <MpTagChip :name="tag" :color="settings.tagColor(tag)" />
            </li>
          </ul>
        </div>
      </div>
      <!-- The ticket's actions ride on its title, so the property row never wraps. -->
      <TicketWorkspaceActions
        v-model:show-activities="showActivities"
        :folder="ticket.folder"
        :can-expand="mdAndUp"
        @expand="expandToPage"
        @edit="openEditDetails"
        @unread="markUnread"
        @move="moveTicket"
      />
    </header>

    <!-- Property row (the full page, which has no title band, ends it with the actions) -->
    <div class="tw-props border-b d-flex align-center ga-2" :class="compact ? 'flex-nowrap' : 'flex-wrap'">
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

      <TicketWorkspaceActions
        v-if="variant === 'page'"
        v-model:show-activities="showActivities"
        :folder="ticket.folder"
        class="ms-auto"
        @edit="openEditDetails"
        @unread="markUnread"
        @move="moveTicket"
      />
    </div>

    <!-- Pinned notes stay in view on every visit; a line jumps to its note in the thread. -->
    <section v-if="pinned.length" class="tw-pinned border-b" aria-label="Pinned notes">
      <ul class="tw-pinned__list">
        <li v-for="note in pinned" :key="note.id" class="tw-pinned__item d-flex align-center ga-1">
          <v-icon size="16" aria-hidden="true">pin</v-icon>
          <button type="button" class="tw-pinned__jump text-truncate" @click="jumpToNote(note.id)">
            <span class="tw-pinned__author">{{ note.author }}:</span> {{ note.body }}
          </button>
          <v-btn
            v-if="ticket.folder === 'inbox'"
            icon="x"
            variant="text"
            size="x-small"
            :aria-label="`Unpin ${note.author}'s note`"
            @click="pinNote(note.id, false)"
          ></v-btn>
        </li>
      </ul>
    </section>

    <!-- Body: thread column (feed + docked footer) beside the right rail -->
    <div ref="bodyEl" class="tw-body flex-grow-1">
      <div class="tw-thread flex-grow-1">
        <!-- Focusable so the thread can be scrolled from the keyboard (WCAG 2.1.1). -->
        <div
          ref="feedEl"
          class="tw-feed flex-grow-1 overflow-y-auto d-flex flex-column"
          tabindex="0"
          role="region"
          :aria-label="`Conversation: ${ticket.subject}`"
        >
          <template v-for="item in feed" :key="item.kind === 'message' ? `m${item.message.id}` : `a${item.activity.id}`">
            <TicketNote
              v-if="item.kind === 'message' && item.message.role === 'note'"
              :message="item.message"
              :time="formatAt(item.message.time)"
              :can-manage="canManageNote(item.message, CURRENT_AGENT)"
              :readonly="ticket.folder !== 'inbox'"
              @save="body => saveNote(item.message.id, body)"
              @delete="deleteNote(item.message.id)"
              @pin="value => pinNote(item.message.id, value)"
            />
            <MpChatBubble
              v-else-if="item.kind === 'message'"
              side="start"
              :tone="item.message.role === 'customer' ? 'accent' : 'neutral'"
              :author="item.message.author"
              :time="formatAt(item.message.time)"
              class="tw-bubble"
            >
              <template #avatar>
                <v-avatar v-if="item.message.role === 'customer'" size="28" color="primary">
                  <span class="text-caption tw-strong">{{ initials(item.message.author) }}</span>
                </v-avatar>
                <v-avatar v-else-if="item.message.role === 'agent'" size="28" color="secondary">
                  <span class="text-caption tw-strong">{{ initials(item.message.author) }}</span>
                </v-avatar>
                <v-avatar v-else size="28" color="surface-variant">
                  <v-icon size="16">bot</v-icon>
                </v-avatar>
              </template>
              <span class="tw-bubble__meta d-block text-caption">
                {{ sentence(item.message.action) }}<template v-if="item.message.to"> · To: {{ item.message.to }}</template>
              </span>
              {{ item.message.body }}
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
          <!-- Spam and Trash are read-only: nobody replies to a phishing mail by accident. -->
          <div v-if="ticket.folder !== 'inbox'" class="tw-actions tw-folder-note d-flex align-center flex-wrap ga-3">
            <v-icon size="20" class="tw-folder-note__icon">{{ ticket.folder === 'spam' ? 'shield-alert' : 'trash-2' }}</v-icon>
            <span class="text-body-2 flex-grow-1">
              {{ ticket.folder === 'spam'
                ? 'Marked as spam. Replies are off until it’s back in the inbox.'
                : 'In Trash. Restore it to reply.' }}
            </span>
            <v-btn
              color="primary"
              variant="flat"
              class="text-none"
              :prepend-icon="ticket.folder === 'spam' ? 'shield-check' : 'undo-2'"
              @click="moveTicket(ticket.folder === 'spam' ? 'notSpam' : 'restore')"
            >
              {{ ticket.folder === 'spam' ? 'Not spam' : 'Restore' }}
            </v-btn>
          </div>
          <v-card v-else-if="composerMode" flat border rounded="lg" class="tw-composer ma-4">
            <div class="tw-composer__head d-flex align-center ga-2 px-3 py-2 border-b">
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

            <!-- Only the middle scrolls: the head row above and the Send row below
                 stay in view however long the message or recipient list gets. -->
            <div class="tw-composer__scroll">
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
            </div>

            <div class="tw-composer__actions d-flex align-center ga-2 pa-3">
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
      <div class="tw-aside flex-shrink-0">
        <!-- Beside the thread the panel is resizable; the handle draws its left hairline.
             In compact mode the panel overlays the thread and has no handle. -->
        <MpSplitHandle
          v-if="railOpen && activeRail && !compact"
          side="end"
          :size="renderedRailWidth"
          :min="PANEL_MIN"
          :max="railMax"
          :default-size="PANEL_DEFAULT"
          ariaLabel="Resize side panel"
          :controls="railPanelId"
          @update:size="width => { railWidth = width }"
          @dragging="active => { railDragging = active }"
        />
        <section
          v-if="railOpen && activeRail"
          :id="railPanelId"
          class="tw-rail-panel d-flex flex-column"
          :class="{ 'border-l': compact }"
          :style="compact ? undefined : { width: `${renderedRailWidth}px` }"
          :aria-label="activeRail.label"
        >
          <div class="tw-rail-panel__head d-flex align-center ga-2 border-b">
            <v-icon size="18" class="text-medium-emphasis">{{ activeRail.icon }}</v-icon>
            <span class="text-body-2 tw-strong text-truncate">{{ activeRail.label }}</span>
            <v-spacer />
            <v-btn v-if="railOpen === 'contact'" icon="pencil" variant="text" size="small"
              aria-label="Edit contact" @click="openContactEdit"></v-btn>
            <v-btn icon="x" variant="text" size="small" aria-label="Close panel" @click="railOpen = null"></v-btn>
          </div>

          <!-- The orders panel scrolls its own body and pins its action bar, so it takes the whole panel. -->
          <div class="tw-rail-panel__body" :class="{ 'tw-rail-panel__body--flush': railOpen === 'orders' }">
            <template v-if="railOpen === 'contact'">
              <dl class="mp-label-value tw-dl">
                <div>
                  <dt>Name</dt>
                  <dd>
                    <RouterLink
                      :to="{ name: 'AllContacts', params: { accountId } }"
                      class="text-body-2 text-primary text-decoration-none d-inline-flex align-center ga-1"
                    >{{ ticket.customer }} <v-icon size="16">external-link</v-icon></RouterLink>
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd class="text-body-2">{{ ticket.customerEmail }}</dd>
                </div>
                <div>
                  <dt>Mobile no.</dt>
                  <dd class="text-body-2">{{ ticket.customerPhone || '—' }}</dd>
                </div>
              </dl>
            </template>

            <template v-else-if="railOpen === 'tags'">
              <!-- Selected tags render as the same coloured chips as the list and
                   the title; the wrapper keeps a remove click from opening the menu. -->
              <v-select
                :model-value="ticket.tags"
                :items="settings.tagNames"
                label="Tags"
                multiple
                chips
                @update:model-value="setTags"
              >
                <template #chip="{ item }">
                  <span class="d-inline-flex" @mousedown.stop @click.stop>
                    <MpTagChip
                      :name="item.title"
                      :color="settings.tagColor(item.title)"
                      size="md"
                      removable
                      @remove="setTags(ticket.tags.filter(tag => tag !== item.title))"
                    />
                  </span>
                </template>
              </v-select>
            </template>

            <TicketOrdersPanel
              v-else
              v-model:order-id="orderDetailId"
              :ticket-id="ticket.id"
              @insert="insertIntoReply"
            />
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
/* display lives here, not in d-flex: below the split breakpoint the body turns
   into a grid and the thread/aside wrappers step aside (Vuetify's .d-flex is
   display:flex !important and would win). */
.tw-body { display: flex; min-height: 0; position: relative; isolation: isolate; }
.tw-thread { display: flex; flex-direction: column; min-width: 0; min-height: 0; }

.tw-feed {
  padding: var(--mp-component-card-padding);
  gap: var(--mp-component-card-gap);
}
.tw-feed:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
/* The feed is a height-capped flex column, so its items would shrink to fit.
   Compact MpListRow (the activity rows) drops its min-height to 0, so all the
   shrink landed on activities and their text overlapped. Items keep their
   content height; the feed scrolls instead. */
.tw-feed > * { flex-shrink: 0; }

/* The thread reads as documents, not chat: bubbles span the column. */
.tw-bubble { max-width: 100%; }
.tw-bubble__meta {
  color: var(--on-surface-muted);
  margin-bottom: var(--mp-space-4);
}

/* Pinned notes: a slim warm strip under the properties, one line per note. */
.tw-pinned {
  flex-shrink: 0;
  padding: var(--mp-space-4) var(--mp-space-12);
  background: var(--warn-soft);
  color: var(--warn-ink);
}
.tw-pinned__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.tw-pinned__item { min-width: 0; }
.tw-pinned__jump {
  flex: 1 1 auto;
  min-width: 0;
  min-height: var(--mp-component-chip-height-lg);
  padding: 0 var(--mp-space-4);
  border: 0;
  border-radius: var(--mp-radius-4);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--mp-fontSize-13);
  text-align: left;
  cursor: pointer;
}
.tw-pinned__jump:hover { text-decoration: underline; }
.tw-pinned__jump:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.tw-pinned__author { font-weight: var(--mp-fontWeight-semibold); }
.tw-pinned .v-btn { color: var(--warn-ink); }

/* Docked footer: the thread keeps at least 40% of the pane. */
.tw-foot { max-height: 60%; }
/* The card shrinks to the footer's cap; only its middle scrolls, so the mode
   row and the Send row are never scrolled out of reach. */
.tw-composer {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.tw-composer__head,
.tw-composer__actions { flex-shrink: 0; }
.tw-composer__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
.tw-actions { padding: var(--mp-space-12) var(--mp-component-card-padding); }
.tw-folder-note__icon { color: var(--on-surface-muted); }

/* Composer selects share the toolbar search widths so the chrome sits on one ramp. */
.tw-composer__mode { max-width: calc(var(--mp-component-toolbar-searchMinWidth) / 2); }
.tw-composer__from { max-width: var(--mp-component-toolbar-searchWidth); }

/* Split button: flat pair, no double radius between the halves. */
.tw-send { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.tw-send-caret { border-top-left-radius: 0; border-bottom-left-radius: 0; height: auto; }

/* The composer body is chrome inside a card, not a labelled form field. */
.tw-composer-body :deep(.v-field__outline) { display: none; }

/* ── Right rail ─────────────────────────────────────────────────────────── */
.tw-aside { display: flex; min-height: 0; }

.tw-rail {
  width: var(--mp-space-48);
  padding-block: var(--mp-space-8);
}

/* Width comes from the inline style (the agent's dragged width, clamped). */
.tw-rail-panel {
  min-width: 0;
  min-height: 0;
}
/* While the handle is dragged, nothing in the ticket gets selected. */
.tw--resizing {
  cursor: col-resize;
  user-select: none;
}
.tw-rail-panel__head {
  flex-shrink: 0;
  min-height: var(--mp-component-control-height);
  padding: var(--mp-space-8) var(--mp-space-12) var(--mp-space-8) var(--mp-space-16);
}
/* Two classes: the plain .tw-rail-panel__body rule below would otherwise win on order. */
.tw-rail-panel__body.tw-rail-panel__body--flush {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Linked-order chip under the subject: a quiet link-button on the chip ramp. */
.tw-head__meta {
  gap: var(--mp-space-6);
  margin-top: var(--mp-space-6);
}
.tw-tags {
  gap: var(--mp-space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.tw-order-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  white-space: nowrap;
  height: var(--mp-component-chip-height-md);
  padding-inline: var(--mp-component-chip-paddingInline);
  border: 0;
  border-radius: var(--mp-component-chip-radius);
  background: var(--surface-secondary);
  color: var(--on-surface);
  font: inherit;
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  cursor: pointer;
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.tw-order-chip:hover { background: var(--accent-soft); }
.tw-order-chip:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.tw-order-chip__status { color: var(--on-surface-muted); }

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
/* The back control belongs to the one-pane layout, which follows the window. */
@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .tw-back { display: inline-flex; }
}

/* ── Compact: the ticket area can't fit the strip, a panel and a readable thread.
   Set from the area's measured width (see `compact`), so it also covers a
   ticket beside a wide list on a laptop, not only phones. ── */
.tw--compact {
  .tw-head,
  .tw-props { padding-inline: var(--mp-space-16); }
  .tw-feed { padding: var(--mp-space-16); }
  .tw-actions { padding-inline: var(--mp-space-16); }

  /* Height is the scarce thing here, so the chrome above the thread stays short:
     a one-line eyebrow, a subject of at most two lines, and one row of
     properties that scrolls sideways instead of wrapping onto three. */
  .tw-head { padding-block: var(--mp-space-12); }
  .tw-eyebrow {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tw-subject--clamp {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  .tw-props {
    overflow-x: auto;
    scrollbar-width: none;
  }
  .tw-props::-webkit-scrollbar { display: none; }
  .tw-prop { flex-shrink: 0; }

  /* A 2×2 grid — feed | rail strip over footer | rail strip — so an open rail
     panel takes the feed's cell and the reply bar stays visible beneath it.
     The feed keeps at least 40% of the height; the footer gets the rest it
     needs (the same 60% cap the column layout uses). */
  .tw-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: minmax(40%, 1fr) minmax(0, auto);
  }
  .tw-thread,
  .tw-aside { display: contents; }
  .tw-feed { grid-area: 1 / 1; }
  .tw-foot { grid-area: 2 / 1; max-height: none; }
  .tw-rail { grid-area: 1 / 2 / 3 / 3; }

  .tw-rail-panel {
    grid-area: 1 / 1;
    width: auto;
    z-index: 1;
    background: var(--surface-primary);
  }
}
</style>
