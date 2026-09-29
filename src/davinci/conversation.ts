// Small pure helpers shared by every Da Vinci conversation surface (the drawer, the
// full-width panel and the full-page experience). Unit-tested in tests/davinci/conversation.test.ts.

export interface HistoryMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export interface HistoryTurn {
  role: 'user' | 'assistant'
  text: string
}

let counter = 0

/** A short unique id for a message or conversation ("a_lx2k9_4f2z"). */
export function makeId(prefix = 'm'): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

/**
 * The recent turns Gemini gets as context: everything EXCEPT the turn being answered (the server
 * appends it), keyed by id. The old `messages.slice(0, -1)` assumed the current turn was last — for a
 * queued follow-up or a pause notice that dropped the previous ANSWER and sent the question twice.
 */
export function geminiHistory(messages: HistoryMessage[], excludeId: string | null, limit = 6): HistoryTurn[] {
  return messages
    .filter((message) => message.id !== excludeId && message.text.trim().length > 0)
    .slice(-limit)
    .map((message) => ({ role: message.role, text: message.text }))
}
