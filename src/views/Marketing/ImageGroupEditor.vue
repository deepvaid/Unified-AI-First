<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketingAssetsStore, type ImageGroupSlot } from '@/stores/useMarketingAssets'
import { useFoldersStore } from '@/stores/useFolders'
import { useImagesStore } from '@/stores/useImages'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: /accounts/:id/image_groups/new and /:id/edit — "Edit Group":
// a Default Image card, optional timed slots (the ➕ between cards), and the
// Expiry Image card. UAT's CHANGE IMAGE round-trips to the Image Library via
// ?return_url (losing form state); here it opens an in-context picker
// (IMPROVEMENTS.md). UAT also shows "Image Group name is required" under a
// filled field — the message here only appears when the field is empty.

const route = useRoute()
const router = useRouter()
const store = useMarketingAssetsStore()
const foldersStore = useFoldersStore()
const imagesStore = useImagesStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const editingId = computed(() => (route.name === 'ImageGroupEdit' ? Number(route.params.id) : null))
const existing = computed(() => store.imageGroups.find(g => g.id === editingId.value))

const name = ref(existing.value?.name ?? '')
const folderId = ref<string | null>(existing.value?.folderId ?? null)
const slots = ref<ImageGroupSlot[]>(
  existing.value
    ? existing.value.slots.map(s => ({ ...s }))
    : [
        { id: 1, kind: 'default', imageName: '', imageUrl: '', clickThroughUrl: '', expiresAtDate: null, expiresAtTime: null },
        { id: 2, kind: 'expiry', imageName: '', imageUrl: '', clickThroughUrl: '', expiresAtDate: null, expiresAtTime: null },
      ],
)

const notFound = computed(() => editingId.value !== null && !existing.value)

const groupFolders = computed(() => foldersStore.foldersByScope('image_groups'))

const SLOT_TITLES: Record<ImageGroupSlot['kind'], string> = {
  default: 'Default Image',
  timed: 'Timed Image',
  expiry: 'Expiry Image',
}

const SLOT_HINTS: Record<ImageGroupSlot['kind'], string> = {
  default: 'Shown from send until its expiration date and time.',
  timed: 'Shown after the previous image expires, until its own expiration.',
  expiry: 'Shown once every other image has expired.',
}

/** Inserts a timed slot before the expiry card — UAT's ➕ between the cards. */
function addTimedSlot() {
  const nextId = Math.max(0, ...slots.value.map(s => s.id)) + 1
  const expiryIndex = slots.value.findIndex(s => s.kind === 'expiry')
  slots.value.splice(expiryIndex === -1 ? slots.value.length : expiryIndex, 0, {
    id: nextId, kind: 'timed', imageName: '', imageUrl: '', clickThroughUrl: '', expiresAtDate: null, expiresAtTime: null,
  })
}

function removeSlot(slot: ImageGroupSlot) {
  slots.value = slots.value.filter(s => s.id !== slot.id)
}

// ── Image picker (in-context replacement for the /folders?return_url trip) ──
const pickerOpen = ref(false)
const pickerTarget = ref<ImageGroupSlot | null>(null)
function openPicker(slot: ImageGroupSlot) {
  pickerTarget.value = slot
  pickerOpen.value = true
}
function pickImage(id: number) {
  const image = imagesStore.items.find(i => i.id === id)
  if (image && pickerTarget.value) {
    pickerTarget.value.imageUrl = image.url
    pickerTarget.value.imageName = image.name
    if (!pickerTarget.value.clickThroughUrl) pickerTarget.value.clickThroughUrl = imagesStore.cdnLink(image)
  }
  pickerOpen.value = false
}

const canSave = computed(() =>
  name.value.trim() !== '' &&
  slots.value.every(s =>
    s.imageUrl !== '' &&
    s.clickThroughUrl.trim() !== '' &&
    (s.kind === 'expiry' || (s.expiresAtDate && s.expiresAtTime)),
  ),
)

function cancel() {
  router.push(`/accounts/${accountId.value}/image_groups`)
}

function save() {
  if (!canSave.value) return
  const payload = { name: name.value.trim(), folderId: folderId.value, slots: slots.value.map(s => ({ ...s })) }
  if (editingId.value !== null) {
    store.updateImageGroup(editingId.value, payload)
    toast.success('Image group updated')
  } else {
    store.addImageGroup(payload)
    toast.success('Image group created')
  }
  cancel()
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <template v-if="!notFound">
      <MpPageHeader
        :title="editingId !== null ? 'Edit Group' : 'New Group'"
        eyebrow="Optimize On Open"
        :back-to="`/accounts/${accountId}/image_groups`"
      />

      <v-card variant="flat" border rounded="lg" class="editor-card">
        <v-text-field
          v-model="name"
          label="Image Group Name *"
          placeholder="e.g. Holiday Countdown Header"
          :rules="[v => !!v || 'Image Group name is required']"
          class="name-field"
        />

        <div class="slot-row" role="list" aria-label="Image slots">
          <template v-for="(slot, index) in slots" :key="slot.id">
            <v-card variant="flat" border rounded="lg" class="slot-card" role="listitem">
              <div class="d-flex align-center justify-space-between">
                <h2 class="slot-card__title">
                  {{ SLOT_TITLES[slot.kind] }}
                  <v-tooltip :text="SLOT_HINTS[slot.kind]" location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="16" class="ml-1" :aria-label="SLOT_HINTS[slot.kind]">info</v-icon>
                    </template>
                  </v-tooltip>
                </h2>
                <v-btn
                  v-if="slot.kind === 'timed'"
                  icon="trash-2"
                  variant="text"
                  size="small"
                  aria-label="Remove timed image"
                  @click="removeSlot(slot)"
                />
              </div>

              <div class="slot-card__media">
                <v-img v-if="slot.imageUrl" :src="slot.imageUrl" :alt="slot.imageName" height="140" contain />
                <div v-else class="slot-card__placeholder">
                  <v-icon size="28">image</v-icon>
                  <span>No image selected</span>
                </div>
              </div>

              <v-btn variant="outlined" class="text-none align-self-start" @click="openPicker(slot)">Change Image</v-btn>

              <v-text-field
                v-model="slot.clickThroughUrl"
                label="Click-through URL *"
                placeholder="https://example.com/landing"
                :rules="[v => !!v || 'Click-through URL is required']"
              />

              <template v-if="slot.kind !== 'expiry'">
                <div class="d-flex ga-3">
                  <v-text-field
                    v-model="slot.expiresAtDate"
                    type="date"
                    label="Expiration Date *"
                    :rules="[v => !!v || 'Expiration date is required']"
                  />
                  <v-text-field
                    v-model="slot.expiresAtTime"
                    type="time"
                    label="Expiration Time *"
                    :rules="[v => !!v || 'Expiration time is required']"
                  />
                </div>
              </template>
              <MpAlert v-else tone="info" :dismissible="false" icon="clock">
                There is no expiry date and time for this image.
              </MpAlert>
            </v-card>

            <div v-if="slot.kind !== 'expiry' && slots[index + 1]?.kind === 'expiry'" class="slot-add">
              <v-btn
                icon="plus"
                variant="outlined"
                size="small"
                aria-label="Add a timed image between the default and expiry images"
                @click="addTimedSlot"
              />
            </div>
          </template>
        </div>

        <v-select
          v-model="folderId"
          label="Folder"
          :items="[{ title: 'No folder', value: null }, ...groupFolders.map(f => ({ title: f.name, value: f.id }))]"
          class="folder-field"
        />

        <div class="d-flex ga-3">
          <v-btn variant="flat" color="surface" class="text-none" @click="cancel">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">Save</v-btn>
        </div>
      </v-card>

      <!-- In-context image picker -->
      <MpDialog v-model="pickerOpen" title="Choose an image" subtitle="From your Image Library" size="lg">
        <div class="picker-grid">
          <button
            v-for="img in imagesStore.items"
            :key="img.id"
            type="button"
            class="picker-tile"
            :aria-label="`Use ${img.name}`"
            @click="pickImage(img.id)"
          >
            <v-img :src="img.url" :alt="''" height="96" cover rounded />
            <span class="picker-tile__name">{{ img.name }}</span>
          </button>
        </div>
      </MpDialog>
    </template>

    <MpEmptyState
      v-else
      icon="images"
      title="Image group not found"
      description="This image group does not exist or has been deleted."
      action-label="Back to Optimize On Open"
      @action="cancel"
      class="py-10"
    />
  </div>
</template>

<style scoped>
.editor-card {
  padding: var(--mp-component-card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.name-field,
.folder-field {
  max-width: 480px;
}

.slot-row {
  display: flex;
  align-items: stretch;
  gap: var(--mp-space-16);
  flex-wrap: wrap;
}

.slot-card {
  flex: 1 1 300px;
  max-width: 420px;
  padding: var(--mp-component-card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.slot-card__title {
  font-size: var(--mp-fontSize-15);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.slot-card__media {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  overflow: hidden;
}

.slot-card__placeholder {
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-6);
  color: var(--text-secondary, rgba(var(--v-theme-on-surface), 0.6));
}

.slot-add {
  display: flex;
  align-items: center;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--mp-space-12);
}

.picker-tile {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-10);
  padding: var(--mp-space-8);
  text-align: left;
}

.picker-tile:hover,
.picker-tile:focus-visible {
  border-color: rgb(var(--v-theme-primary));
}

.picker-tile__name {
  font-size: var(--mp-fontSize-12);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
