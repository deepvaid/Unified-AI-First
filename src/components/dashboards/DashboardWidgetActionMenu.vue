<script setup lang="ts">
import { computed } from 'vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import { WIDGET_SIZES, type WidgetSize } from './widgetSizePresets'

const props = withDefaults(defineProps<{
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

const sizeItems = computed(() => WIDGET_SIZES.map(size => ({ value: size, label: size })))

function onResize(size: string | null) {
  if (size) emit('resize', size as WidgetSize)
}
</script>

<template>
  <MpRowActionsMenu ariaLabel="Actions" :itemLabel="widgetTitle">
    <MpMenuItem icon="maximize-2" title="Expand" @click="emit('expand')" />
    <MpMenuItem icon="pencil" title="Edit" @click="emit('edit')" />
    <MpMenuItem icon="arrow-up-right" title="View report" @click="emit('viewReport')" />
    <v-divider class="my-1" />
    <!-- currentSize is null when the widget was dragged to a custom size — no preset
         highlighted. The row is role="none": it is not a menuitem, and the segmented
         control carries its own group label. -->
    <div class="dashboard-widget-action-menu__sizes px-3 py-1" role="none">
      <span class="text-caption text-medium-emphasis">Size</span>
      <MpSegmentedControl
        size="sm"
        :mandatory="false"
        ariaLabel="Widget size"
        :model-value="props.currentSize"
        :items="sizeItems"
        @update:model-value="onResize"
      />
    </div>
    <v-divider class="my-1" />
    <MpMenuItem icon="trash-2" title="Remove" danger @click="emit('remove')" />
  </MpRowActionsMenu>
</template>

<style scoped lang="scss">
.dashboard-widget-action-menu__sizes {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
}
</style>
