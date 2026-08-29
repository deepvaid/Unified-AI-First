import { defineStore } from 'pinia'
import { ref } from 'vue'

// ── Contact Lists ──────────────────────────────────────────────────────────────

/** The source offers exactly two list types. */
export type CdpListType = 'Normal' | 'Suppressed'

/**
 * A cart integration binding. The source renders one checkbox + one free-text
 * field per cart configured on the account.
 */
export interface CdpListCart {
  id: string
  name: string
  enabled: boolean
  /** The source labels this "Item / Product / LDS" and never explains it. */
  itemProductLds: string
}

export interface CdpList {
  id: number
  name: string
  type: CdpListType
  addToManageSubscription: boolean
  brand: string
  displayName: string
  description: string
  postUrl: string
  fromName: string
  fromEmail: string
  replyTo: string
  language: string
  address: string
  carts: CdpListCart[]
  count: number
  created: string
}

/** Brand options, seeded from the source account. */
export const LIST_BRANDS: string[] = [
  'BSLN- SMS', 'Airpel- SMS', 'Acer', 'benQ', 'yg',
  'Test-Adidas', 'Calvin Klein', 'Uniqlo', 'Cockatoo', 'H&M',
]

/** Language options, in source order. */
export const LIST_LANGUAGES: string[] = [
  'English', 'Spanish', 'German', 'Italian', 'French', 'Portuguese',
  'Polish', 'Danish', 'Dutch', 'Swedish', 'Norwegian',
]

/** Cart integrations configured on the account, seeded from the source. */
export const CART_INTEGRATIONS = [
  { id: 'maropost1', name: 'maropost1' },
  { id: 'um-ultratesting', name: 'UM-Ultratesting' },
  { id: 'ub-ultra', name: 'UB-ultra' },
  { id: 'ub-nana', name: 'UB-nana' },
  { id: 'sd', name: 'sd' },
] as const

/** A fresh, unbound set of cart rows for a new or existing list. */
export function blankCarts(): CdpListCart[] {
  return CART_INTEGRATIONS.map(c => ({ id: c.id, name: c.name, enabled: false, itemProductLds: '' }))
}

// ── Custom Fields ──────────────────────────────────────────────────────────────
export type CdpFieldType = 'String' | 'Integer' | 'Boolean' | 'Datetime' | 'Text' | 'Float'

export interface CdpField {
  id: number
  name: string
  type: CdpFieldType
  defaultValue: string
  displayName: string
  description: string
  addToEditProfile: boolean
}

/**
 * Built-in contact fields. The source shows these on a second tab where only the
 * default value is editable — the name and type are fixed.
 */
export interface CdpDefaultField {
  name: string
  type: CdpFieldType
  defaultValue: string
}

// ── Tags ───────────────────────────────────────────────────────────────────────
export interface CdpTag {
  id: number
  name: string
  count: number
}

// ── Relational Tables ────────────────────────────────────────────────────────────
export type RelationalColumnType =
  | 'Bigint' | 'Boolean' | 'Datetime' | 'Email' | 'UID' | 'Float' | 'Integer' | 'String' | 'Text'

export interface RelationalColumn {
  name: string
  dataType: RelationalColumnType
  defaultValue: string
  fieldLength: string
  keyType: 'None' | 'Index' | 'Unique'
  allowNull: 'Yes' | 'No'
}

export interface RelationalTable {
  id: number
  name: string
  columns: RelationalColumn[]
  rows: number
  primaryKey: string
  updated: string
}

// ── SQL / ETL Queries ────────────────────────────────────────────────────────────
/**
 * A saved SQL statement that moves rows out of relational tables and into other
 * relational tables. Shaped after the source payload (`relational_queries.json`):
 * `rows_count` → `records`, `update_type` → `updateType`, `target_ids` → `targets`
 * (names, since the sandbox has no id-bearing target records).
 */
export interface SqlQuery {
  id: number
  name: string
  /** Destination relational tables. Empty is possible — four source rows have none. */
  targets: string[]
  updateType: 'Overwrite' | 'Append'
  query: string
  /** Rows produced by the last run. `null` means never run; the source renders it blank. */
  records: number | null
  /** Local wall-clock ISO, no zone — the view parses these back as local time. */
  createdAt: string
  updatedAt: string
  /** Set when the last run failed. The source's API returns this and never surfaces it. */
  failedAt: string | null
}

/** Local wall-clock ISO (no zone), matching the seeded timestamps. */
function nowIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ── Secure Lists ─────────────────────────────────────────────────────────────────
export interface SecureList {
  id: number
  name: string
  contacts: number
  lastAccessed: string
}

const today = () => new Date().toISOString().slice(0, 10)

export const useCdpEntitiesStore = defineStore('cdpEntities', () => {
  // ── Lists ────────────────────────────────────────────────────────────────────
  const lists = ref<CdpList[]>([
    { id: 1, name: 'Master Subscriber List', type: 'Normal', addToManageSubscription: true, brand: 'Acer', displayName: 'Master Subscribers', description: 'Every opted-in subscriber.', postUrl: 'https://hooks.maropost.com/lists/master', fromName: 'Maropost', fromEmail: 'hello@maropost.com', replyTo: 'support@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', carts: blankCarts(), count: 125000, created: '2023-01-15' },
    { id: 2, name: 'Newsletter Subscribers', type: 'Normal', addToManageSubscription: true, brand: 'Acer', displayName: 'Newsletter', description: 'Weekly newsletter opt-ins.', postUrl: '', fromName: 'Maropost News', fromEmail: 'news@maropost.com', replyTo: 'news@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', carts: blankCarts(), count: 18432, created: '2023-02-01' },
    { id: 3, name: 'VIP Customer Circle', type: 'Normal', addToManageSubscription: false, brand: 'Calvin Klein', displayName: 'VIP Circle', description: 'Top-tier loyalty members.', postUrl: '', fromName: 'Maropost VIP', fromEmail: 'vip@maropost.com', replyTo: 'vip@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', carts: blankCarts(), count: 312, created: '2023-06-15' },
    { id: 4, name: 'Product Announcements', type: 'Normal', addToManageSubscription: false, brand: 'H&M', displayName: 'Announcements', description: 'New product and feature news.', postUrl: '', fromName: 'Maropost', fromEmail: 'product@maropost.com', replyTo: 'product@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', carts: blankCarts(), count: 32891, created: '2023-03-10' },
    { id: 5, name: 'Black Friday 2025', type: 'Normal', addToManageSubscription: false, brand: 'Uniqlo', displayName: 'Black Friday', description: 'Seasonal campaign audience.', postUrl: '', fromName: 'Maropost Deals', fromEmail: 'deals@maropost.com', replyTo: 'deals@maropost.com', language: 'Spanish', address: '100 King St, Sydney NSW 2000', carts: blankCarts(), count: 28412, created: '2025-10-01' },
    { id: 6, name: 'Win-Back Segment', type: 'Normal', addToManageSubscription: false, brand: 'yg', displayName: 'Win-Back', description: 'Lapsed contacts to re-engage.', postUrl: '', fromName: 'Maropost', fromEmail: 'hello@maropost.com', replyTo: 'support@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', carts: blankCarts(), count: 8912, created: '2024-01-10' },
    { id: 7, name: 'Global Suppression', type: 'Suppressed', addToManageSubscription: false, brand: '', displayName: '', description: 'Contacts excluded from every send.', postUrl: '', fromName: '', fromEmail: '', replyTo: '', language: 'English', address: '100 King St, Sydney NSW 2000', carts: blankCarts(), count: 1470, created: '2023-01-20' },
  ])

  function addList(input: Omit<CdpList, 'id' | 'count' | 'created'>): CdpList {
    const id = lists.value.reduce((m, l) => Math.max(m, l.id), 0) + 1
    const list: CdpList = { ...input, id, count: 0, created: today() }
    lists.value.unshift(list)
    return list
  }
  function updateList(id: number, patch: Partial<Omit<CdpList, 'id'>>): void {
    const list = lists.value.find(l => l.id === id)
    if (list) Object.assign(list, patch)
  }
  function duplicateList(id: number): CdpList | undefined {
    const source = lists.value.find(l => l.id === id)
    if (!source) return undefined
    const newId = lists.value.reduce((m, l) => Math.max(m, l.id), 0) + 1
    // carts must be cloned — a shared array would let edits on the copy mutate the original.
    const copy: CdpList = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      carts: source.carts.map(c => ({ ...c })),
      count: 0,
      created: today(),
    }
    lists.value.unshift(copy)
    return copy
  }
  function deleteList(id: number): void {
    const ix = lists.value.findIndex(l => l.id === id)
    if (ix !== -1) lists.value.splice(ix, 1)
  }

  // ── Fields ───────────────────────────────────────────────────────────────────
  const fields = ref<CdpField[]>([
    { id: 1, name: 'first_name', type: 'String', defaultValue: '', displayName: 'First Name', description: 'Contact given name.', addToEditProfile: true },
    { id: 2, name: 'last_name', type: 'String', defaultValue: '', displayName: 'Last Name', description: 'Contact surname.', addToEditProfile: true },
    { id: 3, name: 'company', type: 'String', defaultValue: '', displayName: 'Company', description: 'Employer or organisation.', addToEditProfile: false },
    { id: 4, name: 'age', type: 'Integer', defaultValue: '0', displayName: 'Age', description: 'Age in years.', addToEditProfile: false },
    { id: 5, name: 'opt_in_date', type: 'Datetime', defaultValue: '', displayName: 'Opt-in Date', description: 'When the contact subscribed.', addToEditProfile: false },
    // Brand-prefixed fields. Real accounts accumulate dozens of these per brand — the New Contact
    // form has to stay usable at this volume, so the seed reflects it.
    { id: 6, name: 'fashion50_client_type', type: 'String', defaultValue: '', displayName: 'Client Type', description: 'Retail, wholesale or trade.', addToEditProfile: false },
    { id: 7, name: 'fashion50_customer_number', type: 'String', defaultValue: '', displayName: 'Customer Number', description: 'Legacy POS customer reference.', addToEditProfile: false },
    { id: 8, name: 'fashion50_credit_limit', type: 'Float', defaultValue: '0', displayName: 'Credit Limit', description: 'Approved credit ceiling.', addToEditProfile: false },
    { id: 9, name: 'fashion50_credit_blocked', type: 'Boolean', defaultValue: '', displayName: 'Credit Blocked', description: 'Account is on credit hold.', addToEditProfile: false },
    { id: 10, name: 'fashion50_date_of_birth', type: 'Datetime', defaultValue: '', displayName: 'Date of Birth', description: 'Used for birthday campaigns.', addToEditProfile: true },
    { id: 11, name: 'fashion50_birthday_club', type: 'Boolean', defaultValue: '', displayName: 'Birthday Club', description: 'Opted into birthday rewards.', addToEditProfile: true },
    { id: 12, name: 'fashion50_events_interest', type: 'String', defaultValue: '', displayName: 'Events Interest', description: 'Preferred event categories.', addToEditProfile: true },
    { id: 13, name: 'fashion50_home_store', type: 'String', defaultValue: '', displayName: 'Home Store', description: 'Nearest store location.', addToEditProfile: true },
    { id: 14, name: 'fashion50_size_preference', type: 'String', defaultValue: '', displayName: 'Size Preference', description: 'Preferred garment size.', addToEditProfile: true },
    { id: 15, name: 'fashion50_loyalty_points', type: 'Integer', defaultValue: '0', displayName: 'Loyalty Points', description: 'Current points balance.', addToEditProfile: false },
    { id: 16, name: 'skylink_customer_type', type: 'String', defaultValue: '', displayName: 'Customer Type', description: 'Segment assigned by the ERP.', addToEditProfile: false },
    { id: 17, name: 'skylink_account_manager', type: 'String', defaultValue: '', displayName: 'Account Manager', description: 'Assigned sales rep.', addToEditProfile: false },
    { id: 18, name: 'skylink_payment_terms', type: 'String', defaultValue: '', displayName: 'Payment Terms', description: 'Net 30, Net 60, prepaid.', addToEditProfile: false },
    { id: 19, name: 'skylink_price_group', type: 'String', defaultValue: '', displayName: 'Price Group', description: 'Pricing tier code.', addToEditProfile: false },
    { id: 20, name: 'skylink_how_did_you_hear', type: 'Text', defaultValue: '', displayName: 'How Did You Hear About Us', description: 'Free-text acquisition source.', addToEditProfile: true },
    { id: 21, name: 'skylink_month_of_birth', type: 'Integer', defaultValue: '0', displayName: 'Month of Birth', description: 'Birth month, 1-12.', addToEditProfile: true },
    { id: 22, name: 'skylink_home_outlet', type: 'String', defaultValue: '', displayName: 'Home Outlet', description: 'Preferred outlet store.', addToEditProfile: true },
    { id: 23, name: 'skylink_newsletter_optin', type: 'Boolean', defaultValue: '', displayName: 'Newsletter Opt-in', description: 'Subscribed to the trade newsletter.', addToEditProfile: true },
    { id: 24, name: 'lifetime_value', type: 'Float', defaultValue: '0', displayName: 'Lifetime Value', description: 'Total revenue to date.', addToEditProfile: false },
    { id: 25, name: 'acquisition_channel', type: 'String', defaultValue: '', displayName: 'Acquisition Channel', description: 'First-touch channel.', addToEditProfile: false },
    { id: 26, name: 'acquisition_campaign', type: 'String', defaultValue: '', displayName: 'Acquisition Campaign', description: 'First-touch campaign name.', addToEditProfile: false },
    { id: 27, name: 'referral_code', type: 'String', defaultValue: '', displayName: 'Referral Code', description: 'Code used at signup.', addToEditProfile: true },
    { id: 28, name: 'referred_by', type: 'String', defaultValue: '', displayName: 'Referred By', description: 'Referring contact email.', addToEditProfile: false },
    { id: 29, name: 'preferred_language', type: 'String', defaultValue: 'English', displayName: 'Preferred Language', description: 'Language for communications.', addToEditProfile: true },
    { id: 30, name: 'preferred_contact_time', type: 'String', defaultValue: '', displayName: 'Preferred Contact Time', description: 'Morning, afternoon or evening.', addToEditProfile: true },
    { id: 31, name: 'timezone', type: 'String', defaultValue: '', displayName: 'Timezone', description: 'IANA timezone identifier.', addToEditProfile: false },
    { id: 32, name: 'gender', type: 'String', defaultValue: '', displayName: 'Gender', description: 'Self-described, optional.', addToEditProfile: true },
    { id: 33, name: 'age_group', type: 'String', defaultValue: '', displayName: 'Age Group', description: 'Bracketed age band.', addToEditProfile: false },
    { id: 34, name: 'household_size', type: 'Integer', defaultValue: '0', displayName: 'Household Size', description: 'Number of people in household.', addToEditProfile: false },
    { id: 35, name: 'billing_address', type: 'Text', defaultValue: '', displayName: 'Billing Address', description: 'Full billing address.', addToEditProfile: true },
    { id: 36, name: 'shipping_address', type: 'Text', defaultValue: '', displayName: 'Shipping Address', description: 'Full shipping address.', addToEditProfile: true },
    { id: 37, name: 'postcode', type: 'String', defaultValue: '', displayName: 'Postcode', description: 'Postal or ZIP code.', addToEditProfile: true },
    { id: 38, name: 'country', type: 'String', defaultValue: '', displayName: 'Country', description: 'ISO country name.', addToEditProfile: true },
    { id: 39, name: 'vip_since', type: 'Datetime', defaultValue: '', displayName: 'VIP Since', description: 'Date the contact reached VIP tier.', addToEditProfile: false },
    { id: 40, name: 'wholesale_approved', type: 'Boolean', defaultValue: '', displayName: 'Wholesale Approved', description: 'Cleared for wholesale pricing.', addToEditProfile: false },
    { id: 41, name: 'last_survey_score', type: 'Integer', defaultValue: '0', displayName: 'Last Survey Score', description: 'Most recent NPS response.', addToEditProfile: false },
    { id: 42, name: 'internal_notes', type: 'Text', defaultValue: '', displayName: 'Internal Notes', description: 'Staff-only notes, never shown to the contact.', addToEditProfile: false },
  ])

  function addField(input: Omit<CdpField, 'id'>): CdpField {
    const id = fields.value.reduce((m, f) => Math.max(m, f.id), 0) + 1
    const field: CdpField = { ...input, id }
    fields.value.unshift(field)
    return field
  }
  function updateField(id: number, patch: Partial<Omit<CdpField, 'id'>>): void {
    const field = fields.value.find(f => f.id === id)
    if (field) Object.assign(field, patch)
  }
  function deleteField(id: number): void {
    const ix = fields.value.findIndex(f => f.id === id)
    if (ix !== -1) fields.value.splice(ix, 1)
  }

  /** Built-in fields — name and type are fixed; only the default value is editable. */
  const defaultFields = ref<CdpDefaultField[]>([
    { name: 'First Name', type: 'String', defaultValue: '' },
    { name: 'Last Name', type: 'String', defaultValue: '' },
  ])
  function updateDefaultField(name: string, defaultValue: string): void {
    const field = defaultFields.value.find(f => f.name === name)
    if (field) field.defaultValue = defaultValue
  }

  // ── Tags ─────────────────────────────────────────────────────────────────────
  const tags = ref<CdpTag[]>([
    { id: 1, name: 'VIP', count: 1250 },
    { id: 2, name: 'Tradeshow_2026', count: 450 },
    { id: 3, name: 'Abandoned_Cart', count: 3200 },
    { id: 4, name: 'Holiday_Shopper', count: 15400 },
    { id: 5, name: 'Webinar_Attendee', count: 850 },
    { id: 6, name: 'Newsletter', count: 18432 },
    { id: 7, name: 'Wholesale', count: 620 },
    { id: 8, name: 'Trade_Account', count: 410 },
    { id: 9, name: 'Loyalty_Member', count: 9840 },
    { id: 10, name: 'Birthday_Club', count: 5210 },
    { id: 11, name: 'Win_Back', count: 8912 },
    { id: 12, name: 'High_Value', count: 1120 },
    { id: 13, name: 'At_Risk', count: 2340 },
    { id: 14, name: 'New_Subscriber', count: 4180 },
    { id: 15, name: 'Repeat_Buyer', count: 7650 },
    { id: 16, name: 'Store_Pickup', count: 3020 },
    { id: 17, name: 'Online_Only', count: 11200 },
    { id: 18, name: 'Referral_Source', count: 980 },
    { id: 19, name: 'Survey_Respondent', count: 1740 },
    { id: 20, name: 'Press_List', count: 130 },
  ])

  function addTag(name: string): CdpTag {
    const id = tags.value.reduce((m, t) => Math.max(m, t.id), 0) + 1
    const tag: CdpTag = { id, name, count: 0 }
    tags.value.unshift(tag)
    return tag
  }
  function updateTag(id: number, name: string): void {
    const tag = tags.value.find(t => t.id === id)
    if (tag) tag.name = name
  }
  function deleteTag(id: number): void {
    const ix = tags.value.findIndex(t => t.id === id)
    if (ix !== -1) tags.value.splice(ix, 1)
  }

  // ── Relational Tables ──────────────────────────────────────────────────────────
  const tables = ref<RelationalTable[]>([
    { id: 1, name: 'Purchase History', columns: [{ name: 'transaction_id', dataType: 'Bigint', defaultValue: '', fieldLength: '', keyType: 'Unique', allowNull: 'No' }], rows: 450200, primaryKey: 'transaction_id', updated: '2026-03-07' },
    { id: 2, name: 'App Usage Logs', columns: [{ name: 'log_id', dataType: 'Bigint', defaultValue: '', fieldLength: '', keyType: 'Unique', allowNull: 'No' }], rows: 1250000, primaryKey: 'log_id', updated: '2026-03-07' },
    { id: 3, name: 'Loyalty Points', columns: [{ name: 'customer_id', dataType: 'Bigint', defaultValue: '', fieldLength: '', keyType: 'Index', allowNull: 'No' }], rows: 85000, primaryKey: 'customer_id', updated: '2026-03-06' },
  ])

  function newColumn(): RelationalColumn {
    return { name: '', dataType: 'String', defaultValue: '', fieldLength: '', keyType: 'None', allowNull: 'Yes' }
  }
  function addTable(input: { name: string; columns: RelationalColumn[] }): RelationalTable {
    const id = tables.value.reduce((m, t) => Math.max(m, t.id), 0) + 1
    const unique = input.columns.find(c => c.keyType === 'Unique')
    const table: RelationalTable = {
      id,
      name: input.name,
      columns: input.columns,
      rows: 0,
      primaryKey: unique?.name || input.columns[0]?.name || '—',
      updated: today(),
    }
    tables.value.unshift(table)
    return table
  }
  function deleteTable(id: number): void {
    const ix = tables.value.findIndex(t => t.id === id)
    if (ix !== -1) tables.value.splice(ix, 1)
  }

  // ── SQL / ETL Queries ──────────────────────────────────────────────────────────
  /**
   * Relational tables a query can load into — the source's Targets picker, which
   * pages 20 at a time on scroll and exposes no total. Seeded from account 116000.
   */
  const relationalTargets = ref<string[]>([
    'api_event_table_testing', 'aug_sktable', 'av_test', 'benchmark_contacts',
    'customer_database', 'dev_test', 'email_table', 'har_table1', 'har_table2',
    'maropost_users', 'rt11754996906544', 'rt21754996906544', 'rt21759302244211',
    'r_table1751525262863', 'sendabletable', 'sk_table', 'table_multi_columns',
    'ub1_copy1', 'uday_test', 'uday_test_copy', 'uid_uat_testing_116000_email',
  ])

  // Mirrors the source account's ten rows (eight kept): the `cy_sql_qry*` machine
  // names, the records mix of 0 / 1 / 3 / null, and one failed run so the Status
  // column has something to say beyond "Success".
  const queries = ref<SqlQuery[]>([
    { id: 15, name: 'testsq', targets: ['av_test'], updateType: 'Overwrite', query: 'Select * from dev_test', records: 1, createdAt: '2026-01-05T02:42:46', updatedAt: '2026-01-05T02:42:46', failedAt: null },
    { id: 14, name: 'query-test', targets: ['aug_sktable'], updateType: 'Overwrite', query: 'Select * From av_test', records: 0, createdAt: '2026-01-02T22:15:03', updatedAt: '2026-01-02T22:15:03', failedAt: null },
    { id: 12, name: 'cy_sql_qry1759302244211', targets: ['rt21759302244211'], updateType: 'Append', query: 'Select * from rt11759302244211', records: 0, createdAt: '2025-10-01T05:04:11', updatedAt: '2025-10-01T05:04:11', failedAt: null },
    { id: 8, name: 'cy_sql_qry1754996906544', targets: ['rt21754996906544'], updateType: 'Append', query: 'Select * from rt11754996906544', records: 0, createdAt: '2025-08-12T09:48:29', updatedAt: '2025-08-12T09:48:29', failedAt: null },
    { id: 7, name: 'cy_sql_qry1752578912307', targets: [], updateType: 'Append', query: 'Select * from rt11752578912307', records: 0, createdAt: '2025-07-15T11:28:34', updatedAt: '2025-07-15T11:28:34', failedAt: null },
    { id: 3, name: 'ubquery', targets: ['ub1_copy1'], updateType: 'Overwrite', query: 'SELECT * FROM ub1;', records: 3, createdAt: '2025-06-17T14:06:52', updatedAt: '2026-02-11T08:19:40', failedAt: null },
    { id: 2, name: 'har_query1', targets: ['har_table1'], updateType: 'Append', query: 'select * from har_table2', records: 0, createdAt: '2022-05-16T11:02:47', updatedAt: '2026-02-18T04:31:09', failedAt: '2026-02-18T04:31:09' },
    { id: 1, name: 'uday_sql_query', targets: ['uday_test_copy'], updateType: 'Append', query: 'select * from uday_test', records: null, createdAt: '2022-05-16T09:14:02', updatedAt: '2022-05-16T09:14:02', failedAt: null },
  ])

  function addQuery(input: Omit<SqlQuery, 'id' | 'records' | 'createdAt' | 'updatedAt' | 'failedAt'>): SqlQuery {
    const id = queries.value.reduce((m, q) => Math.max(m, q.id), 0) + 1
    const stamp = nowIso()
    // A new query has never run, so `records` is null rather than 0 — the two mean
    // different things in the Status column.
    const query: SqlQuery = { ...input, id, records: null, createdAt: stamp, updatedAt: stamp, failedAt: null }
    queries.value.unshift(query)
    return query
  }
  function updateQuery(id: number, patch: Partial<Omit<SqlQuery, 'id'>>): void {
    const query = queries.value.find(q => q.id === id)
    if (query) Object.assign(query, patch, { updatedAt: nowIso() })
  }
  /** Simulated run: stamps `updatedAt`, sets a row count and clears the failure mark. */
  function executeQuery(id: number): void {
    const query = queries.value.find(q => q.id === id)
    if (!query) return
    query.records = Math.floor(Math.random() * 5000)
    query.updatedAt = nowIso()
    query.failedAt = null
  }
  function deleteQuery(id: number): void {
    const ix = queries.value.findIndex(q => q.id === id)
    if (ix !== -1) queries.value.splice(ix, 1)
  }
  function deleteQueries(ids: number[]): void {
    const doomed = new Set(ids)
    queries.value = queries.value.filter(q => !doomed.has(q.id))
  }

  // ── Secure Lists ────────────────────────────────────────────────────────────────
  const secureLists = ref<SecureList[]>([
    { id: 1, name: 'Confidential Investor Updates', contacts: 120, lastAccessed: '2026-03-05' },
    { id: 2, name: 'Board of Directors', contacts: 12, lastAccessed: '2026-03-01' },
  ])

  function addSecureList(name: string): SecureList {
    const id = secureLists.value.reduce((m, l) => Math.max(m, l.id), 0) + 1
    const list: SecureList = { id, name, contacts: 0, lastAccessed: today() }
    secureLists.value.unshift(list)
    return list
  }
  function updateSecureList(id: number, name: string): void {
    const list = secureLists.value.find(l => l.id === id)
    if (list) list.name = name
  }
  function deleteSecureList(id: number): void {
    const ix = secureLists.value.findIndex(l => l.id === id)
    if (ix !== -1) secureLists.value.splice(ix, 1)
  }

  return {
    lists, addList, updateList, duplicateList, deleteList,
    fields, addField, updateField, deleteField,
    defaultFields, updateDefaultField,
    tags, addTag, updateTag, deleteTag,
    tables, newColumn, addTable, deleteTable,
    relationalTargets, queries, addQuery, updateQuery, executeQuery, deleteQuery, deleteQueries,
    secureLists, addSecureList, updateSecureList, deleteSecureList,
  }
})
