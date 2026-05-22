<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Preference Pages"
      subtitle="Manage subscriber preference and unsubscribe pages"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">New Preference Page</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg">
      <v-card-text class="pa-5">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-subtitle-1 font-weight-bold mb-1">Default Subscription Center</div>
            <div class="text-body-2 text-medium-emphasis">https://pref.example.com/default</div>
          </div>
          <div class="d-flex align-center gap-3">
            <v-chip color="primary" size="small">Active & Default</v-chip>
            <v-btn variant="flat" class="text-none" size="small" color="surface">Edit Design</v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>
