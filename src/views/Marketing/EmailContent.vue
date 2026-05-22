<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'

const items = [
  { name: 'Newsletter Template 2026', type: 'HTML Builder', lastUpdated: '2 hours ago' },
  { name: 'Welcome Email V2', type: 'Drag & Drop', lastUpdated: 'Yesterday' },
  { name: 'Holiday Promo Master', type: 'Drag & Drop', lastUpdated: '3 days ago' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Email Content"
      :subtitle="`${items.length} templates`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Create Content</v-btn>
      </template>
    </MpPageHeader>

    <v-row>
      <v-col cols="12" md="4" v-for="item in items" :key="item.name">
        <v-card variant="flat" border rounded="lg" class="h-100 d-flex flex-column">
          <div class="bg-surface-variant d-flex justify-center align-center rounded-t-xl" style="height: 150px;">
            <v-icon size="48" color="medium-emphasis">mail</v-icon>
          </div>
          <v-card-text class="pa-4 flex-grow-1">
            <div class="text-subtitle-1 font-weight-bold mb-1">{{ item.name }}</div>
            <div class="text-body-2 text-medium-emphasis mb-1">{{ item.type }}</div>
            <div class="text-caption text-medium-emphasis">Last updated: {{ item.lastUpdated }}</div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-btn variant="flat" size="small" class="text-none" color="surface">Edit</v-btn>
            <v-btn variant="text" size="small" class="text-none">Clone</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
