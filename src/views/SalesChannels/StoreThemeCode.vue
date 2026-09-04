<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpBuilderShell from '@/components/MpBuilderShell.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useThemeCodeStore } from '@/stores/useThemeCode'
import { fileLeafLabel, groupFilesByFolder } from '@/stores/themeCodeData'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)
const channelId = computed(() => route.params.channelId as string)

const salesChannelsStore = useSalesChannelsStore()
const themesStore = useStoreThemesStore()
const codeStore = useThemeCodeStore()
const toast = useToast()

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const theme = computed(() => themesStore.themeForChannel(channelId.value))

const builderRoute = computed(() => ({
  name: 'StoreThemeBuilder',
  params: { accountId: accountId.value, channelId: channelId.value },
}))

// ── Explorer tree ─────────────────────────────────────────────────────────────
const folders = computed(() => groupFilesByFolder(codeStore.files))

// Folder collapse state — default expanded so the tree reads on open.
const collapsedFolders = ref<Set<string>>(new Set())
function toggleFolder(name: string) {
  const next = new Set(collapsedFolders.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  collapsedFolders.value = next
}

function fileIcon(language: 'html' | 'json') {
  return language === 'json' ? 'braces' : 'file-code'
}

// ── Open tabs + active file ───────────────────────────────────────────────────
const openPaths = ref<string[]>([])
const activePath = ref<string | null>(null)
const activeFile = computed(() => (activePath.value ? codeStore.getFile(activePath.value) : undefined))

const editorRef = ref<HTMLTextAreaElement | null>(null)

function openFile(path: string) {
  if (!openPaths.value.includes(path)) openPaths.value.push(path)
  activePath.value = path
  // Focus the editor once the textarea is in the DOM.
  nextTick(() => editorRef.value?.focus())
}

function closeTab(path: string) {
  const idx = openPaths.value.indexOf(path)
  if (idx === -1) return
  openPaths.value.splice(idx, 1)
  if (activePath.value === path) {
    // Fall back to the neighbour tab, or nothing if none remain.
    activePath.value = openPaths.value[idx] ?? openPaths.value[idx - 1] ?? null
  }
}

// ── Editor content (v-model → store) + line-number gutter ─────────────────────
const editorValue = computed({
  get: () => activeFile.value?.content ?? '',
  set: (v: string) => {
    if (activePath.value) codeStore.updateFile(activePath.value, v)
  },
})

const lineNumbers = computed(() => {
  const count = editorValue.value.split('\n').length
  return Array.from({ length: count }, (_, i) => i + 1)
})

// Keep the gutter scrolled in step with the textarea.
const gutterRef = ref<HTMLElement | null>(null)
function onEditorScroll(e: Event) {
  if (gutterRef.value) gutterRef.value.scrollTop = (e.target as HTMLTextAreaElement).scrollTop
}

// Tab inserts two spaces instead of moving focus.
function onEditorKeydown(e: KeyboardEvent) {
  if (e.key !== 'Tab' || !activePath.value) return
  e.preventDefault()
  const el = e.target as HTMLTextAreaElement
  const { selectionStart, selectionEnd, value } = el
  const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`
  codeStore.updateFile(activePath.value, next)
  nextTick(() => {
    el.selectionStart = el.selectionEnd = selectionStart + 2
  })
}

// ── Save + leave guard ─────────────────────────────────────────────────────
const isDirty = computed(() => codeStore.anyDirty)
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave theme code editor?',
  message: 'You have unsaved code changes. Leaving now will discard them.',
  beforeUnload: true,
})

function saveAll() {
  if (!codeStore.anyDirty) return
  codeStore.saveAll()
  allowNextLeave()
  toast.success('Theme code saved')
}

// Cmd/Ctrl+S saves (and always suppresses the browser save dialog).
function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    saveAll()
  }
}
onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))

// Switching channel reuses this component — reset the open tabs so one theme's
// session never leaks into another's.
watch(channelId, () => {
  openPaths.value = []
  activePath.value = null
})
</script>

<template>
  <div v-if="!channel || !theme" class="tc-missing d-flex align-center justify-center">
    <MpEmptyState
      icon="code"
      :title="channel ? 'No theme for this channel' : 'Sales channel not found'"
      :description="channel
        ? 'This channel doesn\'t have a store theme yet, so there\'s no code to edit.'
        : 'This sales channel doesn\'t exist or was removed.'"
      actionLabel="Back to sales channels"
      actionIcon="arrow-left"
      @action="router.push({ name: 'SalesChannels', params: { accountId } })"
    />
  </div>

  <MpBuilderShell
    v-else
    :back-to="builderRoute"
    back-label="Back to visual editor"
    :title="theme.name"
    :dirty="codeStore.anyDirty"
    persistence-mode="explicit"
  >
    <template #title>
      <div class="font-weight-bold text-body-1 text-truncate">{{ theme.name }}</div>
      <MpStatusChip status="Theme code" type="general" size="sm" />
    </template>

    <template #actions>
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        class="text-none"
        prepend-icon="save"
        :disabled="!codeStore.anyDirty"
        @click="saveAll"
      >
        Save
      </v-btn>
    </template>

    <!-- Body: icon rail · explorer · editor -->
    <div class="tc-body d-flex h-100" style="overflow:hidden;">
      <!-- (a) Icon rail (visual only) -->
      <nav class="tc-rail border-r bg-surface d-flex flex-column align-center py-2" aria-label="Editor views">
        <v-tooltip text="Explorer" location="right">
          <template #activator="{ props }">
            <button v-bind="props" class="tc-rail__btn tc-rail__btn--active" aria-label="Explorer" aria-current="page">
              <v-icon size="18">files</v-icon>
            </button>
          </template>
        </v-tooltip>
      </nav>

      <!-- (b) Explorer panel -->
      <aside class="tc-explorer border-r bg-surface d-flex flex-column">
        <div class="tc-explorer__title px-3 py-2 text-caption font-weight-bold text-uppercase text-medium-emphasis">
          Explorer
        </div>

        <div class="flex-grow-1 overflow-y-auto">
          <!-- Open editors -->
          <template v-if="openPaths.length">
            <div class="tc-group-label px-3 py-1 text-caption font-weight-bold text-uppercase text-medium-emphasis">
              Open Editors
            </div>
            <div role="list" aria-label="Open editors">
              <div
                v-for="path in openPaths"
                :key="path"
                role="listitem"
                class="tc-file-row"
                :class="{ 'tc-file-row--active': path === activePath }"
              >
                <button class="tc-file-row__main" :aria-label="`Open ${fileLeafLabel(path)}`" @click="openFile(path)">
                  <v-icon size="16" class="tc-file-row__icon">{{ fileIcon(codeStore.getFile(path)!.language) }}</v-icon>
                  <span class="tc-file-row__label text-truncate">{{ fileLeafLabel(path) }}</span>
                  <span v-if="codeStore.isDirty(path)" class="tc-dot" role="status" aria-label="Unsaved"></span>
                </button>
                <v-btn
                  icon="x"
                  variant="text"
                  size="small"
                  density="comfortable"
                  class="tc-file-row__close"
                  :aria-label="`Close ${fileLeafLabel(path)}`"
                  @click="closeTab(path)"
                ></v-btn>
              </div>
            </div>
            <v-divider class="my-1"></v-divider>
          </template>

          <!-- File tree grouped by folder -->
          <div role="tree" aria-label="Theme files">
            <div v-for="folder in folders" :key="folder.name" role="treeitem">
              <button
                class="tc-folder-row"
                :aria-expanded="!collapsedFolders.has(folder.name)"
                @click="toggleFolder(folder.name)"
              >
                <v-icon size="16" class="tc-folder-row__chevron">
                  {{ collapsedFolders.has(folder.name) ? 'chevron-right' : 'chevron-down' }}
                </v-icon>
                <v-icon size="16" class="tc-folder-row__icon">folder</v-icon>
                <span class="tc-folder-row__label">{{ folder.name }}</span>
              </button>

              <div v-if="!collapsedFolders.has(folder.name)" role="group">
                <div
                  v-for="file in folder.files"
                  :key="file.path"
                  class="tc-file-row tc-file-row--nested"
                  :class="{ 'tc-file-row--active': file.path === activePath }"
                >
                  <button class="tc-file-row__main" :aria-label="`Open ${fileLeafLabel(file.path)}`" @click="openFile(file.path)">
                    <v-icon size="16" class="tc-file-row__icon">{{ fileIcon(file.language) }}</v-icon>
                    <span class="tc-file-row__label text-truncate">{{ fileLeafLabel(file.path) }}</span>
                    <span v-if="codeStore.isDirty(file.path)" class="tc-dot" role="status" aria-label="Unsaved"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- (c) Editor area -->
      <div class="tc-editor-area d-flex flex-column flex-grow-1" style="min-width:0;">
        <template v-if="activeFile">
          <!-- Tab strip -->
          <div class="tc-tabs d-flex border-b bg-surface" role="tablist" aria-label="Open files">
            <div
              v-for="path in openPaths"
              :key="path"
              class="tc-tab"
              :class="{ 'tc-tab--active': path === activePath }"
              role="tab"
              :aria-selected="path === activePath"
            >
              <button class="tc-tab__label" @click="openFile(path)">
                <v-icon size="16" class="tc-tab__icon">{{ fileIcon(codeStore.getFile(path)!.language) }}</v-icon>
                <span class="text-truncate">{{ fileLeafLabel(path) }}</span>
              </button>
              <span v-if="codeStore.isDirty(path)" class="tc-dot tc-dot--tab" aria-label="Unsaved"></span>
              <v-btn
                icon="x"
                variant="text"
                size="small"
                density="comfortable"
                class="tc-tab__close"
                :aria-label="`Close ${fileLeafLabel(path)}`"
                @click="closeTab(path)"
              ></v-btn>
            </div>
          </div>

          <!-- Code editor: gutter + textarea -->
          <div class="tc-editor flex-grow-1">
            <div ref="gutterRef" class="tc-gutter" aria-hidden="true">
              <div v-for="n in lineNumbers" :key="n" class="tc-gutter__line">{{ n }}</div>
            </div>
            <textarea
              ref="editorRef"
              v-model="editorValue"
              class="tc-textarea"
              spellcheck="false"
              autocomplete="off"
              autocapitalize="off"
              :aria-label="`Editing ${activePath}`"
              @scroll="onEditorScroll"
              @keydown="onEditorKeydown"
            ></textarea>
          </div>
        </template>

        <!-- Empty state: no file open -->
        <div v-else class="tc-empty flex-grow-1 d-flex align-center justify-center">
          <MpEmptyState
            icon="code"
            title="No file opened"
            description="Pick a file from the Explorer to start editing your theme code."
          />
        </div>
      </div>
    </div>

    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
  </MpBuilderShell>
</template>

<style scoped>
.tc-missing { min-height: 60vh; }
.tc-body { position: relative; }

.border-b { border-bottom: 1px solid var(--border-subtle); }
.border-r { border-right: 1px solid var(--border-subtle); }

/* ── Icon rail ─────────────────────────────────────────────────────── */
.tc-rail { width: var(--mp-space-48); flex-shrink: 0; gap: var(--mp-space-4); }
.tc-rail__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-component-control-height);
  height: var(--mp-component-control-height);
  border: 0;
  background: transparent;
  border-radius: var(--r-chip);
  cursor: pointer;
  color: var(--on-surface-muted);
}
.tc-rail__btn:hover { background: var(--surface-secondary); color: var(--text-primary); }
/* `:hover` out-specifies a single class, so the active pair is restated for the
   hovered case — same guard the file already uses on .tc-file-row--active. */
.tc-rail__btn--active,
.tc-rail__btn--active:hover {
  background: var(--accent-soft);
  color: var(--accent);
}
.tc-rail__btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

/* ── Explorer ──────────────────────────────────────────────────────── */
.tc-explorer { width: 280px; flex-shrink: 0; overflow: hidden; }
.tc-explorer__title { letter-spacing: 0.06em; }
.tc-group-label { letter-spacing: 0.06em; }

.tc-folder-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  width: 100%;
  padding: var(--mp-space-4) var(--mp-space-12);
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: var(--text-primary);
}
.tc-folder-row:hover { background: var(--surface-secondary); }
.tc-folder-row:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.tc-folder-row__chevron { color: var(--on-surface-muted); flex-shrink: 0; }
.tc-folder-row__icon { color: var(--on-surface-muted); flex-shrink: 0; }
.tc-folder-row__label { font-size: var(--mp-text-label-fontSize); font-weight: var(--mp-fontWeight-semibold); }

.tc-file-row {
  display: flex;
  align-items: center;
  border-radius: var(--r-chip);
}
.tc-file-row:hover { background: var(--surface-secondary); }
.tc-file-row--active,
.tc-file-row--active:hover { background: var(--accent-soft); }
.tc-file-row--nested .tc-file-row__main { padding-left: var(--mp-space-32); }

.tc-file-row__main {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  flex: 1;
  min-width: 0;
  padding: var(--mp-space-4) var(--mp-space-12);
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: var(--text-primary);
}
.tc-file-row__main:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.tc-file-row__icon { color: var(--on-surface-muted); flex-shrink: 0; }
.tc-file-row__label { font-size: var(--mp-fontSize-13); }
.tc-file-row__close { flex-shrink: 0; margin-right: var(--mp-space-4); opacity: 0; transition: opacity var(--dur-fast); }
.tc-file-row:hover .tc-file-row__close,
.tc-file-row--active .tc-file-row__close,
.tc-file-row:focus-within .tc-file-row__close { opacity: 1; }

.tc-dot {
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--r-pill);
  flex-shrink: 0;
  margin-left: auto;
  background: var(--accent);
}
.tc-dot--tab { margin-left: 0; }

/* ── Editor area ───────────────────────────────────────────────────── */
.tc-editor-area { background: var(--surface-canvas); }

.tc-tabs { flex-shrink: 0; overflow-x: auto; }
.tc-tab {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  padding: 0 var(--mp-space-6) 0 var(--mp-space-12);
  border-right: 1px solid var(--border-subtle);
  cursor: pointer;
  flex-shrink: 0;
  max-width: 220px;
  color: var(--on-surface-muted);
  border-top: 2px solid transparent;
}
.tc-tab--active {
  background: var(--surface-canvas);
  color: var(--text-primary);
  border-top-color: var(--accent);
}
.tc-tab__label {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  min-width: 0;
  padding: var(--mp-space-8) 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: inherit;
  font-size: var(--mp-fontSize-13);
}
.tc-tab__label:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.tc-tab__icon { color: var(--on-surface-muted); flex-shrink: 0; }
.tc-tab__close { flex-shrink: 0; }

.tc-editor {
  display: flex;
  min-height: 0;
  overflow: hidden;
  background: var(--surface-canvas);
}

.tc-gutter {
  flex-shrink: 0;
  padding: var(--mp-space-12) var(--mp-space-8) var(--mp-space-12) var(--mp-space-12);
  overflow: hidden;
  text-align: right;
  user-select: none;
  font-family: var(--mp-fontFamily-mono, monospace);
  font-size: var(--mp-fontSize-13);
  line-height: 1.6;
  color: var(--text-disabled);
  background: var(--surface-secondary);
  border-right: 1px solid var(--border-subtle);
}
.tc-gutter__line { height: calc(var(--mp-fontSize-13) * 1.6); }

.tc-textarea {
  flex: 1;
  min-width: 0;
  padding: var(--mp-space-12) var(--mp-space-16);
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--mp-fontFamily-mono, monospace);
  font-size: var(--mp-fontSize-13);
  line-height: 1.6;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}
.tc-textarea:focus-visible { outline: none; }
</style>
