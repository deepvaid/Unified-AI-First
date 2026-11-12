import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { TicketFolder } from '@/service/model'
import { moveView as moveSavedView } from '@/service/ticketFilters'

// ── Vocabulary (mirrors the production service desk) ─────────────────────────
// Inboxes, ticket types, tags and agents are configured in Settings › Service
// (useServiceSettings); tickets reference inboxes by id and the rest by name.
export type TicketStatus = 'New' | 'Open' | 'Pending' | 'On Hold' | 'Closed'
export type TicketPriority = 'Low' | 'Medium' | 'High'
export type TicketChannel = 'Email' | 'Webstore' | 'Inbound Call' | 'Walk In'

export const TICKET_STATUSES: TicketStatus[] = ['New', 'Open', 'Pending', 'On Hold', 'Closed']
export const TICKET_PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High']
export const TICKET_CHANNELS: TicketChannel[] = ['Email', 'Webstore', 'Inbound Call', 'Walk In']
export const TICKET_GROUPS = ['General']

export interface TicketMessage {
  id: number
  author: string
  role: 'customer' | 'agent' | 'bot' | 'note'
  /** Verb phrase after the author name: "reported via Email", "replied", … */
  action: string
  to?: string
  time: string
  body: string
  /** Internal notes only: when the author last changed the text. */
  editedAt?: string
  /** Internal notes only: pinned to the top of the ticket for the whole team. */
  pinned?: boolean
}

export interface TicketActivity {
  id: number
  actor: string
  time: string
  text: string
}

export interface Ticket {
  id: number
  number: string
  subject: string
  customer: string
  customerEmail: string
  customerPhone: string
  status: TicketStatus
  priority: TicketPriority
  channel: TicketChannel | ''
  type: string
  assignee: string
  group: string
  /** `Inbox.id` from Settings › Service. */
  inboxId: string
  tags: string[]
  unread: boolean
  folder: TicketFolder
  createdAt: string
  updatedAt: string
  thread: TicketMessage[]
  activities: TicketActivity[]
  /**
   * The Commerce order (`Order.id`) this ticket is about. The customer's other
   * orders come from useCommerce().ordersForCustomer(customerEmail).
   */
  linkedOrderId: number | null
}

export interface TicketFilters {
  status: TicketStatus[]
  priority: TicketPriority[]
  channel: TicketChannel[]
  type: string[]
  group: string[]
  agent: string
  contact: string
  tags: string[]
  /** A rolling window ("last 7 days" stays true tomorrow); '' = none, or custom from/to dates. */
  createdWithin: '' | 'today' | '7d' | '30d'
  createdFrom: string
  createdTo: string
  readStatus: '' | 'Read' | 'Unread'
}

export const emptyTicketFilters = (): TicketFilters => ({
  status: [],
  priority: [],
  channel: [],
  type: [],
  group: [],
  agent: '',
  contact: '',
  tags: [],
  createdWithin: '',
  createdFrom: '',
  createdTo: '',
  readStatus: '',
})

/** A custom view is a named, saved filter set (created via "Save as View"), kept under one inbox. */
export interface SavedTicketView {
  name: string
  /** `Inbox.id`, or `'all'` for views under All inboxes. */
  inboxId: string
  filters: TicketFilters
}

export interface NewTicketPayload {
  inboxId: string
  customer: string
  customerEmail: string
  type: string
  channel: TicketChannel | ''
  status: TicketStatus
  priority: TicketPriority
  assignee: string
  tags: string[]
  subject: string
  description: string
}

const AUTO_REPLY = (name: string, subject: string) =>
  `Hi ${name},\n\nThank you for getting in touch with us. We have received your request titled '${subject}' and our team will promptly investigate it. You can expect to hear back from us soon.\n\nBest regards,\nSupport Team`

let messageSeq = 1000
let activitySeq = 5000

interface TicketSeed {
  id: number
  subject: string
  customer: string
  email: string
  phone?: string
  status: TicketStatus
  priority: TicketPriority
  channel: TicketChannel
  type?: string
  assignee?: string
  inboxId?: string
  folder?: TicketFolder
  tags?: string[]
  unread?: boolean
  createdAt: string
  body: string
  replies?: { author: string; body: string; note?: boolean; pinned?: boolean }[]
  linkedOrderId?: number
}

function seedTicket(seed: TicketSeed): Ticket {
  const created = new Date(seed.createdAt)
  const thread: TicketMessage[] = [
    {
      id: messageSeq++,
      author: seed.customer,
      role: 'customer',
      action: `reported via ${seed.channel}`,
      to: 'support@maropost.com',
      time: created.toISOString(),
      body: seed.body,
    },
  ]
  // Spam never gets the acknowledgement — replying would confirm the address to the sender.
  if (seed.folder !== 'spam') {
    thread.push({
      id: messageSeq++,
      author: 'Automated Bot',
      role: 'bot',
      action: 'replied',
      to: seed.email,
      time: new Date(created.getTime() + 60_000).toISOString(),
      body: AUTO_REPLY(seed.customer.split(' ')[0] ?? seed.customer, seed.subject),
    })
  }
  const activities: TicketActivity[] = [
    { id: activitySeq++, actor: 'System', time: new Date(created.getTime() + 61_000).toISOString(), text: 'Status updated to Open' },
  ]
  let last = created.getTime() + 61_000
  for (const [i, reply] of (seed.replies ?? []).entries()) {
    last += (i + 1) * 3_600_000
    thread.push({
      id: messageSeq++,
      author: reply.author,
      role: reply.note ? 'note' : 'agent',
      action: reply.note ? 'left an internal note' : 'replied',
      to: reply.note ? undefined : seed.email,
      time: new Date(last).toISOString(),
      body: reply.body,
      ...(reply.note && reply.pinned ? { pinned: true } : {}),
    })
  }
  return {
    id: seed.id,
    number: `#${seed.id}`,
    subject: seed.subject,
    customer: seed.customer,
    customerEmail: seed.email,
    customerPhone: seed.phone ?? '',
    status: seed.status,
    priority: seed.priority,
    channel: seed.channel,
    type: seed.type ?? '',
    assignee: seed.assignee ?? '',
    group: 'General',
    inboxId: seed.inboxId ?? 'support',
    tags: seed.tags ?? [],
    unread: seed.unread ?? false,
    folder: seed.folder ?? 'inbox',
    createdAt: created.toISOString(),
    updatedAt: new Date(last).toISOString(),
    thread,
    activities,
    linkedOrderId: seed.linkedOrderId ?? null,
  }
}

export const useTicketsStore = defineStore('tickets', () => {
  const tickets = ref<Ticket[]>([
    // System-detected spam (agents can't mark spam; they can only rescue with Not spam).
    seedTicket({
      id: 1526, subject: 'SECURITY ALERT: Your account has been SUSPENDED', customer: 'Fraud Prevention Desk', email: 'alerts@secure-verify-account.co',
      status: 'New', priority: 'Low', channel: 'Email', folder: 'spam', unread: true, createdAt: '2026-10-26T04:12:00Z',
      body: 'We detected a suspicious login attempt. Verify your identity within 12 hours using our secure shortened link or your account will be permanently deleted.',
    }),
    seedTicket({
      id: 1525, subject: 'Congratulations — you won the store lottery!', customer: 'Prize Team', email: 'winner@claim-prize-now.biz',
      status: 'New', priority: 'Low', channel: 'Email', folder: 'spam', unread: true, createdAt: '2026-10-30T09:40:00Z',
      body: 'You have been selected to receive a $1,000 gift card. Reply with your bank details to claim it today.',
    }),
    seedTicket({
      id: 1524, subject: 'Need help cancelling my order', customer: 'Rajan Bhanot', email: 'rjbhanot38@gmail.com',
      status: 'Open', priority: 'Low', channel: 'Email', assignee: 'Chris Parker', createdAt: '2026-08-31T08:25:00Z',
      body: 'need help to cancel order',
      linkedOrderId: 1, // #10000 — still processing, so it can be cancelled
    }),
    seedTicket({
      id: 1523, subject: 'Where is my refund?', customer: 'Rajan Bhanot', email: 'rjbhanot38@gmail.com',
      status: 'Open', priority: 'Medium', channel: 'Email', type: 'Payment', assignee: 'Chris Parker', tags: ['Refund'],
      linkedOrderId: 19, // #10018 — already refunded
      createdAt: '2026-08-31T07:02:00Z', body: 'I returned my order ten days ago and still have no refund on my card.',
      replies: [
        { author: 'Chris Parker', body: 'Hi Rajan — your refund was issued today and should appear within 3–5 business days.' },
        { author: 'Deepak Vaidya', body: 'Refund approved by finance on 30 Aug. Waiting on the bank, 5–7 days.', note: true, pinned: true },
      ],
    }),
    seedTicket({
      id: 1522, subject: 'Help with cancellation', customer: 'Rajan Bhanot', email: 'rjbhanot38@gmail.com',
      status: 'New', priority: 'Low', channel: 'Email', unread: true, createdAt: '2026-08-31T06:44:00Z',
      body: 'need help of cancellation',
    }),
    seedTicket({
      id: 1521, subject: 'Need help with order cancellation', customer: 'Rajan Bhanot', email: 'rjbhanot38@gmail.com',
      status: 'New', priority: 'Medium', channel: 'Webstore', type: 'Customer Request', unread: true,
      createdAt: '2026-08-31T05:12:00Z', body: 'Need help with order cancellation — I ordered the wrong size.',
    }),
    seedTicket({
      id: 1520, subject: 'Hello from Google Workspace', customer: 'Lorem Anderson', email: 'lorem@example.com',
      status: 'New', priority: 'Low', channel: 'Email', inboxId: 'orders', unread: true, createdAt: '2026-08-30T10:31:00Z',
      body: 'Hello From Google — verifying our new support address works.',
    }),
    seedTicket({
      id: 1519, subject: 'Give me an offer', customer: 'Abhinav Marla', email: 'abhinav.marla@example.com',
      status: 'New', priority: 'Low', channel: 'Email', type: 'Pricing', tags: ['VIP'], createdAt: '2026-08-30T08:15:00Z',
      body: 'Please — Thanks & Regards, Abhinav Marla, Senior Buyer. Looking for a bulk order discount on 200 units.',
    }),
    seedTicket({
      id: 1518, subject: 'Updates to our terms of use', customer: 'Microsoft', email: 'noreply@microsoft.com',
      status: 'New', priority: 'Low', channel: 'Email', createdAt: '2026-08-28T02:00:00Z',
      body: 'Updates to our terms of use — Hello, you\'re receiving this email because we are updating the Microsoft Services Agreement.',
    }),
    seedTicket({
      id: 1517, subject: 'Request regarding refund of product', customer: 'Lorem Anderson', email: 'lorem@example.com',
      status: 'New', priority: 'Medium', channel: 'Email', type: 'Payment', tags: ['Refund'],
      linkedOrderId: 22, // #10021 — completed, return requested
      createdAt: '2026-08-28T11:20:00Z', body: 'Request Regarding Refund Of Product — description attached.',
    }),
    seedTicket({
      id: 1516, subject: 'Attachment test for shop account', customer: 'Lorem Anderson', email: 'lorem@example.com',
      status: 'New', priority: 'Low', channel: 'Webstore', inboxId: 'orders', createdAt: '2026-08-27T16:41:00Z',
      body: 'Attachment test — please confirm you can open the file.',
    }),
    seedTicket({
      id: 1515, subject: 'New mail', customer: 'Rajan Bhanot', email: 'rjbhanot38@gmail.com',
      status: 'New', priority: 'Low', channel: 'Email', unread: true, createdAt: '2026-08-27T09:05:00Z',
      body: 'New mail',
    }),
    seedTicket({
      id: 1514, subject: 'Ticket count is wrong on dashboard', customer: 'Abhinav Marla', email: 'abhinav.marla@example.com',
      status: 'Pending', priority: 'High', channel: 'Inbound Call', type: 'Bug', assignee: 'Sushant Rana', tags: ['500 Error', 'Escalated'],
      createdAt: '2026-06-16T13:12:00Z', body: 'The open-ticket count on my dashboard does not match the list. Started after the June update.',
      replies: [
        { author: 'Sushant Rana', body: 'Thanks for flagging — we can reproduce this and have raised it with engineering.' },
        { author: 'Sushant Rana', body: 'Engineering ticket SD-2136 opened. Sev 3, targeting next patch.', note: true },
      ],
    }),
    seedTicket({
      id: 1513, subject: 'POS terminal not syncing loyalty points', customer: 'Emma Johnson', email: 'emma.johnson@email.com', phone: '+1 416 555 0132',
      status: 'On Hold', priority: 'High', channel: 'Walk In', type: 'Incident', assignee: 'Priya Shah', tags: ['Loyalty'],
      createdAt: '2026-06-02T16:20:00Z', body: 'Loyalty points from in-store purchases are not appearing in customer accounts.',
      replies: [{ author: 'Priya Shah', body: 'We\'ve paused the sync while the vendor investigates — I\'ll update you as soon as it resumes.' }],
    }),
    seedTicket({
      id: 1512, subject: 'Exchange for a different size', customer: 'Sofia Thompson', email: 'sofia.thompson@email.com',
      status: 'Closed', priority: 'Low', channel: 'Webstore', type: 'Customer Request', assignee: 'Chris Parker', tags: ['Order Issue'],
      createdAt: '2026-05-21T10:00:00Z', body: 'I\'d like to exchange my jacket for a size M.',
      replies: [{ author: 'Chris Parker', body: 'Exchange label sent — drop the parcel at any post office and the M ships on receipt.' }],
      linkedOrderId: 2, // #10001
    }),
    seedTicket({
      id: 1511, subject: 'Billing charged twice this month', customer: 'Liam Martinez', email: 'liam.martinez@email.com',
      status: 'Closed', priority: 'Medium', channel: 'Email', type: 'Payment', assignee: 'Deepak Vaidya',
      createdAt: '2026-05-04T08:47:00Z', body: 'My card was charged twice for the same invoice this month.',
      replies: [{ author: 'Deepak Vaidya', body: 'The duplicate charge was voided — apologies for the trouble.' }],
    }),
  ])

  const activeTicketId = ref(0)

  // Saved views created from the filter drawer ("Save as View").
  const customViews = ref<SavedTicketView[]>([
    { name: 'High Value Orders', inboxId: 'all', filters: { ...emptyTicketFilters(), tags: ['VIP'] } },
    { name: 'Walk-in Follow-ups', inboxId: 'all', filters: { ...emptyTicketFilters(), channel: ['Walk In'] } },
    { name: 'Payment Escalations', inboxId: 'all', filters: { ...emptyTicketFilters(), type: ['Payment'], priority: ['High', 'Medium'] } },
    { name: 'From the webstore', inboxId: 'orders', filters: { ...emptyTicketFilters(), channel: ['Webstore'] } },
  ])

  /** The working set: everything not in Spam or Trash. Lists, counts and widgets read this. */
  const visibleTickets = computed(() => tickets.value.filter(t => t.folder === 'inbox'))
  const trashedTickets = computed(() => tickets.value.filter(t => t.folder === 'trash'))
  const spamTickets = computed(() => tickets.value.filter(t => t.folder === 'spam'))

  function find(id: number): Ticket | undefined {
    return tickets.value.find(t => t.id === id)
  }

  function setActive(id: number) {
    activeTicketId.value = id
  }

  function touch(ticket: Ticket) {
    ticket.updatedAt = new Date().toISOString()
  }

  function pushActivity(ticket: Ticket, actor: string, text: string) {
    ticket.activities.push({ id: activitySeq++, actor, time: new Date().toISOString(), text })
  }

  function markRead(id: number) {
    const t = find(id)
    if (t) t.unread = false
  }

  function markUnread(ids: number[]) {
    ids.forEach(id => {
      const t = find(id)
      if (t) t.unread = true
    })
  }

  /** Inline property edits (status / priority / type / assignee / subject / tags…). */
  function updateTicket(id: number, patch: Partial<Ticket>, actor = 'Deepak Vaidya') {
    const t = find(id)
    if (!t) return
    if (patch.status && patch.status !== t.status) pushActivity(t, actor, `Status updated to ${patch.status}`)
    if (patch.priority && patch.priority !== t.priority) pushActivity(t, actor, `Priority updated to ${patch.priority}`)
    if (patch.type && patch.type !== t.type) pushActivity(t, actor, `Type updated to ${patch.type}`)
    if (patch.assignee && patch.assignee !== t.assignee) pushActivity(t, actor, `Assigned to ${patch.assignee}`)
    Object.assign(t, patch)
    touch(t)
  }

  function sendMessage(
    id: number,
    message: { mode: 'Reply' | 'Forward' | 'Note'; to: string; body: string; setStatus?: TicketStatus },
    author = 'Deepak Vaidya',
  ) {
    const t = find(id)
    if (!t) return
    t.thread.push({
      id: messageSeq++,
      author,
      role: message.mode === 'Note' ? 'note' : 'agent',
      action: message.mode === 'Note' ? 'left an internal note' : message.mode === 'Forward' ? 'forwarded' : 'replied',
      to: message.mode === 'Note' ? undefined : message.to,
      time: new Date().toISOString(),
      body: message.body,
    })
    if (message.setStatus && message.setStatus !== t.status) {
      t.status = message.setStatus
      pushActivity(t, author, `Status updated to ${message.setStatus}`)
    }
    touch(t)
  }

  // ── Internal notes: edit, delete, pin ───────────────────────────────────────
  const findNote = (ticketId: number, messageId: number) =>
    find(ticketId)?.thread.find(m => m.id === messageId && m.role === 'note')

  function editNote(ticketId: number, messageId: number, body: string) {
    const note = findNote(ticketId, messageId)
    if (!note || note.body === body) return
    note.body = body
    note.editedAt = new Date().toISOString()
  }

  /** Notes carry handover context, so deleting one leaves a trail. */
  function deleteNote(ticketId: number, messageId: number, actor = 'Deepak Vaidya') {
    const t = find(ticketId)
    if (!t || !findNote(ticketId, messageId)) return
    t.thread = t.thread.filter(m => m.id !== messageId)
    pushActivity(t, actor, 'Deleted an internal note')
  }

  function pinNote(ticketId: number, messageId: number, pinned: boolean) {
    const note = findNote(ticketId, messageId)
    if (note) note.pinned = pinned
  }

  function assignMany(ids: number[], agent: string, actor = 'Deepak Vaidya') {
    ids.forEach(id => updateTicket(id, { assignee: agent }, actor))
  }

  function closeMany(ids: number[], actor = 'Deepak Vaidya') {
    ids.forEach(id => updateTicket(id, { status: 'Closed' }, actor))
  }

  // ── Folders: inbox ⇄ spam ⇄ trash. Every move leaves a trail. ──────────────
  function moveToFolder(ids: number[], folder: TicketFolder, text: string, actor: string) {
    ids.forEach(id => {
      const t = find(id)
      if (!t || t.folder === folder) return
      t.folder = folder
      pushActivity(t, actor, text)
    })
  }

  /** Soft delete — tickets land in the Trash view and can be restored. */
  function trashMany(ids: number[], actor = 'Deepak Vaidya') {
    moveToFolder(ids, 'trash', 'Moved to trash', actor)
  }

  function restoreMany(ids: number[], actor = 'Deepak Vaidya') {
    moveToFolder(ids, 'inbox', 'Restored from trash', actor)
  }

  /** Agents can mark spam (6 Nov proposal; the call had spam as system-only). */
  function markSpam(ids: number[], actor = 'Deepak Vaidya') {
    moveToFolder(ids, 'spam', 'Marked as spam', actor)
  }

  function markNotSpam(ids: number[], actor = 'Deepak Vaidya') {
    moveToFolder(ids, 'inbox', 'Marked as not spam', actor)
  }

  // ── Kept in step with Settings › Service ───────────────────────────────────
  /** A deleted inbox hands its tickets — and the views saved under it — to another one. */
  function moveInbox(fromId: string, toId: string) {
    tickets.value.forEach(t => { if (t.inboxId === fromId) t.inboxId = toId })
    customViews.value.forEach(v => { if (v.inboxId === fromId) v.inboxId = toId })
  }

  /** Types, tags and agents are referenced by name: a rename follows into tickets and saved views. */
  function renameValue(kind: 'type' | 'tag' | 'agent', from: string, to: string) {
    const swap = (list: string[]) => list.map(v => (v === from ? to : v))
    tickets.value.forEach(t => {
      if (kind === 'type' && t.type === from) t.type = to
      if (kind === 'tag') t.tags = swap(t.tags)
      if (kind === 'agent' && t.assignee === from) t.assignee = to
    })
    customViews.value.forEach(({ filters }) => {
      if (kind === 'type') filters.type = swap(filters.type)
      if (kind === 'tag') filters.tags = swap(filters.tags)
      if (kind === 'agent' && filters.agent === from) filters.agent = to
    })
  }

  /** A deleted type or tag leaves no dangling reference behind. */
  function removeValue(kind: 'type' | 'tag', name: string) {
    const drop = (list: string[]) => list.filter(v => v !== name)
    tickets.value.forEach(t => {
      if (kind === 'type' && t.type === name) t.type = ''
      if (kind === 'tag') t.tags = drop(t.tags)
    })
    customViews.value.forEach(({ filters }) => {
      if (kind === 'type') filters.type = drop(filters.type)
      if (kind === 'tag') filters.tags = drop(filters.tags)
    })
  }

  // ── Orders (the data lives in useCommerce; the ticket keeps a reference) ────
  /** Marks which order the ticket is about; `null` unlinks. `orderNumber` labels the activity. */
  function linkOrder(id: number, order: { id: number; orderNumber: string } | null, actor = 'Deepak Vaidya') {
    const t = find(id)
    if (!t) return
    const previous = t.linkedOrderId
    t.linkedOrderId = order?.id ?? null
    pushActivity(t, actor, order ? `Linked order ${order.orderNumber}` : 'Unlinked the order')
    if (previous !== t.linkedOrderId) touch(t)
  }

  /** Something done to the customer's order from this ticket (cancel, refund) leaves a trail here too. */
  function logActivity(id: number, text: string, actor = 'Deepak Vaidya') {
    const t = find(id)
    if (!t) return
    pushActivity(t, actor, text)
    touch(t)
  }

  function updateContact(id: number, contact: { name: string; email: string; phone: string }) {
    const t = find(id)
    if (!t) return
    t.customer = contact.name
    t.customerEmail = contact.email
    t.customerPhone = contact.phone
    touch(t)
  }

  /** Saving under a name that already exists in that inbox updates it. */
  function saveView(name: string, filters: TicketFilters, inboxId = 'all') {
    const existing = customViews.value.find(v => v.name === name && v.inboxId === inboxId)
    if (existing) existing.filters = { ...filters }
    else customViews.value.push({ name, inboxId, filters: { ...filters } })
  }

  /** Reorders a view among its own inbox's views. */
  function moveView(inboxId: string, name: string, toIndex: number) {
    customViews.value = moveSavedView(customViews.value, inboxId, name, toIndex)
  }

  function renameView(inboxId: string, from: string, to: string) {
    const view = customViews.value.find(v => v.name === from && v.inboxId === inboxId)
    if (view) view.name = to
  }

  /** Tickets aren't touched — a view is only a saved filter. */
  function deleteView(inboxId: string, name: string) {
    customViews.value = customViews.value.filter(v => !(v.name === name && v.inboxId === inboxId))
  }

  function createTicket(payload: NewTicketPayload): number {
    const id = Math.max(1500, ...tickets.value.map(t => t.id)) + 1
    const now = new Date().toISOString()
    const ticket: Ticket = {
      id,
      number: `#${id}`,
      subject: payload.subject,
      customer: payload.customer,
      customerEmail: payload.customerEmail,
      customerPhone: '',
      status: payload.status,
      priority: payload.priority,
      channel: payload.channel,
      type: payload.type,
      assignee: payload.assignee,
      group: 'General',
      inboxId: payload.inboxId,
      tags: payload.tags,
      unread: false,
      folder: 'inbox',
      createdAt: now,
      updatedAt: now,
      thread: [{
        id: messageSeq++,
        author: payload.customer,
        role: 'customer',
        action: payload.channel ? `reported via ${payload.channel}` : 'reported',
        to: 'support@maropost.com',
        time: now,
        body: payload.description,
      }],
      activities: [{ id: activitySeq++, actor: 'Deepak Vaidya', time: now, text: 'Ticket created' }],
      linkedOrderId: null,
    }
    tickets.value.unshift(ticket)
    return id
  }

  return {
    tickets,
    visibleTickets,
    trashedTickets,
    spamTickets,
    activeTicketId,
    customViews,
    find,
    setActive,
    markRead,
    markUnread,
    updateTicket,
    sendMessage,
    editNote,
    deleteNote,
    pinNote,
    assignMany,
    closeMany,
    trashMany,
    restoreMany,
    markSpam,
    markNotSpam,
    moveInbox,
    renameValue,
    removeValue,
    linkOrder,
    logActivity,
    updateContact,
    saveView,
    moveView,
    renameView,
    deleteView,
    createTicket,
  }
})
