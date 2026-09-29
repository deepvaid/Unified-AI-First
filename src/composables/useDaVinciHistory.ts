import { computed, ref } from 'vue'
import { formatAgo } from '@/composables/useRelativeTime'
import {
  HISTORY_KEY,
  HISTORY_LIMITS,
  LEGACY_HISTORY_KEYS,
  fitToBudget,
  groupConversations,
  parseHistory,
  persistList,
  subtitleFor,
  upsert,
  type GroupedHistory,
  type HistoryConversation,
} from '@/davinci/history'

// The stored list of Da Vinci conversations. What a record holds, its caps and how a stored
// list is validated live in src/davinci/history.ts (pure, tested); this is the reactive,
// localStorage-backed singleton around it. The copilot store records the live thread here.

export type { GroupedHistory, HistoryConversation }

/** localStorage, or null where the browser won't hand it over (blocked storage throws on access). */
function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function load(): HistoryConversation[] {
  const store = storage()
  if (!store) return []
  try {
    for (const key of LEGACY_HISTORY_KEYS) store.removeItem(key)
    return parseHistory(store.getItem(HISTORY_KEY))
  } catch {
    return []
  }
}

const conversations = ref<HistoryConversation[]>(load())

// Another tab recorded, deleted or cleared: adopt its list, so this tab's next write builds on it instead
// of overwriting it with a copy that was current when the page opened.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== HISTORY_KEY) return
    conversations.value = parseHistory(event.key === null ? null : event.newValue)
  })
}

/** Writes the list within its budget (see `persistList`) and keeps the in-memory list equal to what was kept. */
function persist(keepId?: string) {
  const store = storage()
  conversations.value = store ? persistList(store, conversations.value, keepId) : fitToBudget(conversations.value, HISTORY_LIMITS.bytes, keepId)
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
