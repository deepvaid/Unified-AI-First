<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useMerchandisingStore } from '@/stores/useMerchandising'

const store = useMerchandisingStore()
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Default Merchandising"
      :subtitle="`Site-wide merchandising rules for ${store.activeStore.domain}.`"
    />

    <v-card flat border rounded="lg" class="flex-grow-1 d-flex align-center justify-center" min-height="420">
      <MpEmptyState
        icon="layers"
        title="No default rules configured yet"
        description="Default merchandising lets you boost or bury products across every collection automatically — by tag, attribute, or stock level."
        action-label="Configure defaults"
        action-icon="plus"
      />
    </v-card>
  </div>
</template>
