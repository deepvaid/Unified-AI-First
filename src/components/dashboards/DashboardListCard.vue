<script setup lang="ts">
import { computed } from 'vue'
import { DASHBOARD_SOURCE_META } from '@/stores/dashboards/metricCatalog'
import type { Dashboard } from '@/stores/dashboards/types'
import { accentToVuetifyColor, relativeTime } from './dashboardOptions'

const props = defineProps<{
  dashboard: Dashboard
  selected: boolean
  isActive?: boolean
}>()

const emit = defineEmits<{
  open: [dashboardId: string]
  edit: [dashboardId: string]
  duplicate: [dashboardId: string]
  delete: [dashboardId: string]
  reset: [dashboardId: string]
  setDefault: [dashboardId: string]
  toggleFavorite: [dashboardId: string]
  toggleSelect: [dashboardId: string]
}>()

const accentColor = computed(() => accentToVuetifyColor(props.dashboard.accent))
const sourceChips = computed(() => {
  const sources = new Set(props.dashboard.widgets.map((widget) => widget.dataSource))
  return [...sources].map((source) => DASHBOARD_SOURCE_META[source]).filter(Boolean)
})
const updatedRelative = computed(() => relativeTime(props.dashboard.updatedAt))
const isSystem = computed(() => props.dashboard.kind === 'system')

function open() {
  emit('open', props.dashboard.id)
}
</script>

<template>
  <v-card
    flat
    border
    rounded="lg"
    class="dashboard-list-card"
    :class="{ 'dashboard-list-card--selected': selected, 'dashboard-list-card--active': isActive }"
  >
    <div class="dashboard-list-card__inner pa-5">
      <div class="d-flex align-start ga-3 mb-3">
        <v-checkbox-btn
          :model-value="selected"
          :aria-label="`Select ${dashboard.name}`"
          density="compact"
          class="dashboard-list-card__select"
          @update:model-value="emit('toggleSelect', dashboard.id)"
          @click.stop
        />

        <button
          type="button"
          class="dashboard-list-card__open d-flex align-start ga-3 flex-grow-1"
          :aria-label="`Open ${dashboard.name}`"
          @click="open"
        >
          <v-avatar size="44" variant="tonal" :color="accentColor">
            <v-icon size="22">{{ dashboard.icon ?? 'layout-dashboard' }}</v-icon>
          </v-avatar>
          <div class="flex-grow-1 min-width-0 text-left">
            <div class="d-flex align-center ga-2 flex-wrap mb-1">
              <span class="text-subtitle-1 font-weight-bold">{{ dashboard.name }}</span>
              <v-chip size="x-small" variant="tonal" :color="isSystem ? 'secondary' : 'primary'">
                {{ isSystem ? 'System' : 'Custom' }}
              </v-chip>
              <v-chip v-if="dashboard.isDefault" size="x-small" variant="tonal" color="success">
                Default
              </v-chip>
              <v-chip v-if="isActive" size="x-small" variant="outlined">
                Open now
              </v-chip>
            </div>
            <div class="text-body-2 text-medium-emphasis dashboard-list-card__description">
              {{ dashboard.description || 'No description' }}
            </div>
          </div>
        </button>

        <div class="d-flex align-center ga-1 flex-shrink-0">
          <v-tooltip
            :text="dashboard.isDefault ? 'Currently default' : 'Set as default'"
            location="top"
          >
            <template #activator="{ props: tipProps }">
              <v-btn
                v-bind="tipProps"
                :icon="dashboard.isDefault ? 'bookmark-check' : 'bookmark'"
                :color="dashboard.isDefault ? 'success' : undefined"
                variant="text"
                size="small"
                :disabled="dashboard.isDefault"
                :aria-label="dashboard.isDefault ? `${dashboard.name} is the default dashboard` : `Set ${dashboard.name} as default`"
                @click.stop="emit('setDefault', dashboard.id)"
              />
            </template>
          </v-tooltip>
          <v-btn
            icon="star"
            :color="dashboard.favorite ? 'warning' : undefined"
            variant="text"
            size="small"
            :class="{ 'fav-btn--active': dashboard.favorite }"
            :aria-label="dashboard.favorite ? `Unfavorite ${dashboard.name}` : `Favorite ${dashboard.name}`"
            :aria-pressed="dashboard.favorite"
            @click.stop="emit('toggleFavorite', dashboard.id)"
          />
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="more-vertical"
                variant="text"
                size="small"
                :aria-label="`More actions for ${dashboard.name}`"
                @click.stop
              />
            </template>
            <v-list density="compact" min-width="200">
              <v-list-item prepend-icon="arrow-up-right" title="Open" @click="open" />
              <v-list-item
                prepend-icon="pencil"
                title="Edit"
                @click="emit('edit', dashboard.id)"
              />
              <v-list-item
                prepend-icon="copy"
                title="Duplicate"
                @click="emit('duplicate', dashboard.id)"
              />
              <v-list-item
                v-if="!dashboard.isDefault"
                prepend-icon="bookmark-check"
                title="Set as default"
                @click="emit('setDefault', dashboard.id)"
              />
              <v-list-item
                v-if="isSystem"
                prepend-icon="rotate-ccw"
                title="Reset to defaults"
                @click="emit('reset', dashboard.id)"
              />
              <v-divider v-if="!isSystem" class="my-1" />
              <v-list-item
                v-if="!isSystem"
                prepend-icon="trash-2"
                title="Delete"
                base-color="error"
                @click="emit('delete', dashboard.id)"
              />
            </v-list>
          </v-menu>
        </div>
      </div>

      <div class="dashboard-list-card__meta">
        <div class="dashboard-list-card__meta-item">
          <v-icon size="14">grid-2x2</v-icon>
          <span>{{ dashboard.widgets.length }} widget{{ dashboard.widgets.length === 1 ? '' : 's' }}</span>
        </div>
        <div class="dashboard-list-card__meta-item">
          <v-icon size="14">clock</v-icon>
          <span>Updated {{ updatedRelative }}</span>
        </div>
        <div v-if="dashboard.lastViewedAt" class="dashboard-list-card__meta-item">
          <v-icon size="14">eye</v-icon>
          <span>Visited {{ relativeTime(dashboard.lastViewedAt) }}</span>
        </div>
      </div>

      <div v-if="sourceChips.length" class="d-flex flex-wrap ga-1 mt-3">
        <v-chip
          v-for="source in sourceChips"
          :key="source.id"
          size="x-small"
          variant="tonal"
          color="primary"
          :prepend-icon="source.icon"
        >
          {{ source.label }}
        </v-chip>
      </div>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
:deep(.fav-btn--active .v-icon svg) {
  fill: currentColor;
}

.dashboard-list-card {
  border-color: var(--mp-border-subtle);
  background: rgb(var(--v-theme-surface));
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.dashboard-list-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.32);
  box-shadow: var(--mp-shadow-md);
  transform: translateY(-1px);
}

.dashboard-list-card--selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.4) inset;
}

.dashboard-list-card--active {
  background: rgba(var(--v-theme-primary), 0.04);
}

.dashboard-list-card__open {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
  min-width: 0;
}

.dashboard-list-card__open:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.2);
  border-radius: 12px;
}

.dashboard-list-card__select {
  margin-top: 4px;
}

.dashboard-list-card__description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dashboard-list-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: var(--mp-typography-fontSize-xs);
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.dashboard-list-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
