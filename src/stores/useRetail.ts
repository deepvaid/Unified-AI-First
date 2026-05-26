import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useSalesChannelsStore, type SalesChannel } from '@/stores/useSalesChannels'

/* ── Types ─────────────────────────────────────────────────────── */

export type Country = 'US' | 'CA' | 'AU' | 'NZ'

export interface RetailLocation {
  id: string
  name: string
  address: string
  country: Country
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

export type TenderType = 'card' | 'cash' | 'tap_to_pay' | 'gift_card' | 'split'
export const TENDER_LABELS: Record<TenderType, string> = {
  card: 'Card',
  cash: 'Cash',
  tap_to_pay: 'Tap to Pay',
  gift_card: 'Gift card',
  split: 'Split',
}

export type TxnStatus = 'completed' | 'refunded' | 'partial_refund' | 'voided' | 'suspended'
export const TXN_STATUS_LABELS: Record<TxnStatus, string> = {
  completed: 'Completed',
  refunded: 'Refunded',
  partial_refund: 'Partial refund',
  voided: 'Voided',
  suspended: 'Suspended',
}

export type TxnOrigin = 'in_store' | 'boris'

export interface RetailTransactionLine {
  sku: string
  name: string
  qty: number
  price: number
}

export interface RetailTransaction {
  id: string
  locationId: string
  registerId: string
  associateId: string
  customerName?: string
  total: number
  tender: TenderType
  status: TxnStatus
  itemCount: number
  origin: TxnOrigin
  completedAt: string
  hasReceipt: boolean
  lines?: RetailTransactionLine[]
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

export interface StockRow {
  sku: string
  productName: string
  category: string
  stockByLocation: Record<string, number>
}

export interface InventoryAudit {
  id: string
  fileName: string
  rowsChanged: number
  reason: string
  user: string
  at: string
  status: 'completed' | 'partial' | 'failed'
}

export interface ChannelPrice {
  sku: string
  productName: string
  online: number
  pos: number
  cost: number
}

export interface LocationPriceOverride {
  id: string
  sku: string
  productName: string
  locationId: string
  overridePrice: number
  reason: string
}

/* ── Mock data ────────────────────────────────────────────────── */

const locations: RetailLocation[] = [
  {
    id: 'loc-bondi',
    name: 'Bondi Junction',
    address: '500 Oxford St, Bondi Junction NSW 2022',
    country: 'AU',
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
    registerCount: 4,
    associateCount: 6,
    todaysSales: 12830.55,
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

function buildTransactions(): RetailTransaction[] {
  const seed: Array<Omit<RetailTransaction, 'id' | 'completedAt'>> = [
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-1', associateId: 'assoc-1', customerName: 'Hannah Cole',     total: 184.50, tender: 'tap_to_pay', status: 'completed',      itemCount: 3, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-2', associateId: 'assoc-3', customerName: undefined,         total: 42.00,  tender: 'cash',       status: 'completed',      itemCount: 1, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-1', associateId: 'assoc-1', customerName: 'Liam O\'Connor',  total: 318.75, tender: 'card',       status: 'completed',      itemCount: 5, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-3', associateId: 'assoc-2', customerName: 'Mia Tan',         total: 95.00,  tender: 'split',      status: 'completed',      itemCount: 2, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-1', associateId: 'assoc-1', customerName: 'Noah Williams',   total: -78.00, tender: 'card',       status: 'refunded',       itemCount: 1, origin: 'boris',    hasReceipt: true },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-2', associateId: 'assoc-3', customerName: 'Zoe Patel',       total: 156.20, tender: 'tap_to_pay', status: 'completed',      itemCount: 2, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  associateId: 'assoc-4', customerName: 'Aria Singh',      total: 220.00, tender: 'card',       status: 'completed',      itemCount: 3, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  associateId: 'assoc-4', customerName: undefined,         total: 12.50,  tender: 'cash',       status: 'completed',      itemCount: 1, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-2',  associateId: 'assoc-2', customerName: 'Lucas Chen',      total: 412.30, tender: 'card',       status: 'partial_refund', itemCount: 4, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  associateId: 'assoc-4', customerName: 'Ivy Nguyen',      total: 68.00,  tender: 'gift_card',  status: 'completed',      itemCount: 2, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  associateId: 'assoc-4', customerName: undefined,         total: 0,      tender: 'cash',       status: 'voided',         itemCount: 1, origin: 'in_store', hasReceipt: false },
    { locationId: 'loc-auckland',  registerId: 'reg-auck-1',  associateId: 'assoc-6', customerName: 'Olivia Walker',   total: 76.50,  tender: 'tap_to_pay', status: 'completed',      itemCount: 2, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-auckland',  registerId: 'reg-auck-2',  associateId: 'assoc-6', customerName: 'Jack Pierce',     total: 245.00, tender: 'card',       status: 'completed',      itemCount: 4, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-auckland',  registerId: 'reg-auck-1',  associateId: 'assoc-6', customerName: 'Ruby Anand',      total: 32.00,  tender: 'cash',       status: 'suspended',      itemCount: 1, origin: 'in_store', hasReceipt: false },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  associateId: 'assoc-7', customerName: 'Henry Adler',     total: 480.00, tender: 'card',       status: 'completed',      itemCount: 3, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  associateId: 'assoc-7', customerName: 'Maya Diaz',       total: 1250.00,tender: 'tap_to_pay', status: 'completed',      itemCount: 6, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-soho',      registerId: 'reg-soho-2',  associateId: 'assoc-8', customerName: undefined,         total: 28.50,  tender: 'cash',       status: 'completed',      itemCount: 1, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-soho',      registerId: 'reg-soho-3',  associateId: 'assoc-8', customerName: 'Sophia Renner',   total: 312.40, tender: 'tap_to_pay', status: 'completed',      itemCount: 4, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  associateId: 'assoc-7', customerName: 'Owen Castillo',   total: -145.00,tender: 'card',       status: 'refunded',       itemCount: 1, origin: 'boris',    hasReceipt: true },
    { locationId: 'loc-soho',      registerId: 'reg-soho-2',  associateId: 'assoc-8', customerName: 'Lily Brooks',     total: 67.20,  tender: 'card',       status: 'completed',      itemCount: 2, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  associateId: 'assoc-7', customerName: 'Caleb Foster',    total: 198.00, tender: 'card',       status: 'completed',      itemCount: 3, origin: 'in_store', hasReceipt: true },
    { locationId: 'loc-soho',      registerId: 'reg-soho-3',  associateId: 'assoc-8', customerName: 'Ella Ross',       total: 54.00,  tender: 'tap_to_pay', status: 'completed',      itemCount: 1, origin: 'in_store', hasReceipt: true },
  ]
  const now = Date.now()
  return seed.map((t, i) => ({
    ...t,
    id: `POS-${12048 - i}`,
    completedAt: new Date(now - i * 7 * 60 * 1000).toISOString(),
  }))
}

const stockData: StockRow[] = [
  { sku: 'TEE-001-BLK-M',   productName: 'Classic crew tee — Black',     category: 'Apparel',   stockByLocation: { 'loc-bondi': 12, 'loc-chadstone': 4,  'loc-auckland': 8,  'loc-soho': 24 } },
  { sku: 'TEE-001-WHT-M',   productName: 'Classic crew tee — White',     category: 'Apparel',   stockByLocation: { 'loc-bondi': 6,  'loc-chadstone': 9,  'loc-auckland': 3,  'loc-soho': 17 } },
  { sku: 'JEAN-512-DRK-32', productName: 'Slim denim — Dark, 32',         category: 'Apparel',   stockByLocation: { 'loc-bondi': 2,  'loc-chadstone': 0,  'loc-auckland': 5,  'loc-soho': 11 } },
  { sku: 'SNEAK-A1-WHT-10', productName: 'Court sneaker — White, 10',    category: 'Footwear',  stockByLocation: { 'loc-bondi': 4,  'loc-chadstone': 6,  'loc-auckland': 0,  'loc-soho': 9 } },
  { sku: 'CAP-001-NVY',     productName: 'Cap — Navy',                    category: 'Accessory', stockByLocation: { 'loc-bondi': 18, 'loc-chadstone': 14, 'loc-auckland': 12, 'loc-soho': 22 } },
  { sku: 'BAG-LTH-BLK',     productName: 'Leather tote — Black',          category: 'Accessory', stockByLocation: { 'loc-bondi': 3,  'loc-chadstone': 1,  'loc-auckland': 2,  'loc-soho': 7 } },
  { sku: 'HOOD-101-GRY-L',  productName: 'Pullover hoodie — Grey, L',     category: 'Apparel',   stockByLocation: { 'loc-bondi': 0,  'loc-chadstone': 3,  'loc-auckland': 4,  'loc-soho': 8 } },
  { sku: 'JACK-220-OLI-M',  productName: 'Field jacket — Olive, M',       category: 'Apparel',   stockByLocation: { 'loc-bondi': 5,  'loc-chadstone': 7,  'loc-auckland': 2,  'loc-soho': 13 } },
  { sku: 'SOCKS-3PK-BLK',   productName: 'Crew socks 3-pack — Black',    category: 'Apparel',   stockByLocation: { 'loc-bondi': 30, 'loc-chadstone': 22, 'loc-auckland': 18, 'loc-soho': 41 } },
  { sku: 'BELT-LTH-BRN-34', productName: 'Leather belt — Brown, 34',     category: 'Accessory', stockByLocation: { 'loc-bondi': 4,  'loc-chadstone': 6,  'loc-auckland': 3,  'loc-soho': 10 } },
]

const inventoryAudits: InventoryAudit[] = [
  { id: 'aud-1', fileName: 'restock-2026-05-22.csv',    rowsChanged: 312, reason: 'Weekly restock',   user: 'Ava Brennan',      at: '2026-05-22T08:14:00Z', status: 'completed' },
  { id: 'aud-2', fileName: 'stocktake-bondi-may.csv',   rowsChanged: 482, reason: 'Stocktake',         user: 'Sienna Mitchell',  at: '2026-05-20T19:00:00Z', status: 'completed' },
  { id: 'aud-3', fileName: 'damaged-goods-write-off.csv', rowsChanged: 14,  reason: 'Damaged goods',   user: 'Marcus Lee',       at: '2026-05-18T11:30:00Z', status: 'completed' },
  { id: 'aud-4', fileName: 'audit-correction.csv',      rowsChanged: 23,  reason: 'Audit correction', user: 'Ava Brennan',      at: '2026-05-15T14:05:00Z', status: 'partial' },
]

const channelPrices: ChannelPrice[] = [
  { sku: 'TEE-001-BLK-M',   productName: 'Classic crew tee — Black',  online: 39.00,  pos: 39.00,  cost: 12.00 },
  { sku: 'TEE-001-WHT-M',   productName: 'Classic crew tee — White',  online: 39.00,  pos: 39.00,  cost: 12.00 },
  { sku: 'JEAN-512-DRK-32', productName: 'Slim denim — Dark, 32',     online: 129.00, pos: 129.00, cost: 42.00 },
  { sku: 'SNEAK-A1-WHT-10', productName: 'Court sneaker — White, 10', online: 159.00, pos: 159.00, cost: 58.00 },
  { sku: 'CAP-001-NVY',     productName: 'Cap — Navy',                online: 35.00,  pos: 35.00,  cost: 9.00 },
  { sku: 'BAG-LTH-BLK',     productName: 'Leather tote — Black',      online: 249.00, pos: 249.00, cost: 92.00 },
  { sku: 'HOOD-101-GRY-L',  productName: 'Pullover hoodie — Grey, L', online: 89.00,  pos: 89.00,  cost: 28.00 },
  { sku: 'JACK-220-OLI-M',  productName: 'Field jacket — Olive, M',   online: 219.00, pos: 219.00, cost: 78.00 },
]

const priceOverrides: LocationPriceOverride[] = [
  { id: 'po-1', sku: 'TEE-001-BLK-M', productName: 'Classic crew tee — Black', locationId: 'loc-soho',     overridePrice: 45.00, reason: 'Flagship pricing' },
  { id: 'po-2', sku: 'CAP-001-NVY',   productName: 'Cap — Navy',                locationId: 'loc-auckland', overridePrice: 49.00, reason: 'NZ regional pricing' },
  { id: 'po-3', sku: 'BAG-LTH-BLK',   productName: 'Leather tote — Black',     locationId: 'loc-soho',     overridePrice: 269.00, reason: 'Flagship pricing' },
]

const POS_CATALOG_SKUS = stockData.slice(0, 8)

/* ── Store ────────────────────────────────────────────────────── */

export const useRetailStore = defineStore('retail', () => {
  const locationList = ref<RetailLocation[]>([...locations])
  const registerList = ref<Register[]>([...registers])
  const associateList = ref<Associate[]>([...associates])
  const transactionList = ref<RetailTransaction[]>(buildTransactions())
  const stockList = ref<StockRow[]>([...stockData])
  const inventoryAuditList = ref<InventoryAudit[]>([...inventoryAudits])
  const channelPriceList = ref<ChannelPrice[]>([...channelPrices])
  const priceOverrideList = ref<LocationPriceOverride[]>([...priceOverrides])

  const activeLocationId = ref<string>(locations[0]!.id)
  const activeChannelId = ref<string>('pos-store')
  const offlineMode = ref(false)

  const activeLocation = computed(
    () => locationList.value.find((l) => l.id === activeLocationId.value) ?? locationList.value[0]!,
  )

  const activeChannel = computed<SalesChannel | undefined>(() => {
    const salesStore = useSalesChannelsStore()
    return salesStore.channels.find((c) => c.id === activeChannelId.value)
  })

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

  /* KPIs — filtered by active location */
  const kpis = computed(() => {
    const locId = activeLocationId.value
    const txns = transactionList.value.filter((t) => t.locationId === locId)
    const todayTxns = txns.filter((t) => t.status === 'completed')
    const refunds = txns.filter((t) => t.status === 'refunded' || t.status === 'partial_refund')
    const salesToday = todayTxns.reduce((s, t) => s + t.total, 0)
    const txnCountToday = todayTxns.length
    const avgBasket = txnCountToday > 0 ? salesToday / txnCountToday : 0
    const locRegs = registerList.value.filter((r) => r.locationId === locId)
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

  function toggleAssociateActive(id: string) {
    const a = associateList.value.find((x) => x.id === id)
    if (a) a.active = !a.active
  }

  function resetPin(id: string) {
    const a = associateList.value.find((x) => x.id === id)
    if (a) a.pinSet = false
  }

  function deleteTransactions(ids: string[]) {
    transactionList.value = transactionList.value.filter((t) => !ids.includes(t.id))
  }

  function refundTransaction(id: string) {
    const t = transactionList.value.find((x) => x.id === id)
    if (t && t.status === 'completed') {
      t.status = 'refunded'
      t.total = -Math.abs(t.total)
    }
  }

  function voidTransaction(id: string) {
    const t = transactionList.value.find((x) => x.id === id)
    if (t) {
      t.status = 'voided'
      t.total = 0
    }
  }

  function addTransaction(payload: {
    locationId: string
    registerId: string
    associateId: string
    customerName?: string
    total: number
    tender: TenderType
    itemCount: number
    lines?: RetailTransactionLine[]
  }) {
    const id = `POS-${12100 + transactionList.value.length}`
    const txn: RetailTransaction = {
      id,
      locationId: payload.locationId,
      registerId: payload.registerId,
      associateId: payload.associateId,
      customerName: payload.customerName,
      total: payload.total,
      tender: payload.tender,
      status: 'completed',
      itemCount: payload.itemCount,
      origin: 'in_store',
      completedAt: new Date().toISOString(),
      hasReceipt: true,
      lines: payload.lines,
    }
    transactionList.value.unshift(txn)
    return txn
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
      registerCount: 0,
      associateCount: 0,
      todaysSales: 0,
      status: 'open',
    })
  }

  function deletePriceOverride(id: string) {
    priceOverrideList.value = priceOverrideList.value.filter((p) => p.id !== id)
  }

  function setOfflineMode(value: boolean) {
    offlineMode.value = value
  }

  return {
    // state
    locationList,
    registerList,
    associateList,
    transactionList,
    stockList,
    inventoryAuditList,
    channelPriceList,
    priceOverrideList,
    activeLocationId,
    activeChannelId,
    offlineMode,
    POS_CATALOG_SKUS,
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
    toggleAssociateActive,
    resetPin,
    deleteTransactions,
    refundTransaction,
    voidTransaction,
    addTransaction,
    addAssociate,
    deleteAssociates,
    addLocation,
    deletePriceOverride,
  }
})
