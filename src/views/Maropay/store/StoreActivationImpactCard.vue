<script setup lang="ts">
import { computed } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MaropayMethodMark from '@/components/maropay/MaropayMethodMark.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { markFor } from '@/maropay/methodMarks'
import { formatDay, joinList, payoutScheduleLabel } from '@/maropay/readiness'
import type { MigrationRow } from '@/maropay/readiness'

// What changes when a store switches to Maropay (plan §3E): the provider, what
// shoppers can pay with, fees, payouts and capture — and, when the store comes
// from another provider, method by method what moves and what stays. The business
// owner confirms they've reviewed it before the store can activate.

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  channelId: string
  /** The store's current provider, when it has one. */
  previousName: string | null
  canActivate: boolean
}>()

const maropay = useMaropayStore()
const toast = useToast()

const binding = computed(() => maropay.bindingFor(props.channelId))
const checkoutMethods = computed(() => maropay.checkoutMethodsFor(props.channelId))
const pendingMethods = computed(() => maropay.methodsForStore(props.channelId).filter((m) => m.status === 'pending_approval'))
const impact = computed(() => maropay.migrationImpactFor(props.channelId))
const payoutDestination = computed(() => maropay.account?.payoutDestination ?? null)
const payoutSchedule = computed(() => (maropay.account ? payoutScheduleLabel(maropay.account.payoutSchedule) : null))

const feeSummary = computed(() => {
  const byRate = new Map<string, string[]>()
  for (const m of checkoutMethods.value) byRate.set(m.rate.label, [...(byRate.get(m.rate.label) ?? []), m.label])
  return [...byRate].map(([rate, labels]) => `${rate} for ${joinList(labels)}`).join(' · ')
})

const CHANGE: Record<MigrationRow['change'], { label: string; icon: string }> = {
  lower: { label: 'Lower fee', icon: 'arrow-down' },
  higher: { label: 'Higher fee', icon: 'arrow-up' },
  same: { label: 'Same fee', icon: 'equal' },
  stays: { label: 'Not moving', icon: 'minus' },
}

/** A comparison row as one line, for the narrow list. */
function compareLine(row: MigrationRow): string {
  const now = `${props.previousName} ${row.currentRate}`
  return row.maropayLabel ? `${now} → Maropay ${row.maropayRate}` : `${now} · stays with ${props.previousName}`
}

function markReviewed(): void {
  const result = maropay.markImpactReviewed(props.channelId)
  if (!result.ok) toast.error(result.error.message)
}
</script>

<template>
  <v-card v-if="binding" v-bind="$attrs" flat border rounded="lg" class="mp-card-inset">
    <MpSectionHeader icon="arrow-left-right" title="What changes when you activate" description="The business owner confirms this before the store switches." :heading-level="2" />
    <dl class="mp-label-value">
      <div>
        <dt>Checkout provider</dt>
        <dd>{{ previousName ? `${previousName} → Maropay` : 'Maropay' }}</dd>
      </div>
      <div>
        <dt>Shoppers can pay with</dt>
        <dd>{{ checkoutMethods.length ? joinList(checkoutMethods.map((m) => m.label)) : 'Nothing yet — turn on a method' }}</dd>
      </div>
      <div>
        <dt>Fees</dt>
        <dd>{{ feeSummary || '—' }}</dd>
      </div>
      <div>
        <dt>Payouts</dt>
        <dd>{{ payoutDestination ? `${payoutDestination.bankName} •••• ${payoutDestination.last4} · ${payoutSchedule}` : 'No payout account yet' }}</dd>
      </div>
      <div>
        <dt>Capture</dt>
        <dd>{{ binding.captureMode === 'automatic' ? 'Automatic' : 'Manual — from each order' }}</dd>
      </div>
      <div v-if="pendingMethods.length">
        <dt>Awaiting approval</dt>
        <dd>{{ joinList(pendingMethods.map((m) => m.label)) }}</dd>
      </div>
    </dl>

    <template v-if="impact && previousName">
      <h3 class="store-impact__subhead">Switching from {{ previousName }}</h3>
      <!-- A table where there's room to compare across; a list on a narrow card. -->
      <div class="store-impact__compare">
        <v-table density="compact" class="store-impact__table">
          <thead>
            <tr>
              <th scope="col">Method</th>
              <th scope="col" class="text-end">With {{ previousName }}</th>
              <th scope="col">With Maropay</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in impact.rows" :key="row.label">
              <td>
                <span class="store-impact__method">
                  <MaropayMethodMark :mark="markFor(row.methodId ?? '', row.label)" size="sm" decorative />
                  {{ row.label }}
                </span>
              </td>
              <td class="text-end store-impact__rate">{{ row.currentRate }}</td>
              <td>{{ row.maropayLabel ? `${row.maropayLabel} · ${row.maropayRate}` : `Stays with ${previousName}` }}</td>
              <td>
                <span class="store-impact__change" :class="`store-impact__change--${row.change}`">
                  <v-icon size="16">{{ CHANGE[row.change].icon }}</v-icon>{{ CHANGE[row.change].label }}
                </span>
              </td>
            </tr>
          </tbody>
        </v-table>
        <div class="store-impact__rows" role="list">
          <MpListRow v-for="row in impact.rows" :key="row.label" variant="divided" role="listitem" :title="row.label" :subtitle="compareLine(row)">
            <template #lead>
              <MaropayMethodMark :mark="markFor(row.methodId ?? '', row.label)" size="sm" decorative />
            </template>
            <template #trailing>
              <span class="store-impact__change" :class="`store-impact__change--${row.change}`">
                <v-icon size="16">{{ CHANGE[row.change].icon }}</v-icon>{{ CHANGE[row.change].label }}
              </span>
            </template>
          </MpListRow>
        </div>
      </div>
      <p class="store-impact__note">Fees compared on a $100.00 card payment. Illustrative Maropay rates.</p>

      <div class="store-impact__lists">
        <div>
          <h4 class="store-impact__subhead store-impact__subhead--list">Moves to Maropay</h4>
          <ul><li v-for="line in impact.transfers" :key="line">{{ line }}</li></ul>
        </div>
        <div>
          <h4 class="store-impact__subhead store-impact__subhead--list">Stays with {{ previousName }}</h4>
          <ul><li v-for="line in impact.staysWithPrevious" :key="line">{{ line }}</li></ul>
        </div>
        <div v-if="impact.needsSetup.length">
          <h4 class="store-impact__subhead store-impact__subhead--list">Worth knowing</h4>
          <ul><li v-for="line in impact.needsSetup" :key="line">{{ line }}</li></ul>
        </div>
      </div>
      <MpAlert v-if="impact.blocking.length" tone="error" live="off" title="This store can’t switch yet" class="mt-4">
        <ul class="store-impact__plain-list"><li v-for="line in impact.blocking" :key="line">{{ line }}</li></ul>
      </MpAlert>
    </template>

    <div class="store-impact__review">
      <template v-if="binding.impactReviewedAt">
        <v-icon size="16" class="store-impact__reviewed-icon">circle-check</v-icon>
        <span>Reviewed on {{ formatDay(binding.impactReviewedAt) }}</span>
      </template>
      <template v-else>
        <v-btn variant="outlined" class="text-none" prepend-icon="list-checks" :disabled="!canActivate" @click="markReviewed">
          I’ve reviewed these changes
        </v-btn>
        <span v-if="!canActivate" class="store-impact__note mt-0">Only the business owner confirms this.</span>
      </template>
    </div>
  </v-card>
</template>

<style scoped lang="scss">
.store-impact__subhead {
  margin: var(--mp-space-24) 0 var(--mp-space-8);
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-snug);
  color: var(--on-surface);
}

.store-impact__subhead--list {
  margin: 0;
}

.store-impact__table {
  background: transparent;
}

.store-impact__compare {
  container-type: inline-size;
}

.store-impact__rows {
  display: none;
}

@container (max-width: #{$mp-layout-breakpointCompact}) {
  .store-impact__table {
    display: none;
  }

  .store-impact__rows {
    display: block;
  }
}

.store-impact__method {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
  font-weight: var(--mp-fontWeight-medium);
  white-space: nowrap;
}

.store-impact__rate {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.store-impact__change {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  font-size: var(--mp-fontSize-13);
  white-space: nowrap;
  color: var(--on-surface-muted);
}

.store-impact__change--lower {
  color: var(--pos-ink);
}

.store-impact__change--higher {
  color: var(--warn-ink);
}

.store-impact__note {
  margin: var(--mp-space-12) 0 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}

/* One column per list, side by side; stacked below the split breakpoint. */
.store-impact__lists {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: var(--mp-space-16) var(--mp-space-32);
  margin-top: var(--mp-space-20);
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .store-impact__lists {
    grid-auto-flow: row;
  }
}

.store-impact__lists ul,
.store-impact__plain-list {
  margin: var(--mp-space-8) 0 0;
  padding-inline-start: var(--mp-space-20);
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface);
}

.store-impact__lists li + li {
  margin-top: var(--mp-space-4);
}

.store-impact__review {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-12);
  margin-top: var(--mp-space-24);
  font-size: var(--mp-fontSize-14);
  color: var(--on-surface);
}

.store-impact__reviewed-icon {
  color: var(--pos-ink);
}
</style>
