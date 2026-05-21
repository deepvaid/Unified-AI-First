<script setup lang="ts">
import SettingsPageHeader from '@/components/settings/SettingsPageHeader.vue'

const integrations = [
  { name: 'Shopify',          icon: 'shopping-bag', color: 'success',   connected: true,  desc: 'Sync orders, products & customers' },
  { name: 'WooCommerce',      icon: 'code-2',        color: 'purple',    connected: false, desc: 'Connect your WooCommerce store' },
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
    <SettingsPageHeader
      title="Integrations"
      subtitle="Connect Maropost to the tools your team already uses."
    />

    <div class="integration-grid">
      <div v-for="intg in integrations" :key="intg.name" class="integration-card">
        <div class="integration-card__header">
          <v-icon :color="intg.color" size="28">{{ intg.icon }}</v-icon>
          <v-chip :color="intg.connected ? 'success' : 'grey'" size="x-small" variant="flat">
            {{ intg.connected ? 'Connected' : 'Not Connected' }}
          </v-chip>
        </div>
        <div class="integration-card__name">{{ intg.name }}</div>
        <div class="integration-card__desc">{{ intg.desc }}</div>
        <v-btn
          :color="intg.connected ? 'error' : 'primary'"
          :variant="intg.connected ? 'outlined' : 'flat'"
          size="small"
          block
          class="text-none integration-card__cta"
        >
          {{ intg.connected ? 'Disconnect' : 'Connect' }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  max-width: 880px;
  padding: 24px 32px 96px 0;
}

.integration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.integration-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--surface-1);
}

.integration-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
}

.integration-card__name {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 4px;
}

.integration-card__desc {
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.4;
  flex: 1;
  margin-bottom: 12px;
}

.integration-card__cta {
  margin-top: auto;
}
</style>
