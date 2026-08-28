<script setup lang="ts">
// "Needs your attention" banner (dotted Overview v2): collapsible summary row
// + item rows with tinted icon tiles and per-row actions. Renders bespoke —
// the widget card suppresses its standard header for this type.
import { computed, ref } from 'vue'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { formatAgo } from '@/composables/useRelativeTime'
import type { DashboardAttentionData, DashboardAttentionItem, DashboardAttentionSeverity } from '@/stores/dashboards/types'

const props = defineProps<{
  data: DashboardAttentionData
}>()

const emit = defineEmits<{
  action: [item: DashboardAttentionItem]
  collapse: [collapsed: boolean]
}>()

const { loading } = useInitialLoad(450)

// Starts collapsed — the banner should read as a quiet summary row until the
// user opts to expand it, not reclaim a full row of vertical space by default.
const open = ref(false)

function toggle() {
  open.value = !open.value
  emit('collapse', !open.value)
}

const visibleItems = computed(() => props.data.items.slice(0, 5))

const SEVERITY_LABELS: Record<DashboardAttentionSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

const SEVERITY_FALLBACK_ICONS: Record<DashboardAttentionSeverity, string> = {
  critical: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
}

const summary = computed(() => {
  const counts: Record<DashboardAttentionSeverity, number> = { critical: 0, warning: 0, info: 0 }
  visibleItems.value.forEach((item) => { counts[item.severity] += 1 })
  const parts: string[] = []
  if (counts.critical) parts.push(`${counts.critical} critical`)
  if (counts.warning) parts.push(`${counts.warning} warning${counts.warning > 1 ? 's' : ''}`)
  if (counts.info) parts.push(`${counts.info} informational`)
  return parts.join(' · ')
})
</script>

<template>
  <div class="attention-widget" :class="{ 'attention-widget--collapsed': !open && !loading && visibleItems.length > 0 }">
    <!-- Loading: pulse-bar skeleton rows (MpTableSkeleton convention) -->
    <div v-if="loading" class="attention-widget__skeleton" role="status" aria-live="polite" aria-label="Loading attention items">
      <div v-for="row in 4" :key="row" class="attention-widget__skeleton-row">
        <span class="attention-widget__skeleton-dot" />
        <span class="attention-widget__skeleton-bar" :style="{ width: `${52 - row * 6}%` }" />
        <span class="attention-widget__skeleton-bar attention-widget__skeleton-bar--action" />
      </div>
      <span class="d-sr-only">Loading data…</span>
    </div>

    <!-- Empty: all caught up -->
    <div v-else-if="visibleItems.length === 0" class="attention-widget__empty">
      <div class="attention-widget__empty-icon">
        <v-icon size="22">check-circle</v-icon>
      </div>
      <div class="attention-widget__empty-title">You're all caught up</div>
      <div class="attention-widget__empty-sub">We'll surface anything that needs action here.</div>
    </div>

    <template v-else>
      <button type="button" class="attention-widget__toggle" :aria-expanded="open" @click="toggle">
        <span class="attention-widget__pulse" aria-hidden="true" />
        <span class="attention-widget__count">{{ visibleItems.length }} things need your attention</span>
        <span class="attention-widget__summary">{{ summary }}</span>
        <span class="attention-widget__spacer" />
        <span class="attention-widget__state">
          {{ open ? 'Hide' : 'Show' }}
          <v-icon size="15" class="attention-widget__chev" :class="{ 'attention-widget__chev--open': open }" aria-hidden="true">chevron-down</v-icon>
        </span>
      </button>

      <ul v-if="open" class="attention-widget__list" aria-label="Items needing attention">
        <li v-for="item in visibleItems" :key="item.id" class="attention-widget__row">
          <span class="attention-widget__icon" :class="`attention-widget__icon--${item.severity}`" aria-hidden="true">
            <v-icon size="14">{{ item.icon ?? SEVERITY_FALLBACK_ICONS[item.severity] }}</v-icon>
          </span>
          <div class="attention-widget__copy">
            <div class="attention-widget__title">
              <span class="d-sr-only">{{ SEVERITY_LABELS[item.severity] }}: </span>
              {{ item.title }}
            </div>
            <div class="attention-widget__context">{{ item.context }}</div>
          </div>
          <span class="attention-widget__spacer" />
          <span class="attention-widget__time">{{ formatAgo(item.occurredAt) }}</span>
          <v-btn
            variant="outlined"
            size="small"
            class="attention-widget__action"
            @click="emit('action', item)"
          >
            {{ item.actionLabel }}
          </v-btn>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
/* P4-1: this widget draws its OWN header/body edges (DashboardWidgetCard zeroes
   its body inset for bespoke-header widgets), so it states the widget inset
   directly — `component.card.padding`, the same 20 the rest of the family gets
   from the card. Stated as the role token, not the 20 primitive, so a change to
   the standard moves this with it. */
.attention-widget {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  container-type: inline-size;
}

/* Collapsed: the summary row is the whole card — center it vertically so the
   shrunken grid row reads as a deliberate banner, not a clipped card. */
.attention-widget--collapsed {
  justify-content: center;
  overflow-y: hidden;
}

.attention-widget__toggle {
  width: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
  /* Tight — this is the collapsed default state, sized to a single compact row. */
  padding: var(--mp-space-8) var(--mp-component-card-padding);
  border: 0;
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.attention-widget__pulse {
  width: 7px;
  height: 7px;
  border-radius: 99px;
  background: var(--neg);
  flex: none;
}

.attention-widget__count {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
}

.attention-widget__summary {
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attention-widget__spacer {
  flex: 1;
}

.attention-widget__state {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--muted);
  white-space: nowrap;
}

.attention-widget__chev {
  transition: transform 0.15s ease;
}

.attention-widget__chev--open {
  transform: rotate(180deg);
}

.attention-widget__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--border-subtle);
  /* Fill the fixed grid row — rows stretch evenly instead of leaving a slab
     of dead space under the last separator. */
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.attention-widget__row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-14);
  padding: var(--mp-space-14) var(--mp-component-card-padding);
  min-width: 0;
  flex: 1 1 auto;
}

.attention-widget__row + .attention-widget__row {
  border-top: 1px solid var(--border-subtle);
}

.attention-widget__row:hover {
  background: var(--surface-secondary);
}

.attention-widget__icon {
  width: 26px;
  height: 26px;
  flex: none;
  border-radius: var(--mp-component-chip-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.attention-widget__icon--critical {
  background: color-mix(in oklch, rgb(var(--v-theme-error)) 10%, transparent);
  color: rgb(var(--v-theme-error));
}

.attention-widget__icon--warning {
  background: color-mix(in oklch, rgb(var(--v-theme-warning)) 14%, transparent);
  color: rgb(var(--v-theme-warning));
}

.attention-widget__icon--info {
  background: color-mix(in oklch, var(--accent) 10%, transparent);
  color: var(--accent);
}

.attention-widget__copy {
  min-width: 0;
  flex: 0 1 auto;
}

.attention-widget__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attention-widget__context {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attention-widget__time {
  flex-shrink: 0;
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
  white-space: nowrap;
}

.attention-widget__action {
  flex-shrink: 0;
  text-transform: none;
}

/* Below ~560px containers there is no room for the summary + timestamp —
   keep the count, icon tiles, copy, and action. */
@container (max-width: 560px) {
  .attention-widget__summary,
  .attention-widget__time {
    display: none;
  }
}

/* Empty state — mirrors the bespoke dashboard-widget-card empty pattern */
.attention-widget__empty {
  display: flex;
  flex: 1 1 auto;
  min-height: 160px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  padding: var(--mp-space-24);
  gap: var(--mp-space-6);
}

.attention-widget__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--mp-radius-full);
  background: var(--pos-soft);
  color: var(--pos-ink);
  margin-bottom: var(--mp-space-4);
}

.attention-widget__empty-title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.attention-widget__empty-sub {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--muted);
}

/* Loading skeleton — opacity-pulse bars (MpTableSkeleton convention) */
.attention-widget__skeleton {
  display: flex;
  flex-direction: column;
  padding: var(--mp-space-4) var(--mp-component-card-padding);
}

.attention-widget__skeleton-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
  padding: var(--mp-space-14) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.attention-widget__skeleton-row:last-child {
  border-bottom: none;
}

.attention-widget__skeleton-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: var(--mp-radius-full);
  background: color-mix(in oklch, var(--text-primary) 12%, transparent);
  animation: mp-skeleton-pulse 1.6s ease-in-out infinite;
}

.attention-widget__skeleton-bar {
  height: 12px;
  border-radius: var(--mp-radius-4);
  background: color-mix(in oklch, var(--text-primary) 8%, transparent);
  animation: mp-skeleton-pulse 1.6s ease-in-out infinite;
}

.attention-widget__skeleton-bar--action {
  width: 72px;
  margin-left: auto;
}

@keyframes mp-skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .attention-widget__skeleton-dot,
  .attention-widget__skeleton-bar {
    animation: none;
  }
}
</style>
