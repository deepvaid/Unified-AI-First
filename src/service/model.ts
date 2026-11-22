/**
 * Service desk configuration model — inboxes, support emails, reply templates,
 * ticket types, tags and agents — plus the pure rules the settings pages and the
 * inbox share.
 *
 * Plain TypeScript with no Vue/Pinia imports, so `node --test` can run it
 * (`npm run test:service`). Keep imports relative with explicit `.ts`.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** Where a ticket lives. Spam is system-detected; agents never move a ticket into it. */
export type TicketFolder = 'inbox' | 'spam' | 'trash'

export type AssignmentStrategy = 'manual' | 'round-robin'

export type SupportEmailStatus = 'Verified' | 'Pending'

export interface SupportEmail {
  id: string
  inboxId: string
  name: string
  address: string
  status: SupportEmailStatus
  isDefault: boolean
}

/** The automatic reply sent when a new ticket arrives in the inbox. */
export interface InboxAcknowledgement {
  enabled: boolean
  /** Must be a verified support email of the same inbox. */
  fromEmailId: string | null
  templateId: string | null
}

export interface Inbox {
  /** URL-safe and stable; also the `?inbox=` value on the ticket list. */
  id: string
  name: string
  description: string
  crm: string
  assignment: AssignmentStrategy
  /** Time to breach, measured from ticket creation. `null` = no SLA. */
  slaMinutes: number | null
  /** HTML, with `{{TAG}}` placeholders. */
  signature: string
  acknowledgement: InboxAcknowledgement
  createdAt: string
}

/** `reply` = written by agents for agents; `notification` = sent by the system on an event. */
export type ReplyTemplateKind = 'reply' | 'notification'

export interface ReplyTemplate {
  id: string
  name: string
  kind: ReplyTemplateKind
  /** `null` = available in every inbox. */
  inboxId: string | null
  /** HTML, with `{{TAG}}` placeholders. */
  body: string
  attachments: string[]
  updatedAt: string
}

export interface TicketTypeDef {
  id: string
  name: string
  description: string
}

/** The eight swatches of the tag palette (`color.{light,dark}.tag.*` tokens). */
export const TAG_COLORS = ['sky', 'green', 'slate', 'amber', 'violet', 'blue', 'orange', 'red'] as const
export type TagColor = (typeof TAG_COLORS)[number]

export const TAG_COLOR_LABELS: Record<TagColor, string> = {
  sky: 'Sky',
  green: 'Green',
  slate: 'Slate',
  amber: 'Amber',
  violet: 'Violet',
  blue: 'Blue',
  orange: 'Orange',
  red: 'Red',
}

export interface TicketTag {
  id: string
  name: string
  color: TagColor
  createdAt: string
  updatedAt: string
}

export interface ServiceAgent {
  id: string
  name: string
  email: string
  nickname: string
  jobTitle: string
  phone: string
}

// ── Names, ids, duplicates ───────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** A slug for `name` that is not in `taken` (`orders`, `orders-2`, …). Falls back to `item`. */
export function uniqueSlug(name: string, taken: readonly string[]): string {
  const base = slugify(name) || 'item'
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}-${n}`)) n++
  return `${base}-${n}`
}

/** Case- and whitespace-insensitive name clash, ignoring the item being edited. */
export function isDuplicateName(
  items: readonly { id: string; name: string }[],
  name: string,
  exceptId?: string,
): boolean {
  const key = name.trim().toLowerCase()
  if (!key) return false
  return items.some(item => item.id !== exceptId && item.name.trim().toLowerCase() === key)
}

// ── SLA ──────────────────────────────────────────────────────────────────────

/** Agents are warned about an hour before breach, so a breach time under 70 minutes can't be warned about. */
export const SLA_MIN_MINUTES = 70

export type SlaUnit = 'minutes' | 'hours'

export function toMinutes(value: number, unit: SlaUnit): number {
  return unit === 'hours' ? Math.round(value * 60) : Math.round(value)
}

/** The friendliest unit for editing a stored value: whole hours when it divides, otherwise minutes. */
export function fromMinutes(minutes: number): { value: number; unit: SlaUnit } {
  return minutes % 60 === 0 ? { value: minutes / 60, unit: 'hours' } : { value: minutes, unit: 'minutes' }
}

/** '' when valid. `null` (no SLA) is valid. */
export function slaError(minutes: number | null): string {
  if (minutes === null) return ''
  if (!Number.isFinite(minutes) || minutes <= 0) return 'Enter a breach time, or turn the SLA off.'
  if (minutes < SLA_MIN_MINUTES) return `Set at least ${SLA_MIN_MINUTES} minutes — agents are warned about an hour before breach.`
  return ''
}

export function formatSla(minutes: number | null): string {
  if (minutes === null) return 'No SLA'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// ── Support emails & replying ────────────────────────────────────────────────

export function verifiedEmails(emails: readonly SupportEmail[]): SupportEmail[] {
  return emails.filter(e => e.status === 'Verified')
}

/** An inbox can send replies only through a verified support email. */
export function inboxReplyState(emails: readonly SupportEmail[]): {
  canReply: boolean
  verified: number
  pending: number
} {
  const verified = verifiedEmails(emails).length
  return { canReply: verified > 0, verified, pending: emails.length - verified }
}

/**
 * What the inbox list shows in its Status column — `MpStatusChip type="readiness"`
 * vocabulary: no address at all, addresses still waiting on verification, or live.
 */
export function inboxReadiness(emails: readonly SupportEmail[]): 'Needs setup' | 'Pending' | 'Live' {
  if (!emails.length) return 'Needs setup'
  return inboxReplyState(emails).canReply ? 'Live' : 'Pending'
}

/** Removing the default address promotes the next one, so an inbox with addresses always has a default. */
export function withoutEmail(emails: readonly SupportEmail[], emailId: string): SupportEmail[] {
  const removed = emails.find(e => e.id === emailId)
  const rest = emails.filter(e => e.id !== emailId).map(e => ({ ...e }))
  if (removed?.isDefault) {
    const sameInbox = rest.filter(e => e.inboxId === removed.inboxId)
    const next = sameInbox.find(e => e.status === 'Verified') ?? sameInbox[0]
    if (next) next.isDefault = true
  }
  return rest
}

// ── Template tags ────────────────────────────────────────────────────────────

export interface TemplateTag {
  key: string
  label: string
}

/** Grouped as the Insert tag menu shows them. Signatures only get the Agent group. */
export const TEMPLATE_TAG_GROUPS: { title: string; tags: TemplateTag[] }[] = [
  {
    title: 'Ticket',
    tags: [
      { key: 'TICKET_NUMBER', label: 'Ticket number' },
      { key: 'TICKET_SUBJECT', label: 'Ticket subject' },
      { key: 'TICKET_STATUS', label: 'Ticket status' },
    ],
  },
  {
    title: 'Contact',
    tags: [
      { key: 'CONTACT_FIRST_NAME', label: 'First name' },
      { key: 'CONTACT_NAME', label: 'Full name' },
      { key: 'CONTACT_EMAIL', label: 'Email' },
    ],
  },
  {
    title: 'Agent',
    tags: [
      { key: 'AGENT_NAME', label: 'Agent name' },
      { key: 'AGENT_JOB_TITLE', label: 'Agent job title' },
    ],
  },
]

/** Replaces `{{KEY}}` with its value; unknown keys stay visible so a preview never hides a typo. */
export function fillTags(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(/\{\{\s*([A-Z_]+)\s*\}\}/g, (match, key: string) => values[key] ?? match)
}
