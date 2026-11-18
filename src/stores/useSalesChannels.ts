import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { browserStorage, keepInBrowser } from '@/stores/demoKeep'
import { demoSlot } from '@/storefront/demoStorage'
import { VITAHEAL_CHANNEL, VITAHEAL_CHANNEL_ID } from '@/storefront/vitahealDemo'

export type SalesChannelType = 'web_store' | 'offline_store'
export type SalesChannelStatus = 'connected' | 'needs_setup' | 'draft' | 'sync_issue'
export type SalesChannelHealth = 'healthy' | 'attention' | 'incomplete'
export type ConnectedCloud = 'commerce' | 'retail' | 'merchandise' | 'store_builder'
export type SalesChannelProvider = 'maropost_store_builder' | 'shopify' | 'bigcommerce' | 'magento' | 'other'
export type MerchandisingConnectionStatus = 'connected' | 'setup_required' | 'sync_issue' | 'unsupported'
export type MerchandisingConnectionHealth = 'healthy' | 'warning' | 'error' | 'syncing'
export type LocationRole = 'pos_selling' | 'pickup' | 'fulfillment' | 'warehouse'

export interface SalesChannel {
  id: string
  accountId: string
  name: string
  /** The store's number in the Maropost admin, shown as "#9 Neelam-Store". */
  storeNumber?: number
  type: SalesChannelType
  provider: SalesChannelProvider
  status: SalesChannelStatus
  health: SalesChannelHealth
  description?: string
  connectedClouds: ConnectedCloud[]
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  merchandising?: {
    status: MerchandisingConnectionStatus
    health: MerchandisingConnectionHealth
    lastSyncAt?: string
    lastActivityAt?: string
  }
  webStore?: {
    domain: string
    storeBuilderEnabled: boolean
    published: boolean
    merchandiseConnected: boolean
    /** The currency this store's prices are in (ISO 4217). Absent: the account's Maropay settlement currency. */
    currency?: string
    /** The locale its storefront formats prices in (BCP 47), e.g. "sv-SE" for "399 kr". Absent: "$399.00"-style. */
    locale?: string
    /** A store shown to prospects. Its checkout says "demo" in plain words where a prototype note would be, and its admin page has no button that leads nowhere. */
    demo?: boolean
  }
  offlineStore?: {
    locationIds: string[]
    posSetupComplete: boolean
    locationRoles: Record<string, LocationRole[]>
  }
}

export interface CreateSalesChannelPayload {
  name: string
  type: SalesChannelType
  description?: string
  domain?: string
  storeBuilderEnabled?: boolean
  merchandiseConnected?: boolean
  locationIds?: string[]
}

export const CHANNEL_TYPE_LABELS: Record<SalesChannelType, string> = {
  web_store: 'Web Store',
  offline_store: 'Offline Store',
}

export const CHANNEL_STATUS_LABELS: Record<SalesChannelStatus, string> = {
  connected: 'Connected',
  needs_setup: 'Needs setup',
  draft: 'Draft',
  sync_issue: 'Sync issue',
}

export const CHANNEL_HEALTH_LABELS: Record<SalesChannelHealth, string> = {
  healthy: 'Healthy',
  attention: 'Needs attention',
  incomplete: 'Incomplete',
}

export const CONNECTED_CLOUD_LABELS: Record<ConnectedCloud, string> = {
  commerce: 'Commerce Cloud',
  retail: 'Retail Cloud',
  merchandise: 'Merchandise Cloud',
  store_builder: 'Store Builder',
}

export const CONNECTED_CLOUD_ICONS: Record<ConnectedCloud, string> = {
  commerce: 'shopping-cart',
  retail: 'store',
  merchandise: 'sliders-horizontal',
  store_builder: 'layout-template',
}

export const LOCATION_ROLE_LABELS: Record<LocationRole, string> = {
  pos_selling: 'POS selling',
  pickup: 'Pickup',
  fulfillment: 'Fulfillment',
  warehouse: 'Warehouse',
}

const seedChannels: SalesChannel[] = [
  {
    id: 'retest-sales-notification',
    accountId: '2000290',
    name: 'Atlas Outfitters',
    type: 'web_store',
    provider: 'maropost_store_builder',
    status: 'connected',
    health: 'healthy',
    description: 'Primary DTC storefront for apparel drops, seasonal campaigns, and unified online commerce.',
    connectedClouds: ['commerce', 'merchandise', 'store_builder'],
    createdAt: '2025-12-19T09:00:00Z',
    updatedAt: '2026-05-26T06:54:00Z',
    lastActivityAt: '2026-05-26T06:54:00Z',
    merchandising: {
      status: 'connected',
      health: 'healthy',
      lastSyncAt: '2026-05-26T06:45:00Z',
      lastActivityAt: '2026-05-26T06:54:00Z',
    },
    webStore: {
      domain: 'atlas-outfitters.uat.maropost.store',
      storeBuilderEnabled: true,
      published: true,
      merchandiseConnected: true,
    },
  },
  {
    id: 'beta-sales-channel',
    accountId: '2000290',
    name: 'Beta Sales Channel',
    type: 'web_store',
    provider: 'maropost_store_builder',
    status: 'needs_setup',
    health: 'attention',
    description: 'New Store Builder storefront waiting for merchandising setup.',
    connectedClouds: ['commerce', 'store_builder'],
    createdAt: '2026-03-12T13:35:00Z',
    updatedAt: '2026-05-25T03:10:00Z',
    lastActivityAt: '2026-05-25T03:10:00Z',
    merchandising: {
      status: 'setup_required',
      health: 'warning',
      lastActivityAt: '2026-05-25T03:10:00Z',
    },
    webStore: {
      domain: 'beta-2000290.uat.maropost.store',
      storeBuilderEnabled: true,
      published: false,
      merchandiseConnected: false,
    },
  },
  {
    id: 'max-test-store',
    accountId: '2000290',
    name: 'Max Test Store',
    type: 'web_store',
    provider: 'maropost_store_builder',
    status: 'draft',
    health: 'incomplete',
    description: 'Draft web store used for theme and content testing.',
    connectedClouds: ['commerce'],
    createdAt: '2026-02-26T06:04:00Z',
    updatedAt: '2026-05-18T05:30:00Z',
    lastActivityAt: '2026-05-18T05:30:00Z',
    merchandising: {
      status: 'setup_required',
      health: 'warning',
      lastActivityAt: '2026-05-18T05:30:00Z',
    },
    webStore: {
      domain: 'max-test.uat.maropost.store',
      storeBuilderEnabled: false,
      published: false,
      merchandiseConnected: false,
    },
  },
  {
    // The real UAT store #9 (docs/rebuild/neelam-store/CRAWL-SUMMARY.md). Its creation date isn't known yet:
    // createdAt is the earliest date seen on the store, updatedAt the latest.
    id: 'neelam-store',
    accountId: '2000290',
    name: 'Neelam-Store',
    storeNumber: 9,
    type: 'web_store',
    provider: 'maropost_store_builder',
    status: 'connected',
    health: 'healthy',
    connectedClouds: ['commerce', 'store_builder'],
    createdAt: '2026-08-26T04:18:00Z',
    updatedAt: '2026-09-15T01:23:00Z',
    lastActivityAt: '2026-09-15T01:23:00Z',
    webStore: {
      domain: '2000290-9.uat.maropost.store',
      storeBuilderEnabled: true,
      published: true,
      merchandiseConnected: false,
    },
  },
  {
    id: 'pos-store',
    accountId: '2000290',
    name: 'POS Store',
    type: 'offline_store',
    provider: 'other',
    status: 'connected',
    health: 'healthy',
    description: 'Retail Cloud offline sales channel for in-person selling.',
    connectedClouds: ['retail'],
    createdAt: '2026-01-10T08:20:00Z',
    updatedAt: '2026-05-26T04:12:00Z',
    lastActivityAt: '2026-05-26T04:12:00Z',
    offlineStore: {
      locationIds: ['loc-bondi', 'loc-chadstone', 'loc-auckland', 'loc-robson'],
      posSetupComplete: true,
      locationRoles: {
        'loc-bondi': ['pos_selling', 'pickup'],
        'loc-chadstone': ['pos_selling', 'fulfillment'],
        'loc-auckland': ['pos_selling'],
        'loc-robson': ['pos_selling'],
      },
    },
  },
  {
    id: 'mall-kiosk-pos',
    accountId: '2000290',
    name: 'Mall Kiosk POS',
    type: 'offline_store',
    provider: 'other',
    status: 'needs_setup',
    health: 'attention',
    description: 'New kiosk channel waiting for register setup.',
    connectedClouds: ['retail'],
    createdAt: '2026-04-19T10:00:00Z',
    updatedAt: '2026-05-23T01:40:00Z',
    lastActivityAt: '2026-05-23T01:40:00Z',
    offlineStore: {
      locationIds: ['loc-soho'],
      posSetupComplete: false,
      locationRoles: {
        'loc-soho': ['pos_selling'],
      },
    },
  },
  {
    id: 'shopify-fashion',
    accountId: '2000290',
    name: 'Fashion Boutique',
    type: 'web_store',
    provider: 'shopify',
    status: 'connected',
    health: 'healthy',
    description: 'Shopify-connected storefront with catalog and search sync enabled.',
    connectedClouds: ['commerce', 'merchandise'],
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-05-26T05:22:00Z',
    lastActivityAt: '2026-05-26T05:22:00Z',
    merchandising: {
      status: 'connected',
      health: 'healthy',
      lastSyncAt: '2026-05-26T05:18:00Z',
      lastActivityAt: '2026-05-26T05:22:00Z',
    },
    webStore: {
      domain: 'fashion-boutique.myshopify.com',
      storeBuilderEnabled: false,
      published: true,
      merchandiseConnected: true,
    },
  },
  {
    id: 'shopify-home-sync',
    accountId: '2000290',
    name: 'Home & Living Shopify',
    type: 'web_store',
    provider: 'shopify',
    status: 'sync_issue',
    health: 'attention',
    description: 'Shopify-connected channel with a catalog sync requiring attention.',
    connectedClouds: ['commerce', 'merchandise'],
    createdAt: '2026-03-18T08:30:00Z',
    updatedAt: '2026-05-26T04:50:00Z',
    lastActivityAt: '2026-05-26T04:50:00Z',
    merchandising: {
      status: 'sync_issue',
      health: 'error',
      lastSyncAt: '2026-05-26T04:42:00Z',
      lastActivityAt: '2026-05-26T04:50:00Z',
    },
    webStore: {
      domain: 'home-living.myshopify.com',
      storeBuilderEnabled: false,
      published: true,
      merchandiseConnected: true,
    },
  },
  // Last on purpose: earlier positions decide the "primary store" in the Maropay scenarios and story indexes.
  VITAHEAL_CHANNEL,
]

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42)
}

function makeId(name: string, existingIds: Set<string>): string {
  const base = slugify(name) || `sales-channel-${Date.now()}`
  let candidate = base
  let count = 2
  while (existingIds.has(candidate)) {
    candidate = `${base}-${count}`
    count += 1
  }
  return candidate
}

function nowIso() {
  return new Date().toISOString()
}

/** When the demo store was connected to Merchandise Cloud, or null while it is not. */
interface KeptConnection { connectedAt: string | null }

function isKeptConnection(value: unknown): value is KeptConnection {
  const at = (value as Partial<KeptConnection> | null)?.connectedAt
  return at === null || typeof at === 'string'
}

export const useSalesChannelsStore = defineStore('salesChannels', () => {
  const channels = ref<SalesChannel[]>(seedChannels.map((channel) => ({ ...channel })))

  const allChannels = computed(() => channels.value)

  function channelsForAccount(accountId: string) {
    return channels.value.filter((channel) => channel.accountId === accountId)
  }

  function getChannel(accountId: string, channelId: string | undefined) {
    if (!channelId) return undefined
    return channels.value.find((channel) => channel.accountId === accountId && channel.id === channelId)
  }

  function webStoreChannels(accountId: string) {
    return channelsForAccount(accountId).filter((channel) => channel.type === 'web_store')
  }

  function offlineStoreChannels(accountId: string) {
    return channelsForAccount(accountId).filter((channel) => channel.type === 'offline_store')
  }

  function channelsNeedingAttention(accountId: string) {
    return channelsForAccount(accountId).filter((channel) => channel.health !== 'healthy' || channel.status !== 'connected')
  }

  function getDefaultOfflineStore(accountId: string) {
    return offlineStoreChannels(accountId)[0]
  }

  function createChannel(accountId: string, payload: CreateSalesChannelPayload) {
    const timestamp = nowIso()
    const id = makeId(payload.name, new Set(channels.value.map((channel) => channel.id)))
    const base = {
      id,
      accountId,
      name: payload.name.trim(),
      type: payload.type,
      description: payload.description?.trim() || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastActivityAt: timestamp,
    }

    const channel: SalesChannel = payload.type === 'web_store'
      ? {
          ...base,
          provider: 'maropost_store_builder',
          status: payload.storeBuilderEnabled ? 'needs_setup' : 'draft',
          health: 'incomplete',
          connectedClouds: [
            'commerce',
            ...(payload.storeBuilderEnabled ? ['store_builder' as const] : []),
            ...(payload.merchandiseConnected ? ['merchandise' as const] : []),
          ],
          webStore: {
            domain: payload.domain?.trim() || `${id}.maropost.store`,
            storeBuilderEnabled: !!payload.storeBuilderEnabled,
            published: false,
            merchandiseConnected: !!payload.merchandiseConnected,
          },
        }
      : {
          ...base,
          provider: 'other',
          status: payload.locationIds?.length ? 'needs_setup' : 'draft',
          health: 'incomplete',
          connectedClouds: ['retail'],
          offlineStore: {
            locationIds: payload.locationIds ?? [],
            posSetupComplete: false,
            locationRoles: Object.fromEntries(
              (payload.locationIds ?? []).map((locationId) => [locationId, ['pos_selling'] satisfies LocationRole[]]),
            ),
          },
        }

    channels.value.unshift(channel)
    return channel
  }

  function linkLocationToChannel(
    accountId: string,
    channelId: string,
    locationId: string,
    roles: LocationRole[] = ['pos_selling'],
  ) {
    const channel = getChannel(accountId, channelId)
    if (!channel?.offlineStore) return
    if (!channel.offlineStore.locationIds.includes(locationId)) {
      channel.offlineStore.locationIds.push(locationId)
    }
    channel.offlineStore.locationRoles[locationId] = roles
    channel.updatedAt = nowIso()
    channel.lastActivityAt = channel.updatedAt
  }

  // ── Merchandise Cloud connection ─────────────────────────────────────
  // One switch sets the three fields the admin reads (the checklist, the quick
  // action and the cloud card each read a different one), so they always agree.
  function setMerchandising(channel: SalesChannel, connectedAt: string | null): void {
    if (!channel.webStore) return
    // A new object: the seed's own is shared with the file it comes from.
    channel.webStore = { ...channel.webStore, merchandiseConnected: !!connectedAt }
    channel.connectedClouds = [...channel.connectedClouds.filter((cloud) => cloud !== 'merchandise'), ...(connectedAt ? ['merchandise' as const] : [])]
    channel.merchandising = connectedAt ? { status: 'connected', health: 'healthy', lastSyncAt: connectedAt, lastActivityAt: connectedAt } : undefined
  }

  /** Connects a web store to Merchandise Cloud: its products are searchable from now. */
  function connectMerchandising(accountId: string, channelId: string): void {
    const channel = getChannel(accountId, channelId)
    if (!channel?.webStore) return
    setMerchandising(channel, nowIso())
    channel.updatedAt = channel.merchandising!.lastSyncAt!
  }

  function disconnectMerchandising(accountId: string, channelId: string): void {
    const channel = getChannel(accountId, channelId)
    if (!channel?.webStore) return
    setMerchandising(channel, null)
    channel.updatedAt = nowIso()
  }

  // The demo store's connection is kept in the browser with the rest of its data,
  // so the storefront tab has a search box as soon as the admin tab connects.
  const demoChannel = (): SalesChannel => channels.value.find((channel) => channel.id === VITAHEAL_CHANNEL_ID)!
  const keptConnection = demoSlot('merchandise', 1, browserStorage(), isKeptConnection)
  setMerchandising(demoChannel(), keptConnection.load()?.connectedAt ?? null)
  const keptDemo = keepInBrowser(
    keptConnection,
    () => ({ connectedAt: demoChannel().merchandising?.lastSyncAt ?? null }),
    (fromOtherTab) => setMerchandising(demoChannel(), fromOtherTab?.connectedAt ?? null),
  )

  /** Disconnects the demo store again. Called by its restore (useCommerce). */
  function restoreDemo(): void {
    keptConnection.clear()
    setMerchandising(demoChannel(), null)
    keptDemo.adopt()
  }

  return {
    connectMerchandising,
    disconnectMerchandising,
    restoreDemo,
    channels,
    allChannels,
    channelsForAccount,
    getChannel,
    webStoreChannels,
    offlineStoreChannels,
    channelsNeedingAttention,
    getDefaultOfflineStore,
    createChannel,
    linkLocationToChannel,
  }
})
