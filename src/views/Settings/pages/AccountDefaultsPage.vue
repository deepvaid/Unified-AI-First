<script setup lang="ts">
import { ref } from 'vue'
import SettingsPageHeader from '@/components/settings/SettingsPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'

const company = ref({
  accountId: '2000290',
  name: 'MMC-MSC-MCC Scooter Village',
  clientName: 'Ross Andrew Paquette',
  industry: 'E-Commerce',
  language: 'English (US)',
  website: 'https://scootervillage.com',
  address1: '123 Commerce St',
  address2: '',
  country: 'United States',
  state: 'New York',
  city: 'New York',
  zip: '10001',
  timezone: 'America/New_York',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
})

const saved = ref(false)

function copyId() {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(company.value.accountId).catch(() => {})
  }
}

function save() { saved.value = true }
function discard() { saved.value = false }
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="Account Defaults"
      subtitle="Basic account details, locale, and contact address used across this workspace."
    />

    <SettingsSection
      title="Account"
      description="Identity, industry, and where customers find you online."
    >
      <div class="settings-grid">
        <div class="settings-field settings-field--full">
          <label class="settings-field__label">Account Name</label>
          <v-text-field
            v-model="company.name"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field">
          <label class="settings-field__label">Account ID</label>
          <v-text-field
            :model-value="company.accountId"
            variant="outlined"
            density="compact"
            readonly
            hide-details
            bg-color="surface-variant"
          >
            <template #append-inner>
              <v-tooltip text="Copy ID" location="top">
                <template #activator="{ props: tipProps }">
                  <v-btn
                    v-bind="tipProps"
                    icon="copy"
                    size="x-small"
                    variant="text"
                    aria-label="Copy account ID"
                    @click="copyId"
                  />
                </template>
              </v-tooltip>
            </template>
          </v-text-field>
        </div>

        <div class="settings-field">
          <label class="settings-field__label">Client / Contact Name</label>
          <v-text-field
            v-model="company.clientName"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field">
          <label class="settings-field__label">Industry</label>
          <v-select
            v-model="company.industry"
            :items="['E-Commerce','SaaS','Retail','Media','Healthcare','Finance','Other']"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field">
          <label class="settings-field__label">Language</label>
          <v-select
            v-model="company.language"
            :items="['English (US)','English (UK)','French','Spanish','German','Portuguese']"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field settings-field--full">
          <label class="settings-field__label">Website URL</label>
          <v-text-field
            v-model="company.website"
            variant="outlined"
            density="compact"
            prepend-inner-icon="globe"
            hide-details
          />
        </div>
      </div>
    </SettingsSection>

    <SettingsSection
      title="Locale"
      description="Defaults for dates, times, and currency formatting across reports and storefront."
    >
      <div class="settings-grid settings-grid--thirds">
        <div class="settings-field">
          <label class="settings-field__label">Timezone</label>
          <v-select
            v-model="company.timezone"
            :items="['America/New_York','America/Chicago','America/Los_Angeles','UTC','Europe/London','Asia/Tokyo']"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field">
          <label class="settings-field__label">Currency</label>
          <v-select
            v-model="company.currency"
            :items="['USD','EUR','GBP','CAD','AUD','JPY']"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field">
          <label class="settings-field__label">Date Format</label>
          <v-select
            v-model="company.dateFormat"
            :items="['MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD']"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>
      </div>
    </SettingsSection>

    <SettingsSection
      title="Address"
      description="Used on invoices, tax documents, and transactional emails."
    >
      <div class="settings-grid">
        <div class="settings-field settings-field--full">
          <label class="settings-field__label">Address Line 1</label>
          <v-text-field
            v-model="company.address1"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field settings-field--full">
          <label class="settings-field__label">Address Line 2 (optional)</label>
          <v-text-field
            v-model="company.address2"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field">
          <label class="settings-field__label">Country</label>
          <v-select
            v-model="company.country"
            :items="['United States','Canada','United Kingdom','Australia','India','Germany']"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field">
          <label class="settings-field__label">State / Province</label>
          <v-text-field
            v-model="company.state"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field">
          <label class="settings-field__label">City</label>
          <v-text-field
            v-model="company.city"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>

        <div class="settings-field">
          <label class="settings-field__label">Zip / Postal Code</label>
          <v-text-field
            v-model="company.zip"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>
      </div>
    </SettingsSection>

    <div class="settings-save-bar">
      <v-btn variant="text" class="text-none" @click="discard">Discard changes</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="save">Save changes</v-btn>
    </div>

    <v-snackbar v-model="saved" :timeout="2400" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon>Account details saved</div>
    </v-snackbar>
  </div>
</template>

