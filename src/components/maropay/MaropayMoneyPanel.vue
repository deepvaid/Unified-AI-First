<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import MaropayMoney from './MaropayMoney.vue'
import { formatDay } from '@/maropay/readiness'
import type { BalanceSummary, MoneyBucket, UpcomingPayout } from '@/maropay/readiness'

// "Where your money is right now" — one currency's balance on the ink panel:
// the next payout as the hero figure (an estimate, and it says so), then the
// three places the balance sits — settling, available, on its way — as three
// quiet columns. Numbers carry the message; there is no chart to read twice.
// Currencies are never added together — a multi-currency business gets one
// panel per currency. The panel's text colours are the ink pair, set once on the
// root so every token-driven child (money, labels) picks them up.

const props = withDefaults(defineProps<{
  balance: BalanceSummary
  upcoming: UpcomingPayout | null
  buckets: MoneyBucket[]
  /** "Mercury Bank •••• 4417" — where payouts go. */
  destination?: string | null
  /** Opens the upcoming payout. */
  upcomingTo?: RouteLocationRaw | null
  headingLevel?: 2 | 3
}>(), {
  destination: null,
  upcomingTo: null,
  headingLevel: 2,
})

const headingTag = computed(() => `h${props.headingLevel}`)
const next = computed(() => (props.upcoming?.amount.currency === props.balance.currency ? props.upcoming : null))

const arrival = computed(() => {
  const n = next.value
  if (!n) return 'Nothing waiting to be paid out'
  if (n.blocked) return 'Paused until payouts are fixed'
  return [`Arrives ${formatDay(n.estimatedAt)}`, props.destination].filter(Boolean).join(' · ')
})
</script>

<template>
  <section class="mp-ink-panel money-panel" :aria-labelledby="`money-panel-${balance.currency}`">
    <div class="money-panel__lead">
      <component :is="headingTag" :id="`money-panel-${balance.currency}`" class="money-panel__label mp-ink-panel__muted">Next payout</component>
      <p class="money-panel__amount">
        <span v-if="next" class="money-panel__approx mp-ink-panel__muted" aria-hidden="true">≈</span>
        <span v-if="next" class="d-sr-only">About</span>
        <MaropayMoney :amount="next?.amount ?? { amount: 0, currency: balance.currency }" emphasis="prominent" />
      </p>
      <p class="money-panel__arrival mp-ink-panel__muted" :class="{ 'money-panel__arrival--warn': next?.blocked }">{{ arrival }}</p>
      <RouterLink v-if="next && upcomingTo" :to="upcomingTo" class="money-panel__link mp-ink-panel__accent">See what’s in it</RouterLink>
    </div>

    <dl class="money-panel__buckets" aria-label="Where your money is right now">
      <div v-for="bucket in buckets" :key="bucket.key" class="money-panel__bucket">
        <dt class="money-panel__label mp-ink-panel__muted">{{ bucket.label }}</dt>
        <dd class="money-panel__bucket-amount"><MaropayMoney :amount="bucket.amount" /></dd>
        <dd class="money-panel__bucket-caption mp-ink-panel__muted">{{ bucket.caption }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped lang="scss">
/* The ink skin: every text alias the children consume points at the ink pair, so MaropayMoney's
   cents, labels and captions never inherit a light-surface colour on a dark surface. */
.money-panel {
  --text-primary: var(--ink-panel-fg);
  --text-secondary: var(--ink-panel-muted-fg);
  --text-muted: var(--ink-panel-muted-fg);
  --on-surface: var(--ink-panel-fg);
  --on-surface-muted: var(--ink-panel-muted-fg);
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: var(--mp-space-32);
  padding: var(--mp-space-24) var(--mp-space-28);
  color: var(--ink-panel-fg);
}

.money-panel__lead {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mp-space-6);
}

.money-panel__label {
  margin: 0;
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-text-label-fontWeight);
}

.money-panel__amount {
  display: inline-flex;
  align-items: baseline;
  gap: var(--mp-space-6);
  margin: 0;
}

.money-panel__amount :where(.mp-kpi-value) {
  font-size: var(--mp-text-kpiValueHero-fontSize);
  font-weight: var(--mp-text-kpiValueHero-fontWeight);
  letter-spacing: var(--mp-text-kpiValueHero-letterSpacing);
  line-height: var(--mp-text-kpiValueHero-lineHeight);
}

.money-panel__approx {
  font-size: var(--mp-fontSize-20);
}

.money-panel__arrival {
  margin: 0;
  font-size: var(--mp-fontSize-14);
}

.money-panel__arrival--warn {
  color: var(--warn);
}

.money-panel__link {
  margin-top: var(--mp-space-4);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  text-decoration: none;
}

.money-panel__link:hover,
.money-panel__link:focus-visible {
  text-decoration: underline;
}

.money-panel__link:focus-visible {
  outline: 2px solid var(--ink-panel-accent);
  outline-offset: 2px;
  border-radius: var(--mp-radius-4);
}

/* Three columns, hairlines between them, each the same three lines: label, amount, one caption. */
.money-panel__buckets {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-self: center;
  margin: 0;
}

.money-panel__bucket {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  min-width: 0;
  padding-inline: var(--mp-space-20);
}

.money-panel__bucket + .money-panel__bucket {
  border-inline-start: 1px solid var(--ink-panel-border);
}

.money-panel__bucket:first-child {
  padding-inline-start: 0;
}

.money-panel__bucket dd {
  margin: 0;
}

.money-panel__bucket-amount {
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-fontWeight-semibold);
  font-variant-numeric: tabular-nums;
}

.money-panel__bucket-caption {
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-normal);
}

@media (max-width: #{$mp-layout-breakpointCompact}) {
  .money-panel {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--mp-space-20);
    padding: var(--mp-space-20);
  }

  .money-panel__lead {
    padding-bottom: var(--mp-space-20);
    border-bottom: 1px solid var(--ink-panel-border);
  }

  .money-panel__buckets {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--mp-space-16);
  }

  .money-panel__bucket {
    padding-inline: 0;
  }

  .money-panel__bucket + .money-panel__bucket {
    padding-top: var(--mp-space-16);
    border-inline-start: 0;
    border-top: 1px solid var(--ink-panel-border);
  }
}
</style>
