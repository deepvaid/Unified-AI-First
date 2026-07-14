<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
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
  <div v-if="visible" class="plg-trial-banner" :class="plg.isExpired ? 'plg-trial-banner--error' : 'plg-trial-banner--warning'">
    <v-icon size="18" class="plg-trial-banner__icon">{{ icon }}</v-icon>
    <span class="plg-trial-banner__message text-body-2">{{ message }}</span>
    <div class="plg-trial-banner__actions">
      <v-btn
        size="small"
        color="primary"
        variant="flat"
        class="text-none"
        @click="goToUpgrade"
      >
        Upgrade
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        class="text-none"
        @click="salesDialogOpen = true"
      >
        Talk to sales
      </v-btn>
      <button
        v-if="plg.isExpiring"
        type="button"
        class="plg-trial-banner__dismiss"
        aria-label="Dismiss for this session"
        @click="dismiss"
      >
        <v-icon size="16">x</v-icon>
      </button>
    </div>
  </div>

  <PlgTalkToSalesDialog v-model="salesDialogOpen" />
</template>

<style scoped>
.plg-trial-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  width: 100%;
  padding: 6px 16px;
  color: rgb(var(--v-theme-on-surface));
}

.plg-trial-banner--warning {
  background: rgba(var(--v-theme-warning), 0.12);
  border-bottom: 1px solid rgba(var(--v-theme-warning), 0.28);
}

.plg-trial-banner--warning .plg-trial-banner__icon {
  color: rgb(var(--v-theme-warning));
}

.plg-trial-banner--error {
  background: rgba(var(--v-theme-error), 0.12);
  border-bottom: 1px solid rgba(var(--v-theme-error), 0.28);
}

.plg-trial-banner--error .plg-trial-banner__icon {
  color: rgb(var(--v-theme-error));
}

.plg-trial-banner__icon {
  flex-shrink: 0;
}

.plg-trial-banner__message {
  flex: 1 1 auto;
  min-width: 0;
}

.plg-trial-banner__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.plg-trial-banner__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: 2px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.6;
  appearance: none;
  cursor: pointer;
  transition: opacity 120ms ease, background 120ms ease;
}

.plg-trial-banner__dismiss:hover,
.plg-trial-banner__dismiss:focus-visible {
  opacity: 1;
  background: rgba(var(--v-theme-on-surface), 0.08);
  outline: none;
}
</style>
