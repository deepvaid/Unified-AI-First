<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import MpSplitHandle from './MpSplitHandle.vue'

/**
 * MpSplitPane — two panes side by side with a draggable, keyboard-operable
 * separator (`MpSplitHandle`, a WAI-ARIA window splitter). The start pane has a
 * fixed width the user controls (`v-model:size`); the end pane takes the rest.
 *
 * The rendered width is clamped to `min … container × maxRatio`, but the model
 * value only changes when the user moves the separator — so a narrower window
 * squeezes the pane without overwriting the user's preference, and widening the
 * window gives the chosen width back. Persisting the value is the consumer's job.
 *
 * `stacked` shows one pane at a time with no separator (narrow screens). Both
 * panes stay mounted, so scroll positions survive the switch.
 */
const props = withDefaults(defineProps<{
  /** Start-pane width in px (v-model:size). */
  size: number
  /** Width Enter / double-click on the separator returns to. */
  defaultSize: number
  /** Narrowest the start pane may be, in px. */
  min: number
  /** Largest share of the container the start pane may take. */
  maxRatio?: number
  /** Accessible name of the separator ("Resize ticket list"). */
  ariaLabel: string
  /** id of the start pane's content, for aria-controls. */
  controls?: string
  /** Narrow screens: render only this pane, full width, without a separator. */
  stacked?: 'start' | 'end' | null
  /** Arrow-key step in px. */
  step?: number
}>(), {
  maxRatio: 0.5,
  stacked: null,
  step: 16,
})

const emit = defineEmits<{ 'update:size': [size: number] }>()

const root = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
let observer: ResizeObserver | undefined

onMounted(() => {
  if (!root.value) return
  containerWidth.value = root.value.clientWidth
  observer = new ResizeObserver(([entry]) => {
    if (entry) containerWidth.value = entry.contentRect.width
  })
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

const max = computed(() => Math.max(props.min, Math.floor(containerWidth.value * props.maxRatio)))
const clamp = (value: number) => Math.min(max.value, Math.max(props.min, Math.round(value)))
const renderedSize = computed(() => (containerWidth.value ? clamp(props.size) : props.size))

function setSize(value: number) {
  const next = clamp(value)
  if (next !== props.size) emit('update:size', next)
}

// The handle owns the drag and the keys; the root only needs to know a drag is
// on, to stop text selection across both panes.
const dragging = ref(false)
</script>

<template>
  <div
    ref="root"
    class="mp-split-pane"
    :class="{ 'mp-split-pane--dragging': dragging, [`mp-split-pane--stacked-${stacked}`]: !!stacked }"
    :style="{ '--mp-split-pane-start': `${renderedSize}px` }"
  >
    <div v-show="stacked !== 'end'" class="mp-split-pane__start">
      <slot name="start" />
    </div>

    <!-- Passed the rendered (clamped) width, so its aria values match what is on screen. -->
    <MpSplitHandle
      v-if="!stacked"
      class="mp-split-pane__handle"
      :size="renderedSize"
      :min="min"
      :max="max"
      :default-size="defaultSize"
      :step="step"
      :ariaLabel="ariaLabel"
      :controls="controls"
      @update:size="setSize"
      @dragging="active => { dragging = active }"
    />

    <div v-show="stacked !== 'start'" class="mp-split-pane__end">
      <slot name="end" />
    </div>
  </div>
</template>

<style scoped>
.mp-split-pane {
  display: flex;
  min-width: 0;
  min-height: 0;
}
.mp-split-pane--dragging {
  cursor: col-resize;
  user-select: none;
}

.mp-split-pane__start,
.mp-split-pane__end {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.mp-split-pane__start { flex: 0 0 var(--mp-split-pane-start); }
.mp-split-pane__end { flex: 1 1 0; }
.mp-split-pane--stacked-start .mp-split-pane__start { flex: 1 1 0; }
</style>
