<script lang="ts">
import { ref } from 'vue'

export interface PosLineNote {
  kind: 'promo' | 'discount' | 'stock' | 'note'
  label: string
  /** Formatted, signed as it should read — "−$5.00". */
  amount?: string
}

/** One revealed line at a time across the sale. */
const openLine = ref<symbol | null>(null)
</script>

<script setup lang="ts">
/**
 * One line of the sale. The whole row opens the line's actions (price, note,
 * discount, remove). Each reason the line costs less — or needs a look — gets
 * its own note: icon and words, never colour alone.
 *
 * Swipe left to reveal Remove; swipe past half the row to remove it at once.
 * The swipe is a shortcut: the line's actions keep Remove for a tap, Enter or
 * a screen reader, so the Remove behind the row stays inert until revealed.
 *
 * The consumer writes the row's `aria-label`, because it knows the sale. It
 * lands on the tappable face, as every other attribute does.
 */
import { computed, onBeforeUnmount, watch } from 'vue'
import { posArt, posInitials } from './posArt'
import { axisLock, posHaptic, swipeOutcome } from './posGestures'
import { mp_component_pos_swipeAction, mp_motion_duration_fast } from '@/design-tokens/generated/tokens'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  name: string
  /** Variant and SKU, one quiet line. */
  meta?: string
  qty: number
  /** "2 × $49.00", or why the unit price moved; omit for a single unchanged unit. */
  unitLabel?: string
  /** The pre-discount total, struck through. */
  wasLabel?: string
  totalLabel: string
  notes?: PosLineNote[]
  /** Hashes to the placeholder artwork; usually the SKU. */
  seed: string
  /** Just added: a brief tint so the eye finds it. */
  fresh?: boolean
}>(), {
  meta: undefined,
  unitLabel: undefined,
  wasLabel: undefined,
  notes: () => [],
  fresh: false,
})

const emit = defineEmits<{ open: []; remove: [] }>()

const NOTE_ICON: Record<PosLineNote['kind'], string> = {
  promo: 'tag',
  discount: 'badge-percent',
  stock: 'triangle-alert',
  note: 'sticky-note',
}

const art = computed(() => posArt(props.seed))

/* ── Swipe left to remove ──────────────────────────────────────── */
const ACTION_WIDTH = parseFloat(mp_component_pos_swipeAction)
const SLIDE_MS = parseFloat(mp_motion_duration_fast)

const id = Symbol('pos-line')
const root = ref<HTMLElement | null>(null)
/** How far the face sits left of rest, px (≤ 0). */
const offset = ref(0)
const dragging = ref(false)
const revealed = computed(() => !dragging.value && offset.value < 0)

let drag: { x: number; y: number; base: number; axis: 'x' | 'y' | null; lastX: number; lastT: number; velocity: number } | null = null
/** The click that ends a swipe is not a tap. */
let swallowClick = false
let removeTimer: ReturnType<typeof setTimeout> | undefined

function settle(to: number) {
  offset.value = to
  if (to === 0 && openLine.value === id) openLine.value = null
}

function onPointerdown(e: PointerEvent) {
  if (e.button !== 0) return
  swallowClick = false
  drag = { x: e.clientX, y: e.clientY, base: offset.value, axis: null, lastX: e.clientX, lastT: e.timeStamp, velocity: 0 }
}

function onPointermove(e: PointerEvent) {
  if (!drag) return
  const dx = e.clientX - drag.x
  if (!drag.axis) {
    drag.axis = axisLock(dx, e.clientY - drag.y)
    if (drag.axis === 'y') { drag = null; return } // the cart scrolls
    if (!drag.axis) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragging.value = true
    openLine.value = id
  }
  offset.value = Math.max(-(root.value?.offsetWidth ?? 0), Math.min(0, drag.base + dx))
  const dt = e.timeStamp - drag.lastT
  if (dt > 0) drag.velocity = (e.clientX - drag.lastX) / dt
  drag.lastX = e.clientX
  drag.lastT = e.timeStamp
}

function onPointerup() {
  const d = drag
  drag = null
  if (!d?.axis) return // a tap: the click opens the line
  dragging.value = false
  swallowClick = true
  const outcome = swipeOutcome(-offset.value, root.value?.offsetWidth ?? 0, d.velocity, ACTION_WIDTH)
  if (outcome === 'remove') remove()
  else settle(outcome === 'revealed' ? -ACTION_WIDTH : 0)
}

function onPointercancel() {
  if (drag?.axis) {
    dragging.value = false
    settle(0)
  }
  drag = null
}

function onClick() {
  if (swallowClick) { swallowClick = false; return }
  if (offset.value < 0) { settle(0); return } // a tap on a revealed line closes it
  emit('open')
}

/** Slide the row out, then hand the removal to the consumer. */
function remove() {
  posHaptic()
  offset.value = -(root.value?.offsetWidth ?? 0)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  removeTimer = setTimeout(() => {
    settle(0)
    emit('remove')
  }, reduce ? 0 : SLIDE_MS)
}

function onOutside(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node)) settle(0)
}

watch(revealed, (r) => {
  if (r) document.addEventListener('pointerdown', onOutside, true)
  else document.removeEventListener('pointerdown', onOutside, true)
})

watch(openLine, (v) => {
  if (v !== id && offset.value < 0) offset.value = 0
})

onBeforeUnmount(() => {
  clearTimeout(removeTimer)
  document.removeEventListener('pointerdown', onOutside, true)
  if (openLine.value === id) openLine.value = null
})
</script>

<template>
  <div
    ref="root"
    class="pos-line"
    :class="{ 'pos-line--fresh': fresh, 'pos-line--open': offset < 0, 'pos-line--dragging': dragging }"
  >
    <button type="button" class="pos-line__remove" :inert="!revealed" :aria-label="`Remove ${name}`" @click="remove">
      <v-icon size="20" aria-hidden="true">trash-2</v-icon>
      <span aria-hidden="true">Remove</span>
    </button>
    <div
      v-bind="$attrs"
      class="pos-line__face"
      role="button"
      tabindex="0"
      :style="offset ? { transform: `translateX(${offset}px)` } : undefined"
      @pointerdown="onPointerdown"
      @pointermove="onPointermove"
      @pointerup="onPointerup"
      @pointercancel="onPointercancel"
      @click="onClick"
      @keydown.enter="emit('open')"
      @keydown.space.prevent="emit('open')"
    >
      <div class="pos-line__thumb" :style="{ background: art }">
        <span aria-hidden="true">{{ posInitials(name) }}</span>
        <span v-if="qty > 1" class="pos-line__qty" aria-hidden="true">{{ qty }}</span>
      </div>
      <div class="pos-line__body">
        <div class="pos-line__name">{{ name }}</div>
        <div v-if="meta" class="pos-line__meta">{{ meta }}</div>
        <div v-if="unitLabel" class="pos-line__meta">{{ unitLabel }}</div>
      </div>
      <div class="pos-line__pricing">
        <span v-if="wasLabel" class="pos-line__was">{{ wasLabel }}</span>
        <span class="pos-line__total">{{ totalLabel }}</span>
      </div>
      <ul v-if="notes.length" class="pos-line__notes">
        <li v-for="(n, i) in notes" :key="`${n.kind}-${i}`" class="pos-line__note" :class="`pos-line__note--${n.kind}`">
          <v-icon size="14" aria-hidden="true">{{ NOTE_ICON[n.kind] }}</v-icon>
          <span class="pos-line__note-text">{{ n.label }}</span>
          <span v-if="n.amount" class="pos-line__note-amount">{{ n.amount }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* A long press must not select text or raise the iOS callout */
.pos-line {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(var(--mp-rgb-color-light-pos-ink), 0.06);
  -webkit-touch-callout: none;
  user-select: none;
}

.pos-line:last-child { border-bottom: none; }

/* The red shows only while the face is moved, so no edge of it shows at rest */
.pos-line--open { background: var(--mp-color-light-pos-dangerInk); }

.pos-line__remove {
  position: absolute;
  inset-block: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-4);
  width: var(--mp-component-pos-swipeAction);
  padding: 0;
  border: none;
  background: var(--mp-color-light-pos-dangerInk);
  color: var(--mp-color-light-pos-onInk);
  font-family: inherit;
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  cursor: pointer;
}

/* Opaque fills throughout: the face covers the Remove action behind it */
.pos-line__face {
  position: relative;
  display: grid;
  grid-template-columns: var(--mp-component-pos-thumb) 1fr auto;
  align-items: flex-start;
  gap: 0 var(--mp-space-12);
  padding: var(--mp-space-12) var(--mp-space-16);
  background: var(--mp-color-light-pos-surface);
  cursor: pointer;
  touch-action: pan-y;
  transition:
    background var(--mp-motion-duration-entrance),
    transform var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.pos-line__face:hover { background: color-mix(in srgb, var(--mp-color-light-pos-ink) 3%, var(--mp-color-light-pos-surface)); }
.pos-line__face:active { background: color-mix(in srgb, var(--mp-color-light-pos-ink) 7%, var(--mp-color-light-pos-surface)); }

/* Opaque, so muted meta keeps 4.5:1 whatever the line sits on */
.pos-line--fresh .pos-line__face {
  background: color-mix(in srgb, var(--mp-color-light-pos-accentInk) 8%, var(--mp-color-light-pos-surface));
  transition: transform var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.pos-line--dragging .pos-line__face { transition: none; }

@media (prefers-reduced-motion: reduce) {
  .pos-line__face { transition: none; }
}

.pos-line__thumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-component-pos-thumb);
  height: var(--mp-component-pos-thumb);
  border-radius: var(--mp-component-pos-radius-control);
  color: rgba(var(--mp-rgb-color-light-pos-ink), 0.6);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-bold);
}

.pos-line__qty {
  position: absolute;
  top: calc(var(--mp-space-6) * -1);
  right: calc(var(--mp-space-6) * -1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--mp-space-24);
  height: var(--mp-space-24);
  padding: 0 var(--mp-space-6);
  border: 2px solid var(--mp-color-light-pos-surface);
  border-radius: var(--mp-radius-full);
  background: var(--mp-color-light-pos-ink);
  color: var(--mp-color-light-pos-onInk);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-bold);
}

.pos-line__body { min-width: 0; }

.pos-line__name {
  overflow: hidden;
  color: var(--mp-color-light-pos-ink);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-line__meta {
  overflow: hidden;
  margin-top: var(--mp-space-2);
  color: var(--mp-color-light-pos-muted);
  font-size: var(--mp-fontSize-12);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-line__pricing {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--mp-space-2);
  white-space: nowrap;
}

.pos-line__was {
  color: var(--mp-color-light-pos-muted);
  font-size: var(--mp-fontSize-12);
  text-decoration: line-through;
}

.pos-line__total {
  color: var(--mp-color-light-pos-ink);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-bold);
}

/* Spans body + price columns, so a note and its amount sit on one line */
.pos-line__notes {
  display: flex;
  flex-direction: column;
  grid-column: 2 / -1;
  gap: var(--mp-space-4);
  margin: var(--mp-space-6) 0 0;
  padding: 0;
  list-style: none;
}

.pos-line__note {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-snug);
}

.pos-line__note .v-icon { flex-shrink: 0; }

.pos-line__note-text { flex: 1; min-width: 0; }
.pos-line__note-amount { white-space: nowrap; }

.pos-line__note--promo,
.pos-line__note--discount { color: var(--mp-color-light-pos-successInk); }
.pos-line__note--stock { color: var(--mp-color-light-pos-warnInk); }

.pos-line__note--note {
  color: var(--mp-color-light-pos-muted);
  font-weight: var(--mp-fontWeight-medium);
}
</style>
