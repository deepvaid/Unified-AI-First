<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpErrorState from '@/components/MpErrorState.vue'
import { useAccountsStore } from '@/stores/useAccounts'

// The app-wide 404: any admin URL no route claims lands here, inside the app chrome.
// Module catch-alls (Merchandising, Maropay, the storefront) still handle their own paths.
const route = useRoute()
const router = useRouter()
const accounts = useAccountsStore()

// The catch-all has no :accountId, so the router guard never syncs the account. Take it
// from the broken URL itself, so a bad link inside an account goes back to that account.
const accountId = computed(() => {
  const fromPath = route.path.match(/^\/(?:accounts|commerce)\/([^/]+)/)?.[1]
  return fromPath && accounts.accounts.some(a => a.id === fromPath) ? fromPath : accounts.activeId
})
</script>

<template>
  <MpErrorState
    emphasis="prominent"
    icon="file-question"
    title="Page not found"
    description="This page doesn’t exist or has moved. Check the link, or go back to your dashboard."
    action-label="Go to dashboard"
    action-icon="layout-dashboard"
    :heading-level="1"
    @action="router.push(`/accounts/${accountId}/dashboard`)"
  />
</template>
