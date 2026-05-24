<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'

const categories = [
  { icon: 'credit-card',    title: 'Payment terminals', desc: 'Stripe Reader M2, S700, Tap to Pay on iPhone & Android.' },
  { icon: 'printer',        title: 'Receipt printers',  desc: 'Star Micronics mC-Print3, Epson TM-m30III, ESC/POS over Wi-Fi.' },
  { icon: 'scan-barcode',   title: 'Barcode scanners',  desc: 'Built-in camera or Bluetooth HID scanners (Socket Mobile S700/S800).' },
  { icon: 'archive',        title: 'Cash drawers',      desc: 'Printer-driven over RJ12 — auto-trigger on cash sales.' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Hardware"
      subtitle="Configure peripherals paired to your registers — terminals, printers, scanners, and cash drawers."
    />

    <v-card flat border rounded="lg" class="retail-shell-card pa-6">
      <div class="text-center mb-5">
        <div class="retail-shell-icon mx-auto mb-3">
          <v-icon size="28">printer</v-icon>
        </div>
        <h3 class="text-h6 mb-1">Hardware management coming soon</h3>
        <p class="text-body-2 text-medium-emphasis mb-0 mx-auto" style="max-width: 460px;">
          Hardware pairing lives on the POS device itself today. This panel will surface paired devices, firmware versions, and troubleshooting tools for your fleet.
        </p>
      </div>

      <v-row dense>
        <v-col v-for="cat in categories" :key="cat.title" cols="12" sm="6">
          <div class="retail-feature-tile">
            <div class="retail-feature-tile__icon">
              <v-icon size="18">{{ cat.icon }}</v-icon>
            </div>
            <div>
              <div class="retail-feature-tile__title">{{ cat.title }}</div>
              <div class="retail-feature-tile__desc">{{ cat.desc }}</div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
.retail-shell-card {
  background: var(--surface-1) !important;
  border-color: color-mix(in oklch, var(--ink) 7%, transparent) !important;
  border-radius: var(--r-section) !important;
}

.retail-shell-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent);
  color: var(--cloud-retail-text);
}

.retail-feature-tile {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid color-mix(in oklch, var(--ink) 8%, transparent);
  border-radius: var(--r-section);
  background: var(--surface-1);
  height: 100%;
}

.retail-feature-tile__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-chip);
  background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent);
  color: var(--cloud-retail-text);
  flex-shrink: 0;
}

.retail-feature-tile__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.3;
}

.retail-feature-tile__desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.4;
  margin-top: 2px;
}
</style>
