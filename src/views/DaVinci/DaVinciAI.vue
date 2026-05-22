<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="DaVinci AI Settings"
      subtitle="Configure AI-powered features and predictive models"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="save">Save AI Preferences</v-btn>
      </template>
    </MpPageHeader>

    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="flat" border rounded="lg">
          <v-card-text class="pa-5">
            <div class="text-subtitle-1 font-weight-bold mb-4">AI Configuration</div>
            <v-switch color="primary" label="Enable Predictive Send Times" model-value="true" hide-details class="mb-2" />
            <v-switch color="primary" label="Enable Content Recommendations" model-value="true" hide-details class="mb-2" />
            <v-switch color="primary" label="Enable Churn Prediction Modeling" hide-details />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
