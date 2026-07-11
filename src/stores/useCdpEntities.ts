import { defineStore } from 'pinia'
import { ref } from 'vue'

// ── Contact Lists ──────────────────────────────────────────────────────────────
export interface CdpList {
  id: number
  name: string
  type: string
  brand: string
  displayName: string
  description: string
  fromName: string
  fromEmail: string
  replyTo: string
  language: string
  address: string
  count: number
  created: string
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
export interface SqlQuery {
  id: number
  name: string
  targets: string[]
  updateType: 'Overwrite' | 'Append'
  query: string
  records: number
  lastRun: string
  status: string
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
    { id: 1, name: 'Master Subscriber List', type: 'Normal', brand: 'Maropost', displayName: 'Master Subscribers', description: 'Every opted-in subscriber.', fromName: 'Maropost', fromEmail: 'hello@maropost.com', replyTo: 'support@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', count: 125000, created: '2023-01-15' },
    { id: 2, name: 'Newsletter Subscribers', type: 'Normal', brand: 'Maropost', displayName: 'Newsletter', description: 'Weekly newsletter opt-ins.', fromName: 'Maropost News', fromEmail: 'news@maropost.com', replyTo: 'news@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', count: 18432, created: '2023-02-01' },
    { id: 3, name: 'VIP Customer Circle', type: 'Premium', brand: 'Maropost', displayName: 'VIP Circle', description: 'Top-tier loyalty members.', fromName: 'Maropost VIP', fromEmail: 'vip@maropost.com', replyTo: 'vip@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', count: 312, created: '2023-06-15' },
    { id: 4, name: 'Product Announcements', type: 'Transactional', brand: 'Maropost', displayName: 'Announcements', description: 'New product and feature news.', fromName: 'Maropost', fromEmail: 'product@maropost.com', replyTo: 'product@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', count: 32891, created: '2023-03-10' },
    { id: 5, name: 'Black Friday 2025', type: 'Normal', brand: 'Maropost', displayName: 'Black Friday', description: 'Seasonal campaign audience.', fromName: 'Maropost Deals', fromEmail: 'deals@maropost.com', replyTo: 'deals@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', count: 28412, created: '2025-10-01' },
    { id: 6, name: 'Win-Back Segment', type: 'Normal', brand: 'Maropost', displayName: 'Win-Back', description: 'Lapsed contacts to re-engage.', fromName: 'Maropost', fromEmail: 'hello@maropost.com', replyTo: 'support@maropost.com', language: 'English', address: '100 King St, Sydney NSW 2000', count: 8912, created: '2024-01-10' },
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
    const copy: CdpList = { ...source, id: newId, name: `${source.name} (Copy)`, count: 0, created: today() }
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

  // ── Tags ─────────────────────────────────────────────────────────────────────
  const tags = ref<CdpTag[]>([
    { id: 1, name: 'VIP', count: 1250 },
    { id: 2, name: 'Tradeshow_2026', count: 450 },
    { id: 3, name: 'Abandoned_Cart', count: 3200 },
    { id: 4, name: 'Holiday_Shopper', count: 15400 },
    { id: 5, name: 'Webinar_Attendee', count: 850 },
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
  const queries = ref<SqlQuery[]>([
    { id: 1, name: 'High Value Customers No Purchase 90 Days', targets: ['Purchase History'], updateType: 'Overwrite', query: "SELECT c.email FROM contacts c LEFT JOIN purchases p ON c.id = p.contact_id WHERE p.date < CURRENT_DATE - INTERVAL '90 days'", records: 4820, lastRun: '2 hours ago', status: 'Success' },
    { id: 2, name: 'Daily Churn Sync', targets: ['Loyalty Points'], updateType: 'Append', query: 'SELECT customer_id, points FROM loyalty WHERE updated_at > CURRENT_DATE - 1', records: 12930, lastRun: '10 hours ago', status: 'Success' },
    { id: 3, name: 'Holiday Segment Extract', targets: ['Purchase History', 'App Usage Logs'], updateType: 'Overwrite', query: 'SELECT * FROM purchases WHERE season = \'holiday\'', records: 0, lastRun: '3 days ago', status: 'Failed' },
  ])

  function addQuery(input: Omit<SqlQuery, 'id' | 'records' | 'lastRun' | 'status'>): SqlQuery {
    const id = queries.value.reduce((m, q) => Math.max(m, q.id), 0) + 1
    const query: SqlQuery = { ...input, id, records: 0, lastRun: 'Never', status: 'Pending' }
    queries.value.unshift(query)
    return query
  }
  function updateQuery(id: number, patch: Partial<Omit<SqlQuery, 'id'>>): void {
    const query = queries.value.find(q => q.id === id)
    if (query) Object.assign(query, patch)
  }
  function deleteQuery(id: number): void {
    const ix = queries.value.findIndex(q => q.id === id)
    if (ix !== -1) queries.value.splice(ix, 1)
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
    tags, addTag, updateTag, deleteTag,
    tables, newColumn, addTable, deleteTable,
    queries, addQuery, updateQuery, deleteQuery,
    secureLists, addSecureList, updateSecureList, deleteSecureList,
  }
})
