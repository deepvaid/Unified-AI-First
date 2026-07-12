<script setup lang="ts">
// Legacy: this account's plan does not include Surveys — /surveys renders an
// upsell page, not a working feature. Mirrored here as an honest empty state
// (no dead create button) rather than a fake list of survey data.
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Surveys" subtitle="Collect feedback and structured responses from your audience" />

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column justify-center">
      <MpEmptyState
        icon="sparkles"
        title="Not included in your plan"
        description="Surveys is part of Marketing Cloud. Upgrade your plan to build and send surveys to your audience."
        class="py-10"
      />
    </v-card>
  </div>
</template>
