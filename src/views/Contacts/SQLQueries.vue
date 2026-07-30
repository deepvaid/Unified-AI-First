<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCdpEntitiesStore, type SqlQuery } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const store = useCdpEntitiesStore()
const toast = useToast()
const search = ref('')

const tableOptions = computed(() => store.tables.map(t => t.name))

const headers = [
  { title: 'Query Name', key: 'name', sortable: true },
  { title: 'Update Type', key: 'updateType' },
  { title: 'Records', key: 'records', align: 'end' as const },
  { title: 'Last Run', key: 'lastRun' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Create / edit drawer
const drawer = ref(false)
const editingId = ref<number | null>(null)
type QueryForm = Pick<SqlQuery, 'name' | 'targets' | 'updateType' | 'query'>
function blankForm(): QueryForm {
  return { name: '', targets: [], updateType: 'Overwrite', query: '' }
}
const form = ref<QueryForm>(blankForm())

// Snapshot the form on open so close paths can tell edits from noise.
const openSnapshot = ref('')
const snapshotState = () => JSON.stringify(form.value)
const drawerDirty = computed(() => drawer.value && snapshotState() !== openSnapshot.value)

const confirmDiscard = ref(false)
function requestCloseDrawer() {
  if (drawerDirty.value) confirmDiscard.value = true
  else drawer.value = false
}

function openCreate() {
  editingId.value = null
  form.value = blankForm()
  openSnapshot.value = snapshotState()
  drawer.value = true
}
function openEdit(q: SqlQuery) {
  editingId.value = q.id
  form.value = { name: q.name, targets: [...q.targets], updateType: q.updateType, query: q.query }
  openSnapshot.value = snapshotState()
  drawer.value = true
}

const canSave = () => form.value.name.trim().length > 0 && form.value.targets.length > 0 && form.value.query.trim().length > 0

const SQL_EXAMPLES: { label: string; query: string }[] = [
  {
    label: 'Active contacts',
    query: `SELECT email, first_name, last_name
FROM contacts
WHERE status = 'active'
LIMIT 1000;`,
  },
  {
    label: 'High-value buyers',
    query: `SELECT c.email, SUM(o.total) AS lifetime_value
FROM contacts c
JOIN orders o ON o.contact_id = c.id
GROUP BY c.email
HAVING SUM(o.total) > 100;`,
  },
  {
    label: 'Daily opens',
    query: `SELECT DATE(opened_at) AS day, COUNT(*) AS opens
FROM email_events
WHERE event_type = 'open'
GROUP BY DATE(opened_at)
ORDER BY day DESC;`,
  },
]

// Confirm before an example clobbers SQL the merchant has typed.
const pendingExample = ref<string | null>(null)
const confirmReplace = ref(false)
function applyExample(query: string) {
  if (form.value.query.trim() && form.value.query !== query) {
    pendingExample.value = query
    confirmReplace.value = true
    return
  }
  form.value.query = query
}
function confirmApplyExample() {
  if (pendingExample.value != null) form.value.query = pendingExample.value
  pendingExample.value = null
}

function save() {
  if (!canSave()) return
  if (editingId.value != null) {
    store.updateQuery(editingId.value, { ...form.value })
    toast.success('Query updated')
  } else {
    store.addQuery({ ...form.value })
    toast.success('Query created')
  }
  drawer.value = false
}

// Delete
const deleteDialog = ref(false)
const pendingQuery = ref<SqlQuery | null>(null)
function askDelete(q: SqlQuery) { pendingQuery.value = q; deleteDialog.value = true }
function confirmDelete() {
  if (pendingQuery.value) { store.deleteQuery(pendingQuery.value.id); toast.success('Query deleted') }
  pendingQuery.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="SQL Queries"
      :subtitle="`${store.queries.length} saved queries`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Query</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Saved Queries"
        :total-count="store.queries.length"
      />

      <v-data-table
        :headers="headers"
        :items="store.queries"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.records="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.records.toLocaleString() }}</span>
        </template>
        <template v-slot:item.lastRun="{ item }">
          <span class="d-inline-flex align-center gap-2 text-medium-emphasis">
            <v-icon size="14">clock</v-icon>{{ item.lastRun }}
          </span>
        </template>
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" />
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Query actions">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="database"
            :title="search ? 'No queries match your search' : 'No saved queries'"
            :description="search ? 'Try a different search term.' : 'Create an ETL query to populate a relational table on a schedule.'"
            action-label="New Query"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit query -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId != null ? 'Edit Query' : 'New Query'"
      :width="640"
      :guarded="drawerDirty"
      @close="requestCloseDrawer"
    >
      <v-text-field v-model="form.name" label="Query Name *" variant="outlined" density="comfortable" class="mb-4" />
      <v-select
        v-model="form.targets"
        label="Target Tables *"
        :items="tableOptions"
        variant="outlined"
        density="comfortable"
        multiple
        chips
        closable-chips
        class="mb-4"
      />
      <div class="text-body-2 font-weight-medium mb-1">Update Type</div>
      <v-radio-group v-model="form.updateType" inline hide-details class="mb-4">
        <v-radio label="Overwrite" value="Overwrite" />
        <v-radio label="Append" value="Append" />
      </v-radio-group>
      <div class="text-caption text-medium-emphasis mb-2">Example queries</div>
      <div class="d-flex flex-wrap ga-2 mb-3">
        <v-chip
          v-for="ex in SQL_EXAMPLES"
          :key="ex.label"
          size="small"
          variant="outlined"
          class="text-none"
          @click="applyExample(ex.query)"
        >{{ ex.label }}</v-chip>
      </div>
      <v-textarea
        v-model="form.query"
        label="Query *"
        variant="outlined"
        auto-grow
        rows="6"
        spellcheck="false"
        class="sql-editor"
      />
      <v-alert
        v-if="form.query.trim()"
        type="info"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mt-3 text-body-2"
      >
        What this returns: rows that match your SELECT — loaded into the target table using {{ form.updateType.toLowerCase() }} mode.
      </v-alert>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestCloseDrawer">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave()" @click="save">Save</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDiscard"
      title="Discard query changes?"
      message="You have unsaved changes to this query. Closing now will discard them."
      confirm-label="Discard changes"
      danger
      @confirm="drawer = false"
    />

    <MpConfirmDialog
      v-model="confirmReplace"
      title="Replace your SQL?"
      message="Applying this example will replace the query you've written."
      confirm-label="Replace"
      danger
      @confirm="confirmApplyExample"
    />

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete query?"
      :message="`Delete “${pendingQuery?.name}”? The scheduled job will stop running.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.sql-editor :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>
