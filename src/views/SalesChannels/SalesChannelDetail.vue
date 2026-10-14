<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpDialog from '@/components/MpDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import StorefrontPreview from '@/components/saleschannels/StorefrontPreview.vue'
import { useToast } from '@/composables/useToast'
import {
  CHANNEL_STATUS_LABELS,
  CHANNEL_TYPE_LABELS,
  CONNECTED_CLOUD_ICONS,
  LOCATION_ROLE_LABELS,
  useSalesChannelsStore,
  type ConnectedCloud,
} from '@/stores/useSalesChannels'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMaropayStore } from '@/stores/useMaropay'
import { markForProvider } from '@/maropay/methodMarks'
import type { MethodMarkId } from '@/maropay/methodMarks'
import { PROVIDER_LABELS, STORE_ACTIVATION_LABELS } from '@/maropay/model'
import { activeConnections, connectionOfferedMethods } from '@/maropay/providers'
import { useRetailStore } from '@/stores/useRetail'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useStorefrontStore } from '@/stores/useStorefront'

type MetricColor = 'primary' | 'retail' | 'commerce' | 'analytics' | 'contacts' | 'success' | 'warning'
type DetailTab = 'overview' | 'settings' | 'apps' | 'ai' | 'activity'
type ProductTarget =
  | ConnectedCloud
  | 'apps'
  | 'dashboard'
  | 'davinci'
  | 'chatbot'
  | 'assets'
  | 'blogs'
  | 'inventory'
  | 'locations'
  | 'navigation'
  | 'pages'
  | 'payments'
  | 'store_campaigns'
  | 'pos'
  | 'products'
  | 'preview'
  | 'registers'
  | 'settings'
  | 'shopping_assistant'
  | 'transactions'

interface KpiCard {
  label: string
  value: string
  icon: string
  color: MetricColor
  period?: string
  trend?: string
  trendPositive?: boolean
  subStat?: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  color: MetricColor
  target: ProductTarget
}

interface SetupItem {
  id: string
  title: string
  description: string
  done: boolean
  target: ProductTarget
}

interface ActivityItem {
  id: string
  icon: string
  title: string
  meta: string
  time: string
  color: MetricColor
}

interface ConnectedApp {
  id: string
  name: string
  category: string
  initials: string
  /** A payment provider Maropay has a mark for wears it instead of initials. */
  mark?: MethodMarkId
  status: 'Connected' | 'Disconnected' | 'Needs setup'
}

interface BusinessInfoField {
  label: string
  value: string
}

interface AssistantCard {
  id: string
  title: string
  description: string
  icon: string
  color: MetricColor
  target: ProductTarget
}

interface CrossSellBanner {
  title: string
  description: string
  actionLabel: string
  target: ProductTarget
}

interface CrossSellFeature {
  id: string
  title: string
  description: string
  icon: string
  color: MetricColor
  status: string
  actionLabel: string
  target: ProductTarget
}

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const retailStore = useRetailStore()
const commerceStore = useCommerceStore()
const storeThemesStore = useStoreThemesStore()
const toast = useToast()

const addedAssistantIds = ref<string[]>([])
const activeTab = ref<DetailTab>('overview')
const showCompletedSetup = ref(false)
const previewDialogOpen = ref(false)
const previewDevice = ref<'desktop' | 'mobile'>('desktop')

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const isWebStore = computed(() => channel.value?.type === 'web_store')

const maropay = useMaropayStore()
const maropayBinding = computed(() => maropay.bindingFor(channelId.value))
/**
 * Who takes this store's online payments: Maropay once it's live, and the
 * merchant's own providers that offer something beside it (a store that never
 * touched payments keeps its long-standing Stripe connection).
 */
const maropayLive = computed(() => maropayBinding.value?.activation === 'live')
const otherProviders = computed(() => {
  const setup = maropay.storeProvidersFor(channelId.value)
  return activeConnections(setup).filter((c) => connectionOfferedMethods(c, setup).length > 0)
})
const paymentProviderNames = computed(() => [...(maropayLive.value ? ['Maropay'] : []), ...otherProviders.value.map((c) => PROVIDER_LABELS[c.kind])])

// Published theme for this channel drives the preview dialog; falls back to the
// default static storefront mock when no theme exists.
const channelTheme = computed(() => (channelId.value ? storeThemesStore.themeForChannel(channelId.value) : undefined))
const previewSections = computed(() => channelTheme.value?.templates.home)
const previewStyles = computed(() => channelTheme.value?.styles)
// A crawled store's own wordmark and menu in the preview header (Neelam-Store); others keep the sample header.
const previewHeader = computed(() => useStorefrontStore().previewHeaderFor(channel.value))

const locations = computed(() => {
  if (!channel.value?.offlineStore) return []
  const ids = new Set(channel.value.offlineStore.locationIds)
  return retailStore.locationList.filter((location) => ids.has(location.id))
})

const registers = computed(() => {
  const ids = new Set(locations.value.map((location) => location.id))
  return retailStore.registerList.filter((register) => ids.has(register.locationId))
})

const staff = computed(() => {
  const ids = new Set(locations.value.map((location) => location.id))
  return retailStore.staffList.filter((staff) => staff.locationIds.some((id) => ids.has(id)))
})

const retailTransactions = computed(() => {
  const ids = new Set(locations.value.map((location) => location.id))
  return commerceStore.posOrders.filter((order) => ids.has(order.pos?.locationId ?? ''))
})

const onlineRegisterCount = computed(() => registers.value.filter((register) => register.status === 'online').length)
const offlineRegisterCount = computed(() => registers.value.filter((register) => register.status === 'offline').length)
const pendingOfflineTransactions = computed(() => registers.value.reduce((sum, register) => sum + register.pendingOfflineTxns, 0))
const totalRetailSalesToday = computed(() => locations.value.reduce((sum, location) => sum + location.todaysSales, 0))
const activeStaffMemberCount = computed(() => staff.value.filter((staff) => staff.active).length)
const averageBasket = computed(() => {
  const completed = retailTransactions.value.filter((order) => parseFloat(order.total) > 0)
  if (!completed.length) return 0
  return completed.reduce((sum, order) => sum + parseFloat(order.total), 0) / completed.length
})

const primaryActionLabel = computed(() => {
  if (!channel.value) return ''
  if (channel.value.type === 'offline_store') return 'Launch POS'
  return channel.value.webStore?.storeBuilderEnabled ? 'Edit theme' : 'Set up theme'
})

const secondaryActionLabel = computed(() => (isWebStore.value ? 'Preview' : 'Manage locations'))

const detailTabs: Array<{ label: string; key: DetailTab }> = [
  { label: 'Overview', key: 'overview' },
  { label: 'Settings', key: 'settings' },
  { label: 'Apps', key: 'apps' },
  { label: 'AI & automation', key: 'ai' },
  { label: 'Activity', key: 'activity' },
]

const headerMeta = computed(() => {
  const current = channel.value
  if (!current) return []

  if (current.type === 'web_store') {
    return [
      CHANNEL_TYPE_LABELS[current.type],
      current.webStore?.published ? `Last published ${formatRelative(current.lastActivityAt)}` : `Last saved ${formatRelative(current.lastActivityAt)}`,
    ]
  }

  return [
    CHANNEL_TYPE_LABELS[current.type],
    `${locations.value.length} locations`,
    `${onlineRegisterCount.value} of ${registers.value.length} registers online`,
  ]
})

const kpiCards = computed<KpiCard[]>(() => {
  if (isWebStore.value) {
    return [
      { label: 'Revenue', value: '$842K', icon: 'trending-up', color: 'commerce', period: 'Last 30 days', trend: '+12%', trendPositive: true },
      { label: 'Orders', value: '1,284', icon: 'shopping-bag', color: 'primary', period: 'Last 30 days', trend: '+8%', trendPositive: true },
      { label: 'Conversion', value: formatPercent(3.42), icon: 'mouse-pointer-click', color: 'analytics', period: 'Storefront sessions', trend: '+0.3%', trendPositive: true },
      { label: 'Sessions', value: '37.6K', icon: 'users', color: 'contacts', period: 'Last 30 days', trend: '+4%', trendPositive: true },
    ]
  }

  return [
    { label: 'Sales today', value: formatCurrency(totalRetailSalesToday.value), icon: 'trending-up', color: 'retail', period: 'Linked locations', trend: '+8.4%', trendPositive: true },
    { label: 'Transactions', value: String(retailTransactions.value.length), icon: 'receipt', color: 'primary', period: 'Today', trend: '+5.2%', trendPositive: true },
    { label: 'Average basket', value: formatCurrency(averageBasket.value), icon: 'shopping-bag', color: 'commerce', period: 'Per transaction', trend: '+3.1%', trendPositive: true },
    {
      label: 'Registers online',
      value: `${onlineRegisterCount.value} / ${registers.value.length}`,
      icon: 'tablet-smartphone',
      color: offlineRegisterCount.value ? 'warning' : 'success',
      subStat: pendingOfflineTransactions.value ? `${pendingOfflineTransactions.value} offline txns pending sync` : 'All devices in sync',
    },
  ]
})

const quickActions = computed<QuickAction[]>(() => {
  if (isWebStore.value) {
    return [
      {
        id: 'theme',
        title: channel.value?.webStore?.published ? 'Edit theme' : 'Finish theme',
        description: 'Store Builder',
        icon: 'palette',
        color: 'primary',
        target: 'store_builder',
      },
      {
        id: 'products',
        title: 'Manage products',
        description: 'Catalog',
        icon: 'package',
        color: 'commerce',
        target: 'products',
      },
      {
        id: 'merchandise',
        title: 'Merchandising',
        description: 'Rules',
        icon: CONNECTED_CLOUD_ICONS.merchandise,
        color: channel.value?.webStore?.merchandiseConnected ? 'success' : 'warning',
        target: 'merchandise',
      },
      {
        id: 'navigation',
        title: 'Navigation',
        description: 'Storefront menus',
        icon: 'list-tree',
        color: 'primary',
        target: 'navigation',
      },
      {
        id: 'pages',
        title: 'Pages',
        description: 'Content pages',
        icon: 'file-text',
        color: 'contacts',
        target: 'pages',
      },
      {
        id: 'blogs',
        title: 'Blogs',
        description: 'Posts & guides',
        icon: 'rss',
        color: 'warning',
        target: 'blogs',
      },
      {
        id: 'store-campaigns',
        title: 'Campaigns',
        description: 'Scheduled promos',
        icon: 'megaphone',
        color: 'retail',
        target: 'store_campaigns',
      },
      {
        id: 'assets',
        title: 'Assets',
        description: 'Images & files',
        icon: 'image',
        color: 'success',
        target: 'assets',
      },
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'Reports',
        icon: 'bar-chart-3',
        color: 'analytics',
        target: 'dashboard',
      },
    ]
  }

  return [
    { id: 'pos', title: 'Launch POS', description: 'Tablet preview', icon: 'tablet-smartphone', color: 'retail', target: 'pos' },
    { id: 'locations', title: 'Manage locations', description: `${locations.value.length} linked`, icon: 'map-pin', color: 'success', target: 'locations' },
    { id: 'inventory', title: 'Inventory', description: 'Store stock', icon: 'package-check', color: 'commerce', target: 'inventory' },
    { id: 'dashboard', title: 'Analytics', description: 'Reports', icon: 'bar-chart-3', color: 'analytics', target: 'dashboard' },
  ]
})

function paymentsSetupItem(): SetupItem {
  const binding = maropayBinding.value
  const state = binding && !maropayLive.value ? maropay.storeStateFor(channelId.value) : null
  const maropayNote = maropayLive.value ? 'Maropay live' : state ? `Maropay ${STORE_ACTIVATION_LABELS[state].toLowerCase()}` : 'Maropay not set up'
  const names = paymentProviderNames.value
  return {
    id: 'online_payments',
    title: 'Online payments',
    description: names.length ? `${names.join(', ')} · ${maropayNote}` : 'No payment methods yet — shoppers can’t check out',
    done: names.length > 0,
    target: 'payments',
  }
}

const setupChecklist = computed<SetupItem[]>(() => {
  const current = channel.value
  if (!current) return []

  if (current.type === 'web_store') {
    return [
      { id: 'domain', title: 'Store URL', description: current.webStore?.domain ?? 'Add a storefront domain', done: Boolean(current.webStore?.domain), target: 'preview' },
      { id: 'theme', title: 'Theme ready', description: current.webStore?.published ? 'Published theme is live' : 'Publish the draft theme', done: Boolean(current.webStore?.published), target: 'store_builder' },
      { id: 'merchandise', title: 'Merchandising connected', description: 'Search and recommendations are active', done: Boolean(current.webStore?.merchandiseConnected), target: 'merchandise' },
      { id: 'legal', title: 'Legal pages', description: 'Review privacy and returns', done: false, target: 'settings' },
      paymentsSetupItem(),
    ]
  }

  return [
    { id: 'locations', title: 'Locations linked', description: `${locations.value.length} locations assigned`, done: locations.value.length > 0, target: 'locations' },
    { id: 'registers', title: 'Registers paired', description: `${registers.value.length} devices in this channel`, done: registers.value.length > 0, target: 'registers' },
    { id: 'staff', title: 'StaffMembers added', description: `${activeStaffMemberCount.value} active staff`, done: activeStaffMemberCount.value > 0, target: 'locations' },
    { id: 'receipt', title: 'Receipt template', description: 'Add logo and contact details', done: Boolean(channel.value?.offlineStore?.posSetupComplete), target: 'settings' },
    { id: 'payments', title: 'Payment terminals', description: 'Stripe Terminal or Tap to Pay', done: registers.value.some((register) => register.pairedTerminal), target: 'registers' },
  ]
})

const completedSetupCount = computed(() => setupChecklist.value.filter((item) => item.done).length)
const pendingSetupItems = computed(() => setupChecklist.value.filter((item) => !item.done))
const completedSetupItems = computed(() => setupChecklist.value.filter((item) => item.done && item.id !== 'online_payments'))
/** Online payments always shows first on a web store, done or not; the other pending items follow, two at a time. */
const paymentsItem = computed(() => (isWebStore.value ? setupChecklist.value.find((item) => item.id === 'online_payments') ?? null : null))
const paymentsMark = computed<MethodMarkId>(() => (maropayLive.value || !otherProviders.value.length ? 'maropay' : markForProvider(otherProviders.value[0]!.kind)))
const visibleSetupItems = computed(() => pendingSetupItems.value.filter((item) => item.id !== 'online_payments').slice(0, 2))
const setupProgress = computed(() => {
  if (!setupChecklist.value.length) return 0
  return Math.round((completedSetupCount.value / setupChecklist.value.length) * 100)
})

const activityItems = computed<ActivityItem[]>(() => {
  const current = channel.value
  if (!current) return []

  if (current.type === 'web_store') {
    return [
      { id: 'theme', icon: 'rocket', title: 'Theme published', meta: 'Atlas v3.2', time: formatRelative(current.lastActivityAt), color: 'primary' },
      { id: 'inventory', icon: 'package', title: 'Catalog synced', meta: '47 SKUs from Commerce Cloud', time: '2 h ago', color: 'commerce' },
      { id: 'search', icon: 'sliders-horizontal', title: 'Search rules updated', meta: 'Fall outerwear', time: 'Yesterday', color: 'analytics' },
    ]
  }

  return [
    { id: 'open', icon: 'store', title: 'Locations opened', meta: `${locations.value.length} stores trading`, time: formatRelative(current.lastActivityAt), color: 'retail' },
    { id: 'sync', icon: 'refresh-cw', title: 'Offline sync', meta: pendingOfflineTransactions.value ? `${pendingOfflineTransactions.value} txns pending` : 'All clear', time: '38 min ago', color: pendingOfflineTransactions.value ? 'warning' : 'success' },
    { id: 'staff', icon: 'user-plus', title: 'StaffMembers active', meta: `${activeStaffMemberCount.value} assigned`, time: 'Yesterday', color: 'primary' },
  ]
})

const overviewActivityItems = computed(() => activityItems.value.slice(0, 3))

/** One row per payment provider on the store — Maropay first, live or still to set up. */
const paymentApps = computed<ConnectedApp[]>(() => [
  maropayLive.value
    ? { id: 'payments-maropay', name: 'Maropay', category: 'Payments', initials: 'MA', mark: 'maropay', status: 'Connected' }
    : { id: 'payments-maropay', name: 'Maropay', category: 'Payments · not live yet', initials: 'MA', mark: 'maropay', status: 'Needs setup' },
  ...otherProviders.value.map((c): ConnectedApp => ({
    id: `payments-${c.kind}`, name: PROVIDER_LABELS[c.kind], category: 'Payments', initials: PROVIDER_LABELS[c.kind].slice(0, 2).toUpperCase(), mark: markForProvider(c.kind), status: 'Connected',
  })),
])

const connectedApps = computed<ConnectedApp[]>(() => {
  if (isWebStore.value) {
    return [
      ...paymentApps.value,
      { id: 'shipstation', name: 'ShipStation', category: 'Fulfillment', initials: 'SH', status: 'Connected' },
      { id: 'meta', name: 'Meta Ads', category: 'Ads', initials: 'ME', status: 'Connected' },
      { id: 'google', name: 'Google Ads', category: 'Ads', initials: 'GO', status: 'Disconnected' },
    ]
  }

  return [
    { id: 'stripe-terminal', name: 'Stripe Terminal', category: 'Payments', initials: 'ST', status: 'Connected' },
    { id: 'tap-to-pay', name: 'Tap to Pay', category: 'Hardware', initials: 'TP', status: 'Connected' },
    { id: 'xero', name: 'Xero', category: 'Accounting', initials: 'XE', status: 'Disconnected' },
  ]
})

const businessInfoFields = computed<BusinessInfoField[]>(() => {
  if (isWebStore.value) {
    return [
      { label: 'Legal name', value: 'Atlas Outfitters Ltd.' },
      { label: 'Business type', value: 'Limited Liability Company' },
      { label: 'Reg. number', value: 'AU 2 037 482 116' },
      { label: 'Phone', value: '+61 412 884 110' },
      { label: 'Public email', value: 'hello@atlasoutfitters.com' },
      { label: 'Support email', value: 'support@atlasoutfitters.com' },
      { label: 'Website', value: 'atlasoutfitters.com' },
      { label: 'Street', value: '234 Atlantic Avenue, Suite 4B' },
      { label: 'City / region', value: 'Brooklyn, NY 11201' },
      { label: 'Country', value: 'United States' },
    ]
  }

  return [
    { label: 'Legal name', value: `${channel.value?.name ?? 'Retail'} Pty Ltd.` },
    { label: 'Business type', value: 'Multi-location retailer' },
    { label: 'Reg. number', value: 'AU 9 481 502 774' },
    { label: 'Phone', value: '+61 412 884 110' },
    { label: 'Public email', value: 'retail@atlasoutfitters.com' },
    { label: 'Support email', value: 'support@atlasoutfitters.com' },
    { label: 'Website', value: 'atlasoutfitters.com/retail' },
    { label: 'Street', value: locations.value[0]?.address ?? '500 Oxford St' },
    { label: 'City / region', value: locations.value[0]?.name ?? 'Primary location' },
    { label: 'Country', value: locations.value[0]?.country ?? 'AU' },
  ]
})

const crossSellBanner = computed<CrossSellBanner>(() => ({
  title: 'Add AI and chat experiences to this channel',
  description: isWebStore.value
    ? 'Launch support and shopping assistance from the same storefront data.'
    : 'Use retail activity to automate support, recommendations, and staff insights.',
  actionLabel: 'Explore AI',
  target: 'davinci',
}))

const assistantCards = computed<AssistantCard[]>(() => [
  {
    id: 'service-chatbot',
    title: 'Service chatbot',
    description: 'Answer order, return, and policy questions with your support content.',
    icon: 'message-circle',
    color: 'contacts',
    target: 'chatbot',
  },
  {
    id: 'shopping-assistant',
    title: 'Shopping assistant',
    description: 'Guide shoppers to products using catalog, inventory, and search signals.',
    icon: 'bot',
    color: 'commerce',
    target: 'shopping_assistant',
  },
])

const crossSellFeatures = computed<CrossSellFeature[]>(() => {
  const merchandiseConnected = Boolean(channel.value?.connectedClouds.includes('merchandise'))
  return [
    {
      id: 'merchandise-cloud',
      title: 'Merchandise Cloud',
      description: 'Search, recommendations, synonyms, redirects, and product ranking rules.',
      icon: CONNECTED_CLOUD_ICONS.merchandise,
      color: merchandiseConnected ? 'success' : 'commerce',
      status: merchandiseConnected ? 'Connected' : 'Available',
      actionLabel: merchandiseConnected ? 'Manage' : 'Connect',
      target: 'merchandise',
    },
    {
      id: 'davinci-ai',
      title: 'Da Vinci AI',
      description: 'Generate product copy, campaign ideas, and dashboard widgets from channel data.',
      icon: 'sparkles',
      color: 'analytics',
      status: 'Available',
      actionLabel: 'Add',
      target: 'davinci',
    },
  ]
})

function showNotice(message: string) {
  toast.info(message)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatPercent(value: number) {
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diffMs < minute) return 'just now'
  if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))} min ago`
  if (diffMs < day) return `${Math.round(diffMs / hour)} h ago`
  if (diffMs < 7 * day) return `${Math.round(diffMs / day)} d ago`
  return formatDate(iso)
}

async function copyValue(value: string, label = 'Value') {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
    await navigator.clipboard.writeText(value)
    showNotice(`${label} copied`)
  } catch {
    showNotice(`${label}: ${value}`)
  }
}

function isAssistantAdded(id: string) {
  return addedAssistantIds.value.includes(id)
}

function setupActionLabel(item: SetupItem) {
  if (item.id === 'legal' || item.id === 'receipt') return 'Set up'
  if (item.id === 'payments') return 'Pair'
  if (item.id === 'online_payments') return 'Set up'
  return 'Review'
}

function onAssistantAction(card: AssistantCard) {
  if (isAssistantAdded(card.id)) {
    runAction(card.target)
    return
  }
  addedAssistantIds.value = [...addedAssistantIds.value, card.id]
  showNotice(`${card.title} added to ${channel.value?.name ?? 'this channel'}`)
}

function openPrimaryAction() {
  if (!channel.value) return
  if (channel.value.type === 'offline_store') {
    openPreview('pos')
    return
  }
  router.push({ name: 'StoreThemeBuilder', params: { accountId: accountId.value, channelId: channelId.value } })
}

function openPreview(mode: 'desktop' | 'mobile' | 'pos' = 'desktop') {
  if (!channel.value) return
  if (channel.value.type === 'offline_store' || mode === 'pos') {
    router.push({ name: 'RetailPosPreview', params: { accountId: accountId.value } })
    return
  }
  previewDevice.value = mode
  previewDialogOpen.value = true
}

function openSettings() {
  activeTab.value = 'settings'
}

function openLocations() {
  if (!channel.value) return
  router.push({ name: 'SalesChannelLocations', params: { accountId: accountId.value, channelId: channel.value.id } })
}

function openDashboard() {
  const dashboardId = isWebStore.value ? `${accountId.value}-commerce-overview` : `${accountId.value}-retail`
  router.push({ name: 'DashboardDetail', params: { accountId: accountId.value, dashboardId } })
}

function openConnectedProduct(target: ConnectedCloud | 'apps' | 'davinci') {
  if (target === 'merchandise') {
    router.push({ name: 'MerchandisingChannelOverview', params: { accountId: accountId.value, channelId: channelId.value } })
    return
  }
  if (target === 'retail') {
    router.push({ name: 'RetailHome', params: { accountId: accountId.value } })
    return
  }
  if (target === 'commerce') {
    openDashboard()
    return
  }
  if (target === 'apps') {
    router.push({ name: 'AppStore', params: { accountId: accountId.value } })
    return
  }
  if (target === 'davinci') {
    router.push({ name: 'DaVinciDashboard', params: { accountId: accountId.value } })
    return
  }
  router.push({ name: 'StoreThemeBuilder', params: { accountId: accountId.value, channelId: channelId.value } })
}

function runAction(target: ProductTarget) {
  if (target === 'preview') {
    openPreview()
    return
  }
  if (target === 'pos') {
    openPreview('pos')
    return
  }
  if (target === 'settings') {
    openSettings()
    return
  }
  if (target === 'chatbot') {
    router.push({ name: 'ChatbotList', params: { accountId: accountId.value } })
    return
  }
  if (target === 'shopping_assistant') {
    router.push({ name: 'MerchandisingChannelRecommendations', params: { accountId: accountId.value, channelId: channelId.value } })
    return
  }
  if (target === 'navigation') {
    router.push({ name: 'StoreNavigation', params: { accountId: accountId.value, channelId: channelId.value } })
    return
  }
  if (target === 'pages') {
    router.push({ name: 'StorePages', params: { accountId: accountId.value, channelId: channelId.value } })
    return
  }
  if (target === 'blogs') {
    router.push({ name: 'StoreBlogs', params: { accountId: accountId.value, channelId: channelId.value } })
    return
  }
  if (target === 'store_campaigns') {
    router.push({ name: 'StoreCampaigns', params: { accountId: accountId.value, channelId: channelId.value } })
    return
  }
  if (target === 'assets') {
    router.push({ name: 'StoreAssets', params: { accountId: accountId.value, channelId: channelId.value } })
    return
  }
  if (target === 'payments') {
    router.push({ name: 'StorePayments', params: { accountId: accountId.value, channelId: channelId.value } })
    return
  }
  if (target === 'locations') {
    openLocations()
    return
  }
  if (target === 'dashboard') {
    openDashboard()
    return
  }
  if (target === 'transactions') {
    router.push({ name: 'RetailTransactions', params: { accountId: accountId.value } })
    return
  }
  if (target === 'registers') {
    router.push({ name: 'RetailRegisters', params: { accountId: accountId.value } })
    return
  }
  if (target === 'inventory') {
    router.push({ name: 'Inventory', params: { accountId: accountId.value }, query: { view: 'locations' } })
    return
  }
  if (target === 'products') {
    router.push({ name: 'Products', params: { accountId: accountId.value } })
    return
  }
  if (target === 'apps' || target === 'commerce' || target === 'davinci' || target === 'merchandise' || target === 'retail' || target === 'store_builder') {
    openConnectedProduct(target)
  }
}

function locationRoleText(locationId: string) {
  const roles = channel.value?.offlineStore?.locationRoles[locationId] ?? []
  return roles.map((role) => LOCATION_ROLE_LABELS[role]).join(', ') || 'POS selling'
}
</script>

<template>
  <div class="sales-channel-detail h-100">
    <template v-if="channel">
      <!-- The store editor's rail carries the way back for a web store; a POS channel has no rail. -->
      <MpPageHeader
        :title="channel.name"
        :subtitle="headerMeta.join(' · ')"
        :back-to="isWebStore ? undefined : { name: 'SalesChannels', params: { accountId } }"
      >
        <template #title-append>
          <MpStatusChip :status="CHANNEL_STATUS_LABELS[channel.status]" type="general" show-icon />
        </template>
        <template #actions>
          <v-btn
            variant="outlined"
            class="text-none"
            :prepend-icon="isWebStore ? 'external-link' : 'map-pin'"
            @click="isWebStore ? openPreview() : openLocations()"
          >
            {{ secondaryActionLabel }}
          </v-btn>
          <v-btn variant="outlined" class="text-none" prepend-icon="sliders-horizontal" @click="openSettings">
            Settings
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none"
            :prepend-icon="isWebStore ? 'palette' : 'tablet-smartphone'"
            @click="openPrimaryAction"
          >
            {{ primaryActionLabel }}
          </v-btn>
        </template>
        <template #tabs>
          <MpFilterTabs
            :model-value="activeTab"
            :tabs="detailTabs"
            aria-label="Channel sections"
            controls-id="sc-tab-panel"
            @update:model-value="activeTab = $event as DetailTab"
          />
        </template>
      </MpPageHeader>

      <section v-if="activeTab === 'overview'" id="sc-tab-panel" class="sc-tab-panel" role="tabpanel">
        <div class="sc-overview-grid">
          <v-card flat border rounded="lg" class="retail-widget-card sc-hero-card">
            <div class="retail-widget-header">
              <div>
                <div class="retail-widget-header__title">{{ isWebStore ? 'Storefront preview' : 'POS overview' }}</div>
                <div class="retail-widget-header__sub">{{ isWebStore ? 'Live storefront' : `${locations.length} locations linked` }}</div>
              </div>
              <div class="retail-widget-header__actions">
                <v-btn variant="outlined" size="small" class="text-none" prepend-icon="external-link" @click="isWebStore ? openPreview() : openPreview('pos')">
                  {{ isWebStore ? 'Preview' : 'Launch POS' }}
                </v-btn>
                <v-btn variant="flat" color="primary" size="small" class="text-none" :prepend-icon="isWebStore ? 'palette' : 'map-pin'" @click="isWebStore ? openPrimaryAction() : openLocations()">
                  {{ isWebStore ? 'Edit theme' : 'Locations' }}
                </v-btn>
              </div>
            </div>

            <div class="retail-widget-body">
              <StorefrontPreview v-if="isWebStore" :sections="previewSections" :styles="previewStyles" :brand="previewHeader.brand" :menu="previewHeader.menu" />

              <div v-else class="sc-retail-preview sc-retail-preview--hero" aria-label="Retail location summary">
                <button
                  v-for="location in locations.slice(0, 3)"
                  :key="location.id"
                  type="button"
                  class="sc-location-row"
                  @click="openLocations"
                >
                  <span>
                    <strong>{{ location.name }}</strong>
                    <em>{{ locationRoleText(location.id) }}</em>
                  </span>
                  <span>{{ formatCurrency(location.todaysSales) }}</span>
                </button>
              </div>

              <div v-if="isWebStore && channel.webStore?.domain" class="sc-hero-url">
                <v-icon size="16">globe</v-icon>
                <span>{{ channel.webStore.domain }}</span>
                <v-btn
                  size="small"
                  variant="text"
                  icon
                  aria-label="Copy store URL"
                  @click="copyValue(`https://${channel.webStore?.domain}`, 'Store URL')"
                >
                  <v-icon>copy</v-icon>
                  <v-tooltip activator="parent" location="top">Copy store URL</v-tooltip>
                </v-btn>
              </div>
            </div>
          </v-card>

          <v-card flat border rounded="lg" class="retail-widget-card sc-setup-card">
            <div class="retail-widget-header">
              <div>
                <div class="retail-widget-header__title">Finish setup</div>
                <div class="retail-widget-header__sub">{{ completedSetupCount }} / {{ setupChecklist.length }} complete</div>
              </div>
            </div>
            <div class="retail-widget-progress">
              <v-progress-linear :model-value="setupProgress" height="5" rounded color="primary" :aria-label="`Setup ${completedSetupCount} of ${setupChecklist.length} complete`" />
            </div>
            <div class="retail-widget-body sc-setup-body">
              <div v-if="paymentsItem" class="sc-setup-row" :class="{ 'sc-setup-row--done': paymentsItem.done }">
                <MaropayMethodMark :mark="paymentsMark" size="sm" decorative />
                <div class="min-width-0">
                  <strong>{{ paymentsItem.title }}</strong>
                  <span>{{ paymentsItem.description }}</span>
                </div>
                <v-btn size="small" color="primary" :variant="paymentsItem.done ? 'text' : 'tonal'" class="text-none" @click="runAction(paymentsItem.target)">
                  {{ paymentsItem.done ? 'Manage' : 'Set up' }}
                </v-btn>
              </div>
              <div v-if="visibleSetupItems.length" class="sc-setup-list">
                <div v-for="item in visibleSetupItems" :key="item.id" class="sc-setup-row">
                  <v-icon size="16">circle-dashed</v-icon>
                  <div class="min-width-0">
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.description }}</span>
                  </div>
                  <v-btn size="small" color="primary" variant="tonal" class="text-none" @click="runAction(item.target)">
                    {{ setupActionLabel(item) }}
                  </v-btn>
                </div>
              </div>
              <div v-else-if="!paymentsItem || paymentsItem.done" class="sc-setup-empty">
                <v-icon size="16" color="success">circle-check</v-icon>
                <span>No urgent setup items.</span>
              </div>

              <v-btn
                v-if="completedSetupItems.length"
                variant="text"
                size="small"
                class="text-none align-self-start"
                :aria-expanded="showCompletedSetup"
                @click="showCompletedSetup = !showCompletedSetup"
              >
                {{ showCompletedSetup ? 'Hide completed' : 'View completed' }}
              </v-btn>
              <div v-if="showCompletedSetup" class="sc-completed-list">
                <div v-for="item in completedSetupItems" :key="item.id" class="sc-completed-row">
                  <v-icon size="16" color="success">circle-check</v-icon>
                  <span>{{ item.title }}</span>
                </div>
              </div>
            </div>
          </v-card>
        </div>

        <v-card flat border rounded="lg" class="retail-widget-card sc-quick-card">
          <div class="retail-widget-header">
            <div class="retail-widget-header__title">Quick actions</div>
          </div>
          <div class="retail-widget-body">
            <div class="sc-action-grid sc-action-grid--compact">
              <button
                v-for="action in quickActions"
                :key="action.id"
                type="button"
                class="retail-action-tile retail-action-tile--compact"
                @click="runAction(action.target)"
              >
                <span class="retail-action-tile__icon" :class="`retail-action-tile__icon--${action.color}`">
                  <v-icon size="15">{{ action.icon }}</v-icon>
                </span>
                <span class="retail-action-tile__title">{{ action.title }}</span>
                <span class="retail-action-tile__desc">{{ action.description }}</span>
              </button>
            </div>
          </div>
        </v-card>

        <section class="sc-performance-section" aria-labelledby="sales-channel-performance-title">
          <div class="sc-section-line">
            <h2 id="sales-channel-performance-title" class="mp-section-title">Performance snapshot</h2>
            <span>Last 30 days</span>
          </div>
          <div class="sc-performance-grid">
            <MpKpiCard
              v-for="kpi in kpiCards"
              :key="kpi.label"
              :label="kpi.label"
              :value="kpi.value"
              :icon="kpi.icon"
              :color="kpi.color"
              :period="kpi.period"
              :trend="kpi.trend"
              :trend-positive="kpi.trendPositive"
              :sub-stat="kpi.subStat"
            />
          </div>
        </section>

        <v-card flat border rounded="lg" class="retail-widget-card sc-activity-card">
          <div class="retail-widget-header">
            <div class="retail-widget-header__title">Recent activity</div>
            <v-btn variant="text" size="small" class="text-none" @click="activeTab = 'activity'">View all</v-btn>
          </div>
          <v-list class="retail-list" density="compact">
            <v-list-item v-for="item in overviewActivityItems" :key="item.id">
              <template #prepend>
                <span class="retail-row-icon" :class="`retail-row-icon--${item.color}`">
                  <v-icon size="15">{{ item.icon }}</v-icon>
                </span>
              </template>
              <v-list-item-title class="retail-list-title">{{ item.title }}</v-list-item-title>
              <v-list-item-subtitle class="retail-list-sub">{{ item.meta }}</v-list-item-subtitle>
              <template #append>
                <span class="sc-time">{{ item.time }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </section>

      <section v-else-if="activeTab === 'settings'" id="sc-tab-panel" class="sc-tab-panel" role="tabpanel">
        <v-card flat border rounded="lg" class="retail-widget-card">
          <div class="retail-widget-header">
            <div>
              <div class="retail-widget-header__title">Business information</div>
              <div class="retail-widget-header__sub">Legal, contact, and channel details</div>
            </div>
            <v-btn size="small" variant="text" prepend-icon="pencil" class="text-none" @click="showNotice('Business information edit prototype entry point.')">
              Edit
            </v-btn>
          </div>
          <div class="retail-widget-body">
            <dl class="mp-label-value sc-business-grid">
              <div v-for="field in businessInfoFields" :key="field.label">
                <dt>{{ field.label }}</dt>
                <dd>{{ field.value }}</dd>
              </div>
            </dl>
            <div v-if="isWebStore" class="sc-favicon-row">
              <div class="sc-favicon-row__thumb">
                <v-icon size="20">image</v-icon>
              </div>
              <div class="min-width-0">
                <strong>Favicon</strong>
                <span>100 x 100 px, square · Not uploaded yet</span>
              </div>
              <v-btn variant="outlined" size="small" prepend-icon="upload" class="text-none" @click="showNotice('Favicon upload prototype entry point.')">
                Upload
              </v-btn>
            </div>
          </div>
        </v-card>
      </section>

      <section v-else-if="activeTab === 'apps'" id="sc-tab-panel" class="sc-tab-panel" role="tabpanel">
        <v-card flat border rounded="lg" class="retail-widget-card">
          <div class="retail-widget-header">
            <div>
              <div class="retail-widget-header__title">Connected apps</div>
              <div class="retail-widget-header__sub">Payments, fulfillment, and marketing integrations</div>
            </div>
            <v-btn size="small" variant="outlined" prepend-icon="plus" class="text-none" @click="runAction('apps')">
              Browse apps
            </v-btn>
          </div>
          <div class="sc-app-list sc-app-list--wide" role="list">
            <MpListRow v-for="app in connectedApps" :key="app.id" variant="boxed" role="listitem" :title="app.name" :subtitle="app.category">
              <template #lead>
                <MaropayMethodMark v-if="app.mark" :mark="app.mark" size="md" decorative />
                <span v-else class="sc-app-row__initials" aria-hidden="true">{{ app.initials }}</span>
              </template>
              <template #trailing>
                <MpStatusChip :status="app.status" type="connection" size="sm" show-icon />
              </template>
            </MpListRow>
          </div>
        </v-card>
      </section>

      <section v-else-if="activeTab === 'ai'" id="sc-tab-panel" class="sc-tab-panel" role="tabpanel">
        <v-card flat border rounded="lg" class="retail-widget-card">
          <div class="retail-widget-header">
            <div>
              <div class="retail-widget-header__title">AI & automation</div>
              <div class="retail-widget-header__sub">Assistants and optimization tools for this channel</div>
            </div>
          </div>
          <div class="retail-widget-body">
            <div class="sc-cross-sell-banner">
              <div class="sc-cross-sell-banner__icon">
                <v-icon size="16">sparkles</v-icon>
              </div>
              <div class="min-width-0">
                <strong>{{ crossSellBanner.title }}</strong>
                <span>{{ crossSellBanner.description }}</span>
              </div>
              <v-btn size="small" variant="tonal" color="primary" class="text-none" @click="runAction(crossSellBanner.target)">
                {{ crossSellBanner.actionLabel }}
              </v-btn>
            </div>
            <div class="sc-assistant-grid" aria-label="Channel chatbot assistants">
              <div v-for="assistant in assistantCards" :key="assistant.id" class="sc-assistant-card">
                <div class="retail-row-icon" :class="`retail-row-icon--${assistant.color}`">
                  <v-icon size="15">{{ assistant.icon }}</v-icon>
                </div>
                <div class="min-width-0">
                  <div class="sc-assistant-card__header">
                    <strong>{{ assistant.title }}</strong>
                    <v-chip v-if="isAssistantAdded(assistant.id)" size="x-small" color="success" variant="tonal" label>
                      Added
                    </v-chip>
                  </div>
                  <span>{{ assistant.description }}</span>
                </div>
                <v-btn
                  size="small"
                  :variant="isAssistantAdded(assistant.id) ? 'outlined' : 'tonal'"
                  color="primary"
                  class="text-none"
                  @click="onAssistantAction(assistant)"
                >
                  {{ isAssistantAdded(assistant.id) ? 'Manage' : 'Add' }}
                </v-btn>
              </div>
            </div>
            <div class="sc-feature-list" aria-label="Cross-sell features">
              <template v-for="(feature, index) in crossSellFeatures" :key="feature.id">
                <v-divider v-if="index > 0" />
                <div class="sc-feature-row">
                  <div class="retail-row-icon" :class="`retail-row-icon--${feature.color}`">
                    <v-icon size="15">{{ feature.icon }}</v-icon>
                  </div>
                  <div class="min-width-0">
                    <div class="sc-feature-row__title">
                      <strong>{{ feature.title }}</strong>
                      <span>{{ feature.status }}</span>
                    </div>
                    <p>{{ feature.description }}</p>
                  </div>
                  <div class="sc-feature-row__actions">
                    <v-btn variant="text" size="small" class="text-none" @click="runAction(feature.target)">
                      Learn more
                    </v-btn>
                    <v-btn variant="outlined" size="small" class="text-none" @click="runAction(feature.target)">
                      {{ feature.actionLabel }}
                    </v-btn>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </v-card>
      </section>

      <section v-else id="sc-tab-panel" class="sc-tab-panel" role="tabpanel">
        <v-card flat border rounded="lg" class="retail-widget-card">
          <div class="retail-widget-header">
            <div class="retail-widget-header__title">Activity</div>
          </div>
          <v-list class="retail-list" density="compact">
            <v-list-item v-for="item in activityItems" :key="item.id">
              <template #prepend>
                <span class="retail-row-icon" :class="`retail-row-icon--${item.color}`">
                  <v-icon size="15">{{ item.icon }}</v-icon>
                </span>
              </template>
              <v-list-item-title class="retail-list-title">{{ item.title }}</v-list-item-title>
              <v-list-item-subtitle class="retail-list-sub">{{ item.meta }}</v-list-item-subtitle>
              <template #append>
                <span class="sc-time">{{ item.time }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </section>

      <MpDialog
        v-model="previewDialogOpen"
        size="lg"
        flush
        title="Storefront preview"
        :subtitle="channel.webStore?.domain"
      >
        <template #headerActions>
          <MpSegmentedControl
            :model-value="previewDevice"
            size="sm"
            ariaLabel="Preview device"
            :items="[
              { value: 'desktop', label: 'Desktop', icon: 'monitor', tooltip: 'Desktop' },
              { value: 'mobile', label: 'Mobile', icon: 'smartphone', tooltip: 'Mobile' },
            ]"
            @update:model-value="(value) => { previewDevice = value === 'mobile' ? 'mobile' : 'desktop' }"
          />
        </template>

        <div class="sc-preview-dialog__body">
          <StorefrontPreview :sections="previewSections" :styles="previewStyles" :brand="previewHeader.brand" :menu="previewHeader.menu" :device="previewDevice" />
        </div>
      </MpDialog>
    </template>

    <template v-else>
      <MpPageHeader
        title="Sales channel not found"
        subtitle="This channel may have been removed or the link is no longer valid."
        :back-to="{ name: 'SalesChannels', params: { accountId } }"
      />
      <v-card flat border rounded="lg">
        <MpEmptyState
          icon="store"
          title="Sales channel not found"
          description="Return to Sales Channels and choose an available channel."
          action-label="Back to Sales Channels"
          action-icon="arrow-left"
          @action="router.push({ name: 'SalesChannels', params: { accountId } })"
        />
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.sales-channel-detail {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-24);
  min-width: 0;
}

/* The page scrolls as a whole; nothing in its column shrinks (the tabs would collapse to 0). */
.sales-channel-detail > * {
  flex-shrink: 0;
}

.sc-preview-dialog__body {
  padding: var(--mp-space-20);
  background: var(--surface-secondary);
}

.sc-tab-panel {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
  min-width: 0;
}

.sc-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  align-items: stretch;
  gap: var(--mp-space-20);
  min-width: 0;
}

.sc-hero-card,
.sc-setup-card {
  min-width: 0;
}

.sc-retail-preview--hero {
  align-content: start;
}

.sc-hero-url {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--mp-space-8);
  margin-top: var(--mp-space-12);
  min-height: var(--mp-component-control-height);
  padding: var(--mp-space-6) var(--mp-space-10);
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-section);
  background: var(--surface-secondary);
  color: var(--muted);
  font-family: var(--mp-fontFamily-mono, monospace);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-bold);
}

.sc-hero-url span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-setup-card .retail-widget-body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-14);
}

.sc-setup-list,
.sc-completed-list {
  display: grid;
  gap: var(--mp-space-10);
}

.sc-setup-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--mp-space-10);
  padding: var(--mp-space-12);
  border: 1px solid color-mix(in oklch, var(--accent) 22%, var(--border-subtle));
  border-radius: var(--r-section);
  background: color-mix(in oklch, var(--accent) 5%, var(--surface-primary));
}

.sc-setup-row--done {
  border-color: var(--border-subtle);
  background: var(--surface-primary);
}

.sc-setup-row strong,
.sc-setup-row div > span,
.sc-setup-empty span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sc-setup-row strong {
  color: var(--text-primary);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1.25;
  white-space: nowrap;
}

.sc-setup-row div > span,
.sc-setup-empty span {
  margin-top: var(--mp-space-2);
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.35;
}

.sc-setup-empty,
.sc-completed-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.sc-completed-row {
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
}

.sc-action-grid--compact {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.retail-action-tile--compact {
  padding: var(--mp-space-12);
}

.retail-action-tile--compact .retail-action-tile__desc {
  font-size: var(--mp-fontSize-12);
  line-height: 1.25;
  white-space: nowrap;
}

.sc-performance-section {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
}

.sc-section-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
  min-width: 0;
}

.sc-section-line h2 {
  color: var(--text-primary);
}

.sc-section-line span {
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  white-space: nowrap;
}

.sc-performance-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--mp-space-12);
  min-width: 0;
}

.sc-app-list--wide {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding-top: 0;
}

.sc-action-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--mp-space-12);
}

.sc-action-grid .retail-action-tile {
  align-items: flex-start;
  text-align: left;
}

.sc-action-grid .retail-action-tile__desc {
  max-width: 100%;
}

.sc-retail-preview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--mp-space-12);
}

.sc-location-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--mp-space-8);
  padding: var(--mp-space-14);
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-section);
  background: var(--surface-primary);
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.sc-location-row:hover {
  border-color: color-mix(in oklch, var(--cloud-retail-accent) 30%, transparent);
}

.sc-location-row strong,
.sc-location-row em,
.sc-location-row > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sc-location-row strong {
  display: block;
  color: var(--text-primary);
  font-size: var(--mp-fontSize-14);
  font-style: normal;
  font-weight: var(--mp-fontWeight-bold);
  white-space: nowrap;
}

.sc-location-row em {
  display: -webkit-box;
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
  font-style: normal;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sc-location-row > span:last-child {
  color: var(--text-primary);
  font-size: var(--mp-fontSize-18);
  font-weight: var(--mp-fontWeight-bold);
  white-space: nowrap;
}

.sc-business-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.sc-favicon-row,
.sc-cross-sell-banner,
.sc-assistant-card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-section);
  background: var(--surface-primary);
}

.sc-favicon-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--mp-space-14);
  margin-top: var(--mp-space-20);
  padding: var(--mp-space-12);
  border-style: dashed;
  background: color-mix(in oklch, var(--text-primary) 2%, var(--surface-primary));
}

.sc-favicon-row__thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-48);
  height: var(--mp-space-48);
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-section);
  background: var(--surface-secondary);
  color: var(--muted);
}

.sc-favicon-row strong,
.sc-favicon-row span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-favicon-row strong {
  color: var(--text-primary);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-bold);
}

.sc-favicon-row span {
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
}

.sc-cross-sell-banner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--mp-space-12);
  margin-top: var(--mp-space-20);
  padding: var(--mp-space-12);
  background: color-mix(in oklch, var(--accent) 5%, var(--surface-primary));
}

.sc-cross-sell-banner__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  border-radius: var(--r-chip);
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.sc-cross-sell-banner strong,
.sc-cross-sell-banner span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sc-cross-sell-banner strong {
  color: var(--text-primary);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-bold);
  white-space: nowrap;
}

.sc-cross-sell-banner span {
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
  line-height: 1.35;
}

.sc-assistant-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--mp-space-10);
  margin-top: var(--mp-space-14);
}

.sc-assistant-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--mp-space-12);
  padding: var(--mp-space-12);
}

.sc-assistant-card__header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--mp-space-6);
}

.sc-assistant-card strong,
.sc-assistant-card span {
  display: block;
}

.sc-assistant-card strong {
  color: var(--text-primary);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1.25;
}

.sc-assistant-card > div:nth-child(2) > span {
  margin-top: var(--mp-space-4);
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
  line-height: 1.35;
}

.sc-feature-list {
  display: grid;
  margin-top: var(--mp-space-14);
}

.sc-feature-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--mp-space-12);
  padding: var(--mp-space-12) 0;
}

.sc-feature-row__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--mp-space-6);
}

.sc-feature-row__title strong {
  color: var(--text-primary);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1.25;
}

.sc-feature-row__title span {
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
}

.sc-feature-row p {
  display: -webkit-box;
  overflow: hidden;
  margin: var(--mp-space-4) 0 0;
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sc-feature-row__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
}

.retail-row-icon--primary {
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.retail-row-icon--commerce {
  background: color-mix(in oklch, var(--cloud-commerce-accent) 12%, transparent);
  color: var(--cloud-commerce-text);
}

.retail-row-icon--analytics {
  background: color-mix(in oklch, var(--cloud-analytics-accent) 12%, transparent);
  color: var(--cloud-analytics-text);
}

.sc-time {
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  white-space: nowrap;
}

.sc-app-list {
  display: grid;
  gap: var(--mp-space-8);
  padding: 0 var(--mp-space-20) var(--mp-space-20);
}

.sc-app-row__initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  border-radius: var(--r-chip);
  background: var(--surface-secondary);
  color: var(--muted);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-bold);
}

@media (max-width: 1180px) {
  .sc-overview-grid {
    grid-template-columns: 1fr;
  }

  .sc-action-grid,
  .sc-performance-grid,
  .sc-app-list--wide {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .sales-channel-detail {
    gap: var(--mp-space-20);
  }

  .sc-action-grid,
  .sc-performance-grid,
  .sc-app-list--wide,
  .sc-assistant-grid,
  .sc-business-grid,
  .sc-retail-preview {
    grid-template-columns: 1fr;
  }

  .sc-retail-preview--hero {
    min-height: auto;
  }
}

@media (max-width: 520px) {
  .sc-setup-row,
  .sc-hero-url {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .sc-cross-sell-banner,
  .sc-favicon-row,
  .sc-feature-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .sc-assistant-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .sc-assistant-card > .v-btn,
  .sc-cross-sell-banner > .v-btn,
  .sc-favicon-row > .v-btn,
  .sc-feature-row__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }

  .sc-setup-row > .v-btn,
  .sc-hero-url > .v-btn {
    grid-column: 1 / -1;
    justify-self: end;
  }
}
</style>
