/**
 * Dispute rules — how a deadline reads and what evidence is still missing.
 * Deadlines are always written out in words, so urgency never rests on colour.
 *
 * Pure module — relative `.ts` imports only (see money.ts).
 */
import { DISPUTE_STATUS_LABELS } from './model.ts'
import type { Dispute, DisputeStatus, EvidenceItem } from './model.ts'

const DAY_MS = 86_400_000

function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Calendar days from today to the deadline's date: 0 is today, 1 tomorrow, negative once the date has gone. */
export function daysUntil(iso: string, now: number): number {
  return Math.round((startOfDay(Date.parse(iso)) - startOfDay(now)) / DAY_MS)
}

/** "Due in 9 days", "Due tomorrow", "Due today", "Overdue by 2 days". */
export function deadlineLabel(iso: string, now: number): string {
  const days = daysUntil(iso, now)
  if (Date.parse(iso) <= now) return days < 0 ? `Overdue by ${-days} ${days === -1 ? 'day' : 'days'}` : 'Deadline passed today'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

export function missingEvidence(dispute: Dispute): EvidenceItem[] {
  return dispute.evidence.filter((e) => e.required && !e.document)
}

export type DisputeTab = 'all' | DisputeStatus

export const DISPUTE_TABS: Array<{ key: DisputeTab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'needs_response', label: DISPUTE_STATUS_LABELS.needs_response },
  { key: 'under_review', label: DISPUTE_STATUS_LABELS.under_review },
  { key: 'won', label: DISPUTE_STATUS_LABELS.won },
  { key: 'lost', label: DISPUTE_STATUS_LABELS.lost },
  { key: 'accepted', label: DISPUTE_STATUS_LABELS.accepted },
]
