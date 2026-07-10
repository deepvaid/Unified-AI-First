<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useMerchandisingStore } from '@/stores/useMerchandising'

const store = useMerchandisingStore()
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Content"
      :subtitle="`BETA — surface curated content in search results for ${store.activeStore.domain}`"
    />

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column">
      <div class="pa-5">
        <div class="d-flex align-center gap-2 mb-2">
          <span class="text-subtitle-1 font-weight-bold">Content sources</span>
          <v-chip size="x-small" variant="tonal" color="primary" class="font-weight-medium">BETA</v-chip>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Content sources let search results include curated content — like blog posts, lookbooks and
          help articles — alongside products, so shoppers find answers as well as items to buy.
        </p>
      </div>
      <v-divider />
      <div class="flex-grow-1 d-flex align-center justify-center">
        <MpEmptyState
          icon="file-text"
          title="No content sources connected"
          description="Once a content source is connected for this channel, its items become searchable here."
        />
      </div>
    </v-card>
  </div>
</template>
