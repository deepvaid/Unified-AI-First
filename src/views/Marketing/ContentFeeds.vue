<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketingAssetsStore, type ContentFeed, type FeedType } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import { useToast } from '@/composables/useToast'

const store = useMarketingAssetsStore()
const search = ref('')

const DAYS = ['Everyday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

// ── Create / edit drawer ─────────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const feedType = ref<FeedType>('Single')
const name = ref('')
const url = ref('')
const updateDay = ref('Everyday')
const updateHour = ref('06:00')

const canSave = computed(() => name.value.trim() !== '' && url.value.trim() !== '')

function openCreate() {
  editingId.value = null
  feedType.value = 'Single'
  name.value = ''
  url.value = ''
  updateDay.value = 'Everyday'
  updateHour.value = '06:00'
  drawer.value = true
}

function openEdit(feed: ContentFeed) {
  editingId.value = feed.id
  feedType.value = feed.feedType
  name.value = feed.name
  url.value = feed.url
  updateDay.value = feed.updateDay
  updateHour.value = feed.updateHour
  drawer.value = true
}

function saveFeed() {
  if (!canSave.value) return
  const payload = { name: name.value.trim(), feedType: feedType.value, url: url.value.trim(), updateDay: updateDay.value, updateHour: updateHour.value }
  if (editingId.value !== null) {
    store.updateFeed(editingId.value, payload)
    notify('Feed updated')
  } else {
    store.addFeed(payload)
    notify('Feed created')
  }
  drawer.value = false
}

// ── Delete ────────────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<ContentFeed | null>(null)
function askDelete(feed: ContentFeed) {
  pendingDelete.value = feed
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deleteFeed(pendingDelete.value.id)
    notify('Feed deleted')
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
      title="Content Feeds"
      :subtitle="`${store.feeds.length} feeds configured`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Feed</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Feeds"
        search-placeholder="Search feeds..."
        :total-count="store.feeds.length"
      />

      <v-data-table :headers="headers" :items="store.feeds" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center ga-2">
            <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
            <v-chip size="x-small" variant="tonal" color="default">{{ item.feedType }}</v-chip>
          </div>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Feed actions" :itemLabel="item.name">
            <MpMenuItem icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="rss"
            :title="search ? 'No feeds match your search' : 'No content feeds yet'"
            :description="search ? 'Try a different search term.' : 'Stream RSS, JSON, or product feeds into your email content.'"
            :action-label="!search ? 'New Feed' : undefined"
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
      :title="editingId !== null ? 'Edit Feed' : 'New Feed'"
    >
      <MpFormGrid :cols="2">
        <MpFormField label="Feed type" class="mp-form-grid__full">
          <template #default="{ labelId }">
            <v-radio-group v-model="feedType" inline :aria-labelledby="labelId">
              <v-radio label="Single" value="Single" />
              <v-radio label="Merge" value="Merge" />
            </v-radio-group>
          </template>
        </MpFormField>

        <v-text-field
          v-model="name"
          class="mp-form-grid__full"
          label="Name"
          placeholder="e.g. Latest Blog Posts"
          :rules="[v => !!v || 'Name is required']"
        />

        <MpFormSection
          title="Update on"
          description="Journey and transactional emails pull this feed live; campaign sends use the version cached at this scheduled time."
        />
        <v-select v-model="updateDay" :items="DAYS" label="Day of week" />
        <v-select v-model="updateHour" :items="HOURS" label="Hour" />

        <v-text-field
          v-model="url"
          class="mp-form-grid__full"
          label="URL"
          placeholder="https://example.com/feed.xml"
          hint="RSS, JSON, or product feed endpoint"
          persistent-hint
          :rules="[v => !!v || 'URL is required']"
        />
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="saveFeed">
          {{ editingId !== null ? 'Save Changes' : 'Create Feed' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete feed?"
      :message="`“${pendingDelete?.name}” will be permanently deleted and stop updating any content that references it.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>
