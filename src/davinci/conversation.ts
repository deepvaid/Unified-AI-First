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
 * The recent turns Gemini gets as context: everything before the turn being answered (the server
 * appends it), keyed by id. The old `messages.slice(0, -1)` assumed the current turn was last — for a
 * queued follow-up or a pause notice that dropped the previous ANSWER and sent the question twice.
 */
export function geminiHistory(messages: HistoryMessage[], excludeId: string | null, limit = 6): HistoryTurn[] {
  const at = excludeId === null ? -1 : messages.findIndex((message) => message.id === excludeId)
  return messages
    // A user turn AFTER the one being answered was queued behind it (replies land in order, so it has no
    // answer yet): the model must not see "And tickets?" before the answer to "Show revenue". Assistant
    // turns after it answer earlier questions and stay.
    .filter((message, index) => message.id !== excludeId && !(at !== -1 && index > at && message.role === 'user'))
    .filter((message) => message.text.trim().length > 0)
    .slice(-limit)
    .map((message) => ({ role: message.role, text: message.text }))
}
