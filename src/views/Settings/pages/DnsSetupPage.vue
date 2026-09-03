<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpAlert from '@/components/MpAlert.vue'
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
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Add Domain</v-btn>
      </template>

      <!-- Divided rows inside the section card — a hairline between rows is the only
           separator, so a domain is not a second bordered box inside a bordered card. -->
      <div class="domain-list">
        <div v-for="d in sendingDomains" :key="d.domain" class="domain-row">
          <div class="domain-row__header">
            <div class="domain-row__title-wrap">
              <v-icon size="16" color="primary">mail</v-icon>
              <span class="domain-row__title">{{ d.domain }}</span>
              <v-chip v-if="d.isDefault" size="x-small" variant="tonal" color="primary">Default</v-chip>
            </div>
            <div class="domain-row__actions">
              <MpStatusChip :status="d.status" type="general" size="sm" />
              <v-tooltip text="View DNS records" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn v-bind="tipProps" icon="server" variant="text" size="small" aria-label="View DNS records" />
                </template>
              </v-tooltip>
              <v-tooltip text="Remove domain" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn v-bind="tipProps" icon="trash-2" variant="text" size="small" color="error" aria-label="Remove domain" />
                </template>
              </v-tooltip>
            </div>
          </div>
          <dl class="domain-row__checks">
            <div v-for="(val, key) in { DKIM: d.dkim, SPF: d.spf, DMARC: d.dmarc }" :key="key" class="domain-check">
              <dt class="domain-check__label">{{ key }}</dt>
              <dd class="domain-check__value"><MpStatusChip :status="val" type="general" size="sm" /></dd>
            </div>
          </dl>
        </div>
      </div>
      <MpAlert tone="info" live="off" class="mt-4">
        <strong>DNS propagation</strong> can take up to 48 hours after adding records to your DNS provider.
      </MpAlert>
    </SettingsSection>

    <SettingsSection title="Link Tracking Domains" description="Custom subdomains for click and open tracking.">
      <template #actions>
        <v-btn variant="outlined" prepend-icon="plus" class="text-none">Add Tracking Domain</v-btn>
      </template>

      <div class="domain-list">
        <div v-for="d in trackingDomains" :key="d.domain" class="domain-row">
          <div class="domain-row__header">
            <div class="domain-row__title-wrap">
              <v-icon size="16" color="secondary">link</v-icon>
              <span class="domain-row__title">{{ d.domain }}</span>
              <v-chip v-if="d.isDefault" size="x-small" variant="tonal" color="primary">Default</v-chip>
            </div>
            <div class="domain-row__actions">
              <MpStatusChip :status="d.ssl ? 'SSL Active' : 'SSL Pending'" type="general" size="sm" />
              <MpStatusChip :status="d.status" type="general" size="sm" />
              <v-tooltip text="Remove" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn v-bind="tipProps" icon="trash-2" variant="text" size="small" color="error" aria-label="Remove" />
                </template>
              </v-tooltip>
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  </div>
</template>

<style scoped lang="scss">
.domain-row {
  padding-block: var(--mp-space-16);
}

.domain-row + .domain-row {
  border-top: 1px solid var(--border-subtle);
}

.domain-row__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
}

.domain-row__title-wrap {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
  min-width: 0;
  flex-wrap: wrap;
}

.domain-row__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.domain-row__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.domain-row__checks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-24);
  margin: var(--mp-space-12) 0 0;
}

/* Key/value pairs: sentence-case muted 12px label over the value (recipe C2). */
.domain-check__label {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  margin-bottom: var(--mp-space-4);
}

.domain-check__value {
  margin: 0;
}

@media (max-width: $mp-layout-breakpointCompact) {
  .domain-row__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .domain-row__actions {
    justify-content: flex-start;
  }
}
</style>
