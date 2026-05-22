<script setup lang="ts">
import { computed, ref } from 'vue'
import { WIDGET_LIBRARY } from '@/stores/dashboards/widgetLibrary'
import type {
  DashboardWidgetLibraryEntry,
  DashboardWidgetType,
} from '@/stores/dashboards/types'

const emit = defineEmits<{
  select: [entry: DashboardWidgetLibraryEntry]
}>()

const search = ref('')
const activeCategory = ref<'all' | 'commerce' | 'marketing' | 'service' | 'davinci'>('all')

const CATEGORIES: Array<{ key: typeof activeCategory.value; label: string; icon?: string }> = [
  { key: 'all', label: 'All' },
  { key: 'commerce', label: 'Commerce', icon: 'shopping-cart' },
  { key: 'marketing', label: 'Marketing', icon: 'megaphone' },
  { key: 'service', label: 'Service', icon: 'headset' },
  { key: 'davinci', label: 'Da Vinci', icon: 'sparkles' },
]

const TYPE_LABELS: Record<DashboardWidgetType, string> = {
  kpi: 'KPI',
  timeseries: 'Chart',
  bar: 'Chart',
  pie: 'Chart',
  table: 'Table',
  activity: 'Activity',
  setup: 'Setup',
}

const filteredEntries = computed(() => {
  const query = search.value.trim().toLowerCase()
  return WIDGET_LIBRARY.filter((entry) => {
    if (activeCategory.value !== 'all' && entry.category !== activeCategory.value) return false
    if (!query) return true
    return (
      entry.title.toLowerCase().includes(query)
      || entry.description.toLowerCase().includes(query)
    )
  })
})

const selectedId = ref<string | null>(null)

function selectEntry(entry: DashboardWidgetLibraryEntry) {
  selectedId.value = entry.id
  emit('select', entry)
}
</script>

<template>
  <div class="widget-library d-flex flex-column ga-4">
    <div class="widget-library__header">
      <div class="text-h6 font-weight-bold">Choose what to monitor</div>
      <div class="text-body-2 text-medium-emphasis">
        Start with the business outcome, then adjust the visual format if needed.
      </div>
    </div>

    <v-text-field
      v-model="search"
      placeholder="Search revenue, orders, campaigns..."
      density="comfortable"
      variant="outlined"
      prepend-inner-icon="search"
      hide-details
      clearable
    />

    <div class="widget-library__categories">
      <button
        v-for="category in CATEGORIES"
        :key="category.key"
        type="button"
        class="widget-library__category"
        :class="{ 'widget-library__category--active': activeCategory === category.key }"
        @click="activeCategory = category.key"
      >
        <v-icon v-if="category.icon" size="14" class="widget-library__category-icon">{{ category.icon }}</v-icon>
        <span>{{ category.label }}</span>
      </button>
    </div>

    <div class="widget-library__list-header">
      <div class="text-subtitle-2 font-weight-bold">Existing widgets</div>
      <div class="text-body-2 text-medium-emphasis">{{ filteredEntries.length }} available</div>
    </div>

    <div v-if="filteredEntries.length === 0" class="widget-library__empty">
      <v-icon size="32" color="medium-emphasis">scan-search</v-icon>
      <div class="text-body-2 text-medium-emphasis mt-2">
        No widgets match your search.
      </div>
    </div>

    <div v-else class="widget-library__list">
      <button
        v-for="entry in filteredEntries"
        :key="entry.id"
        type="button"
        class="widget-library__item"
        :class="{ 'widget-library__item--active': selectedId === entry.id }"
        @click="selectEntry(entry)"
      >
        <div class="widget-library__item-icon">
          <v-icon size="18">{{ entry.icon }}</v-icon>
        </div>
        <div class="widget-library__item-body">
          <div class="widget-library__item-title-row">
            <span class="widget-library__item-title">{{ entry.title }}</span>
            <v-chip
              v-if="entry.recommended"
              size="x-small"
              color="success"
              variant="tonal"
              class="widget-library__item-recommended"
            >
              Recommended
            </v-chip>
          </div>
          <div class="widget-library__item-description">{{ entry.description }}</div>
        </div>
        <div class="widget-library__item-type">
          <v-chip size="x-small" variant="outlined" class="widget-library__item-type-chip">
            {{ TYPE_LABELS[entry.type] }}
          </v-chip>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.widget-library__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.widget-library__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.widget-library__category {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface-1);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  transition: background 120ms ease, border-color 120ms ease;
}

.widget-library__category:hover {
  background: var(--surface-2);
}

.widget-library__category--active {
  background: rgb(var(--v-theme-on-surface));
  border-color: rgb(var(--v-theme-on-surface));
  color: rgb(var(--v-theme-surface));
}

.widget-library__category-icon {
  flex-shrink: 0;
}

.widget-library__list-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.widget-library__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.widget-library__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  border: 1px dashed var(--hairline);
  border-radius: 12px;
  text-align: center;
}

.widget-library__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--surface-1);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color 120ms ease, background 120ms ease;
}

.widget-library__item:hover {
  background: var(--surface-2);
  border-color: color-mix(in oklch, var(--accent) 28%, var(--hairline));
}

.widget-library__item--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.25);
}

.widget-library__item-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent-ink);
  flex-shrink: 0;
}

.widget-library__item--active .widget-library__item-icon {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.widget-library__item-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.widget-library__item-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.widget-library__item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.widget-library__item-recommended {
  height: 18px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.widget-library__item-description {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
  line-height: 1.35;
}

.widget-library__item-type-chip {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-color: var(--hairline);
  color: var(--muted);
  background: transparent;
}
</style>
