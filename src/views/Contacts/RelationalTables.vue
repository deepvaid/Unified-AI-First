<script setup lang="ts">
import { ref } from 'vue'
import { useCdpEntitiesStore, type RelationalTable, type RelationalColumn, type RelationalColumnType } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const store = useCdpEntitiesStore()
const toast = useToast()
const search = ref('')

const dataTypes: RelationalColumnType[] = ['Bigint', 'Boolean', 'Datetime', 'Email', 'UID', 'Float', 'Integer', 'String', 'Text']
const keyTypes: RelationalColumn['keyType'][] = ['None', 'Index', 'Unique']
const allowNullOptions: RelationalColumn['allowNull'][] = ['Yes', 'No']

const headers = [
  { title: 'Table Name', key: 'name', sortable: true },
  { title: 'Rows', key: 'rows', align: 'end' as const },
  { title: 'Primary Key', key: 'primaryKey', hideBelow: 'sm' as const },
  { title: 'Last Updated', key: 'updated', hideBelow: 'md' as const },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Row identity + its headline count always show; supporting columns drop out
// progressively. The actions column is never tiered — the kebab must stay
// reachable at every width.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

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
  toast.success('Table created')
  drawer.value = false
}

// Delete
const deleteDialog = ref(false)
const pendingTable = ref<RelationalTable | null>(null)
function askDelete(table: RelationalTable) { pendingTable.value = table; deleteDialog.value = true }
function confirmDelete() {
  if (pendingTable.value) { store.deleteTable(pendingTable.value.id); toast.success('Table deleted') }
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

      <MpTableSkeleton v-if="loading" :rows="7" :columns="5" />

      <v-data-table v-else
        :headers="visibleHeaders"
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
          <MpRowActionsMenu ariaLabel="Table actions" :itemLabel="item.name">
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
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
    <MpFormDrawer v-model="drawer" title="New Table" size="lg">
      <MpFormGrid>
        <v-text-field v-model="tableName" label="Table Name *" />
      </MpFormGrid>

      <div class="d-flex align-center justify-space-between">
        <MpFormSection title="Columns" />
        <v-btn variant="text" size="small" class="text-none" prepend-icon="plus" @click="addColumn">Add Column</v-btn>
      </div>

      <MpFormGrid>
        <div v-for="(col, i) in columns" :key="i" class="mp-form-grid__trailing">
          <MpFormGrid :cols="2" class="column-block">
            <v-text-field v-model="col.name" label="Name *" />
            <v-select v-model="col.dataType" label="Data Type" :items="dataTypes" />
            <v-text-field v-model="col.defaultValue" label="Default" />
            <v-text-field v-model="col.fieldLength" label="Field Length" />
            <v-select v-model="col.keyType" label="Key Type" :items="keyTypes" />
            <v-select v-model="col.allowNull" label="Allow Null" :items="allowNullOptions" />
          </MpFormGrid>
          <v-tooltip :text="`Remove column ${i + 1}`" location="bottom">
            <template #activator="{ props: tooltip }">
              <v-btn
                v-bind="tooltip"
                icon="trash-2"
                variant="text"
                size="x-small"
                color="error"
                :aria-label="`Remove column ${i + 1}`"
                :disabled="columns.length === 1"
                @click="removeColumn(i)"
              />
            </template>
          </v-tooltip>
        </div>
      </MpFormGrid>

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
  </div>
</template>

<style scoped>
/* A soft fill alone groups a column's six fields — no hairline on top of a
   background (recipe B4). */
/* A hairline, not a fill: --surface-secondary behind these transparent outlined
   fields dropped their resting border to 2.92:1, below the 3:1 a control
   boundary must hold. The group still reads as one block. */
.column-block {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  padding: var(--mp-component-card-paddingCompact);
}
</style>
