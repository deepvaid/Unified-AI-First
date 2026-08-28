<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'

const sendingDomains = ref([
  { domain: 'scootervillage.com',     status: 'Verified', dkim: 'Pass', spf: 'Pass',    dmarc: 'Pass',    isDefault: true },
  { domain: 'mail.scootervillage.io', status: 'Pending',  dkim: 'Fail', spf: 'Pending', dmarc: 'Pending', isDefault: false },
])

const trackingDomains = ref([
  { domain: 'track.scootervillage.com', status: 'Verified', ssl: true,  isDefault: true },
  { domain: 'click.scootervillage.io',  status: 'Pending',  ssl: false, isDefault: false },
])

</script>

<template>
  <div class="settings-page">
    <MpPageHeader :level="2" density="compact"
      title="DNS Setup"
      subtitle="Verify sending domains and configure custom link-tracking subdomains."
    />

    <SettingsSection title="Sending Domains" description="DKIM, SPF, and DMARC verification for the domains you send from.">
      <div class="section-actions">
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Add Domain</v-btn>
      </div>
      <div class="stack">
        <div v-for="d in sendingDomains" :key="d.domain" class="domain-card">
          <div class="domain-card__header">
            <div class="domain-card__title-wrap">
              <v-icon size="18" color="primary">mail</v-icon>
              <span class="domain-card__title">{{ d.domain }}</span>
              <v-chip v-if="d.isDefault" size="x-small" variant="tonal" color="primary">Default</v-chip>
            </div>
            <div class="domain-card__actions">
              <MpStatusChip :status="d.status" type="general" size="sm" />
              <v-btn icon="server" variant="text" size="small" aria-label="View DNS records" />
              <v-btn icon="trash-2" variant="text" size="small" color="error" aria-label="Remove domain" />
            </div>
          </div>
          <div class="domain-card__checks">
            <div v-for="(val, key) in { DKIM: d.dkim, SPF: d.spf, DMARC: d.dmarc }" :key="key" class="domain-check">
              <div class="domain-check__label">{{ key }}</div>
              <MpStatusChip :status="val" type="general" size="sm" />
            </div>
          </div>
        </div>
        <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
          <strong>DNS propagation</strong> can take up to 48 hours after adding records to your DNS provider.
        </v-alert>
      </div>
    </SettingsSection>

    <SettingsSection title="Link Tracking Domains" description="Custom subdomains for click and open tracking.">
      <div class="section-actions">
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Add Tracking Domain</v-btn>
      </div>
      <div class="stack">
        <div v-for="d in trackingDomains" :key="d.domain" class="domain-card">
          <div class="domain-card__header">
            <div class="domain-card__title-wrap">
              <v-icon size="18" color="secondary">link</v-icon>
              <span class="domain-card__title">{{ d.domain }}</span>
              <v-chip v-if="d.isDefault" size="x-small" variant="tonal" color="primary">Default</v-chip>
            </div>
            <div class="domain-card__actions">
              <MpStatusChip :status="d.ssl ? 'SSL Active' : 'SSL Pending'" type="general" size="sm" />
              <MpStatusChip :status="d.status" type="general" size="sm" />
              <v-btn icon="trash-2" variant="text" size="small" color="error" aria-label="Remove" />
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  </div>
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

.domain-card {
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: color-mix(in oklch, var(--surface-secondary) 34%, transparent);
}

.domain-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.domain-card__title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.domain-card__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.domain-card__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.domain-card__checks {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 14px;
}

.domain-check__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin-bottom: 4px;
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .domain-card__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .domain-card__actions {
    justify-content: flex-start;
  }
}
</style>
