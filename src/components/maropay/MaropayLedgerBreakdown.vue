<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MaropayMoney from '@/components/maropay/MaropayMoney.vue'
import type { Money } from '@/maropay/money'

// Where the money went, line by line: signed amounts that add up to the total
// underneath — gross minus fees, refunds and disputes for a payment; the same
// shape explains a payout. A line can link to the records behind it.

withDefaults(defineProps<{
  lines: Array<{ label: string; amount: Money; hint?: string; to?: RouteLocationRaw }>
  total: { label: string; amount: Money }
  title?: string
  headingLevel?: number
  /** A note under the total — what the figures leave out. */
  caption?: string
}>(), {
  title: 'Breakdown',
  headingLevel: 2,
})
</script>

<template>
  <v-card flat border rounded="lg" class="maropay-ledger">
    <MpSectionHeader :title="title" :heading-level="headingLevel" />
    <dl class="maropay-ledger__list">
      <div v-for="line in lines" :key="line.label" class="maropay-ledger__row">
        <dt>
          <router-link v-if="line.to" :to="line.to" class="maropay-ledger__link">{{ line.label }}</router-link>
          <template v-else>{{ line.label }}</template>
          <span v-if="line.hint" class="maropay-ledger__hint">{{ line.hint }}</span>
        </dt>
        <dd><MaropayMoney :amount="line.amount" signed /></dd>
      </div>
      <div class="maropay-ledger__row maropay-ledger__row--total">
        <dt>{{ total.label }}</dt>
        <dd><MaropayMoney :amount="total.amount" /></dd>
      </div>
    </dl>
    <p v-if="caption" class="maropay-ledger__caption">{{ caption }}</p>
  </v-card>
</template>

<style scoped>
.maropay-ledger {
  padding: var(--mp-component-card-padding);
}

.maropay-ledger__list {
  margin: 0;
}

.maropay-ledger__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--mp-space-16);
  padding-block: var(--mp-space-6);
  font-size: var(--mp-fontSize-14);
  color: var(--text-primary);
}

.maropay-ledger__row dt {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.maropay-ledger__row dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.maropay-ledger__row--total {
  margin-top: var(--mp-space-6);
  padding-top: var(--mp-space-12);
  border-top: 1px solid var(--border-subtle);
  font-weight: var(--mp-fontWeight-semibold);
}

.maropay-ledger__hint {
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.maropay-ledger__link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.maropay-ledger__link:hover {
  text-decoration: underline;
}

.maropay-ledger__caption {
  margin: var(--mp-space-12) 0 0;
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}
</style>
