<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useMerchandisingStore } from '@/stores/useMerchandising'

const store = useMerchandisingStore()
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Search Preview"
      :subtitle="`Test search results live for ${store.activeStore.domain}. Coming soon.`"
    />

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex align-center justify-center" min-height="420">
      <MpEmptyState
        icon="search"
        title="Search Preview is coming soon"
        description="You'll be able to test queries against your live index, preview ranking, and tweak relevance from this page."
        action-label="Notify me when ready"
        action-icon="bell"
      />
    </v-card>
  </div>
</template>
