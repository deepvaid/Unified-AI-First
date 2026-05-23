<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import {
  useMerchandisingStore,
  ENGINE_TYPE_LABELS,
  ENGINE_PAGE_LABELS,
  type EnginePage,
  type EngineType,
  type RecommendationEngine,
} from '@/stores/useMerchandising'

const store = useMerchandisingStore()
const search = ref('')
const filterPage = ref<'all' | EnginePage>('all')
const filterType = ref<'all' | EngineType>('all')

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

const filteredEngines = computed(() => {
  let rows = store.engineList
  if (filterPage.value !== 'all') rows = rows.filter((e) => e.page === filterPage.value)
  if (filterType.value !== 'all') rows = rows.filter((e) => e.type === filterType.value)
  return rows
})

const pageColor: Record<EnginePage, string> = {
  product: 'secondary',
  cart: 'info',
  home: 'primary',
}

const typeColor: Record<EngineType, string> = {
  personalized: 'primary',
  popular_products: 'success',
  visual_recommendations: 'warning',
  frequently_purchased_together: 'info',
  recently_viewed: 'secondary',
  viewed_together: 'success',
  new_trending: 'warning',
}

const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) {
  snackbar.value = { visible: true, message }
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
        <v-btn variant="outlined" class="text-none" prepend-icon="eye" @click="showToast('Preview — coming soon')">
          Preview
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="plus"
          @click="showToast('New engine wizard — coming soon')"
        >
          New engine
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All engines"
        search-placeholder="Search engines…"
        :total-count="filteredEngines.length"
      >
        <template #filter-content>
          <v-select
            v-model="filterPage"
            label="Page"
            density="comfortable"
            variant="outlined"
            hide-details
            :items="pageOptions"
          />
          <v-select
            v-model="filterType"
            label="Type"
            density="comfortable"
            variant="outlined"
            hide-details
            :items="typeOptions"
          />
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
                color="medium-emphasis"
                aria-label="Row actions"
              />
            </template>
            <v-list density="compact" min-width="200">
              <v-list-item prepend-icon="pencil" title="Edit engine" @click="showToast('Edit — coming soon')" />
              <v-list-item prepend-icon="eye" title="Preview" @click="showToast('Preview — coming soon')" />
              <v-list-item prepend-icon="copy" title="Duplicate" @click="showToast('Duplicated')" />
              <v-list-item
                :prepend-icon="item.status === 'active' ? 'circle-pause' : 'circle-play'"
                :title="item.status === 'active' ? 'Disable' : 'Enable'"
                @click="onToggle(item)"
              />
              <v-divider />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="showToast('Deleted')" />
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
            @action="showToast('New engine wizard — coming soon')"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>
