<script setup lang="ts">
import { ref } from 'vue'
import { useCdpEntitiesStore, type CdpField, type CdpFieldType } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const store = useCdpEntitiesStore()
const toast = useToast()
const search = ref('')

const fieldTypes: CdpFieldType[] = ['String', 'Integer', 'Boolean', 'Datetime', 'Text', 'Float']

const typeIcon: Record<string, string> = {
  String: 'type',
  Integer: 'hash',
  Float: 'hash',
  Boolean: 'toggle-left',
  Datetime: 'calendar',
  Text: 'align-left',
}

const headers = [
  { title: 'Field Name', key: 'name', sortable: true },
  { title: 'Data Type', key: 'type' },
  { title: 'Default Value', key: 'defaultValue', hideBelow: 'md' as const },
  { title: 'Edit Profile', key: 'addToEditProfile', align: 'center' as const, hideBelow: 'sm' as const },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Row identity + its headline count always show; supporting columns drop out
// progressively. The actions column is never tiered — the kebab must stay
// reachable at every width.
const { visibleHeaders } = useResponsiveTableHeaders(headers)
const { loading } = useInitialLoad()

// Create / edit drawer
const drawer = ref(false)
const editingId = ref<number | null>(null)
const form = ref<Omit<CdpField, 'id'>>({
  name: '', type: 'String', defaultValue: '', displayName: '', description: '', addToEditProfile: false,
})

function openCreate() {
  editingId.value = null
  form.value = { name: '', type: 'String', defaultValue: '', displayName: '', description: '', addToEditProfile: false }
  drawer.value = true
}
function openEdit(field: CdpField) {
  editingId.value = field.id
  form.value = {
    name: field.name, type: field.type, defaultValue: field.defaultValue,
    displayName: field.displayName, description: field.description, addToEditProfile: field.addToEditProfile,
  }
  drawer.value = true
}

function save() {
  if (!form.value.name.trim()) return
  if (editingId.value != null) {
    store.updateField(editingId.value, { ...form.value })
    toast.success('Field updated')
  } else {
    store.addField({ ...form.value })
    toast.success('Field created')
  }
  drawer.value = false
}

// Delete
const deleteDialog = ref(false)
const pendingField = ref<CdpField | null>(null)
function askDelete(field: CdpField) { pendingField.value = field; deleteDialog.value = true }
function confirmDelete() {
  if (pendingField.value) { store.deleteField(pendingField.value.id); toast.success('Field deleted') }
  pendingField.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Custom Fields"
      :subtitle="`${store.fields.length} fields defined`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">Add Field</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Fields"
        :total-count="store.fields.length"
      />

      <MpTableSkeleton v-if="loading" :rows="7" :columns="5" />

      <v-data-table v-else
        :headers="visibleHeaders"
        :items="store.fields"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.type="{ item }">
          <div class="d-flex align-center gap-2">
            <v-icon size="16" class="text-medium-emphasis">{{ typeIcon[item.type] ?? 'circle-dot' }}</v-icon>
            <span class="text-body-2">{{ item.type }}</span>
          </div>
        </template>

        <template v-slot:item.defaultValue="{ item }">
          <span v-if="item.defaultValue" class="text-body-2">{{ item.defaultValue }}</span>
          <span v-else class="text-disabled">—</span>
        </template>

        <template v-slot:item.addToEditProfile="{ item }">
          <v-icon v-if="item.addToEditProfile" size="18" color="success">circle-check</v-icon>
          <span v-else class="text-disabled">—</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Field actions" :itemLabel="item.name">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="list"
            :title="search ? 'No fields match your search' : 'No custom fields yet'"
            :description="search ? 'Try a different search term.' : 'Add a custom field to capture more contact data.'"
            action-label="Add Field"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit field -->
    <MpFormDrawer v-model="drawer" :title="editingId != null ? 'Edit Field' : 'Add Field'">
      <MpFormGrid>
        <v-text-field v-model="form.name" label="Field Name *" />
        <v-select
          v-model="form.type"
          label="Field Type *"
          :items="fieldTypes"
          :disabled="editingId != null"
          :hint="editingId != null ? 'Field type can’t be changed after creation.' : 'Field type can’t be changed once the field is created.'"
          persistent-hint
        />
        <v-text-field v-model="form.defaultValue" label="Default Value" />
        <v-text-field v-model="form.displayName" label="Display Name" />
        <v-textarea v-model="form.description" label="Description" rows="3" auto-grow />
        <v-switch
          v-model="form.addToEditProfile"
          label="Add to Edit Profile Page"
          hint="Show this field on the contact edit form."
          persistent-hint
        />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!form.name.trim()" @click="save">Save</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete field?"
      :message="`Delete the field “${pendingField?.name}”? Stored values for this field will be removed.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>
