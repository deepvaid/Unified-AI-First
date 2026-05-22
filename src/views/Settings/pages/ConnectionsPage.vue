<script setup lang="ts">
import { ref } from 'vue'
import SettingsPageHeader from '@/components/settings/SettingsPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'

const apiKeys = ref([
  { id: 1, label: 'Production Key', user: 'Ross@maropost.com', key: 'mp_live_sk_••••••••••••••••••••••4xyz', created: '2024-01-15', lastUsed: '2026-03-07', status: 'Active' },
  { id: 2, label: 'Dev / Staging',  user: 'Ross@maropost.com', key: 'mp_test_sk_••••••••••••••••••••••1abc', created: '2024-03-01', lastUsed: '2026-02-28', status: 'Active' },
])

const webhooks = ref([
  { id: 1, label: 'Order Fulfilled Hook', url: 'https://api.scootervillage.com/webhooks/order',   events: ['Order Completed','Fulfillment Updated'], status: 'Active' },
  { id: 2, label: 'New Contact Hook',     url: 'https://api.scootervillage.com/webhooks/contact', events: ['Contact Created'],                       status: 'Active' },
])

const addKeyDrawer = ref(false)
const newKeyLabel = ref('')
const newKeyEnv = ref<'production' | 'test'>('production')
const newKeyGenerated = ref<string | null>(null)
const generatedSnack = ref(false)

function generateKey() {
  const prefix = newKeyEnv.value === 'production' ? 'mp_live_sk_' : 'mp_test_sk_'
  const random = Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join('')
  newKeyGenerated.value = `${prefix}${random}`
  apiKeys.value.push({
    id: Date.now(),
    label: newKeyLabel.value || 'Untitled Key',
    user: 'Ross@maropost.com',
    key: `${prefix}••••••••••••••••••••••${random.slice(-4)}`,
    created: new Date().toISOString().slice(0, 10),
    lastUsed: '—',
    status: 'Active',
  })
  generatedSnack.value = true
  addKeyDrawer.value = false
  newKeyLabel.value = ''
  newKeyEnv.value = 'production'
  newKeyGenerated.value = null
}
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
          <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="addKeyDrawer = true">
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

  <!-- Generate Key Drawer -->
  <MpFormDrawer v-model="addKeyDrawer" title="Generate API Key" subtitle="Create a new key for server-to-server access.">
    <v-row dense class="mt-1">
      <v-col cols="12">
        <v-text-field
          v-model="newKeyLabel"
          label="Key label"
          placeholder="e.g. Shopify Integration"
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </v-col>
      <v-col cols="12" class="mt-4">
        <div class="text-body-2 font-weight-medium mb-2">Environment</div>
        <v-btn-toggle v-model="newKeyEnv" mandatory density="compact" rounded="lg" class="w-100">
          <v-btn value="production" class="text-none flex-grow-1">Production</v-btn>
          <v-btn value="test" class="text-none flex-grow-1">Test / Staging</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
    <template #footer>
      <v-spacer />
      <v-btn variant="text" class="text-none" @click="addKeyDrawer = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!newKeyLabel.trim()" @click="generateKey">Generate Key</v-btn>
    </template>
  </MpFormDrawer>

  <v-snackbar v-model="generatedSnack" color="success" timeout="3000">API key generated successfully.</v-snackbar>
</template>

<style scoped lang="scss">

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
  background: color-mix(in oklch, var(--surface-2) 34%, transparent);
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

@media (max-width: 640px) {
  .connection-card__header {
    flex-direction: column;
  }

  .connection-card__actions {
    align-self: stretch;
    flex-wrap: wrap;
  }
}
</style>
