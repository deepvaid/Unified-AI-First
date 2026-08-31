/**
 * Shared realistic fixtures for composed story examples.
 *
 * Phase 4 asked every complex component for "one realistic composed example, so
 * engineers see it in context". Roughly forty story files need plausible rows;
 * inventing them per file produces forty different-looking products. These are
 * the same merchant, the same orders and the same campaigns everywhere.
 *
 * Same rationale as `storyTemplate.ts` — one shared helper instead of the same
 * block pasted into every file.
 *
 * Names and figures are invented for a fictional merchant (Northwind Supply Co.)
 * and are not real customer data.
 */

export interface OrderRow {
  id: string
  order: string
  date: string
  customer: string
  items: number
  total: string
  fulfillment: string
  status: string
  payment: string
}

/** Sales Orders — the canonical data-table example (Commerce → Sales Orders). */
export const ORDERS: OrderRow[] = [
  { id: 'o-10000', order: '#10000', date: 'Aug 28, 2026', customer: 'James Anderson', items: 1, total: '$1,180.00', fulfillment: 'Not Ready', status: 'Processing', payment: 'Paid' },
  { id: 'o-10001', order: '#10001', date: 'Aug 27, 2026', customer: 'Sofia Thompson', items: 4, total: '$1,040.00', fulfillment: 'Ready For Fulfillment', status: 'Completed', payment: 'Paid' },
  { id: 'o-10002', order: '#10002', date: 'Aug 26, 2026', customer: 'Liam Martinez', items: 3, total: '$1,120.00', fulfillment: 'Shipped', status: 'Cancelled', payment: 'Refunded' },
  { id: 'o-10003', order: '#10003', date: 'Aug 25, 2026', customer: 'Emma Johnson', items: 2, total: '$890.00', fulfillment: 'Return Requested', status: 'Refunded', payment: 'Refunded' },
  { id: 'o-10004', order: '#10004', date: 'Aug 24, 2026', customer: 'Noah Williams', items: 1, total: '$760.00', fulfillment: 'Cancelled', status: 'On Hold', payment: 'Unpaid' },
  { id: 'o-10005', order: '#10005', date: 'Aug 23, 2026', customer: 'Olivia Brown', items: 4, total: '$820.00', fulfillment: 'Unapproved', status: 'Processing', payment: 'Pending' },
  { id: 'o-10006', order: '#10006', date: 'Aug 22, 2026', customer: 'Ethan Davis', items: 3, total: '$940.00', fulfillment: 'Not Ready', status: 'Completed', payment: 'Paid' },
]

export const ORDER_HEADERS = [
  { title: 'Order', key: 'order' },
  { title: 'Date', key: 'date' },
  { title: 'Customer', key: 'customer' },
  { title: 'Items', key: 'items', align: 'end' as const },
  { title: 'Total', key: 'total', align: 'end' as const },
  { title: 'Fulfillment', key: 'fulfillment' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

export interface CampaignRow {
  id: string
  name: string
  audience: string
  sent: string
  openRate: string
  revenue: string
  status: string
}

/** Marketing → Campaigns. */
export const CAMPAIGNS: CampaignRow[] = [
  { id: 'c-1', name: 'Spring Refresh', audience: 'VIP — Repeat Buyers', sent: 'Aug 28, 2026', openRate: '58.2%', revenue: '$18,420', status: 'Sent' },
  { id: 'c-2', name: 'Back in Stock — Trail Runner', audience: 'Waitlist', sent: 'Aug 26, 2026', openRate: '44.9%', revenue: '$9,180', status: 'Sent' },
  { id: 'c-3', name: 'Winter Preview', audience: 'All subscribers', sent: '—', openRate: '—', revenue: '—', status: 'Draft' },
  { id: 'c-4', name: 'Cart Abandon · Step 2', audience: 'Abandoners (48h)', sent: 'Ongoing', openRate: '39.4%', revenue: '$24,905', status: 'Active' },
  { id: 'c-5', name: 'Loyalty Tier Bump', audience: 'Gold members', sent: '—', openRate: '—', revenue: '—', status: 'Paused' },
]

export const CAMPAIGN_HEADERS = [
  { title: 'Campaign', key: 'name' },
  { title: 'Audience', key: 'audience' },
  { title: 'Sent', key: 'sent' },
  { title: 'Open rate', key: 'openRate', align: 'end' as const },
  { title: 'Revenue', key: 'revenue', align: 'end' as const },
  { title: 'Status', key: 'status' },
]

/** Filter chips as MpDataTableToolbar expects them. */
export const ORDER_FILTERS = [
  { key: 'status', label: 'Status: Processing' },
  { key: 'channel', label: 'Channel: Web store' },
  { key: 'date', label: 'Last 30 days' },
]

/** Tabs for the MpFilterTabs row above an orders table. */
export const ORDER_TABS = [
  { label: 'All Orders', key: 'all', count: 82 },
  { label: 'Completed', key: 'completed', count: 30 },
  { label: 'Processing', key: 'processing', count: 12 },
  { label: 'Not Fulfilled', key: 'unfulfilled', count: 41 },
]

/** Rows for list-shaped surfaces (activity feeds, recent items). */
export const ACTIVITY = [
  { id: 'a-1', time: '2m ago', title: 'Spring Refresh sent to VIP — Repeat Buyers', meta: '58.2% open', icon: 'send' },
  { id: 'a-2', time: '14m ago', title: 'Cart Abandon · Step 2 entered 312 contacts', meta: 'In flow', icon: 'git-branch' },
  { id: 'a-3', time: '32m ago', title: 'VIP segment refreshed', meta: '+312', icon: 'users' },
  { id: 'a-4', time: '1h ago', title: 'Order #10002 refunded', meta: '−$1,120.00', icon: 'receipt' },
]

/** Rows for MpNotificationsMenu stories — same shape as the useNotifications store seed. */
export const NOTIFICATIONS = [
  { id: 'n-1', severity: 'critical' as const, icon: 'credit-card', title: 'Payment failed on order #10012', context: 'Sales Orders', time: '12m ago', read: false },
  { id: 'n-2', severity: 'warning' as const, icon: 'package', title: 'Trail Shell Jacket is low on stock — 4 left', context: 'Inventory', time: '38m ago', read: false },
  { id: 'n-3', severity: 'info' as const, icon: 'send', title: 'Campaign "Spring Refresh" finished sending', context: 'Email Campaigns', time: '1h ago', read: false },
  { id: 'n-4', severity: 'warning' as const, icon: 'ticket', title: 'Urgent ticket assigned to you: "Order never arrived"', context: 'Service', time: '2h ago', read: false },
  { id: 'n-5', severity: 'critical' as const, icon: 'upload', title: 'Contact import failed — 214 rows rejected', context: 'Imports', time: '3h ago', read: true },
  { id: 'n-6', severity: 'info' as const, icon: 'users', title: 'Segment "Lapsed VIPs" finished refreshing', context: 'Segments', time: '5h ago', read: true },
]

/** Folder tree for MpFolderSelect / MpMoveToFolderDialog examples. */
export const FOLDERS = [
  { id: 'f-lifecycle', name: 'Lifecycle', parentId: null },
  { id: 'f-welcome', name: 'Welcome series', parentId: 'f-lifecycle' },
  { id: 'f-winback', name: 'Winback', parentId: 'f-lifecycle' },
  { id: 'f-promos', name: 'Promotions', parentId: null },
  { id: 'f-archive', name: 'Archive', parentId: null },
]

export const FOLDER_COUNTS: Record<string, number> = {
  'f-lifecycle': 14,
  'f-welcome': 6,
  'f-winback': 8,
  'f-promos': 23,
  'f-archive': 41,
}
