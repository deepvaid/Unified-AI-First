<script setup lang="ts">
import { computed } from 'vue'
import MpBanner from '@/components/MpBanner.vue'
import { ROLE_LABELS } from '@/maropay/model'
import type { MaropayActingRole } from '@/maropay/model'

// Reviewer preview of the access model (plan §2). Always visible while the
// prototype acts as someone other than the owner, so a disabled button is never
// a mystery.

const props = withDefaults(defineProps<{
  role: MaropayActingRole
  /** Store names a store-operations user is scoped to. */
  storeNames?: string[]
}>(), {
  storeNames: () => [],
})

const emit = defineEmits<{ reset: [] }>()

const scope = computed(() => {
  if (props.role === 'finance') {
    return 'You can work with payments, refunds, disputes and payouts. Agreements, verification, store activation and bank changes are owner-only.'
  }
  const stores = props.storeNames.length ? ` for ${props.storeNames.join(', ')}` : ''
  return `You can see payments${stores} and capture or cancel authorisations. Refunds, bank details, agreements and activation need an owner or finance user.`
})
</script>

<template>
  <MpBanner v-if="role !== 'owner'" tone="info" icon="user-cog">
    <strong>Previewing as {{ ROLE_LABELS[role] }}.</strong>&nbsp;{{ scope }}
    <template #actions>
      <v-btn size="small" variant="outlined" class="text-none" @click="emit('reset')">Switch to owner</v-btn>
    </template>
  </MpBanner>
</template>
