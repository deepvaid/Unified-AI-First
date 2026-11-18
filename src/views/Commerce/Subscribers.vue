<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { useProductStores } from '@/composables/useProductStores'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { formatStorePrice } from '@/storefront/price'
import { CONTRACT_STATUSES, allowedActions, chargeAmount, dayLabel, statusCounts } from '@/subscriptions/contracts'
import type { SubscriptionContract } from '@/subscriptions/contracts'
import { deliverySummary } from '@/subscriptions/plans'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

/**
 * Commerce › Subscriptions › Subscribers: every subscription shoppers hold, one
 * row each. A checkout line bought on a plan starts one; the shopper manages it
 * on the store's /account page and the merchant here and on its own page. The
 * rules are in src/subscriptions/contracts.ts.
 */
const route = useRoute()
const router = useRouter()
const subscriptions = useSubscriptionsStore()
const toast = useToast()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

// Amounts read the way the subscriber's store writes them.
const stores = useProductStores(accountId).stores
function price(contract: SubscriptionContract): string {
  return formatStorePrice(chargeAmount(contract), stores.value.find((s) => s.id === contract.channelId)?.webStore?.locale)
}

// ── Tabs + search ────────────────────────────────────────────────────
const activeTab = ref('all')
const counts = computed(() => statusCounts(subscriptions.contracts))
const tabs = computed(() => [
  { label: 'All', key: 'all', count: subscriptions.contracts.length },
  ...CONTRACT_STATUSES.map((status) => ({ label: status, key: status, count: counts.value[status] })),
])

const search = ref('')
const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return subscriptions.contracts.filter((c) =>
    (activeTab.value === 'all' || c.status === activeTab.value)
    && (!q || [c.customer.name, c.customer.email, c.product, c.plan.name, c.number].some((text) => text.toLowerCase().includes(q))))
})
const filtering = computed(() => !!search.value.trim() || activeTab.value !== 'all')

// ── Table ────────────────────────────────────────────────────────────
const headers = [
  { title: 'Subscriber', key: 'customer', sortable: false },
  { title: 'Subscription', key: 'product', sortable: true, hideBelow: 'sm' as const },
  { title: 'Per delivery', key: 'price', sortable: false, align: 'end' as const, hideBelow: 'md' as const },
  { title: 'Next charge', key: 'nextChargeOn', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Started', key: 'startedOn', sortable: true, hideBelow: 'lg' as const },
  { title: 'Actions', key: 'actions', headerProps: { class: 'mp-th-sr' }, sortable: false, width: 48 },
]
const { visibleHeaders, isVisible } = useResponsiveTableHeaders(headers)

function detailRoute(contract: SubscriptionContract) {
  return { name: 'SubscriptionDetail', params: { accountId: accountId.value, subscriptionId: contract.id } }
}

/** What the next-charge cell says: a date while it runs, the reason there is none otherwise. */
function nextCharge(contract: SubscriptionContract): string {
  if (contract.status === 'Active') return dayLabel(contract.nextChargeOn!)
  if (contract.status === 'Payment failed') return `Failed ${dayLabel(contract.nextChargeOn!)}`
  return '—'
}

// ── Row actions ──────────────────────────────────────────────────────
// The quick ones. Changing the date or plan, charging and cancelling ask a question first, on the subscription's page.
function can(contract: SubscriptionContract, action: 'skip' | 'pause' | 'resume'): boolean {
  return allowedActions(contract).includes(action)
}

function skip(contract: SubscriptionContract): void {
  if (!subscriptions.skipNext(contract.id, 'merchant')) return
  toast.success(`Skipped ${contract.customer.name}’s next delivery. Next charge ${dayLabel(subscriptions.contractById(contract.id)!.nextChargeOn!)}.`)
}

function pause(contract: SubscriptionContract): void {
  if (subscriptions.pause(contract.id, 'merchant')) toast.success(`${contract.customer.name}’s subscription is paused.`)
}

function resume(contract: SubscriptionContract): void {
  if (!subscriptions.resume(contract.id, 'merchant')) return
  toast.success(`${contract.customer.name}’s subscription is running again. Next charge ${dayLabel(subscriptions.contractById(contract.id)!.nextChargeOn!)}.`)
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Commerce · Subscriptions"
      title="Subscribers"
      subtitle="Every subscription your shoppers hold: what they get, when they are charged next, and where it stands."
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="repeat" class="text-none" :to="{ name: 'SubscriptionPlans', params: { accountId } }">Manage plans</v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Filter subscriptions by status" />
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Subscriptions"
        search-placeholder="Search by name, email or product"
        :total-count="rows.length"
      />

      <v-data-table :headers="visibleHeaders" :items="rows" :items-per-page="15" hover density="comfortable" fixed-header class="flex-grow-1" @click:row="(_: Event, row: { item: SubscriptionContract }) => router.push(detailRoute(row.item))">
        <template #item.customer="{ item }">
          <div class="py-2">
            <RouterLink :to="detailRoute(item)" class="mp-link text-body-2 font-weight-medium" @click.stop>{{ item.customer.name }}</RouterLink>
            <div class="text-caption text-medium-emphasis">{{ item.customer.email }}</div>
            <!-- A dropped Subscription column folds in here rather than disappearing. -->
            <div v-if="!isVisible('product')" class="text-caption text-medium-emphasis">{{ item.product }} · {{ item.plan.name }}</div>
          </div>
        </template>
        <template #item.product="{ item }">
          <div class="text-body-2">{{ item.product }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.plan.name }} · {{ deliverySummary(item.plan) }}</div>
        </template>
        <template #item.price="{ item }">
          <span class="text-body-2 text-no-wrap">{{ price(item) }}</span>
        </template>
        <template #item.nextChargeOn="{ item }">
          <span class="text-body-2 text-no-wrap" :class="{ 'text-medium-emphasis': item.status !== 'Active' }">{{ nextCharge(item) }}</span>
        </template>
        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="subscription" size="sm" />
        </template>
        <template #item.startedOn="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ dayLabel(item.startedOn) }}</span>
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Subscription actions" :item-label="`${item.customer.name}, ${item.number}`">
            <MpMenuItem icon="eye" title="Open" :to="detailRoute(item)" />
            <MpMenuItem v-if="can(item, 'skip')" icon="skip-forward" title="Skip next delivery" @click="skip(item)" />
            <MpMenuItem v-if="can(item, 'pause')" icon="pause" title="Pause" @click="pause(item)" />
            <MpMenuItem v-if="can(item, 'resume')" icon="play" title="Resume" @click="resume(item)" />
          </MpRowActionsMenu>
        </template>
        <template #no-data>
          <MpEmptyState
            :icon="filtering ? 'search-x' : 'repeat'"
            :title="filtering ? 'No subscriptions match' : 'No subscribers yet'"
            :description="filtering
              ? 'Try a different search term or another status.'
              : 'When a shopper buys a product on a subscription plan, their subscription appears here.'"
            :action-label="filtering ? undefined : 'Manage plans'"
            :action-icon="filtering ? undefined : 'repeat'"
            @action="router.push({ name: 'SubscriptionPlans', params: { accountId } })"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
