<script setup lang="ts">
/**
 * The register's bottom sheet: variants, line actions, customers, stock,
 * receipts. It rises inside the device screen (its nearest positioned
 * ancestor), not over the whole page.
 *
 * Always a modal dialog named by its title. Closes on the scrim, the close
 * button and Escape; focus moves in when it opens, Tab stays inside, and focus
 * goes back to the trigger when it closes (useFocusTrap, as MpDialog does).
 *
 * The grabber and header drag: pull the sheet down past 30% of its height, or
 * flick it, and it closes as the close button would. The body never drags, so
 * its lists and forms scroll as usual.
 */
import { ref, useId, watch } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { axisLock, sheetDragCloses } from './posGestures'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  title?: string
  subtitle?: string
  closeLabel?: string
  /** Room for a form or a receipt: 92% of the screen instead of 72%. */
  tall?: boolean
}>(), {
  title: undefined,
  subtitle: undefined,
  closeLabel: 'Close',
  tall: false,
})

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ close: [] }>()

const titleId = useId()
const panel = ref<HTMLElement | null>(null)

function close() {
  open.value = false
  emit('close')
}

const { onKeydown } = useFocusTrap(panel, () => open.value, { onEscape: close })

/* ── Drag down to close ────────────────────────────────────────── */
const header = ref<HTMLElement | null>(null)
/** How far below rest the panel sits, px (≥ 0). */
const dragY = ref(0)
const dragging = ref(false)
let drag: { x: number; y: number; lastY: number; lastT: number; velocity: number } | null = null

// Reset on open, not on close: a dropped sheet leaves from where it was let go
watch(open, (o) => { if (o) dragY.value = 0 })

function onPointerdown(e: PointerEvent) {
  if (e.button !== 0 || !header.value) return
  if (e.clientY > header.value.getBoundingClientRect().bottom) return
  if ((e.target as Element).closest('button, a, input, textarea, select, [role="button"]')) return
  drag = { x: e.clientX, y: e.clientY, lastY: e.clientY, lastT: e.timeStamp, velocity: 0 }
}

function onPointermove(e: PointerEvent) {
  if (!drag) return
  const dy = e.clientY - drag.y
  if (!dragging.value) {
    const axis = axisLock(e.clientX - drag.x, dy)
    if (axis === 'x') { drag = null; return }
    if (!axis) return
    panel.value?.setPointerCapture(e.pointerId)
    dragging.value = true
  }
  dragY.value = Math.max(0, dy)
  const dt = e.timeStamp - drag.lastT
  if (dt > 0) drag.velocity = (e.clientY - drag.lastY) / dt
  drag.lastY = e.clientY
  drag.lastT = e.timeStamp
}

function onPointerup() {
  const d = drag
  drag = null
  if (!d || !dragging.value) return
  dragging.value = false
  if (sheetDragCloses(dragY.value, panel.value?.offsetHeight ?? 0, d.velocity)) close()
  else dragY.value = 0
}

function onPointercancel() {
  drag = null
  dragging.value = false
  dragY.value = 0
}
</script>

<template>
  <transition name="pos-sheet">
    <div v-if="open" class="pos-sheet-overlay" @click.self="close">
      <div
        ref="panel"
        v-bind="$attrs"
        class="pos-sheet"
        :class="{ 'pos-sheet--tall': tall, 'pos-sheet--dragging': dragging }"
        :style="dragY ? { transform: `translateY(${dragY}px)` } : undefined"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @keydown="onKeydown"
        @pointerdown="onPointerdown"
        @pointermove="onPointermove"
        @pointerup="onPointerup"
        @pointercancel="onPointercancel"
      >
        <div class="pos-sheet__grabber" aria-hidden="true" />
        <div ref="header" class="pos-sheet__header">
          <div v-if="$slots.lead" class="pos-sheet__lead"><slot name="lead" /></div>
          <div class="pos-sheet__heading">
            <div :id="titleId" class="pos-sheet__title"><slot name="title">{{ title }}</slot></div>
            <div v-if="subtitle || $slots.subtitle" class="pos-sheet__subtitle">
              <slot name="subtitle">{{ subtitle }}</slot>
            </div>
          </div>
          <slot name="aside" />
          <button type="button" class="pos-sheet__close" :aria-label="closeLabel" @click="close">
            <v-icon size="16" aria-hidden="true">x</v-icon>
          </button>
        </div>
        <slot />
      </div>
    </div>
  </transition>
</template>

<style scoped>
.pos-sheet-overlay {
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  inset: 0;
  background: var(--mp-color-light-pos-scrim);
}

.pos-sheet {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 72%;
  padding: var(--mp-space-10) 0 var(--mp-space-8);
  border-radius: var(--mp-component-pos-radius-sheet) var(--mp-component-pos-radius-sheet) 0 0;
  outline: none;
  background: var(--mp-color-light-pos-surface);
  box-shadow: var(--mp-shadow-lg);
  color: var(--mp-color-light-pos-ink);
  transition: transform var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.pos-sheet--tall { max-height: 92%; }

.pos-sheet--dragging { transition: none; }

/* The drag region: the browser must not pan or select text under the finger */
.pos-sheet__grabber,
.pos-sheet__header {
  touch-action: none;
  user-select: none;
}

.pos-sheet__grabber {
  flex-shrink: 0;
  width: var(--mp-space-32);
  height: var(--mp-space-4);
  margin: 0 auto var(--mp-space-10);
  border-radius: var(--mp-radius-full);
  background: rgba(var(--mp-rgb-color-light-pos-ink), 0.12);
}

.pos-sheet__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--mp-space-10);
  padding: 0 var(--mp-space-14) var(--mp-space-10);
  border-bottom: 1px solid var(--mp-color-light-pos-hairline);
}

/* A 40px square for a product thumb, an avatar or a status icon */
.pos-sheet__lead {
  display: grid;
  flex-shrink: 0;
  overflow: hidden;
  width: var(--mp-space-40);
  height: var(--mp-space-40);
  border-radius: var(--mp-radius-8);
}

.pos-sheet__heading { flex: 1; min-width: 0; }

.pos-sheet__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--mp-fontSize-15);
  font-weight: var(--mp-fontWeight-bold);
  line-height: var(--mp-lineHeight-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.pos-sheet__subtitle {
  margin-top: var(--mp-space-2);
  color: var(--mp-color-light-pos-muted);
  font-size: var(--mp-fontSize-12);
}

/* 32px mark, 44px hit area */
.pos-sheet__close {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  border: none;
  border-radius: var(--mp-radius-full);
  background: rgba(var(--mp-rgb-color-light-pos-ink), 0.07);
  color: var(--mp-color-light-pos-muted);
  cursor: pointer;
}

.pos-sheet__close::before {
  position: absolute;
  inset: calc(var(--mp-space-6) * -1);
  content: '';
}

.pos-sheet__close:hover { background: rgba(var(--mp-rgb-color-light-pos-ink), 0.12); }

.pos-sheet-enter-active { animation: pos-sheet-up var(--mp-motion-duration-base) var(--mp-motion-easing-standard); }
.pos-sheet-leave-active { animation: pos-sheet-up var(--mp-motion-duration-fast) var(--mp-motion-easing-exit) reverse; }

@keyframes pos-sheet-up {
  from { opacity: 0; transform: translateY(20%); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .pos-sheet-enter-active,
  .pos-sheet-leave-active { animation-duration: 1ms; }
  .pos-sheet { transition: none; }
}
</style>
