<script setup lang="ts">
// No legacy equivalent exists for this account (no /live_content_images nav
// entry in the crawl). Treated the same honest way as Surveys.vue rather than
// inventing a feature. Report route `CountdownTimer` (/live_content_images)
// for removal consideration from src/router/index.ts.
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Countdown Timers" subtitle="Add urgency to campaigns with a live countdown" />

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column justify-center">
      <MpEmptyState
        icon="lock"
        title="Not available on this account"
        description="Countdown timers aren't part of your current Marketing setup."
      />
    </v-card>
  </div>
</template>
