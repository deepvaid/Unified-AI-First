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
  <v-card flat border rounded="lg" class="maropay-checklist">
    <MpSectionHeader :title="title" :heading-level="headingLevel" :description="summary" />
    <div role="list">
      <MpListRow v-for="item in checklist.items" :key="item.key" variant="divided" role="listitem">
        <template #lead>
          <v-icon size="18" class="maropay-checklist__icon" :class="`maropay-checklist__icon--${item.state}`">{{ STATES[item.state].icon }}</v-icon>
        </template>
        <span class="maropay-checklist__title"><span class="d-sr-only">{{ STATES[item.state].label }}: </span>{{ item.label }}</span>
        <span class="maropay-checklist__detail">{{ item.detail }}</span>
        <template v-if="!item.ok && $slots.action" #trailing>
          <slot name="action" :item="item" />
        </template>
      </MpListRow>
    </div>
  </v-card>
</template>

<style scoped>
.maropay-checklist {
  padding: var(--mp-component-card-padding);
}

.maropay-checklist__icon--done {
  color: var(--pos-ink);
}

.maropay-checklist__icon--waiting {
  color: var(--text-secondary);
}

.maropay-checklist__icon--todo {
  color: var(--icon-secondary);
}

.maropay-checklist__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-lineHeight-snug);
  color: var(--text-primary);
}

.maropay-checklist__detail {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}
</style>
