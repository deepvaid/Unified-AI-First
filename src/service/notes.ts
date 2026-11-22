/**
 * Internal ("sticky") notes on a ticket — who may change one, and which are
 * pinned to the top. Shared by the ticket thread and its tests.
 *
 * Pure: type-only imports, so `node --test` runs it (`npm run test:service`).
 */
import type { TicketMessage } from '../stores/useTickets.ts'

/** Only the agent who wrote a note may edit or delete it; anyone may pin it. */
export function canManageNote(note: Pick<TicketMessage, 'role' | 'author'>, agent: string): boolean {
  return note.role === 'note' && note.author === agent
}

/** The notes pinned to the top of a ticket, oldest first. */
export function pinnedNotes<T extends Pick<TicketMessage, 'role' | 'pinned' | 'time'>>(thread: readonly T[]): T[] {
  return thread.filter(m => m.role === 'note' && m.pinned).sort((a, b) => a.time.localeCompare(b.time))
}
