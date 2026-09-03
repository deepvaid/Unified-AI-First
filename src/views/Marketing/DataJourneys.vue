<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import { useDataJourneysStore, type DataJourney } from '@/stores/useDataJourneys'
import { useToast } from '@/composables/useToast'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'

const store = useDataJourneysStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const accountId = computed(() => route.params.accountId as string)
const { loading } = useInitialLoad()
const search = ref('')

// ── Filter (mirrors the production select: one list, statuses + a recency sort).
// Promoted to the toolbar's exclusive quick filter; the toolbar model is an
// array that always holds exactly one value, bridged to the single `filter`. ──
const filter = ref('all')
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Recently Modified', value: 'recent' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Enabled', value: 'Enabled' },
  { label: 'Disabled', value: 'Disabled' },
]
const filterModel = computed<string[]>({
  get: () => [filter.value],
  set: v => { filter.value = v[0] ?? 'all' },
})

const rows = computed<DataJourney[]>(() => {
  const list = [...store.dataJourneys]
  if (filter.value === 'recent') return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  if (filter.value === 'all') return list
  return list.filter(j => j.status === filter.value)
})

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Journey status', key: 'status', sortable: false, width: 140 },
  { title: 'Instances', key: 'instances', align: 'end' as const, sortable: false, width: 110 },
  { title: 'Updated at', key: 'updatedAt', sortable: true, hideBelow: 'md' as const },
  { title: 'Created at', key: 'createdAt', sortable: true, hideBelow: 'lg' as const },
  { title: 'Actions', key: 'actions', sortable: false, width: 84, align: 'end' as const },
]
const { visibleHeaders } = useResponsiveTableHeaders(headers)

function formatAt(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date} at ${time}`
}

function openBuilder(id: number) {
  router.push({ name: 'DataJourneyBuilder', params: { accountId: accountId.value, id: String(id) } })
}

function toggleStatus(journey: DataJourney) {
  store.toggleDataJourney(journey.id)
  const now = store.dataJourneys.find(j => j.id === journey.id)?.status
  toast.success(`"${journey.name}" ${now === 'Enabled' ? 'enabled' : 'disabled'}`)
}

// ── New / Edit dialog (one form, two modes — mirrors the production modals) ──
const journeyDialog = ref(false)
const editing = ref<DataJourney | null>(null)
const form = reactive({ name: '', endDate: '', endTime: '', enabled: false, allowMultiple: false })
const nameTouched = ref(false)
const nameError = computed(() => (nameTouched.value && !form.name.trim() ? 'Name is required' : ''))

function openNew() {
  editing.value = null
  Object.assign(form, { name: '', endDate: '', endTime: '', enabled: false, allowMultiple: false })
  nameTouched.value = false
  journeyDialog.value = true
}

function openEdit(journey: DataJourney) {
  editing.value = journey
  Object.assign(form, {
    name: journey.name,
    endDate: journey.endDate,
    endTime: journey.endTime,
    enabled: journey.status === 'Enabled',
    allowMultiple: journey.allowMultiple,
  })
  nameTouched.value = false
  journeyDialog.value = true
}

function confirmJourney() {
  nameTouched.value = true
  if (!form.name.trim()) return
  const payload = {
    name: form.name.trim(),
    endDate: form.endDate,
    endTime: form.endTime,
    enabled: form.enabled,
    allowMultiple: form.allowMultiple,
  }
  if (editing.value) {
    store.updateDataJourney(editing.value.id, payload)
    toast.success(`"${payload.name}" updated`)
    journeyDialog.value = false
  } else {
    const id = store.createDataJourney(payload)
    toast.success(`"${payload.name}" created`)
    journeyDialog.value = false
    openBuilder(id)
  }
}

function duplicate(journey: DataJourney) {
  const id = store.duplicateDataJourney(journey.id)
  if (id) toast.success(`"${journey.name}" duplicated as a draft`)
}

// ── Delete (single row + bulk) ──
const deleteTarget = ref<DataJourney | null>(null)
const deleteDialog = ref(false)
function askDelete(journey: DataJourney) {
  deleteTarget.value = journey
  deleteDialog.value = true
}
function confirmDelete() {
  if (!deleteTarget.value) return
  store.removeDataJourney(deleteTarget.value.id)
  toast.success(`"${deleteTarget.value.name}" deleted`)
  deleteTarget.value = null
}

const selected = ref<number[]>([])
const bulkDeleteDialog = ref(false)
function confirmBulkDelete() {
  const count = selected.value.length
  store.removeMany(selected.value)
  selected.value = []
  toast.success(`${count} data journey${count === 1 ? '' : 's'} deleted`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader eyebrow="My Journeys" title="Data Journeys">
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="openNew">
          New data journey
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:quick-filter-value="filterModel"
        title="Data journeys"
        search-placeholder="Search data journeys..."
        :total-count="rows.length"
        :quick-filter="{ key: 'status', label: 'Filter', icon: 'list-filter', multiple: false, options: filterOptions }"
      />

      <MpTableSkeleton v-if="loading" :rows="8" :columns="5" />

      <v-data-table
        v-else
        v-model="selected"
        :headers="visibleHeaders"
        :items="rows"
        :search="search"
        item-value="id"
        show-select
        hover
        :items-per-page="10"
        class="flex-grow-1"
      >
        <!-- Labelled select checkboxes (the default show-select inputs have no accessible name) -->
        <template v-slot:header.data-table-select="{ allSelected, selectAll, someSelected }">
          <v-checkbox-btn
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            aria-label="Select all data journeys"
            @update:model-value="selectAll(!allSelected)"
          ></v-checkbox-btn>
        </template>
        <template v-slot:item.data-table-select="{ internalItem, isSelected, toggleSelect }">
          <v-checkbox-btn
            :model-value="isSelected(internalItem)"
            :aria-label="`Select ${internalItem.raw.name}`"
            @update:model-value="toggleSelect(internalItem)"
          ></v-checkbox-btn>
        </template>

        <template v-slot:item.name="{ item }">
          <a
            href="#"
            class="text-primary font-weight-medium text-decoration-none"
            @click.prevent="openBuilder(item.id)"
          >{{ item.name }}</a>
        </template>

        <template v-slot:item.status="{ item }">
          <v-switch
            :model-value="item.status === 'Enabled'"
            :aria-label="`Journey status for ${item.name}: ${item.status}`"
            color="primary"
            density="compact"
            hide-details
            inset
            @update:model-value="toggleStatus(item)"
          ></v-switch>
        </template>

        <template v-slot:item.instances="{ item }">
          <RouterLink
            v-if="store.instanceCount(item.id) > 0"
            :to="{ name: 'DataJourneyInstances', params: { accountId, id: String(item.id) } }"
            class="text-primary font-weight-medium text-decoration-none"
          >{{ store.instanceCount(item.id) }}</RouterLink>
          <span v-else class="text-medium-emphasis">0</span>
        </template>

        <template v-slot:item.updatedAt="{ item }">{{ formatAt(item.updatedAt) }}</template>
        <template v-slot:item.createdAt="{ item }">{{ formatAt(item.createdAt) }}</template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu :ariaLabel="`Actions for ${item.name}`">
            <MpMenuItem title="Edit data journey" icon="pencil" @click="openEdit(item)" />
            <MpMenuItem title="Duplicate data journey" icon="copy" @click="duplicate(item)" />
            <v-divider class="my-1" />
            <MpMenuItem title="Delete data journey" icon="trash-2" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="workflow"
            :title="search ? 'No data journeys match your search' : 'No data journeys match this filter'"
            :description="search ? 'Try a different search term.' : 'Change the filter, or create a new data journey to automate imports, exports and sends.'"
            :actionLabel="search ? undefined : 'New data journey'"
            @action="openNew"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar :count="selected.length" :total="rows.length" @clear="selected = []">
      <v-btn variant="text" class="text-none" prepend-icon="trash-2" @click="bulkDeleteDialog = true">
        Delete
      </v-btn>
    </MpFloatingBulkBar>

    <!-- New / Edit — same fields as production (name, optional end date/time, two flags) -->
    <MpDialog
      v-model="journeyDialog"
      :title="editing ? 'Edit data journey' : 'New data journey'"
      size="sm"
    >
      <MpFormGrid :cols="2">
        <v-text-field
          v-model="form.name"
          label="Data journey name *"
          class="mp-form-grid__full"
          :error-messages="nameError"
          @blur="nameTouched = true"
        ></v-text-field>
        <v-text-field v-model="form.endDate" label="End date" type="date"></v-text-field>
        <v-text-field v-model="form.endTime" label="End time" type="time"></v-text-field>
        <v-checkbox v-model="form.enabled" label="Enabled data journey" hide-details></v-checkbox>
        <v-checkbox v-model="form.allowMultiple" label="Allow multiple instances" hide-details></v-checkbox>
        <MpAlert
          v-if="editing?.lastDisabledAt"
          tone="info"
          class="mp-form-grid__full"
        >
          This data journey was last disabled at {{ formatAt(editing.lastDisabledAt) }}.
        </MpAlert>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="journeyDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="confirmJourney">
          {{ editing ? 'Confirm' : 'Create' }}
        </v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="deleteDialog"
      danger
      title="Delete this data journey?"
      :message="`&quot;${deleteTarget?.name}&quot; and its run history will be permanently deleted.`"
      confirm-label="Delete"
      @confirm="confirmDelete"
    />

    <MpConfirmDialog
      v-model="bulkDeleteDialog"
      danger
      :title="`Delete ${selected.length} data journey${selected.length === 1 ? '' : 's'}?`"
      message="The selected data journeys and their run history will be permanently deleted."
      confirm-label="Delete"
      @confirm="confirmBulkDelete"
    />
  </div>
</template>
