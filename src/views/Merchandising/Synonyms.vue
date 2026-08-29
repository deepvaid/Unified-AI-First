<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import { useToast } from '@/composables/useToast'
import {
  useMerchandisingStore,
  SYNONYM_TYPE_LABELS,
  type Synonym,
  type SynonymType,
} from '@/stores/useMerchandising'

const store = useMerchandisingStore()
const toast = useToast()
const search = ref('')
// Status is the promoted filter: a multi-select pill in the toolbar rather
// than a single-value select, so several values can be compared at once.
const filterStatusQuickFilter = computed(() => ({
  key: 'status',
  label: 'Status',
  options: ([
              { title: 'All statuses', value: 'all' },
              { title: 'Enabled', value: 'active' },
              { title: 'Disabled', value: 'inactive' },
            ])
    .filter((o) => o.value !== 'all')
    .map((o) => ({ label: o.title, value: o.value })),
}))
const filterStatus = ref<string[]>([])
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
  if (filterStatus.value.length) rows = rows.filter((s) => filterStatus.value.includes(s.status))
  if (filterType.value !== 'all') rows = rows.filter((s) => s.type === filterType.value)
  return rows
})

function onToggle(synonym: Synonym) {
  store.toggleSynonymStatus(synonym.id)
}

function bulkEnable() {
  store.bulkSetSynonymStatus(selected.value, 'active')
  toast.info(`${selected.value.length} synonym(s) enabled`)
  selected.value = []
}

function bulkDisable() {
  store.bulkSetSynonymStatus(selected.value, 'inactive')
  toast.info(`${selected.value.length} synonym(s) disabled`)
  selected.value = []
}

function bulkDelete() {
  const count = selected.value.length
  store.deleteSynonyms(selected.value)
  toast.info(`${count} synonym(s) deleted`)
  selected.value = []
}

function duplicate(item: Synonym) {
  const copy = store.duplicateSynonym(item.id)
  if (copy) toast.info('Synonym duplicated')
}

/* ── Edit drawer ───────────────────────────────────────────────── */
const editDrawer = ref(false)
const editTarget = ref<Synonym | null>(null)
const editType = ref<SynonymType>('one_way')
const editQueries = ref<string[]>([])
const editQueryInput = ref('')
const editLeadsTo = ref<string[]>([])
const editLeadsToInput = ref('')

function openEdit(item: Synonym) {
  editTarget.value = item
  editType.value = item.type
  editQueries.value = [...item.queries]
  editLeadsTo.value = [...item.leadsTo]
  editQueryInput.value = ''
  editLeadsToInput.value = ''
  editDrawer.value = true
}

function addEditQuery() {
  const trimmed = editQueryInput.value.trim()
  if (!trimmed || editQueries.value.includes(trimmed)) {
    editQueryInput.value = ''
    return
  }
  editQueries.value.push(trimmed)
  editQueryInput.value = ''
}

function removeEditQuery(q: string) {
  editQueries.value = editQueries.value.filter((x) => x !== q)
}

function addEditLeadsTo() {
  const trimmed = editLeadsToInput.value.trim()
  if (!trimmed || editLeadsTo.value.includes(trimmed)) {
    editLeadsToInput.value = ''
    return
  }
  editLeadsTo.value.push(trimmed)
  editLeadsToInput.value = ''
}

function removeEditLeadsTo(t: string) {
  editLeadsTo.value = editLeadsTo.value.filter((x) => x !== t)
}

function submitEdit() {
  if (!editTarget.value) return
  if (editQueries.value.length === 0) {
    toast.error('Add at least one query.')
    return
  }
  store.saveSynonym(editTarget.value.id, {
    type: editType.value,
    queries: [...editQueries.value],
    leadsTo: editType.value === 'two_way' ? [] : [...editLeadsTo.value],
  })
  editDrawer.value = false
  toast.info('Synonym updated')
}

/* ── Delete confirm ────────────────────────────────────────────── */
const confirmDeleteOpen = ref(false)
const pendingDelete = ref<Synonym | null>(null)

function askDelete(item: Synonym) {
  pendingDelete.value = item
  confirmDeleteOpen.value = true
}

function doDelete() {
  if (pendingDelete.value) {
    store.deleteSynonyms([pendingDelete.value.id])
    toast.info('Synonym deleted')
  }
  pendingDelete.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Synonyms"
      :subtitle="`Boost recall by mapping equivalent search terms for ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn variant="outlined" class="text-none" prepend-icon="upload" @click="toast.info('Upload — coming soon')">
          Upload
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          prepend-icon="plus"
          @click="toast.info('Add new synonym — coming soon')"
        >
          Add new
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="filterStatus"
        :quick-filter="filterStatusQuickFilter"
        v-model:search="search"
        title="Synonyms"
        search-placeholder="Search synonym…"
        :total-count="filteredSynonyms.length"
      >
        <!-- Filter popover: `hide-details` is deliberate — these two selects can
             never carry a hint or an error, and the popover is a dense surface. -->
        <template #filter-content>
          <v-select
            v-model="filterType"
            label="Type"
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
          <MpRowActionsMenu ariaLabel="Synonym actions" :item-label="item.queries.join(', ')">
            <v-list-item role="menuitem" prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-list-item role="menuitem" prepend-icon="copy" title="Duplicate" @click="duplicate(item)" />
            <v-list-item
              role="menuitem"
              :prepend-icon="item.status === 'active' ? 'circle-pause' : 'circle-play'"
              :title="item.status === 'active' ? 'Disable' : 'Enable'"
              @click="onToggle(item)"
            />
            <v-divider class="my-1" />
            <v-list-item
              role="menuitem"
              prepend-icon="trash-2"
              title="Delete"
              class="text-error"
              @click="askDelete(item)"
            />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="repeat"
            :title="search ? 'No synonyms match your search' : 'No synonyms yet'"
            :description="search ? 'Try a different keyword or clear filters.' : 'Add your first synonym to improve search recall.'"
            :action-label="!search ? 'Add new' : undefined"
            action-icon="plus"
            @action="toast.info('Add new synonym — coming soon')"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Edit synonym drawer -->
    <MpFormDrawer v-model="editDrawer" title="Edit synonym" subtitle="Update this synonym mapping">
      <MpFormGrid>
        <v-select
          v-model="editType"
          label="Type"
          :items="[
            { title: 'One way', value: 'one_way' },
            { title: 'Two way', value: 'two_way' },
          ]"
        />

        <v-text-field
          v-model="editQueryInput"
          label="Queries *"
          hint="Type a query, then press Enter"
          persistent-hint
          @keydown.enter.prevent="addEditQuery"
        />
        <div v-if="editQueries.length > 0" class="d-flex flex-wrap gap-1">
          <v-chip
            v-for="q in editQueries"
            :key="q"
            size="small"
            variant="tonal"
            color="default"
            closable
            @click:close="removeEditQuery(q)"
          >
            {{ q }}
          </v-chip>
        </div>

        <template v-if="editType === 'one_way'">
          <v-text-field
            v-model="editLeadsToInput"
            label="Leads to"
            hint="Type a term, then press Enter"
            persistent-hint
            @keydown.enter.prevent="addEditLeadsTo"
          />
          <div v-if="editLeadsTo.length > 0" class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="t in editLeadsTo"
              :key="t"
              size="small"
              variant="tonal"
              color="default"
              closable
              @click:close="removeEditLeadsTo(t)"
            >
              {{ t }}
            </v-chip>
          </div>
        </template>
        <div v-else class="text-caption text-medium-emphasis">
          Two-way synonyms treat all queries above as equivalent to each other.
        </div>
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="editDrawer = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          :disabled="editQueries.length === 0"
          @click="submitEdit"
        >
          Save changes
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDeleteOpen"
      title="Delete synonym?"
      message="This synonym mapping will be permanently deleted. This cannot be undone."
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />

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
