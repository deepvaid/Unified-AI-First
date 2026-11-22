<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import MpStatusChip from '@/components/MpStatusChip.vue'
import {
  PAYMENT_CAPABILITY_LABELS,
  PAYOUT_CAPABILITY_LABELS,
  SETUP_LABELS,
  VERIFICATION_LABELS,
} from '@/maropay/model'
import type { OverviewInstruction, OverviewKey, ReadinessDimensions } from '@/maropay/readiness'

// The one answer to "Can I trade, and what do I do next?": the headline from
// deriveOverviewInstruction plus the state dimensions it was derived from. The
// dimensions stay visible so "submitted", "verified", "ready" and "live" never
// collapse into a single "Connected". Once the business is trading,
// `density="compact"` folds it into one quiet row: what's live, nothing more.

const props = withDefaults(defineProps<{
  instruction: OverviewInstruction
  dimensions: ReadinessDimensions
  /** Resolved route for the instruction's action; omit to hide the button. */
  actionTo?: RouteLocationRaw | null
  /** Heading level for the headline — match the surrounding page outline. */
  headingLevel?: 2 | 3
  /** 'compact' is one row — for a business that's trading, where the status is good news, not a task. */
  density?: 'default' | 'compact'
}>(), {
  actionTo: null,
  headingLevel: 2,
  density: 'default',
})

const TONE: Record<OverviewKey, { color: string; icon: string }> = {
  not_started: { color: 'primary', icon: 'wallet' },
  finish_setup: { color: 'primary', icon: 'list-checks' },
  provide_info: { color: 'warning', icon: 'triangle-alert' },
  under_review: { color: 'primary', icon: 'clock' },
  set_up_store: { color: 'primary', icon: 'list-checks' },
  ready_to_activate: { color: 'primary', icon: 'rocket' },
  payouts_attention: { color: 'warning', icon: 'triangle-alert' },
  activate_more: { color: 'success', icon: 'rocket' },
  active: { color: 'success', icon: 'circle-check' },
  declined: { color: 'error', icon: 'ban' },
  unavailable: { color: 'error', icon: 'ban' },
  closed: { color: 'secondary', icon: 'archive' },
}

const tone = computed(() => TONE[props.instruction.key])
/** Routine next steps get a quiet button; anything that unblocks trading gets the primary one. */
const quietAction = computed(() => props.instruction.key === 'active' || props.instruction.key === 'activate_more')

const storesLabel = computed(() => {
  const { liveStores, linkedStores } = props.dimensions
  return linkedStores === 0 ? 'None linked' : `${liveStores} of ${linkedStores} live`
})

const dims = computed(() => [
  { label: 'Setup', status: SETUP_LABELS[props.dimensions.setup] },
  { label: 'Verification', status: VERIFICATION_LABELS[props.dimensions.verification] },
  { label: 'Payments', status: PAYMENT_CAPABILITY_LABELS[props.dimensions.payments] },
  { label: 'Payouts', status: PAYOUT_CAPABILITY_LABELS[props.dimensions.payouts] },
])

/** The compact row keeps the dimensions a trading business watches. */
const compactDims = computed(() => [
  { label: 'Payments', status: PAYMENT_CAPABILITY_LABELS[props.dimensions.payments] },
  { label: 'Payouts', status: PAYOUT_CAPABILITY_LABELS[props.dimensions.payouts] },
])

const awaitingApproval = computed(() =>
  props.dimensions.setup === 'submitted'
  && (props.dimensions.verification === 'under_review' || props.dimensions.verification === 'action_required'),
)
</script>

<template>
  <v-card v-if="density === 'compact'" flat border rounded="lg" class="mp-card-inset maropay-readiness maropay-readiness--compact">
    <div class="maropay-readiness__head">
      <v-avatar :color="tone.color" variant="tonal" rounded="lg" size="32" class="flex-shrink-0">
        <v-icon size="16">{{ tone.icon }}</v-icon>
      </v-avatar>
      <div class="maropay-readiness__copy">
        <component :is="headingLevel === 3 ? 'h3' : 'h2'" class="mp-section-title maropay-readiness__headline">{{ instruction.headline }}</component>
        <p class="maropay-readiness__detail">{{ instruction.detail }}</p>
      </div>
      <dl class="maropay-readiness__chips">
        <div v-for="dim in compactDims" :key="dim.label" class="maropay-readiness__chip">
          <dt>{{ dim.label }}</dt>
          <dd><MpStatusChip :status="dim.status" type="readiness" size="sm" show-icon /></dd>
        </div>
        <div class="maropay-readiness__chip">
          <dt>Stores</dt>
          <dd><span class="maropay-readiness__count">{{ storesLabel }}</span></dd>
        </div>
      </dl>
      <v-btn
        v-if="instruction.action && actionTo"
        :to="actionTo"
        variant="text"
        append-icon="arrow-right"
        class="text-none flex-shrink-0"
      >
        {{ instruction.action.label }}
      </v-btn>
    </div>
    <slot name="footer" />
  </v-card>

  <v-card v-else flat border rounded="lg" class="mp-card-inset maropay-readiness">
    <div class="maropay-readiness__head">
      <v-avatar :color="tone.color" variant="tonal" rounded="lg" size="40" class="flex-shrink-0">
        <v-icon size="20">{{ tone.icon }}</v-icon>
      </v-avatar>
      <div class="maropay-readiness__copy">
        <span class="mp-meta-label maropay-readiness__eyebrow">Account status</span>
        <component :is="headingLevel === 3 ? 'h3' : 'h2'" class="mp-section-title maropay-readiness__headline">{{ instruction.headline }}</component>
        <p class="maropay-readiness__detail">{{ instruction.detail }}</p>
      </div>
      <v-btn
        v-if="instruction.action && actionTo"
        :to="actionTo"
        :variant="quietAction ? 'outlined' : 'flat'"
        :color="quietAction ? undefined : 'primary'"
        append-icon="arrow-right"
        class="text-none flex-shrink-0 maropay-readiness__action"
      >
        {{ instruction.action.label }}
      </v-btn>
    </div>

    <dl class="mp-label-value maropay-readiness__dims">
      <div v-for="dim in dims" :key="dim.label">
        <dt>{{ dim.label }}</dt>
        <dd><MpStatusChip :status="dim.status" type="readiness" size="sm" show-icon /></dd>
      </div>
      <div>
        <dt>Stores</dt>
        <dd class="d-flex align-center ga-2">
          <MpStatusChip :status="dimensions.liveStores ? 'Live' : 'Inactive'" type="readiness" size="sm" show-icon />
          <span class="maropay-readiness__count">{{ storesLabel }}</span>
        </dd>
      </div>
    </dl>

    <p v-if="awaitingApproval" class="maropay-readiness__note">
      Submitted isn’t approval. Payments turn on only once our payments partner has verified your business.
    </p>
    <slot name="footer" />
  </v-card>
</template>

<style scoped lang="scss">
.maropay-readiness {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
}

.maropay-readiness__head {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-16);
}

.maropay-readiness--compact .maropay-readiness__head {
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-12) var(--mp-space-16);
}

.maropay-readiness__copy {
  flex: 1 1 auto;
  min-width: 0;
}

.maropay-readiness__eyebrow {
  display: block;
  margin-bottom: var(--mp-space-4);
  color: var(--on-surface-muted);
}

.maropay-readiness__headline {
  margin: 0;
  line-height: var(--mp-lineHeight-snug);
  color: var(--text-primary);
}

.maropay-readiness__detail {
  margin: var(--mp-space-2) 0 0;
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}

.maropay-readiness--compact .maropay-readiness__detail {
  font-size: var(--mp-fontSize-13);
}

.maropay-readiness__dims {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--mp-space-16);
  padding-top: var(--mp-component-card-gap);
  border-top: 1px solid var(--border-subtle);
}

.maropay-readiness__dims dt {
  margin-bottom: var(--mp-space-6);
}

.maropay-readiness__dims dd,
.maropay-readiness__chips dd {
  margin: 0;
}

.maropay-readiness__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-8) var(--mp-space-16);
  margin: 0;
}

.maropay-readiness__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
}

.maropay-readiness__chip dt {
  font-size: var(--mp-text-caption-fontSize);
  font-weight: var(--mp-text-caption-fontWeight);
  color: var(--on-surface-muted);
}

.maropay-readiness__count {
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
  font-variant-numeric: tabular-nums;
}

.maropay-readiness__note {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .maropay-readiness__dims {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: ($mp-layout-breakpointCompact - 0.02px)) {
  .maropay-readiness__head {
    flex-wrap: wrap;
  }

  .maropay-readiness__action {
    width: 100%;
  }

  .maropay-readiness__dims {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
