<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useDaVinciHistory, type GroupedHistory, type HistoryConversation } from '@/composables/useDaVinciHistory'
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'
import { useCopilotStore } from '@/stores/useCopilot'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'

const props = defineProps<{
  open: boolean
  activeId?: string
  mode?: 'overlay' | 'rail'
}>()

const emit = defineEmits<{
  close: []
  select: [id: string]
  newChat: []
}>()

const { items, groupedItems, formatAgo, subtitleFor } = useDaVinciHistory()
const { pushToast } = useDaVinciToasts()
const copilot = useCopilotStore()

const hasHistory = computed(() => items.value.length > 0)

// Choosing a row makes that conversation the live thread — the transcript comes back, on every surface.
function select(item: HistoryConversation) {
  if (copilot.restoreConversation(item.id)) emit('select', item.id)
}

const clearAllOpen = ref(false)

function handleClearAll() {
  clearAllOpen.value = true
}

function confirmClearAll() {
  copilot.deleteAllConversations()
  pushToast({ title: 'All conversations deleted' })
}

// A row holds a whole transcript now, so deleting one asks first (as Delete all always has).
const deleteOpen = ref(false)
// Kept after the dialog closes so its message doesn't blank while it fades.
const pendingDelete = ref<HistoryConversation | null>(null)
const deleteMessage = computed(() => {
  const item = pendingDelete.value
  if (!item) return ''
  const onScreen = item.id === copilot.conversationId ? ' It is the conversation on screen, so the screen is cleared too.' : ''
  return `“${item.title}” is removed from your history.${onScreen}`
})

function handleDelete(item: HistoryConversation, event: MouseEvent) {
  event.stopPropagation()
  pendingDelete.value = item
  deleteOpen.value = true
}

function confirmDelete() {
  if (!pendingDelete.value) return
  copilot.deleteConversation(pendingDelete.value.id)
  pushToast({ title: 'Conversation deleted' })
}

const search = ref('')

// Only the overlay mode is a modal panel — the rail is a persistent, always-visible
// sidebar and never gets dialog semantics (see the aria-hidden binding below).
const isDialog = computed(() => (props.mode ?? 'overlay') !== 'rail')

const titleId = useId()
const panel = ref<HTMLElement | null>(null)

watch(() => props.open, (isOpen) => {
  if (!isOpen) search.value = ''
})

// Focus-in/restore + Tab cycling + Escape → close, inert in rail mode.
const { onKeydown } = useFocusTrap(panel, () => props.open, {
  onEscape: () => emit('close'),
  enabled: () => isDialog.value,
})

function filterGroup(items: HistoryConversation[]): HistoryConversation[] {
  const q = search.value.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => item.title.toLowerCase().includes(q))
}

const filteredGroups = computed<GroupedHistory>(() => ({
  today: filterGroup(groupedItems.value.today),
  yesterday: filterGroup(groupedItems.value.yesterday),
  lastWeek: filterGroup(groupedItems.value.lastWeek),
  older: filterGroup(groupedItems.value.older),
}))

const isEmpty = computed(
  () =>
    filteredGroups.value.today.length === 0 &&
    filteredGroups.value.yesterday.length === 0 &&
    filteredGroups.value.lastWeek.length === 0 &&
    filteredGroups.value.older.length === 0,
)

function buildSub(item: HistoryConversation): string {
  return `${subtitleFor(item)} · ${formatAgo(item.updatedAt)}`
}
</script>

<template>
  <div
    ref="panel"
    class="dv-history"
    :class="[{ 'is-open': open }, `dv-history--${mode ?? 'overlay'}`]"
    :aria-hidden="mode !== 'rail' && !open"
    :inert="mode !== 'rail' && !open"
    :role="isDialog && open ? 'dialog' : undefined"
    :aria-modal="isDialog && open ? 'true' : undefined"
    :aria-labelledby="isDialog ? titleId : undefined"
    :tabindex="isDialog ? -1 : undefined"
    @keydown="onKeydown"
  >
    <header class="dv-history__head">
      <span :id="titleId" class="dv-eyebrow">Conversation history</span>
      <v-btn v-if="mode !== 'rail'" icon size="32" variant="text" aria-label="Close history" @click="emit('close')">
        <v-icon size="16">x</v-icon>
      </v-btn>
      <MpRowActionsMenu v-if="mode === 'rail' && hasHistory" ariaLabel="Conversation history actions">
        <MpMenuItem icon="trash-2" title="Delete all conversations" danger @click="handleClearAll" />
      </MpRowActionsMenu>
    </header>

    <div class="dv-history__search">
      <v-icon size="18" color="on-surface-variant">search</v-icon>
      <input v-model="search" type="text" placeholder="Search conversations…" aria-label="Search conversations" />
    </div>

    <div class="dv-history__scroll">
      <template v-for="(group, key) in filteredGroups" :key="key">
        <section v-if="group.length > 0" class="dv-history__group">
          <div class="dv-history__label">
            {{ key === 'today' ? 'Today' : key === 'yesterday' ? 'Yesterday' : key === 'lastWeek' ? 'Last 7 days' : 'Older' }}
          </div>
          <div
            v-for="item in group"
            :key="item.id"
            class="dv-history__row"
            :class="{ 'is-active': item.id === activeId }"
          >
            <button
              type="button"
              class="dv-history__item"
              :aria-current="item.id === activeId ? 'true' : undefined"
              @click="select(item)"
            >
              <v-icon size="18">{{ item.icon }}</v-icon>
              <span class="dv-history__text">
                <span class="dv-history__title">{{ item.title }}</span>
                <span class="dv-history__sub">{{ buildSub(item) }}</span>
              </span>
            </button>
            <button
              type="button"
              class="dv-history__delete"
              :aria-label="`Delete ${item.title}`"
              @click="handleDelete(item, $event)"
            >
              <v-icon size="16">trash-2</v-icon>
            </button>
          </div>
        </section>
      </template>

      <div v-if="isEmpty" class="dv-history__empty">
        <v-icon size="20" color="on-surface-variant">history</v-icon>
        <div class="dv-history__empty-title">{{ search ? 'No conversations match' : 'No conversations yet' }}</div>
        <div class="dv-history__empty-sub">
          {{ search ? 'Try a different search term.' : 'Ask Da Vinci anything to start a new conversation.' }}
        </div>
      </div>
    </div>

    <MpConfirmDialog
      v-model="deleteOpen"
      title="Delete this conversation?"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />

    <MpConfirmDialog
      v-model="clearAllOpen"
      title="Delete all Da Vinci conversations?"
      message="This cannot be undone. The conversation on screen is cleared too."
      confirm-label="Delete All"
      danger
      @confirm="confirmClearAll"
    />
  </div>
</template>

<style scoped lang="scss">
.dv-eyebrow {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-history {
  position: absolute;
  /* Under the copilot header (component height --mp-space-48); it used to start 8px lower and leave a strip of the panel showing. */
  inset: var(--mp-space-48) 0 0 0;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid var(--border-subtle);
  transform: translateX(100%);
  transition: transform 220ms ease;
  display: flex;
  flex-direction: column;
  /* WP-F3 z-index hygiene: local stacking context only — this slide-in panel
     only needs to sit above its own siblings inside the copilot drawer
     (position: absolute within that container), not the app-wide overlay
     ladder in tokens.json's zIndex scale. */
  z-index: 40;
  height: calc(100% - var(--mp-space-48));
}

.dv-history.is-open {
  transform: translateX(0);
}

.dv-history__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--mp-space-12) var(--mp-space-14) var(--mp-space-10);
  border-bottom: 1px solid var(--border-subtle);
}

.dv-history__search {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  margin: var(--mp-space-12) var(--mp-space-14) var(--mp-space-8);
  padding: 0 var(--mp-space-12);
  height: var(--mp-component-control-height);
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--mp-radius-full);
}

/* The input's own outline is off, so the pill carries the focus ring — the same 2px accent as the composer. */
.dv-history__search:focus-within {
  box-shadow: inset 0 0 0 2px var(--dv-accent);
}

.dv-history__search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--mp-fontSize-14);
  color: rgb(var(--v-theme-on-surface));
}

.dv-history__search input::placeholder {
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-history__scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: var(--mp-space-8);
}

.dv-history__group {
  padding: var(--mp-space-8) var(--mp-space-8);
}

.dv-history__label {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  padding: var(--mp-space-6) var(--mp-space-8) var(--mp-space-8);
}

/* A row is two siblings: the select button (fills it) and the delete button. */
.dv-history__row {
  display: flex;
  align-items: flex-start;
  border-radius: var(--mp-radius-10);
  transition: background 120ms ease;
}

.dv-history__row:hover {
  background: rgb(var(--v-theme-surface-variant));
}

/* P5.5: the fill and the ink each carried their own CSS fallback, and CSS
   resolves them independently — so a theme defining only one of the pair would
   paint the container fill with on-primary ink, or vice versa. Both themes
   define primary-container/on-primary-container, so the fallbacks only added
   a way to desync. */
.dv-history__row.is-active {
  background: rgb(var(--v-theme-primary-container));
}

.dv-history__item {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-10);
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--mp-space-10);
  border: none;
  border-radius: inherit;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: rgb(var(--v-theme-on-surface));
}

.dv-history__item:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: calc(-1 * var(--mp-space-2));
}

.dv-history__row.is-active .dv-history__title {
  color: rgb(var(--v-theme-on-primary-container));
}

.dv-history__item :deep(.v-icon) {
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 1px;
  flex-shrink: 0;
}

.dv-history__row.is-active .dv-history__item :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
}

.dv-history__text {
  flex: 1;
  min-width: 0;
}

.dv-history__title {
  display: block;
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dv-history__sub {
  display: block;
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-regular);
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: var(--mp-space-2);
}

.dv-history__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-28);
  height: var(--mp-space-28);
  flex-shrink: 0;
  margin: var(--mp-space-8) var(--mp-space-8) 0 0;
  border: none;
  background: transparent;
  border-radius: var(--mp-component-chip-radius);
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  opacity: 0;
  transition: opacity 120ms ease, background 120ms ease, color 120ms ease;
}

/* Hidden until the row is hovered or anything in it has focus — but always focusable, so a keyboard
   user reaches it (and it appears the moment it does). */
.dv-history__row:hover .dv-history__delete,
.dv-history__row:focus-within .dv-history__delete {
  opacity: 1;
}

.dv-history__delete:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: calc(-1 * var(--mp-space-2));
}

.dv-history__delete:hover {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

.dv-history__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-4);
  padding: var(--mp-space-40) var(--mp-space-20);
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-history__empty :deep(.v-icon) {
  margin-bottom: var(--mp-space-8);
}

.dv-history__empty-title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: rgb(var(--v-theme-on-surface));
}

.dv-history__empty-sub {
  font-size: var(--mp-fontSize-13);
  max-width: 240px;
  line-height: 1.4;
}

/* ─── Rail mode overrides ───────────────────────────────────────────── */
.dv-history--rail {
  position: relative;
  inset: unset;
  transform: none !important;
  transition: none;
  width: 100%;
  height: 100%;
  z-index: auto;
  border-bottom: none;
}
</style>
