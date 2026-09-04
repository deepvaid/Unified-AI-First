<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProductExtrasStore, type TaxCategory, type TaxCategoryType } from '@/stores/useProductExtras'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useProductExtrasStore()
const search = ref('')
const toast = useToast()

const TYPES: TaxCategoryType[] = ['Physical', 'Services', 'Events']
const typeMeta: Record<TaxCategoryType, { icon: string; color: string }> = {
  Physical: { icon: 'package', color: 'primary' },
  Services: { icon: 'briefcase', color: 'secondary' },
  Events: { icon: 'calendar', color: 'info' },
}

const headers = [
  { title: 'ID', key: 'id', sortable: true, hideBelow: 'md' as const },
  { title: 'Type', key: 'type' },
  { title: 'Category Name', key: 'name', sortable: true },
  { title: 'Description', key: 'description', hideBelow: 'lg' as const },
  { title: '', key: 'actions', sortable: false, width: 48 },
]
const { visibleHeaders } = useResponsiveTableHeaders(headers)

// ── Filters ────────────────────────────────────────────────────────
// Type is this table's only filter, so it lives in the toolbar as a pill and
// there is no drawer at all.
const typeQuickFilter = {
  key: 'type',
  label: 'Type',
  options: ([...TYPES] as string[]).map((v) => ({ label: v, value: v })),
}
const typeFilter = ref<string[]>([])

const activeFilterEntries = computed(() =>
  typeFilter.value.length > 0
    ? [{ key: 'type', label: `Type: ${typeFilter.value.join(', ')}` }]
    : []
)
function clearAllFilters() { typeFilter.value = [] }
// The computed owns BOTH the type filter and the text search. Vuetify's own
// `:search` only matches the RENDERED columns, so once ID and Description are
// tiered away the query silently stopped matching them below md/lg.
const filteredCategories = computed(() => {
  const byType = typeFilter.value.length
    ? store.taxCategories.filter(c => typeFilter.value.includes(c.type))
    : store.taxCategories
  const q = search.value.trim().toLowerCase()
  if (!q) return byType
  return byType.filter(c =>
    c.id.toLowerCase().includes(q) ||
    c.type.toLowerCase().includes(q) ||
    c.name.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q),
  )
})

// ── Add / Edit drawer ───────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<string | null>(null)
const form = ref<{ name: string; type: TaxCategoryType; description: string }>({ name: '', type: 'Physical', description: '' })

function openCreate() {
  editingId.value = null
  form.value = { name: '', type: 'Physical', description: '' }
  drawer.value = true
}

function openEdit(category: TaxCategory) {
  editingId.value = category.id
  form.value = { name: category.name, type: category.type, description: category.description }
  drawer.value = true
}

function saveCategory() {
  const payload = { name: form.value.name.trim() || 'Untitled category', type: form.value.type, description: form.value.description.trim() }
  if (editingId.value !== null) {
    store.updateTaxCategory(editingId.value, payload)
    toast.success('Tax category updated')
  } else {
    store.addTaxCategory(payload)
    toast.success('Tax category created')
  }
  drawer.value = false
}

// ── Delete ──────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<TaxCategory | null>(null)
function askDelete(category: TaxCategory) {
  pendingDelete.value = category
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deleteTaxCategory(pendingDelete.value.id)
    toast.success('Tax category deleted')
  }
  pendingDelete.value = null
}

// ── Export ──────────────────────────────────────────────────────────
function exportCategories() {
  downloadCsv('tax-categories', filteredCategories.value, [
    { title: 'ID', value: 'id' },
    { title: 'Type', value: 'type' },
    { title: 'Name', value: 'name' },
    { title: 'Description', value: 'description' },
  ])
}

</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Tax Categories"
      :subtitle="`${store.taxCategories.length} categories`"
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="download" class="text-none" @click="exportCategories">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Tax Category</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="typeFilter"
        v-model:search="search"
        title="All Categories"
        :quick-filter="typeQuickFilter"
        :active-filters="activeFilterEntries"
        @remove-filter="clearAllFilters"
        @clear-filters="clearAllFilters"
      />

      <v-data-table
        :headers="visibleHeaders"
        :items="filteredCategories"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.id="{ item }">
          <span class="text-body-2 font-weight-medium font-mono">{{ item.id }}</span>
        </template>
        <template v-slot:item.type="{ item }">
          <v-chip size="small" variant="tonal" :color="typeMeta[item.type].color" label>
            <v-icon start size="16">{{ typeMeta[item.type].icon }}</v-icon>
            {{ item.type }}
          </v-chip>
        </template>
        <template v-slot:item.name="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
        </template>
        <template v-slot:item.description="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.description || '—' }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Tax category actions" :itemLabel="item.name">
            <MpMenuItem icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="receipt"
            :title="search || typeFilter.length ? 'No categories match your filters' : 'No tax categories'"
            :description="search || typeFilter.length ? 'Try a different search term or clear your filters.' : 'Create a tax category to control how products are taxed at checkout.'"
            :action-label="search || typeFilter.length ? undefined : 'New Tax Category'"
            :action-icon="search || typeFilter.length ? undefined : 'plus'"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Add / Edit drawer -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId !== null ? 'Edit Tax Category' : 'New Tax Category'"
      subtitle="Controls how matching products are taxed"
    >
      <MpFormGrid>
        <v-text-field v-model="form.name" label="Category name" />
        <v-select v-model="form.type" :items="TYPES" label="Type" />
        <v-textarea v-model="form.description" label="Description" rows="3" placeholder="How this category is taxed…" />
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveCategory">
          {{ editingId !== null ? 'Save Changes' : 'Create Category' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete tax category?"
      :message="`“${pendingDelete?.name}” will be permanently deleted. Products using it will fall back to the default rate.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.font-mono { font-family: var(--mp-fontFamily-mono); }
</style>
