<script setup lang="ts">
// Legacy: this account's plan does not include Surveys — /surveys renders an
// upsell page, not a working feature. Mirrored here as an honest empty state
// with real actions (view plans / talk to sales) rather than a dead end.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.accountId as string)

function viewPlans() {
  router.push({ name: 'Billing', params: { accountId: accountId.value } })
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Surveys" subtitle="Collect feedback and structured responses from your audience" />

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column justify-center">
      <MpEmptyState
        icon="sparkles"
        title="Not included in your plan"
        description="Surveys is part of Marketing Cloud. Upgrade your plan to build and send surveys to your audience."
        action-label="View plans"
        action-icon="arrow-right"
        @action="viewPlans"
      />
      <div class="d-flex justify-center pb-8">
        <v-btn variant="text" class="text-none" href="mailto:sales@maropost.com?subject=Surveys%20%E2%80%94%20Marketing%20Cloud%20upgrade">Talk to sales</v-btn>
      </div>
    </v-card>
  </div>
</template>
