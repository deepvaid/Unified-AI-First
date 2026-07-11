<script setup lang="ts">
import { ref } from 'vue'
import { useCdpEntitiesStore, type RelationalTable, type RelationalColumn, type RelationalColumnType } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useCdpEntitiesStore()
const search = ref('')

const dataTypes: RelationalColumnType[] = ['Bigint', 'Boolean', 'Datetime', 'Email', 'UID', 'Float', 'Integer', 'String', 'Text']
const keyTypes: RelationalColumn['keyType'][] = ['None', 'Index', 'Unique']
const allowNullOptions: RelationalColumn['allowNull'][] = ['Yes', 'No']

const headers = [
  { title: 'Table Name', key: 'name', sortable: true },
  { title: 'Rows', key: 'rows', align: 'end' as const },
  { title: 'Primary Key', key: 'primaryKey' },
  { title: 'Last Updated', key: 'updated' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
function notify(text: string) { snackbarText.value = text; snackbar.value = true }

// Create drawer
const drawer = ref(false)
const tableName = ref('')
const columns = ref<RelationalColumn[]>([store.newColumn()])

function openCreate() {
  tableName.value = ''
  columns.value = [store.newColumn()]
  drawer.value = true
}
function addColumn() { columns.value.push(store.newColumn()) }
function removeColumn(i: number) { columns.value.splice(i, 1) }

const canSave = () => tableName.value.trim().length > 0 && columns.value.some(c => c.name.trim())

function save() {
  if (!canSave()) return
  store.addTable({ name: tableName.value.trim(), columns: columns.value.filter(c => c.name.trim()) })
  notify('Table created')
  drawer.value = false
}

// Delete
const deleteDialog = ref(false)
const pendingTable = ref<RelationalTable | null>(null)
function askDelete(table: RelationalTable) { pendingTable.value = table; deleteDialog.value = true }
function confirmDelete() {
  if (pendingTable.value) { store.deleteTable(pendingTable.value.id); notify('Table deleted') }
  pendingTable.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Relational Tables"
      :subtitle="`${store.tables.length} tables`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Table</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Tables"
        :total-count="store.tables.length"
      />

      <v-data-table
        :headers="headers"
        :items="store.tables"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.rows="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.rows.toLocaleString() }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Table actions">
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="table"
            :title="search ? 'No tables match your search' : 'No relational tables yet'"
            :description="search ? 'Try a different search term.' : 'Create a relational table to store structured data linked to your contacts.'"
            action-label="New Table"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create table -->
    <MpFormDrawer v-model="drawer" title="New Table" :width="640">
      <v-text-field v-model="tableName" label="Table Name *" variant="outlined" density="comfortable" class="mb-5" />

      <div class="d-flex align-center justify-space-between mb-3">
        <div class="text-subtitle-2 font-weight-bold">Columns</div>
        <v-btn variant="text" size="small" class="text-none" prepend-icon="plus" @click="addColumn">Add Column</v-btn>
      </div>

      <div v-for="(col, i) in columns" :key="i" class="column-block mb-3">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-caption text-medium-emphasis font-weight-medium">Column {{ i + 1 }}</span>
          <v-btn
            v-if="columns.length > 1"
            icon="trash-2"
            variant="text"
            size="x-small"
            color="error"
            aria-label="Remove column"
            @click="removeColumn(i)"
          />
        </div>
        <v-row dense>
          <v-col cols="6"><v-text-field v-model="col.name" label="Name *" variant="outlined" density="compact" hide-details /></v-col>
          <v-col cols="6"><v-select v-model="col.dataType" label="Data Type" :items="dataTypes" variant="outlined" density="compact" hide-details /></v-col>
          <v-col cols="6"><v-text-field v-model="col.defaultValue" label="Default" variant="outlined" density="compact" hide-details /></v-col>
          <v-col cols="6"><v-text-field v-model="col.fieldLength" label="Field Length" variant="outlined" density="compact" hide-details /></v-col>
          <v-col cols="6"><v-select v-model="col.keyType" label="Key Type" :items="keyTypes" variant="outlined" density="compact" hide-details /></v-col>
          <v-col cols="6"><v-select v-model="col.allowNull" label="Allow Null" :items="allowNullOptions" variant="outlined" density="compact" hide-details /></v-col>
        </v-row>
      </div>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave()" @click="save">Create Table</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete table?"
      :message="`Delete “${pendingTable?.name}”? All rows in this table will be permanently removed.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />

    <v-snackbar v-model="snackbar" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackbarText }}</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.column-block {
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 12px;
  padding: 12px;
  background: rgba(var(--v-theme-on-surface), 0.015);
}
</style>
