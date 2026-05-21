<script setup lang="ts">
import { ref } from 'vue'
import SettingsPageHeader from '@/components/settings/SettingsPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'

const apiKeys = ref([
  { id: 1, label: 'Production Key', user: 'Ross@maropost.com', key: 'mp_live_sk_••••••••••••••••••••••4xyz', created: '2024-01-15', lastUsed: '2026-03-07', status: 'Active' },
  { id: 2, label: 'Dev / Staging',  user: 'Ross@maropost.com', key: 'mp_test_sk_••••••••••••••••••••••1abc', created: '2024-03-01', lastUsed: '2026-02-28', status: 'Active' },
])

const webhooks = ref([
  { id: 1, label: 'Order Fulfilled Hook', url: 'https://api.scootervillage.com/webhooks/order',   events: ['Order Completed','Fulfillment Updated'], status: 'Active' },
  { id: 2, label: 'New Contact Hook',     url: 'https://api.scootervillage.com/webhooks/contact', events: ['Contact Created'],                       status: 'Active' },
])

const addKeyDialog = ref(false)
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="Connections"
      subtitle="REST API keys and HTTP Post URLs used by integrations and custom apps."
    />

    <SettingsSection title="API Keys" description="Generate keys for server-to-server access. Keep them secret.">
      <template v-slot:default>
        <div class="section-actions">
          <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="addKeyDialog = true">
            Generate Key
          </v-btn>
        </div>

        <div class="stack">
          <div v-for="k in apiKeys" :key="k.id" class="connection-card">
            <div class="connection-card__header">
              <div>
                <div class="connection-card__title">{{ k.label }}</div>
                <div class="connection-card__sub">User: {{ k.user }}</div>
              </div>
              <div class="connection-card__actions">
                <v-chip color="success" size="x-small" variant="flat">{{ k.status }}</v-chip>
                <v-btn icon="copy" variant="text" size="small" color="primary" aria-label="Copy key" />
                <v-btn icon="trash-2" variant="text" size="small" color="error" aria-label="Revoke key" />
              </div>
            </div>
            <code class="connection-card__value">{{ k.key }}</code>
            <div class="connection-card__meta">Created {{ k.created }} · Last used {{ k.lastUsed }}</div>
          </div>
        </div>
      </template>
    </SettingsSection>

    <SettingsSection title="HTTP Post URLs" description="Receive real-time event notifications via webhook callbacks.">
      <div class="section-actions">
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Add Webhook</v-btn>
      </div>

      <div class="stack">
        <div v-for="w in webhooks" :key="w.id" class="connection-card">
          <div class="connection-card__header">
            <div class="connection-card__title">{{ w.label }}</div>
            <div class="connection-card__actions">
              <v-chip color="success" size="x-small" variant="flat">{{ w.status }}</v-chip>
              <v-btn icon="circle-play" variant="text" size="small" color="primary" aria-label="Test endpoint" />
              <v-btn icon="pencil" variant="text" size="small" aria-label="Edit" />
              <v-btn icon="trash-2" variant="text" size="small" color="error" aria-label="Delete" />
            </div>
          </div>
          <code class="connection-card__value">{{ w.url }}</code>
          <div class="connection-card__chips">
            <v-chip v-for="ev in w.events" :key="ev" size="x-small" variant="tonal" color="secondary">{{ ev }}</v-chip>
          </div>
        </div>
      </div>
    </SettingsSection>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  max-width: 880px;
  padding: 24px 32px 96px 0;
}

.section-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.connection-card {
  padding: 14px 16px;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: var(--surface-1);
}

.connection-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.connection-card__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.connection-card__sub {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

.connection-card__actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.connection-card__value {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--surface-2);
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 12px;
  word-break: break-all;
}

.connection-card__meta {
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}

.connection-card__chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}
</style>
