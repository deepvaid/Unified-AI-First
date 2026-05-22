<script setup lang="ts">
import { computed } from 'vue'
import type { Dashboard } from '@/stores/dashboards/types'
import { accentToVuetifyColor, relativeTime } from './dashboardOptions'

const props = defineProps<{
  dashboards: Dashboard[]
  selectedIds: string[]
  activeDashboardId?: string
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
  toggleSelectAll: [select: boolean]
}>()

const selectedSet = computed(() => new Set(props.selectedIds))
const selectableIds = computed(() => props.dashboards.map((dashboard) => dashboard.id))
const allSelected = computed(() => selectableIds.value.length > 0 && selectableIds.value.every((id) => selectedSet.value.has(id)))
const someSelected = computed(() => !allSelected.value && selectableIds.value.some((id) => selectedSet.value.has(id)))

function isSelected(id: string): boolean {
  return selectedSet.value.has(id)
}
</script>

<template>
  <v-card flat border rounded="lg" class="dashboard-list-table">
    <v-table density="comfortable" hover class="dashboard-list-table__table">
      <thead>
        <tr>
          <th style="width: 40px">
            <v-checkbox-btn
              :model-value="allSelected"
              :indeterminate="someSelected"
              density="compact"
              aria-label="Select all dashboards on this page"
              @update:model-value="emit('toggleSelectAll', !allSelected)"
            />
          </th>
          <th>Name</th>
          <th>Type</th>
          <th>Widgets</th>
          <th>Updated</th>
          <th>Last viewed</th>
          <th style="width: 132px">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="dashboard in dashboards"
          :key="dashboard.id"
          class="dashboard-list-table__row"
          :class="{
            'dashboard-list-table__row--selected': isSelected(dashboard.id),
            'dashboard-list-table__row--active': dashboard.id === activeDashboardId,
          }"
          @click="emit('open', dashboard.id)"
        >
          <td @click.stop>
            <v-checkbox-btn
              :model-value="isSelected(dashboard.id)"
              :aria-label="`Select ${dashboard.name}`"
              density="compact"
              @update:model-value="emit('toggleSelect', dashboard.id)"
            />
          </td>
          <td>
            <div class="d-flex align-center ga-3 min-width-0">
              <v-avatar size="32" variant="tonal" :color="accentToVuetifyColor(dashboard.accent)">
                <v-icon size="18">{{ dashboard.icon ?? 'layout-dashboard' }}</v-icon>
              </v-avatar>
              <div class="min-width-0">
                <div class="d-flex align-center ga-2">
                  <span class="text-body-2 font-weight-bold dashboard-list-table__name">{{ dashboard.name }}</span>
                  <v-icon
                    v-if="dashboard.favorite"
                    size="14"
                    color="warning"
                    aria-label="Favorite"
                  >star</v-icon>
                  <v-chip v-if="dashboard.isDefault" size="x-small" variant="tonal" color="success">Default</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis dashboard-list-table__description">
                  {{ dashboard.description || 'No description' }}
                </div>
              </div>
            </div>
          </td>
          <td>
            <v-chip
              size="x-small"
              variant="tonal"
              :color="dashboard.kind === 'system' ? 'secondary' : 'primary'"
            >
              {{ dashboard.kind === 'system' ? 'System' : 'Custom' }}
            </v-chip>
          </td>
          <td>{{ dashboard.widgets.length }}</td>
          <td>{{ relativeTime(dashboard.updatedAt) }}</td>
          <td>{{ relativeTime(dashboard.lastViewedAt) }}</td>
          <td @click.stop>
            <div class="d-flex align-center ga-1">
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
                    density="comfortable"
                    :disabled="dashboard.isDefault"
                    :aria-label="dashboard.isDefault ? `${dashboard.name} is the default dashboard` : `Set ${dashboard.name} as default`"
                    @click="emit('setDefault', dashboard.id)"
                  />
                </template>
              </v-tooltip>
              <v-btn
                icon="star"
                :color="dashboard.favorite ? 'warning' : undefined"
                variant="text"
                size="small"
                density="comfortable"
                :class="{ 'fav-btn--active': dashboard.favorite }"
                :aria-label="dashboard.favorite ? `Unfavorite ${dashboard.name}` : `Favorite ${dashboard.name}`"
                :aria-pressed="dashboard.favorite"
                @click="emit('toggleFavorite', dashboard.id)"
              />
              <v-menu location="bottom end">
                <template #activator="{ props: menuProps }">
                  <v-btn
                    v-bind="menuProps"
                    icon="more-vertical"
                    variant="text"
                    size="small"
                    density="comfortable"
                    :aria-label="`More actions for ${dashboard.name}`"
                  />
                </template>
                <v-list density="compact" min-width="200">
                  <v-list-item prepend-icon="arrow-up-right" title="Open" @click="emit('open', dashboard.id)" />
                  <v-list-item prepend-icon="pencil" title="Edit" @click="emit('edit', dashboard.id)" />
                  <v-list-item prepend-icon="copy" title="Duplicate" @click="emit('duplicate', dashboard.id)" />
                  <v-list-item
                    v-if="!dashboard.isDefault"
                    prepend-icon="bookmark-check"
                    title="Set as default"
                    @click="emit('setDefault', dashboard.id)"
                  />
                  <v-list-item
                    v-if="dashboard.kind === 'system'"
                    prepend-icon="rotate-ccw"
                    title="Reset to defaults"
                    @click="emit('reset', dashboard.id)"
                  />
                  <v-divider v-if="dashboard.kind === 'custom'" class="my-1" />
                  <v-list-item
                    v-if="dashboard.kind === 'custom'"
                    prepend-icon="trash-2"
                    title="Delete"
                    base-color="error"
                    @click="emit('delete', dashboard.id)"
                  />
                </v-list>
              </v-menu>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<style scoped lang="scss">
:deep(.fav-btn--active .v-icon svg) {
  fill: currentColor;
}

.dashboard-list-table {
  border-color: var(--mp-border-subtle);
  overflow: hidden;
}

.dashboard-list-table__table {
  background: transparent !important;
}

.dashboard-list-table :deep(th) {
  font-size: var(--mp-typography-fontSize-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.56);
  border-bottom: 1px solid var(--mp-border-subtle) !important;
}

.dashboard-list-table :deep(td) {
  border-bottom: 1px solid var(--mp-border-subtle) !important;
  padding-block: 14px !important;
}

.dashboard-list-table :deep(tbody tr) {
  height: auto !important;
}

.dashboard-list-table__row {
  cursor: pointer;
}

.dashboard-list-table__row--selected {
  background: rgba(var(--v-theme-primary), 0.06);
}

.dashboard-list-table__row--active {
  background: rgba(var(--v-theme-primary), 0.04);
}

.dashboard-list-table__name {
  display: inline-block;
  max-width: 28ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.dashboard-list-table__description {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 48ch;
}
</style>
