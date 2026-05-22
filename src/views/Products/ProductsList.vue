<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const store = useCommerceStore()
const search = ref('')
const selected = ref<number[]>([])

// Multi-select filters
const filters = ref({
  category: [] as string[],
  status: [] as string[],
  vendor: [] as string[],
})

const filterOptions = {
  category: ['Electronics', 'Apparel', 'Home & Kitchen', 'Sports & Outdoors', 'Beauty & Health', 'Tools & Garden'],
  status: ['In Stock', 'Low Stock', 'Out of Stock'],
  vendor: ['Acme Corp', 'Brand House', 'Global Goods', 'Prime Supplier', 'Local Artisan'],
}

const filterLabels: Record<string, string> = {
  category: 'Category',
  status: 'Status',
  vendor: 'Vendor',
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
  ;(filters.value as any)[key] = []
}

function clearAllFilters() {
  filters.value = { category: [], status: [], vendor: [] }
}

function selectAll() {
  selected.value = filteredProducts.value.map(p => p.id)
}

const filteredProducts = computed(() => {
  let items = store.products
  if (filters.value.category.length) items = items.filter(p => p.category != null && filters.value.category.includes(p.category))
  if (filters.value.status.length) items = items.filter(p => p.status != null && filters.value.status.includes(p.status))
  if (filters.value.vendor.length) items = items.filter(p => p.vendor != null && filters.value.vendor.includes(p.vendor))
  return items
})

const headers = [
  { title: 'Product', key: 'name', sortable: true, minWidth: '280px' },
  { title: 'Category', key: 'category' },
  { title: 'Vendor', key: 'vendor' },
  { title: 'Price', key: 'price', align: 'end' as const, sortable: true },
  { title: 'Inventory', key: 'inventory', align: 'end' as const, sortable: true },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

const statusColor = (s: string) => s === 'In Stock' ? 'success' : s === 'Low Stock' ? 'warning' : 'error'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Products"
      :subtitle="`${filteredProducts.length} products`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="upload" class="text-none" color="surface">Import</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Add Product</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        title="All Products"
        v-model:search="search"
        :active-filters="activeFilterEntries"
        :selected-count="selected.length"
        :total-count="filteredProducts.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
        @clear-selection="selected = []"
        @select-all="selectAll"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filters.category"
              :items="filterOptions.category"
              label="Category"
              multiple
              chips
              closable-chips
              density="compact"
              variant="outlined"
              hide-details
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
              hide-details
              class="mb-3"
            />
            <v-select
              v-model="filters.vendor"
              :items="filterOptions.vendor"
              label="Vendor"
              multiple
              chips
              closable-chips
              density="compact"
              variant="outlined"
              hide-details
              class="mb-2"
            />
          </div>
        </template>

        <template #bulk-actions>
          <v-btn variant="text" size="small" prepend-icon="share" class="text-none">Export</v-btn>
          <v-btn variant="text" size="small" prepend-icon="trash-2" class="text-none text-error">Delete</v-btn>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="headers"
        :items="filteredProducts"
        v-model="selected"
        show-select
        item-value="id"
        :search="search"
        class="flex-grow-1"
        density="comfortable"
        fixed-header
        :items-per-page="15"
        hover
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <v-img
              :src="`https://picsum.photos/seed/${item.id}/32/32`"
              :width="32"
              :height="32"
              cover
              rounded="md"
              class="flex-shrink-0 border"
              style="width:32px;height:32px;min-width:32px;max-width:32px"
            >
              <template #error>
                <div class="w-100 h-100 d-flex align-center justify-center bg-surface-variant rounded-md">
                  <v-icon size="16" color="medium-emphasis">image</v-icon>
                </div>
              </template>
            </v-img>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.sku }} · {{ item.variants }} variant{{ item.variants > 1 ? 's' : '' }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.price="{ item }">
          <div>
            <span class="font-weight-medium">${{ item.price }}</span>
            <span v-if="item.compareAtPrice !== item.price" class="text-caption text-medium-emphasis ml-1 text-decoration-line-through">${{ item.compareAtPrice }}</span>
          </div>
        </template>

        <template v-slot:item.inventory="{ item }">
          <span :class="item.inventory < 20 ? 'text-error font-weight-bold' : item.inventory < 50 ? 'text-warning font-weight-bold' : ''">{{ item.inventory }}</span>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal">{{ item.status }}</v-chip>
        </template>

        <template v-slot:item.actions>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="pencil" title="Edit" />
              <v-list-item prepend-icon="copy" title="Duplicate" />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" />
            </v-list>
          </v-menu>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="package"
            :title="search ? 'No products match your search' : 'No products found'"
            :description="search ? 'Try a different search term.' : 'Add products to your catalogue to get started.'"
            action-label="Add Product"
            action-icon="plus"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
