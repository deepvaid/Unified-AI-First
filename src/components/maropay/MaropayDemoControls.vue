<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import { useToast } from '@/composables/useToast'
import { MAROPAY_SCENARIOS, useMaropayStore } from '@/stores/useMaropay'
import type { MaropayActingRole, MaropayScenarioKey } from '@/stores/useMaropay'

// Reviewer controls for the Maropay prototype (plan §6.5): load one of the
// M01–M15 scenarios, reset, preview the access model as another role, and make
// the next request time out (lists show their error state, actions their retry).
// Lives in the user menu's demo block — never in merchant-facing screens.

const maropay = useMaropayStore()
const router = useRouter()
const toast = useToast()

const ROLE_ITEMS = [
  { value: 'owner', label: 'Owner' },
  { value: 'finance', label: 'Finance' },
  { value: 'store_ops', label: 'Store ops' },
]

function openOverview(): void {
  void router.push({ name: 'MaropayOverview', params: { accountId: maropay.state.accountId } })
}

const scenario = computed<MaropayScenarioKey | null>({
  get: () => maropay.scenarioKey,
  set: (key) => {
    if (!key) return
    maropay.applyScenario(key)
    const label = MAROPAY_SCENARIOS.find((s) => s.key === key)?.label ?? key
    toast.show(`Maropay scenario loaded: ${label}`, { type: 'info', action: { label: 'Open Maropay', onClick: openOverview } })
  },
})

function reset(): void {
  maropay.resetScenario()
  toast.info('Maropay demo state reset for this account.')
}

function setRole(value: string | null): void {
  if (!value || value === maropay.actingRole) return
  maropay.setActingRole(value as MaropayActingRole)
  const label = ROLE_ITEMS.find((r) => r.value === value)?.label ?? value
  toast.info(`Previewing Maropay as ${label}`)
}
</script>

<template>
  <div class="maropay-demo">
    <div class="maropay-demo__row">
      <!-- Detail-free so the user menu can't resize under the pointer while open. -->
      <v-select
        v-model="scenario"
        :items="MAROPAY_SCENARIOS"
        item-title="label"
        item-value="key"
        hide-details
        label="Scenario"
        class="maropay-demo__select"
      />
      <v-btn size="small" variant="text" class="text-none" :disabled="!maropay.hasExplicitState" @click="reset">
        Reset
      </v-btn>
    </div>
    <div class="maropay-demo__row">
      <span class="maropay-demo__label">Act as</span>
      <MpSegmentedControl
        :model-value="maropay.actingRole"
        :items="ROLE_ITEMS"
        size="sm"
        ariaLabel="Preview Maropay as"
        @update:model-value="setRole"
      />
    </div>
    <!-- Detail-free for the same reason as the select above. -->
    <v-checkbox
      :model-value="maropay.failures.timeoutNext"
      label="Next request times out"
      density="compact"
      hide-details
      @update:model-value="maropay.setFailure('timeoutNext', Boolean($event))"
    />
  </div>
</template>

<style scoped>
.maropay-demo {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  min-width: 0;
}

.maropay-demo__row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.maropay-demo__select {
  flex: 1;
  min-width: 0;
}

.maropay-demo__label {
  flex: 1;
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}
</style>
