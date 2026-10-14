<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import MpListRow from '@/components/MpListRow.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MaropayStoreMark from './MaropayStoreMark.vue'
import { STORE_ACTIVATION_LABELS } from '@/maropay/model'
import type { StoreActivationState } from '@/maropay/model'
import { formatDay } from '@/maropay/readiness'
import type { SetupTimeline, TimelineStep } from '@/maropay/setupTimeline'

// The setup status as a vertical timeline: application submitted → business
// verified → payments switched on → payouts ready → stores moved to Maropay,
// each step done, current, waiting or blocked, with when it happened. Under the
// stores step, one row per linked store — live since when, or how far its
// checklist has got and the way to finish it. Presentational: `setupTimeline`
// (src/maropay/setupTimeline.ts) decides every word.

defineProps<{
  timeline: SetupTimeline
  /** Where a store's Maropay page opens. */
  storeTo: (channelId: string) => RouteLocationRaw
}>()

const ICONS: Record<TimelineStep['state'], string | null> = { done: 'check', current: null, waiting: null, blocked: 'x' }
const TIME = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

function when(step: TimelineStep): string | null {
  return step.meta ?? (step.at ? TIME.format(new Date(step.at)).replace(',', ' ·') : null)
}

/** Only a store the account can activate gets a call to action; the rest show their state. */
function actionable(state: StoreActivationState): boolean {
  return state === 'needs_setup' || state === 'ready_to_activate'
}
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset setup-timeline">
    <ol class="setup-timeline__steps" role="list">
      <li v-for="(step, index) in timeline.steps" :key="step.key" class="setup-timeline__step" :class="`setup-timeline__step--${step.state}`">
        <span class="setup-timeline__rail" aria-hidden="true">
          <span class="setup-timeline__disc">
            <v-icon v-if="ICONS[step.state]" size="18">{{ ICONS[step.state] }}</v-icon>
            <span v-else-if="step.state === 'current'" class="setup-timeline__dot" />
          </span>
          <span v-if="index < timeline.steps.length - 1" class="setup-timeline__line" />
        </span>
        <div class="setup-timeline__body">
          <div class="setup-timeline__head">
            <span class="setup-timeline__title">
              {{ step.title }}
              <span class="d-sr-only">— {{ step.state === 'done' ? 'done' : step.state === 'current' ? 'in progress' : step.state === 'blocked' ? 'needs attention' : 'not yet' }}</span>
            </span>
            <span v-if="when(step)" class="setup-timeline__when">{{ when(step) }}</span>
          </div>
          <p class="setup-timeline__caption">{{ step.caption }}</p>

          <div v-if="step.key === 'stores' && timeline.stores.length" class="setup-timeline__stores" role="list">
            <MpListRow
              v-for="store in timeline.stores"
              :key="store.channelId"
              variant="boxed"
              role="listitem"
              class="setup-timeline__store"
              :class="{ 'setup-timeline__store--next': store.state !== 'live' }"
              :title="store.name"
            >
              <template #lead><MaropayStoreMark :name="store.name" /></template>
              <template #subtitle>
                <template v-if="store.state === 'live'">
                  {{ store.since ? `Live since ${formatDay(store.since)}` : 'Live' }} · {{ store.paymentsThisMonth }} {{ store.paymentsThisMonth === 1 ? 'payment' : 'payments' }} this month
                </template>
                <span v-else class="setup-timeline__progress">
                  <v-progress-linear :model-value="(store.done / store.total) * 100" color="primary" bg-color="surface-variant" height="6" rounded aria-hidden="true" class="setup-timeline__bar" />
                  <span>{{ store.done }} of {{ store.total }} steps{{ store.gateway ? ` · still on ${store.gateway}` : '' }}</span>
                  <!-- On a phone the action sits under the progress instead of beside the text (the wide one hides). -->
                  <v-btn v-if="actionable(store.state)" color="primary" variant="flat" size="small" class="text-none d-sm-none setup-timeline__phone-action" append-icon="arrow-right" :to="storeTo(store.channelId)">
                    {{ store.state === 'ready_to_activate' ? 'Activate' : 'Set up' }}
                  </v-btn>
                </span>
              </template>
              <template #trailing>
                <!-- A store the account can't activate (declined, paused, closed) gets its state, not a call to action. -->
                <v-btn v-if="actionable(store.state)" color="primary" variant="flat" class="text-none d-none d-sm-inline-flex" append-icon="arrow-right" :to="storeTo(store.channelId)">
                  {{ store.state === 'ready_to_activate' ? 'Activate' : 'Set up' }} {{ store.name }}
                </v-btn>
                <MpStatusChip v-else :status="STORE_ACTIVATION_LABELS[store.state]" type="readiness" size="sm" show-icon />
              </template>
            </MpListRow>
          </div>
        </div>
      </li>
    </ol>
  </v-card>
</template>

<style scoped lang="scss">
.setup-timeline__steps {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.setup-timeline__step {
  display: grid;
  grid-template-columns: var(--mp-space-40) minmax(0, 1fr);
  gap: var(--mp-space-16);
}

.setup-timeline__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* The disc: success for done, a ring with a dot for the current step, neutral for what's to come,
   the error pair for a step that needs attention. */
.setup-timeline__disc {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-40);
  height: var(--mp-space-40);
  border-radius: var(--mp-radius-full);
  background: var(--surface-secondary);
  color: var(--on-surface-muted);
}

.setup-timeline__step--done .setup-timeline__disc {
  background: var(--pos);
  color: var(--on-pos);
}

.setup-timeline__step--current .setup-timeline__disc {
  background: var(--surface-primary);
  box-shadow: inset 0 0 0 2px var(--border-strong);
}

.setup-timeline__dot {
  width: var(--mp-space-12);
  height: var(--mp-space-12);
  border-radius: var(--mp-radius-full);
  background: var(--text-primary);
}

.setup-timeline__step--blocked .setup-timeline__disc {
  background: var(--neg-soft);
  color: var(--neg-ink);
}

.setup-timeline__line {
  flex: 1 1 auto;
  width: 2px;
  min-height: var(--mp-space-24);
  background: var(--border-default);
}

.setup-timeline__step--done .setup-timeline__line {
  background: var(--pos);
}

.setup-timeline__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  padding-bottom: var(--mp-space-28);
  min-width: 0;
}

.setup-timeline__step:last-child .setup-timeline__body {
  padding-bottom: 0;
}

.setup-timeline__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--mp-space-4) var(--mp-space-16);
  min-height: var(--mp-space-24);
}

.setup-timeline__title {
  font-size: var(--mp-fontSize-16);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.setup-timeline__step--waiting .setup-timeline__title {
  color: var(--text-secondary);
}

.setup-timeline__when {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.setup-timeline__caption {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}

.setup-timeline__stores {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  margin-top: var(--mp-space-16);
}

.setup-timeline__store {
  padding-block: var(--mp-space-12);
}

/* The store up next gets the strong edge; the live ones stay quiet. */
.setup-timeline__store--next {
  border-color: var(--border-strong);
}

.setup-timeline__progress {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-8);
}

.setup-timeline__bar {
  width: var(--mp-space-80);
  flex: none;
}

.setup-timeline__phone-action {
  flex-basis: 100%;
  align-self: flex-start;
  margin-top: var(--mp-space-4);
}

@media (max-width: #{$mp-layout-breakpointCompact}) {
  .setup-timeline__step {
    grid-template-columns: var(--mp-space-32) minmax(0, 1fr);
    gap: var(--mp-space-12);
  }

  .setup-timeline__disc {
    width: var(--mp-space-32);
    height: var(--mp-space-32);
  }

  /* The row's class lands on MpListRow's root: let the action wrap under the text instead of pushing the card wider. */
  .setup-timeline__store {
    flex-wrap: wrap;
    row-gap: var(--mp-space-8);
  }
}
</style>
