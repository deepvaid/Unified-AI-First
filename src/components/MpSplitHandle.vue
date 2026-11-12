<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * MpSplitHandle — the draggable, keyboard-operable separator between two panes
 * (WAI-ARIA window splitter): a hairline in a wider hit area, with a grip that
 * shows on hover, focus and drag.
 *
 * It owns the interaction and the look. Where the panes sit, and how wide the
 * sized one renders, is the consumer's layout: pass the current width and its
 * limits in px, and apply what `update:size` emits. `MpSplitPane` composes it
 * for a start-sized split; a panel docked at the end of a layout (the ticket's
 * side panel) uses it directly with `side="end"`.
 */
const props = withDefaults(defineProps<{
  /** Current width in px of the pane this handle sizes (v-model:size). */
  size: number
  /** Narrowest that pane may be, in px. */
  min: number
  /** Widest that pane may be, in px. */
  max: number
  /** Width Enter / double-click returns to. */
  defaultSize: number
  /** Accessible name ("Resize ticket list"). */
  ariaLabel: string
  /** id of the sized pane's content, for aria-controls. */
  controls?: string
  /** Which side of the handle the sized pane is on. `end`: dragging left makes it wider. */
  side?: 'start' | 'end'
  /** Arrow-key step in px. */
  step?: number
}>(), {
  side: 'start',
  step: 16,
})

const emit = defineEmits<{
  'update:size': [size: number]
  /** The pointer drag started or ended — for a `user-select: none` on the layout. */
  dragging: [active: boolean]
}>()

/** +1 when moving right grows the pane, -1 when moving left does. */
const direction = computed(() => (props.side === 'end' ? -1 : 1))
const clamp = (value: number) => Math.min(Math.max(props.min, props.max), Math.max(props.min, Math.round(value)))

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
  emit('dragging', true)
  startX = event.clientX
  startSize = props.size
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  event.preventDefault()
}
function onPointerMove(event: PointerEvent) {
  if (dragging.value) setSize(startSize + direction.value * (event.clientX - startX))
}
function endDrag() {
  if (!dragging.value) return
  dragging.value = false
  emit('dragging', false)
}

// ── Keyboard ────────────────────────────────────────────────────────────────
function onKeydown(event: KeyboardEvent) {
  const target = {
    ArrowLeft: props.size - direction.value * props.step,
    ArrowRight: props.size + direction.value * props.step,
    Home: props.min,
    End: props.max,
    Enter: props.defaultSize,
  }[event.key]
  if (target === undefined) return
  event.preventDefault()
  setSize(target)
}
</script>

<template>
  <div
    class="mp-split-handle"
    :class="{ 'mp-split-handle--dragging': dragging }"
    role="separator"
    aria-orientation="vertical"
    tabindex="0"
    :aria-label="ariaLabel"
    :aria-valuenow="size"
    :aria-valuemin="min"
    :aria-valuemax="Math.max(min, max)"
    :aria-controls="controls"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="endDrag"
    @pointercancel="endDrag"
    @lostpointercapture="endDrag"
    @keydown="onKeydown"
    @dblclick="setSize(defaultSize)"
  >
    <span class="mp-split-handle__grip" aria-hidden="true"></span>
  </div>
</template>

<style scoped>
/* A gutter with a hairline down its middle; the grip pill only appears on
   hover, focus and drag, so a resting split reads as one surface. */
.mp-split-handle {
  position: relative;
  flex: 0 0 var(--mp-layout-splitHandleWidth);
  cursor: col-resize;
  touch-action: none;
}
.mp-split-handle::before {
  content: '';
  position: absolute;
  inset-block: 0;
  left: 50%;
  width: var(--mp-component-field-borderWidth);
  transform: translateX(-50%);
  background: var(--border-subtle);
}
.mp-split-handle__grip {
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
.mp-split-handle:hover .mp-split-handle__grip,
.mp-split-handle:focus-visible .mp-split-handle__grip,
.mp-split-handle--dragging .mp-split-handle__grip {
  opacity: 1;
}

/* Keyboard focus: the line itself takes the focus colour at 2px, plus the grip. */
.mp-split-handle:focus-visible {
  outline: none;
}
.mp-split-handle:focus-visible::before,
.mp-split-handle--dragging::before {
  width: var(--mp-component-field-borderWidthActive);
  background: var(--focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  .mp-split-handle__grip { transition: none; }
}
</style>
