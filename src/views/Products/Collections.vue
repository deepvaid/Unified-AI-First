<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const router = useRouter()

function goToMerchandising() {
  router.push({ name: 'MerchandisingHome', params: { accountId: route.params.accountId } })
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Collections"
      subtitle="Manage product collections and groupings"
    />
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex align-center justify-center">
      <MpEmptyState
        icon="folder"
        title="Collections live in Merchandising"
        description="Smart Collections — grouping, pinning, and rule-based merchandising — are managed in the Merchandising workspace for each sales channel."
        action-label="Open Merchandising"
        action-icon="arrow-right"
        class="py-10"
        @action="goToMerchandising"
      />
    </v-card>
  </div>
</template>
