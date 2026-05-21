<script setup lang="ts">
import { ref } from 'vue'
import SettingsPageHeader from '@/components/settings/SettingsPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'

interface NotifPref { key: string; label: string; desc: string; value: boolean }

const prefs = ref<NotifPref[]>([
  { key: 'emailDigest',    label: 'Daily Email Digest',        desc: 'Receive a daily summary of account activity',           value: true },
  { key: 'campaignSent',   label: 'Campaign Sent',             desc: 'Confirm when a campaign has been successfully sent',    value: true },
  { key: 'bounceAlerts',   label: 'Bounce Rate Alerts',        desc: 'Alert when bounce rate exceeds 5%',                     value: true },
  { key: 'newTickets',     label: 'New Support Tickets',       desc: 'Notify when a customer opens a new ticket',             value: true },
  { key: 'weeklyReport',   label: 'Weekly Performance Report', desc: 'Receive weekly analytics summary on Monday',            value: true },
  { key: 'productUpdates', label: 'Product Updates',           desc: 'Be notified about new Maropost features',               value: false },
])

const saved = ref(false)
function save() { saved.value = true }
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="Notifications"
      subtitle="Choose which alerts and digests you want to receive by email."
    />

    <SettingsSection title="Email Notifications">
      <ul class="notif-list">
        <li v-for="p in prefs" :key="p.key" class="notif-row">
          <div class="notif-row__copy">
            <div class="notif-row__title">{{ p.label }}</div>
            <div class="notif-row__sub">{{ p.desc }}</div>
          </div>
          <v-switch v-model="p.value" color="primary" hide-details density="compact" inset />
        </li>
      </ul>
    </SettingsSection>

    <div class="settings-save-bar">
      <v-btn color="primary" variant="flat" class="text-none" @click="save">Save preferences</v-btn>
    </div>

    <v-snackbar v-model="saved" :timeout="2400" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon>Preferences saved</div>
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  max-width: 880px;
  padding: 24px 32px 96px 0;
}

.notif-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  overflow: hidden;
}

.notif-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
}

.notif-row + .notif-row {
  border-top: 1px solid var(--hairline);
}

.notif-row__copy {
  flex: 1;
  min-width: 0;
}

.notif-row__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
}

.notif-row__sub {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}

.settings-save-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 0 0;
  margin-top: 24px;
  background: linear-gradient(180deg, transparent 0, var(--surface-1) 24px);
}
</style>
