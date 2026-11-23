import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { browserStorage, keepPerChannel } from '@/stores/demoKeep'
import { DEMO_STORES, canApplyTheme, homeBlueprintOf } from '@/storefront/demoStores'
import { currentBlueprintId, snapshotFor } from '@/storefront/demoStores/install'
import type { InstallChannel } from '@/storefront/demoStores/install'
import type { StoreBlueprintRef, StoreSnapshot } from '@/storefront/demoStores/types'
import { localDateKey } from '@/maropay/model'

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
    /** Set on a store that can take a theme from the library (src/storefront/demoStores/): what it started from, and its slot. */
    blueprint?: StoreBlueprintRef
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
  ...DEMO_STORES.map((blueprint) => blueprint.homeChannel),
]

// ── Demo stores (src/storefront/demoStores/) ─────────────────────────────────
// Helpers for every store that holds a part of a demo store (contract: reseedDemo).

/**
 * The stores seeded from a blueprint when the app starts: the demo stores' own
 * channels. Read it in a store's setup, where calling this store would make a cycle.
 */
export const SEEDED_DEMO_CHANNELS: readonly SalesChannel[] = DEMO_STORES.map((blueprint) => blueprint.homeChannel)

/**
 * What a store that can take a theme is seeded with now: the theme applied to it,
 * else the one it started from. Null for a store that started blank or cannot take
 * a theme. A fresh copy on every call.
 */
export function demoSnapshotOf(channel: InstallChannel | null | undefined): StoreSnapshot | null {
  if (!channel || !canApplyTheme(channel)) return null
  const id = currentBlueprintId(channel, browserStorage())
  return id ? snapshotFor(channel, id, localDateKey(Date.now())) : null
}

/** A store's live record, else its seeded demo channel. For use inside actions (it reads this store). */
export function demoChannelRecord(channelId: string): SalesChannel | undefined {
  return useSalesChannelsStore().channels.find((channel) => channel.id === channelId) ?? homeBlueprintOf(channelId)?.homeChannel
}

/**
 * `rows` with one store's rows (`belongs`) replaced by `next`. The new rows take the
 * place of the first one they replace (else they go last), so lists keep their order;
 * every other row stays as it is.
 */
export function replaceStoreRows<T>(rows: readonly T[], belongs: (row: T) => boolean, next: readonly T[]): T[] {
  const others = rows.filter((row) => !belongs(row))
  // Every row before the first one replaced stays, so that is where the new rows go.
  const at = rows.findIndex(belongs)
  const before = at === -1 ? others.length : at
  return [...others.slice(0, before), ...next, ...others.slice(before)]
}

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

  // ── Demo stores ──────────────────────────────────────────────────────
  const channelById = (channelId: string): SalesChannel | undefined => channels.value.find((channel) => channel.id === channelId)

  /** When a demo store's own channel was seeded connected (Northfold), else null: how a store starts, and what a restore puts back. */
  const seededConnection = (channelId: string): string | null => {
    const seeded = homeBlueprintOf(channelId)?.homeChannel
    return seeded?.webStore?.merchandiseConnected ? seeded.merchandising?.lastSyncAt ?? seeded.createdAt : null
  }

  // A demo store's connection is kept in the browser with the rest of its data, so
  // the storefront tab has a search box as soon as the admin tab connects. It is
  // history: applying a theme keeps it, only a restore puts it back as seeded.
  const keptConnection = keepPerChannel('merchandise', 1, isKeptConnection, {
    read: (channelId) => ({ connectedAt: channelById(channelId)?.merchandising?.lastSyncAt ?? null }),
    take: (channelId, saved) => {
      const channel = channelById(channelId)
      if (channel) setMerchandising(channel, saved ? saved.connectedAt : seededConnection(channelId))
    },
  })

  /** Prices are written in the store's market; a store that started blank keeps its own. */
  function setMarket(channel: SalesChannel, market: StoreSnapshot['market']): void {
    if (!channel.webStore || (channel.webStore.currency === market.currency && channel.webStore.locale === market.locale)) return
    // A new object: the seed's own is shared with the blueprint it comes from.
    const webStore: NonNullable<SalesChannel['webStore']> = { ...channel.webStore, currency: market.currency, locale: market.locale }
    if (!market.locale) delete webStore.locale
    channel.webStore = webStore
  }

  /** The stores whose market and connection are seeded and kept (attachStore): each only once. */
  const attached = new Set<string>()

  /**
   * Seeds a store's market as the theme it runs now has it, and its Merchandise Cloud
   * connection as it had it before the demo (connected only on a demo store's channel
   * seeded so), then keeps the connection: what this browser saved is read, never cleared.
   */
  function attachStore(channel: SalesChannel): void {
    if (attached.has(channel.id)) return
    attached.add(channel.id)
    const snapshot = demoSnapshotOf(channel)
    if (snapshot) setMarket(channel, snapshot.market)
    setMerchandising(channel, seededConnection(channel.id))
    keptConnection.attach(channel.id)
  }
  for (const seeded of SEEDED_DEMO_CHANNELS) attachStore(channelById(seeded.id)!)

  /** The store's record when it can take a theme. */
  const demoChannel = (channelId: string): SalesChannel | undefined => {
    const channel = channelById(channelId)
    return channel && canApplyTheme(channel) ? channel : undefined
  }

  /**
   * Brings a store that can take a theme in with what this browser saved for it,
   * as the app starts (a store made from a theme; src/stores/useDemoStores.ts).
   * Nothing saved is cleared. Does nothing a second time, or for a store that
   * cannot take a theme.
   */
  function attachDemo(channelId: string): void {
    const channel = demoChannel(channelId)
    if (channel) attachStore(channel)
  }

  /**
   * Puts the store's market back as the theme it runs now has it (contract: reseedDemo).
   * Its connection stays, and is kept from now on if it was not yet.
   * A store that cannot take a theme is left alone.
   */
  function reseedDemo(channelId: string): void {
    const channel = demoChannel(channelId)
    if (!channel) return
    attachStore(channel)
    const snapshot = demoSnapshotOf(channel)
    if (snapshot) setMarket(channel, snapshot.market)
  }

  /** Puts the store's Merchandise Cloud connection back as seeded (contract: restoreDemoHistory, a restore only). */
  function restoreDemoHistory(channelId: string): void {
    const channel = demoChannel(channelId)
    if (!channel) return
    attachStore(channel)
    keptConnection.clear(channelId)
    setMerchandising(channel, seededConnection(channelId))
    keptConnection.adopt(channelId)
  }

  return {
    connectMerchandising,
    disconnectMerchandising,
    attachDemo,
    reseedDemo,
    restoreDemoHistory,
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
