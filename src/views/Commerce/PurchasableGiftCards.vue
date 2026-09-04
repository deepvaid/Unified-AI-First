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
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import { useToast } from '@/composables/useToast'

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
const KIND_ITEMS = [
  { value: 'Digital', label: 'Digital' },
  { value: 'Physical', label: 'Physical' },
]

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

// Snapshot the form on open so close paths can tell edits from noise.
const openSnapshot = ref('')
function snapshotState() {
  return JSON.stringify(form.value)
}
const drawerDirty = computed(() => drawer.value && snapshotState() !== openSnapshot.value)

const confirmDiscard = ref(false)
function requestCloseDrawer() {
  if (drawerDirty.value) confirmDiscard.value = true
  else drawer.value = false
}

function openCreate() {
  editingId.value = null
  form.value = blankProduct()
  submitted.value = false
  slugTouched.value = false
  organiseOpen.value = []
  openSnapshot.value = snapshotState()
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
  openSnapshot.value = snapshotState()
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
// Status is the promoted filter: a multi-select pill in the toolbar, so the
// cut people make most often doesn't cost a trip to the drawer.
const statusQuickFilter = {
  key: 'status',
  label: 'Status',
  options: (['Active', 'Draft', 'Archived']).map((v) => ({ label: v, value: v })),
}
const statusFilter = ref<string[]>([])

const filters = ref({
  kind: null as string | null,
})
const filterOptions = {
  kind: ['Digital', 'Physical'],
}
const filterLabels: Record<string, string> = {
  kind: 'Type',
}

const activeFilterEntries = computed(() => {
  const entries =
    Object.entries(filters.value)
      .filter(([, v]) => v !== null)
      .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
  if (statusFilter.value.length) {
    entries.unshift({ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` })
  }
  return entries
})

function removeFilter(key: string) {
  if (key === 'status') {
    statusFilter.value = []
    return
  }
  filters.value[key as keyof typeof filters.value] = null
}
function clearAllFilters() {
  statusFilter.value = []
  filters.value = { kind: null }
}

const filteredProducts = computed(() =>
  store.purchasableGiftCards.filter(
    p => (!statusFilter.value.length || statusFilter.value.includes(p.status)) && (!filters.value.kind || p.kind === filters.value.kind),
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

const toast = useToast()
function notify(text: string) { toast.success(text) }
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Purchasable Gift Cards" :subtitle="summary">
      <template #actions>
        <v-btn variant="outlined" prepend-icon="download" class="text-none" @click="exportCsv">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New purchasable gift card</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="statusFilter"
        :quick-filter="statusQuickFilter"
        v-model:search="search"
        title="Gift card products"
        search-placeholder="Search gift card products…"
        :active-filters="activeFilterEntries"
        :total-count="filteredProducts.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <!-- The drawer body already owns the inset and the field rhythm. The select
               suppresses details deliberately: it cannot carry validation. -->
          <MpFormGrid>
            <v-select v-model="filters.kind" label="Type" :items="filterOptions.kind" hide-details clearable />
          </MpFormGrid>
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
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>

        <template v-slot:item.created="{ item }">
          <span class="text-body-2">{{ item.created }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Gift card product actions" :itemLabel="item.name">
            <MpMenuItem icon="pencil" title="Edit" @click="openEdit(item)" />
            <MpMenuItem icon="copy" title="Duplicate" @click="duplicate(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
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
      subtitle="Sell a gift card that customers can buy from your storefront" size="lg"
      :guarded="drawerDirty"
      @close="requestCloseDrawer"
    >
      <MpFormSection title="General" />
      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Name *"
          placeholder="e.g. Digital Gift Card"
          :error="submitted && !form.name.trim()"
          :error-messages="submitted && !form.name.trim() ? ['Name is required'] : []"
        />
        <v-text-field
          v-model="form.slug"
          label="URL"
          prefix="/"
          hint="Auto-generated from the name — edit to customise"
          persistent-hint
          class="font-mono-field"
          @update:model-value="slugTouched = true"
        />
        <MpFormField label="Delivery type">
          <MpSegmentedControl
            :model-value="form.kind"
            :items="KIND_ITEMS"
            ariaLabel="Delivery type"
            @update:model-value="(v) => { if (v) form.kind = v as typeof form.kind }"
          />
        </MpFormField>
        <v-textarea v-model="form.message" label="Gift card message" rows="3" auto-grow />
      </MpFormGrid>

      <MpFormSection
        title="Denominations"
        description="The fixed values customers can buy this gift card in."
        required
      />
      <MpFormGrid>
        <div v-for="(_, i) in form.denominations" :key="i" class="mp-form-grid__trailing">
          <v-text-field
            v-model.number="form.denominations[i]"
            label="Amount"
            type="number"
            min="1"
            prefix="AUD $"
          />
          <v-btn
            icon
            variant="text"
            size="small"
            class="text-medium-emphasis"
            :disabled="form.denominations.length === 1"
            :aria-label="`Remove denomination ${i + 1}`"
            @click="removeDenomination(i)"
          >
            <v-icon size="18">trash-2</v-icon>
            <v-tooltip activator="parent" location="top">Remove denomination</v-tooltip>
          </v-btn>
        </div>
        <div>
          <v-btn variant="text" color="primary" class="text-none" prepend-icon="plus" size="small" @click="addDenomination">Add denomination</v-btn>
          <div v-if="submitted && !validDenominations.length" role="alert" class="text-caption text-error">Add at least one denomination greater than zero.</div>
        </div>
      </MpFormGrid>

      <MpFormSection title="Status" />
      <MpFormGrid>
        <v-select v-model="form.status" label="Status" :items="['Draft', 'Active', 'Archived']" />
      </MpFormGrid>

      <MpFormSection title="Media" />
      <v-card variant="flat" border rounded="lg" class="d-flex flex-column align-center justify-center text-center media-placeholder">
        <v-icon size="20" class="text-medium-emphasis mb-2">image-plus</v-icon>
        <div class="text-body-2 font-weight-medium">Add media</div>
        <div class="text-caption text-medium-emphasis">Drag & drop or click to upload (mock)</div>
      </v-card>

      <v-expansion-panels v-model="organiseOpen" variant="accordion" class="organise-panels" multiple>
        <v-expansion-panel elevation="0" rounded="lg">
          <v-expansion-panel-title class="mp-meta-label organise-panels__title">Organise</v-expansion-panel-title>
          <v-expansion-panel-text>
            <MpFormGrid>
              <v-select v-model="form.taxCategory" label="Tax Category" :items="TAX_CATEGORIES" clearable />
              <v-select v-model="form.brand" label="Brand" :items="BRANDS" clearable />
              <v-select v-model="form.tags" label="Tags" :items="TAGS" multiple chips closable-chips />
              <v-select v-model="form.collections" label="Collections" :items="COLLECTIONS" multiple chips closable-chips />
            </MpFormGrid>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestCloseDrawer">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveProduct">
          {{ isEdit ? 'Save changes' : 'Save gift card' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDiscard"
      title="Discard gift card product changes?"
      message="You have unsaved changes to this gift card product. Closing now will discard them."
      confirm-label="Discard changes"
      danger
      @confirm="drawer = false"
    />

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="bulkDelete ? 'Delete selected products?' : 'Delete gift card product?'"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.min-width-0 { min-width: 0; }
.font-mono-field :deep(input) { font-family: var(--mp-fontFamily-mono); }
/* Card-root inset on the card token (B1). `.media-placeholder.v-card` out-specifies
   v-card's own border rule, so the dashed hairline needs no !important. The old
   cursor: pointer is dropped — nothing handles a click on this placeholder. */
.media-placeholder.v-card {
  padding: var(--mp-component-card-paddingSpacious);
  border-style: dashed;
  border-color: var(--border-strong);
}
.organise-panels :deep(.v-expansion-panel) { border: 1px solid var(--border-subtle); }
/* Eyebrow type comes from the global .mp-meta-label utility (the same
   --mp-text-metaLabel-* tokens MpFormSection's heading uses), so the accordion
   doesn't introduce a second heading style into the drawer. */
.organise-panels__title { color: var(--muted); }
</style>
