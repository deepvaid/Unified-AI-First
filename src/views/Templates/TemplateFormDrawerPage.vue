<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import {
  CATEGORY_OPTIONS,
  OWNER_OPTIONS,
  STATUS_OPTIONS,
  makeRecords,
  type PlaceholderRecord,
  type PlaceholderStatus,
} from './placeholder'

// FORM DRAWER TEMPLATE — create and edit in one guarded drawer.
// The host list is deliberately the minimal one (search only, no filter drawer),
// the way src/views/Settings/Users.vue does it.

const toast = useToast()

const records = ref<PlaceholderRecord[]>(makeRecords(6))
const search = ref('')
const headers = [
  { title: 'Column A · Name', key: 'name' },
  { title: 'Column B · Category', key: 'category' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

/* ── Drawer state ───────────────────────────────────────────────────
   One drawer serves both modes. Open copies the record into local refs
   and then flips the boolean; the drawer is never keyed on the record. */
type Mode = 'create' | 'edit'

const drawerOpen = ref(false)
const mode = ref<Mode>('create')
const editing = ref<PlaceholderRecord | null>(null)

const blankForm = () => ({
  name: '',
  category: null as string | null,
  status: null as PlaceholderStatus | null,
  owner: null as string | null,
  description: '',
  attribute: '',
  visibility: 'Option A',
})
const form = ref(blankForm())
const pristine = ref(JSON.stringify(blankForm()))

const isDirty = computed(() => JSON.stringify(form.value) !== pristine.value)
const canSave = computed(() => form.value.name.trim().length > 0)
const drawerTitle = computed(() => (mode.value === 'create' ? 'Create record' : 'Edit record'))

function openCreate() {
  mode.value = 'create'
  editing.value = null
  form.value = blankForm()
  pristine.value = JSON.stringify(form.value)
  drawerOpen.value = true
}

function openEdit(record: PlaceholderRecord) {
  mode.value = 'edit'
  editing.value = record
  form.value = {
    ...blankForm(),
    name: record.name,
    category: record.category,
    status: record.status,
    owner: record.owner,
  }
  pristine.value = JSON.stringify(form.value)
  drawerOpen.value = true
}

function save() {
  if (mode.value === 'edit' && editing.value) {
    editing.value.name = form.value.name
    if (form.value.category) editing.value.category = form.value.category
    if (form.value.status) editing.value.status = form.value.status
    if (form.value.owner) editing.value.owner = form.value.owner
    toast.success('Record updated')
  } else {
    records.value.push({
      id: Math.max(0, ...records.value.map((r) => r.id)) + 1,
      name: form.value.name,
      category: form.value.category ?? 'Category A',
      status: form.value.status ?? 'Draft',
      owner: form.value.owner ?? 'Owner A',
      updated: 'Date value 01',
      amount: 'Value 00',
    })
    toast.success('Record created')
  }
  drawerOpen.value = false
}

/* `guarded` routes Esc, the close button and the scrim to @close instead of
   closing outright — so this handler is what actually dismisses the drawer. */
const confirmDiscard = ref(false)
function requestClose() {
  if (isDirty.value) {
    confirmDiscard.value = true
    return
  }
  drawerOpen.value = false
}

function discard() {
  drawerOpen.value = false
}

function clearAll() {
  form.value = blankForm()
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Section · Records"
      title="Form drawer"
      subtitle="Create and edit without leaving the list"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">
          Create record
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar v-model:search="search" title="Records" search-placeholder="Search records" />
      <v-data-table
        :headers="headers"
        :items="records"
        :search="search"
        density="comfortable"
        hover
        :items-per-page="10"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>
        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Record actions" :itemLabel="item.name">
              <MpMenuItem title="Edit" icon="pencil" @click="openEdit(item)" />
            </MpRowActionsMenu>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <MpFormDrawer
      v-model="drawerOpen"
      :title="drawerTitle"
      :subtitle="mode === 'edit' ? editing?.name : 'New record'"
      size="md"
      guarded
      @close="requestClose"
    >
      <MpFormSection title="General" description="Fields every record needs." required />
      <MpFormGrid :cols="2">
        <!-- The label prop names the field and renders as the static top label.
             No margins here: MpFormGrid's gap is the field rhythm. -->
        <!-- `lazy` keeps the rule from firing on mount: a create form should open
             calm, and only tell you a field is empty once you have left it. -->
        <v-text-field
          v-model="form.name"
          label="Name *"
          placeholder="Record name"
          class="mp-form-grid__full"
          validate-on="input lazy"
          :rules="[(v: string) => !!v?.trim() || 'Name is required']"
        />
        <v-select v-model="form.category" label="Category" :items="CATEGORY_OPTIONS" placeholder="Select a category" />
        <v-select v-model="form.status" label="Status" :items="STATUS_OPTIONS" placeholder="Select a status" />
        <v-select v-model="form.owner" label="Owner" :items="OWNER_OPTIONS" class="mp-form-grid__full" />
        <v-textarea
          v-model="form.description"
          label="Description"
          placeholder="Supporting description text"
          rows="3"
          class="mp-form-grid__full"
        />
        <!-- A field plus its trailing icon button: the button gets its own fixed
             track so the input's right edge still lands on the form's edge. -->
        <div class="mp-form-grid__trailing mp-form-grid__full">
          <v-text-field v-model="form.attribute" label="Attribute value" placeholder="Value" />
          <v-btn icon="trash-2" variant="text" density="comfortable" aria-label="Remove attribute" @click="form.attribute = ''" />
        </div>
      </MpFormGrid>

      <MpFormSection title="Options">
        <MpFormGrid>
          <!-- MpFormField is for composite controls only — a chip group has no
               label of its own. A Vuetify input is never wrapped in one. -->
          <MpFormField label="Visibility" hint="Pick the one that applies.">
            <v-chip-group v-model="form.visibility" mandatory selected-class="text-primary">
              <v-chip v-for="option in ['Option A', 'Option B', 'Option C']" :key="option" :value="option" variant="outlined">
                {{ option }}
              </v-chip>
            </v-chip-group>
          </MpFormField>
        </MpFormGrid>
      </MpFormSection>

      <template #footerStart>
        <v-btn variant="text" class="text-none" @click="clearAll">Clear all</v-btn>
      </template>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestClose">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">
          {{ mode === 'create' ? 'Create record' : 'Save changes' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDiscard"
      title="Discard changes?"
      message="This record has unsaved changes. Closing now will discard them."
      confirm-label="Discard"
      danger
      @confirm="discard"
    />
  </div>
</template>
