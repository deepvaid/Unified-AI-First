<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import {
  CONTENT_TEMPLATES,
  createContentDraft,
  useStoreContentStore,
  type ContentEntry,
  type ContentKind,
  type ContentStatus,
} from '@/stores/useStoreContent'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

// Shared create/edit view for store editor Pages and Blogs — the legacy
// sections use one identical form; `kind` comes from the route meta.
const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const contentStore = useStoreContentStore()

const kind = computed<ContentKind>(() => (route.meta.contentKind === 'blog' ? 'blog' : 'page'))
const isBlog = computed(() => kind.value === 'blog')

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const entryId = computed(() => {
  const value = route.params.entryId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const isNew = computed(() => !entryId.value)

const listRoute = computed(() => ({
  name: isBlog.value ? 'StoreBlogs' : 'StorePages',
  params: { accountId: accountId.value, channelId: channelId.value },
}))

// ── Local draft (save-on-submit, like the legacy editor) ─────────
function loadDraft(): ContentEntry | null {
  if (!entryId.value) return createContentDraft(channelId.value, kind.value)
  const existing = contentStore.getEntry(entryId.value)
  if (!existing || existing.kind !== kind.value) return null
  return { ...existing }
}

const draft = ref<ContentEntry | null>(loadDraft())
const savedSnapshot = ref(draft.value ? JSON.stringify(draft.value) : '')

// The same component instance serves page and blog create/edit routes —
// re-initialize the draft when the target changes.
watch([kind, entryId], () => {
  draft.value = loadDraft()
  savedSnapshot.value = draft.value ? JSON.stringify(draft.value) : ''
  leaveConfirmed = false
  nextTick(() => {
    if (editorEl.value && draft.value) editorEl.value.innerHTML = draft.value.body
  })
})

const isDirty = computed(() => draft.value !== null && JSON.stringify(draft.value) !== savedSnapshot.value)
const canSave = computed(() => Boolean(draft.value && draft.value.title.trim() && isDirty.value))

const statusOptions: ContentStatus[] = ['Active', 'Inactive']

// ── Rich-text surface ────────────────────────────────────────────
// Prototype editor: contenteditable + formatting commands — a faithful stand-in
// for the legacy WYSIWYG toolbar without adding a dependency.
const editorEl = ref<HTMLElement | null>(null)

onMounted(() => {
  if (editorEl.value && draft.value) editorEl.value.innerHTML = draft.value.body
})

function syncBody() {
  if (editorEl.value && draft.value) draft.value.body = editorEl.value.innerHTML
}

function exec(command: string, arg?: string) {
  editorEl.value?.focus()
  document.execCommand(command, false, arg)
  syncBody()
}

const toolbar = [
  { icon: 'undo-2', label: 'Undo', run: () => exec('undo') },
  { icon: 'redo-2', label: 'Redo', run: () => exec('redo') },
  { divider: true },
  { icon: 'heading-2', label: 'Heading', run: () => exec('formatBlock', '<h2>') },
  { icon: 'pilcrow', label: 'Paragraph', run: () => exec('formatBlock', '<p>') },
  { divider: true },
  { icon: 'bold', label: 'Bold', run: () => exec('bold') },
  { icon: 'italic', label: 'Italic', run: () => exec('italic') },
  { icon: 'underline', label: 'Underline', run: () => exec('underline') },
  { icon: 'strikethrough', label: 'Strikethrough', run: () => exec('strikeThrough') },
  { divider: true },
  { icon: 'list', label: 'Bulleted list', run: () => exec('insertUnorderedList') },
  { icon: 'list-ordered', label: 'Numbered list', run: () => exec('insertOrderedList') },
] as Array<{ icon?: string; label?: string; run?: () => void; divider?: boolean }>

// ── Feature image (mock upload — filename only, no backend) ──────
const fileInput = ref<HTMLInputElement | null>(null)

function pickImage() {
  fileInput.value?.click()
}

function onImagePicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file && draft.value) draft.value.imageName = file.name
  input.value = ''
}

// ── Save / discard ───────────────────────────────────────────────
const discardDialog = ref(false)
let leaveConfirmed = false

function save() {
  if (!draft.value || !canSave.value) return
  contentStore.saveEntry(draft.value)
  savedSnapshot.value = JSON.stringify(draft.value)
  leaveConfirmed = true
  router.push(listRoute.value)
}

function requestCancel() {
  if (!isDirty.value) {
    backToList()
    return
  }
  discardDialog.value = true
}

function backToList() {
  leaveConfirmed = true
  router.push(listRoute.value)
}

const pendingTarget = ref<string | null>(null)

onBeforeRouteLeave((to) => {
  if (!isDirty.value || leaveConfirmed) return true
  pendingTarget.value = to.fullPath
  discardDialog.value = true
  return false
})

function confirmDiscard() {
  leaveConfirmed = true
  const target = pendingTarget.value
  pendingTarget.value = null
  if (target) {
    router.push(target)
    return
  }
  backToList()
}
</script>

<template>
  <div v-if="!channel || !draft" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="420">
      <MpEmptyState
        :icon="isBlog ? 'rss' : 'file-text'"
        :title="`${isBlog ? 'Post' : 'Page'} not found`"
        :description="`This ${isBlog ? 'post' : 'page'} doesn't exist or was deleted.`"
        :action-label="`Back to ${isBlog ? 'blogs' : 'pages'}`"
        @action="backToList"
      />
    </v-card>
  </div>

  <div v-else class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      :title="draft.title.trim() || (isBlog ? 'New post' : 'New page')"
      :subtitle="`${isBlog ? 'Blogs' : 'Pages'} · ${channel.name}`"
      :back-to="listRoute"
    >
      <template #actions>
        <v-btn variant="text" class="text-none" @click="requestCancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">
          {{ isNew ? (isBlog ? 'Create post' : 'Create page') : 'Save' }}
        </v-btn>
      </template>
    </MpPageHeader>

    <v-row class="flex-grow-1" dense>
      <v-col cols="12" md="8">
        <v-card variant="flat" border rounded="lg" class="pa-4 mb-4">
          <v-text-field
            v-model="draft.title"
            label="Title"
            :placeholder="isBlog ? 'e.g. Five trails to break in your new boots' : 'e.g. About us'"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :rules="[(v: string) => Boolean(v?.trim()) || 'Title is required']"
          />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="mb-4 overflow-hidden">
          <div class="ce-toolbar">
            <template v-for="(tool, index) in toolbar" :key="index">
              <v-divider v-if="tool.divider" vertical class="mx-1 my-2" />
              <v-tooltip v-else :text="tool.label" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" :icon="tool.icon" variant="text" size="small" density="comfortable" :aria-label="tool.label" @mousedown.prevent @click="tool.run?.()" />
                </template>
              </v-tooltip>
            </template>
          </div>
          <v-divider />
          <div
            ref="editorEl"
            class="ce-surface"
            contenteditable="true"
            role="textbox"
            aria-multiline="true"
            :aria-label="`${isBlog ? 'Post' : 'Page'} content`"
            :data-placeholder="`Write your ${isBlog ? 'post' : 'page'} content…`"
            @input="syncBody"
            @blur="syncBody"
          />
        </v-card>

        <v-card variant="flat" border rounded="lg" class="pa-4">
          <div class="text-subtitle-2 font-weight-bold mb-1">SEO settings</div>
          <div class="text-caption text-medium-emphasis mb-4">How this {{ isBlog ? 'post' : 'page' }} appears in search results.</div>
          <div class="d-flex flex-column gap-4">
            <v-text-field v-model="draft.seoTitle" label="Title" variant="outlined" density="comfortable" hide-details="auto" counter="60" />
            <v-textarea v-model="draft.seoDescription" label="Meta description" variant="outlined" density="comfortable" rows="3" counter="160" hide-details="auto" />
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <div class="editor-rail">
          <v-card variant="flat" border rounded="lg" class="pa-4 mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-3">Status</div>
            <v-select v-model="draft.status" :items="statusOptions" variant="outlined" density="comfortable" hide-details />
            <div class="text-caption text-medium-emphasis mt-2">
              Inactive {{ isBlog ? 'posts' : 'pages' }} stay hidden from your storefront until you activate them.
            </div>
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-4 mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-3">Template</div>
            <v-select v-model="draft.template" :items="CONTENT_TEMPLATES" variant="outlined" density="comfortable" hide-details />
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-4">
            <div class="text-subtitle-2 font-weight-bold mb-1">Feature image</div>
            <div class="text-caption text-medium-emphasis mb-3">Square, high-resolution images work best (min 100×100&nbsp;px).</div>

            <div v-if="draft.imageName" class="ce-image-chip">
              <v-icon size="18" color="success">image</v-icon>
              <span class="text-body-2 text-truncate">{{ draft.imageName }}</span>
              <v-btn icon="x" variant="text" size="x-small" aria-label="Remove image" @click="draft.imageName = ''" />
            </div>
            <div v-else class="ce-image-placeholder">
              <v-icon size="24" class="text-medium-emphasis">image</v-icon>
            </div>

            <v-btn variant="outlined" size="small" prepend-icon="upload" class="text-none mt-3" @click="pickImage">
              {{ draft.imageName ? 'Replace image' : 'Upload image' }}
            </v-btn>
            <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="onImagePicked" />
          </v-card>
        </div>
      </v-col>
    </v-row>

    <MpConfirmDialog
      v-model="discardDialog"
      title="Discard unsaved changes?"
      :message="`Your edits to “${draft.title.trim() || (isBlog ? 'this post' : 'this page')}” haven't been saved and will be lost.`"
      confirm-label="Discard changes"
      danger
      @confirm="confirmDiscard"
    />
  </div>
</template>

<style scoped>
.ce-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  flex-wrap: wrap;
}

.ce-surface {
  min-height: 280px;
  padding: 16px;
  outline: none;
  font-size: 0.875rem;
  line-height: 1.6;
}

.ce-surface:empty::before {
  content: attr(data-placeholder);
  color: rgba(var(--v-theme-on-surface), 0.4);
  pointer-events: none;
}

.ce-surface :deep(h2) {
  font-size: 1.15rem;
  margin: 0.6em 0 0.3em;
}

.ce-surface :deep(p) {
  margin: 0 0 0.6em;
}

.ce-surface :deep(ul),
.ce-surface :deep(ol) {
  padding-left: 1.4em;
  margin: 0 0 0.6em;
}

.ce-image-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
}

.ce-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96px;
  border: 1px dashed rgba(var(--v-border-color), calc(var(--v-border-opacity) * 2.5));
  border-radius: 8px;
  background: rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.4));
}

.editor-rail {
  position: sticky;
  top: 16px;
}

@media (max-width: 960px) {
  .editor-rail {
    position: static;
  }
}
</style>
