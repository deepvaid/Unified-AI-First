<script setup lang="ts">
import { computed } from 'vue'
import { useRetailStore } from '@/stores/useRetail'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'

const store = useRetailStore()
const settings = computed(() => store.receiptSettings)

const DELIVERY_OPTIONS = [
  { value: 'ask', title: 'Ask the shopper' },
  { value: 'print', title: 'Print' },
  { value: 'email', title: 'Email' },
  { value: 'both', title: 'Print and email' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Retail · Setup"
      title="Receipts"
      subtitle="What the shopper walks away with — template wording, branding and delivery."
    />

    <v-row dense>
      <v-col cols="12" md="7">
        <v-card flat border rounded="lg" class="pa-6 mb-4">
          <MpSectionHeader title="Template" />
          <v-text-field
            :model-value="settings.headerText"
            label="Header message"
            variant="outlined"
            density="comfortable"
            class="mt-4"
            @update:model-value="(v) => store.updateReceiptSettings({ headerText: v })"
          />
          <v-textarea
            :model-value="settings.footerText"
            label="Footer message"
            variant="outlined"
            density="comfortable"
            rows="2"
            auto-grow
            @update:model-value="(v) => store.updateReceiptSettings({ footerText: v })"
          />
          <v-switch
            :model-value="settings.showLogo"
            label="Show store logo"
            color="primary"
            density="comfortable"
            hide-details
            @update:model-value="(v) => store.updateReceiptSettings({ showLogo: !!v })"
          />
          <v-switch
            :model-value="settings.showTaxNumber"
            label="Show tax registration number"
            color="primary"
            density="comfortable"
            hide-details
            @update:model-value="(v) => store.updateReceiptSettings({ showTaxNumber: !!v })"
          />
        </v-card>

        <v-card flat border rounded="lg" class="pa-6">
          <MpSectionHeader title="Delivery" />
          <v-select
            :model-value="settings.defaultDelivery"
            :items="DELIVERY_OPTIONS"
            label="Default at checkout"
            variant="outlined"
            density="comfortable"
            class="mt-4"
            style="max-width: 360px"
            @update:model-value="(v) => store.updateReceiptSettings({ defaultDelivery: v })"
          />
          <v-text-field
            :model-value="settings.emailSubject"
            label="Email subject"
            hint="{{store}} is replaced with the selling location's name."
            persistent-hint
            variant="outlined"
            density="comfortable"
            @update:model-value="(v) => store.updateReceiptSettings({ emailSubject: v })"
          />
          <v-switch
            :model-value="settings.giftReceiptsEnabled"
            label="Offer gift receipts (prices hidden)"
            color="primary"
            density="comfortable"
            hide-details
            class="mt-2"
            @update:model-value="(v) => store.updateReceiptSettings({ giftReceiptsEnabled: !!v })"
          />
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card flat border rounded="lg" class="pa-6">
          <MpSectionHeader title="Preview" />
          <div class="receipt-preview mt-4">
            <div v-if="settings.showLogo" class="receipt-preview__logo">LOGO</div>
            <div class="receipt-preview__header">{{ settings.headerText }}</div>
            <div class="receipt-preview__rule" />
            <div class="receipt-preview__line"><span>Cap — Navy</span><span>$35.00</span></div>
            <div class="receipt-preview__line"><span>Tax (10%)</span><span>$3.50</span></div>
            <div class="receipt-preview__rule" />
            <div class="receipt-preview__line receipt-preview__line--total"><span>Total</span><span>$38.50</span></div>
            <div v-if="settings.showTaxNumber" class="receipt-preview__meta">ABN 12 345 678 901</div>
            <div class="receipt-preview__footer">{{ settings.footerText }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="scss">
.receipt-preview {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 8px;
  padding: 20px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
}

.receipt-preview__logo {
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-bottom: 8px;
}

.receipt-preview__header {
  text-align: center;
  font-weight: 600;
  margin-bottom: 10px;
}

.receipt-preview__rule {
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
  margin: 8px 0;
}

.receipt-preview__line {
  display: flex;
  justify-content: space-between;
}

.receipt-preview__line--total {
  font-weight: 700;
}

.receipt-preview__meta {
  margin-top: 10px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.receipt-preview__footer {
  margin-top: 10px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
