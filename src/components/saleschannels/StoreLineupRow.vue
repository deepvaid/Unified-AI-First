<script setup lang="ts">
import MpListRow from '@/components/MpListRow.vue'
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import type { MethodMarkId } from '@/maropay/methodMarks'

// One row of a store's checkout lineup — a provider in the order shoppers see it.
// The geometry every provider shares: a grip and position number, the provider's
// tile, name and what it offers, then a right-aligned money block (rate over the
// platform-fee line), the status chip and the actions the consumer puts in the
// slots. Pointer users drag the row; keyboard and screen-reader users reorder
// through the consumer's menu (Move up / Move down), so the grip is decorative.

const props = withDefaults(defineProps<{
  /** 1-based place in the lineup. */
  position: number
  mark: MethodMarkId
  title: string
  subtitle: string
  /** The rate, mono ("2.9% + 30¢"); null for a manual method. */
  rate: string | null
  /** The platform-fee line under the rate ("+ 1% platform fee" · "No fee"). */
  feeLine: string
  /** The fee line is a real charge, not a reassurance. */
  feeApplies?: boolean
  /** Dragging is on — the consumer can manage the lineup and there is more than one row. */
  draggable?: boolean
  /** Dropping another row here would land it in this slot. */
  dropTarget?: boolean
}>(), {
  feeApplies: false,
  draggable: false,
  dropTarget: false,
})

const emit = defineEmits<{
  dragstart: [event: DragEvent]
  dragover: [event: DragEvent]
  drop: [event: DragEvent]
  dragend: []
}>()

function onDragStart(event: DragEvent): void {
  if (!props.draggable) return
  event.dataTransfer?.setData('text/plain', String(props.position))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  emit('dragstart', event)
}
</script>

<template>
  <div
    class="lineup-row"
    :class="{ 'lineup-row--draggable': draggable, 'lineup-row--drop-target': dropTarget }"
    :draggable="draggable ? 'true' : undefined"
    @dragstart="onDragStart"
    @dragover="draggable && emit('dragover', $event)"
    @drop="draggable && emit('drop', $event)"
    @dragend="emit('dragend')"
  >
    <MpListRow variant="divided" :title="title">
      <template #lead>
        <span class="lineup-row__handle" aria-hidden="true">
          <v-icon v-if="draggable" size="16" class="lineup-row__grip">grip-vertical</v-icon>
          <span class="lineup-row__position">{{ position }}</span>
        </span>
        <MaropayMethodMark :mark="mark" size="md" decorative />
      </template>
      <!-- The money block sits in the trailing group when there is room and under the subtitle when there isn't; CSS shows one of the two. -->
      <template #subtitle>
        {{ subtitle }}
        <span class="lineup-row__money lineup-row__money--narrow">
          <span class="lineup-row__rate">{{ rate ?? 'No fee' }}</span>
          <span class="lineup-row__fee" :class="{ 'lineup-row__fee--applies': feeApplies }">{{ feeLine }}</span>
        </span>
      </template>
      <template #trailing>
        <span class="lineup-row__controls">
          <span class="lineup-row__money lineup-row__money--wide">
            <span class="lineup-row__rate">{{ rate ?? 'No fee' }}</span>
            <span class="lineup-row__fee" :class="{ 'lineup-row__fee--applies': feeApplies }">{{ feeLine }}</span>
          </span>
          <slot name="status" />
          <slot name="actions" />
        </span>
      </template>
    </MpListRow>
    <slot name="after" />
  </div>
</template>

<style scoped lang="scss">
.lineup-row {
  border-radius: var(--mp-component-chip-radius);
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.lineup-row--draggable {
  cursor: grab;
}

.lineup-row--draggable:active {
  cursor: grabbing;
}

/* The slot the dragged row would land in. */
.lineup-row--drop-target {
  background: var(--surface-interactive-selected);
  box-shadow: inset 0 2px 0 var(--accent-default);
}

.lineup-row__handle {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  margin-inline-end: var(--mp-space-4);
  color: var(--icon-secondary);
}

.lineup-row__position {
  min-width: var(--mp-space-16);
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.lineup-row__controls {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--mp-space-12);
}

.lineup-row__money {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 0;
  text-align: right;
}

.lineup-row__money--narrow {
  display: none;
}

.lineup-row__rate {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--text-primary);
  white-space: nowrap;
}

.lineup-row__fee {
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-muted);
  white-space: nowrap;
}

.lineup-row__fee--applies {
  color: var(--warn-ink);
}

/* Narrow: the grip goes (dragging is a pointer affordance; the menu moves rows), the money
   block drops under the subtitle as one line, and the trailing group keeps only chip and menu. */
@media (max-width: #{$mp-layout-breakpointCompact}) {
  .lineup-row__grip,
  .lineup-row__money--wide {
    display: none;
  }

  .lineup-row__money--narrow {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--mp-space-8);
    margin-top: var(--mp-space-2);
    text-align: left;
  }

  .lineup-row__controls {
    flex-wrap: nowrap;
    gap: var(--mp-space-4);
  }
}
</style>
