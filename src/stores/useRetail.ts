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

export type LoyaltyTier = 'member' | 'silver' | 'gold' | 'vip'
export const LOYALTY_TIER_LABELS: Record<LoyaltyTier, string> = {
  member: 'Member',
  silver: 'Silver',
  gold: 'Gold',
  vip: 'VIP',
}

export interface PosCustomer {
  id: string
  name: string
  email: string
  phone: string
  tier: LoyaltyTier
  points: number
  lifetimeSpend: number
  visits: number
  since: string
  homeLocationId: string
  notes?: string
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
  // Line shorthand — SKUs/prices must match channelPrices so POS receipts and tiles align.
  const L = (sku: string, name: string, qty: number, price: number): RetailTransactionLine => ({ sku, name, qty, price })
  const TEE_B = (q = 1) => L('TEE-001-BLK-M', 'Classic crew tee — Black', q, 39)
  const TEE_W = (q = 1) => L('TEE-001-WHT-M', 'Classic crew tee — White', q, 39)
  const JEAN  = (q = 1) => L('JEAN-512-DRK-32', 'Slim denim — Dark, 32', q, 129)
  const SNEAK = (q = 1) => L('SNEAK-A1-WHT-10', 'Court sneaker — White, 10', q, 159)
  const CAP   = (q = 1) => L('CAP-001-NVY', 'Cap — Navy', q, 35)
  const BAG   = (q = 1) => L('BAG-LTH-BLK', 'Leather tote — Black', q, 249)
  const HOOD  = (q = 1) => L('HOOD-101-GRY-L', 'Pullover hoodie — Grey, L', q, 89)
  const JACK  = (q = 1) => L('JACK-220-OLI-M', 'Field jacket — Olive, M', q, 219)

  // itemCount/total are derived from lines (total = subtotal × 1.1 tax, negated for refunds, 0 for voided).
  // daysAgo gives each location Today / Yesterday / older groups for the POS history view.
  const seed: Array<Omit<RetailTransaction, 'id' | 'completedAt' | 'total' | 'itemCount'> & { daysAgo: number; lines: RetailTransactionLine[] }> = [
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-1', associateId: 'assoc-1', customerName: 'Hannah Cole',     tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [TEE_B(2), CAP()] },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-2', associateId: 'assoc-3', customerName: undefined,         tender: 'cash',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [CAP()] },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-1', associateId: 'assoc-1', customerName: 'Liam O\'Connor',  tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [JEAN(), TEE_W(2), CAP(), TEE_B()] },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-3', associateId: 'assoc-2', customerName: 'Mia Tan',         tender: 'split',      status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [HOOD(), CAP()] },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-1', associateId: 'assoc-1', customerName: 'Noah Williams',   tender: 'card',       status: 'refunded',       origin: 'boris',    hasReceipt: true,  daysAgo: 2, lines: [HOOD()] },
    { locationId: 'loc-bondi',     registerId: 'reg-bondi-2', associateId: 'assoc-3', customerName: 'Zoe Patel',       tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 3, lines: [TEE_B(), HOOD()] },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  associateId: 'assoc-4', customerName: 'Aria Singh',      tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [TEE_B(2), JEAN()] },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  associateId: 'assoc-4', customerName: undefined,         tender: 'cash',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [CAP()] },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-2',  associateId: 'assoc-2', customerName: 'Lucas Chen',      tender: 'card',       status: 'partial_refund', origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [JACK(), HOOD(), TEE_W(2)] },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  associateId: 'assoc-4', customerName: 'Ivy Nguyen',      tender: 'gift_card',  status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 2, lines: [CAP(), TEE_B()] },
    { locationId: 'loc-chadstone', registerId: 'reg-chad-1',  associateId: 'assoc-4', customerName: undefined,         tender: 'cash',       status: 'voided',         origin: 'in_store', hasReceipt: false, daysAgo: 4, lines: [CAP()] },
    { locationId: 'loc-auckland',  registerId: 'reg-auck-1',  associateId: 'assoc-6', customerName: 'Olivia Walker',   tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [TEE_W(), CAP()] },
    { locationId: 'loc-auckland',  registerId: 'reg-auck-2',  associateId: 'assoc-6', customerName: 'Jack Pierce',     tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [SNEAK(), CAP(2), TEE_B()] },
    { locationId: 'loc-auckland',  registerId: 'reg-auck-1',  associateId: 'assoc-6', customerName: 'Ruby Anand',      tender: 'cash',       status: 'suspended',      origin: 'in_store', hasReceipt: false, daysAgo: 3, lines: [TEE_B()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  associateId: 'assoc-7', customerName: 'Henry Adler',     tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [BAG(), CAP(), TEE_B()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  associateId: 'assoc-7', customerName: 'Maya Diaz',       tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 0, lines: [BAG(), JACK(), SNEAK(), JEAN(), TEE_B(2)] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-2',  associateId: 'assoc-8', customerName: undefined,         tender: 'cash',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [CAP()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-3',  associateId: 'assoc-8', customerName: 'Sophia Renner',   tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 1, lines: [JEAN(), HOOD(), TEE_W(2)] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  associateId: 'assoc-7', customerName: 'Owen Castillo',   tender: 'card',       status: 'refunded',       origin: 'boris',    hasReceipt: true,  daysAgo: 2, lines: [SNEAK()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-2',  associateId: 'assoc-8', customerName: 'Lily Brooks',     tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 3, lines: [TEE_B(), CAP()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-1',  associateId: 'assoc-7', customerName: 'Caleb Foster',    tender: 'card',       status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 4, lines: [HOOD(), TEE_W(), CAP()] },
    { locationId: 'loc-soho',      registerId: 'reg-soho-3',  associateId: 'assoc-8', customerName: 'Ella Ross',       tender: 'tap_to_pay', status: 'completed',      origin: 'in_store', hasReceipt: true,  daysAgo: 5, lines: [CAP()] },
  ]
  const now = Date.now()
  return seed.map(({ daysAgo, ...t }, i) => {
    const subtotal = t.lines.reduce((s, l) => s + l.price * l.qty, 0)
    const gross = Math.round(subtotal * 1.1 * 100) / 100
    const total = t.status === 'voided' ? 0 : t.status === 'refunded' ? -gross : gross
    return {
      ...t,
      id: `POS-${12048 - i}`,
      itemCount: t.lines.reduce((s, l) => s + l.qty, 0),
      total,
      completedAt: new Date(now - daysAgo * 86_400_000 - (i * 7 + 25) * 60_000).toISOString(),
    }
  })
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

const posCustomers: PosCustomer[] = [
  { id: 'cust-1',  name: 'Hannah Cole',    email: 'hannah.cole@example.com',   phone: '+61 412 882 014', tier: 'gold',   points: 2840, lifetimeSpend: 2843.60, visits: 18, since: '2024-03-12', homeLocationId: 'loc-bondi',     notes: 'Prefers email receipts. Size M in outerwear.' },
  { id: 'cust-2',  name: "Liam O'Connor",  email: 'liam.oconnor@example.com',  phone: '+61 400 233 871', tier: 'vip',    points: 6120, lifetimeSpend: 6118.25, visits: 24, since: '2023-11-02', homeLocationId: 'loc-bondi' },
  { id: 'cust-3',  name: 'Mia Tan',        email: 'mia.tan@example.com',       phone: '+61 433 190 552', tier: 'silver', points: 1290, lifetimeSpend: 1287.40, visits: 9,  since: '2024-08-21', homeLocationId: 'loc-bondi' },
  { id: 'cust-4',  name: 'Zoe Patel',      email: 'zoe.patel@example.com',     phone: '+61 421 077 309', tier: 'member', points: 310,  lifetimeSpend: 312.40,  visits: 3,  since: '2025-04-09', homeLocationId: 'loc-bondi' },
  { id: 'cust-5',  name: 'Aria Singh',     email: 'aria.singh@example.com',    phone: '+61 402 615 488', tier: 'gold',   points: 3470, lifetimeSpend: 3468.90, visits: 15, since: '2024-01-28', homeLocationId: 'loc-chadstone', notes: 'Loyalty birthday voucher pending (July).' },
  { id: 'cust-6',  name: 'Lucas Chen',     email: 'lucas.chen@example.com',    phone: '+61 415 904 226', tier: 'member', points: 680,  lifetimeSpend: 684.20,  visits: 5,  since: '2025-01-17', homeLocationId: 'loc-chadstone', notes: 'Exchanged field jacket size M→L on POS-12040.' },
  { id: 'cust-7',  name: 'Ivy Nguyen',     email: 'ivy.nguyen@example.com',    phone: '+61 438 552 901', tier: 'silver', points: 1540, lifetimeSpend: 1536.75, visits: 11, since: '2024-06-05', homeLocationId: 'loc-chadstone' },
  { id: 'cust-8',  name: 'Henry Adler',    email: 'henry.adler@example.com',   phone: '+1 (212) 555-0184', tier: 'vip',  points: 8930, lifetimeSpend: 8927.10, visits: 22, since: '2023-09-14', homeLocationId: 'loc-soho' },
  { id: 'cust-9',  name: 'Maya Diaz',      email: 'maya.diaz@example.com',     phone: '+1 (917) 555-0142', tier: 'gold', points: 4210, lifetimeSpend: 4212.85, visits: 13, since: '2024-02-23', homeLocationId: 'loc-soho',      notes: 'Stylist appointments first Friday of the month.' },
  { id: 'cust-10', name: 'Owen Castillo',  email: 'owen.castillo@example.com', phone: '+1 (646) 555-0117', tier: 'member', points: 450, lifetimeSpend: 446.00, visits: 2,  since: '2025-09-30', homeLocationId: 'loc-soho',      notes: 'Refund processed on sneakers — sizing issue.' },
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
  const posCustomerList = ref<PosCustomer[]>([...posCustomers])

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

  function addPosCustomer(payload: { name: string; email: string; phone: string }): PosCustomer {
    const customer: PosCustomer = {
      id: `cust-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      tier: 'member',
      points: 0,
      lifetimeSpend: 0,
      visits: 0,
      since: new Date().toISOString().slice(0, 10),
      homeLocationId: activeLocationId.value,
    }
    posCustomerList.value.unshift(customer)
    return customer
  }

  function recordCustomerPurchase(customerId: string, amount: number) {
    const c = posCustomerList.value.find((x) => x.id === customerId)
    if (!c) return
    c.lifetimeSpend = Math.round((c.lifetimeSpend + amount) * 100) / 100
    c.points += Math.round(amount)
    c.visits += 1
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
    posCustomerList,
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
    addPosCustomer,
    recordCustomerPurchase,
    addAssociate,
    deleteAssociates,
    addLocation,
    deletePriceOverride,
  }
})
