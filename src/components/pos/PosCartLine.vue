<script setup lang="ts">
/**
 * One line of the sale. The whole row opens the line's actions (price, note,
 * discount, remove). Each reason the line costs less — or needs a look — gets
 * its own note: icon and words, never colour alone.
 *
 * The consumer writes the row's `aria-label`, because it knows the sale.
 */
import { computed } from 'vue'
import { posArt, posInitials } from './posArt'

export interface PosLineNote {
  kind: 'promo' | 'discount' | 'stock' | 'note'
  label: string
  /** Formatted, signed as it should read — "−$5.00". */
  amount?: string
}

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

const emit = defineEmits<{ open: [] }>()

const NOTE_ICON: Record<PosLineNote['kind'], string> = {
  promo: 'tag',
  discount: 'badge-percent',
  stock: 'triangle-alert',
  note: 'sticky-note',
}

const art = computed(() => posArt(props.seed))
</script>

<template>
  <div
    class="pos-line"
    :class="{ 'pos-line--fresh': fresh }"
    role="button"
    tabindex="0"
    @click="emit('open')"
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
</template>

<style scoped>
.pos-line {
  display: grid;
  grid-template-columns: var(--mp-component-pos-thumb) 1fr auto;
  align-items: flex-start;
  gap: 0 var(--mp-space-12);
  padding: var(--mp-space-12) var(--mp-space-16);
  border-bottom: 1px solid rgba(var(--mp-rgb-color-light-pos-ink), 0.06);
  background: var(--mp-color-light-pos-surface);
  cursor: pointer;
  transition: background var(--mp-motion-duration-entrance);
}

.pos-line:last-child { border-bottom: none; }
.pos-line:hover { background: rgba(var(--mp-rgb-color-light-pos-ink), 0.03); }
.pos-line:active { background: rgba(var(--mp-rgb-color-light-pos-ink), 0.07); }

.pos-line--fresh {
  background: rgba(var(--mp-rgb-color-light-pos-accentInk), 0.08);
  transition: none;
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
