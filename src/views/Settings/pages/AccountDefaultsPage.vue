<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()

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

function copyId() {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(company.value.accountId).catch(() => {})
  }
}

function save() { toast.success('Account details saved') }
function discard() {}
</script>

<template>
  <div class="settings-page">
    <MpPageHeader :level="2" density="compact"
      title="Account Defaults"
      subtitle="Basic account details, locale, and contact address used across this workspace."
    />

    <SettingsSection
      title="Account"
      description="Identity, industry, and where customers find you online."
    >
      <MpFormGrid :cols="2">
        <v-text-field
          label="Account Name"
          v-model="company.name"
          class="mp-form-grid__full"
        />

        <v-text-field
          label="Account ID"
          :model-value="company.accountId"
          readonly
          class="mp-field-readonly"
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

        <v-text-field
          label="Client / Contact Name"
          v-model="company.clientName"
        />

        <v-select
          label="Industry"
          v-model="company.industry"
          :items="['E-Commerce','SaaS','Retail','Media','Healthcare','Finance','Other']"
        />

        <v-select
          label="Language"
          v-model="company.language"
          :items="['English (US)','English (UK)','French','Spanish','German','Portuguese']"
        />

        <v-text-field
          label="Website URL"
          v-model="company.website"
          class="mp-form-grid__full"
          prepend-inner-icon="globe"
        />
      </MpFormGrid>
    </SettingsSection>

    <SettingsSection
      title="Locale"
      description="Defaults for dates, times, and currency formatting across reports and storefront."
    >
      <MpFormGrid :cols="2">
        <v-select
          label="Timezone"
          v-model="company.timezone"
          :items="['America/New_York','America/Chicago','America/Los_Angeles','UTC','Europe/London','Asia/Tokyo']"
          class="mp-form-grid__full"
        />

        <v-select
          label="Currency"
          v-model="company.currency"
          :items="['USD','EUR','GBP','CAD','AUD','JPY']"
        />

        <v-select
          label="Date Format"
          v-model="company.dateFormat"
          :items="['MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD']"
        />
      </MpFormGrid>
    </SettingsSection>

    <SettingsSection
      title="Address"
      description="Used on invoices, tax documents, and transactional emails."
    >
      <MpFormGrid :cols="2">
        <v-text-field
          label="Address Line 1"
          v-model="company.address1"
          class="mp-form-grid__full"
        />

        <v-text-field
          label="Address Line 2 (optional)"
          v-model="company.address2"
          class="mp-form-grid__full"
        />

        <v-select
          label="Country"
          v-model="company.country"
          :items="['United States','Canada','United Kingdom','Australia','India','Germany']"
        />

        <v-text-field
          label="State / Province"
          v-model="company.state"
        />

        <v-text-field
          label="City"
          v-model="company.city"
        />

        <v-text-field
          label="Zip / Postal Code"
          v-model="company.zip"
        />
      </MpFormGrid>
    </SettingsSection>

    <div class="settings-save-bar">
      <v-btn variant="text" class="text-none" @click="discard">Discard changes</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="save">Save changes</v-btn>
    </div>
  </div>
</template>

