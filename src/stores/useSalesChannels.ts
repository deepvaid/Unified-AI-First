import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { browserStorage, keepPerChannel } from '@/stores/demoKeep'
import { DEMO_STORES, canApplyTheme, homeBlueprintOf } from '@/storefront/demoStores'
import { currentBlueprintId, snapshotFor } from '@/storefront/demoStores/install'
import type { InstallChannel } from '@/storefront/demoStores/install'
import type { DemoStoreId, StoreBlueprintRef, StoreSnapshot } from '@/storefront/demoStores/types'
import { nextStoreSlot, readCreatedRecord, writeCreatedStores } from '@/storefront/createdStores'
import type { RetiredStore } from '@/storefront/createdStores'
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
  /**
   * A web store with Store Builder switched on: the demo store it starts as a copy
   * of (its theme, products, pages and campaigns), or null to start blank. Such a
   * store can take a theme from the library later, and is kept in this browser.
   */
  theme?: DemoStoreId | null
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

/** The created stores this browser holds that fit beside the seeded ones: no id or slot taken twice. */
function loadCreated(): SalesChannel[] {
  const ids = new Set(seedChannels.map((channel) => channel.id))
  const slots = new Set(seedChannels.map((channel) => channel.webStore?.blueprint?.slot).filter((slot) => slot !== undefined))
  return readCreatedRecord(browserStorage()).stores.filter((channel) => {
    const slot = channel.webStore!.blueprint!.slot
    if (ids.has(channel.id) || slots.has(slot)) return false
    ids.add(channel.id)
    slots.add(slot)
    return true
  })
}

export const useSalesChannelsStore = defineStore('salesChannels', () => {
  // The stores made here, as they were made: what a restore puts back (their connection), and what is kept in the browser.
  const created = new Map<string, SalesChannel>(loadCreated().map((channel) => [channel.id, channel]))
  /** Stores deleted here: their ids and slots are never used again in this browser. */
  let retired: RetiredStore[] = readCreatedRecord(browserStorage()).retired
  const channels = ref<SalesChannel[]>([...seedChannels.map((channel) => ({ ...channel })), ...[...created.values()].map((channel) => structuredClone(channel))])

  /** False when the browser refused it: the store then lasts until the page is reloaded. */
  function saveCreated(): boolean {
    return writeCreatedStores(browserStorage(), { stores: [...created.values()], retired })
  }

  /** Whether the store started connected to Merchandise Cloud: how a restore leaves it. */
  function startedConnected(channelId: string): boolean {
    return seededConnection(channelId) !== null
  }

  /** A created store as it was made (its market and connection then), or undefined for any other store. */
  function madeWith(channelId: string): SalesChannel | undefined {
    return created.get(channelId)
  }

  /** A store made here with Store Builder switched on: kept in this browser, and the only kind that can be deleted. */
  function isCreatedStore(channelId: string): boolean {
    return created.has(channelId)
  }

  /** Takes a created store out of the list and this browser. Its data is cleared by useDemoStores().remove(), which calls this last. */
  function deleteCreatedStore(channelId: string): boolean {
    const record = created.get(channelId)
    if (!record || !created.delete(channelId)) return false
    retired = [...retired, { id: channelId, slot: record.webStore!.blueprint!.slot }]
    saveCreated()
    channels.value = channels.value.filter((channel) => channel.id !== channelId)
    return true
  }

  /**
   * Another tab made or deleted a store: the list follows. Returns the ids of the
   * stores it added, which the caller brings in (useDemoStores().attach), and of those it took out.
   */
  function syncCreatedStores(): { added: string[]; removed: string[] } {
    const record = readCreatedRecord(browserStorage())
    retired = record.retired
    const saved = new Map(record.stores.map((channel) => [channel.id, channel]))
    const removed = [...created.keys()].filter((id) => !saved.has(id))
    for (const id of removed) created.delete(id)
    if (removed.length) channels.value = channels.value.filter((channel) => !removed.includes(channel.id))
    const taken = new Set(channels.value.map((channel) => channel.webStore?.blueprint?.slot).filter((slot) => slot !== undefined))
    const added: string[] = []
    for (const [id, channel] of saved) {
      if (created.has(id) || channels.value.some((c) => c.id === id) || taken.has(channel.webStore!.blueprint!.slot)) continue
      created.set(id, channel)
      channels.value.push(structuredClone(channel))
      added.push(id)
    }
    return { added, removed }
  }

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
    // Never the id of a store deleted here: what the app keeps by store id would follow it.
    const id = makeId(payload.name, new Set([...channels.value.map((channel) => channel.id), ...retired.map((store) => store.id)]))
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

    // A Store Builder store takes the next slot, so a theme can be applied to it; none left, and it is made as before.
    const slot = payload.type === 'web_store' && payload.storeBuilderEnabled ? nextStoreSlot(channels.value, retired) : null
    const theme = slot === null ? null : payload.theme ?? null

    const channel: SalesChannel = payload.type === 'web_store'
      ? {
          ...base,
          provider: 'maropost_store_builder',
          // A store made from a theme opens with that theme published.
          status: theme ? 'connected' : payload.storeBuilderEnabled ? 'needs_setup' : 'draft',
          health: theme ? 'healthy' : 'incomplete',
          connectedClouds: [
            'commerce',
            ...(payload.storeBuilderEnabled ? ['store_builder' as const] : []),
            ...(payload.merchandiseConnected ? ['merchandise' as const] : []),
          ],
          webStore: {
            domain: payload.domain?.trim() || `${id}.maropost.store`,
            storeBuilderEnabled: !!payload.storeBuilderEnabled,
            published: !!theme,
            merchandiseConnected: !!payload.merchandiseConnected,
            ...(slot === null ? {} : { demo: true, blueprint: { original: theme, slot } }),
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

    if (slot === null) {
      channels.value.unshift(channel)
      return channel
    }
    // Last, so the stores before it keep their places (Atlas stays Maropay's first store).
    created.set(channel.id, structuredClone(channel))
    saveCreated()
    channels.value.push(channel)
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

  /**
   * When the store started connected to Merchandise Cloud, else null: a demo store's
   * own channel as seeded (Northfold), a created store as it was made. How a store
   * starts, and what a restore puts back.
   */
  const seededConnection = (channelId: string): string | null => {
    const seeded = homeBlueprintOf(channelId)?.homeChannel ?? created.get(channelId)
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
    followTheme(channel, !!snapshot)
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
    else unsetMarket(channel)
    followTheme(channel, !!snapshot)
  }

  /**
   * A created store is set up exactly when it runs a theme: then its theme is published
   * and the store live; back to blank, it needs setup again, as it was made.
   */
  function followTheme(channel: SalesChannel, runsTheme: boolean): void {
    const made = created.get(channel.id)
    if (!made?.webStore || !channel.webStore) return
    const status = runsTheme ? 'connected' : made.status
    const health = runsTheme ? 'healthy' : made.health
    const published = runsTheme || made.webStore.published
    if (channel.status === status && channel.health === health && channel.webStore.published === published) return
    channel.status = status
    channel.health = health
    channel.webStore = { ...channel.webStore, published }
  }

  /** A store back to blank prices in what it was made with again (nothing set: the account's currency). */
  function unsetMarket(channel: SalesChannel): void {
    const made = created.get(channel.id)?.webStore
    if (!channel.webStore || !made || (channel.webStore.currency === made.currency && channel.webStore.locale === made.locale)) return
    const webStore: NonNullable<SalesChannel['webStore']> = { ...channel.webStore, currency: made.currency, locale: made.locale }
    if (!made.currency) delete webStore.currency
    if (!made.locale) delete webStore.locale
    channel.webStore = webStore
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
    isCreatedStore,
    madeWith,
    startedConnected,
    deleteCreatedStore,
    syncCreatedStores,
    linkLocationToChannel,
  }
})
