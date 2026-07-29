<script setup lang="ts">
import { ref } from 'vue'
import { useCdpEntitiesStore, type CdpField, type CdpFieldType } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useCdpEntitiesStore()
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
  { title: 'Default Value', key: 'defaultValue' },
  { title: 'Edit Profile', key: 'addToEditProfile', align: 'center' as const },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
function notify(text: string) { snackbarText.value = text; snackbar.value = true }

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
    notify('Field updated')
  } else {
    store.addField({ ...form.value })
    notify('Field created')
  }
  drawer.value = false
}

// Delete
const deleteDialog = ref(false)
const pendingField = ref<CdpField | null>(null)
function askDelete(field: CdpField) { pendingField.value = field; deleteDialog.value = true }
function confirmDelete() {
  if (pendingField.value) { store.deleteField(pendingField.value.id); notify('Field deleted') }
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

      <v-data-table
        :headers="headers"
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
          <MpRowActionsMenu ariaLabel="Field actions">
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
    <MpFormDrawer v-model="drawer" :title="editingId != null ? 'Edit Field' : 'Add Field'" :width="520">
      <v-text-field v-model="form.name" label="Field Name *" variant="outlined" density="comfortable" class="mb-4" />
      <v-select
        v-model="form.type"
        label="Field Type *"
        :items="fieldTypes"
        variant="outlined"
        density="comfortable"
        :disabled="editingId != null"
        :hint="editingId != null ? 'Field type can’t be changed after creation.' : 'Field type can’t be changed once the field is created.'"
        persistent-hint
        class="mb-4"
      />
      <v-text-field v-model="form.defaultValue" label="Default Value" variant="outlined" density="comfortable" class="mb-4" />
      <v-text-field v-model="form.displayName" label="Display Name" variant="outlined" density="comfortable" class="mb-4" />
      <v-textarea v-model="form.description" label="Description" variant="outlined" density="comfortable" rows="2" auto-grow class="mb-2" />
      <div class="d-flex align-center justify-space-between">
        <div>
          <div class="text-body-2 font-weight-medium">Add to Edit Profile Page</div>
          <div class="text-caption text-medium-emphasis">Show this field on the contact edit form.</div>
        </div>
        <v-switch v-model="form.addToEditProfile" hide-details density="compact" color="primary" />
      </div>
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

    <v-snackbar v-model="snackbar" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackbarText }}</div>
    </v-snackbar>
  </div>
</template>
