<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'

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
</script>

<template>
  <div class="commerce-landing">
    <div class="commerce-landing__inner">
      <MpPageHeader
        eyebrow="Commerce Cloud"
        variant="display"
        title="Commerce Cloud"
        subtitle="Products, orders, and fulfillment on one operational backbone."
      />

      <!-- Single ink-panel branded moment: the upsell -->
      <section class="commerce-upsell mp-ink-panel mp-enter" aria-labelledby="commerce-upsell-title">
        <span class="commerce-upsell__eyebrow mp-meta-label">Upgrade</span>
        <h2 id="commerce-upsell-title" class="commerce-upsell__title">
          Operate your entire commerce business from one platform
        </h2>
        <p class="commerce-upsell__body mp-ink-panel__muted">
          Unify products, inventory, orders, and fulfillment to scale without operational complexity.
        </p>
        <button type="button" class="ink-cta ink-cta--solid">
          Talk to Sales
          <v-icon size="15" class="ink-cta__arrow">arrow-right</v-icon>
        </button>
      </section>

      <section class="commerce-landing__trust">
        <div class="commerce-landing__trust-label">Trusted by brands</div>
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
          <span class="commerce-landing__capabilities-eyebrow mp-meta-label">Key capabilities</span>
          <h2 class="commerce-landing__section-title">Everything you need to scale operations</h2>
        </header>

        <div class="commerce-landing__capabilities-list mp-enter-stagger">
          <div
            v-for="capability in capabilities"
            :key="capability.title"
            class="commerce-landing__capability"
          >
            <span class="commerce-landing__capability-icon" aria-hidden="true">
              <v-icon size="18">{{ capability.icon }}</v-icon>
            </span>
            <div class="commerce-landing__capability-copy">
              <h3 class="commerce-landing__capability-title">{{ capability.title }}</h3>
              <p class="commerce-landing__capability-body">{{ capability.body }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.commerce-landing {
  color: var(--mb-color-text);
  padding-bottom: 96px;
}

.commerce-landing__inner {
  display: flex;
  flex-direction: column;
  gap: 48px;
  max-width: 1120px;
  margin: 0 auto;
  width: 100%;
}

/* ===== Ink upsell panel ===== */
.commerce-upsell {
  display: flex;
  flex-direction: column;
  padding: 40px;
  max-width: 720px;
}

.commerce-upsell__eyebrow {
  display: block;
  margin-bottom: 16px;
}

.commerce-upsell__title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--ink-panel-fg);
}

.commerce-upsell__body {
  margin: 0 0 28px;
  font-size: 14px;
  line-height: 1.55;
  max-width: 520px;
}

.ink-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 11px 20px;
  border-radius: var(--r-pill);
  border: none;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
}

.ink-cta--solid {
  background: var(--ink-panel-accent);
  color: var(--ink-panel-bg);
}

.ink-cta--solid:hover {
  background: color-mix(in oklch, var(--ink-panel-accent) 88%, white);
  transform: translateY(-1px);
}

.ink-cta:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--ink-panel-accent) 45%, transparent);
}

.ink-cta__arrow {
  transition: transform var(--dur-fast) var(--ease);
}

.ink-cta:hover .ink-cta__arrow {
  transform: translateX(2px);
}

/* ===== Trust strip (neutral, no colored band) ===== */
.commerce-landing__trust {
  display: flex;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
  padding: 24px 0;
  border-top: 1px solid var(--mb-color-border-subtle);
  border-bottom: 1px solid var(--mb-color-border-subtle);
}

.commerce-landing__trust-label {
  font-size: var(--mb-font-size-sm);
  font-weight: var(--mb-font-weight-semibold);
  color: var(--mb-color-text-muted);
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
  color: var(--mb-color-text-muted);
  text-transform: uppercase;
}

/* ===== Narrative ===== */
.commerce-landing__narrative {
  max-width: 720px;
  font-size: 1.02rem;
  line-height: 1.6;
  color: var(--mb-color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 16px;

  strong {
    color: var(--mb-color-text);
    font-weight: var(--mb-font-weight-bold);
  }

  p {
    margin: 0;
  }
}

/* ===== Capabilities (neutral light, quiet icons) ===== */
.commerce-landing__capabilities-head {
  margin-bottom: 24px;
}

.commerce-landing__capabilities-eyebrow {
  display: block;
  margin-bottom: 8px;
}

.commerce-landing__section-title {
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  font-weight: var(--mb-font-weight-heavy, 800);
  letter-spacing: var(--mb-letter-spacing-tighter);
  margin: 0;
  color: var(--mb-color-text);
}

.commerce-landing__capabilities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.commerce-landing__capability {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--mb-color-border-subtle);
  border-radius: var(--r-section);
  background: var(--mb-color-surface);
  transition: border-color var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
}

.commerce-landing__capability:hover {
  border-color: color-mix(in oklch, var(--ink) 32%, var(--mb-color-border-subtle));
  transform: translateY(-1px);
}

.commerce-landing__capability-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--mb-radius-md);
  background: var(--mb-color-surface-subtle);
  color: var(--mb-color-text-muted);
}

.commerce-landing__capability-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.commerce-landing__capability-title {
  font-size: 1.05rem;
  font-weight: var(--mb-font-weight-bold);
  margin: 0;
  color: var(--mb-color-text);
}

.commerce-landing__capability-body {
  margin: 0;
  color: var(--mb-color-text-muted);
  line-height: 1.55;
  max-width: 640px;
}

@media (max-width: 640px) {
  .commerce-upsell {
    padding: 28px;
  }
}
</style>
