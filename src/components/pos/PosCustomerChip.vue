<script setup lang="ts">
/**
 * The customer on this sale. Tap to open their details; the remove button
 * sits on its own 44px target so it is never hit by accident.
 */
import { computed } from 'vue'
import { LOYALTY_TIER_LABELS, type LoyaltyTier } from '@/stores/useContacts'
import PosTierChip from './PosTierChip.vue'

const props = defineProps<{
  name: string
  tier: LoyaltyTier
  points: number
}>()

const emit = defineEmits<{ open: []; remove: [] }>()

const label = computed(() =>
  `Customer ${props.name}, ${LOYALTY_TIER_LABELS[props.tier]}, ${props.points.toLocaleString()} points. Open customer details`,
)
</script>

<template>
  <div class="pos-customer-chip">
    <button type="button" class="pos-customer-chip__main" :aria-label="label" @click="emit('open')">
      <v-icon size="16" aria-hidden="true">user-round</v-icon>
      <!-- Name on its own line so it never loses room to the loyalty details -->
      <span class="pos-customer-chip__id">
        <span class="pos-customer-chip__name">{{ name }}</span>
        <span class="pos-customer-chip__meta">
          <PosTierChip :tier="tier" />
          {{ points.toLocaleString() }} pts
        </span>
      </span>
    </button>
    <button type="button" class="pos-customer-chip__remove" aria-label="Remove customer from sale" @click="emit('remove')">
      <v-icon size="16" aria-hidden="true">x</v-icon>
    </button>
  </div>
</template>

<style scoped>
.pos-customer-chip {
  display: flex;
  align-items: center;
  border-radius: var(--mp-component-pos-radius-card);
  background: var(--mp-color-light-pos-accentSoft);
  color: var(--mp-color-light-pos-accentInk);
}

.pos-customer-chip__main {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--mp-space-8);
  min-width: 0;
  min-height: var(--mp-component-pos-touchTarget);
  padding: 0 var(--mp-space-4) 0 var(--mp-space-12);
  border: none;
  border-radius: var(--mp-component-pos-radius-card);
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  text-align: left;
  cursor: pointer;
}

.pos-customer-chip__main:hover { background: rgba(var(--mp-rgb-color-light-pos-accentInk), 0.08); }

.pos-customer-chip__id {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
  min-width: 0;
  padding: var(--mp-space-6) 0;
}

.pos-customer-chip__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-customer-chip__meta {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  white-space: nowrap;
}

.pos-customer-chip__remove {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--mp-component-pos-touchTarget);
  height: var(--mp-component-pos-touchTarget);
  border: none;
  border-radius: var(--mp-component-pos-radius-card);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.pos-customer-chip__remove:hover { background: rgba(var(--mp-rgb-color-light-pos-accentInk), 0.14); }
</style>
