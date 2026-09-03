<script setup lang="ts">
import { computed } from 'vue'
import { useRetailStore } from '@/stores/useRetail'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'

const store = useRetailStore()
const settings = computed(() => store.paymentsSettings)

const PROVIDERS = [
  { value: 'maropost_payments', title: 'Maropost Payments' },
  { value: 'stripe', title: 'Stripe Terminal' },
  { value: 'adyen', title: 'Adyen' },
]

const TIP_PRESETS = [
  { label: '5 / 10 / 15%', value: [5, 10, 15] },
  { label: '10 / 15 / 20%', value: [10, 15, 20] },
  { label: '15 / 18 / 20%', value: [15, 18, 20] },
]

const tipPresetLabel = computed({
  get: () => TIP_PRESETS.find((p) => p.value.join() === settings.value.tipPresets.join())?.label ?? TIP_PRESETS[0]!.label,
  set: (label: string) => {
    const preset = TIP_PRESETS.find((p) => p.label === label)
    if (preset) store.updatePaymentsSettings({ tipPresets: preset.value })
  },
})
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Retail · Setup"
      title="Payments"
      subtitle="How your registers take money — provider, accepted tenders, surcharging and tipping."
    />

    <v-card flat border rounded="lg" class="retail-form-card">
      <MpSectionHeader title="Provider" />
      <MpFormGrid :cols="2">
        <v-select
          :model-value="settings.provider"
          :items="PROVIDERS"
          label="Payment provider"
          @update:model-value="(v) => store.updatePaymentsSettings({ provider: v })"
        />
        <v-switch
          :model-value="settings.tapToPayEnabled"
          label="Accept Tap to Pay on iPhone and Android"
          class="mp-form-grid__full"
          @update:model-value="(v) => store.updatePaymentsSettings({ tapToPayEnabled: !!v })"
        />
        <v-switch
          :model-value="settings.offlinePaymentsEnabled"
          label="Take card payments while offline"
          hint="Queued and captured when the register reconnects."
          persistent-hint
          class="mp-form-grid__full"
          @update:model-value="(v) => store.updatePaymentsSettings({ offlinePaymentsEnabled: !!v })"
        />
      </MpFormGrid>
    </v-card>

    <v-card flat border rounded="lg" class="retail-form-card">
      <MpSectionHeader title="Surcharging and rounding" />
      <MpFormGrid :cols="2">
        <v-switch
          :model-value="settings.surchargeEnabled"
          label="Pass card surcharge on to the shopper"
          class="mp-form-grid__full"
          @update:model-value="(v) => store.updatePaymentsSettings({ surchargeEnabled: !!v })"
        />
        <v-text-field
          v-if="settings.surchargeEnabled"
          :model-value="settings.surchargePct"
          label="Surcharge"
          type="number"
          step="0.1"
          suffix="%"
          @update:model-value="(v) => store.updatePaymentsSettings({ surchargePct: Number(v) })"
        />
        <v-switch
          :model-value="settings.cashRoundingEnabled"
          label="Round cash totals to the nearest 5c"
          class="mp-form-grid__full"
          @update:model-value="(v) => store.updatePaymentsSettings({ cashRoundingEnabled: !!v })"
        />
      </MpFormGrid>
    </v-card>

    <v-card flat border rounded="lg" class="retail-form-card">
      <MpSectionHeader title="Tipping" />
      <MpFormGrid :cols="2">
        <v-switch
          :model-value="settings.tippingEnabled"
          label="Prompt for a tip at checkout"
          class="mp-form-grid__full"
          @update:model-value="(v) => store.updatePaymentsSettings({ tippingEnabled: !!v })"
        />
        <v-select
          v-if="settings.tippingEnabled"
          v-model="tipPresetLabel"
          :items="TIP_PRESETS.map((p) => p.label)"
          label="Suggested amounts"
        />
      </MpFormGrid>
    </v-card>
  </div>
</template>

<style scoped>
/* Card root inset is the card token, never a pa-* utility (recipe B1). */
.retail-form-card {
  padding: var(--mp-component-card-padding);
}
</style>
