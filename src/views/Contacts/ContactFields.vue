<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCdpEntitiesStore, type CdpField, type CdpFieldType } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const store = useCdpEntitiesStore()
const toast = useToast()
const search = ref('')

const fieldTypes: CdpFieldType[] = ['String', 'Integer', 'Boolean', 'Datetime', 'Text', 'Float']

// The source splits these across two tabs.
const tab = ref<'custom' | 'default'>('custom')
const tabs = computed(() => [
  { label: 'Custom fields', key: 'custom', count: store.fields.length },
  { label: 'Default fields', key: 'default', count: store.defaultFields.length },
])

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

/** The name this field had when the drawer opened, to warn about renames. */
const originalName = ref('')

function openCreate() {
  editingId.value = null
  originalName.value = ''
  form.value = { name: '', type: 'String', defaultValue: '', displayName: '', description: '', addToEditProfile: false }
  drawer.value = true
}
function openEdit(field: CdpField) {
  editingId.value = field.id
  originalName.value = field.name
  form.value = {
    name: field.name, type: field.type, defaultValue: field.defaultValue,
    displayName: field.displayName, description: field.description, addToEditProfile: field.addToEditProfile,
  }
  drawer.value = true
}

/** Switching type would leave a value the new type can't hold. */
function onTypeChange() {
  form.value.defaultValue = form.value.type === 'Boolean' ? 'True' : ''
}

// The source validates Integer but lets Float accept any string — its own data
// has a float field defaulting to "ADAAD". Both are validated here.
const defaultValueError = computed(() => {
  const v = form.value.defaultValue.trim()
  if (v === '') return ''
  if (form.value.type === 'Integer' && !/^-?\d+$/.test(v)) return 'Enter a whole number, for example 0 or 42'
  if (form.value.type === 'Float' && !/^-?\d*\.?\d+$/.test(v)) return 'Enter a number, for example 0 or 12.5'
  return ''
})

const nameError = computed(() => {
  const v = form.value.name.trim()
  if (v === '') return ''
  const clash = store.fields.find(f => f.name.toLowerCase() === v.toLowerCase() && f.id !== editingId.value)
  return clash ? 'A field with this name already exists' : ''
})

/** The machine name is referenced by segments, imports and templates. */
const renameWarning = computed(() =>
  editingId.value != null && originalName.value !== '' && form.value.name.trim() !== originalName.value
    ? `Renaming this field breaks anything that references “${originalName.value}” — segments, imports, templates and API calls.`
    : '',
)

const canSaveField = computed(() =>
  form.value.name.trim() !== '' && nameError.value === '' && defaultValueError.value === '',
)

function save() {
  if (!canSaveField.value) return
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
      title="Contact fields"
      :subtitle="`${store.fields.length} custom fields · ${store.defaultFields.length} default fields`"
    >
      <template #actions>
        <v-btn
          v-if="tab === 'custom'"
          color="primary"
          variant="flat"
          prepend-icon="plus"
          class="text-none"
          @click="openCreate"
        >
          Add field
        </v-btn>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="tab" :tabs="tabs" aria-label="Field type" controls-id="fields-panel" />

    <!-- Datetime storage note. The source repeats this on both tabs, including
         the one where no datetime field can exist. -->
    <p v-if="tab === 'custom'" class="text-caption text-medium-emphasis mb-0">
      Datetime fields are stored and processed in Eastern Time (ET).
    </p>

    <v-card
      v-if="tab === 'custom'"
      id="fields-panel"
      variant="flat"
      border
      rounded="lg"
      class="flex-grow-1 d-flex flex-column overflow-hidden"
    >
      <MpDataTableToolbar
        v-model:search="search"
        title="Custom fields"
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
            <v-list-item role="menuitem" prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <v-list-item role="menuitem" prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="list"
            :title="search ? 'No fields match your search' : 'No custom fields yet'"
            :description="search ? 'Try a different search term.' : 'Add a custom field to capture more contact data.'"
            action-label="Add field"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Default fields: built in, so name and type are fixed and only the
         default value can be edited. -->
    <v-card
      v-else
      id="fields-panel"
      variant="flat"
      border
      rounded="lg"
      class="flex-grow-1 d-flex flex-column overflow-hidden"
    >
      <!-- MpDataTableToolbar always renders a search field, which would be dead
           UI over two rows — this table gets a plain section heading instead. -->
      <div class="px-6 pt-6 pb-4">
        <MpSectionHeader title="Default fields" :heading-level="2" />
        <p class="text-body-2 text-medium-emphasis mb-0">
          Built-in fields. Their name and type are fixed; you can set a default value.
        </p>
      </div>
      <v-table density="comfortable">
        <thead>
          <tr>
            <th scope="col">Field name</th>
            <th scope="col">Data type</th>
            <th scope="col">Default value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="field in store.defaultFields" :key="field.name">
            <td class="text-body-2 font-weight-medium">{{ field.name }}</td>
            <td>
              <div class="d-flex align-center gap-2">
                <v-icon size="16" class="text-medium-emphasis">{{ typeIcon[field.type] ?? 'circle-dot' }}</v-icon>
                <span class="text-body-2">{{ field.type }}</span>
              </div>
            </td>
            <td>
              <!-- Table-cell editor: compact and detail-free on purpose, so a
                   hint or validation line can't grow the row. -->
              <v-text-field
                :model-value="field.defaultValue"
                :aria-label="`Default value for ${field.name}`"
                hide-details
                placeholder="No default"
                style="max-width: 280px;"
                @update:model-value="store.updateDefaultField(field.name, $event)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Create / edit field -->
    <MpFormDrawer v-model="drawer" :title="editingId != null ? 'Edit field' : 'Add field'">
      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Field name *"
          :error-messages="nameError ? [nameError] : []"
          :hint="renameWarning || undefined"
          :persistent-hint="!!renameWarning"
        />
        <v-select
          v-model="form.type"
          label="Field type *"
          :items="fieldTypes"
          :disabled="editingId != null"
          :hint="editingId != null
            ? 'Field type can’t be changed after creation.'
            : 'Choose carefully — the type can’t be changed once the field is created.'"
          persistent-hint
          @update:model-value="onTypeChange"
        />

        <!-- The default-value control follows the chosen type, as the source does. -->
        <v-select
          v-if="form.type === 'Boolean'"
          v-model="form.defaultValue"
          label="Default value"
          :items="['True', 'False']"
        />
        <v-text-field
          v-else-if="form.type === 'Datetime'"
          v-model="form.defaultValue"
          label="Default value"
          type="date"
          hint="Stored in Eastern Time (ET)."
          persistent-hint
        />
        <v-textarea
          v-else-if="form.type === 'Text'"
          v-model="form.defaultValue"
          label="Default value"
          rows="3"
        />
        <v-text-field
          v-else
          v-model="form.defaultValue"
          label="Default value"
          :type="form.type === 'Integer' || form.type === 'Float' ? 'number' : 'text'"
          :inputmode="form.type === 'Integer' ? 'numeric' : form.type === 'Float' ? 'decimal' : undefined"
          :error-messages="defaultValueError ? [defaultValueError] : []"
        />

        <v-text-field
          v-model="form.displayName"
          label="Display name"
          hint="Shown instead of the field name wherever contacts or staff see it."
          persistent-hint
        />
        <v-textarea v-model="form.description" label="Description" rows="3" auto-grow />

        <MpFormField
          label="Show on the Edit Profile page"
          hint="Contacts can read and update this field on your hosted Edit Profile page."
        >
          <template #default="{ labelId, descriptionId }">
            <v-switch
              v-model="form.addToEditProfile"
              :aria-labelledby="labelId"
              :aria-describedby="descriptionId"
              :label="form.addToEditProfile ? 'Visible to contacts' : 'Hidden from contacts'"
              hide-details
            />
          </template>
        </MpFormField>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          :disabled="!canSaveField"
          @click="save"
        >
          {{ editingId != null ? 'Save changes' : 'Add field' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="deleteDialog"
      :title="`Delete “${pendingField?.name}”?`"
      message="This custom field and every value stored in it will be permanently deleted."
      :consequences="[
        'Contacts lose the data held in this field.',
        'Segments, imports and templates that reference it stop working.',
        'This cannot be undone.',
      ]"
      confirm-label="Delete field"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>
