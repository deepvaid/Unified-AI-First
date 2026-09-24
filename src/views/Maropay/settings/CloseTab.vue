<script setup lang="ts">
import { computed, ref } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MaropayStepUpDialog from '@/components/maropay/MaropayStepUpDialog.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { PROVIDER_LABELS } from '@/maropay/model'
import type { StoreBinding } from '@/maropay/model'
import type { ClosureCheck } from '@/maropay/readiness'
import { formatDay } from '@/maropay/readiness'

// Settings → Stop or close. Stopping changes where new checkouts go and
// nothing else (M14). Closing ends the account once nothing is left in
// flight — confirmed, then checked with a fresh code. History stays readable.

const maropay = useMaropayStore()
const toast = useToast()

const closedAt = computed(() => maropay.account?.closedAt ?? null)

// ── Stop on every store ────────────────────────────────────────────

const live = computed(() => maropay.bindings.filter((b) => b.activation === 'live'))

/** What happens to a store's new checkouts once Maropay stops — a clause, lower case. */
function fallback(binding: StoreBinding): string {
  return binding.previousProvider
    ? `new checkouts go back to ${PROVIDER_LABELS[binding.previousProvider.provider]}`
    : 'new checkouts can’t take online payments until you set up a provider'
}

const stopBlocker = computed(() => {
  if (!maropay.can('deactivate_store')) return 'Only the business owner can stop Maropay on stores.'
  return live.value.length ? null : 'No store uses Maropay right now.'
})

const stopConsequences = computed(() => [
  ...live.value.map((b) => `${maropay.channelName(b.channelId)}: ${fallback(b)}.`),
  'Payments already taken, refunds, disputes and payouts stay in Maropay.',
  'You can activate each store again from its Payments page.',
])

const stopOpen = ref(false)

function stopAll(): void {
  const result = maropay.deactivateAllStores()
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  const n = result.value.length
  toast.success(`Maropay stopped on ${n} ${n === 1 ? 'store' : 'stores'}. New checkouts use each store’s previous setup.`)
}

// ── Close the account ──────────────────────────────────────────────

const FIX: Partial<Record<ClosureCheck['key'], { label: string; name: string }>> = {
  disputes: { label: 'Open disputes', name: 'MaropayDisputes' },
  payouts: { label: 'Open payouts', name: 'MaropayPayouts' },
  balance: { label: 'Open payouts', name: 'MaropayPayouts' },
}

const closeBlocker = computed(() => {
  if (!maropay.can('close_account')) return 'Only the business owner can close the Maropay account.'
  return maropay.closureChecks.every((c) => c.ok) ? null : 'Settle everything in the list first.'
})

const confirmOpen = ref(false)
const stepUpOpen = ref(false)

function onVerified(): void {
  const result = maropay.closeAccount()
  if (result.ok) toast.success('Your Maropay account is closed. Its history stays available here.')
  else toast.error(result.error.message)
}
</script>

<template>
  <v-card v-if="!maropay.can('view_balances')" flat border rounded="lg">
    <MpEmptyState
      icon="lock"
      title="Stopping or closing Maropay is for the business owner"
      description="Store operations users can see payments for their stores, but can’t change how the business takes payments."
      :heading-level="2"
    />
  </v-card>

  <MpAlert v-else-if="closedAt" tone="info" live="off" icon="archive" title="This Maropay account is closed">
    Closed on {{ formatDay(closedAt) }}. Payments, refunds, payouts and history stay here to look back on.
    To use Maropay again, contact Maropost support.
  </MpAlert>

  <div v-else class="d-flex flex-column gap-5">
    <v-card flat border rounded="lg" class="maropay-close__card">
      <MpSectionHeader title="Stop taking payments with Maropay" description="Stops new checkouts only. Each store goes back to its previous setup, and you can activate it again later." :heading-level="2">
        <template #actions>
          <v-tooltip :disabled="!stopBlocker" :text="stopBlocker ?? ''" location="top">
            <template #activator="{ props: tip }">
              <span v-bind="tip">
                <v-btn variant="outlined" color="error" size="small" class="text-none" prepend-icon="circle-stop" :disabled="!!stopBlocker" @click="stopOpen = true">Stop on all stores</v-btn>
              </span>
            </template>
          </v-tooltip>
        </template>
      </MpSectionHeader>
      <MpListRow
        v-for="binding in live"
        :key="binding.id"
        variant="divided"
        :to="maropay.routeFor({ name: 'StorePayments', params: { channelId: binding.channelId } })"
      >
        <template #lead><v-icon size="18" class="maropay-close__muted">globe</v-icon></template>
        <span class="maropay-close__title">{{ maropay.channelName(binding.channelId) }}</span>
        <span class="maropay-close__sub">If you stop, {{ fallback(binding) }}.</span>
        <template #trailing><v-icon size="16" class="maropay-close__muted">chevron-right</v-icon></template>
      </MpListRow>
      <p v-if="!live.length" class="maropay-close__note mt-0">No store uses Maropay right now.</p>
      <p v-else class="maropay-close__note">To stop just one store, open it here and use its Payments page.</p>
    </v-card>

    <v-card flat border rounded="lg" class="maropay-close__card">
      <MpSectionHeader title="Close your Maropay account" description="Ends Maropay for this business. The history stays, but the account can’t take payments or receive payouts again." :heading-level="2">
        <template #actions>
          <v-tooltip :disabled="!closeBlocker" :text="closeBlocker ?? ''" location="top">
            <template #activator="{ props: tip }">
              <span v-bind="tip">
                <v-btn variant="flat" color="error" size="small" class="text-none" :disabled="!!closeBlocker" @click="confirmOpen = true">Close account</v-btn>
              </span>
            </template>
          </v-tooltip>
        </template>
      </MpSectionHeader>
      <MpListRow v-for="check in maropay.closureChecks" :key="check.key" density="compact">
        <template #lead>
          <v-icon size="18" :class="check.ok ? 'maropay-close__ok' : 'maropay-close__todo'" aria-hidden="true">{{ check.ok ? 'circle-check' : 'circle-dashed' }}</v-icon>
        </template>
        <span class="maropay-close__title"><span class="d-sr-only">{{ check.ok ? 'Done: ' : 'To do: ' }}</span>{{ check.label }}</span>
        <span class="maropay-close__sub">{{ check.detail }}</span>
        <template v-if="!check.ok && FIX[check.key]" #trailing>
          <v-btn size="small" variant="text" class="text-none" :to="maropay.routeFor({ name: FIX[check.key]!.name })">{{ FIX[check.key]!.label }}</v-btn>
        </template>
      </MpListRow>
    </v-card>
  </div>

  <MpConfirmDialog
    v-model="stopOpen"
    danger
    title="Stop Maropay on all stores?"
    message="New checkouts stop using Maropay straight away."
    :consequences="stopConsequences"
    confirm-label="Stop on all stores"
    @confirm="stopAll"
  />

  <MpConfirmDialog
    v-model="confirmOpen"
    danger
    title="Close your Maropay account?"
    message="You can’t take payments or receive payouts with this account again. Next, confirm it’s you with a code."
    :consequences="['Nothing changes at checkout — no store uses Maropay.', 'Payments, refunds, payouts and history stay available here.', 'To use Maropay again, contact Maropost support.']"
    confirm-label="Continue"
    @confirm="stepUpOpen = true"
  />

  <MaropayStepUpDialog v-model="stepUpOpen" purpose="Closing your Maropay account" @verified="onVerified" />
</template>

<style scoped>
.maropay-close__card {
  padding: var(--mp-component-card-padding);
}

.maropay-close__muted {
  color: var(--text-secondary);
}

.maropay-close__title {
  display: block;
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.maropay-close__sub {
  display: block;
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.maropay-close__ok {
  color: var(--pos-ink);
}

.maropay-close__todo {
  color: var(--text-muted);
}

.maropay-close__note {
  margin: var(--mp-space-16) 0 0;
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}
</style>
