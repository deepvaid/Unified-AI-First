<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useRetailStore, type StockRow } from '@/stores/useRetail'

const store = useRetailStore()
const search = ref('')
const lowStockOnly = ref(false)
const categoryFilter = ref<string>('all')

const headers = computed(() => [
  { title: 'SKU', key: 'sku', sortable: true, width: 180 },
  { title: 'Product', key: 'productName', sortable: true },
  { title: 'Category', key: 'category', sortable: true, width: 140 },
  ...store.locationList.map((l) => ({
    title: l.name,
    key: `stockByLocation.${l.id}`,
    sortable: false,
    align: 'end' as const,
    width: 140,
  })),
  { title: 'Total', key: 'total', sortable: true, align: 'end' as const, width: 110 },
])

const categories = computed(() => {
  const set = new Set(store.stockList.map((s) => s.category))
  return [{ title: 'All categories', value: 'all' }, ...Array.from(set).map((c) => ({ title: c, value: c }))]
})

const enrichedRows = computed(() =>
  store.stockList.map((r) => ({
    ...r,
    total: Object.values(r.stockByLocation).reduce((s, v) => s + v, 0),
  })),
)

const filteredRows = computed(() => {
  let rows = enrichedRows.value
  if (categoryFilter.value !== 'all') rows = rows.filter((r) => r.category === categoryFilter.value)
  if (lowStockOnly.value) rows = rows.filter((r) => Object.values(r.stockByLocation).some((v) => v <= 3))
  return rows
})

function cellTone(qty: number): string {
  if (qty === 0) return 'text-error font-weight-bold'
  if (qty <= 3) return 'text-warning font-weight-medium'
  return ''
}

function locationStockKey(id: string): keyof StockRow['stockByLocation'] {
  return id as keyof StockRow['stockByLocation']
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Stock by Location"
      subtitle="Real-time stock visibility across every store. Read-only roll-up — use Bulk Inventory to adjust."
    />

    <v-card flat border rounded="lg" class="retail-widget-card flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Stock"
        search-placeholder="Search SKU or product…"
        :total-count="filteredRows.length"
      >
        <template #filter-content>
          <v-select
            v-model="categoryFilter"
            label="Category"
            density="comfortable"
            variant="outlined"
            hide-details
            :items="categories"
          />
          <v-switch
            v-model="lowStockOnly"
            label="Low stock only (≤ 3)"
            color="warning"
            density="compact"
            hide-details
            inset
          />
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="headers"
        :items="filteredRows"
        :search="search"
        item-value="sku"
        hover
        density="comfortable"
        :items-per-page="20"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.category="{ item }">
          <v-chip size="x-small" variant="tonal" color="default" class="font-weight-medium">{{ item.category }}</v-chip>
        </template>

        <template
          v-for="loc in store.locationList"
          :key="loc.id"
          #[`item.stockByLocation.${loc.id}`]="{ item }"
        >
          <span :class="cellTone(item.stockByLocation[locationStockKey(loc.id)] ?? 0)">
            {{ item.stockByLocation[locationStockKey(loc.id)] ?? 0 }}
          </span>
        </template>

        <template #item.total="{ item }">
          <span class="font-weight-bold">{{ item.total }}</span>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="package"
            :title="search ? 'No SKUs match your search' : 'No stock data'"
            description="Try a different keyword or clear filters."
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
