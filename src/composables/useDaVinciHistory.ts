import { computed, ref } from 'vue'
import { formatAgo } from '@/composables/useRelativeTime'
import {
  HISTORY_KEY,
  HISTORY_LIMITS,
  LEGACY_HISTORY_KEYS,
  dropOldest,
  fitToBudget,
  groupConversations,
  parseHistory,
  subtitleFor,
  upsert,
  type GroupedHistory,
  type HistoryConversation,
} from '@/davinci/history'

// The stored list of Da Vinci conversations. What a record holds, its caps and how a stored
// list is validated live in src/davinci/history.ts (pure, tested); this is the reactive,
// localStorage-backed singleton around it. The copilot store records the live thread here.

export type { GroupedHistory, HistoryConversation }

function load(): HistoryConversation[] {
  if (typeof window === 'undefined') return []
  try {
    for (const key of LEGACY_HISTORY_KEYS) window.localStorage.removeItem(key)
    return parseHistory(window.localStorage.getItem(HISTORY_KEY))
  } catch {
    return []
  }
}

const conversations = ref<HistoryConversation[]>(load())

/**
 * Writes the list within its size budget. If the browser still refuses (quota shared with the rest of
 * the app), the oldest conversation goes and the write is retried — the list then shows exactly what a
 * reload would bring back.
 */
function persist(keepId?: string) {
  let next = fitToBudget(conversations.value, HISTORY_LIMITS.bytes, keepId)
  if (typeof window !== 'undefined') {
    for (;;) {
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
        break
      } catch {
        const dropped = dropOldest(next, keepId)
        if (!dropped) break
        next = dropped
      }
    }
  }
  conversations.value = next
}

/** Newest activity first — the order the list, the search and the groups all read. */
const items = computed(() => [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt))
const groupedItems = computed<GroupedHistory>(() => groupConversations(items.value))

function save(record: HistoryConversation) {
  conversations.value = upsert(conversations.value, record)
  persist(record.id)
}

function get(id: string): HistoryConversation | undefined {
  return conversations.value.find((conversation) => conversation.id === id)
}

function remove(id: string) {
  conversations.value = conversations.value.filter((conversation) => conversation.id !== id)
  persist()
}

function clearAll() {
  conversations.value = []
  persist()
}

export function useDaVinciHistory() {
  return { items, groupedItems, formatAgo, subtitleFor, save, get, remove, clearAll }
}
