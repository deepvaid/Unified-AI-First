/**
 * Which tickets a list shows — one rule for the ticket list and for the counts in
 * the inbox & view switcher, so a count never disagrees with the list it opens.
 *
 * Pure: type-only imports, so `node --test` runs it (`npm run test:service`).
 */
import type { Ticket, TicketFilters } from '../stores/useTickets.ts'

/** Every inbox gets these; custom (saved) views follow them. */
export const BUILT_IN_VIEWS = ['All Tickets', 'My Tickets', 'High Priority Tickets'] as const
export type BuiltInView = (typeof BUILT_IN_VIEWS)[number]

export const isBuiltInView = (name: string): name is BuiltInView =>
  (BUILT_IN_VIEWS as readonly string[]).includes(name)

/** `'all'` = every inbox. */
export function inInbox(ticket: Pick<Ticket, 'inboxId'>, inboxId: string): boolean {
  return inboxId === 'all' || ticket.inboxId === inboxId
}

export function matchesBuiltInView(
  ticket: Pick<Ticket, 'assignee' | 'priority'>,
  view: BuiltInView,
  currentAgent: string,
): boolean {
  if (view === 'My Tickets') return ticket.assignee === currentAgent
  if (view === 'High Priority Tickets') return ticket.priority === 'High'
  return true
}

/**
 * The Filters drawer / a saved view's criteria. Status is optional so the list
 * can count each status tab from the same base it slices.
 */
export function matchesFilters(ticket: Ticket, f: TicketFilters, options: { status?: boolean } = {}): boolean {
  if ((options.status ?? true) && f.status.length && !f.status.includes(ticket.status)) return false
  if (f.priority.length && !f.priority.includes(ticket.priority)) return false
  if (f.channel.length && !(ticket.channel && f.channel.includes(ticket.channel))) return false
  if (f.type.length && !f.type.includes(ticket.type)) return false
  if (f.group.length && !f.group.includes(ticket.group)) return false
  if (f.agent && ticket.assignee !== f.agent) return false
  if (f.contact && `${ticket.customer} - ${ticket.customerEmail}` !== f.contact) return false
  if (f.tags.length && !f.tags.some(tag => ticket.tags.includes(tag))) return false
  if (f.createdFrom && ticket.createdAt < f.createdFrom) return false
  if (f.createdTo && ticket.createdAt.slice(0, 10) > f.createdTo) return false
  if (f.readStatus && (f.readStatus === 'Unread') !== ticket.unread) return false
  return true
}

/** Number, subject, customer, email and every message body. */
export function matchesSearch(ticket: Ticket, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [ticket.number, ticket.subject, ticket.customer, ticket.customerEmail, ...ticket.thread.map(m => m.body)]
    .some(field => field.toLowerCase().includes(q))
}

/** Work still to do — what the switcher counts. */
export const isOpen = (ticket: Pick<Ticket, 'status'>) => ticket.status !== 'Closed'
