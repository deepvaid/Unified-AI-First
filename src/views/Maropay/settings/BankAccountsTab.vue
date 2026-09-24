<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MaropayBankAccountDrawer from '@/components/maropay/MaropayBankAccountDrawer.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { formatDay, payoutScheduleLabel } from '@/maropay/readiness'

// Settings → Payout account: where Maropay sends the money. Finance can see
// it; only the owner can change it, and only after a fresh verification code
// (the drawer runs the step-up). Store operations can't see it at all (M12).

const router = useRouter()
const maropay = useMaropayStore()
const toast = useToast()

const account = computed(() => maropay.account)
const destination = computed(() => account.value?.payoutDestination ?? null)
const submitted = computed(() => account.value?.setup === 'submitted')
const isOwner = computed(() => maropay.can('change_bank'))
const changeBlocker = computed(() => {
  if (account.value?.closedAt) return 'This Maropay account is closed.'
  return isOwner.value ? null : 'Only the business owner can change where payouts go.'
})

const bankTask = computed(() => maropay.openTasks.find((t) => t.kind === 'bank') ?? null)
const drawerOpen = ref(false)

function confirmBank(): void {
  if (!bankTask.value) return
  const result = maropay.resolveTask(bankTask.value.id, { confirmed: true })
  if (result.ok) toast.success('Bank account confirmed. Payouts are running again.')
  else toast.error(result.error.message)
}

function onSaved(): void {
  toast.success('Payout bank account changed. We sent a security notice about it.')
}
</script>

<template>
  <v-card v-if="!maropay.can('view_payouts')" flat border rounded="lg">
    <MpEmptyState
      icon="lock"
      title="Payout details are for owners and finance"
      description="Store operations users can see payments for their stores, but not where the money goes."
      :heading-level="2"
    />
  </v-card>

  <v-card v-else-if="!destination && !submitted" flat border rounded="lg">
    <MpEmptyState
      icon="landmark"
      title="Your payout account is added in setup"
      description="Once setup is submitted, you can see and change it here."
      :action-label="maropay.can('edit_onboarding') ? 'Continue setup' : undefined"
      action-icon="arrow-right"
      :heading-level="2"
      @action="router.push(maropay.routeFor({ name: 'MaropaySetup' }))"
    />
  </v-card>

  <v-card v-else flat border rounded="lg" class="maropay-bank__card">
    <MpSectionHeader title="Payout account" description="Where Maropay sends your money." :heading-level="2" />

    <MpAlert v-if="bankTask" tone="warning" live="off" title="Payouts are paused" class="mb-5">
      {{ bankTask.description }}{{ isOwner ? '' : ' The business owner needs to confirm the bank account.' }}
      <template v-if="isOwner && !changeBlocker" #actions>
        <v-btn v-if="destination" size="small" variant="outlined" class="text-none" @click="confirmBank">Confirm {{ destination.bankName }} •••• {{ destination.last4 }}</v-btn>
        <v-btn size="small" variant="text" class="text-none" @click="drawerOpen = true">Use a different account</v-btn>
      </template>
    </MpAlert>

    <MpListRow v-if="destination" variant="boxed">
      <template #lead><v-icon size="18" class="maropay-bank__icon">landmark</v-icon></template>
      <span class="maropay-bank__title">{{ destination.bankName }} •••• {{ destination.last4 }}</span>
      <span class="maropay-bank__sub">{{ destination.holderName }} · {{ destination.currency }} · added {{ formatDay(destination.addedAt) }}</span>
      <template #trailing>
        <v-tooltip :disabled="!changeBlocker" :text="changeBlocker ?? ''" location="top">
          <template #activator="{ props: tip }">
            <span v-bind="tip">
              <v-btn size="small" variant="outlined" class="text-none" :disabled="!!changeBlocker" @click="drawerOpen = true">Change</v-btn>
            </span>
          </template>
        </v-tooltip>
      </template>
    </MpListRow>
    <MpEmptyState
      v-else
      icon="landmark"
      title="No payout account yet"
      description="Payouts wait until there’s a bank account to send them to."
      :action-label="changeBlocker ? undefined : 'Add bank account'"
      action-icon="plus"
      :heading-level="3"
      @action="drawerOpen = true"
    />

    <dl class="mp-label-value mt-5">
      <dt>Schedule</dt><dd>{{ account ? payoutScheduleLabel(account.payoutSchedule) : '—' }}</dd>
      <dt>Currency</dt><dd>{{ account?.currency ?? '—' }}</dd>
    </dl>

    <p class="maropay-bank__note">
      Changing the account needs a code from your authenticator app, and we send a security notice when it changes. Only the last four digits are kept.
    </p>
  </v-card>

  <MaropayBankAccountDrawer
    v-model="drawerOpen"
    :current="destination"
    :country="account?.country ?? 'US'"
    :default-holder="maropay.business?.legalName ?? ''"
    @saved="onSaved"
  />
</template>

<style scoped>
.maropay-bank__card {
  padding: var(--mp-component-card-padding);
}

.maropay-bank__icon {
  color: var(--text-secondary);
}

.maropay-bank__title {
  display: block;
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.maropay-bank__sub {
  display: block;
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.maropay-bank__note {
  margin: var(--mp-space-20) 0 0;
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}
</style>
