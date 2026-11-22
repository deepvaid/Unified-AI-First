<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import { OWN_PROVIDER_KINDS, PROVIDER_SPECS, isManualKind, platformFeeLine, providerLabel } from '@/maropay/providers'
import type { OwnProviderKind, StoreProviderSetup } from '@/maropay/providers'

// "Add a payment method": the real product's provider set as a select-then-commit
// gallery — the merchant's own providers above, the manual methods below. Choosing
// one hands its kind back to the page, which connects it and opens its drawer.

const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  setup: StoreProviderSetup
  /** Which group the merchant asked for — it is listed first. */
  group?: 'providers' | 'manual'
}>(), {
  group: 'providers',
})

const emit = defineEmits<{ choose: [kind: OwnProviderKind] }>()

const selected = ref<OwnProviderKind | null>(null)

watch(model, (open) => {
  if (open) selected.value = null
})

const FAMILY_ICONS: Record<string, string> = {
  gateway: 'credit-card', wallet: 'wallet', bnpl: 'calendar-clock', manual: 'hand-coins',
}

interface Option { kind: OwnProviderKind; title: string; description: string; icon: string }

function option(kind: OwnProviderKind): Option {
  const spec = PROVIDER_SPECS[kind]
  const rates = [...new Set(spec.methods.map((m) => m.rate?.label).filter((l): l is string => !!l))]
  const description = isManualKind(kind)
    ? 'Paid outside the store. You confirm the payment before fulfilling.'
    : [spec.methods.map((m) => m.label).join(', '), rates.join(' / '), platformFeeLine(kind, props.setup)].filter(Boolean).join(' · ')
  return { kind, title: providerLabel(kind), description, icon: kind === 'bank_deposit' ? 'landmark' : kind === 'cheque' ? 'receipt' : kind === 'cod' ? 'banknote' : FAMILY_ICONS[spec.family] ?? 'credit-card' }
}

const available = computed(() => OWN_PROVIDER_KINDS.filter((kind) => !props.setup.connections.some((c) => c.kind === kind)))
const providers = computed(() => available.value.filter((kind) => !isManualKind(kind)).map(option))
const manual = computed(() => available.value.filter(isManualKind).map(option))
const groups = computed(() => {
  const list = [
    { key: 'providers', title: 'Providers', description: 'Connected with your own account. Each takes the methods it offers.', options: providers.value, empty: 'Every provider is already on this store.' },
    { key: 'manual', title: 'Manual methods', description: 'Paid outside the store — bank deposit, cheque or cash on delivery.', options: manual.value, empty: 'Every manual method is already on this store.' },
  ]
  return props.group === 'manual' ? list.reverse() : list
})

function choose(): void {
  if (!selected.value) return
  emit('choose', selected.value)
  model.value = false
}
</script>

<template>
  <MpFormDrawer v-model="model" title="Add a payment method" subtitle="Providers you connect yourself, or a method paid outside the store." size="md">
    <template v-for="group in groups" :key="group.key">
      <MpFormSection :title="group.title" :description="group.description" />
      <MpFormGrid v-if="group.options.length" :cols="2">
        <MpOptionCard
          v-for="item in group.options"
          :key="item.kind"
          :selected="selected === item.kind"
          :title="item.title"
          :description="item.description"
          :icon="item.icon"
          @click="selected = item.kind"
        />
      </MpFormGrid>
      <p v-else class="chooser__empty">{{ group.empty }}</p>
    </template>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="model = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!selected" @click="choose">Continue</v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped>
.chooser__empty {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}
</style>
