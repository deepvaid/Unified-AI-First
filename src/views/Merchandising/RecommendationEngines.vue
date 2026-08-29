<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import {
  useMerchandisingStore,
  ENGINE_TYPE_LABELS,
  ENGINE_PAGE_LABELS,
  type EnginePage,
  type EngineType,
  type RecommendationEngine,
} from '@/stores/useMerchandising'

const route = useRoute()
const router = useRouter()
const store = useMerchandisingStore()
const toast = useToast()
const search = ref('')

// Channel-scoped editor route — this view only mounts inside the merchandising shell.
function openEngine(id: string) {
  router.push({ name: 'MerchandisingChannelEngineEdit', params: { accountId: route.params.accountId, channelId: route.params.channelId, engineId: id } })
}

const confirmDelete = ref<RecommendationEngine | null>(null)

function performDelete() {
  if (confirmDelete.value) {
    store.deleteEngine(confirmDelete.value.id)
    toast.info(`Engine “${confirmDelete.value.name}” deleted`)
  }
  confirmDelete.value = null
}

function duplicate(engine: RecommendationEngine) {
  const copy = store.duplicateEngine(engine.id)
  if (copy) toast.info(`Engine duplicated as “${copy.name}”`)
}
const filterPage = ref<'all' | EnginePage>('all')

const headers = [
  { title: 'State', key: 'status', sortable: false, width: 150 },
  { title: 'Engine name', key: 'name', sortable: true },
  { title: 'Page', key: 'page', sortable: false, width: 130 },
  { title: 'Type', key: 'type', sortable: false, width: 240 },
  { title: 'Last update', key: 'updatedAt', sortable: true, align: 'end' as const, width: 220 },
  { title: '', key: 'actions', sortable: false, width: 64 },
]

const pageOptions = [
  { title: 'All pages', value: 'all' },
  { title: 'Product', value: 'product' },
  { title: 'Cart', value: 'cart' },
  { title: 'Home', value: 'home' },
]

const typeOptions = computed(() => [
  { title: 'All types', value: 'all' },
  ...Object.entries(ENGINE_TYPE_LABELS).map(([value, title]) => ({ title, value })),
])

// Type is the promoted filter: a multi-select pill in the toolbar rather
// than a single-value select, so several values can be compared at once.
const filterTypeQuickFilter = computed(() => ({
  key: 'type',
  label: 'Type',
  options: typeOptions.value
    .filter((o) => o.value !== 'all')
    .map((o) => ({ label: o.title, value: o.value })),
}))
const filterType = ref<string[]>([])

const filteredEngines = computed(() => {
  let rows = store.engineList
  if (filterPage.value !== 'all') rows = rows.filter((e) => e.page === filterPage.value)
  if (filterType.value.length) rows = rows.filter((e) => filterType.value.includes(e.type))
  return rows
})

const pageColor: Record<EnginePage, string> = {
  product: 'secondary',
  cart: 'info',
  home: 'primary',
  category: 'success',
  custom: 'warning',
}

const typeColor: Record<EngineType, string> = {
  personalized: 'primary',
  popular_products: 'success',
  newest_products: 'info',
  visual_recommendations: 'warning',
  frequently_purchased_together: 'info',
  recently_viewed: 'secondary',
  viewed_together: 'success',
  new_trending: 'warning',
}

function onToggle(engine: RecommendationEngine) {
  store.toggleEngineStatus(engine.id)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Recommendations"
      :subtitle="`Personalized engines running for ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="plus"
          @click="openEngine('new')"
        >
          New engine
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="filterType"
        :quick-filter="filterTypeQuickFilter"
        v-model:search="search"
        title="All engines"
        search-placeholder="Search engines…"
        :total-count="filteredEngines.length"
      >
        <!-- Filter popover: `hide-details` is deliberate — these selects can never
             carry a hint or an error, and the popover is a dense surface. -->
        <template #filter-content>
          <v-select v-model="filterPage" label="Page" hide-details :items="pageOptions" />
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="headers"
        :items="filteredEngines"
        :search="search"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="20"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.status="{ item }">
          <div class="d-flex align-center gap-2">
            <v-switch
              :model-value="item.status === 'active'"
              color="success"
              density="compact"
              hide-details
              :aria-label="`Toggle ${item.name}`"
              @update:model-value="onToggle(item)"
            />
            <span
              class="text-caption font-weight-medium"
              :class="item.status === 'active' ? 'text-success' : 'text-medium-emphasis'"
            >
              {{ item.status === 'active' ? 'On' : 'Off' }}
            </span>
          </div>
        </template>

        <template #item.name="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium text-body-2">{{ item.name }}</span>
            <span class="text-caption text-medium-emphasis">ID: {{ item.id }}</span>
          </div>
        </template>

        <template #item.page="{ item }">
          <v-chip
            size="x-small"
            variant="tonal"
            :color="pageColor[item.page]"
            class="font-weight-medium"
          >
            {{ ENGINE_PAGE_LABELS[item.page] }}
          </v-chip>
        </template>

        <template #item.type="{ item }">
          <v-chip
            size="x-small"
            variant="tonal"
            :color="typeColor[item.type]"
            class="font-weight-medium"
          >
            {{ ENGINE_TYPE_LABELS[item.type] }}
          </v-chip>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.updatedAt }}</span>
        </template>

        <template #item.actions="{ item }">
          <v-menu>
            <template #activator="{ props: activator }">
              <v-btn
                v-bind="activator"
                icon="more-vertical"
                variant="text"
                size="x-small"
                class="text-medium-emphasis"
                aria-label="Row actions"
              />
            </template>
            <v-list density="compact" rounded="lg" min-width="200" class="py-1">
              <v-list-item prepend-icon="pencil" title="Edit engine" @click="openEngine(item.id)" />
              <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicate(item)" />
              <v-list-item
                :prepend-icon="item.status === 'active' ? 'circle-pause' : 'circle-play'"
                :title="item.status === 'active' ? 'Disable' : 'Enable'"
                @click="onToggle(item)"
              />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="confirmDelete = item" />
            </v-list>
          </v-menu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="sparkles"
            :title="search ? 'No engines match your search' : 'No engines yet'"
            :description="search ? 'Try a different keyword or clear filters.' : 'Create your first recommendation engine to start personalizing the storefront.'"
            :action-label="!search ? 'New engine' : undefined"
            action-icon="plus"
            @action="openEngine('new')"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Delete confirm -->
    <MpConfirmDialog
      :model-value="!!confirmDelete"
      :title="`Delete “${confirmDelete?.name}”?`"
      message="The widget stops rendering on the storefront immediately."
      confirm-label="Delete engine"
      danger
      @update:model-value="confirmDelete = null"
      @confirm="performDelete"
    />

  </div>
</template>
