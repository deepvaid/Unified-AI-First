<script setup lang="ts">
import { computed } from 'vue'

const heroMetrics = [
  { label: 'Storefronts', value: '12', icon: 'store' },
  { label: 'Products', value: '2.4K', icon: 'package' },
  { label: 'Markets', value: '8', icon: 'globe' },
] as const

const heroBars = [38, 52, 46, 64, 58, 72, 81, 74, 92, 85, 78, 88] as const

const trustBrands = [
  { name: 'SEIKO', weight: 600, letterSpacing: '0.18em' },
  { name: 'LUXOTTICA', weight: 600, letterSpacing: '0.2em' },
  { name: 'BioTRUST', weight: 700, letterSpacing: '0' },
  { name: 'weber', weight: 700, letterSpacing: '0' },
  { name: 'Mercedes-Benz', weight: 500, letterSpacing: '0' },
] as const

const capabilities = [
  {
    icon: 'store',
    title: 'Run multiple storefronts from one shared catalog',
    body: 'Manage all storefronts centrally without duplication, so inventory, pricing and product data stay in sync wherever you sell.',
  },
  {
    icon: 'shopping-cart',
    title: 'Unified orders and fulfillment across channels',
    body: 'See every order from every channel in one queue, route shipments automatically, and keep customers updated with real-time status.',
  },
  {
    icon: 'gantt-chart',
    title: 'Operational visibility built for scale',
    body: 'Track revenue, inventory and fulfillment health across brands and markets with dashboards built for commerce operators.',
  },
] as const

const barPath = computed(() => heroBars
  .map((value, index) => {
    const width = 100 / heroBars.length
    const x = index * width + width * 0.18
    const w = width * 0.64
    const height = (value / 100) * 72
    const y = 80 - height
    return `M ${x} ${y} h ${w} v ${height} h -${w} Z`
  })
  .join(' '))
</script>

<template>
  <div class="commerce-landing">
    <section class="commerce-landing__hero">
      <div class="commerce-landing__hero-inner">
        <div class="commerce-landing__hero-copy">
          <span class="commerce-landing__eyebrow">Commerce Cloud</span>
          <h1 class="commerce-landing__title">
            Operate your entire commerce business from
            <span class="commerce-landing__title-accent">one platform</span>
          </h1>
          <p class="commerce-landing__subtitle">
            Unify products, inventory, orders, and fulfillment to scale without operational complexity
          </p>
          <v-btn
            class="commerce-landing__cta text-none"
            color="secondary"
            size="large"
            variant="flat"
            rounded="lg"
          >
            Talk to Sales
          </v-btn>
        </div>

        <v-card flat border rounded="xl" class="pa-8 commerce-landing__hero-card">
          <div class="commerce-landing__hero-metrics">
            <div
              v-for="metric in heroMetrics"
              :key="metric.label"
              class="commerce-landing__hero-metric"
            >
              <span class="commerce-landing__hero-metric-head">
                <v-icon size="14" class="commerce-landing__hero-metric-icon">{{ metric.icon }}</v-icon>
                <span class="commerce-landing__hero-metric-label">{{ metric.label }}</span>
              </span>
              <span class="commerce-landing__hero-metric-value">{{ metric.value }}</span>
            </div>
          </div>

          <div class="commerce-landing__hero-chart" aria-hidden="true">
            <svg viewBox="0 0 100 80" preserveAspectRatio="none" role="presentation">
              <defs>
                <linearGradient id="commerce-landing-bar" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="var(--accent-default)" />
                  <stop offset="100%" stop-color="var(--accent-active)" />
                </linearGradient>
              </defs>
              <path :d="barPath" fill="url(#commerce-landing-bar)" />
            </svg>
          </div>

          <div class="commerce-landing__hero-footer">
            <div class="commerce-landing__hero-footer-cell">
              <span class="commerce-landing__hero-metric-label">Orders Today</span>
              <span class="commerce-landing__hero-footer-value">847</span>
            </div>
            <div class="commerce-landing__hero-footer-cell">
              <span class="commerce-landing__hero-metric-label">Real-time Sync</span>
              <span class="commerce-landing__hero-footer-status">
                <span class="commerce-landing__status-dot" />
                Active
              </span>
            </div>
          </div>
        </v-card>
      </div>
    </section>

    <section class="commerce-landing__trust">
      <div class="commerce-landing__trust-inner">
        <div class="commerce-landing__trust-label">
          Trusted by<br />brands
        </div>
        <div class="commerce-landing__trust-brands">
          <span
            v-for="brand in trustBrands"
            :key="brand.name"
            class="commerce-landing__trust-brand"
            :style="{ fontWeight: brand.weight, letterSpacing: brand.letterSpacing }"
          >
            {{ brand.name }}
          </span>
        </div>
      </div>
    </section>

    <section class="commerce-landing__narrative">
      <p>
        As your business grows, managing storefronts, inventory, and orders
        across multiple systems creates <strong>fragmentation and slows execution</strong>.
      </p>
      <p>
        Commerce Cloud brings everything into a <strong>single operational backbone</strong>
        &mdash; giving your team full control and visibility without adding systems or overhead.
      </p>
    </section>

    <section class="commerce-landing__capabilities">
      <header class="commerce-landing__capabilities-head">
        <h2 class="commerce-landing__section-title">Key capabilities</h2>
        <p class="commerce-landing__section-subtitle">
          Everything you need to scale your commerce operations
        </p>
      </header>

      <div class="commerce-landing__capabilities-list">
        <v-card
          v-for="capability in capabilities"
          :key="capability.title"
          flat
          border
          rounded="xl"
          class="pa-8 commerce-landing__capability"
        >
          <div class="commerce-landing__capability-inner">
            <div class="commerce-landing__capability-copy">
              <span class="commerce-landing__capability-icon" aria-hidden="true">
                <v-icon size="20">{{ capability.icon }}</v-icon>
              </span>
              <h3 class="commerce-landing__capability-title">{{ capability.title }}</h3>
              <p class="commerce-landing__capability-body">{{ capability.body }}</p>
            </div>
            <div class="commerce-landing__capability-visual" aria-hidden="true">
              <span class="commerce-landing__capability-visual-placeholder">
                <v-icon size="36">{{ capability.icon }}</v-icon>
              </span>
            </div>
          </div>
        </v-card>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.commerce-landing {
  display: flex;
  flex-direction: column;
  gap: 72px;
  padding-bottom: 96px;
  color: var(--text-primary);
}

.commerce-landing__hero-inner {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 48px;
  align-items: center;
  max-width: 1120px;
  margin: 0 auto;
  padding: 8px 0 32px;
}

.commerce-landing__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--accent-subtle-bg);
  color: var(--accent-default);
  font-size: var(--mp-typography-fontSize-sm);
  font-weight: var(--mp-typography-fontWeight-semibold);
  letter-spacing: 0.02em;
  margin-bottom: 20px;
}

.commerce-landing__title {
  font-family: var(--mp-typography-fontFamily-base);
  font-weight: var(--mp-typography-fontWeight-heavy);
  font-size: clamp(2.4rem, 4.2vw, 3.6rem);
  line-height: 1.08;
  letter-spacing: var(--mp-typography-letterSpacing-tighter);
  margin: 0 0 20px;
  color: var(--text-primary);
}

.commerce-landing__title-accent {
  color: var(--accent-default);
  display: inline-block;
}

.commerce-landing__subtitle {
  font-size: 1.06rem;
  line-height: 1.55;
  color: var(--text-muted);
  margin: 0 0 32px;
  max-width: 440px;
}

.commerce-landing__cta {
  padding-inline: 28px !important;
  font-weight: var(--mp-typography-fontWeight-semibold);
}

.commerce-landing__hero-card {
  width: 100%;
  max-width: 480px;
  margin-left: auto;
  gap: 20px;
}

.commerce-landing__hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.commerce-landing__hero-metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-borderRadius-md);
  background: var(--surface-primary);
}

.commerce-landing__hero-metric-head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
}

.commerce-landing__hero-metric-icon {
  color: var(--accent-default);
}

.commerce-landing__hero-metric-label {
  font-size: var(--mp-typography-fontSize-xs);
  text-transform: uppercase;
  letter-spacing: var(--mp-typography-letterSpacing-eyebrow);
  font-weight: var(--mp-typography-fontWeight-semibold);
  color: var(--text-muted);
}

.commerce-landing__hero-metric-value {
  font-size: 1.5rem;
  font-weight: var(--mp-typography-fontWeight-bold);
  color: var(--text-primary);
  letter-spacing: var(--mp-typography-letterSpacing-tight);
}

.commerce-landing__hero-chart {
  border-radius: var(--mp-borderRadius-md);
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  padding: 16px;
  height: 132px;

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.commerce-landing__hero-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.commerce-landing__hero-footer-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: var(--mp-borderRadius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-primary);
}

.commerce-landing__hero-footer-value {
  font-size: 1.25rem;
  font-weight: var(--mp-typography-fontWeight-bold);
  color: var(--text-primary);
}

.commerce-landing__hero-footer-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--mp-typography-fontSize-body);
  color: var(--text-primary);
}

.commerce-landing__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgb(var(--v-theme-success));
  box-shadow: 0 0 0 3px rgb(var(--v-theme-success-container));
}

.commerce-landing__trust {
  background: var(--accent-subtle-bg);
  padding: 28px 0;
  margin: 0 calc(-1 * var(--mp-spacing-6));
}

.commerce-landing__trust-inner {
  display: flex;
  align-items: center;
  gap: 40px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 var(--mp-spacing-6);
  flex-wrap: wrap;
}

.commerce-landing__trust-label {
  font-size: var(--mp-typography-fontSize-sm);
  font-weight: var(--mp-typography-fontWeight-semibold);
  color: var(--text-primary);
  line-height: 1.2;
  flex-shrink: 0;
}

.commerce-landing__trust-brands {
  display: flex;
  align-items: center;
  gap: 44px;
  flex-wrap: wrap;
  flex: 1;
  justify-content: space-around;
}

.commerce-landing__trust-brand {
  font-size: 1.05rem;
  color: var(--text-primary);
  opacity: 0.9;
  text-transform: uppercase;
}

.commerce-landing__narrative {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  font-size: 1.02rem;
  line-height: 1.6;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 16px;

  strong {
    color: var(--text-primary);
    font-weight: var(--mp-typography-fontWeight-bold);
  }

  p {
    margin: 0;
  }
}

.commerce-landing__capabilities {
  max-width: 1120px;
  margin: 0 auto;
  width: 100%;
}

.commerce-landing__capabilities-head {
  text-align: center;
  margin-bottom: 40px;
}

.commerce-landing__section-title {
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: var(--mp-typography-fontWeight-heavy);
  letter-spacing: var(--mp-typography-letterSpacing-tighter);
  margin: 0 0 8px;
  color: var(--text-primary);
}

.commerce-landing__section-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 1rem;
}

.commerce-landing__capabilities-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.commerce-landing__capability-inner {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 32px;
  align-items: center;
}

.commerce-landing__capability-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.commerce-landing__capability-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--mp-borderRadius-md);
  background: var(--accent-subtle-bg);
  color: var(--accent-default);
}

.commerce-landing__capability-title {
  font-size: 1.25rem;
  font-weight: var(--mp-typography-fontWeight-bold);
  margin: 0;
  color: var(--text-primary);
}

.commerce-landing__capability-body {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.55;
  max-width: 520px;
}

.commerce-landing__capability-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  border-radius: var(--mp-borderRadius-md);
  background: var(--surface-secondary);
  border: 1px dashed var(--border-default);
}

.commerce-landing__capability-visual-placeholder {
  color: var(--text-disabled);
}

@media (max-width: 960px) {
  .commerce-landing__hero-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .commerce-landing__hero-card {
    max-width: 100%;
    margin-left: 0;
  }

  .commerce-landing__capability-inner {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 640px) {
  .commerce-landing {
    gap: 56px;
  }

  .commerce-landing__hero-metrics {
    grid-template-columns: 1fr;
  }

  .commerce-landing__hero-footer {
    grid-template-columns: 1fr;
  }
}
</style>
