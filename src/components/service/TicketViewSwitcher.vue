<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import MpListRow from '@/components/MpListRow.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { isDuplicateName } from '@/service/model'
import { useTicketsStore, type Ticket } from '@/stores/useTickets'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import {
  BUILT_IN_VIEWS,
  inInbox,
  isBuiltInView,
  isOpen,
  matchesBuiltInView,
  matchesFilters,
  viewPosition,
} from '@/service/ticketFilters'

/**
 * TicketViewSwitcher — inbox × view picker for the ticket list.
 *
 * Replaces a flat menu that repeated every view under every inbox in small caps
 * and let Trash scroll away. Search finds a view across inboxes; each inbox is a
 * collapsible group (open state remembered) with its own custom views and open
 * counts; Spam and Trash are pinned below the scroll.
 *
 * Saved (custom) views are managed in place: drag by the row with a drop line,
 * Alt+↑/↓, or the ⋯ menu (Rename, Edit filters, Move up/down, Delete). Every
 * move is announced. Built-in views stay fixed at the top of each group.
 */
const props = defineProps<{
  /** `'all'`, an `Inbox.id`, `'spam'` or `'trash'`. */
  inbox: string
  view: string
  /** Who "My Tickets" means. */
  currentAgent: string
}>()

const emit = defineEmits<{
  select: [inbox: string, view: string]
  /** A saved view was renamed — the page updates its current view if it was this one. */
  renamed: [inbox: string, from: string, to: string]
  /** A saved view was deleted — the page falls back to All Tickets if it was open. */
  deleted: [inbox: string, name: string]
  /** Open this view with the Filters drawer, to change its criteria. */
  editFilters: [inbox: string, name: string]
}>()

const tickets = useTicketsStore()
const settings = useServiceSettingsStore()
const uid = useId()

const open = ref(false)
const query = ref('')
const searchBox = ref<HTMLElement | null>(null)

// ── Groups, views, counts ───────────────────────────────────────────────────
interface ViewRow { inbox: string; name: string; count: number; custom: boolean }
interface Group { id: string; name: string; icon: string; open: number; views: ViewRow[] }

function countFor(inbox: string, view: string): number {
  const base = tickets.visibleTickets.filter(t => inInbox(t, inbox) && isOpen(t))
  if (isBuiltInView(view)) return base.filter(t => matchesBuiltInView(t, view, props.currentAgent)).length
  const saved = tickets.customViews.find(v => v.name === view && v.inboxId === inbox)
  return saved ? base.filter((t: Ticket) => matchesFilters(t, saved.filters)).length : 0
}

const groups = computed<Group[]>(() =>
  [{ id: 'all', name: 'All inboxes', icon: 'inbox' }, ...settings.inboxes.map(i => ({ id: i.id, name: i.name, icon: 'mail' }))]
    .map(group => ({
      ...group,
      open: tickets.visibleTickets.filter(t => inInbox(t, group.id) && isOpen(t)).length,
      views: [
        ...BUILT_IN_VIEWS,
        ...tickets.customViews.filter(v => v.inboxId === group.id).map(v => v.name),
      ].map(name => ({ inbox: group.id, name, count: countFor(group.id, name), custom: !isBuiltInView(name) })),
    })),
)

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return groups.value.flatMap(group =>
    group.views
      .filter(view => view.name.toLowerCase().includes(q) || group.name.toLowerCase().includes(q))
      .map(view => ({ ...view, inboxName: group.name })),
  )
})
const liveMessage = computed(() =>
  query.value.trim() ? `${results.value.length} view${results.value.length === 1 ? '' : 's'} found` : '',
)

const isActive = (inbox: string, view: string) => props.inbox === inbox && props.view === view

// ── Collapsible groups, remembered per user ─────────────────────────────────
const STORAGE_KEY = 'mp.tickets.viewsExpanded.v1'
function readExpanded(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}
const expanded = ref<string[]>(readExpanded())
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded.value)) } catch { /* private mode */ }
}
function toggle(id: string) {
  expanded.value = expanded.value.includes(id) ? expanded.value.filter(x => x !== id) : [...expanded.value, id]
  persist()
}

// Opening always shows where you are: the active inbox's group is expanded.
watch(open, opened => {
  if (!opened) {
    query.value = ''
    moveMessage.value = ''
    renaming.value = null
    actionsFor.value = null
    return
  }
  const activeGroup = props.inbox === 'spam' || props.inbox === 'trash' ? null : props.inbox
  if (activeGroup && !expanded.value.includes(activeGroup)) {
    expanded.value = [...expanded.value, activeGroup]
    persist()
  }
})

// Focus the search once the overlay has finished entering — before that the
// panel is still hidden by the transition and can't take focus.
function focusSearch() {
  searchBox.value?.querySelector('input')?.focus()
}

function select(inbox: string, view: string) {
  emit('select', inbox, view)
  open.value = false
}

// ── Saved views: reorder, rename, delete ────────────────────────────────────
// The ⋯ menu is controlled here and doesn't close on its own content click:
// Vuetify closes every parent menu when a nested menu's item is clicked, which
// would shut the whole switcher on Rename or Move. Each action closes it instead.
const actionsFor = ref<string | null>(null)
const keyOf = (inbox: string, name: string) => `${inbox}::${name}`
function runAction(action: () => void) {
  actionsFor.value = null
  action()
}
/** The panel is a v-card, so the ref is the component; its root element is `$el`. */
const panelRef = ref<{ $el: HTMLElement } | null>(null)
const panelEl = computed(() => panelRef.value?.$el ?? null)
const moveMessage = ref('')
const groupName = (inbox: string) => (inbox === 'all' ? 'All inboxes' : settings.inboxName(inbox))
const positionOf = (inbox: string, name: string) => viewPosition(tickets.customViews, inbox, name)

/** Puts focus back on a view row's button — a moved or re-rendered row loses it. */
async function focusView(inbox: string, name: string) {
  await nextTick()
  panelEl.value
    ?.querySelector<HTMLElement>(`[data-view-key="${CSS.escape(`${inbox}::${name}`)}"] .mp-list-row__hit`)
    ?.focus()
}

function moveTo(inbox: string, name: string, toIndex: number, refocus = true) {
  tickets.moveView(inbox, name, toIndex)
  const { index, total } = positionOf(inbox, name)
  moveMessage.value = `${name} moved to position ${index + 1} of ${total} in ${groupName(inbox)}`
  if (refocus) void focusView(inbox, name)
}
function nudge(inbox: string, name: string, delta: number) {
  const { index, total } = positionOf(inbox, name)
  const to = index + delta
  if (to >= 0 && to < total) moveTo(inbox, name, to)
}
function onRowKeydown(event: KeyboardEvent, inbox: string, name: string) {
  if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
  event.preventDefault()
  nudge(inbox, name, event.key === 'ArrowUp' ? -1 : 1)
}

// Native drag (the StoreLineupCard pattern), only within the view's own inbox.
// The row under the pointer shows a drop line above or below itself.
const dragging = ref<{ inbox: string; name: string } | null>(null)
const dropTarget = ref<{ name: string; place: 'before' | 'after' } | null>(null)
function onDragStart(event: DragEvent, inbox: string, name: string) {
  dragging.value = { inbox, name }
  event.dataTransfer?.setData('text/plain', name)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}
function onDragOver(event: DragEvent, inbox: string, name: string) {
  const from = dragging.value
  if (!from || from.inbox !== inbox) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  if (from.name === name) {
    dropTarget.value = null
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dropTarget.value = { name, place: event.clientY < rect.top + rect.height / 2 ? 'before' : 'after' }
}
function onDrop(event: DragEvent, inbox: string) {
  const from = dragging.value
  const target = dropTarget.value
  dragging.value = null
  dropTarget.value = null
  if (!from || !target || from.inbox !== inbox) return
  event.preventDefault()
  const fromIndex = positionOf(inbox, from.name).index
  let to = positionOf(inbox, target.name).index + (target.place === 'after' ? 1 : 0)
  if (fromIndex < to) to -= 1
  if (to !== fromIndex) moveTo(inbox, from.name, to, false)
}
function onDragEnd() {
  dragging.value = null
  dropTarget.value = null
}
const dropClass = (name: string) =>
  dropTarget.value?.name === name ? `tvs-row--drop-${dropTarget.value.place}` : ''

// Rename in place: Enter saves, Escape cancels (without closing the menu).
const renaming = ref<{ inbox: string; name: string } | null>(null)
const renameValue = ref('')
const renameError = computed(() => {
  const target = renaming.value
  if (!target) return ''
  const value = renameValue.value.trim()
  if (!value) return 'Enter a name.'
  const names = [...BUILT_IN_VIEWS, ...tickets.customViews.filter(v => v.inboxId === target.inbox).map(v => v.name)]
  return isDuplicateName(names.map(n => ({ id: n, name: n })), value, target.name)
    ? 'A view with this name already exists here.'
    : ''
})
function startRename(inbox: string, name: string) {
  renaming.value = { inbox, name }
  renameValue.value = name
  // After the ⋯ menu has closed and handed focus back, take it for the field.
  setTimeout(() => {
    const input = panelEl.value?.querySelector<HTMLInputElement>('.tvs-rename input')
    input?.focus()
    input?.select()
  }, 150)
}
function commitRename() {
  const target = renaming.value
  if (!target || renameError.value) return
  const to = renameValue.value.trim()
  renaming.value = null
  if (to !== target.name) {
    tickets.renameView(target.inbox, target.name, to)
    emit('renamed', target.inbox, target.name, to)
  }
  void focusView(target.inbox, to)
}
function cancelRename() {
  const target = renaming.value
  renaming.value = null
  if (target) void focusView(target.inbox, target.name)
}
/** Leaving the field keeps a valid change and drops an invalid one. */
function onRenameBlur() {
  if (!renaming.value) return
  if (renameError.value) renaming.value = null
  else commitRename()
}
const isRenaming = (inbox: string, name: string) => renaming.value?.inbox === inbox && renaming.value.name === name

const deleting = ref<{ inbox: string; name: string } | null>(null)
const deleteOpen = computed({
  get: () => !!deleting.value,
  set: value => { if (!value) deleting.value = null },
})
function askDelete(inbox: string, name: string) {
  open.value = false
  deleting.value = { inbox, name }
}
function confirmDelete() {
  const target = deleting.value
  if (!target) return
  tickets.deleteView(target.inbox, target.name)
  emit('deleted', target.inbox, target.name)
  deleting.value = null
}

function editFilters(inbox: string, name: string) {
  open.value = false
  emit('editFilters', inbox, name)
}

// ── Trigger ─────────────────────────────────────────────────────────────────
const label = computed(() => {
  if (props.inbox === 'spam') return 'Spam'
  if (props.inbox === 'trash') return 'Trash'
  const inbox = props.inbox === 'all' ? 'All inboxes' : settings.inboxName(props.inbox)
  return `${inbox} · ${props.view}`
})
const triggerIcon = computed(() =>
  props.inbox === 'spam' ? 'shield-alert' : props.inbox === 'trash' ? 'trash-2' : 'inbox',
)
</script>

<template>
  <v-menu
    v-model="open"
    location="bottom start"
    :close-on-content-click="false"
    max-width="calc(100vw - 32px)"
    @after-enter="focusSearch"
  >
    <template #activator="{ props: activator }">
      <button
        v-bind="activator"
        type="button"
        class="tvs-trigger d-flex align-center ga-2"
        aria-haspopup="dialog"
        :aria-expanded="open"
        :aria-label="`Inbox and view: ${label}. Change`"
      >
        <v-icon size="18" class="tvs-muted">{{ triggerIcon }}</v-icon>
        <span class="tvs-trigger__label text-body-2 text-truncate">{{ label }}</span>
        <v-icon size="16" class="tvs-muted ms-auto">{{ open ? 'chevron-up' : 'chevron-down' }}</v-icon>
      </button>
    </template>

    <v-card ref="panelRef" flat border rounded="lg" class="tvs-panel d-flex flex-column" role="dialog" aria-label="Inboxes and views">
      <!-- Chrome, not a form field: placeholder + aria-label, no details row. -->
      <div ref="searchBox" class="tvs-search">
        <v-text-field
          v-model="query"
          placeholder="Find a view or inbox"
          aria-label="Find a view or inbox"
          prepend-inner-icon="search"
          density="compact"
          hide-details
          clearable
        ></v-text-field>
      </div>

      <div class="tvs-body">
        <!-- Every row shares one grid: a 20px lead column (icon, or a blank on
             views so their names sit under the inbox name), the name, then the
             count and a 16px indicator column (chevron / check / empty), so the
             counts line up in one column whatever the row. -->
        <template v-if="query.trim()">
          <MpListRow
            v-for="row in results"
            :key="`${row.inbox}-${row.name}`"
            clickable
            density="compact"
            :title="row.name"
            :subtitle="row.inboxName"
            :aria-current="isActive(row.inbox, row.name) ? 'true' : undefined"
            class="tvs-row"
            :class="{ 'tvs-row--active': isActive(row.inbox, row.name) }"
            @click="select(row.inbox, row.name)"
          >
            <template #lead>
              <v-icon size="20" class="tvs-lead tvs-muted">{{ row.inbox === 'all' ? 'inbox' : 'mail' }}</v-icon>
            </template>
            <template #trailing>
              <span class="tvs-trailing">
                <span class="tvs-count" :aria-label="`${row.count} open`">{{ row.count }}</span>
                <span class="tvs-indicator">
                  <v-icon v-if="isActive(row.inbox, row.name)" size="16" class="tvs-check">check</v-icon>
                </span>
              </span>
            </template>
          </MpListRow>
          <p v-if="!results.length" class="tvs-empty text-body-2 text-medium-emphasis">No views match “{{ query.trim() }}”.</p>
        </template>

        <template v-else>
          <section v-for="group in groups" :key="group.id" class="tvs-group">
            <MpListRow
              clickable
              density="compact"
              class="tvs-row"
              :aria-expanded="expanded.includes(group.id)"
              :aria-controls="`${uid}-${group.id}`"
              @click="toggle(group.id)"
            >
              <template #lead>
                <v-icon size="20" class="tvs-lead tvs-muted">{{ group.icon }}</v-icon>
              </template>
              <template #title>
                <span class="tvs-group__name">{{ group.name }}</span>
              </template>
              <template #trailing>
                <span class="tvs-trailing">
                  <span class="tvs-count" :aria-label="`${group.open} open`">{{ group.open }}</span>
                  <span class="tvs-indicator">
                    <v-icon size="16" class="tvs-muted">{{ expanded.includes(group.id) ? 'chevron-up' : 'chevron-down' }}</v-icon>
                  </span>
                </span>
              </template>
            </MpListRow>

            <div v-show="expanded.includes(group.id)" :id="`${uid}-${group.id}`">
              <template v-for="view in group.views" :key="view.name">
                <!-- Renaming a saved view: the row becomes its name field. -->
                <div v-if="isRenaming(group.id, view.name)" class="tvs-rename d-flex align-start">
                  <span class="tvs-lead" aria-hidden="true"></span>
                  <v-text-field
                    v-model="renameValue"
                    aria-label="View name"
                    density="compact"
                    :error-messages="renameError"
                    class="tvs-rename__field"
                    @keydown.enter.prevent="commitRename"
                    @keydown.esc.stop.prevent="cancelRename"
                    @blur="onRenameBlur"
                  ></v-text-field>
                </div>

                <!-- Saved view: drag, Alt+↑/↓, or ⋯ to manage it. -->
                <MpListRow
                  v-else-if="view.custom"
                  clickable
                  density="compact"
                  :title="view.name"
                  :aria-current="isActive(group.id, view.name) ? 'true' : undefined"
                  :data-view-key="`${group.id}::${view.name}`"
                  draggable="true"
                  class="tvs-row tvs-row--custom"
                  :class="[
                    { 'tvs-row--active': isActive(group.id, view.name), 'tvs-row--dragging': dragging?.name === view.name && dragging?.inbox === group.id },
                    dropClass(view.name),
                  ]"
                  @click="select(group.id, view.name)"
                  @keydown="onRowKeydown($event, group.id, view.name)"
                  @dragstart="onDragStart($event, group.id, view.name)"
                  @dragover="onDragOver($event, group.id, view.name)"
                  @drop="onDrop($event, group.id)"
                  @dragend="onDragEnd"
                >
                  <template #lead>
                    <v-icon size="16" class="tvs-lead tvs-grip" aria-hidden="true">grip-vertical</v-icon>
                  </template>
                  <template #actions>
                    <MpRowActionsMenu
                      ariaLabel="View actions"
                      :itemLabel="view.name"
                      :model-value="actionsFor === keyOf(group.id, view.name)"
                      :close-on-content-click="false"
                      @update:model-value="(isOpen: boolean) => { actionsFor = isOpen ? keyOf(group.id, view.name) : null }"
                    >
                      <MpMenuItem title="Rename" icon="pencil" @click="runAction(() => startRename(group.id, view.name))" />
                      <MpMenuItem title="Edit filters" icon="list-filter" @click="runAction(() => editFilters(group.id, view.name))" />
                      <MpMenuItem title="Move up" icon="arrow-up" :disabled="positionOf(group.id, view.name).index === 0"
                        @click="runAction(() => nudge(group.id, view.name, -1))">
                        <template #append><kbd class="tvs-kbd">Alt ↑</kbd></template>
                      </MpMenuItem>
                      <MpMenuItem title="Move down" icon="arrow-down"
                        :disabled="positionOf(group.id, view.name).index === positionOf(group.id, view.name).total - 1"
                        @click="runAction(() => nudge(group.id, view.name, 1))">
                        <template #append><kbd class="tvs-kbd">Alt ↓</kbd></template>
                      </MpMenuItem>
                      <v-divider class="my-1" />
                      <MpMenuItem title="Delete view" icon="trash-2" danger @click="runAction(() => askDelete(group.id, view.name))" />
                    </MpRowActionsMenu>
                  </template>
                  <template #trailing>
                    <span class="tvs-trailing">
                      <span class="tvs-count" :aria-label="`${view.count} open`">{{ view.count }}</span>
                      <span class="tvs-indicator">
                        <v-icon v-if="isActive(group.id, view.name)" size="16" class="tvs-check">check</v-icon>
                      </span>
                    </span>
                  </template>
                </MpListRow>

                <!-- Built-in view: fixed, no actions. -->
                <MpListRow
                  v-else
                  clickable
                  density="compact"
                  :title="view.name"
                  :aria-current="isActive(group.id, view.name) ? 'true' : undefined"
                  class="tvs-row"
                  :class="{ 'tvs-row--active': isActive(group.id, view.name) }"
                  @click="select(group.id, view.name)"
                >
                  <template #lead>
                    <span class="tvs-lead" aria-hidden="true"></span>
                  </template>
                  <template #trailing>
                    <span class="tvs-trailing">
                      <span class="tvs-count" :aria-label="`${view.count} open`">{{ view.count }}</span>
                      <span class="tvs-indicator">
                        <v-icon v-if="isActive(group.id, view.name)" size="16" class="tvs-check">check</v-icon>
                      </span>
                    </span>
                  </template>
                </MpListRow>
              </template>
            </div>
          </section>
        </template>
        <span class="d-sr-only" aria-live="polite">{{ moveMessage || liveMessage }}</span>
      </div>

      <!-- System folders: pinned, never scroll away. -->
      <div class="tvs-foot">
        <MpListRow
          v-for="folder in [
            { id: 'spam', name: 'Spam', icon: 'shield-alert', count: tickets.spamTickets.length },
            { id: 'trash', name: 'Trash', icon: 'trash-2', count: tickets.trashedTickets.length },
          ]"
          :key="folder.id"
          clickable
          density="compact"
          :title="folder.name"
          :aria-current="inbox === folder.id ? 'true' : undefined"
          class="tvs-row"
          :class="{ 'tvs-row--active': inbox === folder.id }"
          @click="select(folder.id, 'All Tickets')"
        >
          <template #lead>
            <v-icon size="20" class="tvs-lead tvs-muted">{{ folder.icon }}</v-icon>
          </template>
          <template #trailing>
            <span class="tvs-trailing">
              <span class="tvs-count" :aria-label="`${folder.count} ticket${folder.count === 1 ? '' : 's'}`">{{ folder.count }}</span>
              <span class="tvs-indicator">
                <v-icon v-if="inbox === folder.id" size="16" class="tvs-check">check</v-icon>
              </span>
            </span>
          </template>
        </MpListRow>
      </div>
    </v-card>
  </v-menu>

  <MpConfirmDialog
    v-model="deleteOpen"
    danger
    :title="`Delete “${deleting?.name ?? ''}”?`"
    message="The view is removed from the inbox menu. Tickets aren’t affected."
    confirm-label="Delete view"
    @confirm="confirmDelete"
  />
</template>

<style scoped>
/* ── Trigger: the list pane's title, not a field ─────────────────────────── */
.tvs-trigger {
  min-width: 0;
  flex: 1 1 auto;
  min-height: var(--mp-component-control-height);
  padding-inline: var(--mp-space-8);
  border: 0;
  border-radius: var(--mp-component-chip-radius);
  background: transparent;
  color: var(--on-surface);
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.tvs-trigger:hover { background: var(--surface-secondary); }
.tvs-trigger:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
.tvs-trigger__label { font-weight: var(--mp-fontWeight-medium); }
.tvs-muted { color: var(--on-surface-muted); }

/* ── Panel: search · scrolling groups · pinned folders ───────────────────── */
.tvs-panel {
  width: var(--mp-component-menu-panelWidth);
  max-width: 100%;
  background: var(--surface-overlay);
  color: var(--on-surface);
}
.tvs-search {
  padding: var(--mp-space-8);
  border-bottom: 1px solid var(--border-subtle);
}
/* Interactive MpListRow bleeds its hover into the container's gutter by
   listItem.paddingInline; the extra space.8 keeps every highlight inset from the
   panel edge (level with the search field) and every label on one left edge. */
.tvs-body,
.tvs-foot {
  padding: var(--mp-space-4) calc(var(--mp-component-listItem-paddingInline) + var(--mp-space-8));
}
.tvs-body {
  max-height: var(--mp-component-menu-panelMaxHeight);
  overflow-y: auto;
}
.tvs-foot { border-top: 1px solid var(--border-subtle); }

/* Menu density (component.menu.itemHeight), not the compact 26px row. The row is
   a <button>, so it won't stretch on its own: size it to the body plus both of
   its bleed margins, so the highlight is inset evenly on the left and right. */
.tvs-row {
  width: calc(100% + 2 * var(--mp-component-listItem-paddingInline));
  min-height: var(--mp-component-menu-itemHeight);
}
.tvs-row--active { background: var(--accent-soft); }

/* Inbox names read as names, not small-caps section labels. */
.tvs-group + .tvs-group { margin-top: var(--mp-space-4); }
.tvs-group__name { font-weight: var(--mp-fontWeight-semibold); }

/* The two fixed columns every row shares. */
.tvs-lead {
  flex-shrink: 0;
  width: var(--mp-space-20);
  height: var(--mp-space-20);
}
.tvs-trailing {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
}
.tvs-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-16);
}
.tvs-check { color: var(--accent-default); }
.tvs-count {
  min-width: var(--mp-space-20);
  text-align: end;
  font-size: var(--mp-fontSize-12);
  font-variant-numeric: tabular-nums;
  color: var(--on-surface-muted);
}
.tvs-empty { padding: var(--mp-space-12) 0; margin: 0; }

/* ── Saved views: handle, ⋯, drop line ─────────────────────────────────────
   The grip and the ⋯ stay quiet until the row is hovered or focused; on touch
   screens (no hover) they're always shown. */
.tvs-row--custom { cursor: grab; }
.tvs-grip,
.tvs-row--custom :deep(.mp-list-row__actions) {
  opacity: 0;
  transition: opacity var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.tvs-grip { color: var(--on-surface-muted); }
.tvs-row--custom:hover .tvs-grip,
.tvs-row--custom:focus-within .tvs-grip,
.tvs-row--custom:hover :deep(.mp-list-row__actions),
.tvs-row--custom:focus-within :deep(.mp-list-row__actions) { opacity: 1; }
@media (hover: none) {
  .tvs-grip,
  .tvs-row--custom :deep(.mp-list-row__actions) { opacity: 1; }
}
.tvs-row--dragging { opacity: 0.5; }

/* A 2px accent line between rows shows where the view will land. */
.tvs-row--drop-before::before,
.tvs-row--drop-after::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  height: var(--mp-space-2);
  border-radius: var(--mp-radius-full);
  background: var(--accent-default);
  pointer-events: none;
}
.tvs-row--drop-before::before { top: calc(-1 * var(--mp-space-2) / 2); }
.tvs-row--drop-after::after { bottom: calc(-1 * var(--mp-space-2) / 2); }

.tvs-kbd {
  font: inherit;
  font-size: var(--mp-fontSize-11);
  color: var(--on-surface-muted);
}

.tvs-rename {
  gap: var(--mp-component-listItem-gap);
  padding-block: var(--mp-space-4);
}
.tvs-rename__field { flex: 1 1 auto; min-width: 0; }
</style>
