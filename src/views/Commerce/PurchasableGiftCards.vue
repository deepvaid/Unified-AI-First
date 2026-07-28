<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useCommerceStore, type PurchasableGiftCard, type PurchasableGiftCardInput, type PurchasableGiftCardStatus } from '@/stores/useCommerce'
import { downloadCsv } from '@/utils/exportCsv'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useCommerceStore()
const search = ref('')
const selected = ref<number[]>([])
const { loading } = useInitialLoad()

const money = (n: number) => `$${n.toLocaleString('en-US')}`

// Organise option sets (small static sets, mirrors product organise).
const TAX_CATEGORIES = ['Standard', 'Reduced', 'Zero-rated', 'Exempt']
const BRANDS = ['Acme Corp', 'Brand House', 'Global Goods', 'Prime Supplier', 'Local Artisan']
const TAGS = ['Featured', 'New', 'Sale', 'Seasonal', 'Clearance']
const COLLECTIONS = ['Gifts', 'Best Sellers', 'Holiday', 'Corporate']

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// ── Create / Edit drawer ──────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const isEdit = computed(() => editingId.value !== null)
const organiseOpen = ref<number[]>([])

const blankProduct = (): PurchasableGiftCardInput => ({
  name: '',
  slug: '',
  kind: 'Digital',
  message: '',
  denominations: [25, 50, 100],
  status: 'Draft',
  taxCategory: undefined,
  brand: undefined,
  tags: [],
  collections: [],
})
const form = ref<PurchasableGiftCardInput>(blankProduct())
const submitted = ref(false)
const slugTouched = ref(false)

// Auto-derive the URL slug from the name until the user edits it.
watch(() => form.value.name, (name) => {
  if (!slugTouched.value) form.value.slug = slugify(name)
})

const validDenominations = computed(() => form.value.denominations.filter(d => Number(d) > 0))
const formValid = computed(() => form.value.name.trim().length > 0 && validDenominations.value.length > 0)

function openCreate() {
  editingId.value = null
  form.value = blankProduct()
  submitted.value = false
  slugTouched.value = false
  organiseOpen.value = []
  drawer.value = true
}

function openEdit(product: PurchasableGiftCard) {
  editingId.value = product.id
  form.value = {
    name: product.name,
    slug: product.slug,
    kind: product.kind,
    message: product.message ?? '',
    denominations: [...product.denominations],
    status: product.status,
    taxCategory: product.taxCategory,
    brand: product.brand,
    tags: [...product.tags],
    collections: [...product.collections],
  }
  submitted.value = false
  slugTouched.value = true
  organiseOpen.value = product.taxCategory || product.brand || product.tags.length || product.collections.length ? [0] : []
  drawer.value = true
}

function addDenomination() {
  form.value.denominations.push(0)
}
function removeDenomination(index: number) {
  form.value.denominations.splice(index, 1)
}

function saveProduct() {
  submitted.value = true
  if (!formValid.value) return
  const input: PurchasableGiftCardInput = {
    ...form.value,
    name: form.value.name.trim(),
    slug: form.value.slug.trim() || slugify(form.value.name),
    message: form.value.message?.trim() || undefined,
    denominations: [...new Set(validDenominations.value.map(Number))].sort((a, b) => a - b),
  }
  if (isEdit.value && editingId.value !== null) {
    store.updatePurchasableGiftCard(editingId.value, input)
    notify('Gift card product updated')
  } else {
    store.createPurchasableGiftCard(input)
    notify('Gift card product created')
  }
  drawer.value = false
}

// ── Filters ──────────────────────────────────────────────────────
const filters = ref({ status: null as string | null, kind: null as string | null })
const filterOptions = { status: ['Active', 'Draft', 'Archived'], kind: ['Digital', 'Physical'] }
const filterLabels: Record<string, string> = { status: 'Status', kind: 'Type' }

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v !== null)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` })),
)

function removeFilter(key: string) {
  filters.value[key as keyof typeof filters.value] = null
}
function clearAllFilters() {
  filters.value = { status: null, kind: null }
}

const filteredProducts = computed(() =>
  store.purchasableGiftCards.filter(
    p => (!filters.value.status || p.status === filters.value.status) && (!filters.value.kind || p.kind === filters.value.kind),
  ),
)

function selectAll() {
  selected.value = filteredProducts.value.map(p => p.id)
}

// ── Row / bulk actions ────────────────────────────────────────────
function duplicate(product: PurchasableGiftCard) {
  store.duplicatePurchasableGiftCard(product.id)
  notify('Gift card product duplicated')
}

function bulkSetStatus(status: PurchasableGiftCardStatus) {
  const count = selected.value.length
  selected.value.forEach(id => store.setPurchasableGiftCardStatus(id, status))
  selected.value = []
  notify(`${count} product${count === 1 ? '' : 's'} ${status === 'Active' ? 'published' : 'archived'}`)
}

const confirmDelete = ref(false)
const pendingDelete = ref<PurchasableGiftCard | null>(null)
const bulkDelete = ref(false)

function askDelete(product: PurchasableGiftCard) {
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
    store.deletePurchasableGiftCards(selected.value)
    selected.value = []
    notify(`${count} product${count === 1 ? '' : 's'} deleted`)
  } else if (pendingDelete.value) {
    store.deletePurchasableGiftCards([pendingDelete.value.id])
    notify('Gift card product deleted')
  }
  pendingDelete.value = null
  bulkDelete.value = false
}

const deleteMessage = computed(() =>
  bulkDelete.value
    ? `${selected.value.length} gift card product${selected.value.length === 1 ? '' : 's'} will be permanently deleted. This cannot be undone.`
    : `“${pendingDelete.value?.name}” will be permanently deleted. This cannot be undone.`,
)

// ── Export CSV ────────────────────────────────────────────────────
function exportCsv() {
  const rows = selected.value.length ? filteredProducts.value.filter(p => selected.value.includes(p.id)) : filteredProducts.value
  downloadCsv('Purchasable_Gift_Cards_Export', rows, [
    { title: 'Name', value: 'name' },
    { title: 'URL', value: 'slug' },
    { title: 'Denominations', value: (p) => p.denominations.map(d => `$${d}`).join('; ') },
    { title: 'Status', value: 'status' },
    { title: 'Sold', value: 'sold' },
    { title: 'Revenue', value: 'revenue' },
    { title: 'Date Added', value: 'created' },
  ])
  notify(`Exported ${rows.length} product${rows.length === 1 ? '' : 's'} as CSV`)
}

// ── Summary ──────────────────────────────────────────────────────
const summary = computed(() => {
  const cards = store.purchasableGiftCards
  const active = cards.filter(p => p.status === 'Active').length
  const sold = cards.reduce((sum, p) => sum + p.sold, 0)
  const revenue = cards.reduce((sum, p) => sum + p.revenue, 0)
  return `${cards.length} products · ${active} active · ${sold.toLocaleString()} sold · ${money(revenue)} revenue`
})

// ── Table ────────────────────────────────────────────────────────
const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Denominations', key: 'denominations', sortable: false },
  { title: 'Sold', key: 'sold', align: 'end' as const, hideBelow: 'lg' as const },
  { title: 'Revenue', key: 'revenue', align: 'end' as const, hideBelow: 'md' as const },
  { title: 'Status', key: 'status' },
  { title: 'Date added', key: 'created', hideBelow: 'lg' as const },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
]
const { visibleHeaders } = useResponsiveTableHeaders(headers)

// ── Snackbar ─────────────────────────────────────────────────────
const saveSnack = ref(false)
const snackText = ref('')
function notify(text: string) { snackText.value = text; saveSnack.value = true }
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Purchasable Gift Cards" :subtitle="summary">
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New purchasable gift card</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Gift card products"
        search-placeholder="Search gift card products…"
        :active-filters="activeFilterEntries"
        :total-count="filteredProducts.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select v-model="filters.status" label="Status" :items="filterOptions.status" variant="outlined" density="compact" hide-details clearable class="mb-3" />
            <v-select v-model="filters.kind" label="Type" :items="filterOptions.kind" variant="outlined" density="compact" hide-details clearable />
          </div>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="6" :columns="6" />

      <v-data-table
        v-else
        v-model="selected"
        :headers="visibleHeaders"
        :items="filteredProducts"
        :search="search"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center gap-3">
            <v-avatar size="36" rounded="lg" :color="item.kind === 'Physical' ? 'secondary' : 'primary'" variant="tonal">
              <v-icon size="18">{{ item.kind === 'Physical' ? 'credit-card' : 'gift' }}</v-icon>
            </v-avatar>
            <div class="min-width-0">
              <div class="text-body-2 font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">/{{ item.slug }} · {{ item.kind }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.denominations="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip v-for="d in item.denominations" :key="d" size="x-small" variant="tonal" label class="font-weight-medium">{{ money(d) }}</v-chip>
          </div>
        </template>

        <template v-slot:item.sold="{ item }">
          <span class="font-weight-bold text-body-2">{{ item.sold.toLocaleString() }}</span>
        </template>

        <template v-slot:item.revenue="{ item }">
          <span class="text-body-2">{{ money(item.revenue) }}</span>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="x-small" />
        </template>

        <template v-slot:item.created="{ item }">
          <span class="text-body-2">{{ item.created }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Gift card product actions">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicate(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="gift"
            :title="search || activeFilterEntries.length ? 'No products match your filters' : 'No gift card products yet'"
            :description="search || activeFilterEntries.length ? 'Try a different search term or clear filters.' : 'Create gift card products so customers can buy and send gift cards from your storefront.'"
            :action-label="!search && !activeFilterEntries.length ? 'New purchasable gift card' : undefined"
            action-icon="plus"
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
      <v-btn size="small" variant="flat" color="surface" class="text-none" prepend-icon="download" rounded="lg" @click="exportCsv">Export</v-btn>
      <v-btn size="small" variant="flat" color="success" class="text-none" prepend-icon="eye" rounded="lg" @click="bulkSetStatus('Active')">Publish</v-btn>
      <v-btn size="small" variant="flat" color="warning" class="text-none" prepend-icon="archive" rounded="lg" @click="bulkSetStatus('Archived')">Archive</v-btn>
      <v-btn size="small" variant="flat" color="error" class="text-none" prepend-icon="trash-2" rounded="lg" @click="askBulkDelete">Delete</v-btn>
    </MpFloatingBulkBar>

    <!-- ── Create / Edit Gift Card Product drawer ──────────────── -->
    <MpFormDrawer
      v-model="drawer"
      :title="isEdit ? 'Edit purchasable gift card' : 'New purchasable gift card'"
      subtitle="Sell a gift card that customers can buy from your storefront"
      :width="560"
    >
      <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">General</div>
      <v-text-field
        v-model="form.name"
        label="Name *"
        variant="outlined"
        density="comfortable"
        placeholder="e.g. Digital Gift Card"
        :error="submitted && !form.name.trim()"
        :error-messages="submitted && !form.name.trim() ? ['Name is required'] : []"
        class="mb-3"
      />
      <v-text-field
        v-model="form.slug"
        label="URL"
        variant="outlined"
        density="comfortable"
        prefix="/"
        hint="Auto-generated from the name — edit to customise"
        persistent-hint
        class="mb-3 font-mono-field"
        @update:model-value="slugTouched = true"
      />
      <v-btn-toggle v-model="form.kind" mandatory divided variant="outlined" density="comfortable" class="mb-3">
        <v-btn value="Digital" class="text-none" prepend-icon="mail">Digital</v-btn>
        <v-btn value="Physical" class="text-none" prepend-icon="credit-card">Physical</v-btn>
      </v-btn-toggle>
      <v-textarea v-model="form.message" label="Gift card message" variant="outlined" density="comfortable" rows="2" auto-grow class="mb-4" />

      <div class="text-subtitle-2 font-weight-bold mb-1 text-uppercase text-medium-emphasis">Denominations *</div>
      <div class="text-caption text-medium-emphasis mb-3">The fixed values customers can buy this gift card in.</div>
      <div v-for="(_, i) in form.denominations" :key="i" class="d-flex align-center gap-2 mb-2">
        <v-text-field
          v-model.number="form.denominations[i]"
          label="Amount"
          type="number"
          min="1"
          prefix="AUD $"
          variant="outlined"
          density="compact"
          hide-details
          class="flex-grow-1"
        />
        <v-btn
          icon="trash-2"
          variant="text"
          size="small"
          class="text-medium-emphasis"
          :disabled="form.denominations.length === 1"
          :aria-label="`Remove denomination ${i + 1}`"
          @click="removeDenomination(i)"
        />
      </div>
      <v-btn variant="text" color="primary" class="text-none mb-1" prepend-icon="plus" size="small" @click="addDenomination">Add denomination</v-btn>
      <div v-if="submitted && !validDenominations.length" class="text-caption text-error mb-3">Add at least one denomination greater than zero.</div>

      <div class="text-subtitle-2 font-weight-bold mb-2 mt-4 text-uppercase text-medium-emphasis">Status</div>
      <v-select v-model="form.status" label="Status" :items="['Draft', 'Active', 'Archived']" variant="outlined" density="comfortable" class="mb-4" />

      <div class="text-subtitle-2 font-weight-bold mb-2 text-uppercase text-medium-emphasis">Media</div>
      <v-card variant="flat" border rounded="lg" class="pa-6 mb-4 d-flex flex-column align-center justify-center text-center media-placeholder">
        <v-icon size="28" class="text-medium-emphasis mb-2">image-plus</v-icon>
        <div class="text-body-2 font-weight-medium">Add media</div>
        <div class="text-caption text-medium-emphasis">Drag & drop or click to upload (mock)</div>
      </v-card>

      <v-expansion-panels v-model="organiseOpen" variant="accordion" class="mb-2 organise-panels" multiple>
        <v-expansion-panel elevation="0" rounded="lg">
          <v-expansion-panel-title class="text-subtitle-2 font-weight-bold">Organise</v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-select v-model="form.taxCategory" label="Tax Category" :items="TAX_CATEGORIES" variant="outlined" density="comfortable" clearable class="mb-3" />
            <v-select v-model="form.brand" label="Brand" :items="BRANDS" variant="outlined" density="comfortable" clearable class="mb-3" />
            <v-select v-model="form.tags" label="Tags" :items="TAGS" variant="outlined" density="comfortable" multiple chips closable-chips class="mb-3" />
            <v-select v-model="form.collections" label="Collections" :items="COLLECTIONS" variant="outlined" density="comfortable" multiple chips closable-chips />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" class="text-none" prepend-icon="check" @click="saveProduct">
          {{ isEdit ? 'Save changes' : 'Save gift card' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="bulkDelete ? 'Delete selected products?' : 'Delete gift card product?'"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackText }}</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.min-width-0 { min-width: 0; }
.font-mono-field :deep(input) { font-family: monospace; }
.media-placeholder { border-style: dashed !important; cursor: pointer; }
.organise-panels :deep(.v-expansion-panel) { border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
</style>
