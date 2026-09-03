<script setup lang="ts">
import { computed } from 'vue'
import { useRetailStore } from '@/stores/useRetail'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'

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
      <v-col cols="12" md="7" class="d-flex flex-column ga-5">
        <v-card flat border rounded="lg" class="retail-form-card">
          <MpSectionHeader title="Template" />
          <MpFormGrid>
            <v-text-field
              :model-value="settings.headerText"
              label="Header message"
              @update:model-value="(v) => store.updateReceiptSettings({ headerText: v })"
            />
            <v-textarea
              :model-value="settings.footerText"
              label="Footer message"
              rows="3"
              auto-grow
              @update:model-value="(v) => store.updateReceiptSettings({ footerText: v })"
            />
            <v-switch
              :model-value="settings.showLogo"
              label="Show store logo"
              @update:model-value="(v) => store.updateReceiptSettings({ showLogo: !!v })"
            />
            <v-switch
              :model-value="settings.showTaxNumber"
              label="Show tax registration number"
              @update:model-value="(v) => store.updateReceiptSettings({ showTaxNumber: !!v })"
            />
          </MpFormGrid>
        </v-card>

        <v-card flat border rounded="lg" class="retail-form-card">
          <MpSectionHeader title="Delivery" />
          <MpFormGrid :cols="2">
            <v-select
              :model-value="settings.defaultDelivery"
              :items="DELIVERY_OPTIONS"
              label="Default at checkout"
              @update:model-value="(v) => store.updateReceiptSettings({ defaultDelivery: v })"
            />
            <v-text-field
              :model-value="settings.emailSubject"
              label="Email subject"
              hint="{{store}} is replaced with the selling location's name."
              persistent-hint
              class="mp-form-grid__full"
              @update:model-value="(v) => store.updateReceiptSettings({ emailSubject: v })"
            />
            <v-switch
              :model-value="settings.giftReceiptsEnabled"
              label="Offer gift receipts (prices hidden)"
              class="mp-form-grid__full"
              @update:model-value="(v) => store.updateReceiptSettings({ giftReceiptsEnabled: !!v })"
            />
          </MpFormGrid>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card flat border rounded="lg" class="retail-form-card">
          <MpSectionHeader title="Preview" />
          <div class="receipt-preview">
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
/* Card root inset is the card token, never a pa-* utility (recipe B1). */
.retail-form-card {
  padding: var(--mp-component-card-padding);
}

/* Paper-receipt mock: dashed hairlines on --border-default, muted ink pairs on the card surface. */
.receipt-preview {
  border: 1px dashed var(--border-default);
  border-radius: var(--mp-component-chip-radius);
  padding: var(--mp-component-card-padding);
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-text-caption-fontSize);
  line-height: 1.6;
  color: var(--on-surface);
  font-variant-numeric: tabular-nums;
}

.receipt-preview__logo {
  text-align: center;
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: var(--mp-text-eyebrow-letterSpacing);
  color: var(--on-surface-muted);
  margin-bottom: var(--mp-space-8);
}

.receipt-preview__header {
  text-align: center;
  font-weight: var(--mp-fontWeight-semibold);
  margin-bottom: var(--mp-space-10);
}

.receipt-preview__rule {
  border-top: 1px dashed var(--border-default);
  margin: var(--mp-space-8) 0;
}

.receipt-preview__line {
  display: flex;
  justify-content: space-between;
}

.receipt-preview__line--total {
  font-weight: var(--mp-fontWeight-bold);
}

.receipt-preview__meta,
.receipt-preview__footer {
  margin-top: var(--mp-space-10);
  text-align: center;
  color: var(--on-surface-muted);
}
</style>
