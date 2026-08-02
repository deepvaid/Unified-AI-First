<script setup lang="ts">
// shadcn list-card treatment of the live activity feed: soft icon tile,
// title + muted eyebrow, right-aligned muted timestamp, hairline dividers.
export interface ScnActivityItem {
  id: string
  icon: string
  eyebrow: string
  title: string
  meta: string
}

defineProps<{ items: ScnActivityItem[] }>()
</script>

<template>
  <ul class="scn-activity">
    <li v-for="item in items" :key="item.id" class="scn-activity__row">
      <span class="scn-activity__icon">
        <v-icon size="15" aria-hidden="true">{{ item.icon }}</v-icon>
      </span>
      <span class="scn-activity__body">
        <span class="scn-activity__eyebrow">{{ item.eyebrow }}</span>
        <span class="scn-activity__title">{{ item.title }}</span>
      </span>
      <span class="scn-activity__meta">{{ item.meta }}</span>
    </li>
  </ul>
</template>

<style scoped>
.scn-activity {
  list-style: none;
  margin: 0;
  padding: 0;
}

.scn-activity__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}

.scn-activity__row + .scn-activity__row {
  border-top: 1px solid var(--scn-border);
}

.scn-activity__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--scn-soft);
  color: var(--scn-muted);
  flex-shrink: 0;
}

.scn-activity__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.scn-activity__eyebrow {
  font-size: 12px;
  color: var(--scn-muted);
}

.scn-activity__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--scn-fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scn-activity__meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--scn-muted);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
