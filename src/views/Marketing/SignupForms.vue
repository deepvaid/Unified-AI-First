<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Signup Forms (Legacy)"
      subtitle="Legacy signup form management"
    />

    <v-alert type="info" variant="tonal" rounded="xl">
      This is a legacy feature. We recommend using Acquisition Forms for new projects.
    </v-alert>

    <v-card variant="flat" border rounded="lg">
      <v-card-text class="text-center py-10">
        <v-icon size="64" color="medium-emphasis" class="mb-4">chevron-down</v-icon>
        <p class="text-medium-emphasis">No legacy signup forms found.</p>
      </v-card-text>
    </v-card>
  </div>
</template>
