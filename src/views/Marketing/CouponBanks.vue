<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'

const banks = [
  { name: 'Spring Sale 20% Off', codesAvailable: 15400, totalCodes: 20000, expires: '2026-05-01' },
  { name: 'VIP Free Shipping', codesAvailable: 450, totalCodes: 500, expires: '2026-12-31' },
  { name: 'Welcome 10% Off', codesAvailable: 85200, totalCodes: 100000, expires: 'Never' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Coupon Banks"
      :subtitle="`${banks.length} coupon banks`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="upload" class="text-none" color="surface">Upload CSV</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">New Bank</v-btn>
      </template>
    </MpPageHeader>

    <v-row>
      <v-col cols="12" md="4" v-for="bank in banks" :key="bank.name">
        <v-card variant="flat" border rounded="lg">
          <v-card-text class="pa-5">
            <div class="text-subtitle-1 font-weight-bold mb-3">{{ bank.name }}</div>
            <v-progress-linear
              :model-value="(bank.codesAvailable / bank.totalCodes) * 100"
              color="primary"
              height="8"
              rounded
              class="mb-2"
            />
            <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-3">
              <span>{{ bank.codesAvailable.toLocaleString() }} available</span>
              <span>{{ bank.totalCodes.toLocaleString() }} total</span>
            </div>
            <div class="text-body-2 text-medium-emphasis">Expires: {{ bank.expires }}</div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-btn variant="flat" size="small" class="text-none" prepend-icon="download" color="surface">Download Codes</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
