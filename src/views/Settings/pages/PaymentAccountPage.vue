<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpListRow from '@/components/MpListRow.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MaropayReadinessCard from '@/components/maropay/MaropayReadinessCard.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import { useMaropayStore } from '@/stores/useMaropay'

// Settings › Payment Account is a signpost, not a second source of truth:
// payments, payouts and methods are managed in Maropay.

const route = useRoute()
const maropay = useMaropayStore()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

const actionTo = computed(() => (maropay.overview.action ? maropay.routeFor(maropay.overview.action.target) : null))

const links = computed(() => {
  const params = { accountId: accountId.value }
  return [
    { icon: 'layout-dashboard', title: 'Maropay overview', desc: 'Balances, payouts and anything that needs you.', to: { name: 'MaropayOverview', params } },
    { icon: 'list-checks', title: 'Setup and verification', desc: 'Business details, identity checks and agreements.', to: { name: 'MaropaySetup', params } },
    { icon: 'landmark', title: 'Payout bank account', desc: 'Where your money is sent.', to: { name: 'MaropaySettings', params, query: { tab: 'bank' } } },
    { icon: 'store', title: 'Stores using Maropay', desc: 'Activate Maropay store by store.', to: { name: 'MaropaySettings', params, query: { tab: 'stores' } } },
  ]
})
</script>

<template>
  <div class="settings-page">
    <MpPageHeader
      :level="2"
      density="compact"
      title="Payment Account"
      subtitle="Payments, payouts and payment methods are managed in Maropay."
    />
    <MaropayReadinessCard
      :instruction="maropay.overview"
      :dimensions="maropay.dimensions"
      :action-to="actionTo"
      :heading-level="3"
    />
    <SettingsSection title="Manage in Maropay">
      <MpListRow v-for="link in links" :key="link.title" variant="divided" :to="link.to">
        <template #lead><v-icon size="18" class="payment-account__icon">{{ link.icon }}</v-icon></template>
        <span class="payment-account__title">{{ link.title }}</span>
        <span class="payment-account__desc">{{ link.desc }}</span>
        <template #trailing><v-icon size="16" class="payment-account__chevron">chevron-right</v-icon></template>
      </MpListRow>
    </SettingsSection>
  </div>
</template>

<style scoped>
.payment-account__icon {
  color: var(--icon-secondary);
}

.payment-account__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--text-primary);
}

.payment-account__desc {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}

.payment-account__chevron {
  color: var(--muted);
}
</style>
