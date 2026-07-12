<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketingAssetsStore, type PreferencePage, type PreferencePageType, type PreferenceEditorType } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const store = useMarketingAssetsStore()
const search = ref('')

const PAGE_TYPES: PreferencePageType[] = ['Manage Subscriptions', 'One Click Unsubscribe', 'Confirm Subscription', 'Edit Profile', 'Report Spam']
const EDITOR_TYPES: PreferenceEditorType[] = ['Drag & Drop', 'WYSIWYG', 'HTML']

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Editor Type', key: 'editorType' },
  { title: 'Page Type', key: 'pageType' },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

// ── Filters ───────────────────────────────────────────────────────────────
const filters = ref({ editorType: [] as string[], pageType: [] as string[] })
const filterLabels: Record<string, string> = { editorType: 'Editor Type', pageType: 'Page Type' }

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v.length > 0)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value.join(', ')}` }))
)
function removeFilter(key: string) {
  ;(filters.value as any)[key] = []
}
function clearAllFilters() {
  filters.value = { editorType: [], pageType: [] }
}

const filteredPages = computed(() => {
  let rows = store.preferencePages
  if (filters.value.editorType.length) rows = rows.filter(p => filters.value.editorType.includes(p.editorType))
  if (filters.value.pageType.length) rows = rows.filter(p => filters.value.pageType.includes(p.pageType))
  return rows
})

// ── Create / edit drawer ─────────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const name = ref('')
const pageType = ref<PreferencePageType>('Manage Subscriptions')
const editorType = ref<PreferenceEditorType>('WYSIWYG')
const redirectUrl = ref('')

const canSave = computed(() => name.value.trim() !== '')

function resetForm() {
  name.value = ''
  pageType.value = 'Manage Subscriptions'
  editorType.value = 'WYSIWYG'
  redirectUrl.value = ''
}

function openCreate() {
  editingId.value = null
  resetForm()
  drawer.value = true
}

function openEdit(page: PreferencePage) {
  editingId.value = page.id
  name.value = page.name
  pageType.value = page.pageType
  editorType.value = page.editorType
  redirectUrl.value = page.redirectUrl
  drawer.value = true
}

function savePage() {
  if (!canSave.value) return
  const payload = {
    name: name.value.trim(),
    pageType: pageType.value,
    editorType: editorType.value,
    redirectUrl: pageType.value === 'Manage Subscriptions' ? redirectUrl.value.trim() : '',
  }
  if (editingId.value !== null) {
    store.updatePreferencePage(editingId.value, payload)
    notify('Preference page updated')
  } else {
    store.addPreferencePage(payload)
    notify('Preference page created')
  }
  drawer.value = false
}

// ── Row actions ───────────────────────────────────────────────────────────
function duplicatePage(page: PreferencePage) {
  store.duplicatePreferencePage(page.id)
  notify('Preference page duplicated')
}

const confirmDelete = ref(false)
const pendingDelete = ref<PreferencePage | null>(null)
function askDelete(page: PreferencePage) {
  pendingDelete.value = page
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deletePreferencePage(pendingDelete.value.id)
    notify('Preference page deleted')
  }
  pendingDelete.value = null
}

// ── Snackbar ──────────────────────────────────────────────────────────────
const snack = ref(false)
const snackText = ref('')
function notify(text: string) { snackText.value = text; snack.value = true }
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Preference Pages"
      :subtitle="`${store.preferencePages.length} pages`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Page</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Preference Pages"
        search-placeholder="Search pages..."
        :active-filters="activeFilterEntries"
        :total-count="filteredPages.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filters.editorType"
              label="Editor Type"
              :items="[...EDITOR_TYPES] as string[]"
              multiple
              chips
              closable-chips
              clearable
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3"
            />
            <v-select
              v-model="filters.pageType"
              label="Page Type"
              :items="[...PAGE_TYPES] as string[]"
              multiple
              chips
              closable-chips
              clearable
              variant="outlined"
              density="compact"
              hide-details
            />
          </div>
        </template>
      </MpDataTableToolbar>

      <v-data-table :headers="headers" :items="filteredPages" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.name="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Preference page actions">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-list-item prepend-icon="copy" title="Duplicate" @click="duplicatePage(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="user-cog"
            :title="search || activeFilterEntries.length ? 'No pages match your filters' : 'No preference pages yet'"
            :description="search || activeFilterEntries.length ? 'Try a different search term or clear your filters.' : 'Create a page for subscribers to manage subscriptions, unsubscribe, or update their profile.'"
            :action-label="search || activeFilterEntries.length ? undefined : 'New Page'"
            :action-icon="search || activeFilterEntries.length ? undefined : 'plus'"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit drawer -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId !== null ? 'Edit Preference Page' : 'New Page'"
    >
      <v-text-field
        v-model="name"
        label="Name"
        placeholder="e.g. Default Subscription Center"
        variant="outlined"
        density="comfortable"
        class="mb-4"
        :rules="[v => !!v || 'Name is required']"
      />

      <v-select
        v-model="pageType"
        :items="PAGE_TYPES"
        label="Page Type"
        variant="outlined"
        density="comfortable"
        class="mb-4"
      />

      <v-text-field
        v-if="pageType === 'Manage Subscriptions'"
        v-model="redirectUrl"
        label="Redirect URL"
        placeholder="https://example.com/thank-you"
        hint="Where subscribers land after saving their preferences"
        persistent-hint
        variant="outlined"
        density="comfortable"
        class="mb-4"
      />

      <div class="text-subtitle-2 font-weight-bold mb-2">Editor</div>
      <v-radio-group v-model="editorType" inline hide-details>
        <v-radio label="Drag & Drop" value="Drag & Drop" />
        <v-radio label="WYSIWYG" value="WYSIWYG" />
        <v-radio label="HTML" value="HTML" />
      </v-radio-group>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="savePage">
          {{ editingId !== null ? 'Save Changes' : 'Create' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete preference page?"
      :message="`“${pendingDelete?.name}” will be permanently deleted. Footers referencing it will fall back to none.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />

    <v-snackbar v-model="snack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackText }}</div>
    </v-snackbar>
  </div>
</template>
