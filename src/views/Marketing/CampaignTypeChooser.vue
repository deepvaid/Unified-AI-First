<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import { useCampaignsStore } from '@/stores/useCampaigns'

// UAT: /accounts/:id/campaigns/new — "Create New Campaign / Select your campaign type."
// Navigation chooser: tiles are real links via MpOptionCard's navigation mode
// (`to`, no `selected`), per the one chooser convention (wizard pass, 2026-08-30).
const route = useRoute()
const router = useRouter()
const store = useCampaignsStore()

const accountId = computed(() => String(route.params.accountId ?? '116000'))
const backTo = computed(() => ({ name: 'EmailCampaigns', params: { accountId: accountId.value } }))

const tiles = computed(() => [
  {
    id: 'email',
    title: 'Email campaign',
    description: 'One message to a chosen audience — send it now, schedule it, or make it recurring.',
    icon: 'mail',
    to: { name: 'CreateEmailCampaign', params: { accountId: accountId.value } },
  },
  {
    id: 'ab',
    title: 'A/B email campaign',
    description: 'Test subject lines, content, or senders across split groups; the winner sends to the rest.',
    icon: 'split',
    to: { name: 'CreateAbCampaign', params: { accountId: accountId.value } },
  },
])

// Deep links that used to land on the old single-route wizard (row edits,
// Da Vinci draft handoffs) carry ?id / ?source=davinci — forward them to the
// wizard that owns the draft's kind instead of showing the chooser.
onMounted(() => {
  const idParam = route.query.id
  const isDaVinci = route.query.source === 'davinci'
  if (!idParam && !isDaVinci) return
  const existing = idParam ? store.getCampaign(Number(idParam)) : undefined
  const target = existing?.config?.kind === 'ab_email' ? 'CreateAbCampaign' : 'CreateEmailCampaign'
  void router.replace({ name: target, params: { accountId: accountId.value }, query: route.query })
})
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <MpPageHeader
      title="Create a campaign"
      subtitle="Choose the campaign type."
      emphasis="prominent"
      :back-to="backTo"
    />
    <div class="ctc-grid">
      <MpOptionCard
        v-for="tile in tiles"
        :key="tile.id"
        :to="tile.to"
        :title="tile.title"
        :description="tile.description"
        :icon="tile.icon"
        :heading-level="2"
        class="h-100"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.ctc-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--mp-space-20);
  max-width: var(--mp-layout-contentMaxWidth);
}

@media (max-width: $mp-layout-breakpointCompact) {
  .ctc-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
