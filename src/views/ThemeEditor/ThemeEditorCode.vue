<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import MpCodeEditor, { type MpCodeLanguage } from '@/components/MpCodeEditor.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpIconButton from '@/components/MpIconButton.vue'
import ThemeCodeExplorer from '@/components/themeeditor/ThemeCodeExplorer.vue'
import ThemeEditorFrame from '@/components/themeeditor/ThemeEditorFrame.vue'
import { languageIcon } from '@/components/themeeditor/themeEditorIcons'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useThemeEditorCodeStore } from '@/stores/useThemeEditorCode'
import { fileLabel, type ThemeEditorLanguage } from '@/stores/themeEditorLumosFiles'

// Theme code editor — store builder re-skin (docs/rebuild/theme-editor-reskin/README.md).
// The UAT screen 1:1: tool bar (Explorer / Search) · explorer tree · tab strip · code pane ·
// Save. Same workflow — open files into tabs, edit, Cmd/Ctrl+S or Save commits all — on the
// design system's frame, rows, buttons, menus and the MpCodeEditor wrapper.

const route = useRoute()
const accountId = computed(() => String(route.params.accountId ?? ''))
const channelId = computed(() => String(route.params.channelId ?? ''))
const themeId = computed(() => String(route.params.themeId ?? ''))

const themesStore = useStoreThemesStore()
const codeStore = useThemeEditorCodeStore()
const toast = useToast()

const themeName = computed(() => themesStore.getTheme(themeId.value)?.name ?? 'Theme')

// ── Side panel ────────────────────────────────────────────────────────────────
const panel = ref<'explorer' | 'search'>('explorer')

// ── Tabs — UAT opens on the 404 template's HTML ───────────────────────────────
const START_FILE = 'templates/404/default.html'
const openPaths = ref<string[]>(codeStore.getFile(START_FILE) ? [START_FILE] : [])
const activePath = ref<string | null>(openPaths.value[0] ?? null)
const activeFile = computed(() => (activePath.value ? codeStore.getFile(activePath.value) : undefined))

function openFile(path: string) {
  if (!openPaths.value.includes(path)) openPaths.value.push(path)
  activePath.value = path
}

function closeTab(path: string) {
  const index = openPaths.value.indexOf(path)
  if (index === -1) return
  openPaths.value.splice(index, 1)
  if (activePath.value === path) activePath.value = openPaths.value[index] ?? openPaths.value[index - 1] ?? null
}

const editorValue = computed({
  get: () => activeFile.value?.content ?? '',
  set: (value: string) => {
    if (activePath.value) codeStore.updateFile(activePath.value, value)
  },
})

function editorLanguage(language: ThemeEditorLanguage): MpCodeLanguage {
  return language === 'image' ? 'text' : language
}

// ── Save ──────────────────────────────────────────────────────────────────────
const anyDirty = computed(() => codeStore.anyDirty)

function saveAll() {
  if (!anyDirty.value) return
  codeStore.saveAll()
  toast.success('Theme code saved')
}

// ── Explorer actions ──────────────────────────────────────────────────────────
function createFile(path: string) {
  if (!codeStore.createFile(path)) {
    toast.error(`${path} already exists`)
    return
  }
  openFile(path)
}

function renameFile(path: string, nextPath: string) {
  if (!codeStore.renameFile(path, nextPath)) {
    toast.error(`${fileLabel(nextPath)} already exists`)
    return
  }
  openPaths.value = openPaths.value.map((entry) => (entry === path ? nextPath : entry))
  if (activePath.value === path) activePath.value = nextPath
}

const pendingDelete = ref<string | null>(null)
const deleteOpen = computed({
  get: () => pendingDelete.value !== null,
  set: (value: boolean) => {
    if (!value) pendingDelete.value = null
  },
})

function confirmDelete() {
  const path = pendingDelete.value
  if (!path) return
  codeStore.deleteFile(path)
  closeTab(path)
  toast.success(`Deleted ${fileLabel(path)}`)
}

// ── Leave guard (explicit persistence — see docs/design-system/builder-persistence.md) ──
const { confirmLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } = useDirtyLeaveGuard(anyDirty, {
  title: 'Discard unsaved code?',
  message: 'Unsaved edits to theme files will be lost.',
  beforeUnload: true,
})
</script>

<template>
  <ThemeEditorFrame :account-id="accountId" :channel-id="channelId" :theme-id="themeId" active="code">
    <template #actions>
      <v-btn variant="text" class="text-none" prepend-icon="save" :disabled="!anyDirty" @click="saveAll">Save</v-btn>
    </template>

    <div class="te-code">
      <div class="te-code__tools" role="tablist" aria-label="Side panel" aria-orientation="vertical">
        <MpIconButton
          icon="files"
          ariaLabel="Explorer"
          tooltipLocation="end"
          role="tab"
          :active="panel === 'explorer'"
          :aria-selected="panel === 'explorer'"
          @click="panel = 'explorer'"
        />
        <MpIconButton
          icon="search"
          ariaLabel="Search"
          tooltipLocation="end"
          role="tab"
          :active="panel === 'search'"
          :aria-selected="panel === 'search'"
          @click="panel = 'search'"
        />
      </div>

      <ThemeCodeExplorer
        :files="codeStore.files"
        :theme-name="themeName"
        :dirty-paths="codeStore.dirtyPaths"
        :open-paths="openPaths"
        :active-path="activePath"
        :mode="panel"
        @open="openFile"
        @close="closeTab"
        @create="createFile"
        @rename="renameFile"
        @remove="pendingDelete = $event"
      />

      <div class="te-code__main">
        <div class="te-code__tabs" role="tablist" aria-label="Open files">
          <div
            v-for="path in openPaths"
            :key="path"
            class="te-tab"
            :class="{ 'te-tab--active': path === activePath }"
            role="tab"
            tabindex="0"
            :aria-selected="path === activePath"
            @click="activePath = path"
            @keydown.enter.prevent="activePath = path"
            @keydown.space.prevent="activePath = path"
          >
            <v-icon class="te-tab__icon">{{ languageIcon(codeStore.getFile(path)?.language ?? 'text') }}</v-icon>
            <span class="te-tab__label">{{ fileLabel(path) }}</span>
            <span v-if="codeStore.isDirty(path)" class="te-tab__dot" role="img" aria-label="Unsaved changes" />
            <MpIconButton v-else size="sm" icon="x" class="te-tab__close" :ariaLabel="`Close ${fileLabel(path)}`" :tooltip="false" @click.stop="closeTab(path)" />
          </div>
        </div>

        <div class="te-code__editor">
          <template v-if="activeFile">
            <MpEmptyState
              v-if="activeFile.language === 'image'"
              icon="file-image"
              :title="fileLabel(activeFile.path)"
              description="Binary asset — an image preview isn't part of this prototype."
              :heading-level="2"
            />
            <MpCodeEditor
              v-else
              :key="activeFile.path"
              v-model="editorValue"
              :language="editorLanguage(activeFile.language)"
              :ariaLabel="`Editor content: ${activeFile.path}`"
              @save="saveAll"
            />
          </template>
          <MpEmptyState v-else icon="file-code" title="No file opened" description="Select a file in the Explorer to start editing." :heading-level="2" />
        </div>
      </div>
    </div>

    <MpConfirmDialog
      v-model="deleteOpen"
      title="Delete file?"
      :message="`${pendingDelete ? fileLabel(pendingDelete) : 'This file'} will be removed from the theme.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />
    <MpConfirmDialog
      v-model="confirmLeave"
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      danger
      @confirm="discardAndLeave"
    />
  </ThemeEditorFrame>
</template>

<style scoped>
.te-code {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

/* Tool bar — the icon column beside the explorer (Explorer / Search). */
.te-code__tools {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-4);
  flex-shrink: 0;
  width: var(--mp-component-editor-toolWidth);
  padding-block: var(--mp-space-8);
  border-right: 1px solid var(--border-subtle);
  background: var(--surface-secondary);
}

.te-code__main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  background: var(--surface-primary);
}

/* Document tabs — a strip of open files on the secondary surface; the active tab lifts onto the
   editor surface with the accent indicator underneath, like every other tab in the system. */
.te-code__tabs {
  display: flex;
  flex-shrink: 0;
  min-height: var(--mp-component-control-height);
  overflow-x: auto;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-secondary);
}

.te-tab {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  flex-shrink: 0;
  max-width: var(--mp-component-toolbar-searchMinWidth);
  padding-inline: var(--mp-space-12) var(--mp-space-4);
  border-right: 1px solid var(--border-subtle);
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: var(--mp-fontSize-12);
  cursor: pointer;
}

.te-tab:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.te-tab--active {
  background: var(--surface-primary);
  border-bottom-color: var(--accent-default);
  color: var(--text-primary);
  font-weight: var(--mp-fontWeight-medium);
}

.te-tab__icon {
  font-size: var(--mp-component-tree-iconSize);
  color: var(--icon-secondary);
}

.te-tab__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.te-tab__close {
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}

.te-tab:hover .te-tab__close,
.te-tab:focus-within .te-tab__close,
.te-tab--active .te-tab__close {
  opacity: 1;
}

.te-tab__dot {
  display: inline-block;
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  margin-inline: var(--mp-space-6) var(--mp-space-8);
  border-radius: var(--r-pill);
  background: var(--warn);
}

.te-code__editor {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.te-code__editor > * {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
