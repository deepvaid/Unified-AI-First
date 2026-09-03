<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpListRow from '@/components/MpListRow.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import { useToast } from '@/composables/useToast'

interface NotifPref { key: string; label: string; desc: string; value: boolean }

const prefs = ref<NotifPref[]>([
  { key: 'emailDigest',    label: 'Daily Email Digest',        desc: 'Receive a daily summary of account activity',           value: true },
  { key: 'campaignSent',   label: 'Campaign Sent',             desc: 'Confirm when a campaign has been successfully sent',    value: true },
  { key: 'bounceAlerts',   label: 'Bounce Rate Alerts',        desc: 'Alert when bounce rate exceeds 5%',                     value: true },
  { key: 'newTickets',     label: 'New Support Tickets',       desc: 'Notify when a customer opens a new ticket',             value: true },
  { key: 'weeklyReport',   label: 'Weekly Performance Report', desc: 'Receive weekly analytics summary on Monday',            value: true },
  { key: 'productUpdates', label: 'Product Updates',           desc: 'Be notified about new Maropost features',               value: false },
])

const toast = useToast()
function save() { toast.success('Preferences saved') }
</script>

<template>
  <div class="settings-page">
    <MpPageHeader :level="2" density="compact"
      title="Notifications"
      subtitle="Choose which alerts and digests you want to receive by email."
    />

    <SettingsSection title="Email Notifications">
      <!-- Divided MpListRows inside the section card: the hairline between rows is
           the only separator, so the list is not a second bordered box in a card. -->
      <div class="notif-list">
        <MpListRow v-for="p in prefs" :key="p.key" variant="divided">
          <span class="notif-row__title">{{ p.label }}</span>
          <span class="notif-row__sub">{{ p.desc }}</span>
          <template #trailing>
            <!-- `hide-details` is deliberate: each switch sits in a list row that
                 already carries its own title and description. -->
            <v-switch
              v-model="p.value"
              hide-details
              inset
              :aria-label="`Toggle ${p.label}`"
            />
          </template>
        </MpListRow>
      </div>
    </SettingsSection>

    <div class="settings-save-bar">
      <v-btn color="primary" variant="flat" class="text-none" @click="save">Save preferences</v-btn>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notif-row__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.notif-row__sub {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  margin-top: var(--mp-space-2);
}
</style>
