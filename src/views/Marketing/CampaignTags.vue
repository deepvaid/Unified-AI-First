<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketingAssetsStore, type CampaignTag } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'

const store = useMarketingAssetsStore()
const search = ref('')

const headers = [
  { title: 'Tag Name', key: 'name', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true, hideBelow: 'sm' as const },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]
const { visibleHeaders } = useResponsiveTableHeaders(headers)

// ── Create / rename drawer ───────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const tagName = ref('')
const canSave = computed(() => tagName.value.trim() !== '')

function openCreate() {
  editingId.value = null
  tagName.value = ''
  drawer.value = true
}

function openEdit(tag: CampaignTag) {
  editingId.value = tag.id
  tagName.value = tag.name
  drawer.value = true
}

function saveTag() {
  if (!canSave.value) return
  if (editingId.value !== null) {
    store.renameTag(editingId.value, tagName.value.trim())
    notify('Tag updated')
  } else {
    store.addTag(tagName.value.trim())
    notify('Tag created')
  }
  drawer.value = false
}

// ── Import tags dialog ───────────────────────────────────────────────────
const importDialog = ref(false)
const importText = ref('')
const importPreview = computed(() =>
  importText.value.split(/[\n,]/).map(s => s.trim()).filter(Boolean)
)

function importTags() {
  if (!importPreview.value.length) return
  store.addTags(importPreview.value)
  notify(`${importPreview.value.length} tag${importPreview.value.length === 1 ? '' : 's'} imported`)
  importText.value = ''
  importDialog.value = false
}

// ── Delete ────────────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<CampaignTag | null>(null)
function askDelete(tag: CampaignTag) {
  pendingDelete.value = tag
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deleteTag(pendingDelete.value.id)
    notify('Tag deleted')
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
      title="Campaign Tags"
      :subtitle="`${store.tags.length} tags`"
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="upload" class="text-none" @click="importDialog = true">Import Tags</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Tag</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Tags"
        search-placeholder="Search tags..."
        :total-count="store.tags.length"
      />

      <v-data-table :headers="visibleHeaders" :items="store.tags" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.name="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Tag actions" :itemLabel="item.name">
            <MpMenuItem icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="tag"
            :title="search ? 'No tags match your search' : 'No campaign tags yet'"
            :description="search ? 'Try a different search term.' : 'Create tags to group and filter your campaigns.'"
            :action-label="!search ? 'New Tag' : undefined"
            action-icon="plus"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit drawer -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId !== null ? 'Edit Tag' : 'New Tag'" size="sm"
    >
      <MpFormGrid>
        <v-text-field
          v-model="tagName"
          label="Tag name"
          placeholder="e.g. Promotions"
          autofocus
          :rules="[v => !!v || 'Name is required']"
          @keydown.enter="saveTag"
        />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="saveTag">
          {{ editingId !== null ? 'Save' : 'Create' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <!-- Import tags drawer -->
    <MpFormDrawer v-model="importDialog" title="Import Tags" size="sm">
      <p class="text-body-2 text-medium-emphasis">
        Paste tag names separated by commas or new lines. Each one becomes a new tag.
      </p>
      <MpFormGrid>
        <v-textarea
          v-model="importText"
          label="Tag names"
          rows="5"
          placeholder="Newsletter, Promo_2026, Onboarding"
        />
      </MpFormGrid>
      <div v-if="importPreview.length" class="text-caption text-medium-emphasis">
        {{ importPreview.length }} tag{{ importPreview.length === 1 ? '' : 's' }} ready to import
      </div>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="importDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!importPreview.length" @click="importTags">Import</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete tag?"
      :message="`“${pendingDelete?.name}” will be permanently deleted and removed from any campaigns using it.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>
