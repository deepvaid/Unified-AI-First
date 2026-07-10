import { computed, ref } from 'vue'
import { formatAgo } from '@/composables/useRelativeTime'

export interface DaVinciHistoryItem {
  id: string
  title: string
  icon: string
  subtitle: string
  createdAt: number
  addedCount: number
  draftedCount: number
}

export interface GroupedHistory {
  today: DaVinciHistoryItem[]
  yesterday: DaVinciHistoryItem[]
  lastWeek: DaVinciHistoryItem[]
  older: DaVinciHistoryItem[]
}

const LS_HISTORY = 'davinci-history-v1'
const ICON_BY_KEYWORD: Array<{ match: RegExp; icon: string }> = [
  { match: /(email|campaign|open|click)/i, icon: 'mail' },
  { match: /(revenue|order|sale|cart|checkout)/i, icon: 'shopping-cart' },
  { match: /(contact|audience|segment|customer)/i, icon: 'users' },
  { match: /(ticket|support)/i, icon: 'message-square' },
  { match: /(product|inventory|tag)/i, icon: 'tag' },
  { match: /(channel|trend|over time|line|chart)/i, icon: 'line-chart' },
  { match: /(funnel|conversion|drop)/i, icon: 'filter' },
]

function readFromStorage(): DaVinciHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_HISTORY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DaVinciHistoryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeToStorage(next: DaVinciHistoryItem[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_HISTORY, JSON.stringify(next))
  } catch {
    /* noop */
  }
}

const items = ref<DaVinciHistoryItem[]>(readFromStorage())

function persist() {
  writeToStorage(items.value)
}

function inferIcon(title: string): string {
  for (const entry of ICON_BY_KEYWORD) {
    if (entry.match.test(title)) return entry.icon
  }
  return 'sparkles'
}

function makeId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function buildSubtitle(item: Pick<DaVinciHistoryItem, 'draftedCount' | 'addedCount'>): string {
  if (item.addedCount > 0) {
    return item.addedCount === 1 ? '1 widget added' : `${item.addedCount} widgets added`
  }
  if (item.draftedCount === 1) return '1 widget drafted'
  return `${item.draftedCount} widgets drafted`
}

const sortedItems = computed(() => [...items.value].sort((a, b) => b.createdAt - a.createdAt))

const groupedItems = computed<GroupedHistory>(() => {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const sevenDaysAgo = new Date(startOfToday)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const groups: GroupedHistory = { today: [], yesterday: [], lastWeek: [], older: [] }
  for (const item of sortedItems.value) {
    if (item.createdAt >= startOfToday.getTime()) {
      groups.today.push(item)
    } else if (item.createdAt >= startOfYesterday.getTime()) {
      groups.yesterday.push(item)
    } else if (item.createdAt >= sevenDaysAgo.getTime()) {
      groups.lastWeek.push(item)
    } else {
      groups.older.push(item)
    }
  }
  return groups
})

function addItem(payload: {
  title: string
  draftedCount: number
  addedCount?: number
  icon?: string
}): DaVinciHistoryItem {
  const item: DaVinciHistoryItem = {
    id: makeId(),
    title: payload.title.trim() || 'Untitled prompt',
    icon: payload.icon ?? inferIcon(payload.title),
    createdAt: Date.now(),
    draftedCount: payload.draftedCount,
    addedCount: payload.addedCount ?? 0,
    subtitle: '',
  }
  item.subtitle = buildSubtitle(item)
  items.value = [item, ...items.value]
  persist()
  return item
}

function incrementAdded(id: string) {
  const idx = items.value.findIndex((it) => it.id === id)
  if (idx === -1) return
  const existing = items.value[idx]
  if (!existing) return
  const updated: DaVinciHistoryItem = {
    ...existing,
    addedCount: existing.addedCount + 1,
  }
  updated.subtitle = buildSubtitle(updated)
  const next = [...items.value]
  next[idx] = updated
  items.value = next
  persist()
}

function removeItem(id: string) {
  items.value = items.value.filter((it) => it.id !== id)
  persist()
}

function clearAll() {
  items.value = []
  persist()
}

export function useDaVinciHistory() {
  return {
    items: sortedItems,
    groupedItems,
    formatAgo,
    addItem,
    incrementAdded,
    removeItem,
    clearAll,
  }
}
