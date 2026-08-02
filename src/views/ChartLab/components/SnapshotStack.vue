<script setup lang="ts">
// Side stack: mini stat cards + a Da Vinci smart-suggestion card (reference:
// "Weekly Performance" column). Generic: stats and suggestion via props.
export interface SnapshotStat {
  label: string
  value: string
  deltaLabel: string
  /** Controls the delta color — callers decide whether up is good. */
  tone: 'pos' | 'neg'
  /** Arrow direction, independent of tone. */
  up: boolean
}

defineProps<{
  title: string
  stats: SnapshotStat[]
  quote: string
  caption: string
}>()
</script>

<template>
  <div class="snap">
    <section class="snap__card">
      <h3 class="snap__title">{{ title }}</h3>
      <div class="snap__grid">
        <div
          v-for="s in stats"
          :key="s.label"
          class="snap__stat"
          :aria-label="`${s.label}: ${s.value}, ${s.deltaLabel}`"
        >
          <span class="snap__stat-label">{{ s.label }}</span>
          <span class="snap__stat-value">{{ s.value }}</span>
          <span class="snap__stat-delta" :class="s.tone === 'pos' ? 'snap__stat-delta--pos' : 'snap__stat-delta--neg'">
            <v-icon size="12" aria-hidden="true">{{ s.up ? 'trending-up' : 'trending-down' }}</v-icon>
            {{ s.deltaLabel }}
          </span>
        </div>
      </div>
    </section>

    <section class="snap__card">
      <h3 class="snap__title">
        <v-icon size="15" class="snap__spark" aria-hidden="true">sparkles</v-icon>
        Smart Suggestion
      </h3>
      <p class="snap__quote">{{ quote }}</p>
      <p class="snap__caption">
        <v-icon size="12" aria-hidden="true">info</v-icon>
        {{ caption }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.snap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  height: 100%;
}

.snap__card {
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03), 0 10px 28px rgba(15, 23, 42, 0.04);
  padding: 18px 20px;
  flex: 1;
}

.snap__title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.snap__spark {
  color: var(--accent-default);
}

.snap__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.snap__stat {
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.snap__stat-label {
  font-size: 11.5px;
  color: var(--text-muted);
}

.snap__stat-value {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.snap__stat-delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.snap__stat-delta--pos {
  color: var(--pos-ink);
}

.snap__stat-delta--neg {
  color: var(--neg-ink);
}

.snap__quote {
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-secondary);
  margin: 0 0 10px;
}

.snap__caption {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--text-muted);
  margin: 0;
}
</style>
