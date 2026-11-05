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

/** The Agent filter's "nobody yet" option — the triage queue. */
export const UNASSIGNED = 'Unassigned'

export const CREATED_WITHIN = [
  { value: 'today', label: 'Today', days: 1 },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
] as const

/** Local midnight `days - 1` days before `now` — "last 7 days" includes today. */
function windowStart(within: TicketFilters['createdWithin'], now: Date): Date | null {
  const preset = CREATED_WITHIN.find(p => p.value === within)
  if (!preset) return null
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (preset.days - 1))
}

/**
 * The Filters drawer / a saved view's criteria. Status is optional so the list
 * can count each status tab from the same base it slices; `now` anchors the
 * rolling created-within windows (injected by tests).
 */
export function matchesFilters(
  ticket: Ticket,
  f: TicketFilters,
  options: { status?: boolean; now?: Date } = {},
): boolean {
  if ((options.status ?? true) && f.status.length && !f.status.includes(ticket.status)) return false
  if (f.priority.length && !f.priority.includes(ticket.priority)) return false
  if (f.channel.length && !(ticket.channel && f.channel.includes(ticket.channel))) return false
  if (f.type.length && !f.type.includes(ticket.type)) return false
  if (f.group.length && !f.group.includes(ticket.group)) return false
  if (f.agent && (f.agent === UNASSIGNED ? !!ticket.assignee : ticket.assignee !== f.agent)) return false
  if (f.contact && `${ticket.customer} - ${ticket.customerEmail}` !== f.contact) return false
  if (f.tags.length && !f.tags.some(tag => ticket.tags.includes(tag))) return false
  const since = windowStart(f.createdWithin, options.now ?? new Date())
  if (since && new Date(ticket.createdAt) < since) return false
  if (f.createdFrom && ticket.createdAt < f.createdFrom) return false
  if (f.createdTo && ticket.createdAt.slice(0, 10) > f.createdTo) return false
  if (f.readStatus && (f.readStatus === 'Unread') !== ticket.unread) return false
  return true
}

// ── Applied filters as chips ────────────────────────────────────────────────
// What the list shows above itself once filters are applied: one removable
// chip per field, never per value, so five tags are one chip, not five.

export type FilterChipKey = 'priority' | 'channel' | 'type' | 'group' | 'agent' | 'contact' | 'tags' | 'created' | 'readStatus'
export interface FilterChip { key: FilterChipKey; label: string }

const shortDay = (dayKey: string) => {
  const date = new Date(`${dayKey}T00:00:00`)
  return Number.isNaN(date.getTime()) ? dayKey : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
/** "Low, High" — or "Refund +2" once a list gets long. */
const listLabel = (values: string[]) => (values.length > 2 ? `${values[0]} +${values.length - 1}` : values.join(', '))

export function createdLabel(f: Pick<TicketFilters, 'createdWithin' | 'createdFrom' | 'createdTo'>): string {
  const preset = CREATED_WITHIN.find(p => p.value === f.createdWithin)
  if (preset) return preset.label
  if (f.createdFrom && f.createdTo) return `${shortDay(f.createdFrom)} – ${shortDay(f.createdTo)}`
  if (f.createdFrom) return `from ${shortDay(f.createdFrom)}`
  if (f.createdTo) return `until ${shortDay(f.createdTo)}`
  return ''
}

/** Status is left out: the tabs above the list already show it. */
export function filterChips(f: TicketFilters): FilterChip[] {
  const chips: FilterChip[] = []
  if (f.priority.length) chips.push({ key: 'priority', label: `Priority: ${listLabel(f.priority)}` })
  if (f.channel.length) chips.push({ key: 'channel', label: `Channel: ${listLabel(f.channel)}` })
  if (f.type.length) chips.push({ key: 'type', label: `Type: ${listLabel(f.type)}` })
  if (f.tags.length) chips.push({ key: 'tags', label: `Tags: ${listLabel(f.tags)}` })
  if (f.agent) chips.push({ key: 'agent', label: f.agent === UNASSIGNED ? UNASSIGNED : `Agent: ${f.agent}` })
  if (f.contact) chips.push({ key: 'contact', label: `Contact: ${f.contact.split(' - ')[0]}` })
  if (f.group.length) chips.push({ key: 'group', label: `Group: ${listLabel(f.group)}` })
  const created = createdLabel(f)
  if (created) chips.push({ key: 'created', label: `Created: ${created}` })
  if (f.readStatus) chips.push({ key: 'readStatus', label: `${f.readStatus} only` })
  return chips
}

/** The filters with one chip's field reset. */
export function withoutChip(f: TicketFilters, key: FilterChipKey): TicketFilters {
  const next: TicketFilters = { ...f, tags: [...f.tags] }
  switch (key) {
    case 'agent': case 'contact': case 'readStatus': next[key] = ''; break
    case 'created': next.createdWithin = ''; next.createdFrom = ''; next.createdTo = ''; break
    default: next[key] = []
  }
  return next
}

/** Same criteria, ignoring value order and — by default — status, which the tabs own. */
export function sameFilters(a: TicketFilters, b: TicketFilters, options: { status?: boolean } = {}): boolean {
  const keys = (Object.keys(a) as (keyof TicketFilters)[]).filter(k => k !== 'status' || options.status)
  const norm = (v: unknown) => (Array.isArray(v) ? [...v].sort().join('\u0000') : String(v ?? ''))
  return keys.every(k => norm(a[k]) === norm(b[k]))
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
