<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import MaropayStoreMark from './MaropayStoreMark.vue'

// The store still to move: once one store is live, the next one's progress in a
// row — which gateway it still checks out with, how many steps are left, and the
// way to finish. Nothing changes for shoppers until the owner switches it on.

const props = defineProps<{
  storeName: string
  /** The gateway still taking the store's cards, when there is one. */
  gateway: string | null
  done: number
  total: number
  to: RouteLocationRaw
}>()

const remaining = computed(() => props.total - props.done)
const title = computed(() => (props.gateway ? `${props.storeName} still checks out with ${props.gateway}` : `${props.storeName} isn’t on Maropay yet`))
const detail = computed(() => `${remaining.value === 1 ? 'One step' : `${remaining.value} steps`} left before it moves to Maropay. Nothing changes for shoppers until you switch it on.`)
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset store-nag">
    <MaropayStoreMark :name="storeName" />
    <div class="store-nag__body">
      <p class="store-nag__title">{{ title }}</p>
      <p class="store-nag__detail">{{ detail }}</p>
    </div>
    <div class="store-nag__progress" :aria-label="`${done} of ${total} steps done`" role="group">
      <v-progress-linear :model-value="(done / total) * 100" color="primary" bg-color="surface-variant" height="6" rounded aria-hidden="true" />
      <span class="store-nag__count" aria-hidden="true">{{ done }}/{{ total }}</span>
    </div>
    <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" :to="to">Finish setup</v-btn>
  </v-card>
</template>

<style scoped lang="scss">
.store-nag {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--mp-space-16);
}

.store-nag__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
  min-width: 0;
}

.store-nag__title {
  margin: 0;
  font-size: var(--mp-fontSize-15);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.store-nag__detail {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}

.store-nag__progress {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
  width: var(--mp-space-80);
  flex: none;
}

.store-nag__count {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

@media (max-width: #{$mp-layout-breakpointCompact}) {
  .store-nag {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .store-nag__progress,
  .store-nag .v-btn {
    grid-column: 2;
    justify-self: start;
  }

  .store-nag__progress {
    width: 100%;
  }
}
</style>
