<script setup lang="ts">
import { WIDGET_SIZES, type WidgetSize } from './widgetSizePresets'

withDefaults(defineProps<{
  widgetTitle: string
  currentSize?: WidgetSize | null
}>(), {
  currentSize: null,
})

const emit = defineEmits<{
  expand: []
  edit: []
  viewReport: []
  resize: [size: WidgetSize]
  remove: []
}>()
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        icon="more-vertical"
        variant="text"
        size="small"
        :aria-label="`Actions for ${widgetTitle}`"
        @click.stop
      />
    </template>

    <v-list density="compact" min-width="200" class="dashboard-widget-action-menu">
      <v-list-item
        prepend-icon="maximize-2"
        title="Expand"
        @click="emit('expand')"
      />
      <v-list-item
        prepend-icon="pencil"
        title="Edit"
        @click="emit('edit')"
      />
      <v-list-item
        prepend-icon="arrow-up-right"
        title="View report"
        @click="emit('viewReport')"
      />
      <v-divider class="my-1" />
      <!-- currentSize is null when the widget was dragged to a custom size — no preset highlighted. -->
      <div class="dashboard-widget-action-menu__sizes px-3 py-1">
        <span class="text-caption text-medium-emphasis">Size</span>
        <v-btn-toggle
          :model-value="currentSize ?? undefined"
          density="compact"
          variant="outlined"
          divided
          class="dashboard-widget-action-menu__size-toggle"
          @update:model-value="(size: unknown) => size && emit('resize', size as WidgetSize)"
        >
          <v-btn
            v-for="size in WIDGET_SIZES"
            :key="size"
            :value="size"
            size="x-small"
            class="text-none"
          >
            {{ size }}
          </v-btn>
        </v-btn-toggle>
      </div>
      <v-divider class="my-1" />
      <v-list-item
        prepend-icon="trash-2"
        title="Remove"
        base-color="error"
        @click="emit('remove')"
      />
    </v-list>
  </v-menu>
</template>

<style scoped lang="scss">
.dashboard-widget-action-menu {
  border-radius: var(--r-card);
}

.dashboard-widget-action-menu__sizes {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dashboard-widget-action-menu__size-toggle {
  height: 28px;
}
</style>
