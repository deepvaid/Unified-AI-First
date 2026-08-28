<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketingAssetsStore, type FooterItem, type FooterEditorType, type FooterPrefPages } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import { useToast } from '@/composables/useToast'

const store = useMarketingAssetsStore()
const search = ref('')

const prefPageOptions = computed(() => store.preferencePages.map(p => ({ title: p.name, value: p.id })))

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Editor Type', key: 'editorType' },
  { title: 'Default', key: 'isDefault' },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

// ── Create / edit drawer ─────────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const name = ref('')
const editorType = ref<FooterEditorType>('WYSIWYG')
const body = ref('')
const prefPages = ref<FooterPrefPages>({ oneClickUnsub: null, reportSpam: null, manageSubscription: null, editProfile: null })

const canSave = computed(() => name.value.trim() !== '')

function resetForm() {
  name.value = ''
  editorType.value = 'WYSIWYG'
  body.value = '{{campaign.address}}\n{{campaign.unsubscribe_link}}'
  prefPages.value = { oneClickUnsub: null, reportSpam: null, manageSubscription: null, editProfile: null }
}

function openCreate() {
  editingId.value = null
  resetForm()
  drawer.value = true
}

function openEdit(footer: FooterItem) {
  editingId.value = footer.id
  name.value = footer.name
  editorType.value = footer.editorType
  body.value = footer.body
  prefPages.value = { ...footer.prefPages }
  drawer.value = true
}

function saveFooter() {
  if (!canSave.value) return
  const payload = { name: name.value.trim(), editorType: editorType.value, body: body.value, prefPages: prefPages.value }
  if (editingId.value !== null) {
    store.updateFooter(editingId.value, payload)
    notify('Footer updated')
  } else {
    store.addFooter(payload)
    notify('Footer created')
  }
  drawer.value = false
}

// ── Row actions ───────────────────────────────────────────────────────────
function duplicateFooter(footer: FooterItem) {
  store.duplicateFooter(footer.id)
  notify('Footer duplicated')
}

function setDefault(footer: FooterItem) {
  store.setDefaultFooter(footer.id)
  notify(`“${footer.name}” set as default`)
}

const confirmDelete = ref(false)
const pendingDelete = ref<FooterItem | null>(null)
function askDelete(footer: FooterItem) {
  pendingDelete.value = footer
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deleteFooter(pendingDelete.value.id)
    notify('Footer deleted')
  }
  pendingDelete.value = null
}

// ── Toast ─────────────────────────────────────────────────────────────────
const toast = useToast()
function notify(text: string) { toast.success(text) }
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Footer Management"
      :subtitle="`${store.footers.length} footers`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Footer</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Footers"
        search-placeholder="Search footers..."
        :total-count="store.footers.length"
      />

      <v-data-table :headers="headers" :items="store.footers" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.isDefault="{ item }">
          <v-chip v-if="item.isDefault" color="primary" size="small">Default</v-chip>
          <span v-else class="text-medium-emphasis text-body-2">—</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Footer actions">
            <v-list-item prepend-icon="pencil" title="Edit Design" @click="openEdit(item)" />
            <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicateFooter(item)" />
            <v-list-item v-if="!item.isDefault" prepend-icon="star" title="Set as Default" @click="setDefault(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" :disabled="item.isDefault" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="panel-bottom"
            :title="search ? 'No footers match your search' : 'No footers yet'"
            :description="search ? 'Try a different search term.' : 'Standardize footers across brands with unsubscribe and compliance links.'"
            :action-label="!search ? 'New Footer' : undefined"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit drawer -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId !== null ? 'Edit Footer' : 'New Footer'" size="lg"
    >
      <MpFormGrid :cols="2">
        <v-text-field
          v-model="name"
          class="mp-form-grid__full"
          label="Name"
          placeholder="e.g. Standard Compliance (CAN-SPAM)"
          :rules="[v => !!v || 'Name is required']"
        />

        <MpFormSection title="Preference pages" />
        <v-select v-model="prefPages.oneClickUnsub" :items="prefPageOptions" label="1-Click Unsubscribe" clearable />
        <v-select v-model="prefPages.reportSpam" :items="prefPageOptions" label="Report Spam" clearable />
        <v-select v-model="prefPages.manageSubscription" :items="prefPageOptions" label="Manage Subscription" clearable />
        <v-select v-model="prefPages.editProfile" :items="prefPageOptions" label="Edit Profile" clearable />

        <MpFormField label="Editor type" class="mp-form-grid__full">
          <template #default="{ labelId }">
            <v-radio-group v-model="editorType" inline :aria-labelledby="labelId">
              <v-radio label="Drag & Drop" value="Drag & Drop" />
              <v-radio label="WYSIWYG" value="WYSIWYG" />
            </v-radio-group>
          </template>
        </MpFormField>

        <v-textarea
          v-model="body"
          class="mp-form-grid__full"
          label="Footer content"
          rows="5"
          auto-grow
          hint="Merge tags like {{campaign.address}} and {{campaign.unsubscribe_link}} render automatically at send time"
          persistent-hint
        />
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="saveFooter">
          {{ editingId !== null ? 'Save Changes' : 'Create Footer' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete footer?"
      :message="`“${pendingDelete?.name}” will be permanently deleted.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>
