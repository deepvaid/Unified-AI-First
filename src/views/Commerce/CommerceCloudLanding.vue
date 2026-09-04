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

        <v-card flat border rounded="lg" class="commerce-landing__hero-card">
          <div class="commerce-landing__hero-metrics">
            <div
              v-for="metric in heroMetrics"
              :key="metric.label"
              class="commerce-landing__hero-metric"
            >
              <span class="commerce-landing__hero-metric-head">
                <v-icon size="16" class="commerce-landing__hero-metric-icon">{{ metric.icon }}</v-icon>
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
          rounded="lg"
          class="commerce-landing__capability"
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
  gap: var(--mp-space-80);
  padding-bottom: var(--mp-space-80);
  color: var(--text-primary);
}

.commerce-landing__hero-inner {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: var(--mp-space-48);
  align-items: center;
  max-width: var(--mp-layout-contentMaxWidth);
  margin: 0 auto;
  padding: var(--mp-space-8) 0 var(--mp-space-32);
}

.commerce-landing__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: var(--mp-space-6) var(--mp-space-14);
  border-radius: var(--mp-radius-full);
  background: var(--accent-soft);
  color: var(--accent-on-container);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-wide);
  margin-bottom: var(--mp-space-20);
}

.commerce-landing__title {
  font-family: var(--mp-fontFamily-base);
  font-weight: var(--mp-fontWeight-heavy);
  font-size: clamp(var(--mp-fontSize-40), 4.2vw, var(--mp-display-lg-fontSize));
  line-height: var(--mp-lineHeight-display);
  letter-spacing: var(--mp-letterSpacing-tighter);
  margin: 0 0 var(--mp-space-20);
  color: var(--text-primary);
}

.commerce-landing__title-accent {
  color: var(--accent-default);
  display: inline-block;
}

.commerce-landing__subtitle {
  font-size: var(--mp-fontSize-16);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-muted);
  margin: 0 0 var(--mp-space-32);
  max-width: var(--mp-component-state-measure);
}

/* !important is load-bearing: maropostDefaults.VBtn writes padding-inline as an
   INLINE style on every v-btn, and an inline style beats any class selector
   however specific. Same reason MpSegmentedControl marks its own geometry. */
.v-btn.commerce-landing__cta {
  padding-inline: var(--mp-space-28) !important;
  font-weight: var(--mp-fontWeight-semibold);
}

/* Card insets come from component.card.*, never a pa-* utility on the root. */
.commerce-landing__hero-card {
  width: 100%;
  max-width: var(--mp-component-state-measureWide);
  margin-left: auto;
  padding: var(--mp-component-card-paddingSpacious);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
}

.commerce-landing__hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--mp-space-12);
}

/* Tiles inside the bordered card separate by fill, not by a second border. */
.commerce-landing__hero-metric {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  padding: var(--mp-space-14) var(--mp-space-16);
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
}

.commerce-landing__hero-metric-head {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  color: var(--text-muted);
}

.commerce-landing__hero-metric-icon {
  color: var(--accent-default);
}

.commerce-landing__hero-metric-label {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--text-muted);
}

.commerce-landing__hero-metric-value {
  font-size: var(--mp-fontSize-24);
  font-weight: var(--mp-fontWeight-bold);
  color: var(--text-primary);
  letter-spacing: var(--mp-letterSpacing-tight);
  font-variant-numeric: tabular-nums;
}

/* aspect-ratio gives the BOX its 16:5 shape; the svg then fills that box.
   It must stay in flow — absolutely positioned with `inset` and `width/height:
   auto`, a replaced element resolves its height from the viewBox ratio (100:80)
   and over-constrains `bottom` away, which rendered the chart 2.3x too tall and
   painted it over the hero footer. */
.commerce-landing__hero-chart {
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
  aspect-ratio: 16 / 5;
  padding: var(--mp-space-16);

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.commerce-landing__hero-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--mp-space-12);
}

.commerce-landing__hero-footer-cell {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  padding: var(--mp-space-14) var(--mp-space-16);
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
}

.commerce-landing__hero-footer-value {
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-fontWeight-bold);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.commerce-landing__hero-footer-status {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
  font-size: var(--mp-fontSize-14);
  color: var(--text-primary);
}

.commerce-landing__status-dot {
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  background: var(--pos);
  box-shadow: 0 0 0 var(--mp-space-2) var(--pos-soft);
}

/* A rounded band inside the content column — no bleed past the shell inset. */
.commerce-landing__trust {
  background: var(--accent-soft);
  border-radius: var(--mp-component-card-radius);
  padding: var(--mp-space-28) var(--mp-space-32);
}

.commerce-landing__trust-inner {
  display: flex;
  align-items: center;
  gap: var(--mp-space-40);
  max-width: var(--mp-layout-contentMaxWidth);
  margin: 0 auto;
  flex-wrap: wrap;
}

.commerce-landing__trust-label {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--accent-on-container);
  line-height: var(--mp-lineHeight-tight);
  flex-shrink: 0;
}

.commerce-landing__trust-brands {
  display: flex;
  align-items: center;
  gap: var(--mp-space-40);
  flex-wrap: wrap;
  flex: 1;
  justify-content: space-around;
}

.commerce-landing__trust-brand {
  font-size: var(--mp-fontSize-16);
  color: var(--accent-on-container);
  text-transform: uppercase;
}

.commerce-landing__narrative {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  font-size: var(--mp-fontSize-16);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-16);

  strong {
    color: var(--text-primary);
    font-weight: var(--mp-fontWeight-bold);
  }

  p {
    margin: 0;
  }
}

.commerce-landing__capabilities {
  max-width: var(--mp-layout-contentMaxWidth);
  margin: 0 auto;
  width: 100%;
}

.commerce-landing__capabilities-head {
  text-align: center;
  margin-bottom: var(--mp-space-40);
}

.commerce-landing__section-title {
  font-size: clamp(var(--mp-fontSize-28), 3vw, var(--mp-fontSize-40));
  font-weight: var(--mp-fontWeight-heavy);
  letter-spacing: var(--mp-letterSpacing-tighter);
  margin: 0 0 var(--mp-space-8);
  color: var(--text-primary);
}

.commerce-landing__section-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--mp-fontSize-16);
}

.commerce-landing__capabilities-list {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-24);
}

.commerce-landing__capability {
  padding: var(--mp-component-card-paddingSpacious);
}

.commerce-landing__capability-inner {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: var(--mp-space-32);
  align-items: center;
}

.commerce-landing__capability-copy {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
}

.commerce-landing__capability-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-40);
  height: var(--mp-space-40);
  border-radius: var(--mp-radius-12);
  background: var(--accent-soft);
  color: var(--accent-on-container);
}

.commerce-landing__capability-title {
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-fontWeight-bold);
  margin: 0;
  color: var(--text-primary);
}

.commerce-landing__capability-body {
  margin: 0;
  color: var(--text-muted);
  line-height: var(--mp-lineHeight-normal);
  max-width: 520px;
}

.commerce-landing__capability-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
  border: 1px dashed var(--border-default);
}

.commerce-landing__capability-visual-placeholder {
  color: var(--text-disabled);
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .commerce-landing__hero-inner {
    grid-template-columns: 1fr;
    gap: var(--mp-space-32);
  }

  .commerce-landing__hero-card {
    max-width: 100%;
    margin-left: 0;
  }

  .commerce-landing__capability-inner {
    grid-template-columns: 1fr;
    gap: var(--mp-space-20);
  }
}

@media (max-width: ($mp-layout-breakpointCompact - 0.02px)) {
  .commerce-landing {
    gap: var(--mp-space-48);
  }

  .commerce-landing__trust {
    padding: var(--mp-space-24) var(--mp-space-20);
  }

  .commerce-landing__hero-metrics {
    grid-template-columns: 1fr;
  }

  .commerce-landing__hero-footer {
    grid-template-columns: 1fr;
  }
}
</style>
