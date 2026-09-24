<script setup lang="ts">
import { computed } from 'vue'
import { moneyParts } from '@/maropay/money'
import type { Money } from '@/maropay/money'

// One money renderer for Maropay: integer minor units in, `.mp-money` markup out.
// The sign sits before the symbol ("−$12.50", never "$-12.50") and zero-decimal
// currencies simply have no cents span. The text stays one run, so screen
// readers hear "minus $12.50".

const props = withDefaults(defineProps<{
  amount: Money
  /** 'prominent' renders at KPI scale for a hero figure. */
  emphasis?: 'default' | 'prominent'
  /** Prefix positive amounts with "+" (ledger lines). */
  signed?: boolean
}>(), {
  emphasis: 'default',
  signed: false,
})

const parts = computed(() => moneyParts(props.amount))
const sign = computed(() => (parts.value.negative ? '−' : props.signed && props.amount.amount > 0 ? '+' : ''))
</script>

<template>
  <span class="mp-money maropay-money" :class="{ 'mp-kpi-value': emphasis === 'prominent' }">{{ sign }}{{ parts.symbol }}{{ parts.integer }}<span v-if="parts.fraction" class="mp-money__cents">.{{ parts.fraction }}</span></span>
</template>

<style scoped>
.maropay-money {
  white-space: nowrap;
}
</style>
