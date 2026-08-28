<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useCommerceStore, PRODUCT_TYPES, type Product, type ProductView } from '@/stores/useCommerce'
import { useProductExtrasStore } from '@/stores/useProductExtras'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpDialog from '@/components/MpDialog.vue'

/**
 * Products — the commerce catalog list. Rebuilt from UAT `/commerce/:id/products`;
 * see docs/rebuild/products-list/.
 */
const store = useCommerceStore()
const extras = useProductExtrasStore()
const salesChannels = useSalesChannelsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { loading } = useInitialLoad()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const search = ref('')
const selected = ref<number[]>([])
const page = ref(1)
const ITEMS_PER_PAGE = 10

// ── Filters ─────────────────────────────────────────────────────────
type Filters = ProductView['filters']

const emptyFilters = (): Filters => ({
  publishStatus: [], collections: [], productTypes: [], vendors: [], salesChannels: [],
  minPrice: '', maxPrice: '', kitted: 'any',
})

const filters = ref<Filters>(emptyFilters())

const collectionOptions = computed(() => extras.collections.map((c) => c.title))
const vendorOptions = computed(() => Array.from(new Set(store.products.map((p) => p.vendor))).sort())
const channelOptions = computed(() => {
  const names = salesChannels.channelsForAccount(accountId.value).map((c) => c.name)
  return names.length ? names : ['Online Store', 'POS', 'Amazon', 'eBay', 'Instagram Shop']
})

function clearAllFilters() {
  filters.value = emptyFilters()
  search.value = ''
  activeView.value = 'all'
  page.value = 1
}

const priceRangeError = computed(() => {
  const min = Number(filters.value.minPrice)
  const max = Number(filters.value.maxPrice)
  if (!filters.value.minPrice || !filters.value.maxPrice) return ''
  return max < min ? 'The maximum must be greater than the minimum' : ''
})

/** Human-readable chips for whatever is currently narrowing the table. */
const activeFilterEntries = computed(() => {
  const f = filters.value
  const entries: Array<{ key: string; label: string }> = []
  if (f.publishStatus.length) entries.push({ key: 'publishStatus', label: `Status: ${f.publishStatus.join(', ')}` })
  if (f.collections.length) entries.push({ key: 'collections', label: `Collection: ${f.collections.join(', ')}` })
  if (f.productTypes.length) entries.push({ key: 'productTypes', label: `Type: ${f.productTypes.join(', ')}` })
  if (f.vendors.length) entries.push({ key: 'vendors', label: `Brand: ${f.vendors.join(', ')}` })
  if (f.salesChannels.length) entries.push({ key: 'salesChannels', label: `Channel: ${f.salesChannels.join(', ')}` })
  if (f.minPrice || f.maxPrice) entries.push({ key: 'price', label: `Price: ${f.minPrice || '0'}–${f.maxPrice || '∞'}` })
  if (f.kitted !== 'any') entries.push({ key: 'kitted', label: f.kitted === 'yes' ? 'Kits only' : 'Excludes kits' })
  return entries
})

function removeFilter(key: string) {
  const f = filters.value
  if (key === 'price') { f.minPrice = ''; f.maxPrice = '' } else if (key === 'kitted') { f.kitted = 'any' } else {
    ;(f as unknown as Record<string, string[]>)[key] = []
  }
  page.value = 1
}

// ── Saved views ─────────────────────────────────────────────────────
const activeView = ref<string>('all')

const viewTabs = computed(() => [
  { label: 'All', key: 'all', count: store.products.length },
  ...store.productViews.map((v) => ({ label: v.name, key: String(v.id) })),
])

function onViewChange(key: string) {
  activeView.value = key
  page.value = 1
  if (key === 'all') {
    filters.value = emptyFilters()
    return
  }
  const view = store.productViews.find((v) => String(v.id) === key)
  if (view) filters.value = JSON.parse(JSON.stringify(view.filters))
}

const saveViewDialog = ref(false)
const newViewName = ref('')

function openSaveView() {
  newViewName.value = ''
  saveViewDialog.value = true
}

function saveView() {
  const name = newViewName.value.trim()
  if (!name) return
  const view = store.addProductView(name, filters.value)
  activeView.value = String(view.id)
  saveViewDialog.value = false
  toast.success(`View “${name}” saved`)
}

function deleteView(view: ProductView) {
  store.removeProductView(view.id)
  if (activeView.value === String(view.id)) onViewChange('all')
  toast.success(`View “${view.name}” removed`)
}

// ── Filtering ───────────────────────────────────────────────────────
const filteredProducts = computed(() => {
  const f = filters.value
  const term = search.value.trim().toLowerCase()
  return store.products.filter((p) => {
    if (term && !p.name.toLowerCase().includes(term) && !p.sku.toLowerCase().includes(term)) return false
    if (f.publishStatus.length && !f.publishStatus.includes(p.publishStatus)) return false
    if (f.collections.length && !p.collections.some((c) => f.collections.includes(c))) return false
    if (f.productTypes.length && !f.productTypes.includes(p.productType)) return false
    if (f.vendors.length && !f.vendors.includes(p.vendor)) return false
    if (f.salesChannels.length && !p.salesChannelNames.some((c) => f.salesChannels.includes(c))) return false
    const price = parseFloat(p.price) || 0
    if (f.minPrice && price < Number(f.minPrice)) return false
    if (f.maxPrice && price > Number(f.maxPrice)) return false
    if (f.kitted === 'yes' && p.type !== 'kit') return false
    if (f.kitted === 'no' && p.type === 'kit') return false
    return true
  })
})

const isFiltering = computed(() => Boolean(search.value.trim()) || activeFilterEntries.value.length > 0)

const headers = [
  { title: 'Name', key: 'name', sortable: true, minWidth: '280px' },
  { title: 'SKU', key: 'sku', sortable: true },
  { title: 'Stock', key: 'status', sortable: true },
  { title: 'Price', key: 'price', align: 'end' as const, sortable: true },
  { title: 'Categories', key: 'collections', sortable: false },
  { title: 'Status', key: 'publishStatus', sortable: true },
  { title: '', key: 'actions', sortable: false, width: 56 },
]

const money = (value: string) => `$${(parseFloat(value) || 0).toFixed(2)}`

// ── Navigation ──────────────────────────────────────────────────────
function openNewProduct() { router.push({ name: 'ProductNew', params: { accountId: accountId.value } }) }
function openNewKit() { router.push({ name: 'ProductKitNew', params: { accountId: accountId.value } }) }
function openImport(source: 'csv' | 'ftp') {
  router.push({ name: source === 'csv' ? 'ProductImportCsv' : 'ProductImportFtp', params: { accountId: accountId.value } })
}
function openImportLogs() { router.push({ name: 'ProductImportLogs', params: { accountId: accountId.value } }) }
function openEdit(product: Product) {
  router.push({ name: 'ProductEdit', params: { accountId: accountId.value, productId: product.id } })
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
    toast.success(`${count} product${count === 1 ? '' : 's'} deleted`)
  } else if (pendingDelete.value) {
    store.deleteProduct(pendingDelete.value.id)
    toast.success('Product deleted')
  }
  pendingDelete.value = null
  bulkDelete.value = false
}

const deleteMessage = computed(() =>
  bulkDelete.value
    ? `${selected.value.length} product${selected.value.length === 1 ? '' : 's'} will be permanently deleted, including their variants. This cannot be undone.`
    : `“${pendingDelete.value?.name}” will be permanently deleted, including its variants. This cannot be undone.`,
)

// ── Bulk edits ──────────────────────────────────────────────────────
type BulkKind = 'category' | 'collection' | 'channel'
const bulkDialog = ref(false)
const bulkKind = ref<BulkKind>('category')
const bulkValue = ref('')

const bulkCopy: Record<BulkKind, { title: string; label: string; options: () => string[] }> = {
  category: { title: 'Edit category', label: 'Category', options: () => Array.from(new Set(store.products.map((p) => p.category))).sort() },
  collection: { title: 'Edit collection', label: 'Collection', options: () => collectionOptions.value },
  channel: { title: 'Add sales channel', label: 'Sales channel', options: () => channelOptions.value },
}

function openBulk(kind: BulkKind) {
  bulkKind.value = kind
  bulkValue.value = ''
  bulkDialog.value = true
}

function applyBulk() {
  if (!bulkValue.value) return
  const count = selected.value.length
  if (bulkKind.value === 'category') store.setProductsCategory(selected.value, bulkValue.value)
  if (bulkKind.value === 'collection') store.setProductsCollection(selected.value, bulkValue.value)
  if (bulkKind.value === 'channel') store.addProductsSalesChannel(selected.value, bulkValue.value)
  bulkDialog.value = false
  selected.value = []
  toast.success(`${count} product${count === 1 ? '' : 's'} updated`)
}

function bulkPublish(status: 'Draft' | 'Published') {
  const count = selected.value.length
  store.setProductsPublishStatus(selected.value, status)
  selected.value = []
  toast.success(`${count} product${count === 1 ? '' : 's'} set to ${status.toLowerCase()}`)
}

// ── Export ──────────────────────────────────────────────────────────
const exportDialog = ref(false)
const exportScope = ref<'current' | 'all' | 'selected' | 'search'>('all')
const exportFileName = ref('')

const currentPageProducts = computed(() =>
  filteredProducts.value.slice((page.value - 1) * ITEMS_PER_PAGE, page.value * ITEMS_PER_PAGE),
)
const selectedProducts = computed(() => store.products.filter((p) => selected.value.includes(p.id)))

/** `Product_Export_2026-08-29` — UAT's own default garbles the month; this doesn't. */
function defaultExportName() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `Product_Export_${y}-${m}-${d}`
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
    case 'search': return filteredProducts.value
    default: return store.products
  }
})

function runExport() {
  const name = exportFileName.value.trim() || defaultExportName()
  downloadCsv(name, exportRows.value, [
    { title: 'Name', value: 'name' },
    { title: 'SKU', value: 'sku' },
    { title: 'Stock', value: 'status' },
    { title: 'Price', value: (p) => `$${p.price}` },
    { title: 'Categories', value: (p) => p.collections.join(' | ') },
    { title: 'Status', value: 'publishStatus' },
  ])
  exportDialog.value = false
  toast.success(`Exported ${exportRows.value.length} product${exportRows.value.length === 1 ? '' : 's'} as CSV`)
}

// ── Cross-page flash from the wizards ───────────────────────────────
const flashMessages: Record<string, string> = {
  'product-draft': 'Product saved as draft',
  'product-published': 'Product published',
  'product-updated': 'Product updated',
  'kit-draft': 'Kit saved as draft',
  'kit-published': 'Kit published',
  'import-complete': 'Import complete',
}

onMounted(() => {
  const flash = route.query.flash
  const key = Array.isArray(flash) ? flash[0] : flash
  if (key && flashMessages[key]) {
    toast.success(flashMessages[key]!)
    router.replace({ query: {} })
  }
})
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Commerce"
      title="Products"
      :subtitle="`${filteredProducts.length} of ${store.products.length} products`"
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="download" class="text-none" @click="openExport">Export</v-btn>

        <v-menu location="bottom end">
          <template #activator="{ props: menu }">
            <v-btn v-bind="menu" variant="outlined" prepend-icon="upload" append-icon="chevron-down" class="text-none">Import</v-btn>
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="file-text" title="Upload file" subtitle="CSV up to 150 MB" @click="openImport('csv')" />
            <v-list-item prepend-icon="server" title="Import over FTP" subtitle="Needs an SFTP connection" @click="openImport('ftp')" />
            <v-divider class="my-1" />
            <v-list-item prepend-icon="history" title="Import logs" @click="openImportLogs" />
          </v-list>
        </v-menu>

        <v-menu location="bottom end">
          <template #activator="{ props: menu }">
            <v-btn v-bind="menu" color="primary" variant="flat" prepend-icon="plus" append-icon="chevron-down" class="text-none">New product</v-btn>
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="package" title="New product" @click="openNewProduct" />
            <v-list-item prepend-icon="boxes" title="New kit" subtitle="A product built from other products" @click="openNewKit" />
          </v-list>
        </v-menu>
      </template>

      <template #tabs>
        <div class="d-flex align-center ga-2">
          <MpFilterTabs
            :model-value="activeView"
            :tabs="viewTabs"
            aria-label="Saved product views"
            controls-id="products-table"
            @update:model-value="onViewChange"
          />
          <v-menu v-if="store.productViews.length" location="bottom end">
            <template #activator="{ props: menu }">
              <v-btn v-bind="menu" icon="ellipsis" size="small" variant="text" aria-label="Manage saved views" />
            </template>
            <v-list density="compact">
              <v-list-subheader>Saved views</v-list-subheader>
              <v-list-item
                v-for="view in store.productViews"
                :key="view.id"
                :title="view.name"
                prepend-icon="trash-2"
                class="text-error"
                @click="deleteView(view)"
              />
            </v-list>
          </v-menu>
        </div>
      </template>
    </MpPageHeader>

    <v-card id="products-table" variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All products"
        search-placeholder="Search name or SKU"
        :total-count="filteredProducts.length"
        :active-filters="activeFilterEntries"
        :headers="headers"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <!-- Filter drawer: `hide-details` throughout is deliberate — a table
             filter never carries a hint, and the drawer is a dense surface. -->
        <template #filter-content>
          <MpFormSection title="Product" />
          <MpFormGrid>
            <v-select v-model="filters.publishStatus" :items="['Draft', 'Published']" label="Product status" multiple chips closable-chips hide-details />
            <v-select v-model="filters.collections" :items="collectionOptions" label="Product collection" multiple chips closable-chips hide-details />
            <v-select v-model="filters.productTypes" :items="PRODUCT_TYPES" label="Product type" multiple chips closable-chips hide-details />
            <v-select v-model="filters.vendors" :items="vendorOptions" label="Brand" multiple chips closable-chips hide-details />
            <v-select v-model="filters.salesChannels" :items="channelOptions" label="Sales channel" multiple chips closable-chips hide-details />
          </MpFormGrid>

          <MpFormSection title="Price" />
          <MpFormGrid :cols="2">
            <v-text-field v-model="filters.minPrice" label="Min price" type="number" prefix="$" min="0" />
            <v-text-field
              v-model="filters.maxPrice"
              label="Max price"
              type="number"
              prefix="$"
              min="0"
              :error-messages="priceRangeError ? [priceRangeError] : []"
            />
          </MpFormGrid>

          <MpFormSection title="Kits" />
          <MpFormField label="Kitted products">
            <template #default="{ labelId }">
              <v-radio-group v-model="filters.kitted" hide-details :aria-labelledby="labelId">
                <v-radio label="Include kits and products" value="any" />
                <v-radio label="Kits only" value="yes" />
                <v-radio label="Exclude kits" value="no" />
              </v-radio-group>
            </template>
          </MpFormField>

          <v-btn variant="outlined" prepend-icon="bookmark-plus" class="text-none align-self-start" @click="openSaveView">
            Save as view
          </v-btn>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />
      <v-data-table
        v-else
        v-model="selected"
        v-model:page="page"
        :headers="headers"
        :items="filteredProducts"
        :items-per-page="ITEMS_PER_PAGE"
        item-value="id"
        show-select
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template #header.data-table-select="{ allSelected, selectAll, someSelected }">
          <v-checkbox-btn
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            aria-label="Select all rows"
            @update:model-value="selectAll(!allSelected)"
          />
        </template>
        <template #item.data-table-select="{ internalItem, isSelected, toggleSelect }">
          <v-checkbox-btn
            :model-value="isSelected(internalItem)"
            :aria-label="`Select ${internalItem.raw.name}`"
            @update:model-value="toggleSelect(internalItem)"
          />
        </template>
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <v-avatar :size="36" rounded="lg" class="border flex-shrink-0">
              <div class="prod-thumb"><v-icon size="16">image</v-icon></div>
            </v-avatar>
            <div>
              <RouterLink
                :to="{ name: 'ProductEdit', params: { accountId, productId: item.id } }"
                class="prod-link text-body-2 font-weight-medium"
              >
                {{ item.name }}
              </RouterLink>
              <div v-if="item.variants > 1" class="text-caption text-medium-emphasis">{{ item.variants }} variants</div>
              <div v-else-if="item.type === 'kit'" class="text-caption text-medium-emphasis">Kit</div>
            </div>
          </div>
        </template>
        <template #item.sku="{ item }">
          <span class="prod-mono text-body-2">{{ item.sku }}</span>
        </template>
        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>
        <template #item.price="{ item }">
          <span class="text-body-2">{{ money(item.price) }}</span>
        </template>
        <template #item.collections="{ item }">
          <div v-if="item.collections.length" class="d-flex flex-wrap ga-1">
            <v-chip size="x-small" variant="tonal" label>{{ item.collections[0] }}</v-chip>
            <v-tooltip v-if="item.collections.length > 1" location="top" :text="item.collections.slice(1).join(', ')">
              <template #activator="{ props: tip }">
                <v-chip v-bind="tip" size="x-small" variant="text" tabindex="0">+{{ item.collections.length - 1 }} more</v-chip>
              </template>
            </v-tooltip>
          </div>
          <span v-else class="text-body-2 text-medium-emphasis">Not in a collection</span>
        </template>
        <template #item.publishStatus="{ item }">
          <MpStatusChip :status="item.publishStatus" type="general" size="sm" />
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Product actions" :item-label="item.name">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template #no-data>
          <MpEmptyState
            :icon="isFiltering ? 'search-x' : 'package'"
            :title="isFiltering ? 'No products match your filters' : 'No products yet'"
            :description="isFiltering ? 'Try a different term, or clear the filters to see the whole catalog.' : 'Add your first product or import a catalog to get started.'"
            :action-label="isFiltering ? 'Clear all filters' : 'New product'"
            :action-icon="isFiltering ? 'x' : 'plus'"
            class="py-10"
            @action="isFiltering ? clearAllFilters() : openNewProduct()"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar :count="selected.length" :total="filteredProducts.length" @clear="selected = []">
      <v-btn variant="text" class="text-none" prepend-icon="file-pen-line" @click="bulkPublish('Draft')">Set as draft</v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="globe" @click="bulkPublish('Published')">Publish</v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="tags" @click="openBulk('category')">Category</v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="folder" @click="openBulk('collection')">Collection</v-btn>
      <v-btn variant="text" class="text-none" prepend-icon="store" @click="openBulk('channel')">Sales channel</v-btn>
      <v-btn variant="text" class="text-none text-error" prepend-icon="trash-2" @click="askBulkDelete">Delete</v-btn>
    </MpFloatingBulkBar>

    <MpDialog v-model="saveViewDialog" title="Save this view" subtitle="It appears as a tab above the table" size="sm">
      <v-text-field
        v-model="newViewName"
        label="View name *"
        placeholder="e.g. Draft apparel"
        :error-messages="newViewName.trim() ? [] : ['Give the view a name']"
      />
      <template #footer>
        <v-btn variant="text" class="text-none" @click="saveViewDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!newViewName.trim()" @click="saveView">Save view</v-btn>
      </template>
    </MpDialog>

    <!-- ── Bulk edit dialog ────────────────────────────────────────── -->
    <MpDialog v-model="bulkDialog" :title="bulkCopy[bulkKind].title" :subtitle="`Applies to ${selected.length} selected product${selected.length === 1 ? '' : 's'}`" size="sm">
      <v-combobox
        v-model="bulkValue"
        :items="bulkCopy[bulkKind].options()"
        :label="`${bulkCopy[bulkKind].label} *`"
        :error-messages="bulkValue ? [] : [`Choose a ${bulkCopy[bulkKind].label.toLowerCase()}`]"
      />
      <template #footer>
        <v-btn variant="text" class="text-none" @click="bulkDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!bulkValue" @click="applyBulk">Apply to selection</v-btn>
      </template>
    </MpDialog>

    <!-- ── Export dialog ───────────────────────────────────────────── -->
    <MpDialog v-model="exportDialog" title="Export products" subtitle="Downloads a CSV of the rows you choose" size="md">
      <MpFormField label="Rows to export">
        <template #default="{ labelId }">
          <v-radio-group v-model="exportScope" hide-details :aria-labelledby="labelId">
            <v-radio :label="`Current page (${currentPageProducts.length})`" value="current" />
            <v-radio :label="`All products (${store.products.length})`" value="all" />
            <v-radio :label="`Selected products (${selected.length})`" value="selected" :disabled="selected.length === 0" />
            <v-radio :label="`Products matching your filters (${filteredProducts.length})`" value="search" :disabled="!isFiltering" />
          </v-radio-group>
        </template>
      </MpFormField>

      <MpFormSection title="File name" />
      <v-text-field v-model="exportFileName" label="File name" suffix=".csv" />

      <template #footer>
        <v-btn variant="text" class="text-none" @click="exportDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="download" @click="runExport">Export</v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="bulkDelete ? 'Delete selected products?' : 'Delete this product?'"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.prod-thumb {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
}

.prod-mono {
  font-family: var(--mp-fontFamily-mono);
}

.prod-link {
  color: rgb(var(--v-theme-primary));
}
</style>
