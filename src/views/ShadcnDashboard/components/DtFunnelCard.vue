<script setup lang="ts">
// "Campaign to purchase funnel" — 6-column stat header, gradient funnel SVG,
// footer stats + biggest-drop-off warning chip. Geometry from the mockup.
import {
  FUNNEL_FOOTER,
  FUNNEL_GRADIENT_STOPS,
  FUNNEL_PATH,
  FUNNEL_STAGES,
} from '../dottedDemoData'
</script>

<template>
  <section class="dt-funnel">
    <div class="dt-funnel__head">
      <div class="dt-funnel__heading">
        <h2 class="dt-funnel__title">Campaign to purchase funnel</h2>
        <p class="dt-funnel__sub">Marketing sends through to commerce orders · last 30 days</p>
      </div>
      <button type="button" class="dt-funnel__picker">
        All email campaigns
        <v-icon size="15" aria-hidden="true">chevron-down</v-icon>
      </button>
    </div>

    <div class="dt-funnel__stages">
      <div v-for="stage in FUNNEL_STAGES" :key="stage.label" class="dt-funnel__stage">
        <span class="dt-funnel__stage-label">{{ stage.label }}</span>
        <span class="dt-funnel__stage-value">{{ stage.value }}</span>
        <span class="dt-funnel__stage-share" :class="{ 'dt-funnel__stage-share--accent': stage.accent }">{{ stage.share }}</span>
      </div>
    </div>

    <svg viewBox="0 0 1200 260" preserveAspectRatio="none" class="dt-funnel__svg" role="img" aria-label="Funnel from 9,840 emails sent down to 10 orders placed">
      <defs>
        <linearGradient id="dtFunnelFill" x1="0" y1="0" x2="1" y2="0">
          <stop v-for="stop in FUNNEL_GRADIENT_STOPS" :key="stop.offset" :offset="stop.offset" :stop-color="stop.color" />
        </linearGradient>
      </defs>
      <path :d="FUNNEL_PATH" fill="url(#dtFunnelFill)" />
      <line v-for="x in [200, 400, 600, 800, 1000]" :key="x" :x1="x" y1="0" :x2="x" y2="260" class="dt-funnel__divider" vector-effect="non-scaling-stroke" />
    </svg>

    <div class="dt-funnel__footer">
      <div v-for="stat in FUNNEL_FOOTER" :key="stat.label" class="dt-funnel__stat">
        <span class="dt-funnel__stat-label">{{ stat.label }}</span>
        <span class="dt-funnel__stat-value">{{ stat.value }}</span>
      </div>
      <span class="dt-funnel__spacer" />
      <div class="dt-funnel__warning">
        <v-icon size="14" aria-hidden="true">trending-down</v-icon>
        <span>Biggest drop-off: opened → clicked, 78.6% lost</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dt-funnel {
  border: 1px solid var(--scn-border);
  border-radius: var(--scn-radius);
  background: var(--scn-card);
  padding: 22px 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dt-funnel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dt-funnel__heading {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dt-funnel__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.012em;
  color: var(--scn-fg);
}

.dt-funnel__sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-funnel__picker {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--scn-border);
  border-radius: 999px;
  background: var(--scn-card);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--scn-fg);
  cursor: pointer;
}

.dt-funnel__picker:hover {
  background: var(--scn-soft);
}

.dt-funnel__stages {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
}

.dt-funnel__stage {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 12px 14px 16px;
  border-left: 1px solid var(--scn-border);
}

.dt-funnel__stage:first-child {
  padding-left: 0;
  border-left: 0;
}

.dt-funnel__stage:last-child {
  padding-right: 0;
}

.dt-funnel__stage-label {
  font-size: 12.5px;
  color: var(--scn-muted);
}

.dt-funnel__stage-value {
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -0.028em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

.dt-funnel__stage-share {
  font-size: 12px;
  font-weight: 600;
  color: var(--scn-muted);
}

.dt-funnel__stage-share--accent {
  color: var(--accent);
}

.dt-funnel__svg {
  width: 100%;
  height: 172px;
  display: block;
}

.dt-funnel__divider {
  stroke: var(--scn-border);
  stroke-width: 1;
}

.dt-funnel__footer {
  display: flex;
  align-items: center;
  gap: 28px;
  padding-top: 16px;
  border-top: 1px solid var(--scn-border);
}

.dt-funnel__stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dt-funnel__stat-label {
  font-size: 11.5px;
  color: var(--scn-muted);
}

.dt-funnel__stat-value {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

.dt-funnel__spacer {
  flex: 1;
}

.dt-funnel__warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--mp-color-light-warningContainer);
  color: var(--mp-color-light-onWarningContainer);
  font-size: 12.5px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .dt-funnel__stages {
    grid-template-columns: repeat(3, 1fr);
    row-gap: 14px;
  }

  .dt-funnel__stage:nth-child(4) {
    padding-left: 0;
    border-left: 0;
  }

  .dt-funnel__footer {
    flex-wrap: wrap;
    gap: 16px 28px;
  }
}
</style>
