<script setup lang="ts">
import { computed } from 'vue'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import type { ActivationCheckItem, ActivationChecklist } from '@/maropay/readiness'

// The seven things that must be true before a store switches to Maropay
// (plan §3D). Every item says whose move it is — done, waiting on our payments
// partner, or yours to do. The page supplies each fix through #action, so the
// checklist never guesses where a fix lives.

const props = withDefaults(defineProps<{
  checklist: ActivationChecklist
  title?: string
  headingLevel?: number
}>(), {
  title: 'Before you activate',
  headingLevel: 2,
})

defineSlots<{
  /** The fix for an item that isn't done — a button or a link. */
  action?: (props: { item: ActivationCheckItem }) => unknown
}>()

const STATES = {
  done: { icon: 'circle-check', label: 'Done' },
  waiting: { icon: 'clock', label: 'Waiting on our payments partner' },
  todo: { icon: 'circle-dashed', label: 'To do' },
} as const

const summary = computed(() => {
  if (props.checklist.ok) return 'Everything is ready'
  const done = props.checklist.items.filter((i) => i.ok).length
  return `${done} of ${props.checklist.items.length} done`
})
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset">
    <MpSectionHeader icon="list-checks" :title="title" :heading-level="headingLevel" :description="summary" />
    <div role="list">
      <MpListRow v-for="item in checklist.items" :key="item.key" variant="divided" role="listitem" :subtitle="item.detail">
        <template #lead>
          <v-icon size="16" class="maropay-checklist__icon" :class="`maropay-checklist__icon--${item.state}`">{{ STATES[item.state].icon }}</v-icon>
        </template>
        <template #title><span class="d-sr-only">{{ STATES[item.state].label }}: </span>{{ item.label }}</template>
        <template v-if="!item.ok && $slots.action" #trailing>
          <slot name="action" :item="item" />
        </template>
      </MpListRow>
    </div>
  </v-card>
</template>

<style scoped>
.maropay-checklist__icon--done {
  color: var(--pos-ink);
}

.maropay-checklist__icon--waiting {
  color: var(--on-surface-muted);
}

.maropay-checklist__icon--todo {
  color: var(--icon-secondary);
}
</style>
