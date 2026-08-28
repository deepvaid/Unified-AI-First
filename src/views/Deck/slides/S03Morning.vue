<script setup lang="ts">
// "Same morning, new soul" — a living recreation of today's real dashboard
// (drawn from UAT captures) that melts into the sandbox version. No
// screenshots: both sides are HTML, so the moment stays sharp, animates,
// and follows the theme.
import DeckSlide from '../DeckSlide.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'

const KPIS = [
  { label: 'Revenue', value: '$12,868', icon: 'circle-dollar-sign', trend: '+473.4% vs prev 30d' },
  { label: 'Orders', value: '25', icon: 'shopping-cart', trend: '+400.0% vs prev 30d' },
  { label: 'Open rate', value: '54.6%', icon: 'mail-open', trend: '+3.4 pp vs prev 30d' },
  { label: 'Contacts', value: '50', icon: 'users', trend: '+6.4% vs prev 30d' },
]
</script>

<template>
  <DeckSlide eyebrow="Before / after" title="Our dashboard today vs. the sandbox.">
    <div class="mo__stage cine" :style="{ '--ci': 1.2 }">
      <!-- TODAY — faithful, gray, hardcoded on purpose: it recreates the current product -->
      <div class="mo__layer mo__today" aria-label="Our product today (recreation)">
        <div class="mo__t-top">
          <span class="mo__t-logo">MAROPOST</span>
          <span class="mo__t-search">Search</span>
          <span class="mo__t-avatar" />
        </div>
        <div class="mo__t-body">
          <aside class="mo__t-side">
            <span v-for="item in ['Dashboard', 'Analytics', 'CDP', 'Products', 'Marketing', 'Commerce', 'Service']" :key="item">
              {{ item }}
            </span>
          </aside>
          <div class="mo__t-main">
            <div class="mo__t-greet">Good Morning, Deepak!</div>
            <div class="mo__t-cards">
              <div class="mo__t-card">
                <div class="mo__t-card-title">Recent Updated Lists</div>
                <div class="mo__t-line" />
                <div class="mo__t-line mo__t-line--short" />
              </div>
              <div class="mo__t-card">
                <div class="mo__t-card-title">Deliverability Score</div>
                <div class="mo__t-donut"><span>0</span>&nbsp;|&nbsp;10</div>
              </div>
              <div class="mo__t-card">
                <div class="mo__t-card-title">Email Usage</div>
                <div class="mo__t-zero">0</div>
                <div class="mo__t-sub">of 300,000 Emails</div>
              </div>
            </div>
          </div>
        </div>
        <span class="mo__chip mo__chip--today">Today</span>
      </div>

      <!-- TOMORROW — the same morning, built from the real system pieces -->
      <div class="mo__layer mo__tomorrow" aria-label="The same screen in the sandbox">
        <div class="mo__n-top">
          <span class="mo__n-search">Find or Ask&nbsp;&nbsp;⌘K</span>
          <span class="mo__n-orb" />
        </div>
        <div class="mo__n-body">
          <aside class="mo__n-rail">
            <span v-for="n in 6" :key="n" class="mo__n-dot" />
          </aside>
          <div class="mo__n-main">
            <div class="mo__n-greet">Good morning, Deepak</div>
            <div class="mo__n-kpis">
              <MpKpiCard
                v-for="kpi in KPIS"
                :key="kpi.label"
                :label="kpi.label"
                :value="kpi.value"
                :icon="kpi.icon"
                :trend="kpi.trend"
                :trend-positive="true"
              />
            </div>
          </div>
        </div>
        <span class="mo__chip mo__chip--tomorrow">Sandbox</span>
      </div>
    </div>

    <p class="mo__caption cine" :style="{ '--ci': 2.2 }">
      Left state: a recreation of our current dashboard, taken from UAT this morning. Right state:
      the same screen rebuilt in the sandbox — the cards are the actual components, not images.
    </p>
  </DeckSlide>
</template>

<style scoped>
.mo__stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 8.2;
  max-height: 56vh;
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-radius-12);
  overflow: hidden;
  box-shadow: var(--mp-shadow-lg);
  background: rgb(var(--v-theme-surface));
}

.mo__layer {
  position: absolute;
  inset: 0;
}

/* ── TODAY (recreation of the current product — deliberately hardcoded grays) ── */
.mo__today {
  background: #f4f4f4;
  color: #3c4043;
  animation: mo-kenburns 24s ease-in-out infinite alternate;
}

.mo__t-top {
  height: 12%;
  background: #ffffff;
  border-bottom: 1px solid #e2e2e2;
  display: flex;
  align-items: center;
  gap: 3%;
  padding: 0 3%;
}

.mo__t-logo {
  font-weight: 800;
  letter-spacing: 0.12em;
  font-size: clamp(10px, 1.1vw, 15px);
  color: #202124;
}

.mo__t-search {
  flex: 0 0 30%;
  border: 1px solid #d5d5d5;
  border-radius: 4px;
  padding: 1% 2%;
  font-size: clamp(8px, 0.85vw, 12px);
  color: #9aa0a6;
}

.mo__t-avatar {
  margin-left: auto;
  width: clamp(14px, 1.6vw, 22px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: #d5d5d5;
}

.mo__t-body {
  display: flex;
  height: 88%;
}

.mo__t-side {
  flex: 0 0 17%;
  background: #1d2939;
  color: #cbd2dc;
  display: flex;
  flex-direction: column;
  gap: 7%;
  padding: 5% 0 0 4%;
  font-size: clamp(8px, 0.85vw, 12px);
}

.mo__t-main {
  flex: 1;
  padding: 3% 3.5%;
}

.mo__t-greet {
  font-size: clamp(13px, 1.5vw, 21px);
  font-weight: 600;
  color: #202124;
  margin-bottom: 3%;
}

.mo__t-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3%;
}

.mo__t-card {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 5% 6%;
  min-height: 11vw;
  max-height: 22vh;
}

.mo__t-card-title {
  font-size: clamp(8px, 0.9vw, 13px);
  font-weight: 600;
  color: #3c4043;
  margin-bottom: 8%;
}

.mo__t-line {
  height: 6%;
  min-height: 5px;
  background: #ececec;
  border-radius: 2px;
  margin-bottom: 6%;
}

.mo__t-line--short {
  width: 55%;
}

.mo__t-donut {
  font-size: clamp(16px, 2.2vw, 34px);
  font-weight: 300;
  color: #bdc1c6;
  text-align: center;
  padding-top: 6%;
}

.mo__t-donut span {
  color: #202124;
  font-weight: 600;
}

.mo__t-zero {
  font-size: clamp(14px, 1.8vw, 26px);
  font-weight: 600;
  color: #202124;
  text-align: center;
  padding-top: 4%;
}

.mo__t-sub {
  font-size: clamp(7px, 0.8vw, 11px);
  color: #9aa0a6;
  text-align: center;
}

/* ── TOMORROW (the sandbox — real theme tokens, real components) ── */
.mo__tomorrow {
  background: rgb(var(--v-theme-background));
  clip-path: inset(0 100% 0 0);
  animation: mo-reveal 14s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

.mo__n-top {
  height: 12%;
  display: flex;
  align-items: center;
  gap: 2%;
  padding: 0 3%;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid var(--mp-border-subtle);
}

.mo__n-search {
  flex: 0 0 34%;
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-radius-full);
  padding: 1% 3%;
  font-size: clamp(8px, 0.85vw, 12px);
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgb(var(--v-theme-background));
}

.mo__n-orb {
  margin-left: auto;
  width: clamp(14px, 1.6vw, 22px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(var(--v-theme-primary), 0.85), rgba(var(--v-theme-primary), 0.25));
}

.mo__n-body {
  display: flex;
  height: 88%;
}

.mo__n-rail {
  flex: 0 0 6%;
  background: rgb(var(--v-theme-surface));
  border-right: 1px solid var(--mp-border-subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12%;
  padding-top: 8%;
}

.mo__n-dot {
  width: 38%;
  aspect-ratio: 1;
  border-radius: 30%;
  background: rgba(var(--v-theme-on-surface), 0.14);
}

.mo__n-main {
  flex: 1;
  padding: 2.5% 3%;
}

.mo__n-greet {
  font-size: clamp(11px, 1.2vw, 17px);
  font-weight: 650;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-background));
  margin-bottom: 2.5%;
}

.mo__n-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2.5%;
}

/* Scale the real KPI cards down to fit the mini stage without touching them. */
.mo__n-kpis :deep(.mp-kpi-card) {
  padding: 10px 12px !important;
}

.mo__n-kpis :deep(.mp-kpi-value) {
  font-size: clamp(13px, 1.6vw, 24px);
}

/* ── Shared bits ── */
.mo__chip {
  position: absolute;
  top: 4%;
  right: 2.5%;
  padding: 3px 12px;
  border-radius: var(--mp-radius-full);
  font-size: clamp(9px, 0.8vw, 12px);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.mo__chip--today {
  background: #3c4043;
  color: #ffffff;
}

.mo__chip--tomorrow {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.mo__caption {
  margin: var(--mp-space-20) auto 0;
  max-width: 720px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
}

/* The wipe: today holds, tomorrow sweeps across, holds, then resets. */
@keyframes mo-reveal {
  0%, 26% { clip-path: inset(0 100% 0 0); }
  40%, 88% { clip-path: inset(0 0 0 0); }
  97%, 100% { clip-path: inset(0 100% 0 0); }
}

@keyframes mo-kenburns {
  from { transform: scale(1); }
  to { transform: scale(1.035); }
}

@media (prefers-reduced-motion: reduce) {
  .mo__today {
    animation: none;
  }

  /* Hold the reveal mid-wipe so both worlds are visible at once. */
  .mo__tomorrow {
    animation: none;
    clip-path: inset(0 0 0 52%);
  }
}
</style>
