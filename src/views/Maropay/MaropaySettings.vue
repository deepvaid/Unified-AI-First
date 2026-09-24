<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import { useMaropayStore } from '@/stores/useMaropay'
import BankAccountsTab from './settings/BankAccountsTab.vue'
import BusinessTab from './settings/BusinessTab.vue'
import CloseTab from './settings/CloseTab.vue'
import MethodsTab from './settings/MethodsTab.vue'
import PermissionsTab from './settings/PermissionsTab.vue'
import StoresTab from './settings/StoresTab.vue'

// Maropay → Settings: the account-level things that aren't per store — the
// business, where payouts go, which stores are linked, who can do what, and
// how to stop. The tab lives in ?tab= so notifications and other pages can
// link straight to a section.

const route = useRoute()
const router = useRouter()
const maropay = useMaropayStore()

const TABS = [
  { key: 'business', label: 'Business', component: BusinessTab },
  { key: 'bank', label: 'Payout account', component: BankAccountsTab },
  { key: 'methods', label: 'Payment methods', component: MethodsTab },
  { key: 'stores', label: 'Stores', component: StoresTab },
  { key: 'permissions', label: 'Permissions', component: PermissionsTab },
  { key: 'close', label: 'Stop or close', component: CloseTab },
] as const
type TabKey = (typeof TABS)[number]['key']

const activeTab = computed<TabKey>({
  get() {
    const raw = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
    return TABS.find((t) => t.key === raw)?.key ?? 'business'
  },
  set(tab) {
    void router.replace({ query: { ...route.query, tab } })
  },
})

const current = computed(() => TABS.find((t) => t.key === activeTab.value)!)
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MpPageHeader title="Settings" subtitle="Your business, where payouts go, the stores using Maropay and who can change them.">
      <template v-if="maropay.account" #tabs>
        <v-tabs v-model="activeTab" density="compact" color="primary" show-arrows aria-label="Maropay settings sections">
          <v-tab v-for="tab in TABS" :key="tab.key" :value="tab.key" class="text-none">{{ tab.label }}</v-tab>
        </v-tabs>
      </template>
    </MpPageHeader>

    <v-card v-if="!maropay.account" flat border rounded="lg">
      <MpEmptyState
        icon="settings"
        title="Set up Maropay first"
        description="Settings for your business, payouts and stores appear once you start setup."
        :action-label="maropay.overview.action?.label"
        action-icon="arrow-right"
        :heading-level="2"
        @action="maropay.overview.action && router.push(maropay.routeFor(maropay.overview.action.target))"
      />
    </v-card>

    <component :is="current.component" v-else />
  </div>
</template>
