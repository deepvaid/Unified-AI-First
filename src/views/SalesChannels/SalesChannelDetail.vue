<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import {
  CHANNEL_STATUS_LABELS,
  CHANNEL_TYPE_LABELS,
  CONNECTED_CLOUD_ICONS,
  LOCATION_ROLE_LABELS,
  useSalesChannelsStore,
  type ConnectedCloud,
} from '@/stores/useSalesChannels'
import { useRetailStore } from '@/stores/useRetail'

type MetricColor = 'primary' | 'retail' | 'commerce' | 'analytics' | 'contacts' | 'success' | 'warning'
type DetailTab = 'overview' | 'settings' | 'apps' | 'ai' | 'activity'
type ProductTarget =
  | ConnectedCloud
  | 'apps'
  | 'dashboard'
  | 'davinci'
  | 'chatbot'
  | 'inventory'
  | 'locations'
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
  connected: boolean
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

const notice = ref('')
const noticeVisible = ref(false)
const addedAssistantIds = ref<string[]>([])
const activeTab = ref<DetailTab>('overview')
const showCompletedSetup = ref(false)

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

const locations = computed(() => {
  if (!channel.value?.offlineStore) return []
  const ids = new Set(channel.value.offlineStore.locationIds)
  return retailStore.locationList.filter((location) => ids.has(location.id))
})

const registers = computed(() => {
  const ids = new Set(locations.value.map((location) => location.id))
  return retailStore.registerList.filter((register) => ids.has(register.locationId))
})

const associates = computed(() => {
  const ids = new Set(locations.value.map((location) => location.id))
  return retailStore.associateList.filter((associate) => associate.locationIds.some((id) => ids.has(id)))
})

const retailTransactions = computed(() => {
  const ids = new Set(locations.value.map((location) => location.id))
  return retailStore.transactionList.filter((transaction) => ids.has(transaction.locationId))
})

const onlineRegisterCount = computed(() => registers.value.filter((register) => register.status === 'online').length)
const offlineRegisterCount = computed(() => registers.value.filter((register) => register.status === 'offline').length)
const pendingOfflineTransactions = computed(() => registers.value.reduce((sum, register) => sum + register.pendingOfflineTxns, 0))
const totalRetailSalesToday = computed(() => locations.value.reduce((sum, location) => sum + location.todaysSales, 0))
const activeAssociateCount = computed(() => associates.value.filter((associate) => associate.active).length)
const averageBasket = computed(() => {
  const completed = retailTransactions.value.filter((transaction) => transaction.total > 0)
  if (!completed.length) return 0
  return completed.reduce((sum, transaction) => sum + transaction.total, 0) / completed.length
})

const primaryActionLabel = computed(() => {
  if (!channel.value) return ''
  if (channel.value.type === 'offline_store') return 'Launch POS'
  return channel.value.webStore?.storeBuilderEnabled ? 'Edit theme' : 'Set up theme'
})

const secondaryActionLabel = computed(() => (isWebStore.value ? 'Preview' : 'Manage locations'))

const detailTabs = computed<Array<{ label: string; value: DetailTab }>>(() => [
  { label: 'Overview', value: 'overview' },
  { label: 'Settings', value: 'settings' },
  { label: 'Apps', value: 'apps' },
  { label: 'AI & automation', value: 'ai' },
  { label: 'Activity', value: 'activity' },
])

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

const setupChecklist = computed<SetupItem[]>(() => {
  const current = channel.value
  if (!current) return []

  if (current.type === 'web_store') {
    return [
      { id: 'domain', title: 'Store URL', description: current.webStore?.domain ?? 'Add a storefront domain', done: Boolean(current.webStore?.domain), target: 'preview' },
      { id: 'theme', title: 'Theme ready', description: current.webStore?.published ? 'Published theme is live' : 'Publish the draft theme', done: Boolean(current.webStore?.published), target: 'store_builder' },
      { id: 'merchandise', title: 'Merchandising connected', description: 'Search and recommendations are active', done: Boolean(current.webStore?.merchandiseConnected), target: 'merchandise' },
      { id: 'legal', title: 'Legal pages', description: 'Review privacy and returns', done: false, target: 'settings' },
      { id: 'apps', title: 'Connected apps', description: 'Payments and fulfillment are connected', done: true, target: 'apps' },
    ]
  }

  return [
    { id: 'locations', title: 'Locations linked', description: `${locations.value.length} locations assigned`, done: locations.value.length > 0, target: 'locations' },
    { id: 'registers', title: 'Registers paired', description: `${registers.value.length} devices in this channel`, done: registers.value.length > 0, target: 'registers' },
    { id: 'associates', title: 'Associates added', description: `${activeAssociateCount.value} active associates`, done: activeAssociateCount.value > 0, target: 'locations' },
    { id: 'receipt', title: 'Receipt template', description: 'Add logo and contact details', done: Boolean(channel.value?.offlineStore?.posSetupComplete), target: 'settings' },
    { id: 'payments', title: 'Payment terminals', description: 'Stripe Terminal or Tap to Pay', done: registers.value.some((register) => register.pairedTerminal), target: 'registers' },
  ]
})

const completedSetupCount = computed(() => setupChecklist.value.filter((item) => item.done).length)
const pendingSetupItems = computed(() => setupChecklist.value.filter((item) => !item.done))
const completedSetupItems = computed(() => setupChecklist.value.filter((item) => item.done))
const visibleSetupItems = computed(() => pendingSetupItems.value.slice(0, 2))
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
    { id: 'staff', icon: 'user-plus', title: 'Associates active', meta: `${activeAssociateCount.value} assigned`, time: 'Yesterday', color: 'primary' },
  ]
})

const overviewActivityItems = computed(() => activityItems.value.slice(0, 3))

const connectedApps = computed<ConnectedApp[]>(() => {
  if (isWebStore.value) {
    return [
      { id: 'stripe', name: 'Stripe', category: 'Payments', initials: 'ST', connected: true },
      { id: 'shipstation', name: 'ShipStation', category: 'Fulfillment', initials: 'SH', connected: true },
      { id: 'meta', name: 'Meta Ads', category: 'Ads', initials: 'ME', connected: true },
      { id: 'google', name: 'Google Ads', category: 'Ads', initials: 'GO', connected: false },
    ]
  }

  return [
    { id: 'stripe-terminal', name: 'Stripe Terminal', category: 'Payments', initials: 'ST', connected: true },
    { id: 'tap-to-pay', name: 'Tap to Pay', category: 'Hardware', initials: 'TP', connected: true },
    { id: 'xero', name: 'Xero', category: 'Accounting', initials: 'XE', connected: false },
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

const sparklinePoints = computed(() => {
  const values = isWebStore.value
    ? [0.24, 0.28, 0.33, 0.38, 0.42, 0.47, 0.53, 0.57, 0.64, 0.68, 0.76]
    : [0.30, 0.35, 0.43, 0.40, 0.52, 0.48, 0.60, 0.56, 0.68, 0.63, 0.78]
  const maxIndex = values.length - 1
  return values.map((value, index) => `${((index / maxIndex) * 100).toFixed(1)},${(48 - value * 38).toFixed(1)}`).join(' ')
})

function showNotice(message: string) {
  notice.value = message
  noticeVisible.value = true
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
  showNotice('Store Builder prototype entry point.')
}

function openPreview(mode: 'desktop' | 'mobile' | 'pos' = 'desktop') {
  if (!channel.value) return
  if (channel.value.type === 'offline_store' || mode === 'pos') {
    router.push({ name: 'RetailPosPreview', params: { accountId: accountId.value } })
    return
  }
  showNotice(mode === 'mobile' ? 'Mobile storefront preview opened.' : 'Storefront preview opened.')
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
    router.push({ name: 'MerchandisingHome', params: { accountId: accountId.value }, query: { channel: channel.value?.id } })
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
  showNotice('Store Builder prototype entry point.')
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
    router.push({ name: 'Chatbot', params: { accountId: accountId.value } })
    return
  }
  if (target === 'shopping_assistant') {
    router.push({ name: 'MerchandisingRecommendations', params: { accountId: accountId.value } })
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
    router.push({ name: 'RetailBulkInventory', params: { accountId: accountId.value } })
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
      <header class="sc-header">
        <v-btn
          class="sc-back-button text-none"
          variant="outlined"
          size="small"
          prepend-icon="arrow-left"
          :to="{ name: 'SalesChannels', params: { accountId } }"
        >
          All sales channels
        </v-btn>

        <div class="sc-header__row">
          <div class="sc-header__identity">
            <div class="sc-header__icon" :class="isWebStore ? 'sc-header__icon--web' : 'sc-header__icon--retail'">
              <v-icon size="24">{{ isWebStore ? 'globe' : 'store' }}</v-icon>
            </div>

            <div class="sc-header__copy">
              <div class="sc-header__title-row">
                <h1 class="text-h5 font-weight-bold">{{ channel.name }}</h1>
                <MpStatusChip :status="CHANNEL_STATUS_LABELS[channel.status]" type="general" size="small" show-icon />
              </div>
              <div class="sc-header__meta" aria-label="Channel metadata">
                <span v-for="item in headerMeta" :key="item">{{ item }}</span>
              </div>
            </div>
          </div>

          <div class="sc-header__actions">
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
          </div>
        </div>
      </header>

      <v-tabs v-model="activeTab" class="sc-tabs" density="compact" color="primary" show-arrows>
        <v-tab v-for="tab in detailTabs" :key="tab.value" :value="tab.value" class="text-none">
          {{ tab.label }}
        </v-tab>
      </v-tabs>

      <section v-if="activeTab === 'overview'" class="sc-tab-panel">
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
              <div v-if="isWebStore" class="sc-store-preview sc-store-preview--hero" aria-label="Storefront preview">
                <div class="sc-store-preview__bar">
                  <span />
                  <span />
                  <span />
                  <strong>Storefront</strong>
                </div>
                <div class="sc-store-preview__nav">
                  <strong>ATLAS</strong>
                  <span>New</span>
                  <span>Women</span>
                  <span>Men</span>
                  <span>Sale</span>
                </div>
                <div class="sc-store-preview__body">
                  <div class="sc-store-preview__hero">
                    <strong>Fall 26<br>Drop 02</strong>
                    <span>Shop now</span>
                  </div>
                  <div v-for="n in 5" :key="n" class="sc-store-preview__tile" :class="`sc-store-preview__tile--${n}`" />
                </div>
              </div>

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
                <v-icon size="15">globe</v-icon>
                <span>{{ channel.webStore.domain }}</span>
                <v-btn
                  size="small"
                  variant="text"
                  icon="copy"
                  aria-label="Copy store URL"
                  @click="copyValue(`https://${channel.webStore?.domain}`, 'Store URL')"
                />
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
              <v-progress-linear :model-value="setupProgress" height="5" rounded color="primary" />
            </div>
            <div class="retail-widget-body sc-setup-body">
              <div v-if="visibleSetupItems.length" class="sc-setup-list">
                <div v-for="item in visibleSetupItems" :key="item.id" class="sc-setup-row">
                  <v-icon size="18">circle</v-icon>
                  <div class="min-width-0">
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.description }}</span>
                  </div>
                  <v-btn size="small" color="primary" variant="tonal" class="text-none" @click="runAction(item.target)">
                    {{ setupActionLabel(item) }}
                  </v-btn>
                </div>
              </div>
              <div v-else class="sc-setup-empty">
                <v-icon size="18" color="success">check-circle-2</v-icon>
                <span>No urgent setup items.</span>
              </div>

              <button v-if="completedSetupItems.length" type="button" class="sc-text-button sc-completed-toggle" @click="showCompletedSetup = !showCompletedSetup">
                {{ showCompletedSetup ? 'Hide completed' : 'View completed' }}
              </button>
              <div v-if="showCompletedSetup" class="sc-completed-list">
                <div v-for="item in completedSetupItems" :key="item.id" class="sc-completed-row">
                  <v-icon size="15" color="success">check-circle-2</v-icon>
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
            <h2 id="sales-channel-performance-title">Performance snapshot</h2>
            <span>Last 30 days</span>
          </div>
          <div class="sc-performance-grid">
            <v-card v-for="kpi in kpiCards" :key="kpi.label" flat border rounded="lg" class="sc-mini-kpi">
              <div class="sc-mini-kpi__top">
                <span class="retail-row-icon" :class="`retail-row-icon--${kpi.color}`">
                  <v-icon size="14">{{ kpi.icon }}</v-icon>
                </span>
                <span>{{ kpi.label }}</span>
              </div>
              <div class="sc-mini-kpi__value num">{{ kpi.value }}</div>
              <div v-if="kpi.trend" class="sc-mini-kpi__trend">
                <v-icon size="12">{{ kpi.trendPositive ? 'chevron-up' : 'chevron-down' }}</v-icon>
                {{ kpi.trend }}
              </div>
              <div v-else-if="kpi.subStat" class="sc-mini-kpi__sub">{{ kpi.subStat }}</div>
              <svg v-if="kpi.trend" class="sc-mini-kpi__sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
                <polyline :points="sparklinePoints" />
              </svg>
            </v-card>
          </div>
        </section>

        <v-card flat border rounded="lg" class="retail-widget-card sc-activity-card">
          <div class="retail-widget-header">
            <div class="retail-widget-header__title">Recent activity</div>
            <button type="button" class="sc-text-button" @click="activeTab = 'activity'">View all</button>
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

      <section v-else-if="activeTab === 'settings'" class="sc-tab-panel">
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
            <div class="sc-business-grid">
              <div v-for="field in businessInfoFields" :key="field.label" class="sc-business-field">
                <span>{{ field.label }}</span>
                <strong>{{ field.value }}</strong>
              </div>
            </div>
            <div v-if="isWebStore" class="sc-favicon-row">
              <div class="sc-favicon-row__thumb">
                <v-icon size="22">image</v-icon>
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

      <section v-else-if="activeTab === 'apps'" class="sc-tab-panel">
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
          <div class="sc-app-list sc-app-list--wide">
            <div v-for="app in connectedApps" :key="app.id" class="sc-app-row">
              <div class="sc-app-row__initials">{{ app.initials }}</div>
              <div class="min-width-0">
                <strong>{{ app.name }}</strong>
                <span>{{ app.category }}</span>
              </div>
              <span class="sc-status-dot" :class="{ 'sc-status-dot--off': !app.connected }" />
            </div>
          </div>
        </v-card>
      </section>

      <section v-else-if="activeTab === 'ai'" class="sc-tab-panel">
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
                <v-icon size="18">sparkles</v-icon>
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
              <div v-for="feature in crossSellFeatures" :key="feature.id" class="sc-feature-row">
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
            </div>
          </div>
        </v-card>
      </section>

      <section v-else class="sc-tab-panel">
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

      <v-snackbar v-model="noticeVisible" timeout="2400" color="surface" location="bottom right">
        {{ notice }}
      </v-snackbar>
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
  gap: 24px;
  min-width: 0;
}

.sc-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sc-back-button {
  width: fit-content;
}

.sc-header__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 20px;
}

.sc-header__identity {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.sc-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: var(--r-section);
}

.sc-header__icon--web {
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.sc-header__icon--retail {
  background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent);
  color: var(--cloud-retail-text);
}

.sc-header__copy {
  min-width: 0;
}

.sc-header__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.sc-header__title-row h1 {
  margin: 0;
  color: var(--ink);
  line-height: 1.2;
}

.sc-header__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 9px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}

.sc-header__meta span {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.sc-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.sc-tabs {
  min-width: 0;
  border-bottom: 1px solid var(--hairline);
}

.sc-tabs :deep(.v-slide-group__content) {
  gap: 4px;
}

.sc-tabs :deep(.v-tab) {
  min-height: 36px;
  padding: 0 10px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.sc-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.sc-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  align-items: stretch;
  gap: 20px;
  min-width: 0;
}

.sc-hero-card,
.sc-setup-card {
  min-width: 0;
}

.sc-store-preview--hero .sc-store-preview__body {
  grid-auto-rows: minmax(86px, 1fr);
  min-height: 344px;
}

.sc-retail-preview--hero {
  align-content: start;
}

.sc-hero-url {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  min-height: 40px;
  padding: 6px 10px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-section);
  background: var(--surface-2);
  color: var(--muted);
  font-family: var(--mp-typography-fontFamily-mono, monospace);
  font-size: 12px;
  font-weight: 700;
}

.sc-hero-url span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-setup-card .retail-widget-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sc-setup-list,
.sc-completed-list {
  display: grid;
  gap: 10px;
}

.sc-setup-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid color-mix(in oklch, var(--accent) 22%, var(--hairline));
  border-radius: var(--r-section);
  background: color-mix(in oklch, var(--accent) 5%, var(--surface-1));
}

.sc-setup-row strong,
.sc-setup-row span,
.sc-setup-empty span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sc-setup-row strong {
  color: var(--ink);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
  white-space: nowrap;
}

.sc-setup-row span,
.sc-setup-empty span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
}

.sc-setup-empty,
.sc-completed-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sc-completed-toggle {
  width: fit-content;
}

.sc-completed-row {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.sc-action-grid--compact {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.retail-action-tile--compact {
  min-height: 94px;
  padding: 13px;
}

.retail-action-tile--compact .retail-action-tile__desc {
  font-size: 12px;
  line-height: 1.25;
  white-space: nowrap;
}

.sc-performance-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sc-section-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.sc-section-line h2 {
  margin: 0;
  color: var(--ink);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.3;
}

.sc-section-line span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.sc-performance-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
}

.sc-mini-kpi {
  position: relative;
  overflow: hidden;
  min-height: 142px;
  padding: 14px;
}

.sc-mini-kpi__top {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sc-mini-kpi__top > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-mini-kpi__value {
  margin-top: 18px;
  color: var(--ink);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 800;
  line-height: 1;
}

.sc-mini-kpi__trend,
.sc-mini-kpi__sub {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 10px;
  color: var(--pos);
  font-size: 13px;
  font-weight: 800;
}

.sc-mini-kpi__sub {
  color: var(--muted);
}

.sc-mini-kpi__sparkline {
  position: absolute;
  right: 14px;
  bottom: 12px;
  width: 42%;
  height: 36px;
  color: var(--accent);
  opacity: 0.72;
}

.sc-mini-kpi__sparkline polyline {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.sc-app-list--wide {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding-top: 0;
}

.sc-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(330px, 0.65fr);
  align-items: start;
  gap: 24px;
}

.sc-main-stack,
.sc-side-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.sc-action-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.sc-action-grid .retail-action-tile {
  align-items: flex-start;
  text-align: left;
}

.sc-action-grid .retail-action-tile__desc {
  max-width: 100%;
}

.sc-store-preview {
  overflow: hidden;
  border: 1px solid var(--hairline);
  border-radius: var(--r-section);
  background: var(--surface-1);
}

.sc-store-preview__bar {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 12px;
  border-bottom: 1px solid var(--hairline);
  background: var(--surface-2);
}

.sc-store-preview__bar span {
  width: 9px;
  height: 9px;
  border-radius: var(--r-pill);
  background: color-mix(in oklch, var(--ink) 16%, transparent);
}

.sc-store-preview__bar strong {
  overflow: hidden;
  margin-left: 8px;
  color: var(--muted);
  font-family: var(--mp-typography-fontFamily-mono, monospace);
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-store-preview__nav {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 46px;
  padding: 0 16px;
  border-bottom: 1px solid var(--hairline);
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

.sc-store-preview__nav strong {
  color: var(--ink);
  font-size: 18px;
  letter-spacing: 0.08em;
}

.sc-store-preview__body {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: minmax(70px, 1fr);
  gap: 12px;
  min-height: 218px;
  padding: 14px;
  background: color-mix(in oklch, var(--accent) 3%, var(--surface-1));
}

.sc-store-preview__hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  grid-column: span 2;
  grid-row: span 2;
  padding: 18px;
  border-radius: var(--r-section);
  background: color-mix(in oklch, var(--accent) 13%, var(--surface-1));
  color: var(--ink);
}

.sc-store-preview__hero strong {
  font-size: 22px;
  line-height: 1.08;
}

.sc-store-preview__hero span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--surface-1);
  font-size: 12px;
  font-weight: 700;
}

.sc-store-preview__tile {
  border-radius: var(--r-section);
  background: color-mix(in oklch, var(--ink) 7%, var(--surface-1));
}

.sc-store-preview__tile--2,
.sc-store-preview__tile--5 {
  background: color-mix(in oklch, var(--accent) 10%, var(--surface-1));
}

.sc-store-preview__tile--3 {
  background: color-mix(in oklch, rgb(var(--v-theme-warning)) 14%, var(--surface-1));
}

.sc-store-preview__tile--4 {
  background: color-mix(in oklch, rgb(var(--v-theme-success)) 12%, var(--surface-1));
}

.sc-retail-preview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.sc-location-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  min-height: 112px;
  padding: 14px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-section);
  background: var(--surface-1);
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
  color: var(--ink);
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  white-space: nowrap;
}

.sc-location-row em {
  display: -webkit-box;
  color: var(--muted);
  font-size: 12px;
  font-style: normal;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sc-location-row > span:last-child {
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.sc-resource-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.sc-resource-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 10px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-section);
}

.sc-resource-row__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.sc-business-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 18px;
}

.sc-business-field {
  min-width: 0;
}

.sc-business-field span,
.sc-business-field strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-business-field span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1.2;
  text-transform: uppercase;
}

.sc-business-field strong {
  margin-top: 5px;
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
}

.sc-favicon-row,
.sc-cross-sell-banner,
.sc-assistant-card,
.sc-feature-row {
  border: 1px solid var(--hairline);
  border-radius: var(--r-section);
  background: var(--surface-1);
}

.sc-favicon-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  margin-top: 18px;
  padding: 12px;
  border-style: dashed;
  background: color-mix(in oklch, var(--ink) 2%, var(--surface-1));
}

.sc-favicon-row__thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-section);
  background: var(--surface-2);
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
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
}

.sc-favicon-row span {
  color: var(--muted);
  font-size: 12px;
}

.sc-cross-sell-banner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  padding: 12px;
  background: color-mix(in oklch, var(--accent) 5%, var(--surface-1));
}

.sc-cross-sell-banner__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
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
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.sc-cross-sell-banner span {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}

.sc-assistant-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.sc-assistant-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
  padding: 12px;
}

.sc-assistant-card__header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.sc-assistant-card strong,
.sc-assistant-card span {
  display: block;
}

.sc-assistant-card strong {
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
}

.sc-assistant-card > div:nth-child(2) > span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}

.sc-feature-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.sc-feature-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.sc-feature-row__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.sc-feature-row__title strong {
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
}

.sc-feature-row__title span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.sc-feature-row p {
  display: -webkit-box;
  overflow: hidden;
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sc-feature-row__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.sc-is-done {
  color: var(--muted);
  text-decoration: line-through;
}

.sc-text-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
}

.sc-text-button:hover {
  color: rgb(var(--v-theme-primary));
}

.sc-time {
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.sc-app-list {
  display: grid;
  gap: 8px;
  padding: 0 22px 20px;
}

.sc-app-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 54px;
  padding: 10px 12px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-section);
}

.sc-app-row__initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-chip);
  background: var(--surface-2);
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.sc-app-row strong,
.sc-app-row span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-app-row strong {
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
}

.sc-app-row span {
  color: var(--muted);
  font-size: 12px;
}

.sc-status-dot {
  width: 9px;
  height: 9px;
  border-radius: var(--r-pill);
  background: var(--pos);
}

.sc-status-dot--off {
  background: color-mix(in oklch, var(--ink) 18%, transparent);
}

@media (max-width: 1180px) {
  .sc-header__row,
  .sc-grid,
  .sc-overview-grid {
    grid-template-columns: 1fr;
  }

  .sc-header__actions {
    justify-content: flex-start;
  }

  .sc-action-grid,
  .sc-performance-grid,
  .sc-app-list--wide {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .sales-channel-detail {
    gap: 18px;
  }

  .sc-header__identity {
    gap: 12px;
  }

  .sc-header__actions {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }

  .sc-header__actions :deep(.v-btn) {
    width: 100%;
  }

  .sc-action-grid,
  .sc-performance-grid,
  .sc-app-list--wide,
  .sc-assistant-grid,
  .sc-business-grid,
  .sc-retail-preview,
  .sc-store-preview__body {
    grid-template-columns: 1fr;
  }

  .sc-store-preview__hero {
    grid-column: auto;
    grid-row: auto;
    min-height: 150px;
  }

  .sc-store-preview--hero .sc-store-preview__body,
  .sc-retail-preview--hero {
    min-height: auto;
  }

  .sc-store-preview__nav {
    gap: 12px;
    overflow-x: auto;
  }
}

@media (max-width: 520px) {
  .sc-header__identity {
    flex-direction: column;
  }

  .sc-resource-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

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
  .sc-feature-row__actions,
  .sc-resource-row__actions {
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
