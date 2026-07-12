<script setup lang="ts">
// Legacy equivalent of this page is Acquisition Forms (/acquisition/forms).
// Rather than maintain a parallel "legacy" list, point users to the real page.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)

function goToAcquisitionForms() {
  router.push({ name: 'AcquisitionForms', params: { accountId: accountId.value } })
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Signup Forms" subtitle="Signup forms have moved" />

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column justify-center">
      <MpEmptyState
        icon="arrow-right"
        title="Signup forms have moved"
        description="Signup forms now live under Acquisition Forms, with the same popup and embedded builder."
        action-label="Go to Acquisition Forms"
        action-icon="arrow-right"
        class="py-10"
        @action="goToAcquisitionForms"
      />
    </v-card>
  </div>
</template>
