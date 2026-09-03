<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketingAssetsStore, type PreferencePage, type PreferencePageType, type PreferenceEditorType } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: /accounts/:id/preference_pages — "Preference Management".
// Editor-type + page-type filters, kebab = Preview / Edit / Delete Permanently,
// New Page modal (Name*, Page Type*, Redirect* + preview, editor radios).
// The editors CREATE hands off to are cross-origin builders (GAPS.md).

const store = useMarketingAssetsStore()
const search = ref('')

const PAGE_TYPES: PreferencePageType[] = ['Manage Subscriptions', 'One Click Unsubscribe', 'Confirm Subscription', 'Edit Profile', 'Report Spam']
const EDITOR_TYPES: Array<{ label: string; value: PreferenceEditorType }> = [
  { label: 'Drag & Drop', value: 'Drag & Drop' },
  { label: 'WYSIWYG', value: 'WYSIWYG' },
  { label: 'HTML Code Editor', value: 'HTML' },
]
const REDIRECT_OPTIONS = ['Default', 'Thank You Page', 'Store Homepage']

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Editor Type', key: 'editorType' },
  { title: 'Page Type', key: 'pageType' },
  { title: 'Updated At', key: 'updatedAt', sortable: true },
  { title: 'Created At', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

function editorLabel(value: PreferenceEditorType): string {
  return EDITOR_TYPES.find(e => e.value === value)?.label ?? value
}

// ── Filters ───────────────────────────────────────────────────────────────
// Page Type is the promoted filter; Editor Type lives in the filter drawer.
const pageTypeQuickFilter = {
  key: 'pageType',
  label: 'Page Type',
  options: ([...PAGE_TYPES] as string[]).map((v) => ({ label: v, value: v })),
}
const pageTypeFilter = ref<string[]>([])

const filters = ref({
  editorType: [] as string[],
})
const filterLabels: Record<string, string> = {
  editorType: 'Editor Type',
  pageType: 'Page Type',
}

const activeFilterEntries = computed(() => {
  const entries =
    Object.entries(filters.value)
      .filter(([, v]) => v.length > 0)
      .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value.join(', ')}` }))
  if (pageTypeFilter.value.length) {
    entries.unshift({ key: 'pageType', label: `Page Type: ${pageTypeFilter.value.join(', ')}` })
  }
  return entries
})
function removeFilter(key: string) {
  if (key === 'pageType') {
    pageTypeFilter.value = []
    return
  }
  ;(filters.value as any)[key] = []
}
function clearAllFilters() {
  pageTypeFilter.value = []
  filters.value = { editorType: [] }
}

const filteredPages = computed(() => {
  let rows = store.preferencePages
  if (filters.value.editorType.length) rows = rows.filter(p => filters.value.editorType.includes(editorLabel(p.editorType)))
  if (pageTypeFilter.value.length) rows = rows.filter(p => pageTypeFilter.value.includes(p.pageType))
  return rows
})

// ── New Page modal (UAT modal shape) / edit ───────────────────────────────
const formOpen = ref(false)
const editingId = ref<number | null>(null)
const name = ref('')
const pageType = ref<PreferencePageType>('Manage Subscriptions')
const editorType = ref<PreferenceEditorType>('Drag & Drop')
const redirect = ref('Default')

const canSave = computed(() => name.value.trim() !== '')

function openCreate() {
  editingId.value = null
  name.value = ''
  pageType.value = 'Manage Subscriptions'
  editorType.value = 'Drag & Drop'
  redirect.value = 'Default'
  formOpen.value = true
}

function openEdit(page: PreferencePage) {
  editingId.value = page.id
  name.value = page.name
  pageType.value = page.pageType
  editorType.value = page.editorType
  redirect.value = page.redirectUrl || 'Default'
  formOpen.value = true
}

function savePage() {
  if (!canSave.value) return
  const payload = {
    name: name.value.trim(),
    pageType: pageType.value,
    editorType: editorType.value,
    redirectUrl: redirect.value === 'Default' ? '' : redirect.value,
  }
  if (editingId.value !== null) {
    store.updatePreferencePage(editingId.value, payload)
    toast.success('Preference page updated')
  } else {
    store.addPreferencePage(payload)
    toast.success('Preference page created — its content opens in the page editor in production')
  }
  formOpen.value = false
}

// ── Preview (kebab) ───────────────────────────────────────────────────────
const previewPage = ref<PreferencePage | null>(null)
const previewOpen = ref(false)
function openPagePreview(page: PreferencePage) {
  previewPage.value = page
  previewOpen.value = true
}

// ── Delete (permanent in UAT) ─────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<PreferencePage | null>(null)
function askDelete(page: PreferencePage) {
  pendingDelete.value = page
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deletePreferencePage(pendingDelete.value.id)
    toast.success('Preference page permanently deleted')
  }
  pendingDelete.value = null
}

const toast = useToast()
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Preference Management"
      :subtitle="`${store.preferencePages.length} pages`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Page</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="pageTypeFilter"
        :quick-filter="pageTypeQuickFilter"
        v-model:search="search"
        title="Preference Pages"
        search-placeholder="Search pages"
        :active-filters="activeFilterEntries"
        :total-count="filteredPages.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <MpFormGrid>
            <v-select
              v-model="filters.editorType"
              label="Editor Type"
              :items="EDITOR_TYPES.map(e => e.label)"
              multiple
              chips
              closable-chips
              clearable
            />
          </MpFormGrid>
        </template>
      </MpDataTableToolbar>

      <v-data-table :headers="headers" :items="filteredPages" :search="search" hover density="comfortable" :items-per-page="10" fixed-header class="flex-grow-1">
        <template v-slot:item.name="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
        </template>
        <template v-slot:item.editorType="{ item }">{{ editorLabel(item.editorType) }}</template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Preference page actions" :itemLabel="item.name">
            <MpMenuItem icon="eye" title="Preview Preference Page" @click="openPagePreview(item)" />
            <MpMenuItem icon="pencil" title="Edit Preference Page" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete Preference Page Permanently" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="user-cog"
            :title="search || activeFilterEntries.length ? 'No pages match your filters' : 'No preference pages yet'"
            :description="search || activeFilterEntries.length ? 'Try a different search term or clear your filters.' : 'Create a page for subscribers to manage subscriptions, unsubscribe, or update their profile.'"
            :action-label="search || activeFilterEntries.length ? undefined : 'New Page'"
            :action-icon="search || activeFilterEntries.length ? undefined : 'plus'"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- New / edit modal (UAT uses a small centred modal) -->
    <MpDialog
      v-model="formOpen"
      :title="editingId !== null ? 'Edit Preference Page' : 'New Page'"
      size="sm"
      guarded
    >
      <v-text-field
        v-model="name"
        label="Name *"
        placeholder="e.g. Default Subscription Center"
        :rules="[v => !!v || 'Name is required']"
      />

      <v-select v-model="pageType" :items="PAGE_TYPES" label="Page Type *" />

      <div class="d-flex align-center ga-2">
        <v-select
          v-model="redirect"
          :items="REDIRECT_OPTIONS"
          label="Redirect *"
          hint="The page where the user is redirected after successfully submitting the form."
          persistent-hint
          class="flex-grow-1"
        />
        <v-tooltip text="Preview redirect page" location="bottom">
          <template #activator="{ props: tooltip }">
            <v-btn v-bind="tooltip" icon="eye" variant="text" aria-label="Preview redirect page" @click="toast.info('Production previews the redirect target here')" />
          </template>
        </v-tooltip>
      </div>

      <MpFormField label="Select Editor *">
        <template #default="{ labelId }">
          <v-radio-group v-model="editorType" :aria-labelledby="labelId" hide-details>
            <v-radio v-for="e in EDITOR_TYPES" :key="e.value" :label="e.label" :value="e.value" />
          </v-radio-group>
        </template>
      </MpFormField>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="formOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="savePage">
          {{ editingId !== null ? 'Save Changes' : 'Create' }}
        </v-btn>
      </template>
    </MpDialog>

    <!-- Preview (mock render; production shows the live hosted page) -->
    <MpDialog v-model="previewOpen" :title="previewPage?.name ?? 'Preview'" :subtitle="previewPage?.pageType" size="lg">
      <div class="pref-preview">
        <h3 class="pref-preview__title">Email Preferences</h3>
        <p class="pref-preview__copy">
          This is a sandbox rendering of the hosted “{{ previewPage?.pageType }}” page built with
          the {{ previewPage ? editorLabel(previewPage.editorType) : '' }} editor.
        </p>
        <template v-if="previewPage?.pageType === 'Manage Subscriptions'">
          <v-checkbox density="compact" hide-details label="Weekly newsletter" model-value readonly />
          <v-checkbox density="compact" hide-details label="Product announcements" model-value readonly />
          <v-checkbox density="compact" hide-details label="Promotions and offers" readonly />
        </template>
        <p v-else class="pref-preview__copy">
          {{ previewPage?.pageType === 'One Click Unsubscribe'
            ? 'You have been unsubscribed. You can rejoin at any time.'
            : 'Please confirm your choice to continue.' }}
        </p>
        <v-btn color="primary" variant="flat" class="text-none" disabled>Save Preferences</v-btn>
      </div>
    </MpDialog>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete preference page permanently?"
      :message="`“${pendingDelete?.name}” will be permanently deleted — this cannot be undone. Footers referencing it will fall back to the default page.`"
      confirm-label="Delete Permanently"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.pref-preview {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  padding: var(--mp-space-24);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  max-width: var(--mp-component-state-measureWide);
  margin-inline: auto;
}

.pref-preview__title {
  font-size: var(--mp-fontSize-18);
  font-weight: var(--mp-fontWeight-semibold);
}

.pref-preview__copy {
  color: var(--on-surface-muted);
  margin: 0;
}
</style>
