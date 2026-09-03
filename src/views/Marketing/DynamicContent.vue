<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketingAssetsStore, type DynamicContentItem } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: /accounts/:id/dynamic_contents — the dynamic content list.
// VIEW ARCHIVES beside the title, NEW DYNAMIC CONTENT as the primary CTA,
// and a two-item row kebab (Archive / Edit). Editing happens in the
// full-page editor at /dynamic_contents/:id/edit.

const store = useMarketingAssetsStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const search = ref('')

const accountId = computed(() => route.params.accountId as string)

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Number of Segments', key: 'segmentCount', align: 'end' as const },
  { title: 'Created At', key: 'createdAt', sortable: true },
  { title: 'Updated At', key: 'updatedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
]

const rows = computed(() =>
  store.dynamicContents.filter(d => !d.archived).map(d => ({ ...d, segmentCount: d.rules.length })),
)

function openEditor(item?: DynamicContentItem) {
  router.push(item
    ? { name: 'DynamicContentEdit', params: { accountId: accountId.value, id: item.id } }
    : { name: 'DynamicContentCreate', params: { accountId: accountId.value } })
}

function viewArchives() {
  router.push({ name: 'ContentArchives', params: { accountId: accountId.value }, query: { filter: 'dynamic_contents' } })
}

// ── Archive (UAT's destructive-lite action — reversible via Archives) ──────
const confirmArchive = ref(false)
const pendingArchive = ref<DynamicContentItem | null>(null)
function askArchive(item: DynamicContentItem) {
  pendingArchive.value = item
  confirmArchive.value = true
}
function doArchive() {
  if (pendingArchive.value) {
    store.setDynamicContentArchived(pendingArchive.value.id, true)
    toast.success(`“${pendingArchive.value.name}” archived`)
  }
  pendingArchive.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Dynamic Content"
      :subtitle="`${rows.length} dynamic content blocks`"
    >
      <template #actions>
        <v-btn variant="text" prepend-icon="archive" class="text-none" @click="viewArchives">View Archives</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openEditor()">New Dynamic Content</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Dynamic content"
        search-placeholder="Search dynamic content"
        :total-count="rows.length"
      />

      <v-data-table :headers="headers" :items="rows" :search="search" hover density="comfortable" :items-per-page="10" fixed-header class="flex-grow-1">
        <template v-slot:item.name="{ item }">
          <button type="button" class="dc-name" @click="openEditor(item)">{{ item.name }}</button>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Dynamic content actions" :itemLabel="item.name">
            <MpMenuItem icon="archive" title="Archive Dynamic Content" @click="askArchive(item)" />
            <MpMenuItem icon="pencil" title="Edit Dynamic Content" @click="openEditor(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="shuffle"
            :title="search ? 'No dynamic content matches your search' : 'No dynamic content yet'"
            :description="search ? 'Try a different search term.' : 'Show different email content to different segments from a single block.'"
            :action-label="!search ? 'New Dynamic Content' : undefined"
            action-icon="plus"
            @action="openEditor()"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="confirmArchive"
      title="Archive dynamic content?"
      :message="`“${pendingArchive?.name}” moves to Archives and out of this list. You can restore it from Archives at any time.`"
      confirm-label="Archive"
      @confirm="doArchive"
    />
  </div>
</template>

<style scoped>
.dc-name {
  color: var(--accent-default);
  font-weight: var(--mp-fontWeight-medium);
  text-align: left;
}

.dc-name:hover,
.dc-name:focus-visible {
  text-decoration: underline;
}
</style>
