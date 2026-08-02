<script setup lang="ts">
// Dashboard Lab — a COPY of the Overview dashboard wearing the new visual
// package, rendered inside the real app chrome (sidebar + app bar render
// because this route has no fullPage meta). The production dashboard route
// and components are untouched; everything here is ChartLab fixture code.
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCopilotStore } from '@/stores/useCopilot'
import LabDashboardGrid from './components/LabDashboardGrid.vue'

// Keep the Da Vinci drawer closed so the copy reviews cleanly.
const copilot = useCopilotStore()
watch(() => copilot.isOpen, (open) => { if (open) copilot.close() }, { immediate: true })

const route = useRoute()
const accountId = (route.params.accountId as string) || '2000290'
</script>

<template>
  <div class="dlb">
    <!-- Dashboard-style page header (visual copy; controls are inert placeholders) -->
    <header class="dlb__header">
      <div class="dlb__row">
        <div class="dlb__titles">
          <p class="dlb__eyebrow">Dashboards</p>
          <div class="dlb__title-line">
            <v-icon size="18" class="dlb__star" aria-hidden="true">star</v-icon>
            <h1 class="dlb__title">Overview</h1>
            <span class="dlb__chip">New look · prototype</span>
          </div>
        </div>
        <div class="dlb__actions">
          <RouterLink class="dlb__switch" :to="{ name: 'DashboardLab2', params: { accountId } }">
            View Option 2
            <v-icon size="14" aria-hidden="true">arrow-right</v-icon>
          </RouterLink>
          <v-btn variant="outlined" size="small" disabled>Actions</v-btn>
          <v-btn color="primary" size="small" prepend-icon="plus" disabled>Add widget</v-btn>
        </div>
      </div>
      <div class="dlb__filters">
        <span class="dlb__filter-chip">
          <v-icon size="13" aria-hidden="true">calendar</v-icon>
          Last 30 days
          <v-icon size="13" aria-hidden="true">chevron-down</v-icon>
        </span>
        <span class="dlb__live">
          <span class="dlb__live-dot" aria-hidden="true" />
          Live · synced 2 min ago
        </span>
      </div>
    </header>

    <LabDashboardGrid :show-notes="false" />

    <p class="dlb__footnote">
      Prototype copy of the Overview dashboard — new chart system on fixture data. The real
      dashboard is unchanged at its usual URL.
    </p>
  </div>
</template>

<style scoped>
.dlb {
  width: 100%;
  font-family: Inter, system-ui, sans-serif;
}

.dlb__header {
  margin-bottom: 18px;
}

.dlb__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.dlb__eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0 0 2px;
}

.dlb__title-line {
  display: flex;
  align-items: center;
  gap: 9px;
}

.dlb__star {
  color: #d7a437;
}

.dlb__title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--text-primary);
}

.dlb__chip {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-default);
  background: color-mix(in srgb, var(--accent-default) 10%, transparent);
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
}

.dlb__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dlb__switch {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-default);
  text-decoration: none;
}

.dlb__switch:hover {
  text-decoration: underline;
}

.dlb__switch:focus-visible {
  outline: 2px solid var(--accent-default);
  outline-offset: 2px;
  border-radius: 4px;
}

.dlb__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.dlb__filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--surface-secondary);
  border-radius: 8px;
  padding: 5px 10px;
}

.dlb__live {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--text-muted);
}

.dlb__live-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--pos-ink, #16a34a);
}

.dlb__footnote {
  margin: 20px 2px 0;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
