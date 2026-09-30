<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import MpIconButton from '@/components/MpIconButton.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpTreeRow from '@/components/MpTreeRow.vue'
import { LUMOS_FOLDERS, fileLabel, folderOf, type ThemeEditorFile } from '@/stores/themeEditorLumosFiles'
import { languageIcon as iconFor } from './themeEditorIcons'

// The code editor's side panel (store builder re-skin): the VS Code-style Explorer — "Open editors",
// then the theme's folder tree with per-file actions — and the Search panel, on MpTreeRow rows.
// Dirty files show a dot on the row and on their folder; the "…" menu toggles the two explorer
// sections, exactly as the UAT explorer does. Semantics are a disclosure list (nested role=list),
// not an ARIA tree: no arrow-key contract is promised that the panel doesn't keep.

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
let newNameInput: { focus: () => void } | null = null
const bindNewName = (el: unknown) => { newNameInput = (el as { focus: () => void } | null) ?? null }

function startCreate() {
  creating.value = true
  newName.value = ''
  nextTick(() => newNameInput?.focus())
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
let renameInput: { focus: () => void } | null = null
const bindRename = (el: unknown) => { renameInput = (el as { focus: () => void } | null) ?? null }

function startRename(path: string) {
  renaming.value = path
  renameValue.value = fileLabel(path)
  nextTick(() => renameInput?.focus())
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
      <div class="te-explorer__scroll">
        <div role="list" aria-label="Search results">
          <div v-for="file in results" :key="file.path" role="listitem">
            <MpTreeRow :label="file.path" :icon="iconFor(file.language)" :selected="file.path === activePath" @select="emit('open', file.path)" />
          </div>
        </div>
        <div v-if="query.trim() && !results.length" class="te-explorer__empty">No results for “{{ query }}”.</div>
      </div>
    </template>

    <!-- ── Explorer panel ────────────────────────────────────────────────── -->
    <template v-else>
      <div class="te-explorer__head">
        <span class="mp-meta-label">Explorer</span>
        <v-menu location="bottom end" :close-on-content-click="false">
          <template #activator="{ props: menu }">
            <MpIconButton v-bind="menu" size="sm" icon="ellipsis" ariaLabel="Explorer views" aria-haspopup="menu" />
          </template>
          <v-list density="compact" role="menu" aria-label="Explorer views">
            <MpMenuItem title="Open editors" role="menuitemcheckbox" :aria-checked="showOpenEditors" @click="showOpenEditors = !showOpenEditors">
              <template #prepend>
                <v-icon class="te-menu-check" :class="{ 'te-menu-check--off': !showOpenEditors }">check</v-icon>
              </template>
            </MpMenuItem>
            <MpMenuItem title="Folders" role="menuitemcheckbox" :aria-checked="showFolders" @click="showFolders = !showFolders">
              <template #prepend>
                <v-icon class="te-menu-check" :class="{ 'te-menu-check--off': !showFolders }">check</v-icon>
              </template>
            </MpMenuItem>
          </v-list>
        </v-menu>
      </div>

      <div class="te-explorer__scroll">
        <!-- Open editors -->
        <section v-if="showOpenEditors" class="te-group" aria-label="Open editors">
          <div class="te-group__head">
            <button type="button" class="te-group__toggle" :aria-expanded="openEditorsExpanded" @click="openEditorsExpanded = !openEditorsExpanded">
              <v-icon class="te-group__chevron">{{ openEditorsExpanded ? 'chevron-down' : 'chevron-right' }}</v-icon>
              <span class="mp-meta-label">Open editors</span>
              <span v-if="openPaths.length" class="te-group__count">{{ openPaths.length }}</span>
            </button>
          </div>
          <div v-if="openEditorsExpanded" role="list" aria-label="Open editors">
            <div v-for="path in openPaths" :key="path" role="listitem">
              <MpTreeRow
                :label="fileLabel(path)"
                :icon="iconFor(files.find((f) => f.path === path)?.language ?? 'text')"
                :selected="path === activePath"
                @select="emit('open', path)"
              >
                <template v-if="dirtySet.has(path)" #meta>
                  <span class="te-dot" role="img" aria-label="Unsaved changes" />
                </template>
                <template #actions>
                  <MpIconButton size="sm" icon="x" :ariaLabel="`Close ${fileLabel(path)}`" @click.stop="emit('close', path)" />
                </template>
              </MpTreeRow>
            </div>
            <div v-if="!openPaths.length" class="te-explorer__empty">No open files.</div>
          </div>
        </section>

        <!-- Folders -->
        <section v-if="showFolders" class="te-group" :aria-label="`${themeName} files`">
          <div class="te-group__head">
            <span class="te-group__toggle te-group__toggle--static">
              <v-icon class="te-group__chevron">chevron-down</v-icon>
              <span class="mp-meta-label text-truncate">{{ themeName }}</span>
            </span>
            <span class="te-group__actions">
              <MpIconButton size="sm" icon="file-plus" ariaLabel="New file" @click="startCreate" />
              <MpIconButton size="sm" icon="copy-minus" ariaLabel="Collapse all folders" @click="collapseAll" />
            </span>
          </div>

          <div v-if="creating" class="te-inline-field">
            <v-text-field
              :ref="bindNewName"
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

          <div role="list" :aria-label="`${themeName} files`">
            <div v-for="folder in tree" :key="folder.name" role="listitem">
              <MpTreeRow
                :label="folder.name"
                :icon="expanded.has(folder.name) ? 'folder-open' : 'folder'"
                expandable
                :expanded="expanded.has(folder.name)"
                @select="toggleFolder(folder.name)"
                @toggle="toggleFolder(folder.name)"
              >
                <template v-if="folder.dirty" #meta>
                  <span class="te-dot" role="img" aria-label="Contains unsaved changes" />
                </template>
              </MpTreeRow>

              <div v-if="expanded.has(folder.name)" role="list" :aria-label="folder.name">
                <div v-for="file in folder.files" :key="file.path" role="listitem">
                  <div v-if="renaming === file.path" class="te-inline-field te-inline-field--nested">
                    <v-text-field
                      :ref="bindRename"
                      v-model="renameValue"
                      aria-label="New name"
                      density="compact"
                      hide-details
                      @keydown.enter.prevent="commitRename"
                      @keydown.esc.prevent="renaming = null"
                      @blur="commitRename"
                    />
                  </div>
                  <MpTreeRow
                    v-else
                    :label="fileLabel(file.path)"
                    :icon="iconFor(file.language)"
                    :depth="1"
                    :selected="file.path === activePath"
                    @select="emit('open', file.path)"
                  >
                    <template v-if="dirtySet.has(file.path)" #meta>
                      <span class="te-dot" role="img" aria-label="Unsaved changes" />
                    </template>
                    <template #actions>
                      <MpRowActionsMenu size="sm" ariaLabel="File actions" :itemLabel="fileLabel(file.path)">
                        <MpMenuItem title="Rename" icon="pencil" @click="startRename(file.path)" />
                        <v-divider class="my-1" />
                        <MpMenuItem title="Delete" icon="trash-2" danger @click="emit('remove', file.path)" />
                      </MpRowActionsMenu>
                    </template>
                  </MpTreeRow>
                </div>
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
  background: var(--surface-primary);
  color: var(--on-surface);
}

.te-explorer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  flex-shrink: 0;
  min-height: var(--mp-component-control-height);
  padding-inline: var(--mp-space-12) var(--mp-space-8);
  color: var(--text-secondary);
}

.te-explorer__search {
  padding: 0 var(--mp-space-8) var(--mp-space-8);
}

.te-explorer__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--mp-space-8) var(--mp-space-16);
}

.te-explorer__empty {
  padding: var(--mp-space-8) var(--mp-space-12);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
}

/* Group headers (Open editors / LUMOS) — disclosure headers on the tree row height,
   their chevron in the rows' disclosure column so everything shares one left edge. */
.te-group + .te-group {
  margin-block-start: var(--mp-space-8);
  padding-block-start: var(--mp-space-8);
  border-top: 1px solid var(--border-subtle);
}

.te-group__head {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  min-height: var(--mp-component-tree-rowHeight);
  padding-inline-end: var(--mp-space-4);
}

.te-group__toggle {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  flex: 1 1 auto;
  min-width: 0;
  min-height: var(--mp-component-tree-rowHeight);
  padding-inline: var(--mp-component-tree-paddingInline);
  border: 0;
  border-radius: var(--mp-component-tree-radius);
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.te-group__toggle:hover {
  background: var(--surface-secondary);
}

.te-group__toggle:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.te-group__toggle--static,
.te-group__toggle--static:hover {
  background: transparent;
  cursor: default;
}

.te-group__chevron {
  flex: 0 0 var(--mp-component-iconButton-size-sm);
  font-size: var(--mp-component-tree-iconSize);
  color: var(--icon-secondary);
}

.te-group__count {
  margin-inline-start: var(--mp-space-4);
  font-size: var(--mp-fontSize-11);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.te-group__actions {
  display: inline-flex;
  gap: var(--mp-space-2);
}

.te-dot {
  display: inline-block;
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--r-pill);
  background: var(--warn);
}

/* Inline name fields line up with the label column of the row they replace. */
.te-inline-field {
  padding-block: var(--mp-space-2);
  padding-inline: calc(var(--mp-component-tree-paddingInline) + var(--mp-component-iconButton-size-sm)) var(--mp-space-4);
}

.te-inline-field--nested {
  padding-inline-start: calc(var(--mp-component-tree-paddingInline) + var(--mp-component-tree-indent) + var(--mp-component-iconButton-size-sm));
}

.te-menu-check {
  font-size: var(--mp-component-tree-iconSize);
}

.te-menu-check--off {
  visibility: hidden;
}
</style>
