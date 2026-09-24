<script setup lang="ts">
import { computed } from 'vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { METHOD_CATEGORY_LABELS, METHOD_STATUS_LABELS } from '@/maropay/model'
import type { MethodCategory, PaymentMethodCatalogEntry } from '@/maropay/model'

// Rates by payment method, grouped by category. The sample is illustrative —
// the business's applicable rates are shown again before terms are accepted.

const props = withDefaults(defineProps<{
  methods: PaymentMethodCatalogEntry[]
  /** Hide methods this account can't use. */
  hideUnavailable?: boolean
  /** Line under the table; the default suits screens shown before the terms are accepted. */
  caption?: string
}>(), {
  hideUnavailable: false,
  caption: 'Illustrative rates. The rates that apply to your business are shown before you accept the terms. No additional Maropay fee.',
})

const ORDER: MethodCategory[] = ['cards', 'wallets', 'bnpl', 'local']

const rows = computed(() =>
  ORDER.flatMap((category) =>
    props.methods
      .filter((m) => m.category === category && (!props.hideUnavailable || m.availability !== 'unavailable'))
      .map((m) => ({
        id: m.id,
        label: m.label,
        category: METHOD_CATEGORY_LABELS[category],
        rate: m.rate.label,
        status: METHOD_STATUS_LABELS[m.availability],
        note: m.availability === 'unavailable' ? m.reviewNote : m.availability === 'setup_required' ? 'Needs a short review first' : null,
      })),
  ),
)
</script>

<template>
  <div class="maropay-rates">
    <v-table density="compact" class="maropay-rates__table">
      <thead>
        <tr>
          <th scope="col">Method</th>
          <th scope="col">Type</th>
          <th scope="col" class="text-end">Rate</th>
          <th scope="col">Availability</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td class="maropay-rates__method">{{ row.label }}</td>
          <td class="text-medium-emphasis">{{ row.category }}</td>
          <td class="text-end maropay-rates__rate">{{ row.rate }}</td>
          <td>
            <div class="d-flex align-center ga-2 flex-wrap">
              <MpStatusChip :status="row.status" type="method" size="sm" />
              <span v-if="row.note" class="maropay-rates__note">{{ row.note }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>
    <p class="maropay-rates__caption">{{ caption }}</p>
  </div>
</template>

<style scoped>
.maropay-rates__table {
  background: transparent;
}

.maropay-rates__method {
  font-weight: var(--mp-fontWeight-medium);
  white-space: nowrap;
}

.maropay-rates__rate {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.maropay-rates__note {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
}

.maropay-rates__caption {
  margin: var(--mp-space-12) 0 0;
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-normal);
  color: var(--muted);
}
</style>
