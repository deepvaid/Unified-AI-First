<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketingAssetsStore, type ImageGroup } from '@/stores/useMarketingAssets'
import { useImagesStore } from '@/stores/useImages'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormField from '@/components/MpFormField.vue'
import { useToast } from '@/composables/useToast'

const store = useMarketingAssetsStore()
const imagesStore = useImagesStore()
const search = ref('')

const headers = [
  { title: 'Group Name', key: 'name', sortable: true },
  { title: 'Images', key: 'imageCount', align: 'end' as const },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

// ── Create / edit drawer ─────────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const name = ref('')
const selectedImageIds = ref<number[]>([])

const canSave = computed(() => name.value.trim() !== '' && selectedImageIds.value.length > 0)

function openCreate() {
  editingId.value = null
  name.value = ''
  selectedImageIds.value = []
  drawer.value = true
}

function openEdit(group: ImageGroup) {
  editingId.value = group.id
  name.value = group.name
  selectedImageIds.value = []
  drawer.value = true
}

function saveGroup() {
  if (!canSave.value) return
  const payload = { name: name.value.trim(), imageCount: selectedImageIds.value.length }
  if (editingId.value !== null) {
    store.updateImageGroup(editingId.value, payload)
    notify('Image group updated')
  } else {
    store.addImageGroup(payload)
    notify('Image group created')
  }
  drawer.value = false
}

// ── Delete ────────────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<ImageGroup | null>(null)
function askDelete(group: ImageGroup) {
  pendingDelete.value = group
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deleteImageGroup(pendingDelete.value.id)
    notify('Image group deleted')
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
      title="Optimise on Open"
      :subtitle="`${store.imageGroups.length} image groups`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">Create Image Group</v-btn>
      </template>
    </MpPageHeader>

    <v-alert type="info" variant="tonal" rounded="xl">
      Deliver dynamic images that change based on when, where, and how your subscribers open your emails.
    </v-alert>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Image Groups"
        search-placeholder="Search groups..."
        :total-count="store.imageGroups.length"
      />

      <v-data-table :headers="headers" :items="store.imageGroups" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.imageCount="{ item }">
          <span class="font-weight-medium">{{ item.imageCount.toLocaleString() }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Image group actions" :itemLabel="item.name">
            <v-list-item role="menuitem" prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <v-list-item role="menuitem" prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="sparkles"
            :title="search ? 'No image groups match your search' : 'No image groups yet'"
            :description="search ? 'Try a different search term.' : 'Create a group of images to personalize when an email is opened.'"
            :action-label="!search ? 'Create Image Group' : undefined"
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
      :title="editingId !== null ? 'Edit Image Group' : 'New Image Group'"
    >
      <MpFormGrid>
        <v-text-field
          v-model="name"
          label="Name"
          placeholder="e.g. Dynamic Weather Header"
          :rules="[v => !!v || 'Name is required']"
        />

        <MpFormField
          label="Images in this group"
          hint="Pick images from your library to rotate based on open conditions."
        >
          <v-list density="compact" class="oo-image-list" rounded="lg" border>
            <v-list-item v-for="img in imagesStore.items" :key="img.id">
              <template #prepend>
                <v-checkbox-btn
                  :model-value="selectedImageIds.includes(img.id)"
                  @update:model-value="(v) => { selectedImageIds = v ? [...selectedImageIds, img.id] : selectedImageIds.filter(id => id !== img.id) }"
                />
              </template>
              <v-list-item-title class="text-body-2">{{ img.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ img.size }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </MpFormField>
      </MpFormGrid>
      <div v-if="selectedImageIds.length" class="text-caption text-medium-emphasis">
        {{ selectedImageIds.length }} image{{ selectedImageIds.length === 1 ? '' : 's' }} selected
      </div>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="saveGroup">
          {{ editingId !== null ? 'Save Changes' : 'Create' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete image group?"
      :message="`“${pendingDelete?.name}” will be permanently deleted.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.oo-image-list {
  max-height: 260px;
  overflow-y: auto;
}
</style>
