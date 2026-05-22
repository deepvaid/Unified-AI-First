<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const store = useCommerceStore()
const search = ref('')
const expanded = ref<string[]>([])
const selected = ref<string[]>([])
const activeTab = ref('all')

// Tabs matching real Maropost app
const tabs = computed(() => [
  { label: 'All Orders', key: 'all', count: tabCount('all') },
  { label: 'Completed', key: 'completed', count: tabCount('completed') },
  { label: 'Processing', key: 'processing', count: tabCount('processing') },
  { label: 'Not Fulfilled', key: 'not_fulfilled', count: tabCount('not_fulfilled') },
])

const headers = [
  { title: 'Order', key: 'orderNumber', sortable: true, width: 110 },
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Customer', key: 'customer.name' },
  { title: 'Items', key: 'itemCount', align: 'center' as const, width: 70 },
  { title: 'Total', key: 'total', align: 'end' as const, sortable: true },
  { title: 'Fulfillment', key: 'fulfillmentStatus' },
  { title: 'Payment', key: 'paymentStatus' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 48 },
  { title: '', key: 'data-table-expand', width: 40 },
]

// ─── Tab + Filter Filtering ───────────────────────────────────────────────────
const filteredOrders = computed(() => {
  let orders = store.orders

  // Tab-level filter
  switch (activeTab.value) {
    case 'completed':     orders = orders.filter(o => o.status === 'Completed'); break
    case 'processing':    orders = orders.filter(o => o.status === 'Processing'); break
    case 'not_fulfilled': orders = orders.filter(o => !['Shipped', 'Cancelled'].includes(o.fulfillmentStatus ?? '')); break
  }

  // Drawer-level filters (aligned to store enum values)
  if (filters.value.status) orders = orders.filter(o => o.status === filters.value.status)
  if (filters.value.fulfillment) orders = orders.filter(o => o.fulfillmentStatus === filters.value.fulfillment)
  if (filters.value.payment) orders = orders.filter(o => o.paymentStatus === filters.value.payment)

  return orders
})

const tabCount = (key: string) => {
  switch (key) {
    case 'all':           return store.orders.length
    case 'completed':     return store.orders.filter(o => o.status === 'Completed').length
    case 'processing':    return store.orders.filter(o => o.status === 'Processing').length
    case 'not_fulfilled': return store.orders.filter(o => !['Shipped', 'Cancelled'].includes(o.fulfillmentStatus ?? '')).length
    default: return 0
  }
}

// ─── Filters ──────────────────────────────────────────────────────────────────
const filters = ref({
  status: null as string | null,
  fulfillment: null as string | null,
  payment: null as string | null,
})

const filterOptions = {
  // Aligned to useCommerce.ts `orderStatuses`
  status: ['Processing', 'Completed', 'On Hold', 'Cancelled', 'Refunded'],
  // Aligned to useCommerce.ts `fulfillmentStatuses`
  fulfillment: ['Not Ready', 'Ready For Fulfillment', 'Shipped', 'Return Requested', 'Cancelled', 'Unapproved'],
  // Aligned to useCommerce.ts paymentStatus logic
  payment: ['Paid', 'Refunded', 'Voided'],
}

const filterLabels: Record<string, string> = {
  status: 'Order Status',
  fulfillment: 'Fulfillment',
  payment: 'Payment',
}

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v !== null)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
)

function removeFilter(key: string) {
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  filters.value = { status: null, fulfillment: null, payment: null }
}

function selectAll() {
  selected.value = filteredOrders.value.map((o: any) => o.id)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <!-- Page Header -->
    <MpPageHeader
      title="Sales Orders"
      :subtitle="`${store.orders.length} orders total · $${store.orders.reduce((a,o) => a + parseFloat(o.total), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lifetime revenue`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Create Draft Order</v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" />
      </template>
    </MpPageHeader>

    <!-- Main Table Card -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden table-card">
      <!-- Toolbar -->
      <MpDataTableToolbar
        v-model:search="search"
        title="All Orders"
        :active-filters="activeFilterEntries"
        :selected-count="selected.length"
        :total-count="filteredOrders.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
        @clear-selection="selected = []"
        @select-all="selectAll"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <div v-for="(options, key) in filterOptions" :key="key" class="mb-3">
              <v-select
                v-model="filters[key as keyof typeof filters]"
                :label="filterLabels[key]"
                :items="options"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </div>
          </div>
        </template>
        <template #bulk-actions>
          <v-btn size="small" variant="flat" color="success" prepend-icon="package-check" class="text-none" rounded="lg">Mark Fulfilled</v-btn>
          <v-btn size="small" variant="flat" color="secondary" prepend-icon="printer" class="text-none" rounded="lg">Print Labels</v-btn>
          <v-btn size="small" variant="flat" color="error" prepend-icon="ban" class="text-none" rounded="lg">Cancel Orders</v-btn>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selected"
        v-model:expanded="expanded"
        :headers="headers"
        :items="filteredOrders"
        :search="search"
        item-value="id"
        show-select
        show-expand
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <!-- Order number — clickable link style -->
        <template v-slot:item.orderNumber="{ item }">
          <span class="text-primary font-weight-bold cursor-pointer">{{ item.orderNumber }}</span>
        </template>

        <!-- Date — muted -->
        <template v-slot:item.date="{ item }">
          <span class="text-medium-emphasis text-body-2">{{ item.date }}</span>
        </template>

        <!-- Customer -->
        <template v-slot:item.customer.name="{ item }">
          <div class="d-flex align-center gap-2 py-1">
            <v-avatar color="primary" variant="tonal" size="32" class="text-caption font-weight-bold">
              {{ item.customer.avatar }}
            </v-avatar>
            <div>
              <div class="font-weight-medium text-body-2">{{ item.customer.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.customer.email }}</div>
            </div>
          </div>
        </template>

        <!-- Items count -->
        <template v-slot:item.itemCount="{ item }">
          <v-chip size="x-small" variant="tonal" color="secondary" class="font-weight-bold">{{ item.itemCount }}</v-chip>
        </template>

        <!-- Total -->
        <template v-slot:item.total="{ item }">
          <span class="font-weight-bold">${{ item.total }}</span>
        </template>

        <!-- Fulfillment Status — real Maropost values -->
        <template v-slot:item.fulfillmentStatus="{ item }">
          <MpStatusChip :status="item.fulfillmentStatus ?? ''" type="fulfillment" show-icon />
        </template>

        <!-- Payment Status -->
        <template v-slot:item.paymentStatus="{ item }">
          <MpStatusChip :status="item.paymentStatus ?? ''" type="payment" />
        </template>

        <!-- Order Status -->
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status ?? ''" type="order" variant="flat" />
        </template>

        <!-- Row actions — revealed on hover -->
        <template v-slot:item.actions>
          <div class="action-btns d-flex">
            <v-tooltip text="View order" location="top">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="eye" variant="text" size="x-small" color="medium-emphasis" aria-label="View order"></v-btn>
              </template>
            </v-tooltip>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="more-vertical" variant="text" size="x-small" color="medium-emphasis" aria-label="More actions"></v-btn>
              </template>
              <v-list density="compact" min-width="180">
                <v-list-item prepend-icon="pencil" title="Edit order" value="edit"></v-list-item>
                <v-list-item prepend-icon="package-check" title="Mark fulfilled" value="fulfill"></v-list-item>
                <v-list-item prepend-icon="printer" title="Print invoice" value="print"></v-list-item>
                <v-list-item prepend-icon="banknote" title="Refund" value="refund" class="text-error mt-1"></v-list-item>
                <v-list-item prepend-icon="ban" title="Cancel order" value="cancel" class="text-error"></v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>

        <!-- Expanded detail row -->
        <template v-slot:expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="pa-0" style="border-bottom: none !important;">
              <div class="expanded-row-content">
                <!-- Top bar: Customer + Payment + Fulfillment status + Actions -->
                <div class="d-flex align-center gap-4 px-5 py-3 expanded-top-bar">
                  <v-avatar color="primary" size="32" class="font-weight-bold text-white" style="font-size: 12px; flex-shrink: 0;">{{ item.customer.avatar }}</v-avatar>
                  <div style="min-width: 0;">
                    <div class="text-body-2 font-weight-medium">{{ item.customer.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.customer.email }}</div>
                  </div>
                  <v-divider vertical class="mx-1" style="height: 28px; opacity: 0.15;" />
                  <div class="d-flex align-center gap-2">
                    <v-icon size="14" color="medium-emphasis">credit-card</v-icon>
                    <span class="text-caption">{{ item.paymentMethod }}</span>
                    <MpStatusChip :status="item.paymentStatus ?? ''" type="payment" size="x-small" />
                  </div>
                  <v-divider vertical class="mx-1" style="height: 28px; opacity: 0.15;" />
                  <div class="d-flex align-center gap-2">
                    <span class="text-caption text-medium-emphasis">Fulfillment:</span>
                    <MpStatusChip :status="item.fulfillmentStatus ?? ''" type="fulfillment" show-icon size="x-small" />
                  </div>
                  <v-spacer />
                  <div class="d-flex gap-1">
                    <v-btn variant="flat" color="primary" size="x-small" class="text-none" prepend-icon="package-check">Mark Fulfilled</v-btn>
                    <v-btn variant="tonal" size="x-small" class="text-none" prepend-icon="printer">Print Invoice</v-btn>
                  </div>
                </div>

                <!-- Line items table -->
                <div class="px-5 pb-4 pt-2">
                  <v-table density="compact" class="rounded-lg expanded-items-table">
                    <thead>
                      <tr>
                        <th class="text-caption font-weight-bold expanded-th">Product</th>
                        <th class="text-caption font-weight-bold text-center expanded-th" style="width: 50px;">Qty</th>
                        <th class="text-caption font-weight-bold text-right expanded-th" style="width: 90px;">Price</th>
                        <th class="text-caption font-weight-bold text-right expanded-th" style="width: 100px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="li in item.lineItems" :key="li.sku">
                        <td>
                          <span class="text-body-2 font-weight-medium">{{ (li.product ?? '').substring(0, 50) }}{{ (li.product ?? '').length > 50 ? '…' : '' }}</span>
                          <span class="text-caption text-medium-emphasis ml-2">{{ li.sku }}</span>
                        </td>
                        <td class="text-center text-body-2">{{ li.qty }}</td>
                        <td class="text-right text-body-2">${{ li.price }}</td>
                        <td class="text-right font-weight-semibold text-body-2">${{ (li.qty * parseFloat(li.price)).toFixed(2) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="3" class="text-right text-caption text-medium-emphasis py-1">Subtotal</td>
                        <td class="text-right text-body-2 font-weight-medium">${{ item.subtotal }}</td>
                      </tr>
                      <tr>
                        <td colspan="3" class="text-right text-caption text-medium-emphasis py-0">Shipping</td>
                        <td class="text-right text-caption">${{ item.shipping }}</td>
                      </tr>
                      <tr>
                        <td colspan="3" class="text-right text-body-2 font-weight-bold py-1">Order Total</td>
                        <td class="text-right text-body-2 font-weight-bold text-primary">${{ item.total }}</td>
                      </tr>
                    </tfoot>
                  </v-table>
                  <div v-if="item.notes" class="mt-2 pa-2 rounded-lg d-flex align-center gap-2 text-caption text-medium-emphasis" style="background: rgba(var(--v-theme-warning), 0.06);">
                    <v-icon size="14" color="warning">file-text</v-icon>
                    {{ item.notes }}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="shopping-cart"
            :title="search ? 'No orders match your search' : 'No orders found'"
            :description="search ? 'Try a different search term.' : 'Orders will appear here once received.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.table-card {
  background: rgba(var(--v-theme-surface-variant), 0.2);
}

/* ─── Expanded Row ───────────────────────────────────────────── */
.expanded-row-content {
  background: rgba(var(--v-theme-surface-variant), 0.25);
  border-top: 1px solid rgba(var(--v-border-color), 0.06);
}

.expanded-top-bar {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.06);
}

.expanded-items-table {
  background: transparent !important;
}

.expanded-th {
  background: rgba(var(--v-theme-surface-variant), 0.4);
}

.expanded-items-table :deep(th),
.expanded-items-table :deep(td) {
  padding: 5px 10px !important;
  font-size: 13px;
}

.expanded-items-table :deep(tfoot td) {
  border-bottom: none !important;
}
</style>
