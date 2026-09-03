<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()

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
const newKeyEnv = ref<string | null>('production')
const envItems = [
  { value: 'production', label: 'Production' },
  { value: 'test', label: 'Test / Staging' },
]

function generateKey() {
  const prefix = newKeyEnv.value === 'production' ? 'mp_live_sk_' : 'mp_test_sk_'
  const random = Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join('')
  apiKeys.value.push({
    id: Date.now(),
    label: newKeyLabel.value || 'Untitled Key',
    user: 'Ross@maropost.com',
    key: `${prefix}••••••••••••••••••••••${random.slice(-4)}`,
    created: new Date().toISOString().slice(0, 10),
    lastUsed: '—',
    status: 'Active',
  })
  toast.success('API key generated successfully.')
  addKeyDrawer.value = false
  newKeyLabel.value = ''
  newKeyEnv.value = 'production'
}
</script>

<template>
  <div class="settings-page">
    <MpPageHeader :level="2" density="compact"
      title="Connections"
      subtitle="REST API keys and HTTP Post URLs used by integrations and custom apps."
    />

    <SettingsSection title="API Keys" description="Generate keys for server-to-server access. Keep them secret.">
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="addKeyDrawer = true">
          Generate Key
        </v-btn>
      </template>

      <!-- Divided rows inside the section card — a hairline between rows is the only
           separator, so a key is not a second bordered box inside a bordered card. -->
      <div class="connection-list">
        <div v-for="k in apiKeys" :key="k.id" class="connection-row">
          <div class="connection-row__header">
            <div>
              <div class="connection-row__title">{{ k.label }}</div>
              <div class="connection-row__sub">User: {{ k.user }}</div>
            </div>
            <div class="connection-row__actions">
              <MpStatusChip :status="k.status" type="general" size="sm" />
              <v-tooltip text="Copy key" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn v-bind="tipProps" icon="copy" variant="text" size="small" aria-label="Copy key" />
                </template>
              </v-tooltip>
              <v-tooltip text="Revoke key" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn v-bind="tipProps" icon="trash-2" variant="text" size="small" color="error" aria-label="Revoke key" />
                </template>
              </v-tooltip>
            </div>
          </div>
          <code class="connection-row__value">{{ k.key }}</code>
          <div class="connection-row__meta">Created {{ k.created }} · Last used {{ k.lastUsed }}</div>
        </div>
      </div>
    </SettingsSection>

    <SettingsSection title="HTTP Post URLs" description="Receive real-time event notifications via webhook callbacks.">
      <template #actions>
        <v-btn variant="outlined" prepend-icon="plus" class="text-none">Add Webhook</v-btn>
      </template>

      <div class="connection-list">
        <div v-for="w in webhooks" :key="w.id" class="connection-row">
          <div class="connection-row__header">
            <div class="connection-row__title">{{ w.label }}</div>
            <div class="connection-row__actions">
              <MpStatusChip :status="w.status" type="general" size="sm" />
              <v-tooltip text="Test endpoint" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn v-bind="tipProps" icon="circle-play" variant="text" size="small" aria-label="Test endpoint" />
                </template>
              </v-tooltip>
              <v-tooltip text="Edit" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn v-bind="tipProps" icon="pencil" variant="text" size="small" aria-label="Edit" />
                </template>
              </v-tooltip>
              <v-tooltip text="Delete" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn v-bind="tipProps" icon="trash-2" variant="text" size="small" color="error" aria-label="Delete" />
                </template>
              </v-tooltip>
            </div>
          </div>
          <code class="connection-row__value">{{ w.url }}</code>
          <div class="connection-row__chips">
            <v-chip v-for="ev in w.events" :key="ev" size="x-small" variant="tonal" color="secondary">{{ ev }}</v-chip>
          </div>
        </div>
      </div>
    </SettingsSection>
  </div>

  <!-- Generate Key Drawer -->
  <MpFormDrawer v-model="addKeyDrawer" title="Generate API Key" subtitle="Create a new key for server-to-server access.">
    <MpFormGrid>
      <v-text-field
        v-model="newKeyLabel"
        label="Key label *"
        placeholder="e.g. Shopify Integration"
      />
      <MpFormField label="Environment">
        <MpSegmentedControl v-model="newKeyEnv" :items="envItems" ariaLabel="Environment" />
      </MpFormField>
    </MpFormGrid>
    <template #footer>
      <v-spacer />
      <v-btn variant="text" class="text-none" @click="addKeyDrawer = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!newKeyLabel.trim()" @click="generateKey">Generate Key</v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped lang="scss">
.connection-row {
  padding-block: var(--mp-space-16);
}

.connection-row + .connection-row {
  border-top: 1px solid var(--border-subtle);
}

.connection-row__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-space-12);
  margin-bottom: var(--mp-space-8);
}

.connection-row__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.connection-row__sub {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  margin-top: var(--mp-space-2);
}

.connection-row__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  flex-shrink: 0;
}

.connection-row__value {
  display: block;
  padding: var(--mp-space-8) var(--mp-space-12);
  border-radius: var(--mp-component-chip-radius);
  background: var(--surface-secondary);
  color: var(--on-surface);
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-12);
  word-break: break-all;
}

.connection-row__meta {
  margin-top: var(--mp-space-8);
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.connection-row__chips {
  display: flex;
  gap: var(--mp-space-6);
  flex-wrap: wrap;
  margin-top: var(--mp-space-8);
}

@media (max-width: $mp-layout-breakpointCompact) {
  .connection-row__header {
    flex-direction: column;
  }

  .connection-row__actions {
    align-self: stretch;
    flex-wrap: wrap;
  }
}
</style>
