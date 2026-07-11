<script setup lang="ts">
import { ref, computed } from 'vue'
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
const search = ref('')
const selected = ref<number[]>([])
const { loading } = useInitialLoad()

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

// ── Add / Edit drawer ───────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', sku: '', category: 'Electronics', vendor: 'Acme Corp', price: '', inventory: 0 })

const previewStatus = computed(() => form.value.inventory === 0 ? 'Out of Stock' : form.value.inventory < 20 ? 'Low Stock' : 'In Stock')

function openCreate() {
  editingId.value = null
  form.value = { name: '', sku: '', category: 'Electronics', vendor: 'Acme Corp', price: '', inventory: 0 }
  drawer.value = true
}

function openEdit(product: Product) {
  editingId.value = product.id
  form.value = { name: product.name, sku: product.sku, category: product.category, vendor: product.vendor, price: product.price, inventory: product.inventory }
  drawer.value = true
}

function saveProduct() {
  const payload = {
    name: form.value.name.trim() || 'Untitled product',
    sku: form.value.sku.trim(),
    category: form.value.category,
    vendor: form.value.vendor,
    price: Number(form.value.price || 0).toFixed(2),
    inventory: Number(form.value.inventory) || 0,
  }
  if (editingId.value !== null) {
    store.updateProduct(editingId.value, payload)
    notify('Product updated')
  } else {
    store.addProduct(payload)
    notify('Product added')
  }
  drawer.value = false
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

// ── Export ──────────────────────────────────────────────────────────
function exportProducts() {
  const rows = selected.value.length
    ? filteredProducts.value.filter(p => selected.value.includes(p.id))
    : filteredProducts.value
  downloadCsv('products', rows, [
    { title: 'Name', value: 'name' },
    { title: 'SKU', value: 'sku' },
    { title: 'Category', value: 'category' },
    { title: 'Vendor', value: 'vendor' },
    { title: 'Price', value: (p) => `$${p.price}` },
    { title: 'Inventory', value: 'inventory' },
    { title: 'Status', value: 'status' },
  ])
}

// ── Import wizard (drawer) ──────────────────────────────────────────
const importDrawer = ref(false)
const importStep = ref(1)
const importDelimiter = ref('Comma (,)')
const importCategory = ref('Electronics')
const fieldMappings = ref([
  { csvCol: 'product_name', sample: 'Wireless Earbuds Pro', field: 'Name' },
  { csvCol: 'sku_code', sample: 'SKU-45012', field: 'SKU' },
  { csvCol: 'unit_price', sample: '129.00', field: 'Price' },
  { csvCol: 'stock_qty', sample: '340', field: 'Inventory' },
  { csvCol: 'supplier', sample: 'Acme Corp', field: 'Vendor' },
])
const productFields = ['Name', 'SKU', 'Price', 'Inventory', 'Vendor', 'Category', 'Do not import']

function startImport() {
  importStep.value = 1
  importDrawer.value = true
}

function finishImport() {
  importDrawer.value = false
  notify('Import complete — 312 products added')
}

// ── Snackbar ────────────────────────────────────────────────────────
const snack = ref(false)
const snackText = ref('')
function notify(text: string) { snackText.value = text; snack.value = true }
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Products"
      :subtitle="`${filteredProducts.length} products`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="upload" class="text-none" color="surface" @click="startImport">Import</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">Add Product</v-btn>
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
            action-label="Add Product"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
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
      <v-btn variant="text" size="small" prepend-icon="share" class="text-none" @click="exportProducts">Export</v-btn>
      <v-btn variant="text" size="small" prepend-icon="trash-2" class="text-none text-error" @click="askBulkDelete">Delete</v-btn>
    </MpFloatingBulkBar>

    <!-- Add / Edit product drawer -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId !== null ? 'Edit Product' : 'Add Product'"
      subtitle="Catalogue details for this product"
    >
      <v-text-field v-model="form.name" label="Product name" variant="outlined" density="comfortable" class="mb-4" />
      <v-text-field v-model="form.sku" label="SKU" placeholder="Leave blank to auto-generate" variant="outlined" density="comfortable" class="mb-4" />
      <v-select v-model="form.category" :items="filterOptions.category" label="Category" variant="outlined" density="comfortable" class="mb-4" />
      <v-select v-model="form.vendor" :items="filterOptions.vendor" label="Vendor" variant="outlined" density="comfortable" class="mb-4" />
      <v-row dense>
        <v-col cols="6">
          <v-text-field v-model="form.price" label="Price ($)" type="number" min="0" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="6">
          <v-text-field v-model.number="form.inventory" label="Inventory" type="number" min="0" variant="outlined" density="comfortable" />
        </v-col>
      </v-row>
      <div class="d-flex align-center ga-2 mt-1">
        <span class="text-caption text-medium-emphasis">Stock status</span>
        <MpStatusChip :status="previewStatus" type="stock" size="x-small" show-icon />
      </div>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveProduct">
          {{ editingId !== null ? 'Save Changes' : 'Add Product' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <!-- Import wizard drawer -->
    <MpFormDrawer
      v-model="importDrawer"
      title="Import Products"
      :subtitle="`Step ${importStep} of 3`"
      :width="600"
    >
      <v-progress-linear :model-value="(importStep / 3) * 100" color="primary" height="3" rounded class="mb-5" />

      <!-- Step 1: Upload -->
      <div v-if="importStep === 1">
        <div class="text-subtitle-2 font-weight-bold mb-1">Upload your file</div>
        <div class="text-body-2 text-medium-emphasis mb-4">Supported: CSV, XLSX. Max 25MB. First row should be column headers.</div>
        <v-card variant="outlined" rounded="lg" class="pa-8 text-center mb-4" style="border-style: dashed; cursor: pointer;">
          <v-icon size="48" color="primary" class="mb-3">cloud-upload</v-icon>
          <div class="text-body-1 font-weight-medium mb-1">Drag & drop file here</div>
          <div class="text-caption text-medium-emphasis mb-4">or click to browse</div>
          <v-btn variant="flat" color="primary" class="text-none" prepend-icon="folder-open">Browse File</v-btn>
        </v-card>
        <v-select v-model="importDelimiter" :items="['Comma (,)', 'Semicolon (;)', 'Tab']" label="Delimiter" variant="outlined" density="comfortable" class="mb-4" />
        <v-select v-model="importCategory" :items="filterOptions.category" label="Import into category" variant="outlined" density="comfortable" />
      </div>

      <!-- Step 2: Map -->
      <div v-else-if="importStep === 2">
        <div class="text-subtitle-2 font-weight-bold mb-1">Map columns to product fields</div>
        <div class="text-body-2 text-medium-emphasis mb-4">We auto-detected {{ fieldMappings.length }} columns. Adjust mappings if needed.</div>
        <v-table density="compact">
          <thead><tr><th>CSV Column</th><th>Sample</th><th>Maps To</th></tr></thead>
          <tbody>
            <tr v-for="(m, i) in fieldMappings" :key="i">
              <td class="py-2 text-body-2 font-weight-medium">{{ m.csvCol }}</td>
              <td class="text-caption text-medium-emphasis">{{ m.sample }}</td>
              <td>
                <v-select v-model="m.field" :items="productFields" variant="outlined" density="compact" hide-details style="min-width: 150px;" />
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <!-- Step 3: Review -->
      <div v-else>
        <div class="text-subtitle-2 font-weight-bold mb-4">Review before importing</div>
        <v-row dense class="mb-4">
          <v-col cols="4"><v-card variant="tonal" color="primary" rounded="lg" class="pa-4 text-center"><div class="text-h5 font-weight-bold">324</div><div class="text-caption">Rows detected</div></v-card></v-col>
          <v-col cols="4"><v-card variant="tonal" color="success" rounded="lg" class="pa-4 text-center"><div class="text-h5 font-weight-bold">312</div><div class="text-caption">Valid products</div></v-card></v-col>
          <v-col cols="4"><v-card variant="tonal" color="warning" rounded="lg" class="pa-4 text-center"><div class="text-h5 font-weight-bold">12</div><div class="text-caption">Skipped</div></v-card></v-col>
        </v-row>
        <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2 mb-3">
          <strong>Duplicates:</strong> 18 products with matching SKUs will be <strong>updated</strong>, not duplicated.
        </v-alert>
        <v-alert type="success" variant="tonal" density="compact" rounded="lg" class="text-body-2">
          Importing into: <strong>{{ importCategory }}</strong>
        </v-alert>
      </div>

      <template #footer>
        <div class="w-100 d-flex justify-space-between align-center">
          <v-btn variant="text" class="text-none" @click="importStep > 1 ? importStep-- : importDrawer = false">
            {{ importStep === 1 ? 'Cancel' : '← Back' }}
          </v-btn>
          <v-btn v-if="importStep < 3" color="primary" variant="flat" class="text-none" @click="importStep++">Continue →</v-btn>
          <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="upload" @click="finishImport">Import 312 Products</v-btn>
        </div>
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
</style>
