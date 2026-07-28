import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import { useSalesChannelsStore, type SalesChannel } from '@/stores/useSalesChannels'

/* ── Types ─────────────────────────────────────────────────────── */

export type Country = 'US' | 'CA' | 'AU' | 'NZ'

export interface RetailLocation {
  id: string
  name: string
  address: string
  country: Country
  /** Stores sell at a register; warehouses only hold stock. */
  kind: 'store' | 'warehouse'
  registerCount: number
  associateCount: number
  todaysSales: number
  status: 'open' | 'closed'
}

export type DeviceType = 'iPad' | 'iPhone' | 'Android Tablet' | 'Android Phone'
export type RegisterStatus = 'online' | 'offline' | 'syncing'

export interface Register {
  id: string
  name: string
  locationId: string
  deviceType: DeviceType
  deviceModel: string
  appVersion: string
  status: RegisterStatus
  lastSeenAt: string
  pendingOfflineTxns: number
  pairedTerminal?: string
  pairedPrinter?: string
}

export type AssociateRole = 'associate' | 'senior_associate' | 'manager' | 'admin'
export const ASSOCIATE_ROLE_LABELS: Record<AssociateRole, string> = {
  associate: 'Associate',
  senior_associate: 'Senior associate',
  manager: 'Manager',
  admin: 'Admin',
}

export interface Associate {
  id: string
  name: string
  role: AssociateRole
  locationIds: string[]
  pinSet: boolean
  active: boolean
  lastLoginAt: string
}

/* ── Mock data ────────────────────────────────────────────────── */

const locations: RetailLocation[] = [
  {
    id: 'loc-bondi',
    name: 'Bondi Junction',
    address: '500 Oxford St, Bondi Junction NSW 2022',
    country: 'AU',
    kind: 'store',
    registerCount: 3,
    associateCount: 5,
    todaysSales: 8423.45,
    status: 'open',
  },
  {
    id: 'loc-chadstone',
    name: 'Chadstone',
    address: '1341 Dandenong Rd, Chadstone VIC 3148',
    country: 'AU',
    kind: 'store',
    registerCount: 2,
    associateCount: 4,
    todaysSales: 6210.20,
    status: 'open',
  },
  {
    id: 'loc-auckland',
    name: 'Newmarket',
    address: '277 Broadway, Newmarket, Auckland 1023',
    country: 'NZ',
    kind: 'store',
    registerCount: 2,
    associateCount: 3,
    todaysSales: 3120.0,
    status: 'open',
  },
  {
    id: 'loc-soho',
    name: 'SoHo Flagship',
    address: '460 Broadway, New York, NY 10013',
    country: 'US',
    kind: 'store',
    registerCount: 4,
    associateCount: 6,
    todaysSales: 12830.55,
    status: 'open',
  },
  {
    id: 'loc-warehouse-fl',
    name: 'Main Warehouse - FL',
    address: '1200 Logistics Pkwy, Orlando FL 32805',
    country: 'US',
    kind: 'warehouse',
    registerCount: 0,
    associateCount: 0,
    todaysSales: 0,
    status: 'open',
  },
  {
    id: 'loc-node-ca',
    name: 'Secondary Node - CA',
    address: '88 Bayfront Way, Oakland CA 94607',
    country: 'US',
    kind: 'warehouse',
    registerCount: 0,
    associateCount: 0,
    todaysSales: 0,
    status: 'open',
  },
  {
    id: 'loc-hub-tx',
    name: 'Retail Hub - TX',
    address: '4400 Commerce St, Dallas TX 75226',
    country: 'US',
    kind: 'warehouse',
    registerCount: 0,
    associateCount: 0,
    todaysSales: 0,
    status: 'open',
  },
]

const registers: Register[] = [
  { id: 'reg-bondi-1', name: 'Front counter',  locationId: 'loc-bondi',     deviceType: 'iPad',           deviceModel: 'iPad Pro 11"',     appVersion: '1.4.2', status: 'online',  lastSeenAt: '2026-05-23T14:55:00Z', pendingOfflineTxns: 0, pairedTerminal: 'Stripe S700',     pairedPrinter: 'Star mC-Print3' },
  { id: 'reg-bondi-2', name: 'Shop floor',     locationId: 'loc-bondi',     deviceType: 'iPhone',         deviceModel: 'iPhone 15 Pro',    appVersion: '1.4.2', status: 'online',  lastSeenAt: '2026-05-23T14:53:00Z', pendingOfflineTxns: 0, pairedTerminal: 'Tap to Pay',       pairedPrinter: undefined },
  { id: 'reg-bondi-3', name: 'Fitting room',   locationId: 'loc-bondi',     deviceType: 'iPad',           deviceModel: 'iPad Air',          appVersion: '1.4.1', status: 'syncing', lastSeenAt: '2026-05-23T14:48:00Z', pendingOfflineTxns: 3, pairedTerminal: 'Stripe M2',       pairedPrinter: undefined },
  { id: 'reg-chad-1',  name: 'Register 1',     locationId: 'loc-chadstone', deviceType: 'iPad',           deviceModel: 'iPad Pro 12.9"',   appVersion: '1.4.2', status: 'online',  lastSeenAt: '2026-05-23T14:54:00Z', pendingOfflineTxns: 0, pairedTerminal: 'Stripe S700',     pairedPrinter: 'Epson TM-m30III' },
  { id: 'reg-chad-2',  name: 'Register 2',     locationId: 'loc-chadstone', deviceType: 'Android Tablet', deviceModel: 'Galaxy Tab S9',    appVersion: '1.3.9', status: 'offline', lastSeenAt: '2026-05-23T11:12:00Z', pendingOfflineTxns: 7, pairedTerminal: 'Stripe S700',     pairedPrinter: 'Star mC-Print3' },
  { id: 'reg-auck-1',  name: 'Counter',        locationId: 'loc-auckland',  deviceType: 'iPad',           deviceModel: 'iPad Air',         appVersion: '1.4.2', status: 'online',  lastSeenAt: '2026-05-23T14:50:00Z', pendingOfflineTxns: 0, pairedTerminal: 'Stripe M2',       pairedPrinter: 'Star mC-Print3' },
  { id: 'reg-auck-2',  name: 'Floor roaming',  locationId: 'loc-auckland',  deviceType: 'iPhone',         deviceModel: 'iPhone 14',        appVersion: '1.4.2', status: 'online',  lastSeenAt: '2026-05-23T14:51:00Z', pendingOfflineTxns: 0, pairedTerminal: 'Tap to Pay',       pairedPrinter: undefined },
  { id: 'reg-soho-1',  name: 'Flagship 1',     locationId: 'loc-soho',      deviceType: 'iPad',           deviceModel: 'iPad Pro 11"',     appVersion: '1.4.2', status: 'online',  lastSeenAt: '2026-05-23T14:55:00Z', pendingOfflineTxns: 0, pairedTerminal: 'Stripe S700',     pairedPrinter: 'Star mC-Print3' },
  { id: 'reg-soho-2',  name: 'Flagship 2',     locationId: 'loc-soho',      deviceType: 'iPad',           deviceModel: 'iPad Pro 11"',     appVersion: '1.4.2', status: 'online',  lastSeenAt: '2026-05-23T14:52:00Z', pendingOfflineTxns: 0, pairedTerminal: 'Stripe S700',     pairedPrinter: 'Star mC-Print3' },
  { id: 'reg-soho-3',  name: 'Pop-up',         locationId: 'loc-soho',      deviceType: 'iPhone',         deviceModel: 'iPhone 15',        appVersion: '1.4.2', status: 'online',  lastSeenAt: '2026-05-23T14:49:00Z', pendingOfflineTxns: 0, pairedTerminal: 'Tap to Pay',       pairedPrinter: undefined },
  { id: 'reg-soho-4',  name: 'Stockroom',      locationId: 'loc-soho',      deviceType: 'Android Tablet', deviceModel: 'Galaxy Tab A9+',   appVersion: '1.4.1', status: 'syncing', lastSeenAt: '2026-05-23T14:46:00Z', pendingOfflineTxns: 1, pairedTerminal: undefined,          pairedPrinter: undefined },
]

const associates: Associate[] = [
  { id: 'assoc-1', name: 'Sienna Mitchell',  role: 'manager',          locationIds: ['loc-bondi'],                       pinSet: true, active: true,  lastLoginAt: '2026-05-23T14:30:00Z' },
  { id: 'assoc-2', name: 'Jake Thompson',    role: 'senior_associate', locationIds: ['loc-bondi', 'loc-chadstone'],       pinSet: true, active: true,  lastLoginAt: '2026-05-23T13:42:00Z' },
  { id: 'assoc-3', name: 'Priya Sharma',     role: 'associate',        locationIds: ['loc-bondi'],                       pinSet: true, active: true,  lastLoginAt: '2026-05-23T14:05:00Z' },
  { id: 'assoc-4', name: 'Marcus Lee',       role: 'manager',          locationIds: ['loc-chadstone'],                   pinSet: true, active: true,  lastLoginAt: '2026-05-23T09:18:00Z' },
  { id: 'assoc-5', name: 'Olivia Walsh',     role: 'associate',        locationIds: ['loc-chadstone'],                   pinSet: false, active: false, lastLoginAt: '2026-05-19T15:20:00Z' },
  { id: 'assoc-6', name: 'Ethan Park',       role: 'senior_associate', locationIds: ['loc-auckland'],                    pinSet: true, active: true,  lastLoginAt: '2026-05-23T11:00:00Z' },
  { id: 'assoc-7', name: 'Ava Brennan',      role: 'manager',          locationIds: ['loc-soho'],                        pinSet: true, active: true,  lastLoginAt: '2026-05-23T13:55:00Z' },
  { id: 'assoc-8', name: 'Daniel Rivera',    role: 'associate',        locationIds: ['loc-soho'],                        pinSet: true, active: true,  lastLoginAt: '2026-05-23T14:11:00Z' },
]

/* ── Store ────────────────────────────────────────────────────── */

export const useRetailStore = defineStore('retail', () => {
  const locationList = ref<RetailLocation[]>([...locations])
  const registerList = ref<Register[]>([...registers])
  const associateList = ref<Associate[]>([...associates])

  /** `ALL_LOCATIONS` is the default scope: retail surfaces show the whole estate
   *  until the rail's location switcher narrows them to one store. */
  const ALL_LOCATIONS = 'all'

  const activeLocationId = ref<string>(ALL_LOCATIONS)
  const activeChannelId = ref<string>('pos-store')
  const offlineMode = ref(false)

  const isAllLocations = computed(() => activeLocationId.value === ALL_LOCATIONS)

  /** Always a concrete location — surfaces that need one (POS, registers) fall
   *  back to the first store while the scope is "all locations". */
  const activeLocation = computed(
    () => locationList.value.find((l) => l.id === activeLocationId.value) ?? locationList.value[0]!,
  )

  /** Location ids in the current scope — every location when scoped to "all". */
  const scopedLocationIds = computed(() =>
    isAllLocations.value ? locationList.value.filter((l) => l.kind === 'store').map((l) => l.id) : [activeLocationId.value],
  )

  const activeChannel = computed<SalesChannel | undefined>(() => {
    const salesStore = useSalesChannelsStore()
    return salesStore.channels.find((c) => c.id === activeChannelId.value)
  })

  /** Selling locations only — warehouses never appear in POS context pickers. */
  const storeLocations = computed(() => locationList.value.filter((l) => l.kind === 'store'))

  function availableContexts(accountId: string): Array<{ channel: SalesChannel; locations: RetailLocation[] }> {
    const salesStore = useSalesChannelsStore()
    return salesStore.offlineStoreChannels(accountId).map((channel) => {
      const ids = channel.offlineStore?.locationIds ?? []
      const locs = ids
        .map((id) => locationList.value.find((l) => l.id === id))
        .filter((l): l is RetailLocation => Boolean(l))
      return { channel, locations: locs }
    })
  }

  function setActiveLocation(id: string) {
    if (id === ALL_LOCATIONS) {
      activeLocationId.value = ALL_LOCATIONS
      return
    }
    if (!locationList.value.some((l) => l.id === id)) return
    activeLocationId.value = id
    const salesStore = useSalesChannelsStore()
    const parent = salesStore.channels.find(
      (c) => c.type === 'offline_store' && c.offlineStore?.locationIds.includes(id),
    )
    if (parent) activeChannelId.value = parent.id
  }

  function setActiveContext(channelId: string, locationId: string) {
    activeChannelId.value = channelId
    if (locationList.value.some((l) => l.id === locationId)) {
      activeLocationId.value = locationId
    }
  }

  function locationName(id: string): string {
    return locationList.value.find((l) => l.id === id)?.name ?? id
  }

  function registerName(id: string): string {
    return registerList.value.find((r) => r.id === id)?.name ?? id
  }

  function associateName(id: string): string {
    return associateList.value.find((a) => a.id === id)?.name ?? id
  }

  /* KPIs — scoped to the active location, or the whole estate when scoped to "all".
     Sales live in the shared order store; retail supplies only the scope. */
  const kpis = computed(() => {
    const commerce = useCommerceStore()
    const scope = scopedLocationIds.value
    const txns = commerce.posOrders.filter((o) => scope.includes(o.pos?.locationId ?? ''))
    const todayTxns = txns.filter((o) => o.status === 'Completed')
    const refunds = txns.filter((o) => o.paymentStatus === 'Refunded' || o.paymentStatus === 'Partially Refunded')
    const salesToday = todayTxns.reduce((sum, o) => sum + parseFloat(o.total), 0)
    const txnCountToday = todayTxns.length
    const avgBasket = txnCountToday > 0 ? salesToday / txnCountToday : 0
    const locRegs = registerList.value.filter((r) => scope.includes(r.locationId))
    const onlineRegs = locRegs.filter((r) => r.status === 'online').length
    const offlinePending = locRegs.reduce((s, r) => s + r.pendingOfflineTxns, 0)
    return {
      salesToday,
      salesYesterday: salesToday * 0.92,
      salesTrend: 8.4,
      txnCountToday,
      txnCountYesterday: Math.round(txnCountToday * 0.95),
      txnTrend: 5.2,
      avgBasket,
      avgBasketTrend: 3.1,
      returnsToday: refunds.length,
      registersOnline: onlineRegs,
      registersTotal: locRegs.length,
      offlineTxnsPending: offlinePending,
    }
  })

  /* Actions */
  function forceResync(registerIds: string[]) {
    registerList.value.forEach((r) => {
      if (registerIds.includes(r.id)) {
        r.status = 'syncing'
        r.lastSeenAt = new Date().toISOString()
      }
    })
  }

  function deactivateRegisters(registerIds: string[]) {
    registerList.value.forEach((r) => {
      if (registerIds.includes(r.id)) {
        r.status = 'offline'
        r.lastSeenAt = new Date().toISOString()
      }
    })
  }

  function toggleAssociateActive(id: string) {
    const a = associateList.value.find((x) => x.id === id)
    if (a) a.active = !a.active
  }

  function resetPin(id: string) {
    const a = associateList.value.find((x) => x.id === id)
    if (a) a.pinSet = false
  }

  function deleteAssociates(ids: string[]) {
    associateList.value = associateList.value.filter((a) => !ids.includes(a.id))
  }

  function addAssociate(payload: { name: string; role: AssociateRole; locationIds: string[] }) {
    const id = `assoc-${Date.now()}`
    associateList.value.unshift({
      id,
      name: payload.name,
      role: payload.role,
      locationIds: payload.locationIds,
      pinSet: false,
      active: true,
      lastLoginAt: new Date().toISOString(),
    })
  }

  function addLocation(payload: { name: string; address: string; country: Country }) {
    const id = `loc-${Date.now()}`
    locationList.value.push({
      id,
      name: payload.name,
      address: payload.address,
      country: payload.country,
      kind: 'store',
      registerCount: 0,
      associateCount: 0,
      todaysSales: 0,
      status: 'open',
    })
  }

  function setOfflineMode(value: boolean) {
    offlineMode.value = value
  }

  return {
    // state
    locationList,
    registerList,
    associateList,
    activeLocationId,
    activeChannelId,
    isAllLocations,
    scopedLocationIds,
    storeLocations,
    ALL_LOCATIONS,
    offlineMode,
    // computed
    activeLocation,
    activeChannel,
    kpis,
    // helpers
    locationName,
    registerName,
    associateName,
    availableContexts,
    // actions
    setActiveLocation,
    setActiveContext,
    setOfflineMode,
    forceResync,
    deactivateRegisters,
    toggleAssociateActive,
    resetPin,
    addAssociate,
    deleteAssociates,
    addLocation,
  }
})
