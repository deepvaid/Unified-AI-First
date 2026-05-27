<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import {
  CHANNEL_HEALTH_LABELS,
  CHANNEL_STATUS_LABELS,
  CHANNEL_TYPE_LABELS,
  CONNECTED_CLOUD_ICONS,
  CONNECTED_CLOUD_LABELS,
  LOCATION_ROLE_LABELS,
  useSalesChannelsStore,
  type ConnectedCloud,
  type SalesChannel,
} from '@/stores/useSalesChannels'
import { useRetailStore } from '@/stores/useRetail'

type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default'
type ProductTarget = ConnectedCloud | 'davinci' | 'apps' | 'commerce-dashboard'

interface HeaderMetaItem {
  icon: string
  label: string
}

interface ResourceCard {
  id: string
  label: string
  value: string
  icon: string
  tone: Tone
  copyValue?: string
  target?: ProductTarget
}

interface HeroMetric {
  label: string
  value: string
  trend?: string
  positive?: boolean
}

interface KpiCard {
  label: string
  value: string
  icon: string
  tone: Tone
  trend?: string
  positive?: boolean
  caption?: string
}

interface TodayStat {
  label: string
  value: string
}

interface ActivityItem {
  id: string
  icon: string
  label: string
  title: string
  time: string
  tone: Tone
}

interface ConnectedApp {
  id: string
  name: string
  category: string
  initials: string
  connected: boolean
}

interface TeamMember {
  id: string
  name: string
  role: string
  initials: string
  tone: Tone
}

interface ModuleCard {
  id: string
  title: string
  description: string
  icon: string
  tone: Tone
  status?: string
  actionLabel: string
  target: ProductTarget
}

interface AddonCard {
  id: string
  title: string
  description: string
  icon: string
  tone: Tone
  target: ProductTarget
}

interface IdentityField {
  label: string
  value: string
}

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const retailStore = useRetailStore()

const notice = ref('')
const noticeVisible = ref(false)

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
const syncingRegisterCount = computed(() => registers.value.filter((register) => register.status === 'syncing').length)
const offlineRegisterCount = computed(() => registers.value.filter((register) => register.status === 'offline').length)
const pendingOfflineTransactions = computed(() => registers.value.reduce((sum, register) => sum + register.pendingOfflineTxns, 0))
const totalRetailSalesToday = computed(() => locations.value.reduce((sum, location) => sum + location.todaysSales, 0))
const activeAssociateCount = computed(() => associates.value.filter((associate) => associate.active).length)

const primaryActionLabel = computed(() => {
  if (!channel.value) return ''
  return channel.value.type === 'web_store'
    ? (channel.value.webStore?.storeBuilderEnabled ? 'Edit theme' : 'Set up theme')
    : 'Manage locations'
})

const previewActionLabel = computed(() => (isWebStore.value ? 'Preview' : 'Launch POS'))

const headerMeta = computed<HeaderMetaItem[]>(() => {
  const current = channel.value
  if (!current) return []
  if (current.type === 'web_store') {
    return [
      { icon: 'map-pin', label: 'Australia' },
      { icon: 'radio', label: `${current.webStore?.published ? 'Last published' : 'Last saved'} ${formatRelative(current.lastActivityAt)}` },
      { icon: 'calendar', label: `Joined ${formatDate(current.createdAt)}` },
    ]
  }

  return [
    { icon: 'map-pin', label: `${locations.value.length} location${locations.value.length === 1 ? '' : 's'}` },
    { icon: 'tablet-smartphone', label: `${onlineRegisterCount.value} of ${registers.value.length} registers online` },
    { icon: 'calendar', label: `Joined ${formatDate(current.createdAt)}` },
  ]
})

const resourceCards = computed<ResourceCard[]>(() => {
  const current = channel.value
  if (!current) return []

  if (current.type === 'web_store') {
    const domain = current.webStore?.domain ?? ''
    return [
      {
        id: 'store-url',
        label: 'Store URL',
        value: domain,
        icon: 'globe',
        tone: 'primary',
        copyValue: `https://${domain}`,
        target: 'store_builder',
      },
      {
        id: 'merch-cloud',
        label: 'Merch Cloud account',
        value: 'dashboard.findify.io/?merchantId=12033',
        icon: CONNECTED_CLOUD_ICONS.merchandise,
        tone: 'info',
        copyValue: 'dashboard.findify.io/?merchantId=12033',
        target: 'merchandise',
      },
      {
        id: 'commerce-catalog',
        label: 'Commerce catalog',
        value: '3,412 SKUs synced',
        icon: CONNECTED_CLOUD_ICONS.commerce,
        tone: 'success',
        target: 'commerce',
      },
    ]
  }

  return [
    {
      id: 'locations',
      label: 'Retail locations',
      value: `${locations.value.length} linked locations`,
      icon: 'map-pin',
      tone: 'success',
      target: 'retail',
    },
    {
      id: 'registers',
      label: 'POS fleet',
      value: `${onlineRegisterCount.value} online, ${syncingRegisterCount.value} syncing`,
      icon: 'tablet-smartphone',
      tone: offlineRegisterCount.value ? 'warning' : 'primary',
      target: 'retail',
    },
    {
      id: 'inventory-sync',
      label: 'Inventory sync',
      value: `${retailStore.stockList.length} SKUs across ${locations.value.length} locations`,
      icon: 'package-check',
      tone: 'info',
      target: 'commerce',
    },
  ]
})

const heroMetrics = computed<HeroMetric[]>(() => {
  if (isWebStore.value) {
    return [
      { label: 'Orders', value: '1,284', trend: '+8%', positive: true },
      { label: 'Conv. rate', value: formatPercent(3.42), trend: '+0.3%', positive: true },
      { label: 'Sessions', value: '37.6K', trend: '+4%', positive: true },
    ]
  }

  return [
    { label: 'Locations', value: String(locations.value.length), trend: 'all open', positive: true },
    { label: 'Registers', value: `${onlineRegisterCount.value}/${registers.value.length}`, trend: offlineRegisterCount.value ? `${offlineRegisterCount.value} offline` : 'healthy', positive: !offlineRegisterCount.value },
    { label: 'Associates', value: String(activeAssociateCount.value), trend: 'active today', positive: true },
  ]
})

const kpiCards = computed<KpiCard[]>(() => {
  if (isWebStore.value) {
    return [
      { label: 'Revenue', value: '$842K', icon: 'trending-up', tone: 'success', trend: '+12%', positive: true, caption: 'Last 30 days' },
      { label: 'Orders', value: '1,284', icon: 'shopping-bag', tone: 'primary', trend: '+8%', positive: true, caption: 'Last 30 days' },
      { label: 'Conv. rate', value: formatPercent(3.42), icon: 'mouse-pointer-click', tone: 'secondary', trend: '+0.3%', positive: true, caption: 'Storefront sessions' },
      { label: 'Sessions', value: '37.6K', icon: 'users', tone: 'info', trend: '+4%', positive: true, caption: 'Last 30 days' },
    ]
  }

  return [
    { label: 'Sales today', value: formatCurrency(totalRetailSalesToday.value), icon: 'trending-up', tone: 'success', trend: '+8.4%', positive: true, caption: 'All linked locations' },
    { label: 'Transactions', value: String(retailTransactions.value.length), icon: 'receipt', tone: 'primary', trend: '+5.2%', positive: true, caption: 'Completed and refunded' },
    { label: 'Registers online', value: `${onlineRegisterCount.value}/${registers.value.length}`, icon: 'tablet-smartphone', tone: offlineRegisterCount.value ? 'warning' : 'success', caption: pendingOfflineTransactions.value ? `${pendingOfflineTransactions.value} pending sync` : 'All devices in sync' },
    { label: 'Locations', value: String(locations.value.length), icon: 'map-pin', tone: 'info', caption: `${activeAssociateCount.value} active associates` },
  ]
})

const todayStats = computed<TodayStat[]>(() => {
  if (isWebStore.value) {
    return [
      { label: 'Visitors', value: '1,284' },
      { label: 'Orders', value: '42' },
      { label: 'Inventory', value: '3,412 SKUs' },
    ]
  }

  return [
    { label: 'Sales', value: formatCurrency(totalRetailSalesToday.value) },
    { label: 'Transactions', value: String(retailTransactions.value.length) },
    { label: 'Pending sync', value: String(pendingOfflineTransactions.value) },
  ]
})

const moduleCards = computed<ModuleCard[]>(() => {
  const current = channel.value
  if (!current) return []

  if (current.type === 'web_store') {
    return [
      {
        id: 'theme',
        title: 'Atlas v3.2',
        description: 'Edit colors, type, sections, and pages in Store Builder.',
        icon: 'palette',
        tone: 'primary',
        status: current.webStore?.published ? 'Live theme' : 'Draft theme',
        actionLabel: 'Edit theme',
        target: 'store_builder',
      },
      {
        id: 'merchandise',
        title: 'Merchandise Cloud',
        description: 'AI search, recommendations, and merchandising rules tuned to this channel.',
        icon: CONNECTED_CLOUD_ICONS.merchandise,
        tone: 'info',
        status: current.webStore?.merchandiseConnected ? 'Connected' : 'Available',
        actionLabel: current.webStore?.merchandiseConnected ? 'Manage' : 'Connect',
        target: 'merchandise',
      },
    ]
  }

  return [
    {
      id: 'retail-cloud',
      title: 'Retail Cloud POS',
      description: 'Point-of-sale, register pairing, and staff permissions for this channel.',
      icon: CONNECTED_CLOUD_ICONS.retail,
      tone: 'success',
      status: current.offlineStore?.posSetupComplete ? 'Connected' : 'Needs setup',
      actionLabel: 'Open retail',
      target: 'retail',
    },
    {
      id: 'inventory',
      title: 'Inventory sync',
      description: 'Stock and pricing are synchronized between Commerce Cloud and each location.',
      icon: 'package-check',
      tone: 'info',
      status: pendingOfflineTransactions.value ? 'Syncing' : 'Connected',
      actionLabel: 'Review stock',
      target: 'commerce',
    },
  ]
})

const addonCards = computed<AddonCard[]>(() => {
  if (isWebStore.value) {
    return [
      {
        id: 'davinci',
        title: 'Da Vinci AI',
        description: 'Draft product copy, campaigns, and dashboard widgets from a single prompt.',
        icon: 'wand-sparkles',
        tone: 'secondary',
        target: 'davinci',
      },
      {
        id: 'retail',
        title: 'Retail Cloud POS',
        description: 'Point-of-sale, inventory sync, and unified customer history across locations.',
        icon: CONNECTED_CLOUD_ICONS.retail,
        tone: 'success',
        target: 'retail',
      },
    ]
  }

  return [
    {
      id: 'davinci',
      title: 'Da Vinci AI',
      description: 'Summarize store performance and turn retail activity into dashboard widgets.',
      icon: 'wand-sparkles',
      tone: 'secondary',
      target: 'davinci',
    },
    {
      id: 'merchandise',
      title: 'Merchandise Cloud',
      description: 'Improve online discovery using retail sell-through and stock availability.',
      icon: CONNECTED_CLOUD_ICONS.merchandise,
      tone: 'info',
      target: 'merchandise',
    },
  ]
})

const activityItems = computed<ActivityItem[]>(() => {
  const current = channel.value
  if (!current) return []

  if (current.type === 'web_store') {
    return [
      { id: 'theme', icon: 'rocket', label: 'Storefront', title: 'Theme "Atlas v3.2" published', time: formatRelative(current.lastActivityAt), tone: 'primary' },
      { id: 'inventory', icon: 'package', label: 'Inventory', title: '47 SKUs auto-synced from Commerce Cloud', time: '2 h ago', tone: 'default' },
      { id: 'davinci', icon: 'sparkles', label: 'Da Vinci', title: 'Draft created - 8 product descriptions', time: 'Yesterday', tone: 'secondary' },
      { id: 'rules', icon: 'search', label: 'Merchandise', title: "Search rules updated for 'fall outerwear'", time: 'Yesterday', tone: 'info' },
    ]
  }

  return [
    { id: 'open', icon: 'store', label: 'Locations', title: `${locations.value[0]?.name ?? 'Primary location'} opened for trading`, time: formatRelative(current.lastActivityAt), tone: 'success' },
    { id: 'sync', icon: 'refresh-cw', label: 'Registers', title: `${pendingOfflineTransactions.value || 3} offline transactions queued for sync`, time: '38 min ago', tone: pendingOfflineTransactions.value ? 'warning' : 'default' },
    { id: 'register', icon: 'tablet-smartphone', label: 'Hardware', title: offlineRegisterCount.value ? `${offlineRegisterCount.value} register needs attention` : 'All registers checked in', time: '1 h ago', tone: offlineRegisterCount.value ? 'warning' : 'success' },
    { id: 'staff', icon: 'user-plus', label: 'Team', title: `${activeAssociateCount.value} active associates assigned`, time: 'Yesterday', tone: 'primary' },
  ]
})

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

const teamMembers = computed<TeamMember[]>(() => {
  if (isWebStore.value) {
    return [
      { id: 'avery', name: 'Avery R.', role: 'Owner', initials: 'AR', tone: 'primary' },
      { id: 'priya', name: 'Priya S.', role: 'Editor', initials: 'PS', tone: 'secondary' },
      { id: 'mateo', name: 'Mateo C.', role: 'Analyst', initials: 'MC', tone: 'success' },
      { id: 'jamie', name: 'Jamie L.', role: 'Viewer', initials: 'JL', tone: 'warning' },
    ]
  }

  return associates.value.slice(0, 4).map((associate, index) => ({
    id: associate.id,
    name: associate.name,
    role: associate.role.replace(/_/g, ' '),
    initials: initialsFor(associate.name),
    tone: (['primary', 'success', 'secondary', 'warning'] as Tone[])[index] ?? 'default',
  }))
})

const businessIdentity = computed<IdentityField[]>(() => {
  if (isWebStore.value) {
    return [
      { label: 'Legal name', value: 'Atlas Outfitters Ltd.' },
      { label: 'Business type', value: 'Limited Liability Company' },
      { label: 'Reg. number', value: 'AU 2 037 482 116' },
      { label: 'Phone', value: '+61 412 884 110' },
      { label: 'Public email', value: 'hello@atlasoutfitters.com' },
      { label: 'Support email', value: 'support@atlasoutfitters.com' },
      { label: 'Address', value: '234 Atlantic Avenue, Brooklyn NY' },
      { label: 'Country', value: 'United States' },
      { label: 'Joined', value: channel.value ? formatDate(channel.value.createdAt) : '' },
    ]
  }

  return [
    { label: 'Retail operator', value: channel.value?.name ?? '' },
    { label: 'Business type', value: 'Multi-location retailer' },
    { label: 'Locations', value: `${locations.value.length} active` },
    { label: 'Registers', value: `${registers.value.length} paired` },
    { label: 'Associates', value: `${associates.value.length} assigned` },
    { label: 'Support email', value: 'retailops@atlasoutfitters.com' },
  ]
})

function showNotice(message: string) {
  notice.value = message
  noticeVisible.value = true
}

function toneColor(tone: Tone) {
  return tone === 'default' ? undefined : tone
}

function channelIcon(current: SalesChannel) {
  return current.type === 'web_store' ? 'globe' : 'store'
}

function cloudTone(cloud: ConnectedCloud): Tone {
  if (cloud === 'retail') return 'success'
  if (cloud === 'merchandise') return 'info'
  if (cloud === 'store_builder') return 'primary'
  return 'success'
}

function healthColor(health: SalesChannel['health']): Tone {
  if (health === 'healthy') return 'success'
  if (health === 'attention') return 'warning'
  return 'default'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function formatCurrencyCompact(value: number) {
  return `$${formatCompactNumber(value)}`
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

function openPrimaryAction() {
  if (!channel.value) return
  if (channel.value.type === 'web_store') {
    showNotice('Store Builder prototype entry point.')
    return
  }
  openLocations()
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
  router.push({ name: 'SettingsAccountDefaults', params: { accountId: accountId.value } })
}

function openConnectedProduct(target: ProductTarget | undefined) {
  if (!target) return
  if (target === 'merchandise') {
    router.push({ name: 'MerchandisingHome', params: { accountId: accountId.value }, query: { channel: channel.value?.id } })
    return
  }
  if (target === 'retail') {
    router.push({ name: 'RetailHome', params: { accountId: accountId.value } })
    return
  }
  if (target === 'commerce' || target === 'commerce-dashboard') {
    router.push({ name: 'DashboardDetail', params: { accountId: accountId.value, dashboardId: `${accountId.value}-commerce-overview` } })
    return
  }
  if (target === 'davinci') {
    router.push({ name: 'DaVinciDashboard', params: { accountId: accountId.value } })
    return
  }
  if (target === 'apps') {
    router.push({ name: 'AppStore', params: { accountId: accountId.value } })
    return
  }
  showNotice('Store Builder prototype entry point.')
}

function openLocations() {
  if (!channel.value) return
  router.push({ name: 'SalesChannelLocations', params: { accountId: accountId.value, channelId: channel.value.id } })
}

function openLocation(locationId: string) {
  if (!channel.value) return
  router.push({
    name: 'SalesChannelLocationDetail',
    params: { accountId: accountId.value, channelId: channel.value.id, locationId },
  })
}

function openTodayDashboard() {
  const dashboardId = isWebStore.value ? `${accountId.value}-commerce-overview` : `${accountId.value}-retail`
  router.push({ name: 'DashboardDetail', params: { accountId: accountId.value, dashboardId } })
}

function locationRoleText(locationId: string) {
  const roles = channel.value?.offlineStore?.locationRoles[locationId] ?? []
  return roles.map((role) => LOCATION_ROLE_LABELS[role]).join(', ') || 'POS selling'
}

function initialsFor(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
</script>

<template>
  <div class="sales-channel-detail h-100">
    <template v-if="channel">
      <header class="sc-header">
        <nav class="sc-breadcrumbs" aria-label="Sales channel breadcrumbs">
          <RouterLink :to="{ name: 'SalesChannels', params: { accountId } }">Sales Channels</RouterLink>
          <v-icon size="15">chevron-right</v-icon>
          <span>{{ channel.name }}</span>
        </nav>

        <div class="sc-header__main">
          <div class="sc-header__identity">
            <div class="sc-header__icon" :class="`tone-${channel.type === 'web_store' ? 'primary' : 'success'}`">
              <v-icon size="30">{{ channelIcon(channel) }}</v-icon>
            </div>

            <div class="sc-header__copy">
              <div class="sc-header__title-row">
                <h1>{{ channel.name }}</h1>
                <MpStatusChip :status="CHANNEL_STATUS_LABELS[channel.status]" type="general" size="small" show-icon />
                <v-chip size="small" :color="toneColor(healthColor(channel.health))" variant="tonal" label>
                  {{ CHANNEL_HEALTH_LABELS[channel.health] }}
                </v-chip>
                <v-chip size="small" color="primary" variant="tonal" label>
                  <v-icon size="14" class="me-1">{{ channelIcon(channel) }}</v-icon>
                  {{ CHANNEL_TYPE_LABELS[channel.type] }}
                </v-chip>
              </div>

              <p>{{ channel.description }}</p>

              <div class="sc-header__meta" aria-label="Channel metadata">
                <span v-for="item in headerMeta" :key="item.label">
                  <v-icon size="15">{{ item.icon }}</v-icon>
                  {{ item.label }}
                </span>
              </div>

              <div class="sc-header__clouds" aria-label="Connected clouds">
                <v-chip
                  v-for="cloud in channel.connectedClouds"
                  :key="cloud"
                  size="small"
                  :color="toneColor(cloudTone(cloud))"
                  variant="tonal"
                  label
                >
                  <v-icon size="14" class="me-1">{{ CONNECTED_CLOUD_ICONS[cloud] }}</v-icon>
                  {{ CONNECTED_CLOUD_LABELS[cloud] }}
                </v-chip>
              </div>
            </div>
          </div>

          <div class="sc-header__actions">
            <v-btn variant="outlined" prepend-icon="external-link" class="text-none" @click="openPreview()">
              {{ previewActionLabel }}
            </v-btn>
            <v-btn variant="outlined" prepend-icon="sliders-horizontal" class="text-none" @click="openSettings">
              Platform settings
            </v-btn>
            <v-btn color="primary" variant="flat" :prepend-icon="isWebStore ? 'palette' : 'map-pin'" class="text-none" @click="openPrimaryAction">
              {{ primaryActionLabel }}
            </v-btn>
          </div>
        </div>
      </header>

      <section class="resource-grid" aria-label="Channel resources">
        <v-card v-for="card in resourceCards" :key="card.id" flat border rounded="lg" class="sc-card resource-card">
          <div class="resource-card__icon" :class="`tone-${card.tone}`">
            <v-icon size="20">{{ card.icon }}</v-icon>
          </div>
          <div class="resource-card__copy">
            <div class="resource-card__label">{{ card.label }}</div>
            <div class="resource-card__value" :title="card.value">{{ card.value }}</div>
          </div>
          <div class="resource-card__actions">
            <v-btn
              v-if="card.copyValue"
              icon="copy"
              variant="text"
              size="small"
              :aria-label="`Copy ${card.label}`"
              @click="copyValue(card.copyValue, card.label)"
            />
            <v-btn
              icon="external-link"
              variant="text"
              size="small"
              :aria-label="`Open ${card.label}`"
              @click="openConnectedProduct(card.target)"
            />
          </div>
        </v-card>
      </section>

      <section class="hero-grid">
        <v-card flat border rounded="lg" class="sc-card hero-preview">
          <template v-if="isWebStore">
            <div class="storefront-frame">
              <div class="browser-bar">
                <span />
                <span />
                <span />
                <div>{{ channel.webStore?.domain }}</div>
              </div>
              <div class="storefront-nav">
                <strong>ATLAS</strong>
                <span>New</span>
                <span>Women</span>
                <span>Men</span>
                <span>Sale</span>
                <v-spacer />
                <v-icon size="18">search</v-icon>
                <v-icon size="18">user</v-icon>
                <v-icon size="18">shopping-bag</v-icon>
              </div>
              <div class="storefront-body">
                <div class="storefront-hero-tile">
                  <div>Fall 26<br>Drop 02</div>
                  <button type="button">Shop now</button>
                </div>
                <div class="storefront-side-tile" />
                <div class="storefront-side-tile storefront-side-tile--warm" />
                <div v-for="n in 8" :key="n" class="storefront-product" :class="`storefront-product--${n}`" />
              </div>
            </div>
          </template>

          <template v-else>
            <div class="retail-frame">
              <div class="retail-frame__header">
                <div>
                  <span>Retail Cloud</span>
                  <strong>{{ channel.name }}</strong>
                </div>
                <MpStatusChip :status="offlineRegisterCount ? 'Needs attention' : 'Healthy'" type="general" size="small" show-icon />
              </div>

              <div class="retail-map">
                <button
                  v-for="(location, index) in locations"
                  :key="location.id"
                  type="button"
                  class="retail-location-dot"
                  :class="`retail-location-dot--${index + 1}`"
                  :aria-label="`Open ${location.name}`"
                  @click="openLocation(location.id)"
                >
                  <v-icon size="16">map-pin</v-icon>
                </button>
              </div>

              <div class="retail-location-list">
                <button
                  v-for="location in locations"
                  :key="location.id"
                  type="button"
                  class="retail-location-row"
                  @click="openLocation(location.id)"
                >
                  <span>
                    <strong>{{ location.name }}</strong>
                    <small>{{ locationRoleText(location.id) }}</small>
                  </span>
                  <span>{{ formatCurrency(location.todaysSales) }}</span>
                </button>
              </div>
            </div>
          </template>
        </v-card>

        <v-card flat border rounded="lg" class="sc-card hero-panel">
          <div class="hero-panel__eyebrow">{{ isWebStore ? 'Live storefront' : 'Retail network' }} - {{ formatRelative(channel.lastActivityAt) }}</div>
          <div class="hero-panel__value">{{ isWebStore ? '$842K' : formatCurrencyCompact(totalRetailSalesToday) }}</div>
          <div class="hero-panel__caption">{{ isWebStore ? 'Revenue - last 30 days' : 'Sales - today across this channel' }}</div>

          <div class="hero-panel__metrics">
            <div v-for="metric in heroMetrics" :key="metric.label" class="hero-panel__metric">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <em :class="metric.positive === false ? 'is-negative' : ''">
                <v-icon size="13">{{ metric.positive === false ? 'trending-down' : 'trending-up' }}</v-icon>
                {{ metric.trend }}
              </em>
            </div>
          </div>

          <div class="hero-panel__actions">
            <v-btn color="primary" variant="flat" prepend-icon="external-link" class="text-none" @click="isWebStore ? openPreview('desktop') : openPreview('pos')">
              {{ isWebStore ? 'Visit live storefront' : 'Launch POS preview' }}
            </v-btn>
            <v-btn variant="outlined" :prepend-icon="isWebStore ? 'smartphone' : 'map-pin'" class="text-none" @click="isWebStore ? openPreview('mobile') : openLocations()">
              {{ isWebStore ? 'Mobile preview' : 'Manage locations' }}
            </v-btn>
          </div>
        </v-card>
      </section>

      <section class="kpi-grid" aria-label="Channel performance">
        <v-card v-for="kpi in kpiCards" :key="kpi.label" flat border rounded="lg" class="sc-card kpi-card">
          <div class="kpi-card__top">
            <div class="kpi-card__icon" :class="`tone-${kpi.tone}`">
              <v-icon size="17">{{ kpi.icon }}</v-icon>
            </div>
            <span>{{ kpi.label }}</span>
          </div>
          <div class="kpi-card__value">{{ kpi.value }}</div>
          <div class="kpi-card__footer">
            <em v-if="kpi.trend" :class="kpi.positive === false ? 'is-negative' : ''">
              <v-icon size="13">{{ kpi.positive === false ? 'trending-down' : 'trending-up' }}</v-icon>
              {{ kpi.trend }}
            </em>
            <span>{{ kpi.caption }}</span>
          </div>
        </v-card>

        <v-card flat border rounded="lg" class="sc-card today-card">
          <div class="today-card__title">Today</div>
          <div v-for="stat in todayStats" :key="stat.label" class="today-card__row">
            <span>{{ stat.label }}</span>
            <strong>{{ stat.value }}</strong>
          </div>
          <button type="button" class="text-link" @click="openTodayDashboard">
            Open dashboard
            <v-icon size="15">arrow-right</v-icon>
          </button>
        </v-card>
      </section>

      <div class="content-grid">
        <main class="content-main">
          <section class="section-block">
            <div class="section-heading">
              <span>01 - Setup</span>
              <h2>{{ isWebStore ? 'Shape the storefront' : 'Run this channel in store' }}</h2>
            </div>

            <v-card
              v-for="module in moduleCards"
              :key="module.id"
              flat
              border
              rounded="lg"
              class="sc-card module-card"
            >
              <div class="module-card__icon" :class="`tone-${module.tone}`">
                <v-icon size="22">{{ module.icon }}</v-icon>
              </div>
              <div class="module-card__copy">
                <div class="module-card__title-row">
                  <h3>{{ module.title }}</h3>
                  <MpStatusChip v-if="module.status" :status="module.status" type="general" size="small" />
                </div>
                <p>{{ module.description }}</p>
              </div>
              <v-btn variant="outlined" class="text-none" append-icon="external-link" @click="openConnectedProduct(module.target)">
                {{ module.actionLabel }}
              </v-btn>
            </v-card>
          </section>

          <section class="section-block">
            <div class="section-heading">
              <span>02 - Growth</span>
              <h2>{{ isWebStore ? 'Extend this channel' : 'Connect digital operations' }}</h2>
            </div>

            <v-card
              v-for="addon in addonCards"
              :key="addon.id"
              flat
              border
              rounded="lg"
              class="sc-card addon-card"
            >
              <div class="module-card__icon" :class="`tone-${addon.tone}`">
                <v-icon size="22">{{ addon.icon }}</v-icon>
              </div>
              <div class="module-card__copy">
                <h3>{{ addon.title }} <span>available add-on</span></h3>
                <p>{{ addon.description }}</p>
              </div>
              <div class="addon-card__actions">
                <v-btn variant="text" class="text-none" @click="openConnectedProduct(addon.target)">Learn more</v-btn>
                <v-btn variant="tonal" color="primary" prepend-icon="plus" class="text-none" @click="openConnectedProduct(addon.target)">Add</v-btn>
              </div>
            </v-card>
          </section>

          <section class="section-block">
            <div class="section-heading">
              <span>03 - Trust and compliance</span>
              <h2>Business identity and legal</h2>
            </div>

            <v-card flat border rounded="lg" class="sc-card identity-card">
              <div class="identity-card__header">
                <div>
                  <h3>Business identity</h3>
                  <p>Shown on receipts, invoices, store policies, and customer notifications.</p>
                </div>
                <v-btn variant="text" prepend-icon="pencil" class="text-none" @click="openSettings">Edit</v-btn>
              </div>

              <div class="identity-grid">
                <div v-for="field in businessIdentity" :key="field.label" class="identity-field">
                  <span>{{ field.label }}</span>
                  <strong>{{ field.value }}</strong>
                </div>
              </div>

              <div v-if="isWebStore" class="upload-row">
                <div class="upload-row__thumb">
                  <v-icon size="24">image</v-icon>
                </div>
                <div>
                  <strong>Favicon</strong>
                  <p>100 x 100 px, square - not uploaded yet</p>
                </div>
                <v-spacer />
                <v-btn variant="outlined" prepend-icon="upload" class="text-none" @click="showNotice('Favicon upload prototype entry point.')">
                  Upload
                </v-btn>
              </div>
            </v-card>
          </section>
        </main>

        <aside class="side-rail" aria-label="Channel activity and apps">
          <v-card flat border rounded="lg" class="sc-card side-card">
            <div class="side-card__header">
              <h2>Activity</h2>
              <button type="button" class="text-link" @click="showNotice('Full activity feed prototype entry point.')">All</button>
            </div>

            <div class="activity-list">
              <div v-for="item in activityItems" :key="item.id" class="activity-item">
                <div class="activity-item__icon" :class="`tone-${item.tone}`">
                  <v-icon size="18">{{ item.icon }}</v-icon>
                </div>
                <div>
                  <span>{{ item.label }}</span>
                  <strong>{{ item.title }}</strong>
                </div>
                <time>{{ item.time }}</time>
              </div>
            </div>
          </v-card>

          <v-card flat border rounded="lg" class="sc-card side-card">
            <div class="side-card__header">
              <h2>Connected apps</h2>
              <button type="button" class="text-link" @click="openConnectedProduct('apps')">
                <v-icon size="15">plus</v-icon>
                Browse
              </button>
            </div>

            <div class="app-list">
              <div v-for="app in connectedApps" :key="app.id" class="app-row">
                <div class="app-row__initials">{{ app.initials }}</div>
                <div>
                  <strong>{{ app.name }}</strong>
                  <span>{{ app.category }}</span>
                </div>
                <span class="app-row__dot" :class="{ 'app-row__dot--off': !app.connected }" />
              </div>
            </div>
          </v-card>

          <v-card flat border rounded="lg" class="sc-card side-card">
            <div class="side-card__header">
              <h2>Team - {{ teamMembers.length }}</h2>
              <button type="button" class="text-link" @click="showNotice('Invite team member prototype entry point.')">
                <v-icon size="15">user-plus</v-icon>
                Invite
              </button>
            </div>

            <div class="team-list">
              <div v-for="member in teamMembers" :key="member.id" class="team-row">
                <div class="team-row__avatar" :class="`tone-${member.tone}`">{{ member.initials }}</div>
                <div>
                  <strong>{{ member.name }}</strong>
                  <span>{{ member.role }}</span>
                </div>
                <v-btn icon="more-horizontal" variant="text" size="small" :aria-label="`More actions for ${member.name}`" />
              </div>
            </div>
          </v-card>
        </aside>
      </div>

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
}

.sc-card {
  border-color: color-mix(in oklch, var(--ink) 7%, transparent) !important;
  border-radius: var(--r-section) !important;
  background: var(--surface-1) !important;
  box-shadow: 0 1px 0 color-mix(in oklch, var(--ink) 3%, transparent);
}

.sc-header {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sc-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

.sc-breadcrumbs a {
  color: var(--muted);
}

.sc-breadcrumbs a:hover {
  color: var(--ink);
}

.sc-breadcrumbs span {
  min-width: 0;
  overflow: hidden;
  color: var(--ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-header__main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 20px;
}

.sc-header__identity {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  min-width: 0;
}

.sc-header__icon,
.resource-card__icon,
.module-card__icon,
.kpi-card__icon,
.activity-item__icon,
.team-row__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sc-header__icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
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
  font-size: clamp(28px, 3vw, 42px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.05;
}

.sc-header__copy p {
  max-width: 820px;
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.45;
}

.sc-header__meta,
.sc-header__clouds {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.sc-header__meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}

.sc-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.resource-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 86px;
  padding: 16px;
}

.resource-card__icon,
.module-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
}

.resource-card__copy,
.module-card__copy {
  min-width: 0;
}

.resource-card__label,
.kpi-card__top span,
.hero-panel__eyebrow,
.section-heading span,
.activity-item span,
.identity-field span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.2;
  text-transform: uppercase;
}

.resource-card__value {
  overflow: hidden;
  margin-top: 3px;
  color: var(--ink);
  font-family: var(--mp-typography-fontFamily-mono, monospace);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-card__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(380px, 0.85fr);
  gap: 16px;
}

.hero-preview,
.hero-panel {
  min-height: 390px;
  overflow: hidden;
}

.storefront-frame,
.retail-frame {
  height: 100%;
  padding: 12px;
}

.storefront-frame {
  display: flex;
  flex-direction: column;
}

.browser-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--hairline);
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  background: var(--surface-2);
}

.browser-bar span {
  width: 10px;
  height: 10px;
  border-radius: var(--r-pill);
  background: color-mix(in oklch, var(--ink) 14%, transparent);
}

.browser-bar div {
  overflow: hidden;
  margin-left: 12px;
  padding: 4px 12px;
  border-radius: var(--r-pill);
  background: var(--surface-1);
  color: var(--muted);
  font-family: var(--mp-typography-fontFamily-mono, monospace);
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.storefront-nav {
  display: flex;
  align-items: center;
  gap: 22px;
  min-height: 54px;
  padding: 0 18px;
  border: 1px solid var(--hairline);
  border-bottom: 0;
  background: var(--surface-1);
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}

.storefront-nav strong {
  color: var(--ink);
  font-size: 20px;
  letter-spacing: 0.08em;
}

.storefront-body {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: minmax(70px, 1fr);
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px;
  border: 1px solid var(--hairline);
  border-radius: 0 0 12px 12px;
  background: color-mix(in oklch, var(--accent) 3%, var(--surface-1));
}

.storefront-hero-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  grid-column: span 2;
  grid-row: span 2;
  padding: 20px;
  border-radius: 10px;
  background: color-mix(in oklch, var(--accent) 14%, var(--surface-1));
  color: var(--ink);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.08;
}

.storefront-hero-tile button {
  min-height: 28px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--surface-1);
  cursor: default;
  font-size: 12px;
  font-weight: 700;
}

.storefront-side-tile,
.storefront-product {
  border-radius: 10px;
  background: color-mix(in oklch, var(--ink) 8%, var(--surface-1));
}

.storefront-side-tile {
  grid-column: span 2;
  background: color-mix(in oklch, var(--accent) 7%, var(--surface-1));
}

.storefront-side-tile--warm,
.storefront-product--3,
.storefront-product--6 {
  background: color-mix(in oklch, rgb(var(--v-theme-warning)) 17%, var(--surface-1));
}

.storefront-product--2,
.storefront-product--7 {
  background: color-mix(in oklch, var(--accent) 13%, var(--surface-1));
}

.storefront-product--4,
.storefront-product--8 {
  background: color-mix(in oklch, rgb(var(--v-theme-success)) 15%, var(--surface-1));
}

.storefront-product--5 {
  background: color-mix(in oklch, rgb(var(--v-theme-error)) 12%, var(--surface-1));
}

.retail-frame {
  display: grid;
  grid-template-rows: auto minmax(190px, 1fr) auto;
  gap: 14px;
}

.retail-frame__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.retail-frame__header span,
.retail-location-row small,
.app-row span,
.team-row span,
.identity-card p,
.module-card__copy p {
  color: var(--muted);
}

.retail-frame__header strong {
  display: block;
  color: var(--ink);
  font-size: 20px;
}

.retail-map {
  position: relative;
  min-height: 220px;
  border: 1px solid var(--hairline);
  border-radius: 14px;
  background:
    linear-gradient(90deg, color-mix(in oklch, var(--ink) 5%, transparent) 1px, transparent 1px),
    linear-gradient(color-mix(in oklch, var(--ink) 5%, transparent) 1px, transparent 1px),
    color-mix(in oklch, var(--accent) 5%, var(--surface-1));
  background-size: 42px 42px;
  overflow: hidden;
}

.retail-location-dot {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid color-mix(in oklch, var(--accent) 28%, var(--hairline));
  border-radius: var(--r-pill);
  background: var(--surface-1);
  color: var(--accent);
  cursor: pointer;
  box-shadow: 0 6px 18px color-mix(in oklch, var(--ink) 10%, transparent);
}

.retail-location-dot--1 { left: 18%; top: 24%; }
.retail-location-dot--2 { left: 54%; top: 42%; }
.retail-location-dot--3 { left: 72%; top: 18%; }
.retail-location-dot--4 { left: 38%; top: 66%; }

.retail-location-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.retail-location-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
  min-height: 82px;
  padding: 12px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--surface-1);
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.retail-location-row strong,
.retail-location-row small,
.retail-location-row > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.retail-location-row strong,
.app-row strong,
.team-row strong,
.identity-field strong {
  color: var(--ink);
  font-size: 13px;
  line-height: 1.25;
}

.retail-location-row > span:last-child {
  color: var(--ink);
  font-size: 14px;
  font-weight: 800;
}

.hero-panel {
  display: flex;
  flex-direction: column;
  padding: 28px;
}

.hero-panel__value {
  margin-top: 10px;
  color: var(--ink);
  font-size: clamp(52px, 7vw, 76px);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 0.95;
}

.hero-panel__caption {
  margin-top: 12px;
  color: var(--muted);
  font-size: 15px;
  font-weight: 600;
}

.hero-panel__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 34px;
}

.hero-panel__metric {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
}

.hero-panel__metric span,
.today-card__title {
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-panel__metric strong {
  display: block;
  margin-top: 6px;
  color: var(--ink);
  font-size: 22px;
  line-height: 1.1;
}

.hero-panel__metric em,
.kpi-card__footer em {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 8px;
  border-radius: var(--r-pill);
  color: var(--pos);
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
}

.hero-panel__metric em.is-negative,
.kpi-card__footer em.is-negative {
  color: var(--neg);
}

.hero-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto;
  padding-top: 24px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(170px, 1fr)) minmax(240px, 1.25fr);
  gap: 12px;
}

.kpi-card,
.today-card {
  min-height: 160px;
  padding: 18px;
}

.kpi-card__top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kpi-card__icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
}

.kpi-card__value {
  margin-top: 16px;
  color: var(--ink);
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
}

.kpi-card__footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.today-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.today-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--muted);
  font-size: 14px;
}

.today-card__row strong {
  color: var(--ink);
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  min-height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(330px, 0.36fr);
  align-items: start;
  gap: 24px;
}

.content-main,
.side-rail,
.section-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.section-block + .section-block {
  margin-top: 24px;
}

.section-heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 14px;
}

.section-heading h2 {
  margin: 0;
  color: var(--ink);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.15;
}

.module-card,
.addon-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  min-height: 104px;
  padding: 18px;
}

.module-card__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.module-card h3,
.identity-card h3,
.side-card h2 {
  margin: 0;
  color: var(--ink);
  font-size: 17px;
  font-weight: 800;
  line-height: 1.25;
}

.module-card h3 span {
  color: var(--muted);
  font-weight: 600;
}

.module-card__copy p,
.identity-card p {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.4;
}

.addon-card__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.identity-card {
  padding: 22px;
}

.identity-card__header,
.side-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.identity-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px 24px;
  margin-top: 22px;
}

.identity-field {
  min-width: 0;
}

.identity-field span,
.identity-field strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-field strong {
  margin-top: 6px;
  font-size: 15px;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 26px;
  padding: 16px;
  border: 1px dashed color-mix(in oklch, var(--ink) 18%, transparent);
  border-radius: 14px;
  background: color-mix(in oklch, var(--ink) 2%, var(--surface-1));
}

.upload-row__thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--muted);
}

.upload-row strong {
  color: var(--ink);
}

.upload-row p {
  margin: 3px 0 0;
}

.side-card {
  padding: 18px;
}

.activity-list,
.app-list,
.team-list {
  display: flex;
  flex-direction: column;
  margin-top: 14px;
}

.activity-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid var(--hairline);
}

.activity-item:first-child {
  border-top: 0;
  padding-top: 0;
}

.activity-item__icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
}

.activity-item strong {
  display: block;
  margin-top: 4px;
  color: var(--ink);
  font-size: 14px;
  line-height: 1.3;
}

.activity-item time {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.app-row,
.team-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  padding: 10px 0;
  border-top: 1px solid var(--hairline);
}

.app-row:first-child,
.team-row:first-child {
  border-top: 0;
}

.app-row__initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--surface-2);
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.app-row strong,
.app-row span,
.team-row strong,
.team-row span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-row__dot {
  width: 9px;
  height: 9px;
  border-radius: var(--r-pill);
  background: rgb(var(--v-theme-success));
}

.app-row__dot--off {
  background: color-mix(in oklch, var(--ink) 18%, transparent);
}

.team-row__avatar {
  width: 38px;
  height: 38px;
  border-radius: var(--r-pill);
  color: currentColor;
  font-size: 12px;
  font-weight: 900;
}

.tone-primary {
  background: color-mix(in oklch, var(--accent) 14%, transparent);
  color: var(--accent);
}

.tone-success {
  background: color-mix(in oklch, rgb(var(--v-theme-success)) 14%, transparent);
  color: rgb(var(--v-theme-success));
}

.tone-warning {
  background: color-mix(in oklch, rgb(var(--v-theme-warning)) 16%, transparent);
  color: rgb(var(--v-theme-warning));
}

.tone-error {
  background: color-mix(in oklch, rgb(var(--v-theme-error)) 14%, transparent);
  color: rgb(var(--v-theme-error));
}

.tone-info {
  background: color-mix(in oklch, rgb(var(--v-theme-info)) 14%, transparent);
  color: rgb(var(--v-theme-info));
}

.tone-secondary {
  background: color-mix(in oklch, rgb(var(--v-theme-secondary)) 12%, transparent);
  color: rgb(var(--v-theme-secondary));
}

.tone-default {
  background: color-mix(in oklch, var(--ink) 7%, transparent);
  color: var(--muted);
}

@media (max-width: 1180px) {
  .sc-header__main,
  .hero-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .sc-header__actions {
    justify-content: flex-start;
  }

  .resource-grid,
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .sales-channel-detail {
    gap: 18px;
  }

  .sc-header__identity {
    flex-direction: column;
    gap: 12px;
  }

  .sc-header__title-row h1 {
    font-size: 30px;
  }

  .sc-header__actions,
  .hero-panel__actions,
  .addon-card__actions {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }

  .sc-header__actions :deep(.v-btn),
  .hero-panel__actions :deep(.v-btn),
  .addon-card__actions :deep(.v-btn) {
    width: 100%;
  }

  .resource-grid,
  .kpi-grid,
  .hero-panel__metrics,
  .retail-location-list,
  .identity-grid {
    grid-template-columns: 1fr;
  }

  .resource-card,
  .module-card,
  .addon-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .resource-card__actions,
  .module-card > .v-btn,
  .addon-card__actions {
    grid-column: 1 / -1;
  }

  .storefront-nav {
    gap: 12px;
    overflow-x: auto;
  }

  .storefront-body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-preview,
  .hero-panel {
    min-height: 0;
  }

  .hero-panel {
    padding: 22px;
  }

  .upload-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
