<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useLandingPagesStore } from '@/stores/useLandingPages'
import type { LandingPage } from '@/stores/useLandingPages'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)

const lpStore = useLandingPagesStore()
const { pages } = storeToRefs(lpStore)

const search = ref('')

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Editor Type', key: 'editorType' },
  { title: 'Domain / URL', key: 'url' },
  { title: 'Status', key: 'pageStatus' },
  { title: 'Domain', key: 'domainStatus' },
  { title: 'Publish At', key: 'publishAt' },
  { title: 'Expire At', key: 'expireAt' },
  { title: 'Updated At', key: 'updatedAt' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

/** Draft/Published/Expired lifecycle status — derived, since publishStatus + expireAt
 * were previously left off the table and conflated with the domain-verification chip. */
function pageStatus(page: LandingPage): 'Draft' | 'Published' | 'Expired' {
  if (page.publishStatus === 'draft') return 'Draft'
  if (page.expireAt) {
    const expiry = Date.parse(page.expireAt)
    if (!Number.isNaN(expiry) && expiry < Date.now()) return 'Expired'
  }
  return 'Published'
}

const filters = ref({
  status: [] as string[],
  editorType: [] as string[],
})

const filterLabels: Record<string, string> = {
  status: 'Domain',
  editorType: 'Editor Type',
}

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v.length > 0)
    .map(([key, value]) => ({
      key,
      label: `${filterLabels[key]}: ${value.join(', ')}`,
    })),
)

function removeFilter(key: string) {
  (filters.value as any)[key] = []
}
function clearAllFilters() {
  filters.value.status = []
  filters.value.editorType = []
}

const editorTypeLabel: Record<LandingPage['editorType'], string> = { dnd: 'Drag & Drop', wysiwyg: 'WYSIWYG' }

const items = computed(() =>
  pages.value.filter(p =>
    (filters.value.status.length === 0 || filters.value.status.includes(p.status)) &&
    (filters.value.editorType.length === 0 || filters.value.editorType.includes(p.editorType)),
  ),
)

function editPage(page: LandingPage) {
  router.push({ name: 'LandingPageEditor', params: { accountId: accountId.value, id: String(page.id) } })
}
function previewPage(page: LandingPage) {
  router.push({ name: 'LandingPageEditor', params: { accountId: accountId.value, id: String(page.id) }, query: { preview: '1' } })
}
function verifyDomain(page: LandingPage) { lpStore.verifyDomain(page.id) }
function duplicate(page: LandingPage) { lpStore.duplicate(page.id) }

const confirmDeleteId = ref<number | null>(null)
function askDelete(page: LandingPage) { confirmDeleteId.value = page.id }
function confirmDelete() {
  if (confirmDeleteId.value !== null) lpStore.remove([confirmDeleteId.value])
  confirmDeleteId.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Landing Pages"
      :subtitle="`${pages.length} pages`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" :to="{ name: 'LandingPageTemplates', params: { accountId } }">New Page</v-btn>
      </template>
    </MpPageHeader>

    <v-card v-if="!pages.length" variant="flat" border rounded="lg">
      <MpEmptyState
        icon="layout-template"
        title="No landing pages yet"
        description="Create a landing page from a template or start from scratch."
        action-label="New Page"
        action-icon="plus"
        @action="router.push({ name: 'LandingPageTemplates', params: { accountId } })"
      />
    </v-card>

    <v-card v-else variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Pages"
        search-placeholder="Search pages..."
        :active-filters="activeFilterEntries"
        :total-count="items.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filters.status"
              label="Domain"
              :items="['Verified', 'Unverified']"
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
              v-model="filters.editorType"
              label="Editor Type"
              :items="[{ title: 'Drag & Drop', value: 'dnd' }, { title: 'WYSIWYG', value: 'wysiwyg' }]"
              multiple
              chips
              closable-chips
              clearable
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3"
            />
          </div>
        </template>
      </MpDataTableToolbar>

      <MpEmptyState
        v-if="!items.length"
        icon="search-x"
        title="No pages match your filters"
        description="Try a different search term or clear your filters."
      />
      <v-data-table v-else :headers="headers" :items="items" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template #item.name="{ item }">
          <button type="button" class="lp-name-link text-body-2 font-weight-medium" @click="editPage(item)">{{ item.name }}</button>
        </template>
        <template #item.editorType="{ item }">
          <v-chip size="x-small" variant="outlined" rounded="lg">{{ editorTypeLabel[item.editorType as LandingPage['editorType']] }}</v-chip>
        </template>
        <template #item.url="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.url }}</span>
        </template>
        <template #item.pageStatus="{ item }">
          <MpStatusChip :status="pageStatus(item)" type="general" size="x-small" />
        </template>
        <template #item.domainStatus="{ item }">
          <MpStatusChip :status="item.status" type="general" size="x-small" />
        </template>
        <template #item.publishAt="{ item }">
          <span class="text-body-2">{{ item.publishAt || '—' }}</span>
        </template>
        <template #item.expireAt="{ item }">
          <span class="text-body-2">{{ item.expireAt || '—' }}</span>
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu :ariaLabel="`${item.name} actions`">
            <v-list-item prepend-icon="pencil" rounded="lg" @click="editPage(item)">Edit</v-list-item>
            <v-list-item prepend-icon="shield-check" rounded="lg" :disabled="item.status === 'Verified'" @click="verifyDomain(item)">Verify Domain</v-list-item>
            <v-list-item prepend-icon="eye" rounded="lg" @click="previewPage(item)">Preview</v-list-item>
            <v-list-item prepend-icon="copy" rounded="lg" @click="duplicate(item)">Duplicate</v-list-item>
            <v-list-item prepend-icon="trash-2" rounded="lg" class="text-error mt-1" @click="askDelete(item)">Delete</v-list-item>
          </MpRowActionsMenu>
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      :model-value="confirmDeleteId !== null"
      title="Delete landing page?"
      message="This will permanently remove this page. This can't be undone."
      confirm-label="Delete"
      danger
      @update:model-value="confirmDeleteId = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.gap-5 { gap: 24px; }
.lp-name-link {
  background: none;
  border: none;
  padding: 0;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  font: inherit;
  text-align: left;
}
.lp-name-link:hover { text-decoration: underline; }
</style>
