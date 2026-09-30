<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import MpListRow from '@/components/MpListRow.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import { LUMOS_FOLDERS, fileLabel, folderOf, type ThemeEditorFile } from '@/stores/themeEditorLumosFiles'
import { languageIcon as iconFor } from './themeEditorIcons'

// The code editor's side panel (store builder re-skin): the VS Code-style Explorer — "Open editors",
// then the theme's folder tree with per-file actions — and the Search panel, on MpListRow rows.
// Dirty files show a dot on the row and on their folder; the "…" menu toggles the two explorer
// sections, exactly as the UAT explorer does.

const props = withDefaults(defineProps<{
  files: ThemeEditorFile[]
  /** Shown as the tree's root group ("LUMOS"). */
  themeName: string
  dirtyPaths: string[]
  openPaths: string[]
  activePath: string | null
  mode?: 'explorer' | 'search'
}>(), { mode: 'explorer' })

const emit = defineEmits<{
  open: [path: string]
  close: [path: string]
  create: [path: string]
  rename: [path: string, nextPath: string]
  remove: [path: string]
}>()

const dirtySet = computed(() => new Set(props.dirtyPaths))

// ── Explorer sections (the "…" menu) ──────────────────────────────────────────
const showOpenEditors = ref(true)
const showFolders = ref(true)
const openEditorsExpanded = ref(false)

// ── Tree ──────────────────────────────────────────────────────────────────────
const tree = computed(() =>
  LUMOS_FOLDERS.map((folder) => ({
    name: folder,
    files: props.files.filter((file) => folderOf(file.path) === folder),
    dirty: props.files.some((file) => folderOf(file.path) === folder && dirtySet.value.has(file.path)),
  })).filter((folder) => folder.files.length > 0),
)

// Folders start collapsed except the one holding the open file — the UAT tree opens on "templates".
const expanded = ref<Set<string>>(new Set([folderOf(props.activePath ?? '') ?? 'templates']))

function toggleFolder(name: string) {
  const next = new Set(expanded.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  expanded.value = next
}

function collapseAll() {
  expanded.value = new Set()
}

watch(
  () => props.activePath,
  (path) => {
    const folder = folderOf(path ?? '')
    if (folder && !expanded.value.has(folder)) expanded.value = new Set([...expanded.value, folder])
  },
)

// ── New file (inline, at the top of the tree) ─────────────────────────────────
const creating = ref(false)
const newName = ref('')
const newNameInput = ref<{ focus: () => void } | null>(null)

function startCreate() {
  creating.value = true
  newName.value = ''
  nextTick(() => newNameInput.value?.focus())
}

function commitCreate() {
  const name = newName.value.trim().replace(/^\/+/, '')
  creating.value = false
  if (!name) return
  emit('create', name)
}

// ── Rename (inline, in the row) ───────────────────────────────────────────────
const renaming = ref<string | null>(null)
const renameValue = ref('')
const renameInput = ref<{ focus: () => void } | null>(null)

function startRename(path: string) {
  renaming.value = path
  renameValue.value = fileLabel(path)
  nextTick(() => renameInput.value?.focus())
}

function commitRename() {
  const path = renaming.value
  const label = renameValue.value.trim()
  renaming.value = null
  if (!path || !label || label === fileLabel(path)) return
  const folder = folderOf(path)
  emit('rename', path, folder ? `${folder}/${label}` : label)
}

// ── Search ────────────────────────────────────────────────────────────────────
const query = ref('')
const results = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return []
  return props.files
    .filter((file) => file.path.toLowerCase().includes(term) || (file.language !== 'image' && file.content.toLowerCase().includes(term)))
    .slice(0, 50)
})
</script>

<template>
  <div class="te-explorer" :aria-label="mode === 'search' ? 'Search' : 'Explorer'">
    <!-- ── Search panel ──────────────────────────────────────────────────── -->
    <template v-if="mode === 'search'">
      <div class="te-explorer__head">
        <span class="mp-meta-label">Search</span>
      </div>
      <div class="te-explorer__search">
        <!-- Toolbar search: placeholder + aria-label, no details row (chrome exemption). -->
        <v-text-field v-model="query" placeholder="Search" aria-label="Search theme files" prepend-inner-icon="search" density="compact" hide-details clearable />
      </div>
      <div class="te-explorer__scroll" role="list" aria-label="Search results">
        <MpListRow
          v-for="file in results"
          :key="file.path"
          density="compact"
          clickable
          class="te-row"
          :class="{ 'te-row--active': file.path === activePath }"
          :title="file.path"
          role="listitem"
          @click="emit('open', file.path)"
        >
          <template #lead>
            <v-icon size="15" class="te-row__icon">{{ iconFor(file.language) }}</v-icon>
          </template>
        </MpListRow>
        <div v-if="query.trim() && !results.length" class="te-explorer__empty">No results for “{{ query }}”.</div>
      </div>
    </template>

    <!-- ── Explorer panel ────────────────────────────────────────────────── -->
    <template v-else>
      <div class="te-explorer__head">
        <span class="mp-meta-label">Explorer</span>
        <v-menu location="bottom end" :close-on-content-click="false">
          <template #activator="{ props: menu }">
            <v-btn v-bind="menu" icon="ellipsis" variant="text" size="x-small" aria-label="Explorer views" aria-haspopup="menu" />
          </template>
          <v-list density="compact" role="menu" aria-label="Explorer views">
            <MpMenuItem title="Open editors" :active="showOpenEditors" @click="showOpenEditors = !showOpenEditors">
              <template #prepend>
                <v-icon size="15" :class="{ 'te-menu-check--off': !showOpenEditors }">check</v-icon>
              </template>
            </MpMenuItem>
            <MpMenuItem title="Folders" :active="showFolders" @click="showFolders = !showFolders">
              <template #prepend>
                <v-icon size="15" :class="{ 'te-menu-check--off': !showFolders }">check</v-icon>
              </template>
            </MpMenuItem>
          </v-list>
        </v-menu>
      </div>

      <div class="te-explorer__scroll">
        <!-- Open editors -->
        <section v-if="showOpenEditors" class="te-group" aria-label="Open editors">
          <button
            type="button"
            class="te-group__head"
            :aria-expanded="openEditorsExpanded"
            @click="openEditorsExpanded = !openEditorsExpanded"
          >
            <v-icon size="14" class="te-group__chevron">{{ openEditorsExpanded ? 'chevron-down' : 'chevron-right' }}</v-icon>
            <span class="mp-meta-label">Open editors</span>
            <span v-if="openPaths.length" class="te-group__count">{{ openPaths.length }}</span>
          </button>
          <div v-show="openEditorsExpanded" role="list">
            <MpListRow
              v-for="path in openPaths"
              :key="path"
              density="compact"
              clickable
              class="te-row te-row--open-editor"
              :class="{ 'te-row--active': path === activePath }"
              role="listitem"
              @click="emit('open', path)"
            >
              <template #lead>
                <v-btn
                  icon="x"
                  variant="text"
                  size="x-small"
                  class="te-row__close"
                  :aria-label="`Close ${fileLabel(path)}`"
                  @click.stop="emit('close', path)"
                />
                <v-icon size="15" class="te-row__icon">{{ iconFor(files.find((f) => f.path === path)?.language ?? 'text') }}</v-icon>
              </template>
              <span class="te-row__label">{{ fileLabel(path) }}</span>
              <template #trailing>
                <span v-if="dirtySet.has(path)" class="te-dot" aria-label="Unsaved changes" />
              </template>
            </MpListRow>
            <div v-if="!openPaths.length" class="te-explorer__empty">No open files.</div>
          </div>
        </section>

        <!-- Folders -->
        <section v-if="showFolders" class="te-group" :aria-label="`${themeName} files`">
          <div class="te-group__head te-group__head--root">
            <v-icon size="14" class="te-group__chevron">chevron-down</v-icon>
            <span class="mp-meta-label text-truncate">{{ themeName }}</span>
            <span class="te-group__actions">
              <v-btn icon="file-plus" variant="text" size="x-small" aria-label="New file" @click="startCreate" />
              <v-btn icon="copy-minus" variant="text" size="x-small" aria-label="Collapse all folders in explorer" @click="collapseAll" />
            </span>
          </div>

          <div v-if="creating" class="te-inline-field">
            <v-text-field
              ref="newNameInput"
              v-model="newName"
              placeholder="folder/new-file.html"
              aria-label="New file name"
              density="compact"
              hide-details
              @keydown.enter.prevent="commitCreate"
              @keydown.esc.prevent="creating = false"
              @blur="commitCreate"
            />
          </div>

          <div role="tree" :aria-label="`${themeName} files`">
            <div v-for="folder in tree" :key="folder.name" role="treeitem" :aria-expanded="expanded.has(folder.name)" :aria-label="folder.name">
              <MpListRow density="compact" clickable class="te-row te-row--folder" @click="toggleFolder(folder.name)">
                <template #lead>
                  <v-icon size="14" class="te-row__chevron">{{ expanded.has(folder.name) ? 'chevron-down' : 'chevron-right' }}</v-icon>
                  <v-icon size="15" class="te-row__icon">{{ expanded.has(folder.name) ? 'folder-open' : 'folder' }}</v-icon>
                </template>
                <span class="te-row__label">{{ folder.name }}</span>
                <template #trailing>
                  <span v-if="folder.dirty" class="te-dot" aria-label="Unsaved changes" />
                </template>
              </MpListRow>

              <div v-show="expanded.has(folder.name)" role="group" class="te-tree__children">
                <template v-for="file in folder.files" :key="file.path">
                  <div v-if="renaming === file.path" class="te-inline-field te-inline-field--nested">
                    <v-text-field
                      ref="renameInput"
                      v-model="renameValue"
                      aria-label="New name"
                      density="compact"
                      hide-details
                      @keydown.enter.prevent="commitRename"
                      @keydown.esc.prevent="renaming = null"
                      @blur="commitRename"
                    />
                  </div>
                  <MpListRow
                    v-else
                    density="compact"
                    clickable
                    class="te-row te-row--file"
                    :class="{ 'te-row--active': file.path === activePath }"
                    role="treeitem"
                    :aria-selected="file.path === activePath"
                    @click="emit('open', file.path)"
                  >
                    <template #lead>
                      <v-icon size="15" class="te-row__icon" :class="`te-row__icon--${file.language}`">{{ iconFor(file.language) }}</v-icon>
                    </template>
                    <span class="te-row__label">{{ fileLabel(file.path) }}</span>
                    <template #trailing>
                      <span v-if="dirtySet.has(file.path)" class="te-dot" aria-label="Unsaved changes" />
                      <span class="te-row__actions">
                        <MpRowActionsMenu ariaLabel="File actions" :itemLabel="fileLabel(file.path)">
                          <MpMenuItem title="Rename" icon="pencil" @click="startRename(file.path)" />
                          <v-divider class="my-1" />
                          <MpMenuItem title="Delete" icon="trash-2" danger @click="emit('remove', file.path)" />
                        </MpRowActionsMenu>
                      </span>
                    </template>
                  </MpListRow>
                </template>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.te-explorer {
  display: flex;
  flex-direction: column;
  width: var(--mp-component-editor-explorerWidth);
  flex-shrink: 0;
  min-height: 0;
  border-right: 1px solid var(--border-subtle);
  background: var(--surface-secondary);
  color: var(--on-surface);
}

.te-explorer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  flex-shrink: 0;
  min-height: var(--mp-component-control-height);
  padding-inline: var(--mp-component-listItem-paddingInline);
  color: var(--text-secondary);
}

.te-explorer__search {
  padding: 0 var(--mp-component-listItem-paddingInline) var(--mp-space-8);
}

.te-explorer__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: var(--mp-space-16);
}

.te-explorer__empty {
  padding: var(--mp-space-8) var(--mp-component-listItem-paddingInline);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
}

/* Group headers (Open editors / LUMOS) — disclosure rows on the listItem inset. */
.te-group + .te-group {
  border-top: 1px solid var(--border-subtle);
}

.te-group__head {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  width: 100%;
  min-height: var(--mp-space-32);
  padding-inline: var(--mp-space-6) var(--mp-component-listItem-paddingInline);
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  font: inherit;
}

.te-group__head--root {
  cursor: default;
}

.te-group__head:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.te-group__chevron {
  color: var(--text-muted);
}

.te-group__count {
  margin-left: var(--mp-space-4);
  font-size: var(--mp-fontSize-11);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.te-group__actions {
  display: inline-flex;
  margin-left: auto;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}

.te-group__head:hover .te-group__actions,
.te-group__head:focus-within .te-group__actions {
  opacity: 1;
}

/* Rows — MpListRow at the compact tier; the row primitive owns height, gap and hover. */
.te-row {
  padding-inline: var(--mp-component-listItem-paddingInline);
  margin-inline: 0;
  border-radius: 0;
  font-size: var(--mp-fontSize-12);
}

.te-row--file,
.te-row--open-editor {
  padding-left: var(--mp-space-32);
}

.te-tree__children .te-row--file {
  padding-left: var(--mp-space-40);
}

.te-row--active {
  background: var(--accent-selected-bg);
  color: var(--accent-on-container);
}

.te-row__label {
  font-size: var(--mp-fontSize-12);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.te-row__chevron,
.te-row__icon {
  color: var(--icon-secondary);
}

.te-row--active .te-row__icon {
  color: currentColor;
}

/* Per-row actions stay in the DOM (keyboard-reachable) and fade in on hover/focus. */
.te-row__actions,
.te-row__close {
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}

.te-row:hover .te-row__actions,
.te-row:focus-within .te-row__actions,
.te-row:hover .te-row__close,
.te-row:focus-within .te-row__close {
  opacity: 1;
}

.te-dot {
  display: inline-block;
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--r-pill);
  background: var(--warn);
}

.te-inline-field {
  padding: var(--mp-space-4) var(--mp-component-listItem-paddingInline);
}

.te-inline-field--nested {
  padding-left: var(--mp-space-32);
}

.te-menu-check--off {
  visibility: hidden;
}
</style>
