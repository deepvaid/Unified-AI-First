<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketingAssetsStore, type ContentFeed, type ContentFeedSource, type FeedType } from '@/stores/useMarketingAssets'
import { useFoldersStore } from '@/stores/useFolders'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFolderSelect from '@/components/MpFolderSelect.vue'
import MpManageFoldersDrawer from '@/components/MpManageFoldersDrawer.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpDialog from '@/components/MpDialog.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: /accounts/:id/content_feeds — feed list whose one row action is
// Edit; Single feeds edit one URL, Merge feeds edit key → URL pairs. UAT's
// drag-to-folder panel becomes the app's folder select + a Folder field in the
// drawer, and the undiscoverable single-feed create path becomes an explicit
// type choice (both flagged in IMPROVEMENTS.md).

const store = useMarketingAssetsStore()
const foldersStore = useFoldersStore()
const toast = useToast()
const search = ref('')

const DAYS = ['Everyday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HOURS = Array.from({ length: 24 }, (_, h) => {
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${String(hour12).padStart(2, '0')}:00 ${h < 12 ? 'AM' : 'PM'}`
})

// ── Folders ───────────────────────────────────────────────────────────────
const feedFolders = computed(() => foldersStore.foldersByScope('content_feeds'))
const selectedFolderId = ref<string | null>(null)
const manageFoldersOpen = ref(false)

const folderCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const folder of feedFolders.value) {
    const ids = [folder.id, ...foldersStore.childrenOf(folder.id).map(f => f.id)]
    counts[folder.id] = store.feeds.filter(f => f.folderId && ids.includes(f.folderId)).length
  }
  return counts
})

const visibleFeeds = computed(() => {
  if (!selectedFolderId.value) return store.feeds
  const ids = [selectedFolderId.value, ...foldersStore.childrenOf(selectedFolderId.value).map(f => f.id)]
  return store.feeds.filter(f => f.folderId && ids.includes(f.folderId))
})

const activeFilterEntries = computed(() => {
  const folder = foldersStore.getFolder(selectedFolderId.value)
  return folder ? [{ key: 'folder', label: `Folder: ${folder.name}` }] : []
})

function removeFilter(key: string) {
  if (key === 'folder') selectedFolderId.value = null
}

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Updated At', key: 'updatedAt', sortable: true },
  { title: 'Created At', key: 'createdAt', sortable: true },
  { title: 'Action', key: 'actions', sortable: false, align: 'end' as const },
]

// ── Create / edit drawer ─────────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const feedType = ref<FeedType>('Single')
const name = ref('')
const url = ref('')
const sources = ref<ContentFeedSource[]>([{ key: '', url: '' }])
const folderId = ref<string | null>(null)
const updateDay = ref('Everyday')
const updateHour = ref('12:00 AM')

const drawerTitle = computed(() => {
  if (editingId.value === null) return 'New Feed'
  return feedType.value === 'Merge' ? 'Edit Merge Feed' : 'Edit Single Feed'
})

const canSave = computed(() => {
  if (name.value.trim() === '') return false
  if (feedType.value === 'Single') return url.value.trim() !== ''
  return sources.value.length > 0 && sources.value.every(s => s.key.trim() !== '' && s.url.trim() !== '')
})

function openCreate() {
  editingId.value = null
  feedType.value = 'Single'
  name.value = ''
  url.value = ''
  sources.value = [{ key: '', url: '' }]
  folderId.value = selectedFolderId.value
  updateDay.value = 'Everyday'
  updateHour.value = '12:00 AM'
  drawer.value = true
}

function openEdit(feed: ContentFeed) {
  editingId.value = feed.id
  feedType.value = feed.feedType
  name.value = feed.name
  url.value = feed.url
  sources.value = feed.sources.length ? feed.sources.map(s => ({ ...s })) : [{ key: '', url: '' }]
  folderId.value = feed.folderId
  updateDay.value = feed.updateDay
  updateHour.value = feed.updateHour
  drawer.value = true
}

function addSource() {
  sources.value.push({ key: '', url: '' })
}

function removeSource(index: number) {
  sources.value.splice(index, 1)
}

function saveFeed() {
  if (!canSave.value) return
  const merge = feedType.value === 'Merge'
  const cleanSources = merge ? sources.value.map(s => ({ key: s.key.trim(), url: s.url.trim() })) : []
  const payload = {
    name: name.value.trim(),
    feedType: feedType.value,
    url: merge ? (cleanSources[0]?.url ?? '') : url.value.trim(),
    sources: cleanSources,
    folderId: folderId.value,
    updateDay: updateDay.value,
    updateHour: updateHour.value,
  }
  if (editingId.value !== null) {
    store.updateFeed(editingId.value, payload)
    toast.success('Feed updated')
  } else {
    store.addFeed(payload)
    toast.success('Feed created')
  }
  drawer.value = false
}

// ── URL preview (the single-feed 👁 in UAT) ───────────────────────────────
const previewOpen = ref(false)
const previewUrl = ref('')
function openPreview(target: string) {
  previewUrl.value = target
  previewOpen.value = true
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Content Feeds"
      :subtitle="`${store.feeds.length} feeds configured`"
    >
      <template #actions>
        <v-btn variant="text" prepend-icon="folder" class="text-none" @click="manageFoldersOpen = true">Manage Folders</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Feed</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Feeds"
        search-placeholder="Search feeds"
        :total-count="visibleFeeds.length"
        :active-filters="activeFilterEntries"
        @remove-filter="removeFilter"
        @clear-filters="selectedFolderId = null"
      >
        <template #actions>
          <MpFolderSelect
            v-model="selectedFolderId"
            :folders="feedFolders"
            :counts="folderCounts"
            :total-count="store.feeds.length"
            @manage="manageFoldersOpen = true"
          />
        </template>
      </MpDataTableToolbar>

      <v-data-table :headers="headers" :items="visibleFeeds" :search="search" hover density="comfortable" :items-per-page="10" fixed-header class="flex-grow-1">
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center ga-2">
            <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
            <MpStatusChip :status="item.feedType" type="general" size="sm" />
          </div>
          <div v-if="item.folderId" class="text-caption text-medium-emphasis">
            {{ foldersStore.getFolder(item.folderId)?.name }}
          </div>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-tooltip text="Edit feed" location="bottom">
            <template #activator="{ props: tooltip }">
              <v-btn
                v-bind="tooltip"
                icon="pencil"
                variant="text"
                size="small"
                :aria-label="`Edit ${item.name}`"
                @click="openEdit(item)"
              />
            </template>
          </v-tooltip>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="rss"
            :title="search || selectedFolderId ? 'No feeds match your filters' : 'No content feeds yet'"
            :description="search || selectedFolderId ? 'Try a different search or clear the folder filter.' : 'Stream RSS, JSON, or product feeds into your email content.'"
            :action-label="!search && !selectedFolderId ? 'New Feed' : undefined"
            action-icon="plus"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit drawer -->
    <MpFormDrawer v-model="drawer" :title="drawerTitle" size="md" guarded>
      <MpFormGrid :cols="2">
        <MpFormField v-if="editingId === null" label="Feed type" class="mp-form-grid__full">
          <template #default="{ labelId }">
            <v-radio-group v-model="feedType" inline :aria-labelledby="labelId" hide-details>
              <v-radio label="Single" value="Single" />
              <v-radio label="Merge" value="Merge" />
            </v-radio-group>
          </template>
        </MpFormField>

        <v-text-field
          v-model="name"
          class="mp-form-grid__full"
          label="Name *"
          placeholder="e.g. Latest Blog Posts"
          :rules="[v => !!v || 'Name is required']"
        />

        <MpFormSection title="Update Content Feed On" />
        <v-select v-model="updateDay" :items="DAYS" label="Day of the Week" />
        <v-select v-model="updateHour" :items="HOURS" label="Hour of the Day" />

        <template v-if="feedType === 'Single'">
          <div class="mp-form-grid__full mp-form-grid__trailing">
            <v-text-field
              v-model="url"
              label="URL *"
              placeholder="https://example.com/feed.xml"
              :rules="[v => !!v || 'URL is required']"
            />
            <v-btn
              icon="eye"
              variant="text"
              aria-label="Preview feed"
              :disabled="!url.trim()"
              @click="openPreview(url)"
            />
          </div>
        </template>

        <template v-else>
          <MpFormSection
            title="Feeds"
            description="Each key becomes a merge handle your content references; the URL is the feed it pulls."
          />
          <template v-for="(source, i) in sources" :key="i">
            <v-text-field
              v-model="source.key"
              label="Key *"
              placeholder="e.g. products"
              :rules="[v => !!v || 'Key is required']"
            />
            <div class="mp-form-grid__trailing">
              <v-text-field
                v-model="source.url"
                label="URL *"
                placeholder="https://example.com/feed.xml"
                :rules="[v => !!v || 'URL is required']"
              />
              <v-btn
                icon="trash-2"
                variant="text"
                :aria-label="`Remove feed ${i + 1}`"
                :disabled="sources.length === 1"
                @click="removeSource(i)"
              />
            </div>
          </template>
          <div class="mp-form-grid__full">
            <v-btn variant="text" color="primary" prepend-icon="plus" class="text-none" @click="addSource">Add feed</v-btn>
          </div>
        </template>

        <v-select
          v-model="folderId"
          class="mp-form-grid__full"
          label="Folder"
          :items="[{ title: 'No folder', value: null }, ...feedFolders.map(f => ({ title: f.name, value: f.id }))]"
          clearable
        />

        <MpAlert tone="info" class="mp-form-grid__full" :dismissible="false">
          For Journey campaigns and Transactional campaigns only — the content feed is pulled
          from the specified URL on the update schedule above. Normal, batch and recurring
          campaigns pull the feed at the campaign's scheduled send date and time.
        </MpAlert>
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="saveFeed">
          {{ editingId !== null ? 'Save Changes' : 'Create Feed' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <!-- Feed URL preview (mock — production fetches the live feed) -->
    <MpDialog v-model="previewOpen" title="Feed Preview" size="sm">
      <p class="text-body-2">
        Production fetches and renders the live feed. This sandbox previews the endpoint only:
      </p>
      <code class="feed-preview-url">{{ previewUrl }}</code>
    </MpDialog>

    <MpManageFoldersDrawer
      v-model="manageFoldersOpen"
      scope="content_feeds"
      :counts="folderCounts"
    />
  </div>
</template>

<style scoped>
.feed-preview-url {
  display: block;
  padding: var(--mp-space-10) var(--mp-space-12);
  border-radius: var(--mp-radius-8);
  background: var(--surface-secondary);
  word-break: break-all;
}
</style>
