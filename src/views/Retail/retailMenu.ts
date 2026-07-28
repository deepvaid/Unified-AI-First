import type { RouteLocationRaw } from 'vue-router'
import type { MpSectionRailGroup } from '@/components/MpSectionRail.vue'

/**
 * Retail workspace sections.
 *
 * Retail Cloud is POS operations layered on the shared commerce backbone, so
 * "Catalog & stock" links out to the shared Products surfaces rather than
 * repeating them — one catalog, one inventory, one price list.
 */
export function retailMenu(accountId: string, locationsRoute: RouteLocationRaw): MpSectionRailGroup[] {
  return [
    {
      items: [
        {
          slug: 'overview',
          label: 'Overview',
          icon: 'layout-dashboard',
          to: { name: 'RetailHome', params: { accountId } },
          match: ['RetailHome'],
        },
      ],
    },
    {
      title: 'Sell',
      items: [
        {
          slug: 'transactions',
          label: 'Transactions',
          icon: 'receipt',
          to: { name: 'RetailTransactions', params: { accountId } },
          match: ['RetailTransactions'],
        },
        {
          slug: 'pos-preview',
          label: 'POS preview',
          icon: 'tablet-smartphone',
          to: { name: 'RetailPosPreview', params: { accountId } },
          match: ['RetailPosPreview'],
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          slug: 'locations',
          label: 'Locations',
          icon: 'map-pin',
          to: locationsRoute,
          match: ['SalesChannelLocations', 'SalesChannelLocationDetail'],
        },
        {
          slug: 'registers',
          label: 'Registers',
          icon: 'monitor-smartphone',
          to: { name: 'RetailRegisters', params: { accountId } },
          match: ['RetailRegisters'],
        },
        {
          slug: 'staff',
          label: 'Staff',
          icon: 'users',
          to: { name: 'RetailStaff', params: { accountId } },
          match: ['RetailStaff'],
        },
      ],
    },
    {
      // Shared with Commerce — the rail links out rather than duplicating them.
      title: 'Catalog & stock',
      items: [
        {
          slug: 'stock',
          label: 'Stock by location',
          icon: 'boxes',
          to: { name: 'Inventory', params: { accountId }, query: { view: 'locations' } },
        },
        {
          slug: 'bulk-inventory',
          label: 'Stock imports',
          icon: 'upload',
          to: { name: 'Inventory', params: { accountId }, query: { view: 'imports' } },
        },
        {
          slug: 'pricing',
          label: 'Price lists',
          icon: 'tags',
          to: { name: 'PriceLists', params: { accountId } },
        },
      ],
    },
    {
      title: 'Setup',
      items: [
        {
          slug: 'hardware',
          label: 'Hardware',
          icon: 'printer',
          to: { name: 'RetailHardware', params: { accountId } },
          match: ['RetailHardware'],
        },
        {
          slug: 'payments',
          label: 'Payments',
          icon: 'credit-card',
          to: { name: 'RetailPayments', params: { accountId } },
          match: ['RetailPayments'],
        },
        {
          slug: 'receipts',
          label: 'Receipts',
          icon: 'file-text',
          to: { name: 'RetailReceipts', params: { accountId } },
          match: ['RetailReceipts'],
        },
        {
          slug: 'settings',
          label: 'Settings',
          icon: 'settings',
          to: { name: 'RetailSettings', params: { accountId } },
          match: ['RetailSettings'],
        },
      ],
    },
  ]
}
