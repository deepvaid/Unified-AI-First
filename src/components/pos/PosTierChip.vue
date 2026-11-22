<script setup lang="ts">
/** A customer's loyalty tier, named. Gold and VIP stand out; Member and Silver stay quiet. */
import { computed } from 'vue'
import { LOYALTY_TIER_LABELS, type LoyaltyTier } from '@/stores/useContacts'
import PosBadge from './PosBadge.vue'
import type { PosTone } from './posArt'

const props = defineProps<{ tier: LoyaltyTier }>()

const TIER_TONE: Record<LoyaltyTier, PosTone> = {
  member: 'neutral',
  silver: 'neutral',
  gold: 'warn',
  vip: 'ink',
}

const tone = computed(() => TIER_TONE[props.tier])
</script>

<template>
  <PosBadge :tone="tone">{{ LOYALTY_TIER_LABELS[tier] }}</PosBadge>
</template>
