<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import {
  useMerchandisingStore,
  SYNONYM_TYPE_LABELS,
  type Synonym,
} from '@/stores/useMerchandising'

const store = useMerchandisingStore()
const search = ref('')
const filterStatus = ref<'all' | 'active' | 'inactive'>('all')
const filterType = ref<'all' | 'one_way' | 'two_way'>('all')
const selected = ref<string[]>([])

const headers = [
  { title: 'Status', key: 'status', sortable: false, width: 140 },
  { title: 'Type', key: 'type', sortable: false, width: 130 },
  { title: 'Queries', key: 'queries', sortable: false },
  { title: 'Leads To', key: 'leadsTo', sortable: false },
  { title: 'Updated', key: 'updatedAt', sortable: true, align: 'end' as const, width: 160 },
  { title: '', key: 'actions', sortable: false, width: 64 },
]

const filteredSynonyms = computed(() => {
  let rows = store.synonymList
  if (filterStatus.value !== 'all') rows = rows.filter((s) => s.status === filterStatus.value)
  if (filterType.value !== 'all') rows = rows.filter((s) => s.type === filterType.value)
  return rows
})

const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) {
  snackbar.value = { visible: true, message }
}

function onToggle(synonym: Synonym) {
  store.toggleSynonymStatus(synonym.id)
}

function bulkEnable() {
  store.bulkSetSynonymStatus(selected.value, 'active')
  showToast(`${selected.value.length} synonym(s) enabled`)
  selected.value = []
}

function bulkDisable() {
  store.bulkSetSynonymStatus(selected.value, 'inactive')
  showToast(`${selected.value.length} synonym(s) disabled`)
  selected.value = []
}

function bulkDelete() {
  const count = selected.value.length
  store.deleteSynonyms(selected.value)
  showToast(`${count} synonym(s) deleted`)
  selected.value = []
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Synonyms"
      :subtitle="`Boost recall by mapping equivalent search terms for ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn variant="outlined" class="text-none" prepend-icon="upload" @click="showToast('Upload — coming soon')">
          Upload
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="plus"
          @click="showToast('Add new synonym — coming soon')"
        >
          Add new
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Synonyms"
        search-placeholder="Search synonym…"
        :total-count="filteredSynonyms.length"
      >
        <template #filter-content>
          <v-select
            v-model="filterStatus"
            label="Status"
            density="comfortable"
            variant="outlined"
            hide-details
            :items="[
              { title: 'All statuses', value: 'all' },
              { title: 'Enabled', value: 'active' },
              { title: 'Disabled', value: 'inactive' },
            ]"
          />
          <v-select
            v-model="filterType"
            label="Type"
            density="comfortable"
            variant="outlined"
            hide-details
            :items="[
              { title: 'All types', value: 'all' },
              { title: 'One way', value: 'one_way' },
              { title: 'Two way', value: 'two_way' },
            ]"
          />
        </template>
      </MpDataTableToolbar>

      <!-- Bulk action bar (inline, codebase convention) -->
      <div v-if="selected.length > 0" class="merch-bulk-bar">
        <span class="text-body-2 font-weight-medium">{{ selected.length }} selected</span>
        <v-divider vertical class="mx-3" />
        <v-btn variant="text" size="small" class="text-none" prepend-icon="check-circle" @click="bulkEnable">
          Enable
        </v-btn>
        <v-btn variant="text" size="small" class="text-none" prepend-icon="circle-pause" @click="bulkDisable">
          Disable
        </v-btn>
        <v-btn variant="text" size="small" class="text-none text-error" prepend-icon="trash-2" @click="bulkDelete">
          Delete
        </v-btn>
        <v-spacer />
        <v-btn variant="text" size="small" class="text-none" @click="selected = []">Clear selection</v-btn>
      </div>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="filteredSynonyms"
        :search="search"
        item-value="id"
        show-select
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
              :aria-label="`Toggle ${item.queries.join(', ')}`"
              @update:model-value="onToggle(item)"
            />
            <span
              class="text-caption font-weight-medium"
              :class="item.status === 'active' ? 'text-success' : 'text-medium-emphasis'"
            >
              {{ item.status === 'active' ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
        </template>

        <template #item.type="{ item }">
          <v-chip
            size="x-small"
            variant="tonal"
            :color="item.type === 'two_way' ? 'primary' : 'success'"
            class="font-weight-medium"
          >
            {{ SYNONYM_TYPE_LABELS[item.type] }}
          </v-chip>
        </template>

        <template #item.queries="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="q in item.queries"
              :key="q"
              size="x-small"
              variant="tonal"
              color="default"
              class="font-weight-medium"
            >
              {{ q }}
            </v-chip>
          </div>
        </template>

        <template #item.leadsTo="{ item }">
          <div v-if="item.type === 'two_way'" class="d-flex align-center gap-1 text-primary font-weight-medium">
            <v-icon size="14">arrow-left-right</v-icon>
            <span class="text-body-2">Bidirectional</span>
          </div>
          <div v-else class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="t in item.leadsTo"
              :key="t"
              size="x-small"
              variant="tonal"
              color="default"
              class="font-weight-medium"
            >
              {{ t }}
            </v-chip>
          </div>
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
            <v-list density="compact" min-width="180">
              <v-list-item prepend-icon="pencil" title="Edit" @click="showToast('Edit — coming soon')" />
              <v-list-item prepend-icon="copy" title="Duplicate" @click="showToast('Duplicated')" />
              <v-list-item
                :prepend-icon="item.status === 'active' ? 'circle-pause' : 'circle-play'"
                :title="item.status === 'active' ? 'Disable' : 'Enable'"
                @click="onToggle(item)"
              />
              <v-divider />
              <v-list-item
                prepend-icon="trash-2"
                title="Delete"
                class="text-error"
                @click="store.deleteSynonyms([item.id])"
              />
            </v-list>
          </v-menu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="repeat"
            :title="search ? 'No synonyms match your search' : 'No synonyms yet'"
            :description="search ? 'Try a different keyword or clear filters.' : 'Add your first synonym to improve search recall.'"
            :action-label="!search ? 'Add new' : undefined"
            action-icon="plus"
            @action="showToast('Add new synonym — coming soon')"
          />
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.merch-bulk-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  background: rgba(var(--v-theme-primary), 0.06);
  border-top: 1px solid rgba(var(--v-theme-primary), 0.18);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.18);
}
</style>
