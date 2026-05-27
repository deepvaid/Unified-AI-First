import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Ticket {
  id: number
  number: string
  subject: string
  customer: string
  customerEmail: string
  avatar: string
  status: 'Open' | 'In Progress' | 'Awaiting Reply' | 'Resolved' | 'Closed'
  priority: 'Low' | 'Normal' | 'High' | 'Urgent'
  category: string
  assignee: string
  createdAt: string
  updatedAt: string
  tags: string[]
  thread: TicketMessage[]
}

export interface TicketMessage {
  author: string
  avatar: string
  role: 'customer' | 'agent'
  body: string
  time: string
}

export interface NewTicketPayload {
  customer: string
  email: string
  subject: string
  category: string
  priority: Ticket['priority']
  description: string
  assignee: string
}

const customerNames = ['James Anderson', 'Sofia Thompson', 'Liam Martinez', 'Emma Johnson', 'Noah Williams', 'Olivia Brown', 'Ethan Davis', 'Ava Miller', 'Mason Wilson', 'Isabella Moore']
const subjects = [
  'Order #10002 — Where is my shipment?',
  'Refund request for damaged item',
  'Cannot login to my account',
  'Product size exchange request',
  'Billing charged twice this month',
  'Coupon code WELCOME20 not working',
  'Missing item from order #10008',
  'Request to update shipping address',
  'Product quality complaint — Nike Air Max',
  'How do I cancel my subscription?',
  'Wrong item delivered in my order',
  'Loyalty points not showing in account',
  'Request for bulk order discount',
  'Account email change request',
  'Return label not received via email',
  'Patagonia Vest arrived with a defect',
  'Payment failed but amount deducted',
  'Asking about international shipping',
  'Tracking link is not updating',
  'Website checkout keeps crashing',
]
const categories = ['Shipping', 'Returns & Refunds', 'Account', 'Product', 'Billing', 'Technical']
const assignees = ['Sarah Connor', 'Mike Zhang', 'Priya Sharma', 'Tom Brady', 'Unassigned']

let nextId = subjects.length + 1

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function messageTime(offsetMs: number): string {
  return new Date(Date.now() - offsetMs).toLocaleString()
}

function buildSeedThread(params: {
  subject: string
  customer: string
  avatar: string
  assignee: string
  status: Ticket['status']
  orderNumber: number
  latestOffsetMs: number
}): TicketMessage[] {
  const agentAvatar = initials(params.assignee)
  const latest = Math.max(params.latestOffsetMs, 5 * 60_000)
  const resolutionCopy =
    params.status === 'Resolved'
      ? 'I have marked this as resolved after confirming the correction on the order. The customer record has been updated for future reference.'
      : params.status === 'Awaiting Reply'
        ? 'I can finish this as soon as you confirm the preferred shipping address and whether you want a replacement or refund.'
        : 'I checked the order record and queued the next action with our operations team. I will keep this ticket updated as soon as the change posts.'

  return [
    {
      author: params.customer,
      avatar: params.avatar,
      role: 'customer',
      body: `Hi, I need help with ${params.subject.toLowerCase()}. My order number is #${params.orderNumber}.`,
      time: messageTime(latest + 6 * 60 * 60_000),
    },
    {
      author: params.assignee,
      avatar: agentAvatar,
      role: 'agent',
      body: 'Thanks for reaching out. I found your order and I am reviewing the shipment, payment, and account notes now.',
      time: messageTime(latest + 4 * 60 * 60_000),
    },
    {
      author: params.customer,
      avatar: params.avatar,
      role: 'customer',
      body: 'Thanks. I can share any extra details you need. The issue is blocking me from completing the order as expected.',
      time: messageTime(latest + 2 * 60 * 60_000),
    },
    {
      author: params.assignee,
      avatar: agentAvatar,
      role: 'agent',
      body: resolutionCopy,
      time: messageTime(latest),
    },
  ]
}

function buildNewTicketThread(payload: NewTicketPayload, avatar: string, assignee: string): TicketMessage[] {
  const customerMessage = payload.description || `I need help with ${payload.subject}.`
  return [
    {
      author: payload.customer,
      avatar,
      role: 'customer',
      body: customerMessage,
      time: messageTime(42 * 60_000),
    },
    {
      author: assignee,
      avatar: initials(assignee),
      role: 'agent',
      body: 'Thanks for the details. I am checking the customer profile and recent order history before taking action.',
      time: messageTime(28 * 60_000),
    },
    {
      author: payload.customer,
      avatar,
      role: 'customer',
      body: 'That works. Please let me know if you need any more information from my side.',
      time: messageTime(16 * 60_000),
    },
    {
      author: assignee,
      avatar: initials(assignee),
      role: 'agent',
      body: 'I have the ticket queued and will follow up here with the next update.',
      time: messageTime(5 * 60_000),
    },
  ]
}

export const useTicketsStore = defineStore('tickets', () => {
  const tickets = ref<Ticket[]>(subjects.map((subject, i): Ticket => {
    const cust = customerNames[i % customerNames.length]!
    const parts = cust.split(' ')
    const first = parts[0] ?? 'User'
    const last = parts[1] ?? first
    const statuses: Ticket['status'][] = ['Open', 'In Progress', 'Awaiting Reply', 'Resolved']
    const priorities: Ticket['priority'][] = ['Urgent', 'High', 'Normal', 'Low', 'Normal', 'High']
    const status = statuses[i % statuses.length]!
    const assignee = assignees[i % assignees.length]!
    const avatar = `${first[0]}${last[0]}`
    return {
      id: i + 1,
      number: `TKT-${String(10000 + i).padStart(5, '0')}`,
      subject,
      customer: cust,
      customerEmail: `${first.toLowerCase()}@example.com`,
      avatar,
      status,
      priority: priorities[i % priorities.length]!,
      category: categories[i % categories.length]!,
      assignee,
      createdAt: new Date(Date.now() - ((i + 1) * 7200000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 1800000)).toISOString(),
      tags: i % 3 === 0 ? ['VIP'] : i % 5 === 0 ? ['Flagged'] : [],
      thread: buildSeedThread({
        subject,
        customer: cust,
        avatar,
        assignee,
        status,
        orderNumber: 10000 + i,
        latestOffsetMs: i * 1800000,
      }),
    }
  }) as Ticket[])

  const activeTicketId = ref<number>(1)

  function setActive(id: number) {
    activeTicketId.value = id
  }

  function replyToTicket(ticketId: number, body: string) {
    const ticket = tickets.value.find(t => t.id === ticketId)
    if (ticket) {
      ticket.thread.push({
        author: 'Sarah Connor',
        avatar: 'SC',
        role: 'agent',
        body,
        time: new Date().toLocaleString(),
      })
      ticket.status = 'Awaiting Reply'
      ticket.updatedAt = new Date().toISOString()
    }
  }

  function createTicket(payload: NewTicketPayload): Ticket {
    const parts = payload.customer.trim().split(' ')
    const first = parts[0] ?? 'U'
    const last = parts[1] ?? first
    const id = nextId++
    const avatar = `${first[0]?.toUpperCase() ?? '?'}${last[0]?.toUpperCase() ?? '?'}`
    const assignee = payload.assignee === 'Auto-assign' ? assignees[0]! : payload.assignee
    const ticket: Ticket = {
      id,
      number: `TKT-${String(10000 + id - 1).padStart(5, '0')}`,
      subject: payload.subject,
      customer: payload.customer,
      customerEmail: payload.email,
      avatar,
      status: 'Open',
      priority: payload.priority,
      category: payload.category,
      assignee,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      thread: buildNewTicketThread(payload, avatar, assignee),
    }
    tickets.value.unshift(ticket)
    activeTicketId.value = id
    return ticket
  }

  function resolveTicket(ticketId: number) {
    const ticket = tickets.value.find(t => t.id === ticketId)
    if (ticket) {
      ticket.status = 'Resolved'
      ticket.updatedAt = new Date().toISOString()
      ticket.thread.push({
        author: 'Sarah Connor',
        avatar: 'SC',
        role: 'agent',
        body: 'This ticket has been marked as resolved. Please reach out if you need further assistance.',
        time: new Date().toLocaleString(),
      })
    }
  }

  function closeTicket(ticketId: number) {
    const ticket = tickets.value.find(t => t.id === ticketId)
    if (ticket) {
      ticket.status = 'Closed'
      ticket.updatedAt = new Date().toISOString()
    }
  }

  return { tickets, activeTicketId, setActive, replyToTicket, createTicket, resolveTicket, closeTicket }
})
