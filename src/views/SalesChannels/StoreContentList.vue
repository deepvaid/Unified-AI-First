<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreContentStore, type ContentEntry, type ContentKind } from '@/stores/useStoreContent'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'

// Shared list view for store editor Pages and Blogs — the legacy sections are
// identical tables; `kind` comes from the route meta.
const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const contentStore = useStoreContentStore()

const kind = computed<ContentKind>(() => (route.meta.contentKind === 'blog' ? 'blog' : 'page'))
const isBlog = computed(() => kind.value === 'blog')

const copy = computed(() =>
  isBlog.value
    ? {
        title: 'Blogs',
        singular: 'post',
        createLabel: 'New post',
        icon: 'rss',
        emptyTitle: 'No blog posts yet',
        emptyDescription: 'Share guides, stories, and product news to bring shoppers back to your store.',
      }
    : {
        title: 'Pages',
        singular: 'page',
        createLabel: 'New page',
        icon: 'file-text',
        emptyTitle: 'No pages yet',
        emptyDescription: 'Create content pages like About, FAQ, or policies and link them from your navigation.',
      },
)

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))

const search = ref('')

const filteredEntries = computed(() => {
  const list = contentStore.entriesForChannel(channelId.value, kind.value)
  const term = search.value.trim().toLowerCase()
  if (!term) return list
  return list.filter((entry) => entry.title.toLowerCase().includes(term))
})

// computed: the same component instance serves /pages and /blogs routes
const headers = computed(() => [
  { title: isBlog.value ? 'Post' : 'Page', key: 'title', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Published', key: 'publishedAt', sortable: true },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
])

const createRoute = computed(() => ({
  name: isBlog.value ? 'StoreBlogCreate' : 'StorePageCreate',
  params: { accountId: accountId.value, channelId: channelId.value },
}))

function openEditor(entry: ContentEntry) {
  router.push({
    name: isBlog.value ? 'StoreBlogEdit' : 'StorePageEdit',
    params: { accountId: accountId.value, channelId: channelId.value, entryId: entry.id },
  })
}

function toggleStatus(entry: ContentEntry) {
  contentStore.setEntryStatus(entry.id, entry.status === 'Active' ? 'Inactive' : 'Active')
}

// ── Delete flow ──────────────────────────────────────────────────
const deleteDialog = ref(false)
const entryPendingDelete = ref<ContentEntry | null>(null)

function askDelete(entry: ContentEntry) {
  entryPendingDelete.value = entry
  deleteDialog.value = true
}

function confirmDelete() {
  if (entryPendingDelete.value) contentStore.deleteEntry(entryPendingDelete.value.id)
  entryPendingDelete.value = null
}

// ── Blog SEO settings drawer (blog list only, per legacy) ────────
const seoDrawer = ref(false)
const seoForm = ref({ title: '', metaDescription: '' })

function openSeoDrawer() {
  seoForm.value = { ...contentStore.blogSeo(channelId.value) }
  seoDrawer.value = true
}

function saveSeo() {
  contentStore.saveBlogSeo(channelId.value, seoForm.value)
  seoDrawer.value = false
}
</script>

<template>
  <div v-if="!channel" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="420">
      <MpEmptyState
        icon="store"
        title="Sales channel not found"
        description="The store you're trying to manage doesn't exist or was removed."
        action-label="Back to sales channels"
        @action="router.push({ name: 'SalesChannels', params: { accountId } })"
      />
    </v-card>
  </div>

  <div v-else class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      :title="copy.title"
      :subtitle="`Storefront ${copy.title.toLowerCase()} for ${channel.name}`"
    >
      <template #actions>
        <v-btn v-if="isBlog" variant="outlined" prepend-icon="settings" class="text-none" @click="openSeoDrawer">SEO settings</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" :to="createRoute">{{ copy.createLabel }}</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        :title="copy.title"
        :search-placeholder="`Search ${copy.title.toLowerCase()}…`"
        :total-count="filteredEntries.length"
      />

      <v-data-table
        :headers="headers"
        :items="filteredEntries"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.title="{ item }">
          <div class="d-flex align-center gap-2 py-1">
            <v-avatar size="30" rounded="lg" :color="item.imageName ? 'success' : 'primary'" variant="tonal">
              <v-icon size="16">{{ item.imageName ? 'image' : copy.icon }}</v-icon>
            </v-avatar>
            <div class="min-width-0">
              <a class="text-body-2 font-weight-bold text-primary cursor-pointer" @click="openEditor(item)">{{ item.title }}</a>
              <div class="text-caption text-medium-emphasis">{{ item.template }} template{{ item.imageName ? ` · ${item.imageName}` : '' }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>

        <template v-slot:item.publishedAt="{ item }">
          <span class="text-body-2">{{ item.publishedAt || '—' }}</span>
        </template>

        <template v-slot:item.updatedAt="{ item }">
          <span class="text-body-2">{{ item.updatedAt }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu :ariaLabel="isBlog ? 'Post actions' : 'Page actions'" :itemLabel="item.title">
            <MpMenuItem :title="item.status === 'Active' ? 'Set inactive' : 'Set active'" :icon="item.status === 'Active' ? 'eye-off' : 'eye'" @click="toggleStatus(item)" />
            <MpMenuItem title="Edit" icon="pencil" @click="openEditor(item)" />
            <v-divider class="my-1" />
            <MpMenuItem title="Delete" icon="trash-2" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            :icon="copy.icon"
            :title="copy.emptyTitle"
            :description="copy.emptyDescription"
            :action-label="copy.createLabel"
            action-icon="plus"
            @action="router.push(createRoute)"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="deleteDialog"
      :title="`Delete ${copy.singular}?`"
      :message="entryPendingDelete ? `“${entryPendingDelete.title}” will be removed from your storefront. Links pointing to it will stop working.` : ''"
      :confirm-label="`Delete ${copy.singular}`"
      danger
      @confirm="confirmDelete"
    />

    <MpFormDrawer v-if="isBlog" v-model="seoDrawer" title="Blog SEO settings" subtitle="How your blog index appears in search results">
      <MpFormGrid>
        <v-text-field v-model="seoForm.title" label="Title" counter="60" />
        <v-textarea v-model="seoForm.metaDescription" label="Meta description" rows="3" counter="160" />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="seoDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveSeo">Save</v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.min-width-0 {
  min-width: 0;
}
</style>
