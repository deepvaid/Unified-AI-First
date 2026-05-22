<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDaVinciHistory, type DaVinciHistoryItem, type GroupedHistory } from '@/composables/useDaVinciHistory'
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'

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

const { items, groupedItems, formatAgo, removeItem, clearAll } = useDaVinciHistory()
const { pushToast } = useDaVinciToasts()

const hasHistory = computed(() => items.value.length > 0)

function handleClearAll() {
  const confirmed = window.confirm('Delete all Da Vinci conversations? This cannot be undone.')
  if (!confirmed) return
  clearAll()
  pushToast({ title: 'All conversations deleted' })
}

function handleDelete(id: string, event: MouseEvent) {
  event.stopPropagation()
  removeItem(id)
}

const search = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) search.value = ''
  },
)

function filterGroup(items: DaVinciHistoryItem[]): DaVinciHistoryItem[] {
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

function buildSub(item: DaVinciHistoryItem): string {
  return `${item.subtitle} · ${formatAgo(item.createdAt)}`
}
</script>

<template>
  <div
    class="dv-history"
    :class="[{ 'is-open': open }, `dv-history--${mode ?? 'overlay'}`]"
    :aria-hidden="mode !== 'rail' && !open"
  >
    <header class="dv-history__head">
      <span class="dv-eyebrow">Conversation history</span>
      <v-btn v-if="mode !== 'rail'" icon size="32" variant="text" aria-label="Close history" @click="emit('close')">
        <v-icon size="16">x</v-icon>
      </v-btn>
      <v-menu v-if="mode === 'rail' && hasHistory" offset="6" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn icon size="32" variant="text" aria-label="More" v-bind="menuProps">
            <v-icon size="16">more-vertical</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item class="dv-history__menu-danger" @click="handleClearAll">
            <template #prepend><v-icon size="18" color="error">trash-2</v-icon></template>
            <v-list-item-title>Delete all conversations</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </header>

    <div class="dv-history__search">
      <v-icon size="18" color="on-surface-variant">search</v-icon>
      <input v-model="search" type="text" placeholder="Search conversations…" />
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
            role="button"
            tabindex="0"
            class="dv-history__item"
            :class="{ 'is-active': item.id === activeId }"
            @click="emit('select', item.id)"
            @keydown.enter.space.prevent="emit('select', item.id)"
          >
            <v-icon size="18">{{ item.icon }}</v-icon>
            <div class="dv-history__text">
              <div class="dv-history__title">{{ item.title }}</div>
              <div class="dv-history__sub">{{ buildSub(item) }}</div>
            </div>
            <button
              type="button"
              class="dv-history__delete"
              :aria-label="`Delete ${item.title}`"
              @click="handleDelete(item.id, $event)"
            >
              <v-icon size="14">trash-2</v-icon>
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

  </div>
</template>

<style scoped lang="scss">
.dv-eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-history {
  position: absolute;
  inset: 60px 0 0 0;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  transform: translateX(100%);
  transition: transform 220ms ease;
  display: flex;
  flex-direction: column;
  z-index: 40;
  height: calc(100% - 60px);
}

.dv-history.is-open {
  transform: translateX(0);
}

.dv-history__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

.dv-history__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 14px 8px;
  padding: 0 12px;
  height: 38px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 9999px;
}

.dv-history__search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13.5px;
  color: rgb(var(--v-theme-on-surface));
}

.dv-history__search input::placeholder {
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-history__scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}

.dv-history__group {
  padding: 8px 8px;
}

.dv-history__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  padding: 6px 8px 8px;
}

.dv-history__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
  color: rgb(var(--v-theme-on-surface));
  transition: background 120ms ease;
}

.dv-history__item:hover {
  background: rgb(var(--v-theme-surface-variant));
}

.dv-history__item.is-active {
  background: rgb(var(--v-theme-primary-container, var(--v-theme-primary)));
}

.dv-history__item.is-active .dv-history__title {
  color: rgb(var(--v-theme-on-primary-container, var(--v-theme-on-primary)));
}

.dv-history__item :deep(.v-icon) {
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 1px;
  flex-shrink: 0;
}

.dv-history__item.is-active :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
}

.dv-history__text {
  flex: 1;
  min-width: 0;
}

.dv-history__title {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dv-history__sub {
  font-size: 12px;
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 2px;
}

.dv-history__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  opacity: 0;
  transition: opacity 120ms ease, background 120ms ease, color 120ms ease;
}

.dv-history__item:hover .dv-history__delete,
.dv-history__item:focus-within .dv-history__delete {
  opacity: 1;
}

.dv-history__delete:hover {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

.dv-history__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 40px 20px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-history__empty :deep(.v-icon) {
  margin-bottom: 8px;
}

.dv-history__empty-title {
  font-size: 13.5px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.dv-history__empty-sub {
  font-size: 12.5px;
  max-width: 240px;
  line-height: 1.4;
}

.dv-history__menu-danger :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-error));
  font-size: 13px;
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
