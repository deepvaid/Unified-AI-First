<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MpBanner from '@/components/MpBanner.vue'
import { usePlgStore } from '@/stores/usePlg'
import { useAccountsStore } from '@/stores/useAccounts'
import PlgTalkToSalesDialog from './PlgTalkToSalesDialog.vue'

// Module-scoped so a dismissal survives this component being unmounted and
// remounted elsewhere in the shell, but resets on a fresh page load.
const dismissedThisSession = ref(false)

const plg = usePlgStore()
const accounts = useAccountsStore()
const router = useRouter()

const salesDialogOpen = ref(false)

const visible = computed(() =>
  plg.isTrial && ((plg.isExpiring && !dismissedThisSession.value) || plg.isExpired),
)

const icon = computed(() => (plg.isExpired ? 'circle-alert' : 'clock-alert'))

const message = computed(() =>
  plg.isExpired
    ? 'Your trial has ended. Your data is retained — upgrade to pick up where you left off.'
    : `Your free trial ends in ${plg.daysLeft} days — keep your momentum going.`,
)

function goToUpgrade() {
  router.push({ name: 'Plans', params: { accountId: accounts.activeId } })
}

function dismiss() {
  dismissedThisSession.value = true
}
</script>

<template>
  <MpBanner
    v-if="visible"
    :tone="plg.isExpired ? 'error' : 'warning'"
    :icon="icon"
    :message="message"
    :dismissible="plg.isExpiring"
    dismiss-label="Dismiss for this session"
    @dismiss="dismiss"
  >
    <template #actions>
      <v-btn size="small" color="primary" variant="flat" class="text-none" @click="goToUpgrade">
        Upgrade
      </v-btn>
      <v-btn size="small" variant="text" class="text-none" @click="salesDialogOpen = true">
        Talk to sales
      </v-btn>
    </template>
  </MpBanner>

  <PlgTalkToSalesDialog v-model="salesDialogOpen" />
</template>
