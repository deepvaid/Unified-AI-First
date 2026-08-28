<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useProductExtrasStore, type RecommendationRule, type RecommendationLogic, type RecommendationPlacement } from '@/stores/useProductExtras'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useProductExtrasStore()
const search = ref('')
const { loading } = useInitialLoad()
const toast = useToast()

const LOGIC_TYPES: RecommendationLogic[] = ['Frequently Bought Together', 'Similar Items', 'Recently Viewed', 'Trending', 'Personalized']
const PLACEMENTS: RecommendationPlacement[] = ['Cart Page', 'Product Detail Page', 'Homepage & Global Footer']

const placementIcon: Record<string, string> = {
  'Cart Page': 'shopping-cart',
  'Product Detail Page': 'package',
  'Homepage & Global Footer': 'layout-grid',
}

const headers = [
  { title: 'Logic / Rule Name', key: 'name', sortable: true },
  { title: 'Placement', key: 'placement' },
  { title: 'Performance Lift', key: 'metric', align: 'end' as const },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// ── Filters ────────────────────────────────────────────────────────
const filters = ref({
  status: [] as string[],
  placement: [] as string[],
})
const filterLabels = { status: 'Status', placement: 'Placement' }
const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v.length > 0)
    .map(([key, value]) => ({ key, label: `${filterLabels[key as keyof typeof filterLabels]}: ${(value as string[]).join(', ')}` }))
)
function removeFilter(key: string) { filters.value[key as keyof typeof filters.value] = [] }
function clearAllFilters() { filters.value = { status: [], placement: [] } }
const filteredRules = computed(() => {
  let r = store.recommendations
  if (filters.value.status.length) r = r.filter(x => filters.value.status.includes(x.status))
  if (filters.value.placement.length) r = r.filter(x => filters.value.placement.includes(x.placement))
  return r
})

// ── Rule builder drawer ─────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const form = ref<{ name: string; logicType: RecommendationLogic; placement: RecommendationPlacement; status: 'Active' | 'Paused' }>({
  name: '', logicType: 'Frequently Bought Together', placement: 'Cart Page', status: 'Active',
})

function openCreate() {
  editingId.value = null
  form.value = { name: '', logicType: 'Frequently Bought Together', placement: 'Cart Page', status: 'Active' }
  drawer.value = true
}

function openEdit(rule: RecommendationRule) {
  editingId.value = rule.id
  form.value = { name: rule.name, logicType: rule.logicType, placement: rule.placement, status: rule.status }
  drawer.value = true
}

function saveRule() {
  const payload = { ...form.value, name: form.value.name.trim() || form.value.logicType }
  if (editingId.value !== null) {
    store.updateRule(editingId.value, payload)
    toast.success('Recommendation rule updated')
  } else {
    store.addRule(payload)
    toast.success('Recommendation rule created')
  }
  drawer.value = false
}

function toggleRule(rule: RecommendationRule) {
  store.toggleRule(rule.id)
  toast.success(rule.status === 'Active' ? 'Rule disabled' : 'Rule enabled')
}

// ── Delete ──────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<RecommendationRule | null>(null)
function askDelete(rule: RecommendationRule) {
  pendingDelete.value = rule
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deleteRule(pendingDelete.value.id)
    toast.success('Rule deleted')
  }
  pendingDelete.value = null
}

// ── Export ──────────────────────────────────────────────────────────
function exportRules() {
  downloadCsv('recommendation-rules', filteredRules.value, [
    { title: 'Rule Name', value: 'name' },
    { title: 'Logic Type', value: 'logicType' },
    { title: 'Placement', value: 'placement' },
    { title: 'Performance Lift', value: (r) => `${r.metric} ${r.metricLabel}` },
    { title: 'Status', value: 'status' },
  ])
}

</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Product Recommendations"
      :subtitle="`${store.recommendations.filter(r => r.status === 'Active').length} active recommendation rules`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportRules">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">Configure Rules</v-btn>
      </template>
    </MpPageHeader>

    <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="text-body-2">
      AI-powered recommendation engine automatically places products based on user browsing habits and cohort data.
    </v-alert>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Recommendation Rules"
        :active-filters="activeFilterEntries"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <!-- Filter popover: `hide-details` is deliberate — these selects can never
             carry a hint or an error, and the popover is a dense surface. -->
        <template #filter-content>
          <MpFormGrid>
            <v-select
              v-model="filters.status"
              :items="['Active', 'Paused']"
              :label="filterLabels.status"
              multiple
              chips
              closable-chips
              hide-details
            />
            <v-select
              v-model="filters.placement"
              :items="[...PLACEMENTS] as string[]"
              :label="filterLabels.placement"
              multiple
              chips
              closable-chips
              hide-details
            />
          </MpFormGrid>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="3" :columns="5" />

      <v-data-table
        v-else
        :headers="headers"
        :items="filteredRules"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.name="{ item }">
          <div class="text-body-2 font-weight-medium">{{ item.name }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.logicType }}</div>
        </template>

        <template v-slot:item.placement="{ item }">
          <div class="d-flex align-center gap-2">
            <v-icon size="16" class="text-medium-emphasis">{{ placementIcon[item.placement] ?? 'map-pin' }}</v-icon>
            <span class="text-body-2">{{ item.placement }}</span>
          </div>
        </template>

        <template v-slot:item.metric="{ item }">
          <v-chip v-if="item.metric !== '—'" size="small" variant="tonal" color="success" class="font-weight-bold" label>
            <v-icon start size="13">trending-up</v-icon>
            {{ item.metric }}
            <span class="text-medium-emphasis font-weight-regular ms-1">{{ item.metricLabel }}</span>
          </v-chip>
          <span v-else class="text-disabled">—</span>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" />
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Rule actions">
            <v-list-item prepend-icon="pencil" title="Edit Rule" @click="openEdit(item)" />
            <v-list-item
              :prepend-icon="item.status === 'Active' ? 'toggle-left' : 'toggle-right'"
              :title="item.status === 'Active' ? 'Disable' : 'Enable'"
              @click="toggleRule(item)"
            />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="sparkles"
            :title="search ? 'No rules match your search' : 'No recommendation rules'"
            :description="search ? 'Try a different search term or clear your filters.' : 'Configure a rule to start placing personalised recommendations across your storefront.'"
            :action-label="search ? undefined : 'Configure Rules'"
            :action-icon="search ? undefined : 'plus'"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Rule builder drawer -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId !== null ? 'Edit Recommendation Rule' : 'Configure Recommendation Rule'"
      subtitle="Control what recommendations appear and where"
    >
      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Rule name"
          placeholder="e.g. Cart Cross-Sell"
          hint="Leave blank to use the logic type as the name"
          persistent-hint
        />
        <v-select v-model="form.logicType" :items="LOGIC_TYPES" label="Logic type" />
        <v-select v-model="form.placement" :items="PLACEMENTS" label="Placement" />
        <v-select v-model="form.status" :items="['Active', 'Paused']" label="Status" />
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveRule">
          {{ editingId !== null ? 'Save Changes' : 'Create Rule' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete recommendation rule?"
      :message="`“${pendingDelete?.name}” will be removed and stop placing recommendations. This cannot be undone.`"
      confirm-label="Delete Rule"
      danger
      @confirm="doDelete"
    />
  </div>
</template>
