<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'

const groups = [
  { icon: 'credit-card', title: 'Payments',       desc: 'Stripe Terminal connection, Tap to Pay, accepted tenders, and split-payment rules.' },
  { icon: 'receipt',     title: 'Receipts',       desc: 'Receipt template, brand logo, default delivery (print / email / SMS).' },
  { icon: 'cloud-off',   title: 'Offline mode',   desc: 'Per-store offline limits, sync cadence, and post-sync reconciliation defaults.' },
  { icon: 'shield',      title: 'Security',       desc: 'Inactivity lock window, PIN policy, manager-override approvals.' },
  { icon: 'tag',         title: 'Tax & rounding', desc: 'Per-region tax tables, rounding rules, surcharging (Phase 2).' },
  { icon: 'flag',        title: 'Market settings',desc: 'Enable Retail per country (US / CA / AU / NZ).' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Retail Settings"
      subtitle="Platform-level configuration for your Retail — payments, receipts, offline behavior, security."
    />

    <v-card flat border rounded="lg" class="retail-shell-card pa-6">
      <div class="text-center mb-5">
        <div class="retail-shell-icon mx-auto mb-3">
          <v-icon size="28">settings</v-icon>
        </div>
        <h3 class="text-h6 mb-1">Retail settings coming soon</h3>
        <p class="text-body-2 text-medium-emphasis mb-0 mx-auto" style="max-width: 460px;">
          The MVP exposes the following configuration surfaces. Tap a tile to preview the planned controls — interactive setup will land in Phase 1.
        </p>
      </div>

      <v-row dense>
        <v-col v-for="g in groups" :key="g.title" cols="12" sm="6" md="4">
          <div class="retail-feature-tile">
            <div class="retail-feature-tile__icon">
              <v-icon size="18">{{ g.icon }}</v-icon>
            </div>
            <div>
              <div class="retail-feature-tile__title">{{ g.title }}</div>
              <div class="retail-feature-tile__desc">{{ g.desc }}</div>
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
