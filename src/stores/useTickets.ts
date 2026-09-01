import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// ── Vocabulary (mirrors the production service desk) ─────────────────────────
export type TicketStatus = 'New' | 'Open' | 'Pending' | 'On Hold' | 'Closed'
export type TicketPriority = 'Low' | 'Medium' | 'High'
export type TicketChannel = 'Email' | 'Webstore' | 'Inbound Call' | 'Walk In'

export const TICKET_STATUSES: TicketStatus[] = ['New', 'Open', 'Pending', 'On Hold', 'Closed']
export const TICKET_PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High']
export const TICKET_CHANNELS: TicketChannel[] = ['Email', 'Webstore', 'Inbound Call', 'Walk In']
export const TICKET_TYPES = ['Customer Request', 'Bug', 'Technical Support', 'Service Request', 'Pricing', 'Payment', 'Product Enquiry', 'Incident']
export const TICKET_GROUPS = ['General']
export const TICKET_AGENTS = ['Chris Parker', 'Sushant Rana', 'Deepak Vaidya', 'Priya Shah']
export const TICKET_TAGS = ['500 Error', 'VIP', 'Refund', 'Order Issue', 'Loyalty', 'Escalated']

// One support inbox per intake mailbox (the views menu groups by these).
export const SUPPORT_INBOXES = ['New inbox', 'Webstore Support']

export interface TicketMessage {
  id: number
  author: string
  role: 'customer' | 'agent' | 'bot' | 'note'
  /** Verb phrase after the author name: "reported via Email", "replied", … */
  action: string
  to?: string
  time: string
  body: string
}

export interface TicketActivity {
  id: number
  actor: string
  time: string
  text: string
}

export interface CustomerOrder {
  id: string
  store: string
  date: string
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
  inbox: string
  tags: string[]
  unread: boolean
  trashed: boolean
  createdAt: string
  updatedAt: string
  thread: TicketMessage[]
  activities: TicketActivity[]
  orders: CustomerOrder[]
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
  createdFrom: '',
  createdTo: '',
  readStatus: '',
})

/** A custom view is a named, saved filter set (created via "Save as View"). */
export interface SavedTicketView {
  name: string
  filters: TicketFilters
}

export interface NewTicketPayload {
  inbox: string
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
  inbox?: string
  tags?: string[]
  unread?: boolean
  createdAt: string
  body: string
  replies?: { author: string; body: string; note?: boolean }[]
  orders?: CustomerOrder[]
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
    {
      id: messageSeq++,
      author: 'Automated Bot',
      role: 'bot',
      action: 'replied',
      to: seed.email,
      time: new Date(created.getTime() + 60_000).toISOString(),
      body: AUTO_REPLY(seed.customer.split(' ')[0] ?? seed.customer, seed.subject),
    },
  ]
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
    inbox: seed.inbox ?? 'New inbox',
    tags: seed.tags ?? [],
    unread: seed.unread ?? false,
    trashed: false,
    createdAt: created.toISOString(),
    updatedAt: new Date(last).toISOString(),
    thread,
    activities,
    orders: seed.orders ?? [],
  }
}

export const useTicketsStore = defineStore('tickets', () => {
  const tickets = ref<Ticket[]>([
    seedTicket({
      id: 1524, subject: 'Need help cancelling my order', customer: 'Rajan Bhanot', email: 'rjbhanot38@gmail.com',
      status: 'Open', priority: 'Low', channel: 'Email', assignee: 'Chris Parker', createdAt: '2026-08-31T08:25:00Z',
      body: 'need help to cancel order',
      orders: [{ id: 'ORD-10241', store: 'Atlas Outfitters', date: '2026-08-28' }, { id: 'ORD-10198', store: 'Atlas Outfitters', date: '2026-08-11' }],
    }),
    seedTicket({
      id: 1523, subject: 'Where is my refund?', customer: 'Rajan Bhanot', email: 'rjbhanot38@gmail.com',
      status: 'Open', priority: 'Medium', channel: 'Email', type: 'Payment', assignee: 'Chris Parker', tags: ['Refund'],
      createdAt: '2026-08-31T07:02:00Z', body: 'I returned my order ten days ago and still have no refund on my card.',
      replies: [{ author: 'Chris Parker', body: 'Hi Rajan — your refund was issued today and should appear within 3–5 business days.' }],
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
      status: 'New', priority: 'Low', channel: 'Email', unread: true, createdAt: '2026-08-30T10:31:00Z',
      body: 'Hello From Google — verifying our new support address works.',
    }),
    seedTicket({
      id: 1519, subject: 'Give me an offer', customer: 'Abhinav Marla', email: 'abhinav.marla@example.com',
      status: 'New', priority: 'Low', channel: 'Email', type: 'Pricing', createdAt: '2026-08-30T08:15:00Z',
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
      createdAt: '2026-08-28T11:20:00Z', body: 'Request Regarding Refund Of Product — description attached.',
    }),
    seedTicket({
      id: 1516, subject: 'Attachment test for shop account', customer: 'Lorem Anderson', email: 'lorem@example.com',
      status: 'New', priority: 'Low', channel: 'Webstore', createdAt: '2026-08-27T16:41:00Z',
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
      id: 1513, subject: 'POS terminal not syncing loyalty points', customer: 'Emma Johnson', email: 'emma.johnson@example.com', phone: '+1 416 555 0132',
      status: 'On Hold', priority: 'High', channel: 'Walk In', type: 'Incident', assignee: 'Priya Shah', tags: ['Loyalty'],
      createdAt: '2026-06-02T16:20:00Z', body: 'Loyalty points from in-store purchases are not appearing in customer accounts.',
      replies: [{ author: 'Priya Shah', body: 'We\'ve paused the sync while the vendor investigates — I\'ll update you as soon as it resumes.' }],
    }),
    seedTicket({
      id: 1512, subject: 'Exchange for a different size', customer: 'Sofia Thompson', email: 'sofia.thompson@example.com',
      status: 'Closed', priority: 'Low', channel: 'Webstore', type: 'Customer Request', assignee: 'Chris Parker', tags: ['Order Issue'],
      createdAt: '2026-05-21T10:00:00Z', body: 'I\'d like to exchange my jacket for a size M.',
      replies: [{ author: 'Chris Parker', body: 'Exchange label sent — drop the parcel at any post office and the M ships on receipt.' }],
      orders: [{ id: 'ORD-9911', store: 'Atlas Outfitters', date: '2026-05-18' }],
    }),
    seedTicket({
      id: 1511, subject: 'Billing charged twice this month', customer: 'Liam Martinez', email: 'liam.martinez@example.com',
      status: 'Closed', priority: 'Medium', channel: 'Email', type: 'Payment', assignee: 'Deepak Vaidya',
      createdAt: '2026-05-04T08:47:00Z', body: 'My card was charged twice for the same invoice this month.',
      replies: [{ author: 'Deepak Vaidya', body: 'The duplicate charge was voided — apologies for the trouble.' }],
    }),
  ])

  const activeTicketId = ref(0)

  // Saved views created from the filter drawer ("Save as View").
  const customViews = ref<SavedTicketView[]>([
    { name: 'High Value Orders', filters: { ...emptyTicketFilters(), tags: ['VIP'] } },
    { name: 'Walk-in Follow-ups', filters: { ...emptyTicketFilters(), channel: ['Walk In'] } },
    { name: 'Payment Escalations', filters: { ...emptyTicketFilters(), type: ['Payment'], priority: ['High', 'Medium'] } },
  ])

  const visibleTickets = computed(() => tickets.value.filter(t => !t.trashed))
  const trashedTickets = computed(() => tickets.value.filter(t => t.trashed))

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

  function assignMany(ids: number[], agent: string, actor = 'Deepak Vaidya') {
    ids.forEach(id => updateTicket(id, { assignee: agent }, actor))
  }

  function closeMany(ids: number[], actor = 'Deepak Vaidya') {
    ids.forEach(id => updateTicket(id, { status: 'Closed' }, actor))
  }

  /** Soft delete — tickets land in the Trash view and can be restored. */
  function trashMany(ids: number[]) {
    ids.forEach(id => {
      const t = find(id)
      if (t) t.trashed = true
    })
  }

  function restoreMany(ids: number[]) {
    ids.forEach(id => {
      const t = find(id)
      if (t) t.trashed = false
    })
  }

  function updateContact(id: number, contact: { name: string; email: string; phone: string }) {
    const t = find(id)
    if (!t) return
    t.customer = contact.name
    t.customerEmail = contact.email
    t.customerPhone = contact.phone
    touch(t)
  }

  function saveView(name: string, filters: TicketFilters) {
    const existing = customViews.value.find(v => v.name === name)
    if (existing) existing.filters = { ...filters }
    else customViews.value.push({ name, filters: { ...filters } })
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
      inbox: payload.inbox,
      tags: payload.tags,
      unread: false,
      trashed: false,
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
      orders: [],
    }
    tickets.value.unshift(ticket)
    return id
  }

  return {
    tickets,
    visibleTickets,
    trashedTickets,
    activeTicketId,
    customViews,
    find,
    setActive,
    markRead,
    markUnread,
    updateTicket,
    sendMessage,
    assignMany,
    closeMany,
    trashMany,
    restoreMany,
    updateContact,
    saveView,
    createTicket,
  }
})
