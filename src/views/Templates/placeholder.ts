// Structural placeholder data for the /templates page-archetype gallery.
//
// Every string here is deliberately *structural* — "Record name 01", "Column A",
// "Status" — never a product noun. The templates are a layout reference for
// engineers; the moment the data reads like real orders or contacts, people start
// reading the content instead of the composition. Nothing in src/views/Templates/
// imports a Pinia store for the same reason.

import type { ResponsiveHeader } from '@/composables/useResponsiveTableHeaders'

export type PlaceholderStatus = 'Active' | 'Inactive' | 'Draft' | 'Pending'

export interface PlaceholderRecord {
  id: number
  name: string
  category: string
  status: PlaceholderStatus
  owner: string
  updated: string
  amount: string
}

export const CATEGORY_OPTIONS: string[] = ['Category A', 'Category B', 'Category C']
export const STATUS_OPTIONS: PlaceholderStatus[] = ['Active', 'Inactive', 'Draft', 'Pending']
export const OWNER_OPTIONS: string[] = ['Owner A', 'Owner B', 'Owner C']

/** Cycles a fixed list — keeps `noUncheckedIndexedAccess` happy without assertions. */
function cycle<T>(values: readonly T[], index: number): T {
  return values[index % values.length] as T
}

/** Deterministic rows — the same page always renders the same table. */
export function makeRecords(count: number): PlaceholderRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1
    return {
      id: n,
      name: `Record name ${String(n).padStart(2, '0')}`,
      category: cycle(CATEGORY_OPTIONS, i),
      status: cycle(STATUS_OPTIONS, i),
      owner: cycle(OWNER_OPTIONS, i),
      updated: `Date value ${String((i % 12) + 1).padStart(2, '0')}`,
      amount: `Value ${String((n * 7) % 100).padStart(2, '0')}`,
    }
  })
}

/**
 * The one header set every template table uses. `hideBelow` is what
 * `useResponsiveTableHeaders` reads — the column-priority strategy the polish
 * playbook requires of every list view.
 */
export const RECORD_HEADERS: (ResponsiveHeader & { title: string; key: string })[] = [
  { title: 'Column A · Name', key: 'name', sortable: true },
  { title: 'Column B · Category', key: 'category' },
  { title: 'Status', key: 'status' },
  { title: 'Column C · Owner', key: 'owner', hideBelow: 'lg' as const },
  { title: 'Column D · Updated', key: 'updated', sortable: true, hideBelow: 'lg' as const },
  { title: 'Column E · Value', key: 'amount', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

/** Label/value pairs for the `<dl class="mp-label-value">` grids. */
export const FIELDS: { label: string; value: string }[] = [
  { label: 'Field A', value: 'Value A' },
  { label: 'Field B', value: 'Value B' },
  { label: 'Field C', value: 'Value C' },
  { label: 'Field D', value: 'Value D' },
]

export const SUPPORTING_TEXT = 'Supporting description text sits here, one line, muted.'
