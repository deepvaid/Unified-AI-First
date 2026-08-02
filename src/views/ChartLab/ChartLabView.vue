<script setup lang="ts">
// Chart Lab — isolated review prototype: a reimagined dashboard where every
// widget follows one reference-driven visual package (rounded marks, soft
// gradients inside marks, direct labels, tinted delta pills, tracks for
// context). Reached only via /accounts/:accountId/chart-lab; fixture data.
// An in-app-chrome copy of the same grid lives at /accounts/:accountId/dashboard-lab.
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCopilotStore } from '@/stores/useCopilot'
import LabDashboardGrid from './components/LabDashboardGrid.vue'

// Keep the Da Vinci drawer closed so it never overlaps the review page.
const copilot = useCopilotStore()
watch(() => copilot.isOpen, (open) => { if (open) copilot.close() }, { immediate: true })

const route = useRoute()
const accountId = (route.params.accountId as string) || '2000290'
</script>

<template>
  <!-- Scoped light preview — does not mutate the stored app theme. -->
  <v-theme-provider theme="maropostLight" with-background class="lab-light-scope">
    <div class="lab-root">
      <header class="lab-header">
        <p class="lab-eyebrow">Design exploration · Dashboard charts</p>
        <h1 class="lab-title">Chart exploration</h1>
        <p class="lab-lede">
          A reimagined dashboard testing one unified visual package — rounded chart marks with soft
          gradients, direct value labels, tinted delta pills and context tracks — applied across
          every widget type, not just a palette swap.
        </p>
        <div class="lab-header-meta">
          <p class="lab-data-chip">
            <v-icon size="13" aria-hidden="true">flask-conical</v-icon>
            Prototype fixture data — deterministic, modeled on this account's live values
          </p>
          <RouterLink class="lab-link" :to="{ name: 'DashboardLab', params: { accountId } }">
            View as in-app dashboard
            <v-icon size="14" aria-hidden="true">arrow-right</v-icon>
          </RouterLink>
          <RouterLink class="lab-link" :to="{ name: 'DashboardLab2', params: { accountId } }">
            Option 2 · catalog widgets
            <v-icon size="14" aria-hidden="true">arrow-right</v-icon>
          </RouterLink>
          <RouterLink class="lab-link" :to="{ name: 'Dashboard', params: { accountId } }">
            Open current dashboard
            <v-icon size="14" aria-hidden="true">arrow-right</v-icon>
          </RouterLink>
        </div>
      </header>

      <LabDashboardGrid class="lab-grid" />

      <footer class="lab-footer">
        Maropost design sandbox — isolated prototype route, not linked from navigation. Mock data;
        chart marks use ApexCharts where native, hand-rolled SVG/CSS where the reference look
        (rounded donut segments, pill stacks, tracks) requires it.
      </footer>
    </div>
  </v-theme-provider>
</template>

<style scoped>
.lab-root {
  min-height: 100dvh;
  width: 100%;
  background: var(--surface-canvas);
  color: var(--text-primary);
  font-family: Inter, system-ui, sans-serif;
  padding: 40px clamp(16px, 4vw, 56px) 64px;
  box-sizing: border-box;
}

/* Header */
.lab-header {
  max-width: 860px;
  margin: 0 auto 30px;
  text-align: center;
}

.lab-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-default);
  margin: 0 0 8px;
}

.lab-title {
  font-size: clamp(28px, 4vw, 38px);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}

.lab-lede {
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 14px;
}

.lab-header-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.lab-data-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--surface-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 5px 12px;
  margin: 0;
}

.lab-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-default);
  text-decoration: none;
}

.lab-link:hover {
  text-decoration: underline;
}

.lab-link:focus-visible {
  outline: 2px solid var(--accent-default);
  outline-offset: 2px;
  border-radius: 4px;
}

.lab-grid {
  max-width: 1400px;
  margin: 0 auto;
}

.lab-footer {
  max-width: 1400px;
  margin: 36px auto 0;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
