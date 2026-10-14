<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpSectionRail from '@/components/MpSectionRail.vue'
import { useAccountsStore } from '@/stores/useAccounts'
import { useMaropayStore } from '@/stores/useMaropay'
import { MAROPAY_STORE_ROUTE } from '@/maropay/readiness'
import { maropayMenu } from './maropayMenu'

const props = defineProps<{ accountId: string }>()

const maropay = useMaropayStore()
const accounts = useAccountsStore()
const route = useRoute()

const groups = computed(() => maropayMenu(props.accountId, {
  openTasks: maropay.openTasks.filter((t) => t.kind === 'verification' || t.kind === 'owner_review').length,
  openDisputes: maropay.disputes.filter((d) => d.status === 'needs_response').length,
  stores: maropay.bindings.map((b) => ({ channelId: b.channelId, name: maropay.channelName(b.channelId) })),
  activeChannelId: route.name === MAROPAY_STORE_ROUTE ? String(route.params.channelId) : null,
}))

// The business and its currency stay in view on every financial screen (plan §2).
const identity = computed(() => {
  const account = maropay.account
  // Before a business exists, the Maropost account stands in (seed names carry a "(…)" persona suffix).
  const accountName = accounts.activeAccount.name.replace(/\s*\(.*\)\s*$/, '')
  const name = maropay.business?.legalName || maropay.onboarding.business.legalName || accountName
  if (!account) return { name, caption: 'Maropay not set up yet', icon: 'building-2' }
  if (account.setup !== 'submitted') return { name, caption: 'Setup in progress', icon: 'building-2' }
  const { liveStores, linkedStores } = maropay.dimensions
  return { name, caption: `${account.currency} · ${liveStores} of ${linkedStores} ${linkedStores === 1 ? 'store' : 'stores'} live`, icon: 'building-2' }
})
</script>

<template>
  <MpSectionRail
    ariaLabel="Maropay sections"
    title="Maropay"
    :groups="groups"
    :identity="identity"
    :back-to="{ name: 'Dashboard', params: { accountId } }"
    back-label="Back to dashboard"
  />
</template>
