<script setup lang="ts">
// DvCatalogGateCard — why Catalog Co-Pilot can't draft right now, and what to do.
//
// One card per gate reason (PRD gate_reason): trial allowance used, no or empty
// Co-Pilot pack, no Commerce Cloud, kill switch, role. Every variant says that the
// manual product path still works — a gate blocks generation only. Composes the
// shared Da Vinci card chrome; the host owns navigation and the sales dialog.
import { computed } from 'vue'
import DvOnboardingCardShell from './DvOnboardingCardShell.vue'
import MpUsageMeter from '@/components/MpUsageMeter.vue'
import {
  CREDITS_PER_ACTION,
  type CatalogGateAction,
  type CatalogGateReason,
  type CatalogWallet,
} from '@/composables/catalogCopilotConfig'
import type { CampaignOnboardingAction } from '@/stores/useCopilot'

const props = defineProps<{
  reason: CatalogGateReason
  wallet: CatalogWallet
}>()

const emit = defineEmits<{ action: [action: CatalogGateAction] }>()

interface GateCopy {
  icon: string
  eyebrow: string
  title: string
  description: string
  primary?: CampaignOnboardingAction
  secondary?: CampaignOnboardingAction
  meter: boolean
}

const UPGRADE: CampaignOnboardingAction = { label: 'Upgrade', action: 'upgrade', icon: 'arrow-up-right' }
const BUY_CREDITS: CampaignOnboardingAction = { label: 'Buy credits', action: 'buy-credits', icon: 'coins' }
const TALK_TO_SALES: CampaignOnboardingAction = { label: 'Talk to sales', action: 'talk-to-sales' }

const copy = computed<GateCopy>(() => {
  switch (props.reason) {
    case 'trial_exhausted':
      return props.wallet.expired
        ? {
            icon: 'hourglass', eyebrow: 'Free trial', title: 'Your free trial has ended',
            description: 'Its Da Vinci allowance ended with it. Upgrade to keep drafting products — adding, importing and publishing products manually still works.',
            primary: UPGRADE, secondary: TALK_TO_SALES, meter: false,
          }
        : {
            icon: 'hourglass', eyebrow: 'Free trial allowance', title: 'You’ve used all 5 trial actions',
            description: 'Upgrade to keep drafting products with Da Vinci. You can still add, import and publish products manually.',
            primary: UPGRADE, secondary: TALK_TO_SALES, meter: true,
          }
    case 'no_credits':
      return props.wallet.kind === 'pack'
        ? {
            icon: 'coins', eyebrow: 'Co-Pilot credits', title: 'You’re out of Co-Pilot credits',
            description: 'Your credit pack is used up. Add credits to keep drafting — products you’ve already created aren’t affected.',
            primary: BUY_CREDITS, secondary: TALK_TO_SALES, meter: true,
          }
        : {
            icon: 'coins', eyebrow: 'Co-Pilot credits', title: 'Add Co-Pilot credits to draft products',
            description: `Catalog Co-Pilot runs on Da Vinci Co-Pilot credits — each applied draft uses ${CREDITS_PER_ACTION}. Add a credit pack, or keep adding products manually.`,
            primary: BUY_CREDITS, secondary: TALK_TO_SALES, meter: false,
          }
    case 'no_commerce':
      return {
        icon: 'store', eyebrow: 'Commerce Cloud', title: 'Catalog Co-Pilot needs Commerce Cloud',
        description: 'Da Vinci drafts catalog products for accounts with a Commerce Cloud subscription.',
        primary: { label: 'View plans', action: 'upgrade', icon: 'arrow-up-right' }, secondary: TALK_TO_SALES, meter: false,
      }
    case 'kill_switch':
      return {
        icon: 'circle-pause', eyebrow: 'Temporarily unavailable', title: 'Catalog Co-Pilot is unavailable right now',
        description: 'Da Vinci can’t draft products at the moment. Adding and publishing products manually works as usual.',
        primary: { label: 'Add product manually', action: 'add-manually', icon: 'plus' }, meter: false,
      }
    case 'role':
    default:
      return {
        icon: 'lock', eyebrow: 'Permissions', title: 'You don’t have access to Catalog Co-Pilot',
        description: 'Only people who can create or edit products can use it. Ask an account admin for access.',
        meter: false,
      }
  }
})

const meter = computed(() =>
  props.wallet.kind === 'trial'
    ? {
        label: 'Trial actions',
        used: Math.ceil(props.wallet.used / CREDITS_PER_ACTION),
        limit: Math.floor(props.wallet.limit / CREDITS_PER_ACTION),
      }
    : { label: 'Co-Pilot credits', used: props.wallet.used, limit: props.wallet.limit },
)

function onAction(action: string) {
  emit('action', action as CatalogGateAction)
}
</script>

<template>
  <DvOnboardingCardShell
    :icon="copy.icon"
    :eyebrow="copy.eyebrow"
    :title="copy.title"
    :description="copy.description"
    :primary-action="copy.primary"
    :secondary-action="copy.secondary"
    @action="onAction"
  >
    <MpUsageMeter
      v-if="copy.meter && wallet.kind !== 'none'"
      :label="meter.label"
      :used="meter.used"
      :limit="meter.limit"
      dense
      class="mt-4"
    />
  </DvOnboardingCardShell>
</template>
