import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** Mirrors DashboardAttentionSeverity (stores/dashboards/types.ts) — one severity vocabulary. */
export type NotificationSeverity = 'critical' | 'warning' | 'info'

export interface AppNotification {
  id: string
  severity: NotificationSeverity
  /** Lucide icon name — domain-specific (shopping-cart, send, ticket…). */
  icon: string
  /** The message, e.g. "Payment failed on order #10012". */
  title: string
  /** Domain detail line, e.g. "Sales Orders". */
  context: string
  /** Relative time label — mock data, no live clock. */
  time: string
  read: boolean
  /** Optional route target the notification links to. */
  to?: string
}

const SEED: AppNotification[] = [
  {
    id: 'n-1',
    severity: 'critical',
    icon: 'credit-card',
    title: 'Payment failed on order #10012',
    context: 'Sales Orders',
    time: '12m ago',
    read: false,
    to: '/commerce/2000290/orders',
  },
  {
    id: 'n-2',
    severity: 'warning',
    icon: 'package',
    title: 'Trail Shell Jacket is low on stock — 4 left',
    context: 'Inventory',
    time: '38m ago',
    read: false,
  },
  {
    id: 'n-3',
    severity: 'info',
    icon: 'send',
    title: 'Campaign "Spring Refresh" finished sending',
    context: 'Email Campaigns',
    time: '1h ago',
    read: false,
  },
  {
    id: 'n-4',
    severity: 'warning',
    icon: 'ticket',
    title: 'Urgent ticket assigned to you: "Order never arrived"',
    context: 'Service',
    time: '2h ago',
    read: false,
  },
  {
    id: 'n-5',
    severity: 'critical',
    icon: 'upload',
    title: 'Contact import failed — 214 rows rejected',
    context: 'Imports',
    time: '3h ago',
    read: true,
  },
  {
    id: 'n-6',
    severity: 'info',
    icon: 'users',
    title: 'Segment "Lapsed VIPs" finished refreshing',
    context: 'Segments',
    time: '5h ago',
    read: true,
  },
  {
    id: 'n-7',
    severity: 'warning',
    icon: 'badge-percent',
    title: 'Coupon SPRING25 is at 92% of its redemption cap',
    context: 'Coupons',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 'n-8',
    severity: 'info',
    icon: 'server',
    title: 'Scheduled maintenance on Sep 6, 02:00–03:00 UTC',
    context: 'System',
    time: '2d ago',
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
