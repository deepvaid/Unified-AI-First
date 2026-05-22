<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Custom Reports"
      subtitle="Build and save custom analytics reports"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Create Report</v-btn>
      </template>
    </MpPageHeader>

    <v-row>
      <v-col cols="12" md="4" v-for="i in 3" :key="i">
        <v-card variant="flat" border rounded="lg">
          <v-card-text class="pa-5">
            <div class="text-subtitle-1 font-weight-bold mb-1">Saved Custom Report {{ i }}</div>
            <p class="text-medium-emphasis text-body-2 mb-4">Last run: 2 days ago</p>
            <v-btn variant="flat" block class="text-none" color="surface">Run Report</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
