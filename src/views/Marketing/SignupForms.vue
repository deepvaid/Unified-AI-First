<script setup lang="ts">
// Legacy equivalent of this page is Acquisition Forms (/acquisition/forms).
// Rather than maintain a parallel "legacy" list, redirect straight there —
// the hub no longer links here, so anyone landing on this URL is following
// an old bookmark/link and should end up on the real page automatically.
// The card below is a flash-of-content fallback in case the redirect is
// interrupted (e.g. slow navigation, user cancels it).
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)

function goToAcquisitionForms() {
  router.replace({ name: 'AcquisitionForms', params: { accountId: accountId.value } })
}

onMounted(goToAcquisitionForms)
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
        @action="goToAcquisitionForms"
      />
    </v-card>
  </div>
</template>
