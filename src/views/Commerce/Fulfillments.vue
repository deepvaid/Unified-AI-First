<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useCommerceStore } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'

const store = useCommerceStore()
const search = ref('')
const selected = ref<number[]>([])
const { loading } = useInitialLoad()

const headers = [
  { title: 'Order', key: 'orderNumber', sortable: true },
  { title: 'Customer', key: 'customer' },
  { title: 'Items', key: 'items', align: 'center' as const, hideBelow: 'lg' as const },
  { title: 'Weight', key: 'weight', hideBelow: 'lg' as const },
  { title: 'Location', key: 'location', hideBelow: 'md' as const },
  { title: 'Priority', key: 'priority', hideBelow: 'md' as const },
  { title: 'Status', key: 'status' },
  { title: 'Date', key: 'date', hideBelow: 'md' as const },
  { title: 'Actions', key: 'actions', align: 'end' as const, sortable: false },
]

const { visibleHeaders } = useResponsiveTableHeaders(headers)

// ─── Filters ──────────────────────────────────────────────────────────────────
const filters = ref({
  status: null as string | null,
  priority: null as string | null,
})

const filterOptions = {
  status: ['Awaiting Fulfillment', 'Picking', 'Packed', 'Ready to Ship', 'Shipped'],
  priority: ['High', 'Normal', 'Low'],
}

const filterLabels: Record<string, string> = {
  status: 'Status',
  priority: 'Priority',
}

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v !== null)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
)

function removeFilter(key: string) {
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  filters.value = { status: null, priority: null }
}

// Status summary meta — colour per fulfillment stage
const STAGES = ['Awaiting Fulfillment', 'Picking', 'Packed', 'Ready to Ship', 'Shipped']
const stageColor: Record<string, string> = {
  'Awaiting Fulfillment': 'warning',
  'Picking': 'info',
  'Packed': 'primary',
  'Ready to Ship': 'secondary',
  'Shipped': 'success',
}
const stageCount = (s: string) => store.fulfillments.filter(f => f.status === s).length
function toggleStage(s: string) {
  filters.value.status = filters.value.status === s ? null : s
}

// Apply the drawer/summary filters to the table (were previously not applied)
const filteredFulfillments = computed(() => {
  let rows = store.fulfillments
  if (filters.value.status) rows = rows.filter(f => f.status === filters.value.status)
  if (filters.value.priority) rows = rows.filter(f => f.priority === filters.value.priority)
  return rows
})

function rowProps({ item }: { item: { priority?: string } }) {
  return item.priority === 'High' ? { class: 'row-high' } : {}
}

function selectAll() {
  selected.value = filteredFulfillments.value.map((f: { id: number }) => f.id)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Fulfillment Queue"
      :subtitle="`${store.fulfillments.filter(f => f.status !== 'Shipped').length} orders awaiting fulfillment`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="printer" class="text-none" color="surface">Print Packing Slips</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="truck" class="text-none" :disabled="selected.length === 0">Mark Shipped{{ selected.length > 0 ? ` (${selected.length})` : '' }}</v-btn>
      </template>
    </MpPageHeader>

    <!-- Status Summary Chips — colour-coded + click to filter -->
    <div class="d-flex gap-2 flex-wrap">
      <v-chip
        v-for="s in STAGES"
        :key="s"
        :variant="filters.status === s ? 'flat' : 'tonal'"
        size="small"
        :color="stageColor[s]"
        class="cursor-pointer"
        :aria-pressed="filters.status === s"
        @click="toggleStage(s)"
      >
        {{ s }}
        <span class="fq-count">{{ stageCount(s) }}</span>
      </v-chip>
    </div>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Fulfillment Queue"
        :active-filters="activeFilterEntries"
        :total-count="filteredFulfillments.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <div v-for="(options, key) in filterOptions" :key="key" class="mb-3">
              <v-select
                v-model="filters[key as keyof typeof filters]"
                :label="filterLabels[key]"
                :items="options"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </div>
          </div>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        v-model="selected"
        :headers="visibleHeaders"
        :items="filteredFulfillments"
        :search="search"
        :row-props="rowProps"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.orderNumber="{ item }">
          <span class="text-primary font-weight-bold cursor-pointer">{{ item.orderNumber }}</span>
        </template>

        <template v-slot:item.items="{ item }">
          <v-chip size="x-small" variant="tonal" color="secondary" class="font-weight-bold">{{ item.items }}</v-chip>
        </template>

        <template v-slot:item.priority="{ item }">
          <MpStatusChip :status="item.priority ?? ''" type="priority" size="x-small" />
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status ?? ''" type="fulfillment" size="small" />
        </template>

        <template v-slot:item.date="{ item }">
          <span class="text-medium-emphasis text-caption">{{ item.date }}</span>
        </template>

        <template v-slot:item.actions>
          <div class="ActionButtons d-flex justify-end gap-1">
            <v-btn icon="eye" variant="text" size="small" color="primary"></v-btn>
            <v-btn icon="truck" variant="text" size="small" color="success"></v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="truck"
            title="No fulfillments found"
            description="Fulfillment orders will appear here once customers place orders."
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="store.fulfillments.length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <v-btn size="small" variant="flat" color="success" class="text-none" prepend-icon="truck" rounded="lg">Mark Shipped</v-btn>
      <v-btn size="small" variant="flat" color="secondary" class="text-none" prepend-icon="printer" rounded="lg">Print Labels</v-btn>
    </MpFloatingBulkBar>
  </div>
</template>

<style scoped>
.ActionButtons { opacity: 0; transition: opacity 0.2s ease; }
tr:hover .ActionButtons { opacity: 1; }

.fq-count {
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* High-priority rows get a subtle left accent */
:deep(.row-high td:first-child) {
  box-shadow: inset 3px 0 0 0 rgb(var(--v-theme-warning));
}
</style>
