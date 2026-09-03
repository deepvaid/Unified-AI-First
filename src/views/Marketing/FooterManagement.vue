<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMarketingAssetsStore, type FooterItem } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: /accounts/:id/footers — footer list with an editor-type filter,
// a Default chip beside the default footer's name, and a kebab of
// Set as Default / Preview Footer / Edit Footer / Delete Footer.
// New Footer is the two-step wizard at /footers/new.

const store = useMarketingAssetsStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const search = ref('')

const accountId = computed(() => route.params.accountId as string)

// Editor type is UAT's one filter — promoted to an exclusive toolbar pill.
const editorFilter = ref<string[]>([])
const editorQuickFilter = {
  key: 'editorType',
  label: 'Editor type',
  multiple: false,
  options: ['Drag & Drop', 'WYSIWYG'].map(v => ({ label: v, value: v })),
}

const filteredFooters = computed(() => {
  const type = editorFilter.value[0]
  return type ? store.footers.filter(f => f.editorType === type) : store.footers
})

const activeFilterEntries = computed(() =>
  editorFilter.value.length ? [{ key: 'editorType', label: `Editor type: ${editorFilter.value[0]}` }] : [],
)

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Editor Type', key: 'editorType' },
  { title: 'Updated At', key: 'updatedAt', sortable: true },
  { title: 'Created At', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

// ── Row actions ───────────────────────────────────────────────────────────
function setDefault(footer: FooterItem) {
  store.setDefaultFooter(footer.id)
  toast.success(`“${footer.name}” is now the default footer`)
}

function openPreview(footer: FooterItem) {
  router.push({ name: 'FooterPreview', params: { accountId: accountId.value, id: footer.id } })
}

function openDetail(footer: FooterItem) {
  router.push({ name: 'FooterDetail', params: { accountId: accountId.value, id: footer.id } })
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
    toast.success('Footer deleted')
  }
  pendingDelete.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Footer Management"
      :subtitle="`${store.footers.length} footers`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" :to="`/accounts/${accountId}/footers/new`">New Footer</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:quick-filter-value="editorFilter"
        :quick-filter="editorQuickFilter"
        title="Footers"
        search-placeholder="Search footers"
        :active-filters="activeFilterEntries"
        :total-count="filteredFooters.length"
        @remove-filter="editorFilter = []"
        @clear-filters="editorFilter = []"
      />

      <v-data-table :headers="headers" :items="filteredFooters" :search="search" hover density="comfortable" :items-per-page="10" fixed-header class="flex-grow-1">
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center ga-2">
            <router-link :to="{ name: 'FooterDetail', params: { accountId, id: item.id } }" class="footer-link">
              {{ item.name }}
            </router-link>
            <v-chip v-if="item.isDefault" color="primary" size="small" variant="tonal">Default</v-chip>
          </div>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Footer actions" :itemLabel="item.name">
            <MpMenuItem v-if="!item.isDefault" icon="check" title="Set as Default" @click="setDefault(item)" />
            <MpMenuItem icon="eye" title="Preview Footer" @click="openPreview(item)" />
            <MpMenuItem icon="pencil" title="Edit Footer" @click="openDetail(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete Footer" danger :disabled="item.isDefault" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="panel-bottom"
            :title="search || editorFilter.length ? 'No footers match your filters' : 'No footers yet'"
            :description="search || editorFilter.length ? 'Try a different search or clear the editor filter.' : 'Standardize footers across brands with unsubscribe and compliance links.'"
            :action-label="!search && !editorFilter.length ? 'New Footer' : undefined"
            action-icon="plus"
            @action="router.push(`/accounts/${accountId}/footers/new`)"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete footer?"
      :message="`“${pendingDelete?.name}” will be permanently deleted. Campaigns using it will fall back to the default footer.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.footer-link {
  color: var(--accent-default);
  text-decoration: none;
  font-weight: var(--mp-fontWeight-medium);
}

.footer-link:hover,
.footer-link:focus-visible {
  text-decoration: underline;
}
</style>
