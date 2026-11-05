<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * MpSplitPane — two panes side by side with a draggable, keyboard-operable
 * separator (WAI-ARIA window splitter). The start pane has a fixed width the
 * user controls (`v-model:size`); the end pane takes the rest.
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

// ── Pointer drag ────────────────────────────────────────────────────────────
const dragging = ref(false)
let startX = 0
let startSize = 0

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  dragging.value = true
  startX = event.clientX
  startSize = renderedSize.value
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  event.preventDefault()
}
function onPointerMove(event: PointerEvent) {
  if (dragging.value) setSize(startSize + (event.clientX - startX))
}
function endDrag() {
  dragging.value = false
}

// ── Keyboard ────────────────────────────────────────────────────────────────
function onKeydown(event: KeyboardEvent) {
  const now = renderedSize.value
  const target = {
    ArrowLeft: now - props.step,
    ArrowRight: now + props.step,
    Home: props.min,
    End: max.value,
    Enter: props.defaultSize,
  }[event.key]
  if (target === undefined) return
  event.preventDefault()
  setSize(target)
}
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

    <div
      v-if="!stacked"
      class="mp-split-pane__handle"
      role="separator"
      aria-orientation="vertical"
      tabindex="0"
      :aria-label="ariaLabel"
      :aria-valuenow="renderedSize"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-controls="controls"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
      @keydown="onKeydown"
      @dblclick="setSize(defaultSize)"
    >
      <span class="mp-split-pane__grip" aria-hidden="true"></span>
    </div>

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

/* The handle is a gutter with a hairline down its middle; the grip pill only
   appears on hover, focus and drag, so a resting split reads as one card. */
.mp-split-pane__handle {
  position: relative;
  flex: 0 0 var(--mp-layout-splitHandleWidth);
  cursor: col-resize;
  touch-action: none;
}
.mp-split-pane__handle::before {
  content: '';
  position: absolute;
  inset-block: 0;
  left: 50%;
  width: var(--mp-component-field-borderWidth);
  transform: translateX(-50%);
  background: var(--border-subtle);
}
.mp-split-pane__grip {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mp-space-4);
  height: var(--mp-space-32);
  border-radius: var(--mp-radius-full);
  background: var(--accent-default);
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}
.mp-split-pane__handle:hover .mp-split-pane__grip,
.mp-split-pane__handle:focus-visible .mp-split-pane__grip,
.mp-split-pane--dragging .mp-split-pane__grip {
  opacity: 1;
}

/* Keyboard focus: the line itself takes the focus colour at 2px, plus the grip. */
.mp-split-pane__handle:focus-visible {
  outline: none;
}
.mp-split-pane__handle:focus-visible::before,
.mp-split-pane--dragging .mp-split-pane__handle::before {
  width: var(--mp-component-field-borderWidthActive);
  background: var(--focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  .mp-split-pane__grip { transition: none; }
}
</style>
