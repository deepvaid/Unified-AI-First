<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useCommerceStore, type Product } from '@/stores/useCommerce'
import { downloadCsv } from '@/utils/exportCsv'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useCommerceStore()
const route = useRoute()
const router = useRouter()
const search = ref('')
const selected = ref<number[]>([])
const page = ref(1)
const ITEMS_PER_PAGE = 15
const viewMode = ref<'list' | 'grid'>('list')
const { loading } = useInitialLoad()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

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
  filters.value[key as keyof typeof filters.value] = []
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
  { title: 'Category', key: 'category', hideBelow: 'lg' as const },
  { title: 'Vendor', key: 'vendor', hideBelow: 'lg' as const },
  { title: 'Price', key: 'price', align: 'end' as const, sortable: true },
  { title: 'Inventory', key: 'inventory', align: 'end' as const, sortable: true, hideBelow: 'md' as const },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

const { visibleHeaders } = useResponsiveTableHeaders(headers)

// ── Create / Edit navigation (full-page wizards) ─────────────────────
function openNewProduct() {
  router.push({ name: 'ProductNew', params: { accountId: accountId.value } })
}
function openNewKit() {
  router.push({ name: 'ProductKitNew', params: { accountId: accountId.value } })
}
function openImport(source: 'csv' | 'ftp') {
  router.push({ name: source === 'csv' ? 'ProductImportCsv' : 'ProductImportFtp', params: { accountId: accountId.value } })
}
function openEdit(product: Product) {
  router.push({ name: 'ProductEdit', params: { accountId: accountId.value, productId: product.id } })
}

function duplicate(product: Product) {
  store.duplicateProduct(product.id)
  notify('Product duplicated')
}

// ── Delete (row + bulk) ─────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<Product | null>(null)
const bulkDelete = ref(false)

function askDelete(product: Product) {
  pendingDelete.value = product
  bulkDelete.value = false
  confirmDelete.value = true
}

function askBulkDelete() {
  pendingDelete.value = null
  bulkDelete.value = true
  confirmDelete.value = true
}

function doDelete() {
  if (bulkDelete.value) {
    const count = selected.value.length
    store.deleteProducts(selected.value)
    selected.value = []
    notify(`${count} product${count === 1 ? '' : 's'} deleted`)
  } else if (pendingDelete.value) {
    store.deleteProduct(pendingDelete.value.id)
    notify('Product deleted')
  }
  pendingDelete.value = null
  bulkDelete.value = false
}

const deleteMessage = computed(() =>
  bulkDelete.value
    ? `${selected.value.length} product${selected.value.length === 1 ? '' : 's'} will be permanently deleted. This cannot be undone.`
    : `“${pendingDelete.value?.name}” will be permanently deleted. This cannot be undone.`
)

// ── Export dialog (scoped) ───────────────────────────────────────────
const exportDialog = ref(false)
const exportScope = ref<'current' | 'all' | 'selected' | 'search'>('all')
const exportFileName = ref('')

const searchedProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return filteredProducts.value
  return filteredProducts.value.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.vendor.toLowerCase().includes(q) ||
    p.status.toLowerCase().includes(q),
  )
})
const currentPageProducts = computed(() =>
  searchedProducts.value.slice((page.value - 1) * ITEMS_PER_PAGE, page.value * ITEMS_PER_PAGE),
)
const selectedProducts = computed(() => filteredProducts.value.filter(p => selected.value.includes(p.id)))

function defaultExportName() {
  const today = new Date()
  const y = today.getFullYear()
  const d = String(today.getDate()).padStart(2, '0')
  const m = String(today.getMonth() + 1).padStart(2, '0')
  return `Product_Export_${y}-${d}-${m}`
}

function openExport() {
  exportFileName.value = defaultExportName()
  exportScope.value = selected.value.length ? 'selected' : 'all'
  exportDialog.value = true
}

const exportRows = computed<Product[]>(() => {
  switch (exportScope.value) {
    case 'current': return currentPageProducts.value
    case 'selected': return selectedProducts.value
    case 'search': return searchedProducts.value
    default: return store.products
  }
})

function runExport() {
  const name = exportFileName.value.trim() || defaultExportName()
  downloadCsv(name, exportRows.value, [
    { title: 'Name', value: 'name' },
    { title: 'SKU', value: 'sku' },
    { title: 'Category', value: 'category' },
    { title: 'Vendor', value: 'vendor' },
    { title: 'Price', value: (p) => `$${p.price}` },
    { title: 'Inventory', value: 'inventory' },
    { title: 'Status', value: 'status' },
  ])
  exportDialog.value = false
  notify(`Exported ${exportRows.value.length} product${exportRows.value.length === 1 ? '' : 's'} as CSV`)
}

// ── Snackbar (incl. cross-page flash from the wizards) ────────────────
const snack = ref(false)
const snackText = ref('')
function notify(text: string) { snackText.value = text; snack.value = true }

const flashMessages: Record<string, string> = {
  'product-draft': 'Product saved as draft',
  'product-published': 'Product published',
  'product-updated': 'Product updated',
  'kit-draft': 'Kit saved as draft',
  'kit-published': 'Kit published',
  'import-complete': 'Import complete — 312 products added',
}

onMounted(() => {
  const flash = route.query.flash
  const key = Array.isArray(flash) ? flash[0] : flash
  if (key && flashMessages[key]) {
    notify(flashMessages[key])
    router.replace({ query: {} })
  }
})
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Products"
      :subtitle="`${filteredProducts.length} products`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="openExport">Export</v-btn>

        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="flat" prepend-icon="upload" append-icon="chevron-down" class="text-none" color="surface">Import</v-btn>
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="file-text" title="CSV" @click="openImport('csv')" />
            <v-list-item prepend-icon="server" title="FTP" @click="openImport('ftp')" />
          </v-list>
        </v-menu>

        <v-btn-toggle v-model="viewMode" mandatory density="comfortable" variant="outlined" divided class="mp-view-toggle">
          <v-btn value="list" icon="list" size="small" aria-label="List view" />
          <v-btn value="grid" icon="layout-grid" size="small" aria-label="Grid view" />
        </v-btn-toggle>

        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" color="primary" variant="flat" prepend-icon="plus" append-icon="chevron-down" class="text-none">New Product</v-btn>
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="package" title="New Product" @click="openNewProduct" />
            <v-list-item prepend-icon="boxes" title="New Kit" @click="openNewKit" />
          </v-list>
        </v-menu>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        title="All Products"
        v-model:search="search"
        :active-filters="activeFilterEntries"
        :total-count="filteredProducts.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
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

      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        :headers="visibleHeaders"
        :items="filteredProducts"
        v-model="selected"
        v-model:page="page"
        show-select
        item-value="id"
        :search="search"
        class="flex-grow-1"
        density="comfortable"
        fixed-header
        :items-per-page="ITEMS_PER_PAGE"
        hover
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <v-img
              :src="`https://picsum.photos/seed/${item.id}/32/32`"
              alt=""
              :width="32"
              :height="32"
              cover
              rounded="md"
              class="flex-shrink-0 border product-thumb"
            >
              <template #error>
                <div class="w-100 h-100 d-flex align-center justify-center bg-surface-variant rounded-md">
                  <v-icon size="16" color="medium-emphasis">image</v-icon>
                </div>
              </template>
            </v-img>
            <div>
              <div class="text-body-2 font-weight-medium d-flex align-center gap-2">
                {{ item.name }}
                <v-chip v-if="item.type === 'kit'" size="x-small" variant="tonal" color="secondary" label>Kit</v-chip>
                <v-chip v-if="item.publishStatus === 'Draft'" size="x-small" variant="tonal" color="warning" label>Draft</v-chip>
              </div>
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
          <MpStatusChip :status="item.status" type="stock" show-icon />
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Product actions">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicate(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template #no-data>
          <MpEmptyState
            icon="package"
            :title="search ? 'No products match your search' : 'No products found'"
            :description="search ? 'Try a different search term.' : 'Add products to your catalogue to get started.'"
            action-label="New Product"
            action-icon="plus"
            class="py-10"
            @action="openNewProduct"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredProducts.length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <v-btn variant="text" size="small" prepend-icon="download" class="text-none" @click="openExport">Export</v-btn>
      <v-btn variant="text" size="small" prepend-icon="trash-2" class="text-none text-error" @click="askBulkDelete">Delete</v-btn>
    </MpFloatingBulkBar>

    <!-- Export dialog -->
    <MpFormDrawer
      v-model="exportDialog"
      title="Export Products"
      subtitle="Your products will be downloaded as a CSV file."
    >
      <div class="text-subtitle-2 font-weight-bold mb-2">What to export</div>
      <v-radio-group v-model="exportScope" hide-details class="mb-4">
        <v-radio value="current" label="Current Page" />
        <v-radio value="all" :label="`All Products (${store.products.length})`" />
        <v-radio value="selected" :disabled="!selected.length" :label="`Selected: ${selected.length} Products`" />
        <v-radio value="search" :disabled="!search.trim()" :label="`${searchedProducts.length} Products matching your search`" />
      </v-radio-group>

      <v-text-field
        v-model="exportFileName"
        label="File Name"
        suffix=".csv"
        variant="outlined"
        density="comfortable"
      />

      <template #footer>
        <v-btn variant="text" class="text-none" @click="exportDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="download" @click="runExport">Export</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="bulkDelete ? 'Delete selected products?' : 'Delete product?'"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />

    <v-snackbar v-model="snack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackText }}</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.product-thumb {
  width: 32px;
  height: 32px;
}
.mp-view-toggle {
  height: 40px;
}
</style>
