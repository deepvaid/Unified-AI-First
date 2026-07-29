<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore, type InventoryItem } from '@/stores/useCommerce'
import { useRetailStore } from '@/stores/useRetail'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { downloadCsv } from '@/utils/exportCsv'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'

const store = useCommerceStore()
const route = useRoute()
const router = useRouter()
const search = ref('')
const { loading } = useInitialLoad()

/**
 * One inventory surface, three lenses: the SKU list, a per-location pivot
 * (what Retail used to call "Stock by location"), and the bulk import history.
 */
type InventoryView = 'list' | 'locations' | 'imports'
const VIEW_TABS: { label: string; key: InventoryView }[] = [
  { label: 'All stock', key: 'list' },
  { label: 'By location', key: 'locations' },
  { label: 'Imports', key: 'imports' },
]
const view = computed<InventoryView>(() => {
  const v = route.query.view
  return v === 'locations' || v === 'imports' ? v : 'list'
})
function setView(next: string) {
  router.replace({ query: next === 'list' ? {} : { view: next } })
}

// Locations are shared with Retail: stores and warehouses in one keyspace.
const retail = useRetailStore()
const locationOptions = computed(() => retail.locationList.map((l) => ({ id: l.id, name: l.name, kind: l.kind })))
const locationName = (id: string) => retail.locationName(id)

// KPI breakdown — computed from live inventory slice
const kpis = computed(() => [
  { label: 'Total Units', value: store.inventory.reduce((sum, i) => sum + i.inventory, 0).toLocaleString(), icon: 'library', color: 'primary' },
  { label: 'In Stock', value: store.inventory.filter(i => i.status === 'In Stock').length, icon: 'circle-check', color: 'success' },
  { label: 'Low Stock', value: store.inventory.filter(i => i.status === 'Low Stock').length, icon: 'alert-triangle', color: 'warning' },
  { label: 'Out of Stock', value: store.inventory.filter(i => i.status === 'Out of Stock').length, icon: 'circle-x', color: 'error' },
])

// Multi-select filters
const filters = ref({
  location: [] as string[],
  status: [] as string[],
})

const filterOptions = computed(() => ({
  location: locationOptions.value.map((l) => l.name),
  status: ['In Stock', 'Low Stock', 'Out of Stock'],
}))

const filterLabels: Record<string, string> = {
  location: 'Location',
  status: 'Status',
}

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v.length > 0)
    .map(([key, value]) => ({
      key,
      label: `${filterLabels[key]}: ${(value as string[]).join(', ')}`,
    }))
)

function removeFilter(key: string) {
  filters.value[key as keyof typeof filters.value] = []
}

function clearAllFilters() {
  filters.value = { location: [], status: [] }
}

const filteredInventory = computed(() => {
  let items = store.inventory
  if (filters.value.location.length) items = items.filter(p => filters.value.location.includes(locationName(p.locationId)))
  if (filters.value.status.length) items = items.filter(p => filters.value.status.includes(p.status))
  return items
})

const headers = [
  { title: 'Product', key: 'name', sortable: true, minWidth: '260px' },
  { title: 'Avail. Inventory', key: 'inventory', align: 'end' as const, sortable: true },
  { title: 'On Order / Incoming', key: 'incoming', align: 'end' as const, sortable: true },
  { title: 'Status', key: 'status' },
  { title: 'Location', key: 'locationId' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// ── Adjust Stock drawer ─────────────────────────────────────────────
const adjustDrawer = ref(false)
const adjustItem = ref<InventoryItem | null>(null)
const adjustMode = ref<'set' | 'delta'>('set')
const adjustValue = ref(0)
const adjustReason = ref('Recount')
const REASONS = ['Recount', 'Received shipment', 'Damaged / shrinkage', 'Customer return', 'Correction']

function openAdjust(item: InventoryItem) {
  adjustItem.value = item
  adjustMode.value = 'set'
  adjustValue.value = item.inventory
  adjustReason.value = 'Recount'
  adjustDrawer.value = true
}

const adjustPreview = computed(() => {
  if (!adjustItem.value) return 0
  return adjustMode.value === 'set'
    ? Math.max(0, Number(adjustValue.value) || 0)
    : Math.max(0, adjustItem.value.inventory + (Number(adjustValue.value) || 0))
})

function saveAdjust() {
  if (adjustItem.value) {
    store.adjustStock(adjustItem.value.id, adjustPreview.value)
    notify('Stock adjusted')
  }
  adjustDrawer.value = false
}

// ── Transfer drawer ─────────────────────────────────────────────────
const transferDrawer = ref(false)
const transferItem = ref<InventoryItem | null>(null)
const transferTo = ref('')
const transferQty = ref(1)

function openTransfer(item: InventoryItem) {
  transferItem.value = item
  transferTo.value = locationOptions.value.find(l => l.id !== item.locationId)?.id ?? item.locationId
  transferQty.value = 1
  transferDrawer.value = true
}

const transferOptions = computed(() =>
  locationOptions.value
    .filter(l => l.id !== transferItem.value?.locationId)
    .map(l => ({ title: l.name, value: l.id })),
)

function saveTransfer() {
  if (transferItem.value && transferTo.value) {
    store.transferStock(transferItem.value.id, transferTo.value, transferQty.value)
    notify(`Moved ${transferQty.value} to ${locationName(transferTo.value)}`)
  }
  transferDrawer.value = false
}

/** Rows for the per-location pivot: one row per SKU, one column per location. */
interface PivotRow {
  id: number
  name: string
  sku: string
  total: number
  /** One entry per location id. */
  [locationId: string]: string | number
}

const pivotRows = computed<PivotRow[]>(() =>
  filteredInventory.value.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    total: item.inventory,
    ...Object.fromEntries(locationOptions.value.map((l) => [l.id, item.stockByLocation[l.id] ?? 0])),
  })),
)

const pivotHeaders = computed(() => [
  { title: 'Product', key: 'name', sortable: true },
  ...locationOptions.value.map((l) => ({ title: l.name, key: l.id, align: 'end' as const, sortable: true })),
  { title: 'Total', key: 'total', align: 'end' as const, sortable: true },
])

const importHeaders = [
  { title: 'File', key: 'fileName' },
  { title: 'Rows changed', key: 'rowsChanged', align: 'end' as const },
  { title: 'Reason', key: 'reason' },
  { title: 'User', key: 'user' },
  { title: 'When', key: 'at' },
  { title: 'Status', key: 'status' },
]

/** Low/none stock emphasis for a pivot cell. */
function cellClass(qty: number): string {
  if (qty === 0) return 'text-error font-weight-bold'
  if (qty < 5) return 'text-warning font-weight-medium'
  return ''
}

const importDateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const formatImportDate = (iso: string) => importDateFmt.format(new Date(iso))

// ── Export ──────────────────────────────────────────────────────────
function exportInventory() {
  downloadCsv('inventory', filteredInventory.value, [
    { title: 'Product', value: 'name' },
    { title: 'SKU', value: 'sku' },
    { title: 'Available', value: 'inventory' },
    { title: 'Incoming', value: 'incoming' },
    { title: 'Status', value: 'status' },
    { title: 'Location', value: (row: InventoryItem) => locationName(row.locationId) },
  ])
}

// ── Snackbar ────────────────────────────────────────────────────────
const snack = ref(false)
const snackText = ref('')
function notify(text: string) { snackText.value = text; snack.value = true }
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Inventory"
      :subtitle="`${store.inventory.length} SKUs across ${locationOptions.length} locations`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportInventory">Export</v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs :model-value="view" :tabs="VIEW_TABS" aria-label="Inventory views" @update:model-value="setView" />

    <v-row dense>
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <MpKpiCard :label="kpi.label" :value="kpi.value" :icon="kpi.icon" :color="kpi.color" />
      </v-col>
    </v-row>

    <v-card v-if="view === 'list'" variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        title="Inventory Items"
        v-model:search="search"
        :active-filters="activeFilterEntries"
        :total-count="filteredInventory.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <v-select
            v-model="filters.location"
            :items="filterOptions.location"
            label="Location"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            rounded="lg"
            hide-details
            placeholder="All"
            persistent-placeholder
            class="mb-3"
          />
          <v-select
            v-model="filters.status"
            :items="filterOptions.status"
            label="Status"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            rounded="lg"
            hide-details
            placeholder="All"
            persistent-placeholder
            class="mb-2"
          />
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        :headers="headers"
        :items="filteredInventory"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <v-img
              :src="`https://picsum.photos/seed/${item.id}/32/32`"
              :width="32"
              :height="32"
              cover
              rounded="md"
              class="flex-shrink-0 border inventory-thumb"
            >
              <template #error>
                <div class="w-100 h-100 d-flex align-center justify-center bg-surface-variant rounded-md">
                  <v-icon size="16" class="text-medium-emphasis">image</v-icon>
                </div>
              </template>
            </v-img>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.sku }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.inventory="{ item }">
          <span :class="item.inventory === 0 ? 'text-error font-weight-bold' : item.inventory < 20 ? 'text-warning font-weight-bold' : 'font-weight-medium'" style="font-variant-numeric: tabular-nums">{{ item.inventory }}</span>
        </template>

        <template v-slot:item.incoming="{ item }">
          <span v-if="item.incoming > 0" class="text-medium-emphasis" style="font-variant-numeric: tabular-nums">
            <v-icon size="13" class="me-1" color="info">truck</v-icon>{{ item.incoming }}
          </span>
          <span v-else class="text-disabled">—</span>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="stock" show-icon />
        </template>

        <template v-slot:item.locationId="{ item }">
          <div class="d-flex align-center gap-2">
            <v-icon size="15" class="text-medium-emphasis">map-pin</v-icon>
            <span class="text-body-2">{{ locationName(item.locationId) }}</span>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Inventory item actions">
            <v-list-item prepend-icon="pencil" title="Adjust Stock" @click="openAdjust(item)" />
            <v-list-item prepend-icon="arrow-left-right" title="Transfer" @click="openTransfer(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="package"
            :title="search ? 'No items match your search' : 'No inventory items'"
            :description="search ? 'Try a different search term or clear your filters.' : 'Your product inventory will appear here once products are added to your store.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Per-location pivot: what Retail called "Stock by location". -->
    <v-card v-else-if="view === 'locations'" variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        title="Stock by location"
        v-model:search="search"
        :total-count="pivotRows.length"
      />
      <MpTableSkeleton v-if="loading" :rows="8" :columns="locationOptions.length + 2" />
      <v-data-table
        v-else
        :headers="pivotHeaders"
        :items="pivotRows"
        :search="search"
        item-value="id"
        density="comfortable"
        class="mp-table"
      >
        <template v-slot:item.name="{ item }">
          <div>
            <div class="text-body-2 font-weight-medium">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.sku }}</div>
          </div>
        </template>

        <template v-for="loc in locationOptions" :key="loc.id" v-slot:[`item.${loc.id}`]="{ item }">
          <span
            :class="cellClass(Number(item[loc.id] ?? 0))"
            style="font-variant-numeric: tabular-nums"
          >{{ item[loc.id] }}</span>
        </template>

        <template v-slot:item.total="{ item }">
          <span class="font-weight-bold" style="font-variant-numeric: tabular-nums">{{ item.total }}</span>
        </template>

        <template v-slot:no-data>
          <MpEmptyState icon="boxes" title="No stock to show" description="Stock levels appear here once products are stocked at a location." />
        </template>
      </v-data-table>
    </v-card>

    <!-- Bulk stock updates, formerly Retail > Bulk inventory. -->
    <v-card v-else variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar title="Stock imports" :total-count="store.inventoryImports.length">
        <template #actions>
          <v-btn color="primary" variant="flat" prepend-icon="upload" class="text-none" @click="notify('CSV upload is not wired up in the prototype')">Upload CSV</v-btn>
        </template>
      </MpDataTableToolbar>
      <v-data-table
        :headers="importHeaders"
        :items="store.inventoryImports"
        item-value="id"
        density="comfortable"
        class="mp-table"
      >
        <template v-slot:item.at="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatImportDate(item.at) }}</span>
        </template>
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status === 'completed' ? 'Completed' : item.status === 'partial' ? 'Partial' : 'Failed'" type="general" size="x-small" />
        </template>
        <template v-slot:no-data>
          <MpEmptyState icon="upload" title="No imports yet" description="Bulk stock updates you run will be listed here." />
        </template>
      </v-data-table>
    </v-card>

    <!-- Adjust Stock drawer -->
    <MpFormDrawer
      v-model="adjustDrawer"
      title="Adjust Stock"
      :subtitle="adjustItem?.name"
    >
      <v-text-field :model-value="adjustItem ? locationName(adjustItem.locationId) : ''" label="Location" variant="outlined" density="comfortable" readonly class="mb-4" prepend-inner-icon="map-pin" />
      <v-btn-toggle v-model="adjustMode" mandatory density="comfortable" variant="outlined" divided class="mb-4 w-100">
        <v-btn value="set" class="text-none flex-grow-1">Set new count</v-btn>
        <v-btn value="delta" class="text-none flex-grow-1">Adjust by +/−</v-btn>
      </v-btn-toggle>
      <v-text-field
        v-model.number="adjustValue"
        :label="adjustMode === 'set' ? 'New count' : 'Change (e.g. -5 or 20)'"
        type="number"
        variant="outlined"
        density="comfortable"
        class="mb-4"
      />
      <v-select v-model="adjustReason" :items="REASONS" label="Reason" variant="outlined" density="comfortable" class="mb-4" />
      <v-card variant="tonal" color="primary" rounded="lg" class="pa-4 d-flex align-center justify-space-between">
        <div>
          <div class="text-caption text-medium-emphasis">New available</div>
          <div class="text-h5 font-weight-bold">{{ adjustPreview }}</div>
        </div>
        <div class="text-caption text-medium-emphasis">was {{ adjustItem?.inventory ?? 0 }}</div>
      </v-card>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="adjustDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveAdjust">Save Adjustment</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Transfer drawer -->
    <MpFormDrawer
      v-model="transferDrawer"
      title="Transfer Stock"
      :subtitle="transferItem?.name"
    >
      <v-text-field :model-value="transferItem ? locationName(transferItem.locationId) : ''" label="From location" variant="outlined" density="comfortable" readonly class="mb-4" prepend-inner-icon="map-pin" />
      <v-select v-model="transferTo" :items="transferOptions" label="To location" variant="outlined" density="comfortable" class="mb-4" prepend-inner-icon="map-pin" />
      <v-text-field v-model.number="transferQty" label="Quantity" type="number" min="1" variant="outlined" density="comfortable" />

      <template #footer>
        <v-btn variant="text" class="text-none" @click="transferDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="arrow-left-right" :disabled="!transferTo" @click="saveTransfer">Transfer</v-btn>
      </template>
    </MpFormDrawer>

    <v-snackbar v-model="snack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackText }}</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.inventory-thumb {
  flex: 0 0 32px;
  width: 32px !important;
  height: 32px !important;
  aspect-ratio: 1 / 1;
}
</style>
