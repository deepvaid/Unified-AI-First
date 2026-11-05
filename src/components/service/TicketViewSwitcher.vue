<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import MpListRow from '@/components/MpListRow.vue'
import { useTicketsStore, type Ticket } from '@/stores/useTickets'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import {
  BUILT_IN_VIEWS,
  inInbox,
  isBuiltInView,
  isOpen,
  matchesBuiltInView,
  matchesFilters,
} from '@/service/ticketFilters'

/**
 * TicketViewSwitcher — inbox × view picker for the ticket list.
 *
 * Replaces a flat menu that repeated every view under every inbox in small caps
 * and let Trash scroll away. Search finds a view across inboxes; each inbox is a
 * collapsible group (open state remembered) with its own custom views and open
 * counts; Spam and Trash are pinned below the scroll.
 */
const props = defineProps<{
  /** `'all'`, an `Inbox.id`, `'spam'` or `'trash'`. */
  inbox: string
  view: string
  /** Who "My Tickets" means. */
  currentAgent: string
}>()

const emit = defineEmits<{ select: [inbox: string, view: string] }>()

const tickets = useTicketsStore()
const settings = useServiceSettingsStore()
const uid = useId()

const open = ref(false)
const query = ref('')
const searchBox = ref<HTMLElement | null>(null)

// ── Groups, views, counts ───────────────────────────────────────────────────
interface ViewRow { inbox: string; name: string; count: number }
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
      ].map(name => ({ inbox: group.id, name, count: countFor(group.id, name) })),
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

    <v-card flat border rounded="lg" class="tvs-panel d-flex flex-column" role="dialog" aria-label="Inboxes and views">
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
              <MpListRow
                v-for="view in group.views"
                :key="view.name"
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
            </div>
          </section>
        </template>
        <span class="d-sr-only" aria-live="polite">{{ liveMessage }}</span>
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
</style>
