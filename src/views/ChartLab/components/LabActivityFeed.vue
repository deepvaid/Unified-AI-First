<script setup lang="ts">
// Restyled activity feed — icon chip + eyebrow/title/meta rows, mirroring the
// real marketing_live_activity feed shape.
export interface ActivityItem {
  id: string
  icon: string
  eyebrow: string
  title: string
  meta: string
}

defineProps<{
  items: ActivityItem[]
  listLabel: string
}>()
</script>

<template>
  <ol class="laf" :aria-label="listLabel">
    <li v-for="it in items" :key="it.id" class="laf__item">
      <span class="laf__chip" aria-hidden="true">
        <v-icon size="14">{{ it.icon }}</v-icon>
      </span>
      <div class="laf__body">
        <span class="laf__eyebrow">{{ it.eyebrow }}</span>
        <span class="laf__title">{{ it.title }}</span>
      </div>
      <span class="laf__meta">{{ it.meta }}</span>
    </li>
  </ol>
</template>

<style scoped>
.laf {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
}

.laf__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 2px;
}

.laf__item + .laf__item {
  border-top: 1px solid var(--border-subtle);
}

.laf__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--surface-secondary);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.laf__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.laf__eyebrow {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.laf__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.laf__meta {
  font-size: 11.5px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
