<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useCommerceStore } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'

const store = useCommerceStore()
const search = ref('')
const selected = ref<number[]>([])
const saveSnack = ref(false)
const { loading } = useInitialLoad()

const money = (n: number) => `$${n.toLocaleString('en-US')}`

// ── Create Gift Card Product drawer ──────────────────────────────
const createDrawer = ref(false)
const PRESET_AMOUNTS = [10, 20, 25, 50, 100, 150, 200, 250, 500, 1000]

const blankProduct = () => ({
  name: '',
  kind: 'Digital',
  denominations: [25, 50, 100] as number[],
  allowCustom: false,
  customMin: 10,
  customMax: 500,
  description: '',
  status: 'Active',
})
const form = ref(blankProduct())

function createProduct() {
  createDrawer.value = false
  form.value = blankProduct()
  saveSnack.value = true
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
  { title: 'Product', key: 'name', sortable: true },
  { title: 'Denominations', key: 'denominations', sortable: false },
  { title: 'Custom amount', key: 'allowCustom', hideBelow: 'lg' as const },
  { title: 'Sold', key: 'sold', align: 'end' as const },
  { title: 'Revenue', key: 'revenue', align: 'end' as const, hideBelow: 'md' as const },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
]
const { visibleHeaders } = useResponsiveTableHeaders(headers)

function toggleDenomination(amount: number) {
  const idx = form.value.denominations.indexOf(amount)
  if (idx === -1) form.value.denominations.push(amount)
  else form.value.denominations.splice(idx, 1)
  form.value.denominations.sort((a, b) => a - b)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Purchasable Gift Cards" :subtitle="summary">
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="createDrawer = true">Create gift card</v-btn>
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
              <div class="text-caption text-medium-emphasis">{{ item.kind }} · added {{ item.created }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.denominations="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip v-for="d in item.denominations" :key="d" size="x-small" variant="tonal" label class="font-weight-medium">{{ money(d) }}</v-chip>
          </div>
        </template>

        <template v-slot:item.allowCustom="{ item }">
          <span v-if="item.allowCustom" class="text-body-2">{{ money(item.customMin) }}–{{ money(item.customMax) }}</span>
          <span v-else class="text-body-2 text-medium-emphasis">—</span>
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

        <template v-slot:item.actions>
          <div class="ActionButtons d-flex justify-end gap-1">
            <v-tooltip text="Edit" location="top"><template v-slot:activator="{ props }"><v-btn v-bind="props" icon="pencil" variant="text" size="small" color="primary" /></template></v-tooltip>
            <v-tooltip text="Duplicate" location="top"><template v-slot:activator="{ props }"><v-btn v-bind="props" icon="copy" variant="text" size="small" /></template></v-tooltip>
            <v-tooltip text="Delete" location="top"><template v-slot:activator="{ props }"><v-btn v-bind="props" icon="trash-2" variant="text" size="small" color="error" /></template></v-tooltip>
          </div>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="gift"
            title="No gift card products yet"
            description="Create gift card products so customers can buy and send gift cards from your storefront."
            action-label="Create gift card"
            action-icon="plus"
            @action="createDrawer = true"
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
      <v-btn size="small" variant="flat" color="surface" class="text-none" prepend-icon="eye" rounded="lg">Publish</v-btn>
      <v-btn size="small" variant="flat" color="warning" class="text-none" prepend-icon="archive" rounded="lg">Archive</v-btn>
      <v-btn size="small" variant="flat" color="error" class="text-none" prepend-icon="trash-2" rounded="lg">Delete</v-btn>
    </MpFloatingBulkBar>

    <!-- ── Create Gift Card Product drawer ─────────────────────── -->
    <MpFormDrawer
      v-model="createDrawer"
      title="Create gift card product"
      subtitle="Sell a gift card that customers can buy and send"
      :width="560"
    >
      <!-- Live preview -->
      <v-card color="primary" variant="tonal" rounded="lg" class="pa-5 mb-5">
        <div class="d-flex align-center justify-space-between mb-3">
          <v-icon size="22">{{ form.kind === 'Physical' ? 'credit-card' : 'gift' }}</v-icon>
          <span class="text-caption font-weight-bold text-uppercase" style="letter-spacing: 0.08em">{{ form.kind }} gift card</span>
        </div>
        <div class="text-h6 font-weight-bold mb-3">{{ form.name || 'Gift card product' }}</div>
        <div class="d-flex flex-wrap gap-1 align-center">
          <v-chip v-for="d in form.denominations" :key="d" size="x-small" variant="flat" label class="font-weight-medium">{{ money(d) }}</v-chip>
          <v-chip v-if="form.allowCustom" size="x-small" variant="outlined" label>Custom {{ money(form.customMin) }}–{{ money(form.customMax) }}</v-chip>
          <span v-if="!form.denominations.length && !form.allowCustom" class="text-caption text-medium-emphasis">Choose denominations below</span>
        </div>
      </v-card>

      <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">Details</div>
      <v-text-field v-model="form.name" label="Product name" variant="outlined" density="comfortable" placeholder="e.g. Digital Gift Card" class="mb-3" />
      <v-btn-toggle v-model="form.kind" mandatory divided variant="outlined" density="comfortable" class="mb-4">
        <v-btn value="Digital" class="text-none" prepend-icon="mail">Digital</v-btn>
        <v-btn value="Physical" class="text-none" prepend-icon="credit-card">Physical</v-btn>
      </v-btn-toggle>

      <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">Denominations</div>
      <div class="d-flex flex-wrap gap-2 mb-4">
        <v-chip
          v-for="amount in PRESET_AMOUNTS"
          :key="amount"
          :variant="form.denominations.includes(amount) ? 'flat' : 'outlined'"
          :color="form.denominations.includes(amount) ? 'primary' : undefined"
          label
          @click="toggleDenomination(amount)"
        >
          {{ money(amount) }}
        </v-chip>
      </div>

      <v-card variant="flat" border rounded="lg" class="pa-3 mb-4">
        <div class="d-flex align-center justify-space-between mb-1">
          <div>
            <div class="text-body-2 font-weight-medium">Allow custom amount</div>
            <div class="text-caption text-medium-emphasis">Let customers choose their own value</div>
          </div>
          <v-switch v-model="form.allowCustom" color="primary" hide-details density="compact" inset />
        </div>
        <v-row v-if="form.allowCustom" dense class="mt-2">
          <v-col cols="6">
            <v-text-field v-model.number="form.customMin" label="Minimum ($)" type="number" variant="outlined" density="compact" hide-details />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model.number="form.customMax" label="Maximum ($)" type="number" variant="outlined" density="compact" hide-details />
          </v-col>
        </v-row>
      </v-card>

      <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">Listing</div>
      <v-textarea v-model="form.description" label="Description (optional)" variant="outlined" density="comfortable" rows="2" auto-grow class="mb-3" />
      <v-select v-model="form.status" label="Status" :items="['Active', 'Draft']" variant="outlined" density="comfortable" />

      <template #footer>
        <v-btn variant="text" class="text-none" @click="createDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" class="text-none" prepend-icon="check" :disabled="!form.name || !form.denominations.length" @click="createProduct">
          Create product
        </v-btn>
      </template>
    </MpFormDrawer>

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Gift card product created</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.ActionButtons { opacity: 0; transition: opacity 0.2s; }
tr:hover .ActionButtons { opacity: 1; }
.min-width-0 { min-width: 0; }
</style>
