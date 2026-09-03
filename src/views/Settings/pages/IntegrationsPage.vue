<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'

const integrations = [
  { name: 'Shopify',          icon: 'shopping-bag', color: 'success',   connected: true,  desc: 'Sync orders, products & customers' },
  { name: 'WooCommerce',      icon: 'code-2',        color: 'secondary', connected: false, desc: 'Connect your WooCommerce store' },
  { name: 'Stripe',           icon: 'credit-card',  color: 'primary',   connected: true,  desc: 'Payment and subscription data sync' },
  { name: 'Zapier',           icon: 'zap',          color: 'warning',   connected: false, desc: '5000+ app integrations' },
  { name: 'Google Analytics', icon: 'globe',        color: 'error',     connected: true,  desc: 'Campaign performance tracking' },
  { name: 'Facebook Pixel',   icon: 'share-2',      color: 'info',      connected: false, desc: 'Ad retargeting audience sync' },
  { name: 'HubSpot CRM',      icon: 'git-merge',    color: 'error',     connected: false, desc: 'Two-way CRM sync' },
  { name: 'Salesforce',       icon: 'cloud',        color: 'primary',   connected: false, desc: 'Enterprise CRM integration' },
  { name: 'Neto',             icon: 'store',        color: 'success',   connected: false, desc: 'Neto e-commerce platform sync' },
]
</script>

<template>
  <div class="settings-page">
    <MpPageHeader :level="2" density="compact"
      title="Integrations"
      subtitle="Connect Maropost to the tools your team already uses."
    />

    <SettingsSection title="Available Integrations" description="Connect and manage commerce, analytics, and automation tools.">
      <div class="integration-grid">
        <div v-for="intg in integrations" :key="intg.name" class="integration-card">
          <div class="integration-card__header">
            <v-icon :color="intg.color" size="20">{{ intg.icon }}</v-icon>
            <MpStatusChip :status="intg.connected ? 'Connected' : 'Disconnected'" type="connection" size="sm" />
          </div>
          <div class="integration-card__name">{{ intg.name }}</div>
          <div class="integration-card__desc">{{ intg.desc }}</div>
          <!-- Nine equal tiles: none is the page's primary action, so every tile
               action is outlined; the destructive one keeps the error colour. -->
          <v-btn
            :color="intg.connected ? 'error' : undefined"
            variant="outlined"
            size="small"
            block
            class="text-none integration-card__cta"
          >
            {{ intg.connected ? 'Disconnect' : 'Connect' }}
          </v-btn>
        </div>
      </div>
    </SettingsSection>
  </div>
</template>

<style scoped lang="scss">
.integration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--mp-component-card-gap);
}

/* Nested tile: hairline on the plain surface (no tint — a border or a fill, never both). */
.integration-card {
  display: flex;
  flex-direction: column;
  padding: var(--mp-space-16);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: var(--surface-primary);
  color: var(--on-surface);
}

.integration-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--mp-space-8);
}

.integration-card__name {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--mp-space-4);
}

.integration-card__desc {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  line-height: var(--mp-lineHeight-compact);
  flex: 1;
  margin-bottom: var(--mp-space-12);
}

.integration-card__cta {
  margin-top: auto;
}
</style>
