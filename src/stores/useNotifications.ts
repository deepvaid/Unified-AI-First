import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Mirrors the real UAT notification centre: plain messages with absolute
 * timestamps and an optional download action (reports/exports). There is
 * deliberately NO severity/classification field — the real system carries
 * none, so the UI renders one generic icon (decided 2026-08-31; the
 * dashboard attention widget keeps its own severity ramp — different data).
 */
export interface AppNotification {
  id: string
  /** The message, e.g. "Custom report allfin generated for 206 campaigns". */
  title: string
  /** Absolute timestamp label, UAT format: "Aug 26, 2026 at 02:40 AM". */
  time: string
  read: boolean
  /** Report/export rows carry a download action. */
  downloadable?: boolean
}

const SEED: AppNotification[] = [
  {
    id: 'n-1',
    title: "Import 10000 contacts to 'HB list 1' started. Emails imported: 9,988",
    time: 'Aug 31, 2026 at 02:54 AM',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Custom report 116000 — Recurring SMS Message generated for 14 campaigns',
    time: 'Aug 26, 2026 at 11:46 AM',
    read: false,
    downloadable: true,
  },
  {
    id: 'n-3',
    title: 'Store 116000-9.uat.maropost.store has been provisioned — welcome aboard',
    time: 'Aug 26, 2026 at 04:19 AM',
    read: true,
  },
  {
    id: 'n-4',
    title: 'Custom report hbt test generated for 22 campaigns',
    time: 'Aug 26, 2026 at 02:40 AM',
    read: false,
    downloadable: true,
  },
  {
    id: 'n-5',
    title: "Export report from Aug 26, 2026 to Aug 26, 2026 for 'dfv__2026' campaigns",
    time: 'Aug 26, 2026 at 02:40 AM',
    read: false,
    downloadable: true,
  },
  {
    id: 'n-6',
    title: 'Custom report allfin generated for 206 campaigns',
    time: 'Aug 26, 2026 at 02:33 AM',
    read: false,
    downloadable: true,
  },
  {
    id: 'n-7',
    title: "Export report from Aug 26, 2026 to Aug 26, 2026 for 'Uday Bhoutik' campaigns",
    time: 'Aug 26, 2026 at 02:32 AM',
    read: false,
    downloadable: true,
  },
  {
    id: 'n-8',
    title: "Export report from Aug 26, 2026 to Aug 26, 2026 for 'transab' campaigns",
    time: 'Aug 26, 2026 at 02:31 AM',
    read: true,
    downloadable: true,
  },
  {
    id: 'n-9',
    title: "Import 2,400 contacts to 'POS walk-ins' completed. Emails imported: 2,377",
    time: 'Aug 25, 2026 at 09:12 PM',
    read: true,
  },
]

export const useNotifications = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([...SEED])

  const unreadCount = computed(() => items.value.filter((n) => !n.read).length)

  function markRead(id: string) {
    const item = items.value.find((n) => n.id === id)
    if (item) item.read = true
  }

  function markAllRead() {
    items.value.forEach((n) => {
      n.read = true
    })
  }

  return { items, unreadCount, markRead, markAllRead }
})
