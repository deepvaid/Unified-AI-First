// Da Vinci conversation history: what gets recorded, how much of it, and what a stored
// list has to look like to be trusted.
//
// The history used to hold a title per *widget draft* — no transcript, so choosing a row
// could only close the panel, only conversations that drafted a widget appeared at all, and
// a row's id never matched the live conversation. A record is now the conversation itself
// (capped), keyed by the copilot `conversationId`. Pure — see tests/davinci/history.test.ts.

import type { ChatComponent, ChatMessage, DraftSetProps } from '../stores/useCopilot.ts'

export interface HistoryConversation {
  /** The copilot `conversationId` — the live thread and its record are the same id. */
  id: string
  /** The first thing the merchant asked; fixed once recorded. */
  title: string
  icon: string
  createdAt: number
  /** Last activity — what the list sorts and groups by. */
  updatedAt: number
  draftedCount: number
  addedCount: number
  questions: number
  /** The transcript, newest `HISTORY_LIMITS.messages` only. */
  messages: ChatMessage[]
}

export interface GroupedHistory {
  today: HistoryConversation[]
  yesterday: HistoryConversation[]
  lastWeek: HistoryConversation[]
  older: HistoryConversation[]
}

export interface HistoryLimits {
  /** Messages kept per conversation. */
  messages: number
  /** Conversations kept. */
  conversations: number
  /** Serialized size (characters) of the whole list. */
  bytes: number
}

export const HISTORY_LIMITS: HistoryLimits = { messages: 40, conversations: 30, bytes: 600_000 }

export const HISTORY_KEY = 'davinci-history-v2'

/** Keys of earlier layouts — title-only history and a snapshot nothing ever wrote. Removed on load. */
export const LEGACY_HISTORY_KEYS = ['davinci-history-v1', 'davinci-active-conversation-v1']

const TITLE_MAX = 60

/** One pasted essay must not evict every other conversation: recorded message text is capped. */
export const MESSAGE_TEXT_MAX = 8_000

const ICON_BY_KEYWORD: Array<{ match: RegExp; icon: string }> = [
  { match: /(email|campaign|open|click)/i, icon: 'mail' },
  { match: /(revenue|order|sale|cart|checkout)/i, icon: 'shopping-cart' },
  { match: /(contact|audience|segment|customer)/i, icon: 'users' },
  { match: /(ticket|support)/i, icon: 'message-square' },
  { match: /(product|inventory|tag)/i, icon: 'tag' },
  { match: /(channel|trend|over time|line|chart)/i, icon: 'line-chart' },
  { match: /(funnel|conversion|drop)/i, icon: 'filter' },
]

const COMPONENT_TYPES = new Set(['widgetDraftSet', 'intentCards', 'campaignOnboarding', 'setupOnboarding'])

/** Guided-flow cards are live controls over a session that has since moved on — the transcript keeps their words, not their buttons. */
const SESSION_BOUND = new Set(['campaignOnboarding', 'setupOnboarding'])

export function inferIcon(title: string): string {
  for (const entry of ICON_BY_KEYWORD) {
    if (entry.match.test(title)) return entry.icon
  }
  return 'sparkles'
}

/** The first user message, on one line and short enough for a row. */
export function titleFrom(messages: ChatMessage[]): string {
  const first = messages.find((message) => message.role === 'user')?.text.replace(/\s+/g, ' ').trim()
  if (!first) return 'New conversation'
  return first.length > TITLE_MAX ? `${first.slice(0, TITLE_MAX - 1).trimEnd()}…` : first
}

/**
 * What a restored message keeps. Guided-flow cards go (see SESSION_BOUND), and so do quick-reply chips:
 * they are "next step" suggestions for the live moment ("Use VIP…", "Open in journey wizard"), tied to
 * a wizard or a clarification that is gone by the time the conversation is reopened — clicked, they
 * would be sent as an ordinary prompt and do nothing they promised.
 */
function persistable(message: ChatMessage): ChatMessage {
  const text = message.text.length > MESSAGE_TEXT_MAX ? `${message.text.slice(0, MESSAGE_TEXT_MAX - 1).trimEnd()}…` : message.text
  const kept: ChatComponent[] = []
  for (const component of message.componentData ?? []) {
    if (SESSION_BOUND.has(component.type)) continue
    if (component.type === 'intentCards') {
      const { quickReplies: _chips, ...props } = component.props as { cards?: unknown[]; quickReplies?: unknown }
      if (props.cards?.length) kept.push({ ...component, props: props as never })
      continue
    }
    kept.push(component)
  }
  const { componentData: _components, ...rest } = message
  return kept.length ? { ...rest, text, componentData: kept } : { ...rest, text }
}

/** What a conversation did: widgets drafted, widgets added (drafts added + charts saved), questions asked. */
export function summarize(messages: ChatMessage[]): { drafted: number; added: number; questions: number } {
  let drafted = 0
  let added = 0
  let questions = 0
  for (const message of messages) {
    if (message.role === 'user') questions += 1
    for (const component of message.componentData ?? []) {
      if (component.type === 'widgetDraftSet') {
        const set = component.props as DraftSetProps
        drafted += set.drafts.length
        added += (set.added ?? []).filter(Boolean).length
      } else if (component.type === 'intentCards') {
        const cards = (component.props as { cards?: Array<{ type: string; props: { savedTo?: unknown } }> }).cards ?? []
        added += cards.filter((card) => card.type === 'chart' && card.props.savedTo).length
      }
    }
  }
  return { drafted, added, questions }
}

/**
 * The record for the live thread, or null while the merchant has said nothing. `previous` keeps the
 * title, icon and start time stable, and lets an unchanged transcript (a conversation that was only
 * opened) come back untouched — so viewing an old conversation doesn't move it to the top of the list.
 */
export function buildRecord(
  id: string,
  messages: ChatMessage[],
  previous?: HistoryConversation,
  now: number = Date.now(),
  limits: HistoryLimits = HISTORY_LIMITS,
): HistoryConversation | null {
  if (!messages.some((message) => message.role === 'user')) return null
  // A snapshot, not a view: the live thread keeps mutating its messages (a draft is added, a chart saved),
  // and a record sharing those objects would never look changed — or keep changing behind the list's back.
  const kept: ChatMessage[] = JSON.parse(JSON.stringify(messages.map(persistable).slice(-limits.messages)))
  if (previous && JSON.stringify(previous.messages) === JSON.stringify(kept)) return previous
  const stats = summarize(messages)
  const title = previous?.title ?? titleFrom(messages)
  return {
    id,
    title,
    icon: previous?.icon ?? inferIcon(title),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    // A restored conversation holds only its capped tail — the counts never go backwards.
    draftedCount: Math.max(previous?.draftedCount ?? 0, stats.drafted),
    addedCount: Math.max(previous?.addedCount ?? 0, stats.added),
    questions: Math.max(previous?.questions ?? 0, stats.questions),
    messages: kept,
  }
}

const noun = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

export function subtitleFor(conversation: HistoryConversation): string {
  if (conversation.addedCount > 0) return `${noun(conversation.addedCount, 'widget', 'widgets')} added`
  if (conversation.draftedCount > 0) return `${noun(conversation.draftedCount, 'widget', 'widgets')} drafted`
  return noun(conversation.questions, 'question', 'questions')
}

/** Puts `record` in its place — newest activity first, at most `limits.conversations` kept. */
export function upsert(
  list: HistoryConversation[],
  record: HistoryConversation,
  limits: HistoryLimits = HISTORY_LIMITS,
): HistoryConversation[] {
  return [record, ...list.filter((conversation) => conversation.id !== record.id)]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limits.conversations)
}

const sizeOf = (list: HistoryConversation[]) => JSON.stringify(list).length

/** `list` without its oldest conversation that isn't `keepId`; null when only `keepId` is left. */
export function dropOldest(list: HistoryConversation[], keepId?: string): HistoryConversation[] | null {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i]?.id !== keepId) return list.filter((_, index) => index !== i)
  }
  return null
}

/**
 * Drops the oldest conversations until the list fits `bytes`. `keepId` (the live thread) goes last;
 * if it alone is still too big its oldest messages go, and a thread that cannot fit at all is dropped.
 */
export function fitToBudget(list: HistoryConversation[], bytes: number, keepId?: string): HistoryConversation[] {
  let next = list
  while (next.length && sizeOf(next) > bytes) {
    const dropped = dropOldest(next, keepId)
    if (dropped) {
      next = dropped
      continue
    }
    const only = next[0]!
    if (only.messages.length <= 2) return []
    next = [{ ...only, messages: only.messages.slice(Math.ceil(only.messages.length / 2)) }]
  }
  return next
}

export interface StorageLike {
  setItem(key: string, value: string): void
}

/** True for the errors browsers throw when storage is FULL — and only those. */
export function isQuotaError(error: unknown): boolean {
  const e = error as { name?: string; code?: number } | null
  return !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014)
}

/**
 * Writes `list` within its size budget and returns what is held afterwards. Only a full storage drops the
 * oldest conversation (never `keepId`) and retries — the quota is shared with the rest of the app. Any
 * other failure (storage blocked, private mode) is not a reason to forget anything: the list stays in
 * memory and the write is given up quietly.
 */
export function persistList(
  storage: StorageLike | null,
  list: HistoryConversation[],
  keepId?: string,
  bytes: number = HISTORY_LIMITS.bytes,
): HistoryConversation[] {
  let next = fitToBudget(list, bytes, keepId)
  if (!storage) return next
  for (;;) {
    try {
      storage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    } catch (error) {
      if (!isQuotaError(error)) return next
      const dropped = dropOldest(next, keepId)
      if (!dropped) return next
      next = dropped
    }
  }
}

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<ChatMessage>
  return (
    typeof message.id === 'string'
    && (message.role === 'user' || message.role === 'assistant')
    && typeof message.text === 'string'
    && (message.componentData === undefined
      || (Array.isArray(message.componentData)
        && message.componentData.every((component: ChatComponent) => COMPONENT_TYPES.has(component?.type))))
  )
}

function isConversation(value: unknown): value is HistoryConversation {
  if (!value || typeof value !== 'object') return false
  const c = value as Partial<HistoryConversation>
  return (
    typeof c.id === 'string'
    && typeof c.title === 'string'
    && typeof c.updatedAt === 'number'
    && typeof c.createdAt === 'number'
    && Array.isArray(c.messages)
    && c.messages.every(isMessage)
  )
}

/** A stored list, newest first — anything that isn't a well-formed conversation is dropped, never thrown on. */
export function parseHistory(raw: string | null): HistoryConversation[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value
      .filter(isConversation)
      .map((c) => ({ ...c, icon: c.icon ?? 'sparkles', draftedCount: c.draftedCount ?? 0, addedCount: c.addedCount ?? 0, questions: c.questions ?? 0 }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

/** Today / Yesterday / Last 7 days / Older, by local calendar day of last activity. */
export function groupConversations(list: HistoryConversation[], now: Date = new Date()): GroupedHistory {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const sevenDaysAgo = new Date(startOfToday)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const groups: GroupedHistory = { today: [], yesterday: [], lastWeek: [], older: [] }
  for (const conversation of list) {
    if (conversation.updatedAt >= startOfToday.getTime()) groups.today.push(conversation)
    else if (conversation.updatedAt >= startOfYesterday.getTime()) groups.yesterday.push(conversation)
    else if (conversation.updatedAt >= sevenDaysAgo.getTime()) groups.lastWeek.push(conversation)
    else groups.older.push(conversation)
  }
  return groups
}
