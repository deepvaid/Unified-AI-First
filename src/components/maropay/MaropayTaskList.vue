<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import { ROLE_LABELS } from '@/maropay/model'
import type { ActionTask, TaskKind } from '@/maropay/model'
import { formatDay } from '@/maropay/readiness'

// Open Maropay tasks, each linking to exactly where it gets fixed. A task
// waiting on our payments partner reads differently from one waiting on the
// merchant — "waiting" is not "action required".

const props = withDefaults(defineProps<{
  items: Array<{ task: ActionTask; to: RouteLocationRaw }>
  title?: string
  /** Clock for "due" / "overdue" wording. */
  now?: number
  headingLevel?: number
}>(), {
  title: 'To do',
  now: () => Date.now(),
  headingLevel: 2,
})

const ICONS: Record<TaskKind, string> = {
  verification: 'id-card',
  bank: 'landmark',
  payout_failed: 'landmark',
  dispute: 'shield-alert',
  method_review: 'clock',
  owner_review: 'user-check',
  business_change: 'building-2',
  activate_store: 'rocket',
}

function dueLabel(task: ActionTask): string | null {
  if (task.status === 'waiting_review') return 'Waiting on review'
  if (!task.dueAt) return null
  return Date.parse(task.dueAt) <= props.now ? `Overdue since ${formatDay(task.dueAt)}` : `Due ${formatDay(task.dueAt)}`
}
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset">
    <MpSectionHeader :title="title" :heading-level="headingLevel" :description="`${items.length} open`" />
    <MpListRow
      v-for="{ task, to } in items"
      :key="task.id"
      variant="divided"
      :to="to"
      :title="task.title"
      :subtitle="task.description"
    >
      <template #lead>
        <v-icon size="16" class="maropay-tasks__icon" :class="{ 'maropay-tasks__icon--urgent': task.blocking && task.status === 'open' }">
          {{ ICONS[task.kind] }}
        </v-icon>
      </template>
      <template #trailing>
        <span class="maropay-tasks__meta">
          <span v-if="dueLabel(task)" class="maropay-tasks__due" :class="{ 'maropay-tasks__due--waiting': task.status === 'waiting_review' }">{{ dueLabel(task) }}</span>
          <span class="maropay-tasks__role">{{ ROLE_LABELS[task.role] }}</span>
        </span>
        <v-icon size="16" class="maropay-tasks__chevron">chevron-right</v-icon>
      </template>
    </MpListRow>
  </v-card>
</template>

<style scoped>
.maropay-tasks__icon {
  color: var(--icon-secondary);
}

.maropay-tasks__icon--urgent {
  color: var(--warn-ink);
}

.maropay-tasks__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--mp-space-2);
  margin-inline-end: var(--mp-space-8);
  text-align: right;
}

.maropay-tasks__due {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--warn-ink);
}

.maropay-tasks__due--waiting {
  font-weight: var(--mp-fontWeight-medium);
  color: var(--on-surface-muted);
}

.maropay-tasks__role {
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}

.maropay-tasks__chevron {
  color: var(--icon-secondary);
}
</style>
