<script setup lang="ts">
import type { DashboardActivityData } from '@/stores/dashboards/types'

defineProps<{
  data: DashboardActivityData
}>()

const tagColors: Record<string, { bg: string; color: string }> = {
  email: { bg: 'var(--accent-soft)', color: 'var(--accent-ink)' },
  order: { bg: 'color-mix(in oklch, var(--cloud-commerce-accent) 12%, transparent)', color: 'var(--cloud-commerce-text)' },
  audience: { bg: 'color-mix(in oklch, var(--cloud-contacts-accent) 12%, transparent)', color: 'var(--cloud-contacts-text)' },
  automation: { bg: 'color-mix(in oklch, var(--cloud-marketing-accent) 12%, transparent)', color: 'var(--cloud-marketing-text)' },
}

function getTagStyle(tag: string) {
  const fallback = tagColors.email
  const picked = tag in tagColors ? tagColors[tag as keyof typeof tagColors] : undefined
  const colors = (picked ?? fallback) as { bg: string; color: string }
  return { background: colors.bg, color: colors.color }
}
</script>

<template>
  <div class="activity-feed">
    <div
      v-for="(item, index) in data.items"
      :key="item.id"
      class="activity-feed__row"
      :class="{ 'activity-feed__row--last': index === data.items.length - 1 }"
    >
      <span class="activity-feed__chip" :style="getTagStyle(item.tag)">
        <v-icon size="14">{{ item.icon }}</v-icon>
      </span>
      <div class="activity-feed__content">
        <div class="activity-feed__eyebrow">{{ item.eyebrow }}</div>
        <div class="activity-feed__title">{{ item.title }}</div>
        <div v-if="item.meta" class="activity-feed__meta">{{ item.meta }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-feed {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.activity-feed__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.activity-feed__row--last {
  border-bottom: none;
}

.activity-feed__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--r-chip);
}

.activity-feed__content {
  min-width: 0;
  flex: 1;
}

.activity-feed__eyebrow {
  font-family: ui-monospace, "SF Mono", monospace;
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  margin-bottom: 1px;
}

.activity-feed__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-feed__meta {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  margin-top: 1px;
}
</style>
