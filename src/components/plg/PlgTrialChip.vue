<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlgStore } from '@/stores/usePlg'
import { useAccountsStore } from '@/stores/useAccounts'
import PlgTalkToSalesDialog from './PlgTalkToSalesDialog.vue'

const DAY_MS = 86_400_000
const TRIAL_DAYS = 14

const plg = usePlgStore()
const accounts = useAccountsStore()
const router = useRouter()

const menuOpen = ref(false)
const salesDialogOpen = ref(false)

function formatCompact(n: number): string {
  if (n < 0) return '∞' // unlimited
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

const statusColor = computed(() => (plg.isExpired ? 'error' : plg.isExpiring ? 'warning' : 'primary'))

const statusLabel = computed(() => {
  if (plg.isExpired) return 'Expired'
  if (plg.isExpiring) return 'Expiring soon'
  return `${plg.daysLeft} days left`
})

const pillLabel = computed(() => (plg.isExpired ? 'Trial ended' : `Trial · ${plg.daysLeft}d`))

const headerTitle = computed(() =>
  plg.isExpired ? 'Your trial has ended — your data is safe.' : 'Free trial',
)

const elapsedPct = computed(() => {
  const trialEnd = new Date(plg.active.trialEndsAt).getTime()
  const trialStart = trialEnd - TRIAL_DAYS * DAY_MS
  const span = trialEnd - trialStart
  if (span <= 0) return 100
  const pct = ((Date.now() - trialStart) / span) * 100
  return Math.min(100, Math.max(0, pct))
})

const tokensUsage = computed(() => plg.active.usage.aiTokens)
const tokensPct = computed(() => {
  const { used, limit } = tokensUsage.value
  if (limit <= 0) return 0
  return Math.min(100, (used / limit) * 100)
})
const tokensUsedLabel = computed(() => formatCompact(tokensUsage.value.used))
const tokensLimitLabel = computed(() => formatCompact(tokensUsage.value.limit))

function goToUpgrade() {
  menuOpen.value = false
  router.push({ name: 'Plans', params: { accountId: accounts.activeId } })
}

function openTalkToSales() {
  menuOpen.value = false
  salesDialogOpen.value = true
}
</script>

<template>
  <template v-if="plg.isTrial">
    <v-menu v-model="menuOpen" location="bottom end" width="320" offset="8" :close-on-content-click="false">
      <template #activator="{ props }">
        <button
          v-bind="props"
          type="button"
          class="plg-trial-pill"
          :class="[`plg-trial-pill--${statusColor}`]"
          aria-label="Trial status"
          aria-haspopup="menu"
          :aria-expanded="menuOpen"
        >
          <v-icon size="16">rocket</v-icon>
          <span class="plg-trial-pill__label">{{ pillLabel }}</span>
        </button>
      </template>

      <v-card flat border rounded="lg" width="320" class="plg-trial-menu">
        <div class="plg-trial-menu__header">
          <div class="text-body-2 font-weight-bold plg-trial-menu__title">{{ headerTitle }}</div>
          <v-chip size="x-small" variant="tonal" :color="statusColor" class="flex-shrink-0">
            {{ statusLabel }}
          </v-chip>
        </div>

        <div class="plg-trial-menu__section">
          <div class="plg-trial-progress">
            <div
              class="plg-trial-progress__fill"
              :class="[`plg-trial-progress__fill--${statusColor}`]"
              :style="{ width: `${elapsedPct}%` }"
            />
          </div>
        </div>

        <div class="plg-trial-menu__section">
          <div class="plg-trial-meter-row">
            <span class="text-body-2 font-weight-medium">Da Vinci AI tokens</span>
            <span class="text-caption text-medium-emphasis">{{ tokensUsedLabel }}/{{ tokensLimitLabel }}</span>
          </div>
          <v-progress-linear
            :model-value="tokensPct"
            height="6"
            rounded
            color="secondary"
            bg-color="surface-variant"
          />
        </div>

        <div class="plg-trial-menu__section plg-trial-limits">
          <v-icon size="14" class="flex-shrink-0 mt-1">info</v-icon>
          <span class="text-caption text-medium-emphasis">SMS not included &middot; 1 chatbot &middot; 10K email sends</span>
        </div>

        <div class="plg-trial-menu__actions">
          <v-btn block color="primary" variant="flat" class="text-none" @click="goToUpgrade">Upgrade now</v-btn>
          <v-btn block variant="text" class="text-none" @click="openTalkToSales">Talk to sales</v-btn>
        </div>
      </v-card>
    </v-menu>

    <PlgTalkToSalesDialog v-model="salesDialogOpen" />
  </template>
</template>

<style scoped>
.plg-trial-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  height: var(--mp-component-chip-height-lg);
  padding-inline: var(--mp-space-12);
  border: 1px solid transparent;
  border-radius: var(--mp-radius-full);
  font: inherit;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  appearance: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: filter 120ms ease;
}

.plg-trial-pill:hover {
  filter: brightness(0.97);
}

.plg-trial-pill:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, currentColor 20%, transparent);
}

.plg-trial-pill--primary {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.24);
  color: rgb(var(--v-theme-primary));
}

.plg-trial-pill--warning {
  background: rgba(var(--v-theme-warning), 0.12);
  border-color: rgba(var(--v-theme-warning), 0.28);
  color: rgb(var(--v-theme-warning));
}

.plg-trial-pill--error {
  background: rgba(var(--v-theme-error), 0.12);
  border-color: rgba(var(--v-theme-error), 0.28);
  color: rgb(var(--v-theme-error));
}

.plg-trial-menu {
  overflow: hidden;
}

.plg-trial-menu__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-space-10);
  padding: var(--mp-space-16) var(--mp-space-16) var(--mp-space-12);
}

.plg-trial-menu__title {
  color: rgb(var(--v-theme-on-surface));
}

.plg-trial-menu__section {
  padding: 0 var(--mp-space-16) var(--mp-space-14);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
}

.plg-trial-progress {
  height: var(--mp-space-6);
  border-radius: var(--mp-radius-full);
  background: rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}

.plg-trial-progress__fill {
  height: 100%;
  border-radius: var(--mp-radius-full);
  transition: width var(--mp-motion-duration-base) var(--mp-motion-easing-standard);
}

.plg-trial-progress__fill--primary {
  background: rgb(var(--v-theme-primary));
}

.plg-trial-progress__fill--warning {
  background: rgb(var(--v-theme-warning));
}

.plg-trial-progress__fill--error {
  background: rgb(var(--v-theme-error));
}

.plg-trial-meter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
}

.plg-trial-limits {
  flex-direction: row;
  align-items: flex-start;
  gap: var(--mp-space-6);
  color: rgb(var(--v-theme-on-surface-variant));
}

.plg-trial-menu__actions {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  padding: var(--mp-space-4) var(--mp-space-16) var(--mp-space-16);
}
</style>
