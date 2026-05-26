<script setup lang="ts">
import { computed } from 'vue'
import MpFormDrawer from './MpFormDrawer.vue'

const search = defineModel<string>('search', { default: '' })
const filterDrawer = defineModel<boolean>('filterOpen', { default: false })
const hiddenColumns = defineModel<string[]>('hiddenColumns', { default: () => [] })

const props = defineProps<{
  searchPlaceholder?: string
  title?: string
  filterTitle?: string
  filterSubtitle?: string
  activeFilters?: Array<{ key: string; label: string }>
  selectedCount?: number
  totalCount?: number
  headers?: Array<{ title: string; key: string; [k: string]: any }>
}>()

defineEmits<{
  removeFilter: [key: string]
  clearFilters: []
  clearSelection: []
  selectAll: []
}>()

const NON_TOGGLEABLE = new Set(['actions', 'data-table-select', 'data-table-expand'])

const toggleableHeaders = computed(() =>
  (props.headers ?? []).filter(h => h.title && !NON_TOGGLEABLE.has(h.key)),
)

function isColumnVisible(key: string) {
  return !hiddenColumns.value.includes(key)
}

function toggleColumn(key: string) {
  if (hiddenColumns.value.includes(key)) {
    hiddenColumns.value = hiddenColumns.value.filter(k => k !== key)
  } else {
    hiddenColumns.value = [...hiddenColumns.value, key]
  }
}

function resetColumns() {
  hiddenColumns.value = []
}

function visibleChips(filters: Array<{ key: string; label: string }>) {
  return filters.slice(0, 3)
}
function hiddenCount(filters: Array<{ key: string; label: string }>) {
  return Math.max(0, filters.length - 3)
}
</script>

<template>
  <div class="mp-toolbar-shell">
    <div class="d-flex align-start justify-space-between ga-6 px-6 pt-6 pb-4 mp-toolbar-row">
      <div class="mp-toolbar-heading">
        <div v-if="title" class="text-subtitle-1 font-weight-bold">{{ title }}</div>
        <div v-if="totalCount != null" class="text-caption text-medium-emphasis mt-1">
          {{ totalCount }} records
        </div>
        <slot name="title" />
      </div>

      <div class="d-flex align-center ga-2 flex-wrap justify-end">
        <span class="mp-filter-btn-wrap d-inline-flex align-center">
          <v-btn
            v-if="$slots['filter-content']"
            variant="outlined"
            class="text-none mp-filter-btn"
            prepend-icon="list-filter"
            aria-label="Open table filters"
            @click="filterDrawer = true"
          >
            Filter
          </v-btn>
          <v-badge
            v-if="activeFilters?.length"
            :content="activeFilters.length"
            color="primary"
            floating
            class="ml-1"
          />
        </span>

        <v-menu
          v-if="headers?.length"
          :close-on-content-click="false"
          location="bottom end"
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              variant="outlined"
              icon="columns-3"
              class="mp-filter-btn mp-filter-btn--icon"
              aria-label="Toggle visible columns"
            >
              <v-icon size="18">columns-3</v-icon>
              <v-badge
                v-if="hiddenColumns.length"
                :content="hiddenColumns.length"
                color="primary"
                floating
              />
            </v-btn>
          </template>
          <v-card min-width="220" max-width="280" flat border rounded="lg" class="mt-1 mp-toolbar-panel">
            <div class="pa-3">
              <div class="text-subtitle-2 font-weight-bold mb-2">Toggle columns</div>
              <v-checkbox
                v-for="h in toggleableHeaders"
                :key="h.key"
                :label="h.title"
                :model-value="isColumnVisible(h.key)"
                density="compact"
                hide-details
                class="mp-column-checkbox"
                @update:model-value="toggleColumn(h.key)"
              />
            </div>
            <v-divider class="mp-divider-muted" />
            <div class="d-flex justify-end pa-3">
              <v-btn
                variant="text"
                size="small"
                class="text-none"
                :disabled="!hiddenColumns.length"
                @click="resetColumns"
              >
                Reset
              </v-btn>
            </div>
          </v-card>
        </v-menu>

        <slot name="actions" />

        <div class="mp-toolbar-search">
          <v-text-field
            v-model="search"
            :placeholder="searchPlaceholder ?? 'Search...'"
            :aria-label="searchPlaceholder ?? 'Search records'"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="search"
          />
        </div>
      </div>
    </div>
  </div>

  <v-expand-transition>
    <div
      v-if="activeFilters?.length"
      class="px-6 pb-4 d-flex align-center ga-2 flex-wrap"
    >
      <span class="text-caption text-medium-emphasis font-weight-medium mr-1">Filter by:</span>
      <v-chip
        v-for="f in visibleChips(activeFilters)"
        :key="f.key"
        size="small"
        variant="tonal"
        color="primary"
        closable
        @click:close="$emit('removeFilter', f.key)"
      >
        {{ f.label }}
      </v-chip>
      <v-chip
        v-if="hiddenCount(activeFilters) > 0"
        size="small"
        variant="tonal"
        color="default"
      >
        + {{ hiddenCount(activeFilters) }} more
      </v-chip>
      <v-btn
        variant="text"
        size="small"
        class="text-none text-medium-emphasis"
        @click="$emit('clearFilters')"
      >
        Clear
      </v-btn>
    </div>
  </v-expand-transition>

  <v-expand-transition>
    <div v-if="selectedCount && selectedCount > 0" class="px-6 pb-4">
      <div class="mp-toolbar-bulk d-flex align-center ga-3 pa-3 rounded-lg">
        <span class="text-body-2 font-weight-bold">
          {{ selectedCount }}
          <span v-if="totalCount" class="font-weight-regular text-medium-emphasis">
            of {{ totalCount }} selected
          </span>
          <span v-else class="font-weight-regular text-medium-emphasis">selected</span>
        </span>
        <v-btn
          v-if="totalCount"
          variant="text"
          size="small"
          color="primary"
          class="text-none font-weight-medium"
          @click="$emit('selectAll')"
        >
          Select All
        </v-btn>
        <v-divider v-if="$slots['bulk-actions']" vertical class="mx-1 mp-divider-vertical" />
        <slot name="bulk-actions" />
        <v-spacer />
        <v-btn
          icon="x"
          variant="text"
          size="small"
          density="comfortable"
          aria-label="Clear selected rows"
          @click="$emit('clearSelection')"
        />
      </div>
    </div>
  </v-expand-transition>

  <v-divider class="mp-divider-toolbar" />

  <MpFormDrawer
    v-if="$slots['filter-content']"
    v-model="filterDrawer"
    :title="filterTitle ?? 'Filters'"
    :subtitle="filterSubtitle"
  >
    <slot name="filter-content" />
    <template #footer>
      <v-btn variant="text" size="small" class="text-none" @click="$emit('clearFilters')">
        Clear all
      </v-btn>
      <v-btn variant="flat" size="small" color="primary" class="text-none" @click="filterDrawer = false">
        Done
      </v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped lang="scss">
@use '@/design-tokens/generated/_variables.scss' as *;

.mp-toolbar-shell {
  background: rgb(var(--v-theme-surface));
}

.mp-toolbar-row {
  min-height: $mp-layout-appbarHeight;
}

.mp-filter-btn {
  height: 40px;
}

.mp-filter-btn--icon {
  min-width: 40px;
  width: 40px;
  padding-inline: 0;
}

.mp-toolbar-search {
  width: 300px;
  min-width: 240px;
}

.mp-divider-vertical {
  height: $mp-spacing-6;
}

.mp-divider-muted {
  opacity: 0.4;
}

.mp-divider-toolbar {
  opacity: 0.12;
}

.mp-toolbar-panel {
  border-color: rgb(var(--v-theme-outline-variant));
}

.mp-toolbar-heading {
  min-width: 0;
}

.mp-toolbar-bulk {
  background: rgba(var(--v-theme-primary), 0.05);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  box-shadow: none;
}

.mp-column-checkbox :deep(.v-label) {
  font-size: 13px;
}

@media (max-width: 959px) {
  .mp-toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }

  .mp-toolbar-row > .d-flex.align-center.flex-wrap {
    width: 100%;
    justify-content: flex-start;
  }

  .mp-toolbar-search {
    width: 100%;
    min-width: 0;
    max-width: none;
  }
}
</style>
