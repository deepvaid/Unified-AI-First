<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MaropayMoney from './MaropayMoney.vue'
import { formatDay } from '@/maropay/readiness'
import type { BalanceSummary, UpcomingPayout } from '@/maropay/readiness'

// One currency's balance, led by the next payout (Stripe Balances): the amount
// on its way next, when and where, then what makes up the balance. Currencies
// are never added together — a multi-currency business gets one per currency.
// The next payout is an estimate from what has settled, and says so.

const props = withDefaults(defineProps<{
  balance: BalanceSummary
  upcoming: UpcomingPayout | null
  /** "Mercury Bank •••• 4417" — where payouts go. */
  destination?: string | null
  title?: string
  description?: string
  /** Opens the upcoming payout. */
  upcomingTo?: RouteLocationRaw | null
  headingLevel?: 2 | 3
}>(), {
  destination: null,
  title: 'Balance',
  description: undefined,
  upcomingTo: null,
  headingLevel: 2,
})

const next = computed(() => (props.upcoming?.amount.currency === props.balance.currency ? props.upcoming : null))

const caption = computed(() => {
  const n = next.value
  if (!n) return 'Nothing waiting to be paid out'
  if (n.blocked) return 'Paused until payouts are fixed'
  return [`Estimated ${formatDay(n.estimatedAt)}`, props.destination ? `to ${props.destination}` : null].filter(Boolean).join(' · ')
})

const rows = computed(() => {
  const { available, pending, inTransit } = props.balance
  return [
    { label: 'Available', hint: available.amount < 0 ? 'Recovered from upcoming payments' : 'Included in your next payout', amount: available },
    { label: 'Pending', hint: 'Becomes available as payments settle', amount: pending },
    { label: 'In transit', hint: 'Sent, on its way to your bank', amount: inTransit },
  ]
})
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset maropay-balance">
    <MpSectionHeader :title="title" :description="description" :heading-level="headingLevel">
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </MpSectionHeader>
    <div class="maropay-balance__body">
      <div class="maropay-balance__lead">
        <span class="maropay-balance__label">Next payout</span>
        <span class="maropay-balance__amount">
          <span v-if="next" class="maropay-balance__approx" aria-hidden="true">≈</span>
          <span v-if="next" class="d-sr-only">About</span>
          <MaropayMoney :amount="next?.amount ?? { amount: 0, currency: balance.currency }" emphasis="prominent" />
        </span>
        <span class="maropay-balance__caption" :class="{ 'maropay-balance__caption--warn': next?.blocked }">{{ caption }}</span>
        <router-link v-if="next && upcomingTo" :to="upcomingTo" class="mp-link maropay-balance__link">See what’s in it</router-link>
      </div>
      <div class="maropay-balance__list">
        <MpListRow v-for="row in rows" :key="row.label" variant="divided" :title="row.label" :subtitle="row.hint">
          <template #trailing><MaropayMoney :amount="row.amount" class="maropay-balance__value" /></template>
        </MpListRow>
      </div>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
/* The card is the container, so the body can lay out by the card's width. */
.maropay-balance {
  container-type: inline-size;
}

.maropay-balance__body {
  display: grid;
  gap: var(--mp-space-20);
}

.maropay-balance__lead {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mp-space-4);
}

.maropay-balance__label {
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-text-label-fontWeight);
  color: var(--on-surface-muted);
}

.maropay-balance__amount {
  display: inline-flex;
  align-items: baseline;
  gap: var(--mp-space-6);
}

.maropay-balance__approx {
  font-size: var(--mp-fontSize-20);
  color: var(--on-surface-muted);
}

.maropay-balance__caption {
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
}

.maropay-balance__caption--warn {
  color: var(--warn-ink);
}

.maropay-balance__link {
  margin-top: var(--mp-space-4);
  font-size: var(--mp-fontSize-13);
}

.maropay-balance__value {
  font-size: var(--mp-text-body-fontSize);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--text-primary);
}

/* Wide (Payouts): the next payout beside the breakdown. Narrow (Overview's side column): stacked. */
@container (min-width: 560px) {
  .maropay-balance__body {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    align-items: start;
    gap: var(--mp-space-32);
  }
}
</style>
